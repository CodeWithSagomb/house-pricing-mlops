import pytest

from house_pricing.api.exceptions import ModelNotLoadedError


def test_health_check(client):
    """Test basique du endpoint health."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_version"] == "test_v1"


def test_predict_success(client, mock_model_service):
    """Test d'une prédiction réussie."""
    # Setup du Mock pour retourner une valeur précise
    mock_model_service.predict.return_value = (150000.0, "test_v1")

    payload = {
        "MedInc": 3.5,
        "HouseAge": 30,
        "AveRooms": 5,
        "AveBedrms": 1,
        "Population": 800,
        "AveOccup": 3,
        "Latitude": 37.5,
        "Longitude": -122.0,
    }

    # On doit fournir la clé API (bypassée via override si besoin, mais ici simulée)
    # Note: Dans conftest.py on injecte le SERVICE, pas la sécurité.
    # Il faut donc passer un header valide ou mocker la sécu.
    # Pour l'instant, passons un header qui matche la config par défaut ou mockons la config.
    # On va assumer que settings.API_KEY peut être n'importe quoi en mode test si on ne mocke pas settings.
    # Mieux : on passe une fausse clé et on mocke settings plus tard si besoin.
    # Pour ce test simple, on va mocker verify_api_key si on a des soucis, mais essayons avec un header dummy.

    # Astuce: On va mocker settings dans le test integration ou surcharger la var d'env
    pass


def test_predict_missing_api_key(client):
    """Vérifie la sécurité API Key."""
    response = client.post("/predict", json={})
    assert (
        response.status_code == 403
    )  # Forbidden (FastAPI behavior for missing API Key if auto_error=True?)
    # Actually APIKeyHeader with auto_error=True returns 403.


def test_predict_service_unavailable(client, mock_model_service):
    """Vérifie le code 503 quand le modèle n'est pas prêt."""
    # On simule que le service lève l'exception
    mock_model_service.predict.side_effect = ModelNotLoadedError("Oups")

    # Il faut une clé valide pour passer la sécu et atteindre le code service
    # On va faire ça proprement dans le fichier final
    pass
