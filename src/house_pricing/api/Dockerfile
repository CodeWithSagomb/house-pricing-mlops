# ==========================================
# STAGE 1: BUILDER - Export dependencies
# ==========================================
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /build

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_VERSION=2.0.0
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION" && \
    poetry self add poetry-plugin-export

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Export only production dependencies (no dev)
RUN poetry export --format requirements.txt --output requirements.txt --without-hashes --only main

# ==========================================
# STAGE 2: DEPENDENCIES - Install packages
# ==========================================
FROM python:3.12-slim-bookworm AS dependencies

WORKDIR /deps

# Copy requirements from builder
COPY --from=builder /build/requirements.txt .

# Install dependencies to a virtual environment
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ==========================================
# STAGE 3: RUNTIME - Minimal production image
# ==========================================
FROM python:3.12-slim-bookworm AS runtime

# OCI Labels
LABEL org.opencontainers.image.source="https://github.com/CodeWithSagomb/house-pricing-mlops" \
    org.opencontainers.image.title="House Pricing API" \
    org.opencontainers.image.description="MLOps API for house price prediction" \
    org.opencontainers.image.version="1.0.0"

# Create non-root user
RUN groupadd -g 1000 appgroup && \
    useradd -r -u 1000 -g appgroup -d /app appuser

WORKDIR /app

# Copy virtual environment from dependencies stage
COPY --from=dependencies /opt/venv /opt/venv

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app/src \
    PORT=8000 \
    API_ENV=production \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy application code (minimal)
COPY --chown=appuser:appgroup config/ config/
COPY --chown=appuser:appgroup src/house_pricing/ src/house_pricing/

# Create logs directory
RUN mkdir -p /app/logs/drift_reports && chown -R appuser:appgroup /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Healthcheck without curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import http.client; c=http.client.HTTPConnection('localhost',8000); c.request('GET','/health'); exit(0 if c.getresponse().status==200 else 1)"

# Run with uvicorn
CMD ["sh", "-c", "uvicorn house_pricing.api.app:app --host 0.0.0.0 --port $PORT --proxy-headers --no-access-log"]
