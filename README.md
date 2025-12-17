# House Pricing MLOps Project

Ce projet met en œuvre une API "Enterprise Grade" pour prédire les prix de l'immobilier, basée sur les données California Housing. Il intègre les meilleures pratiques MLOps.

## Features

*   **API Robuste** : FastAPI, Dependency Injection, Gestion d'erreurs centralisée.
*   **MLOps** : MLflow (Tracking), DVC (Data Versioning), Prometheus (Monitoring).
*   **Tests** : Couverture complète (Unit & Integration) via Pytest.
*   **Observabilité** : Logs structurés (JSON), Métriques techniques, Métadonnées modèle.
*   **Automatisation** : Makefile, Pre-commit, CI/CD (GitHub Actions).

## Installation

```bash
# Installer les dépendances et configurer les hooks git
make install
```

## Démarrage Rapide (Local)

Lancer toute la stack (API, MLflow, MinIO, Postgres) :

```bash
make docker-up
```

Accès aux services :
*   **API Docs** : http://localhost:8000/docs
*   **MLflow UI** : http://localhost:5000
*   **MinIO Console** : http://localhost:9001
*   **Prometheus Metrics** : http://localhost:8000/metrics

## Développement

Les commandes standard sont définies dans le `Makefile` :

```bash
# Vérifier la qualité du code (Linting)
make lint

# Formater le code automatiquement
make format

# Lancer les tests
make test

# Lancer l'API en local (hors Docker) pour le dev rapide
make run
```

## Architecture & CI/CD

Ce projet utilise **GitHub Actions** pour l'intégration continue :
1.  **CI Pipeline** : S'exécute à chaque Pull Request (Lint, Test, Build Verification).
2.  **Infrastructure** : Orchestration locale via Docker Compose avec réseau partagé.

## Endpoints Principaux

*   `POST /predict` : Prédiction de prix (avec API Key).
*   `GET /health` : Statut du système.
*   `GET /model/metadata` : Information sur le modèle actif.
