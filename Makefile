.PHONY: install lint format test run docker-build docker-up help dataops train infra-up infra-down init-db promote api-run monitoring-up monitoring-down

help:
	@echo "Available commands:"
	@echo ""
	@echo "  === Setup ==="
	@echo "  make install       Install dependencies with Poetry"
	@echo ""
	@echo "  === Code Quality ==="
	@echo "  make lint          Run linting checks (black, isort, flake8)"
	@echo "  make format        Format code (black, isort)"
	@echo "  make test          Run tests"
	@echo ""
	@echo "  === DataOps Pipeline ==="
	@echo "  make infra-up      Start infrastructure (postgres, minio, mlflow)"
	@echo "  make infra-down    Stop all infrastructure"
	@echo "  make init-db       Initialize data_lineage table in PostgreSQL"
	@echo "  make dataops       Run the DataOps pipeline (ingestion -> versioning)"
	@echo "  make train         Run ML training with MLflow tracking"
	@echo ""
	@echo "  === API ==="
	@echo "  make api-run       Run API locally with MLflow connection"
	@echo "  make docker-build  Build the Docker image"
	@echo "  make docker-up     Start all services with Docker Compose"
	@echo ""
	@echo "  === Model Management ==="
	@echo "  make promote       Promote a model version to @champion alias"
	@echo ""
	@echo "  === Monitoring ==="
	@echo "  make monitoring-up   Start Prometheus + Grafana"
	@echo "  make monitoring-down Stop monitoring stack"

install:
	poetry install
	poetry run pre-commit install

lint:
	poetry run black --check src tests
	poetry run isort --check-only src tests
	poetry run flake8 src tests

format:
	poetry run black src tests
	poetry run isort src tests

test:
	PYTHONPATH=src DISABLE_PANDERA_IMPORT_WARNING=True poetry run pytest tests/

# === DataOps Pipeline Commands ===

infra-up:
	docker compose up -d postgres minio init-minio
	@echo "⏳ Waiting for MinIO to be healthy..."
	@sleep 10
	docker compose up -d mlflow
	@echo "✅ Infrastructure started! MLflow: http://localhost:5000"

infra-down:
	docker compose down

init-db:
	PYTHONPATH=src poetry run python -m house_pricing.dataops.pipeline --init-db

dataops:
	PYTHONPATH=src DISABLE_PANDERA_IMPORT_WARNING=True poetry run python -m house_pricing.dataops.pipeline

train:
	PYTHONPATH=src \
	MLFLOW_TRACKING_URI=http://localhost:5000 \
	AWS_ACCESS_KEY_ID=minio_admin \
	AWS_SECRET_ACCESS_KEY=minio_password \
	MLFLOW_S3_ENDPOINT_URL=http://localhost:9000 \
	DISABLE_PANDERA_IMPORT_WARNING=True \
	poetry run python -m house_pricing.models.train

# === API Commands ===

run:
	poetry run uvicorn house_pricing.api.app:app --host 0.0.0.0 --port 8000 --reload

docker-build:
	docker build -t house-pricing-api -f src/house_pricing/api/Dockerfile .

docker-up:
	docker-compose up -d --build

# === Model Management ===

promote:
	@echo "🏆 Promoting model to @champion alias..."
	@read -p "Enter model name [HousePricing_random_forest]: " name; \
	name=$${name:-HousePricing_random_forest}; \
	read -p "Enter version to promote: " version; \
	MLFLOW_TRACKING_URI=http://localhost:5000 \
	poetry run python -c "import mlflow; mlflow.set_tracking_uri('http://localhost:5000'); client = mlflow.MlflowClient(); client.set_registered_model_alias('$$name', 'champion', '$$version'); print('✅ $$name v$$version promoted to @champion')"

api-run:
	PYTHONPATH=src \
	MLFLOW_TRACKING_URI=http://localhost:5000 \
	AWS_ACCESS_KEY_ID=minio_admin \
	AWS_SECRET_ACCESS_KEY=minio_password \
	MLFLOW_S3_ENDPOINT_URL=http://localhost:9000 \
	API_KEY=dev-secret-key \
	poetry run uvicorn house_pricing.api.app:app --host 0.0.0.0 --port 8000 --reload

# === Monitoring ===

monitoring-up:
	docker compose up -d prometheus grafana
	@echo ""
	@echo "✅ Monitoring started!"
	@echo "   📊 Prometheus: http://localhost:9090"
	@echo "   📈 Grafana:    http://localhost:3000 (admin/admin)"

monitoring-down:
	docker compose stop prometheus grafana
	@echo "✅ Monitoring stopped"
