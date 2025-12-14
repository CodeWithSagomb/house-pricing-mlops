# House Pricing MLOps Project

Ce projet met en œuvre une API "Enterprise Grade" pour prédire les prix de l'immobilier, basée sur les données California Housing. Il intègre les meilleures pratiques MLOps.

## 🚀 Features

*   **API Robuste** : FastAPI, Dependency Injection, Gestion d'erreurs centralisée.
*   **MLOps** : MLflow (Tracking), DVC (Data Versioning), Prometheus (Monitoring).
*   **Tests** : Couverture complète (Unit & Integration) via Pytest.
*   **Observabilité** : Logs structurés (JSON), Métriques techniques, Métadonnées modèle.
*   **Feedback Loop** : Capture de la vérité terrain pour détection de drift.

## 🛠️ Installation

```bash
# Installer les dépendances
poetry install

# Lancer l'environnement Docker (Postgres, MinIO)
docker compose up -d
```

## 🏃‍♂️ Démarrage

### API
```bash
# Lancer le serveur API (avec rechargement auto)
poetry run uvicorn house_pricing.api.app:app --host 0.0.0.0 --port 8000 --reload
```

### Documentation Swagger
Une fois l'API lancée, accédez à la documentation interactive :
*   http://localhost:8000/docs

## 📚 Endpoints

### Infrastructure
*   `GET /` : Accueil & Lien vers la doc.
*   `GET /health` : Statut du service.

### Model Operations
*   `POST /predict` : Prédiction de prix (Nécessite API Key).
*   `GET /model/metadata` : Infos sur le modèle chargé (Version, Alias).
*   `POST /feedback` : Envoi du prix réel pour monitoring.

### Observability
*   `GET /metrics` : Métriques Prometheus.

## ✅ Tests

```bash
# Lancer la suite de tests
poetry run pytest tests/
```
