#!/bin/bash
# ===========================================
# Deploy to Hugging Face Spaces
# ===========================================
# This script helps prepare and test the HF deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Hugging Face Spaces Deployment Helper                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if model exists
if [ ! -f "models/production/model.joblib" ]; then
    echo -e "${RED}ERROR: Model not found! Run export first.${NC}"
    echo "python scripts/export_model_for_render.py"
    exit 1
fi

case "${1:-help}" in
    build)
        echo -e "${YELLOW}→ Building Docker image for Hugging Face...${NC}"
        docker build -f Dockerfile.huggingface -t sagombaye-api:hf .
        echo -e "${GREEN}✓ Image built: sagombaye-api:hf${NC}"
        docker images sagombaye-api:hf
        ;;

    test)
        echo -e "${YELLOW}→ Testing locally on port 7860...${NC}"
        docker run --rm -p 7860:7860 --name sagombaye-hf-test sagombaye-api:hf &
        sleep 10
        echo -e "${YELLOW}→ Testing health endpoint...${NC}"
        curl -sf http://localhost:7860/health && echo ""
        echo -e "${GREEN}✓ API is working! Access: http://localhost:7860/docs${NC}"
        echo "Press Ctrl+C to stop"
        wait
        ;;

    stop)
        echo -e "${YELLOW}→ Stopping test container...${NC}"
        docker stop sagombaye-hf-test 2>/dev/null || true
        echo -e "${GREEN}✓ Stopped${NC}"
        ;;

    size)
        echo -e "${YELLOW}→ Image size analysis...${NC}"
        docker images sagombaye-api:hf --format "Size: {{.Size}}"
        echo ""
        echo "Model size:"
        ls -lh models/production/model.joblib
        ;;

    push)
        echo -e "${YELLOW}→ Instructions to push to Hugging Face:${NC}"
        echo ""
        echo "1. Create a new Space on huggingface.co:"
        echo "   - Go to: https://huggingface.co/new-space"
        echo "   - Select 'Docker' as SDK"
        echo "   - Name it: sagombaye-api"
        echo ""
        echo "2. Clone your Space:"
        echo "   git clone https://huggingface.co/spaces/YOUR_USERNAME/sagombaye-api"
        echo ""
        echo "3. Copy files:"
        echo "   cp Dockerfile.huggingface <space>/Dockerfile"
        echo "   cp -r src/house_pricing <space>/src/"
        echo "   cp -r models/production <space>/models/"
        echo "   cp -r data/processed <space>/data/"
        echo "   cp pyproject.toml poetry.lock <space>/"
        echo ""
        echo "4. Push to HF:"
        echo "   cd <space> && git add . && git commit -m 'Initial deploy' && git push"
        ;;

    help|*)
        echo "Usage: $0 {build|test|stop|size|push}"
        echo ""
        echo "Commands:"
        echo "  build  - Build Docker image locally"
        echo "  test   - Run and test locally on port 7860"
        echo "  stop   - Stop test container"
        echo "  size   - Show image and model sizes"
        echo "  push   - Show instructions to push to HF"
        ;;
esac
