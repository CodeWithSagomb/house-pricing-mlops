# src/house_pricing/api/app.py
import datetime
import logging
import time
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from prometheus_fastapi_instrumentator import Instrumentator

from house_pricing.api.ab_testing import get_ab_router, init_ab_router
from house_pricing.api.auth import (
    PredictionHistoryItem,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_user_predictions,
    register_user,
)
from house_pricing.api.config import get_settings
from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError
from house_pricing.api.middleware import RequestIDMiddleware, setup_logging
from house_pricing.api.schemas import (
    BatchPredictionItem,
    BatchPredictionRequest,
    BatchPredictionResponse,
    Feedback,
    HouseFeatures,
    PredictionLog,
    PredictionResponse,
    RootResponse,
)
from house_pricing.api.service import ModelService, get_model_service

# Drift detector - optional (Evidently can have import issues)
try:
    from house_pricing.monitoring.drift_detector import (
        get_drift_detector,
        init_drift_detector,
    )

    DRIFT_ENABLED = True
except ImportError as e:
    import logging as _log

    _log.warning(f"⚠️ Drift monitoring disabled (import error): {e}")
    DRIFT_ENABLED = False

    def get_drift_detector():
        return None

    def init_drift_detector(ref):
        pass


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
    # Au demarrage : on charge le modele via le service
    try:
        service = get_model_service()
        service.load_artifacts()

        # Initialize A/B testing if enabled
        settings = get_settings()
        if settings.AB_TESTING_ENABLED:
            logger.info("A/B Testing enabled, loading challenger model...")
            challenger_model, challenger_prep, challenger_ver = (
                service.load_challenger_artifacts(settings.AB_CHALLENGER_ALIAS)
            )
            init_ab_router(
                champion_model=service.model,
                champion_preprocessor=service.preprocessor,
                champion_version=service.metadata.version,
                challenger_model=challenger_model,
                challenger_preprocessor=challenger_prep,
                challenger_version=challenger_ver,
            )
        else:
            # Initialize with champion only
            init_ab_router(
                champion_model=service.model,
                champion_preprocessor=service.preprocessor,
                champion_version=service.metadata.version,
            )

        # Initialiser le drift detector avec les donnees de reference BRUTES
        try:
            import pandas as pd

            reference_data = pd.read_csv("data/raw/housing.csv")
            init_drift_detector(reference_data)
            logger.info("DriftDetector initialise avec donnees brutes (housing.csv).")
        except Exception as e:
            logger.warning(f"DriftDetector non initialise: {e}")
    except Exception as e:
        logger.error(f"Crash au demarrage : {e}")
        raise e
    yield
    # A l'arret
    logger.info("Arret de l'API")


# --- OPENAPI TAGS ---
tags_metadata = [
    {
        "name": "Infrastructure",
        "description": "Endpoints de base et monitoring système.",
    },
    {"name": "Model Operations", "description": "Inférence et gestion du modèle ML."},
    {"name": "Data Analytics", "description": "Statistiques et analyse des données."},
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

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# --- AUTH ROUTES ---


@app.post("/auth/register", response_model=Token, tags=["Authentication"])
async def auth_register(user_data: UserCreate):
    """
    Register a new user account.

    Returns a JWT token for immediate authentication.
    """
    user = register_user(user_data.email, user_data.name, user_data.password)
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
        ),
    }


@app.post("/auth/login", response_model=Token, tags=["Authentication"])
async def auth_login(credentials: UserLogin):
    """
    Authenticate user and return JWT token.
    """
    user = authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
        ),
    }


@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def auth_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"],
    )


@app.get(
    "/auth/history", response_model=list[PredictionHistoryItem], tags=["Authentication"]
)
async def auth_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """
    Get current user's prediction history.
    """
    predictions = get_user_predictions(current_user["id"], limit=limit)
    return [
        PredictionHistoryItem(
            id=p["id"],
            predicted_price=p["predicted_price"],
            model_version=p["model_version"],
            features=p["features"],
            created_at=p["created_at"],
        )
        for p in predictions
    ]


@app.get("/model/feature-importance", tags=["Model Operations"])
def get_feature_importance(service: ModelService = Depends(get_model_service)):
    """
    Get feature importance from the current model.

    Returns importance scores for each feature, sorted by importance.
    Supports tree-based models (RandomForest, GradientBoosting) and linear models.
    """
    return service.get_feature_importance()


