PRD: Enterprise House Pricing Engine (M-HPE)
Version : 1.0.0
Type : End-to-End MLOps Platform
Lead Architect : cSagombaye
Infrastructure : Local Cloud Simulation (Docker Compose / MinIO / Airflow)
Target SLA : < 200ms latency, 99.9% availability during retraining.

1. Executive Summary
Le projet M-HPE (Modular House Pricing Engine) vise à simuler l'infrastructure de pricing d'une "Big Tech" immobilière (type Zillow/SeLoger).
Contrairement à un projet de Data Science classique, la valeur ne réside pas dans la complexité mathématique du modèle, mais dans la résilience du pipeline de livraison. Le système doit être capable d'ingérer, nettoyer, entraîner, valider, déployer et monitorer des modèles de régression sans intervention humaine manuelle.

2. Project Components (Functional Requirements)
 Component 1: Data Pipeline & Preprocessing (The Foundation)
Ingestion : Scripts modulaires (src/data/ingestion.py) simulant l'arrivée de données brutes (batchs temporels).
Validation (Quality Gate 1) :
Utilisation de Pydantic et Pandas pour rejeter les données corrompues (ex: surface < 0, prix manquant).
Arrêt immédiat du pipeline si la qualité des données est < 95%.
Versioning :
DVC (Data Version Control) tracke les fichiers .csv et .parquet.
Storage Backend : MinIO (simulation S3 local) ou dossier local partagé.
Feature Engineering : Pipeline Scikit-learn sauvegardé (Pickle) pour garantir que les transformations (Scaling, One-Hot) sont identiques en Training et en Serving.

Component 2: Model Development (The Factory)
Design Pattern : Utilisation du Strategy Pattern pour l'interchangeabilité des algorithmes.
V1 : Scikit-learn (Linear Regression / Random Forest).
V2 : PyTorch (Préparation de l'architecture pour le futur).
Experiment Tracking :
MLflow capture : Paramètres, Métriques (RMSE, MAE), Dataset Commit Hash (Git+DVC), et l'artefact du modèle.
Tuning : Implémentation d'une GridSearch configurable via config/model.yaml (pas de hardcoding).
Registry : Le meilleur modèle est promu au statut "Staging" dans MLflow Model Registry.

Component 3: CI/CD Pipeline (The Guardrails)
Trigger : GitHub Actions se déclenche à chaque push sur main ou develop.
Automated Tests (Quality Gate 2) :
Unit Tests : Vérifient les fonctions de nettoyage.
Integration Tests : Vérifient que le pipeline train -> predict ne crashe pas.
Continuous Deployment (CD) :
Si les tests passent : Build de l'image Docker app:latest.
Push (simulé) vers un Registry.

Component 4: Deployment & Serving (The Storefront)

Serving Engine : FastAPI (Asynchrone, haute performance).
Architecture :
Modèle chargé en Singleton (1 seule instance en RAM).
Chargement dynamique : L'API tire le modèle tagué "Production" depuis MLflow au démarrage.
Security :
API Key Authentication (Header X-API-KEY).
Rate Limiting (ex: 100 req/min) pour éviter le DDOS.
Container : Docker Multi-stage build (Image finale < 500Mo).

Component 5: Monitoring & Observability (The Control Tower)

System Metrics : Prometheus scrape /metrics (CPU, RAM, Latence, RPM, Error Rate).
Visualisation : Grafana avec Dashboards pré-configurés (Provisioning as Code).
Data Observability :
Evidently AI compare la distribution des requêtes live (Production) vs données d'entraînement (Reference).
Détection de Data Drift (ex: les maisons deviennent plus grandes) et Concept Drift (le prix au m² change).

Component 6: Feedback Loop & Retraining (The Automation)

Orchestrator : Apache Airflow (Dockerisé).
Trigger Policy :
Schedule : Hebdomadaire (Cron).
Event-based : Si Evidently détecte un Drift > 20%, appel API vers Airflow pour forcer un ré-entraînement (dvc repro).
Evaluation Automatique : Le nouveau modèle n'est déployé que si son RMSE est meilleur que celui du modèle actuel (Champion/Challenger).

Component 7: Security & Standards (The Compliance)

Secrets Management : AUCUN mot de passe dans le code. Utilisation stricte de .env injecté par Docker Compose.
Least Privilege : Les conteneurs Docker tournent en tant qu'utilisateur non-root.
Logs : Audit trail de toutes les requêtes (ID, Timestamp, Input, Prediction) stocké dans des logs rotatifs.

3. Configuration & File Standards

Pour garantir l'hygiène du projet, les règles suivantes sont strictes.
A. Gestion des Exclusions
.dockerignore (Optimisation Build)
code
Text
.git
.github
.venv
.env
__pycache__
data/            # Les données sont montées en volume, pas copiées
notebooks/
tests/
docs/
airflow/         # L'API n'a pas besoin d'Airflow
monitoring/

.gitignore (Hygiène Git)
code
Text
.venv/
.env
*.pkl
*.log
data/            # Sauf fichiers .dvc
dist/
.coverage
.pytest_cache/

B. Gestion des Environnements
.venv : Environnement virtuel local (créé par Poetry ou venv). Ne jamais toucher à l'environnement système de Windows/WSL.
.env : Fichier unique contenant les secrets.
Exemple : MLFLOW_S3_ENDPOINT_URL=http://minio:9000

4. Roadmap d'Implémentation (Sprint Plan)

Sprint 1 (Setup) : Git, Poetry, Structure de dossiers, Docker Compose "Core" (MinIO, Postgres).
Sprint 2 (Data & Model) : DVC Pipeline, code modulaire src/, Entraînement Scikit-learn, MLflow Logging.
Sprint 3 (API & Docker) : FastAPI, Pydantic, Dockerfile optimisé, Authentification.
Sprint 4 (Orchestration) : Airflow DAGs, Automatisation du dvc repro.
Sprint 5 (Monitoring) : Prometheus, Grafana, Evidently Drift Detection.

source .venv/bin/activate
docker compose up -d
poetry run mlflow ui --backend-store-uri postgresql://mlops:mlops_password@127.0.0.1:5432/mlflow_db --host 0.0.0.0 --port 5000

docker run -d \
  -p 8000:8000 \
  -e MLFLOW_TRACKING_URI="http://mlops_minio:9000" \
  --network host \
  --name api-prod \
  house-pricing-api:prod


# Démarre Postgres, MinIO et MLflow en arrière-plan
docker-compose up -d postgres minio mlflow init-minio

make run

cd actions-runner
export RUNNER_ALLOW_RUNASROOT=1
./run.sh


###############################################################

# Exécuter le pipeline DataOps
PYTHONPATH=src poetry run python -m house_pricing.dataops.pipeline

# Lancer l'entraînement
PYTHONPATH=src MLFLOW_TRACKING_URI=http://localhost:5000 poetry run python -m house_pricing.models.train

#######################################################################################

✅ Monitoring started!
   📊 Prometheus: http://localhost:9090
   📈 Grafana:    http://localhost:3000 (admin/admin)
