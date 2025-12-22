FROM python:3.10-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install MLflow and dependencies
RUN pip install --no-cache-dir \
    mlflow==3.7.0 \
    psycopg2-binary \
    boto3

# Expose port
EXPOSE 5000

# Default command (can be overridden in docker-compose)
CMD ["mlflow", "server", "--host", "0.0.0.0", "--port", "5000"]
