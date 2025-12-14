from unittest.mock import MagicMock, patch

import pytest

from house_pricing.api.exceptions import ModelNotLoadedError
from house_pricing.api.service import ModelService


class TestModelService:
    def test_predict_raises_error_if_not_loaded(self):
        """Vérifie qu'une erreur est levée si on prédit sans modèle chargé."""
        service = ModelService()
        # On s'assure que c'est vide
        service.model = None
        service.preprocessor = None

        with pytest.raises(ModelNotLoadedError):
            service.predict({"LotArea": 5000})

    @patch("house_pricing.api.service.joblib.load")
    @patch("house_pricing.api.service.mlflow.sklearn.load_model")
    @patch("house_pricing.api.service.mlflow.MlflowClient")
    def test_load_artifacts_calls_mlflow(
        self, mock_client, mock_load_model, mock_joblib
    ):
        """Vérifie que load_artifacts appelle bien MLflow et joblib."""
        # Setup des Mocks
        mock_mv = MagicMock()
        mock_mv.version = "123"
        mock_client.return_value.get_model_version_by_alias.return_value = mock_mv

        service = ModelService()
        service.load_artifacts()

        # Assertions
        mock_joblib.assert_called_once()
        mock_load_model.assert_called_once()
        assert service.model_version == "123"
