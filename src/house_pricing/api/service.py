import logging
import time
from functools import lru_cache

import joblib
import mlflow.sklearn
import pandas as pd

from house_pricing.api.config import get_settings
from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError

settings = get_settings()
logger = logging.getLogger("api.service")


class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.model_version = "unknown"

    def load_artifacts(self):
        """Charge le modèle et le préprocesseur."""
        logger.info("🔌 Chargement des artefacts ML...")

        # 1. Preprocessor
        self.preprocessor = joblib.load(settings.PREPROCESSOR_PATH)

        # 2. MLflow Model
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        model_uri = f"models:/{settings.MODEL_NAME}@{settings.MODEL_ALIAS}"

        self.model = mlflow.sklearn.load_model(model_uri)

        # Récupérer le numéro de version réel
        client = mlflow.MlflowClient()
        mv = client.get_model_version_by_alias(
            settings.MODEL_NAME, settings.MODEL_ALIAS
        )
        self.model_version = str(mv.version)

        logger.info(f"✅ Modèle v{self.model_version} chargé avec succès.")

    def predict(self, features: dict) -> tuple[float, str]:
        """Effectue la prédiction."""
        if not self.model or not self.preprocessor:
            raise ModelNotLoadedError("Le modèle n'est pas chargé.")

        try:
            # Conversion dict -> DataFrame
            df = pd.DataFrame([features])

            # Transform & Predict
            X_processed = self.preprocessor.transform(df)
            prediction = self.model.predict(X_processed)

            return float(prediction[0]), str(self.model_version)
        except Exception as e:
            logger.error(f"Erreur prédiction: {e}")
            raise PredictionError(f"Erreur interne du modèle: {e}")


@lru_cache
def get_model_service():
    """Fournit l'instance unique (Singleton) du service ML."""
    return ModelService()
