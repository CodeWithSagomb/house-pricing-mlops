# 🏠 SAGOMBAYE MLOps - House Price Prediction Platform

[![CI/CD](https://github.com/CodeWithSagomb/house-pricing-mlops/actions/workflows/ci.yml/badge.svg)](https://github.com/CodeWithSagomb/house-pricing-mlops/actions/workflows/ci.yml)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![MLflow](https://img.shields.io/badge/MLflow-3.8.0-blue.svg)](https://mlflow.org/)

Production-ready MLOps platform for California house price prediction with model versioning, monitoring, and a modern dashboard.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/CodeWithSagomb/house-pricing-mlops.git
cd house-pricing-mlops

# 2. Create Python environment
python -m venv .venv
source .venv/bin/activate
pip install poetry && poetry install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Start everything
./start.sh
```

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3001 | SAGOMBAYE Frontend |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI |
| **MLflow** | http://localhost:5000 | Model Registry & Tracking |
| **Grafana** | http://localhost:3000 | Metrics Dashboard |
| **MinIO** | http://localhost:9001 | Artifact Storage |
| **Airflow** | http://localhost:8081 | Pipeline Orchestration |

## 📁 Project Structure

```
house-pricing-mlops/
├── src/house_pricing/     # Python API & ML code
│   ├── api/               # FastAPI application
│   ├── models/            # Training scripts
│   └── data/              # Data processing
├── frontend/              # Next.js dashboard
├── docker/                # Dockerfiles
├── airflow/dags/          # Airflow DAGs
├── monitoring/            # Prometheus/Grafana config
├── tests/                 # Unit & integration tests
├── data/                  # Raw & processed data (DVC)
├── docker-compose.yml     # Local orchestration
├── start.sh               # System startup script
└── pyproject.toml         # Python dependencies
```

## 🛠️ Development

### Train a New Model
```bash
source .venv/bin/activate
source .env
export AWS_ACCESS_KEY_ID=$MINIO_ROOT_USER
export AWS_SECRET_ACCESS_KEY=$MINIO_ROOT_PASSWORD
export MLFLOW_S3_ENDPOINT_URL=http://127.0.0.1:9000
export MLFLOW_TRACKING_URI=http://127.0.0.1:5000
python src/house_pricing/models/train.py
```

### Run Tests
```bash
pytest tests/ -v
```

### API Health Check
```bash
curl http://localhost:8000/health
# {"status":"ok","model_version":"4"}
```

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │   Frontend  │ (Next.js)
                    │  :3001      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     API     │ (FastAPI)
                    │   :8000     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ MLflow  │       │ MinIO   │       │PostgreSQL│
    │ :5000   │       │ :9001   │       │  :5432   │
    └─────────┘       └─────────┘       └──────────┘
```

## 📊 Model Performance

| Metric | Value |
|--------|-------|
| RMSE | 0.5038 |
| R² | 0.8063 |
| Algorithm | Random Forest |
| Features | 8 (California housing) |

## 🔧 Troubleshooting

### Services not starting?
```bash
./start.sh  # Uses existing model if available
```

### Need a fresh start?
```bash
docker compose down -v  # ⚠️ Deletes all data
./start.sh
```

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with ❤️ by SAGOMBAYE**
