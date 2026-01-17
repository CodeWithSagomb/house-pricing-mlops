#!/bin/bash
# ===========================================
# Frontend Deployment Script
# ===========================================
# Use this script to deploy frontend changes
# It forces a complete rebuild to avoid cache issues

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}→ Stopping frontend container...${NC}"
docker compose stop frontend

echo -e "${YELLOW}→ Removing old container...${NC}"
docker compose rm -f frontend

echo -e "${YELLOW}→ Building new image (no cache)...${NC}"
docker compose build --no-cache frontend

echo -e "${YELLOW}→ Starting new container...${NC}"
docker compose up -d frontend

echo -e "${YELLOW}→ Waiting for frontend to be ready...${NC}"
sleep 10

if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
    echo "→ Open http://localhost:3001"
    echo "→ Hard refresh: Ctrl + Shift + R"
else
    echo -e "${YELLOW}⚠ Frontend may still be starting...${NC}"
fi
