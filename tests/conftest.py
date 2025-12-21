import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Setup Environment BEFORE imports
os.environ.setdefault("API_KEY", "test_key")
os.environ.setdefault("MLFLOW_TRACKING_URI", "sqlite:///:memory:")

from house_pricing.api.app import app  # noqa: E402
from house_pricing.api.config import Settings  # noqa: E402
from house_pricing.api.service import ModelService, get_model_service  # noqa: E402


@pytest.fixture
def mock_settings():
    return Settings(
        API_KEY="test_secret_key",
        MLFLOW_TRACKING_URI="sqlite:///:memory:",
        MODEL_NAME="test_model",
        MODEL_ALIAS="test_alias",
    )


@pytest.fixture
def mock_model_service():
    """Crée un mock du ModelService pour éviter de charger les vrais modèles."""
    mock_service = MagicMock(spec=ModelService)
    # Par défaut, on simule un modèle chargé
    mock_service.model = MagicMock()
    mock_service.preprocessor = MagicMock()
    mock_service.model_version = "test_v1"
    # Mock get_metadata for the new endpoint
    mock_service.get_metadata.return_value = {
        "version": "test_v1",
        "name": "test_model",
        "source": "alias:champion",
        "run_id": "abc123",
        "loaded_at": "2025-01-01T00:00:00",
    }
    return mock_service


@pytest.fixture
def client(mock_model_service, mock_settings):
    """Client de test FastAPI avec le service mocké injecté."""

    # On patch la fonction get_model_service là où elle est définie pour que le lifespan l'utilise aussi
    # Et on patch les variables globales 'settings' qui ont déjà été initialisées
    with patch(
        "house_pricing.api.app.get_model_service", return_value=mock_model_service
    ), patch("house_pricing.api.app.settings", mock_settings):
        # On garde dependency_overrides pour les routes (double sécurité)
        app.dependency_overrides[get_model_service] = lambda: mock_model_service
        # app.dependency_overrides[get_settings] = lambda: mock_settings # Plus nécessaire avec le patch

        with TestClient(app) as test_client:
            yield test_client

        app.dependency_overrides.clear()
