# src/house_pricing/api/config.py
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API Info
    API_NAME: str = "House Pricing API (Enterprise)"
    API_VERSION: str = "1.0.0"

    # Security
    API_KEY: str = "demo-key"  # Default for HF Spaces, override in production

    # Model Source: 'mlflow' or 'local'
    MODEL_SOURCE: str = "mlflow"  # Set to 'local' for HF Spaces

    # MLflow (used when MODEL_SOURCE='mlflow')
    MLFLOW_TRACKING_URI: str = ""
    MODEL_NAME: str = "HousePricing_random_forest"
    MODEL_ALIAS: str = "champion"  # On vise le tag @champion

    # Local paths (used when MODEL_SOURCE='local')
    MODEL_PATH: str = "models/production/model.joblib"
    PREPROCESSOR_PATH: str = "data/processed/preprocessor.pkl"

    # A/B Testing
    AB_TESTING_ENABLED: bool = False
    AB_TRAFFIC_SPLIT: float = 0.9  # 90% to champion, 10% to challenger
    AB_CHALLENGER_ALIAS: str = "challenger"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton pour la config (mis en cache)
@lru_cache
def get_settings():
    return Settings()
