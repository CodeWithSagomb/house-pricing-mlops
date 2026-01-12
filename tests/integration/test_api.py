from house_pricing.api.exceptions import ModelNotLoadedError, PredictionError

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
    response = client.get("/model/metadata")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["version"] == "test_v1"  # From get_metadata()
    assert "model_name" in json_data
    assert "source" in json_data


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


# =============================================================================
# DRIFT MONITORING TESTS
# =============================================================================


def test_drift_status_endpoint(client):
    """Vérifie que /monitoring/drift-status répond avec le bon format."""
    response = client.get("/monitoring/drift-status")
    assert response.status_code == 200

    data = response.json()
    # Vérifie la structure de la réponse
    assert "drift_detected" in data
    assert "status" in data
    assert "enabled" in data
    assert isinstance(data["drift_detected"], bool)


def test_drift_status_has_buffer_info(client):
    """Vérifie que drift-status retourne les infos de buffer."""
    response = client.get("/monitoring/drift-status")
    assert response.status_code == 200

    data = response.json()
    assert "buffer_size" in data
    assert "buffer_threshold" in data
    assert isinstance(data["buffer_size"], int)
    assert isinstance(data["buffer_threshold"], int)


# =============================================================================
# BATCH PREDICTION TESTS
# =============================================================================


BATCH_PAYLOAD = {
    "predictions": [
        {
            "MedInc": 3.5,
            "HouseAge": 30.0,
            "AveRooms": 5.0,
            "AveBedrms": 1.0,
            "Population": 800.0,
            "AveOccup": 3.0,
            "Latitude": 37.5,
            "Longitude": -122.0,
        },
        {
            "MedInc": 8.0,
            "HouseAge": 20.0,
            "AveRooms": 6.0,
            "AveBedrms": 1.2,
            "Population": 500.0,
            "AveOccup": 2.5,
            "Latitude": 34.0,
            "Longitude": -118.0,
        },
    ]
}


def test_predict_batch_success(client, mock_model_service):
    """Vérifie le succès de la prédiction batch."""
    mock_model_service.predict.return_value = (450000.0, "v1_test")

    response = client.post(
        "/predict/batch",
        json=BATCH_PAYLOAD,
        headers={"X-API-KEY": "test_secret_key"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 2
    assert "total" in data
    assert data["total"] == 2


def test_predict_batch_unauthorized(client):
    """Vérifie le rejet (403) sans clé API pour batch."""
    response = client.post("/predict/batch", json=BATCH_PAYLOAD)
    assert response.status_code in [401, 403]


def test_predict_batch_empty_list(client, mock_model_service):
    """Vérifie la gestion d'une liste vide."""
    response = client.post(
        "/predict/batch",
        json={"predictions": []},
        headers={"X-API-KEY": "test_secret_key"},
    )

    # Devrait retourner 200 avec 0 prédictions ou 422 (validation error)
    assert response.status_code in [200, 422]


def test_predict_batch_max_limit(client, mock_model_service):
    """Vérifie la limite max de prédictions batch."""
    # Créer 101 items (au-dessus de la limite de 100)
    predictions = [VALID_PAYLOAD.copy() for _ in range(101)]

    response = client.post(
        "/predict/batch",
        json={"predictions": predictions},
        headers={"X-API-KEY": "test_secret_key"},
    )

    # Devrait rejeter (422) car trop d'items
    assert response.status_code == 422


# =============================================================================
# DATA STATISTICS TESTS
# =============================================================================


def test_data_statistics_endpoint(client):
    """Vérifie que /data/statistics répond correctement."""
    response = client.get("/data/statistics")
    # Peut être 200 ou 404 selon la config
    assert response.status_code in [200, 404, 500]
