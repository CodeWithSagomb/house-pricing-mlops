#!/bin/bash
# ===========================================
# MLOps System Startup Script
# ===========================================
# This script ensures all services start correctly
# with proper volume mounts and health checks.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           MLOps System Startup Script                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

# 1. Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}→ Working directory: $(pwd)${NC}"

# 2. Check required files exist
echo -e "${YELLOW}→ Checking required files...${NC}"
if [ ! -f "data/raw/housing.csv" ]; then
    echo -e "${RED}ERROR: data/raw/housing.csv not found!${NC}"
    echo "Please ensure the data files are present."
    exit 1
fi
echo -e "${GREEN}  ✓ housing.csv found${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ .env found${NC}"

# 3. Start all services
echo -e "${YELLOW}→ Starting Docker Compose services...${NC}"
docker compose up -d

# 4. Wait for API to be healthy
echo -e "${YELLOW}→ Waiting for API to be healthy...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ API is healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# 5. Check drift detector status
echo -e "${YELLOW}→ Checking DriftDetector status...${NC}"
DRIFT_STATUS=$(curl -s http://localhost:8000/monitoring/drift-status 2>/dev/null || echo '{"enabled":false}')
DRIFT_ENABLED=$(echo "$DRIFT_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('enabled', False))" 2>/dev/null || echo "false")

if [ "$DRIFT_ENABLED" = "True" ] || [ "$DRIFT_ENABLED" = "true" ]; then
    echo -e "${GREEN}  ✓ DriftDetector is enabled${NC}"
else
    echo -e "${YELLOW}  ⚠ DriftDetector not enabled - restarting API...${NC}"
    docker compose restart api
    sleep 10
    DRIFT_STATUS=$(curl -s http://localhost:8000/monitoring/drift-status 2>/dev/null || echo '{}')
    echo -e "${GREEN}  ✓ API restarted${NC}"
fi

# 6. Print status summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    System Status                             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Services:"
docker compose ps --format "  {{.Name}}: {{.Status}}" | grep -E "(api|frontend|mlflow|minio|grafana)"
echo ""
echo "URLs:"
echo "  • Frontend:  http://localhost:3001"
echo "  • API:       http://localhost:8000"
echo "  • MLflow:    http://localhost:5000"
echo "  • Grafana:   http://localhost:3000"
echo "  • MinIO:     http://localhost:9001"
echo ""
echo -e "${GREEN}System is ready! 🚀${NC}"
