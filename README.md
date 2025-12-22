#  House Pricing MLOps Project

**Production-grade ML API** pour prédire les prix immobiliers (California Housing Dataset).

## Features

### API Enterprise
- ✅ FastAPI avec Swagger UI interactif
- ✅ Authentification par API Key
- ✅ Batch predictions (`/predict/batch`)
- ✅ Hot reload du modèle (`/model/reload`)
- ✅ Statistiques des données (`/data/stats`)

### MLOps Stack
- ✅ **MLflow** - Experiment tracking & Model Registry
- ✅ **DVC** - Data versioning avec MinIO (S3)
- ✅ **Prometheus + Grafana** - Monitoring temps réel
- ✅ **PostgreSQL** - Base de données MLflow

### DataOps Pipeline
- ✅ Architecture modulaire (ingestion → validation → transformation → versioning)
- ✅ Quality gates automatiques (95% valid data)
- ✅ Traçabilité complète avec data lineage

### CI/CD
- ✅ GitHub Actions (lint, test, build, deploy)
- ✅ Coverage report avec seuil 70%
- ✅ Security scanning (Trivy)
- ✅ Auto-rollback on failure
Push → Lint → Test → Security → Build → Deploy → Notify

---

## Installation

```bash
# Cloner et installer
git clone https://github.com/yourrepo/house-pricing-mlops.git
cd house-pricing-mlops
make install
```

---

## Démarrage Rapide

### Option 1: Full Docker (Production-like)

```bash
# Démarrer toute l'infrastructure
docker compose up -d

# Vérifier le status
docker compose ps
```

### Option 2: Hybride (Recommandé pour Dev)

```bash
# Démarrer infrastructure (PostgreSQL, MinIO, MLflow, Prometheus, Grafana)
make infra-up
make monitoring-up

# Lancer l'API en local (hot reload)
make api-run
```

---

## Services URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| 📖 **API Docs** | http://localhost:8000/docs | API_KEY: `` |
| 🧪 **MLflow** | http://localhost:5000 | - |
| 💾 **MinIO** | http://localhost:9001 | admin / password |
| 📊 **Prometheus** | http://localhost:9090 | - |
| 📈 **Grafana** | http://localhost:3000 | admin / admin |

---

## Commandes Principales

```bash
# Développement
make api-run        # API locale (hot reload)
make test           # Lancer les tests
make lint           # Vérifier le style
make format         # Formater le code

# Infrastructure
make infra-up       # Démarrer PostgreSQL, MinIO, MLflow
make infra-down     # Arrêter l'infrastructure
make monitoring-up  # Prometheus + Grafana
make monitoring-down

# Data & ML Pipeline
make dataops        # Pipeline DataOps complet
make train          # Entraîner le modèle
make promote        # Promouvoir modèle en @champion
```

---

## Tester l'API

```bash
# Health check
curl http://localhost:8000/health

# Prédiction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: dev-secret-key" \
  -d '{
    "MedInc": 3.5,
    "HouseAge": 30,
    "AveRooms": 5,
    "AveBedrms": 1,
    "Population": 800,
    "AveOccup": 3,
    "Latitude": 37.5,
    "Longitude": -122
  }'

# Batch prediction
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: dev-secret-key" \
  -d '{"predictions": [
    {"MedInc": 3.5, "HouseAge": 30, "AveRooms": 5, "AveBedrms": 1, "Population": 800, "AveOccup": 3, "Latitude": 37.5, "Longitude": -122},
    {"MedInc": 5.2, "HouseAge": 15, "AveRooms": 6, "AveBedrms": 1.2, "Population": 1200, "AveOccup": 2.5, "Latitude": 38.0, "Longitude": -121}
  ]}'
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MONITORING LAYER                         │
│  Prometheus (9090) ◄── scrape ── API :8000/metrics          │
│       │                                                      │
│       ▼                                                      │
│  Grafana (3000) ── Dashboard "House Pricing API"            │
└─────────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────┐
│                       API LAYER                              │
│  /predict    /predict/batch    /model/reload    /data/stats │
│       │                                                      │
│       ▼                                                      │
│  MLflow (5000) ── Model Registry ── MinIO (artifacts)       │
└─────────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────┐
│                     DATAOPS LAYER                            │
│  Ingestion → Validation → Transformation → Versioning (DVC) │
│                    │                                         │
│                    ▼                                         │
│              PostgreSQL (data lineage)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Structure du Projet

```
house-pricing-mlops/
├── src/house_pricing/
│   ├── api/            # FastAPI application
│   ├── dataops/        # Modular data pipeline
│   ├── models/         # ML training
│   └── data/           # Data contracts
├── monitoring/
│   ├── prometheus/     # Prometheus config
│   └── grafana/        # Dashboards
├── tests/              # Unit & integration tests
├── config/             # YAML configurations
├── .github/workflows/  # CI/CD pipelines
└── docker-compose.yml
```

---

## License

MIT License
