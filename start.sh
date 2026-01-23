#!/bin/bash
# ===========================================
# MLOps System Startup Script
# ===========================================
# This script ensures all services start correctly
# WITHOUT retraining the model if it already exists.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           SAGOMBAYE MLOps - System Startup                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

# 1. Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}→ Working directory: $(pwd)${NC}"

# 2. Check required files exist
echo -e "${YELLOW}→ Checking required files...${NC}"
if [ ! -f "data/raw/housing.csv" ]; then
    echo -e "${RED}ERROR: data/raw/housing.csv not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ housing.csv found${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ .env found${NC}"

# 3. Load environment variables
source .env
export AWS_ACCESS_KEY_ID=$MINIO_ROOT_USER
export AWS_SECRET_ACCESS_KEY=$MINIO_ROOT_PASSWORD
export MLFLOW_S3_ENDPOINT_URL=http://127.0.0.1:9000
export MLFLOW_TRACKING_URI=http://127.0.0.1:5000
export PYTHONPATH=$PWD/src:$PYTHONPATH

# 4. Start infrastructure
echo -e "${YELLOW}→ Starting infrastructure (PostgreSQL, MinIO)...${NC}"
docker compose up -d postgres minio
sleep 15

# 5. Start MLflow
echo -e "${YELLOW}→ Starting MLflow...${NC}"
docker compose up -d mlflow
sleep 30

# Check MLflow health
if ! curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${RED}ERROR: MLflow failed to start!${NC}"
    docker compose logs mlflow | tail -20
    exit 1
fi
echo -e "${GREEN}  ✓ MLflow is healthy${NC}"

# 6. Create MinIO bucket if needed
echo -e "${YELLOW}→ Ensuring MinIO bucket exists...${NC}"
docker compose exec -T minio sh -c "mc alias set myminio http://localhost:9000 minio_admin minio_password && mc mb myminio/mlflow-artifacts --ignore-existing" 2>/dev/null || true
echo -e "${GREEN}  ✓ MinIO bucket ready${NC}"

# 7. Check if model exists - SKIP TRAINING IF EXISTS!
echo -e "${YELLOW}→ Checking if model already exists...${NC}"
source .venv/bin/activate

MODEL_EXISTS=$(python -c "
import mlflow
mlflow.set_tracking_uri('http://localhost:5000')
client = mlflow.MlflowClient()
try:
    mv = client.get_model_version_by_alias('HousePricing_random_forest', 'champion')
    print('exists')
except:
    print('not_found')
" 2>/dev/null)

if [ "$MODEL_EXISTS" = "exists" ]; then
    echo -e "${GREEN}  ✓ Model @champion already exists - SKIPPING TRAINING${NC}"
else
    echo -e "${YELLOW}  ⚠ No model found - Training required...${NC}"
    python src/house_pricing/models/train.py

    # Set champion alias to latest version
    python -c "
import mlflow
mlflow.set_tracking_uri('http://localhost:5000')
client = mlflow.MlflowClient()
versions = client.search_model_versions(\"name='HousePricing_random_forest'\")
if versions:
    latest = max(versions, key=lambda x: int(x.version))
    client.set_registered_model_alias('HousePricing_random_forest', 'champion', latest.version)
    print(f'✅ Alias @champion set to version {latest.version}')
"
    echo -e "${GREEN}  ✓ Model trained and registered${NC}"
fi

# 8. Start all remaining services
echo -e "${YELLOW}→ Starting all services...${NC}"
docker compose up -d

# 9. Wait for API to be healthy
echo -e "${YELLOW}→ Waiting for API to be healthy...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ API is healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# 10. Print status summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    System Status                             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get model version
MODEL_INFO=$(curl -sf http://localhost:8000/health 2>/dev/null || echo '{"model_version":"unknown"}')
echo "Model Info: $MODEL_INFO"
echo ""

echo "Services:"
docker compose ps --format "  {{.Name}}: {{.Status}}" | grep -E "(api|frontend|mlflow|minio|grafana)"
echo ""
echo "URLs:"
echo "  • Frontend:  http://localhost:3001"
echo "  • API:       http://localhost:8000"
echo "  • API Docs:  http://localhost:8000/docs"
echo "  • MLflow:    http://localhost:5000"
echo "  • Grafana:   http://localhost:3000"
echo "  • MinIO:     http://localhost:9001"
echo ""
echo -e "${GREEN}System is ready! 🚀${NC}"
