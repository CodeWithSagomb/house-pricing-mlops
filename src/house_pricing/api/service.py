import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from functools import lru_cache

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
from mlflow.exceptions import MlflowException

from house_pricing.api.config import get_settings
from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError

logger = logging.getLogger("api.service")


@dataclass
class ModelMetadata:
    """Metadata about the loaded model."""

    version: str = "unknown"
    name: str = ""
    source: str = "unknown"  # "alias" or "latest"
    run_id: str = ""
    loaded_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "name": self.name,
            "source": self.source,
            "run_id": self.run_id,
            "loaded_at": self.loaded_at.isoformat(),
        }


class ModelService:
    """
    Service for ML model inference with intelligent loading from MLflow.

    Features:
    - Fallback: alias → latest version
    - Retry with exponential backoff
    - Hot reload capability
    """

    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.metadata = ModelMetadata()

    @property
    def model_version(self) -> str:
        """Backward compatibility."""
        return self.metadata.version

    def load_artifacts(self) -> None:
        """
        Load model and preprocessor from MLflow with intelligent fallback.

        Strategy:
        1. Try to load via alias (e.g., @champion)
        2. If alias not found, fallback to latest version
        3. Retry with exponential backoff on transient errors
        """
        settings = get_settings()
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        client = mlflow.MlflowClient()

        logger.info("🔌 Loading ML artifacts from MLflow...")

        # Resolve model version with retry
        mv = self._resolve_model_version(client, settings)

        if mv is None:
            raise ModelNotLoadedError(f"No model found: {settings.MODEL_NAME}")

        # Update metadata
        self.metadata = ModelMetadata(
            version=str(mv.version),
            name=settings.MODEL_NAME,
            source=mv._source,  # Will be set by _resolve_model_version
            run_id=mv.run_id,
            loaded_at=datetime.now(),
        )

        logger.info(
            f"🔍 Model resolved: {settings.MODEL_NAME} v{self.metadata.version} "
            f"(source: {self.metadata.source}, run: {mv.run_id[:8]})"
        )

        # Load preprocessor with retry
        self._load_preprocessor_with_retry(client, mv.run_id, settings)

        # Load model with retry
        self._load_model_with_retry(settings)

        logger.info(f"✅ Model v{self.metadata.version} loaded successfully.")

    def _resolve_model_version(self, client, settings):
        """
        Resolve model version with fallback strategy.

        1. Try alias (e.g., @champion)
        2. Fallback to latest version
        """
        model_name = settings.MODEL_NAME
        alias = settings.MODEL_ALIAS

        # Strategy 1: Try alias
        try:
            mv = client.get_model_version_by_alias(model_name, alias)
            mv._source = f"alias:{alias}"
            logger.info(f"✅ Using alias @{alias} → version {mv.version}")
            return mv
        except MlflowException as e:
            logger.warning(f"⚠️ Alias @{alias} not found: {e}")

        # Strategy 2: Fallback to latest version
        logger.info("📦 Falling back to latest version...")
        try:
            versions = client.search_model_versions(f"name='{model_name}'")
            if not versions:
                logger.error(f"❌ No versions found for model: {model_name}")
                return None

            # Get the highest version number
            latest = max(versions, key=lambda v: int(v.version))
            latest._source = "latest"
            logger.info(f"✅ Using latest version: {latest.version}")
            return latest
        except MlflowException as e:
            logger.error(f"❌ Failed to get model versions: {e}")
            return None

    def _load_preprocessor_with_retry(self, client, run_id: str, settings) -> None:
        """Load preprocessor with retry logic."""
        for attempt in range(self.MAX_RETRIES):
            try:
                local_path = mlflow.artifacts.download_artifacts(
                    run_id=run_id,
                    artifact_path="preprocessor/preprocessor.pkl",
                    dst_path="/tmp",
                )
                self.preprocessor = joblib.load(local_path)
                logger.info("✅ Preprocessor loaded from MLflow.")
                return
            except Exception as e:
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.RETRY_DELAY * (2**attempt)
                    logger.warning(
                        f"⚠️ Preprocessor load failed (attempt {attempt + 1}), "
                        f"retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                else:
                    logger.warning(f"⚠️ Failed to load preprocessor from MLflow: {e}")

        # Fallback to local file
        logger.warning("⚠️ Using local preprocessor fallback...")
        try:
            self.preprocessor = joblib.load(settings.PREPROCESSOR_PATH)
            logger.info("✅ Preprocessor loaded from local fallback.")
        except Exception as e:
            raise ModelNotLoadedError(f"Cannot load preprocessor: {e}")

    def _load_model_with_retry(self, settings) -> None:
        """Load model with retry logic."""
        model_uri = f"models:/{settings.MODEL_NAME}@{settings.MODEL_ALIAS}"

        # If alias failed, use version number
        if self.metadata.source == "latest":
            model_uri = f"models:/{settings.MODEL_NAME}/{self.metadata.version}"

        for attempt in range(self.MAX_RETRIES):
            try:
                self.model = mlflow.sklearn.load_model(model_uri)
                logger.info(f"✅ Model loaded from: {model_uri}")
                return
            except Exception as e:
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.RETRY_DELAY * (2**attempt)
                    logger.warning(
                        f"⚠️ Model load failed (attempt {attempt + 1}), "
                        f"retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                else:
                    raise ModelNotLoadedError(f"Cannot load model: {e}")

    def predict(self, features: dict) -> tuple[float, str]:
        """Perform prediction."""
        if not self.model or not self.preprocessor:
            raise ModelNotLoadedError("Model not loaded.")

        try:
            df = pd.DataFrame([features])
            X_processed = self.preprocessor.transform(df)
            prediction = self.model.predict(X_processed)
            return float(prediction[0]), str(self.metadata.version)
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise PredictionError(f"Model inference error: {e}")

    def get_metadata(self) -> dict:
        """Return model metadata."""
        return self.metadata.to_dict()


@lru_cache
def get_model_service() -> ModelService:
    """Singleton ModelService instance."""
    return ModelService()
