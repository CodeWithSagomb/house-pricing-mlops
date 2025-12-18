import logging
from functools import lru_cache

import joblib
import mlflow.sklearn
import pandas as pd

from house_pricing.api.config import get_settings
from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError

logger = logging.getLogger("api.service")


class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.model_version = "unknown"

    def load_artifacts(self):
        """Charge le modèle et le préprocesseur."""
        logger.info("🔌 Chargement des artefacts ML...")

        # 1. Setup MLflow
        settings = get_settings()
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        client = mlflow.MlflowClient()

        # 2. Résolution de l'alias (ex: "champion") -> Version réelle (ex: "v2")
        mv = client.get_model_version_by_alias(
            settings.MODEL_NAME, settings.MODEL_ALIAS
        )
        self.model_version = str(mv.version)
        run_id = mv.run_id

        logger.info(
            f"🔍 Modèle identifié : {settings.MODEL_NAME} version {self.model_version} (Run ID: {run_id})"
        )

        # 3. Téléchargement & Chargement du Preprocessor (Dynamique)
        try:
            # On télécharge l'artifact "preprocessor/preprocessor.pkl" depuis le run associé au modèle
            local_path = mlflow.artifacts.download_artifacts(
                run_id=run_id,
                artifact_path="preprocessor/preprocessor.pkl",
                dst_path="/tmp",  # On télécharge dans /tmp
            )
            self.preprocessor = joblib.load(local_path)
            logger.info("✅ Preprocessor téléchargé et chargé depuis MLflow.")
        except Exception as e:
            logger.error(
                f"❌ Impossible de charger le preprocessor depuis MLflow : {e}"
            )
            # Fallback local (optionnel, pour dev)
            logger.warning("⚠️ Tentative de fallback local...")
            self.preprocessor = joblib.load(settings.PREPROCESSOR_PATH)

        # 4. Chargement du Modèle
        model_uri = f"models:/{settings.MODEL_NAME}@{settings.MODEL_ALIAS}"
        self.model = mlflow.sklearn.load_model(model_uri)

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
