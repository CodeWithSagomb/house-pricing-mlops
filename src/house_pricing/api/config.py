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

    # A/B Testing
    AB_TESTING_ENABLED: bool = False
    AB_TRAFFIC_SPLIT: float = 0.9  # 90% to champion, 10% to challenger
    AB_CHALLENGER_ALIAS: str = "challenger"

    # Environment (development/production)
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3001"  # Prod: https://your-app.vercel.app

    # JWT Secret (for auth)
    JWT_SECRET_KEY: str = "mlops-secret-key-change-in-production"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton pour la config (mis en cache)
@lru_cache
def get_settings():
    return Settings()
