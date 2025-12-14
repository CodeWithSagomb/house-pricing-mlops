from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError
from house_pricing.api.schemas import HouseFeatures

# Payload valide pour les tests
VALID_PAYLOAD = {
    "MedInc": 3.5,
    "HouseAge": 30.0,
    "AveRooms": 5.0,
    "AveBedrms": 1.0,
    "Population": 800.0,
    "AveOccup": 3.0,
    "Latitude": 37.5,
    "Longitude": -122.0,
}


def test_health_check(client):
    """Vérifie que /health répond 200."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_metrics_endpoint(client):
    """Vérifie que /metrics expose des données Prometheus."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text


def test_metadata_endpoint(client, mock_model_service):
    """Vérifie que /model/metadata retourne les bonnes infos."""
    # Le mock returns "test_v1"
    response = client.get("/model/metadata")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["model_version"] == "test_v1"
    assert "model_name" in json_data


def test_root_endpoint(client):
    """Vérifie que / répond 200 et donne le lien vers la doc."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]
    assert "/docs" in response.json()["docs_url"]


def test_feedback_endpoint(client):
    """Vérifie que l'on peut poster du feedback."""
    payload = {"request_id": "1234-5678", "true_price": 500000.0, "comments": "Pas mal"}
    # Auth requise
    response = client.post(
        "/feedback", json=payload, headers={"X-API-KEY": "test_secret_key"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "received"


def test_predict_unauthorized_without_key(client):
    """Vérifie le rejet (403/401) si pas de clé API."""
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code in [401, 403]


def test_predict_unauthorized_with_wrong_key(client):
    """Vérifie le rejet (403) si mauvaise clé API."""
    response = client.post(
        "/predict", json=VALID_PAYLOAD, headers={"X-API-KEY": "wrong_key"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Clé API invalide"


def test_predict_success(client, mock_model_service):
    """Vérifie le succès (200) avec une prédiction correcte."""
    # Mock de la réponse du service
    mock_model_service.predict.return_value = (450000.0, "v1_test")

    response = client.post(
        "/predict",
        json=VALID_PAYLOAD,
        headers={"X-API-KEY": "test_secret_key"},  # Correspond au mock_settings
    )

    assert response.status_code == 200
    data = response.json()
    assert data["predicted_price"] == 450000.0
    assert data["model_version"] == "v1_test"
    assert "processing_time_ms" in data
    # Vérification Middleware Logging
    assert "X-Request-ID" in response.headers


def test_predict_service_not_loaded(client, mock_model_service):
    """Vérifie le code 503 quand le modèle n'est pas prêt."""
    # Le service lève l'exception métier
    mock_model_service.predict.side_effect = ModelNotLoadedError("Not ready")

    response = client.post(
        "/predict", json=VALID_PAYLOAD, headers={"X-API-KEY": "test_secret_key"}
    )

    assert response.status_code == 503
    assert "pas prêt" in response.json()["detail"]


def test_predict_internal_error(client, mock_model_service):
    """Vérifie le code 500 quand le modèle crashe."""
    # Le service lève l'exception métier
    mock_model_service.predict.side_effect = PredictionError("Math error")

    response = client.post(
        "/predict", json=VALID_PAYLOAD, headers={"X-API-KEY": "test_secret_key"}
    )

    assert response.status_code == 500
    assert "Math error" in response.json()["detail"]