@app.get("/data/stats", tags=["Data Analytics"])
def data_statistics():
    """
    Retourne les statistiques descriptives des données d'entraînement.
    Utile pour comprendre la distribution des features.
    """
    import os

    import pandas as pd

    train_path = "data/processed/train.csv"

    if not os.path.exists(train_path):
        raise HTTPException(
            status_code=404,
            detail="Training data not found. Run 'make dataops' first.",
        )

    df = pd.read_csv(train_path)

    # Statistiques descriptives
    stats = df.describe().to_dict()

    # Informations supplémentaires
    info = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "missing_values": df.isnull().sum().to_dict(),
        "target_column": "MedHouseVal",
    }

    return {
        "info": info,
        "statistics": stats,
    }


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

    # 3. Drift Monitoring - Add prediction to buffer
    drift_detector = get_drift_detector()
    if drift_detector:
        drift_detector.add_prediction(
            features=features.model_dump(),
            prediction=price,
            true_value=None,  # No ground truth at prediction time
        )

    # 4. Préparation du Log (Tâche de fond)
    log_entry = PredictionLog(
        timestamp=datetime.datetime.now(),
        inputs=features,
        output=price,
        model_version=version,
    )
    # On ajoute la tâche à la file d'attente. Elle s'exécutera APRES le return.
    background_tasks.add_task(log_prediction_to_db, log_entry)

    # 5. Réponse immédiate
    return {
        "predicted_price": price,
        "model_version": version,
        "processing_time_ms": round(process_time, 2),
    }


@app.post(
    "/predict/batch", response_model=BatchPredictionResponse, tags=["Model Operations"]
)
async def predict_batch_endpoint(
    request: BatchPredictionRequest,
    api_key: str = Depends(verify_api_key),
    service: ModelService = Depends(get_model_service),
):
    """
    Prédiction en batch (max 100 éléments).
    Utile pour traiter plusieurs maisons en une seule requête.
    """
    start_time = time.time()

    results = []
    for idx, features in enumerate(request.predictions):
        price, version = service.predict(features.model_dump())
        results.append(BatchPredictionItem(index=idx, predicted_price=price))

    process_time = (time.time() - start_time) * 1000

    return BatchPredictionResponse(
        results=results,
        total=len(results),
        model_version=version,
        processing_time_ms=round(process_time, 2),
    )


@app.get("/model/metadata", tags=["Model Operations"])
def model_metadata(service: ModelService = Depends(get_model_service)):
    """Retourne les métadonnées complètes du modèle chargé."""
    metadata = service.get_metadata()
    return {
        "model_name": settings.MODEL_NAME,
        "configured_alias": settings.MODEL_ALIAS,
        **metadata,
    }


@app.post("/model/reload", tags=["Model Operations"])
async def reload_model(
    api_key: str = Depends(verify_api_key),
    service: ModelService = Depends(get_model_service),
):
    """
    Hot reload: Recharge le modèle depuis MLflow sans restart.
    Utile après promotion d'un nouveau modèle @champion.
    """
    logger.info("🔄 Hot reload requested...")
    old_version = service.model_version

    try:
        service.load_artifacts()
        new_version = service.model_version

        if old_version != new_version:
            logger.info(f"✅ Model updated: v{old_version} → v{new_version}")
        else:
            logger.info(f"✅ Model reloaded (same version: v{new_version})")

        return {
            "status": "reloaded",
            "previous_version": old_version,
            "current_version": new_version,
            "metadata": service.get_metadata(),
        }
    except Exception as e:
        logger.error(f"❌ Reload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reload failed: {e}")


@app.post("/feedback", tags=["Model Operations"])
async def feedback_endpoint(feedback: Feedback, api_key: str = Depends(verify_api_key)):
    """Reçoit le prix réel pour monitorer le drift."""
    logger.info(
        f"🎯 [Feedback] RequestID={feedback.request_id} | TruePrice={feedback.true_price}"
    )

    # Intégration Drift Monitoring (Axe 4)
    drift_result = None
    drift_detector = get_drift_detector()
    if drift_detector and feedback.features and feedback.prediction:
        drift_result = drift_detector.add_prediction(
            features=feedback.features.model_dump(),
            prediction=feedback.prediction,
            true_value=feedback.true_price,
        )
        if drift_result and drift_result.get("drift_detected"):
            logger.warning(f"🚨 DRIFT ALERT: {drift_result}")

    return {
        "status": "received",
        "drift_analysis": drift_result,
    }


@app.get("/monitoring/drift-status", tags=["Infrastructure"])
async def drift_status():
    """
    Returns current drift detection status.
    Used by Airflow sensor for automatic retraining trigger.
    """
    drift_detector = get_drift_detector()
    if not drift_detector:
        return {
            "enabled": False,
            "drift_detected": False,
            "status": "drift_monitoring_disabled",
            "message": "DriftDetector not initialized",
        }

    result = drift_detector.last_drift_result.copy()
    result["enabled"] = drift_detector.enabled
    result["buffer_size"] = len(drift_detector.production_buffer)
    result["buffer_threshold"] = drift_detector.buffer_size
    return result


@app.get("/ab/status", tags=["Infrastructure"])
async def ab_testing_status():
    """
    Returns current A/B testing configuration and status.
    Used for monitoring traffic distribution between champion and challenger.
    """
    ab_router = get_ab_router()
    return ab_router.get_status()
