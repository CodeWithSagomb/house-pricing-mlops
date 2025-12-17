# src/house_pricing/api/app.py
import datetime
import logging
import time
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Security
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from prometheus_fastapi_instrumentator import Instrumentator

from house_pricing.api.config import get_settings
from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError
from house_pricing.api.middleware import RequestIDMiddleware, setup_logging
from house_pricing.api.schemas import (
    Feedback,
    HouseFeatures,
    PredictionLog,
    PredictionResponse,
    RootResponse,
)
from house_pricing.api.service import ModelService, get_model_service

# Setup
settings = get_settings()
# Configuration du Logging JSON
setup_logging()
logger = logging.getLogger("api")


# --- BACKGROUND TASK ---
def log_prediction_to_db(log_entry: PredictionLog):
    """
    Simule une écriture en base de données ou l'envoi vers Evidently.
    Cette fonction tourne APRÈS que la réponse soit envoyée au client.
    """
    # Simulation d'une latence réseau (ex: écriture Postgres lente)
    time.sleep(0.1)
    logger.info(f"📝 [Background] Log sauvegardé: {log_entry.model_dump_json()}")


# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage : on charge le modèle via le service
    try:
        get_model_service().load_artifacts()
    except Exception as e:
        logger.error(f"Crash au démarrage : {e}")
        raise e
    yield
    # À l'arrêt
    logger.info("Arrêt de l'API")


# --- OPENAPI TAGS ---
tags_metadata = [
    {
        "name": "Infrastructure",
        "description": "Endpoints de base et monitoring système.",
    },
    {"name": "Model Operations", "description": "Inférence et gestion du modèle ML."},
    {"name": "Observability", "description": "Métriques techniques."},
]

app = FastAPI(
    title=settings.API_NAME,
    version=settings.API_VERSION,
    lifespan=lifespan,
    openapi_tags=tags_metadata,
)

# Setup Prometheus
# Setup Prometheus
Instrumentator().instrument(app).expose(
    app, include_in_schema=True, tags=["Observability"]
)

# Setup Middleware
app.add_middleware(RequestIDMiddleware)


@app.exception_handler(ModelNotLoadedError)
async def model_not_loaded_handler(request: Request, exc: ModelNotLoadedError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Le service de prédiction n'est pas prêt. Veuillez réessayer plus tard."
        },
    )


@app.exception_handler(PredictionError)
async def prediction_error_handler(request: Request, exc: PredictionError):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erreur de prédiction: {str(exc)}"},
    )


# --- SECURITY ---
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=True)


async def verify_api_key(key: str = Security(api_key_header)):
    if key != settings.API_KEY:
        raise HTTPException(status_code=403, detail="Clé API invalide")
    return key


# --- ROUTES ---
# --- ROUTES ---


@app.get("/", response_model=RootResponse, tags=["Infrastructure"])
def root():
    return {"message": f"Welcome to {settings.API_NAME}", "docs_url": "/docs"}


@app.get("/health", tags=["Infrastructure"])
def health(service: ModelService = Depends(get_model_service)):
    return {"status": "ok", "model_version": service.model_version}


@app.post("/predict", response_model=PredictionResponse, tags=["Model Operations"])
async def predict_endpoint(
    features: HouseFeatures,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key),
    service: ModelService = Depends(get_model_service),
):
    start_time = time.time()

    # 1. Prédiction (Rapide)
    # On laisse les exceptions remonter pour être gérées par les handlers globaux (503, 500, etc.)
    price, version = service.predict(features.model_dump())

    # 2. Calcul du temps de traitement
    process_time = (time.time() - start_time) * 1000

    # 3. Préparation du Log (Tâche de fond)
    log_entry = PredictionLog(
        timestamp=datetime.datetime.now(),
        inputs=features,
        output=price,
        model_version=version,
    )
    # On ajoute la tâche à la file d'attente. Elle s'exécutera APRES le return.
    background_tasks.add_task(log_prediction_to_db, log_entry)

    # 4. Réponse immédiate
    return {
        "predicted_price": price,
        "model_version": version,
        "processing_time_ms": round(process_time, 2),
    }


@app.get("/model/metadata", tags=["Model Operations"])
def model_metadata(service: ModelService = Depends(get_model_service)):
    """Retourne les métadonnées du modèle chargé."""
    return {
        "model_name": settings.MODEL_NAME,
        "model_alias": settings.MODEL_ALIAS,
        "model_version": service.model_version,
        # On pourrait ajouter la date de chargement etc.
    }


@app.post("/feedback", tags=["Model Operations"])
async def feedback_endpoint(feedback: Feedback, api_key: str = Depends(verify_api_key)):
    """Reçoit le prix réel pour monitorer le drift."""
    # Dans la vraie vie : stocker dans DB ou envoyer à Evidently
    logger.info(
        f"🎯 [Feedback] RequestID={feedback.request_id} | TruePrice={feedback.true_price}"
    )
    return {"status": "received"}
