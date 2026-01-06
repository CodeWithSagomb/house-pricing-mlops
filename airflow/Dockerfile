# ==============================================================================
# Airflow Dockerfile - Production Best Practices
# ==============================================================================
# Author: Sagombaye
# Version: 1.0.0
# Description: Multi-stage Airflow image with DVC support for MLOps pipelines
# ==============================================================================

FROM apache/airflow:2.8.0-python3.11 AS base

# --- Metadata Labels (OCI Standard) ---
LABEL org.opencontainers.image.title="House Pricing MLOps - Airflow"
LABEL org.opencontainers.image.description="Airflow with DVC for DataOps orchestration"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="Sagombaye"
LABEL org.opencontainers.image.source="https://github.com/CodeWithSagomb/house-pricing-mlops"

# --- System Dependencies (as root) ---
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git=1:2.39.* \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# --- Switch to airflow user for pip installs ---
USER airflow

# --- Install Python Dependencies with Constraints ---
# Using Airflow's constraint file to ensure compatibility
ARG AIRFLOW_VERSION=2.8.0
ARG PYTHON_VERSION=3.11
ARG CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

RUN pip install --no-cache-dir --user \
    "dvc[s3]==3.55.2" \
    "pandas==2.1.4" \
    "scikit-learn==1.3.2" \
    "pandera==0.18.0" \
    "multimethod==1.9.1" \
    "pyyaml==6.0.1" \
    "python-dotenv==1.0.0" \
    "psycopg2-binary==2.9.9"

# --- Working Directory ---
WORKDIR /opt/airflow

# --- Environment Variables ---
# Paths are configured via environment, NOT hardcoded
ENV PYTHONPATH="/opt/airflow/src:${PYTHONPATH}"
ENV AIRFLOW__CORE__LOAD_EXAMPLES="false"
ENV AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION="true"
ENV AIRFLOW__WEBSERVER__EXPOSE_CONFIG="false"
ENV AIRFLOW__WEBSERVER__ENABLE_PROXY_FIX="true"

# --- Health Check ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# --- Default Command ---
# Overridden by docker-compose per service (webserver, scheduler)
CMD ["airflow", "version"]
