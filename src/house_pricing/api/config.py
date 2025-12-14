# src/house_pricing/api/config.py
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API Info
    API_NAME: str = "House Pricing API (Enterprise)"
    API_VERSION: str = "1.0.0"

    # Security
    API_KEY: str  # Sera lu depuis .env (Obligatoire)

    # MLflow
    MLFLOW_TRACKING_URI: str
    MODEL_NAME: str = "HousePricing_random_forest"
    MODEL_ALIAS: str = "champion"  # On vise le tag @champion

    # Paths
    PREPROCESSOR_PATH: str = "data/processed/preprocessor.pkl"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton pour la config (mis en cache)
@lru_cache
def get_settings():
    return Settings()
