.PHONY: install lint format test run docker-build docker-up help

help:
	@echo "Available commands:"
	@echo "  make install       Install dependencies with Poetry"
	@echo "  make lint          Run linting checks (black, isort, flake8)"
	@echo "  make format        Format code (black, isort)"
	@echo "  make test          Run tests"
	@echo "  make run           Run the API locally"
	@echo "  make docker-build  Build the Docker image"
	@echo "  make docker-up     Start services with Docker Compose"

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
	poetry run pytest tests/

run:
	poetry run uvicorn house_pricing.api.app:app --host 0.0.0.0 --port 8000 --reload

docker-build:
	docker build -t house-pricing-api -f src/house_pricing/api/Dockerfile .

docker-up:
	docker-compose up -d --build
