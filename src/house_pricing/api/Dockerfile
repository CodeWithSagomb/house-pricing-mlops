# ==========================================
# ÉTAPE 1 : BUILDER
# ==========================================
# Utiliser une version spécifique  pour la reproductibilité
FROM python:3.12-slim-bookworm as builder

# Optimisations Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /tmp

# Installation des outils de build et Poetry
# Utilisation du cache apt pour accélérer les builds futurs
RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential

# Installation de Poetry (Version pinnée pour stabilité)
ENV POETRY_VERSION=2.0.0
RUN pip install "poetry==$POETRY_VERSION"
RUN poetry self add poetry-plugin-export

# Copie des fichiers de dépendances
COPY pyproject.toml poetry.lock ./

# Export des requirements
# --without-hashes est utilisé ici pour la compatibilité, mais --with-hashes est mieux pour la sécurité stricte
RUN poetry export --format requirements.txt --output requirements.txt --without-hashes

# ==========================================
# ÉTAPE 2 : RUNTIME (Image de production)
# ==========================================
FROM python:3.12-slim-bookworm

# Métadonnées de l'image
LABEL maintainer="cSagombaye <cSagombaye@house-pricing.com>" \
    version="1.0" \
    description="API House Pricing - Enterprise Grade"

# Sécurité : Création d'un utilisateur non-root
# UID fixés pour faciliter la gestion des permissions sur les volumes
RUN groupadd -g 1000 appgroup && \
    useradd -r -u 1000 -g appgroup -d /app appuser

WORKDIR /app

# Upgrade pip et installation des requirements
# Utilisation de mount=type=cache pour garder le cache pip entre les builds
COPY --from=builder /tmp/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# --- COPIE DU CODE SOURCE ---
# On copie d'abord la config pour profiter du cache Docker layers si le code change mais pas la config
COPY --chown=appuser:appgroup config/ config/
COPY --chown=appuser:appgroup src/ src/

# Gestion des artefacts ML
# Le Preprocessor et le Modèle sont maintenant téléchargés dynamiquement depuis MLflow au démarrage.
# Plus besoin de copier data/processed/preprocessor.pkl !

# --- VARIABLES D'ENVIRONNEMENT (Documentation) ---
# Valeurs par défaut ou placeholders pour documenter ce qui est attendu
ENV PYTHONPATH=/app/src \
    PORT=8000 \
    # MLflow
    MLFLOW_TRACKING_URI="http://mlops_minio:9000" \
    # App
    API_ENV="production"

# --- VOLUMES ---
# Point de montage pour les logs si on veut les persister sur l'hôte
VOLUME ["/app/logs"]

# Create drift reports directory with proper permissions
RUN mkdir -p /app/logs/drift_reports && chown -R appuser:appgroup /app/logs

# --- SÉCURITÉ FINAL ---
USER appuser

# Exposition du port
EXPOSE 8000

# Healthcheck SANS curl (réduit la surface d'attaque et la taille de l'image)
# Utilise le module http.client standard de Python
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import http.client; conn = http.client.HTTPConnection('localhost', 8000); conn.request('GET', '/health'); response = conn.getresponse(); exit(0) if response.status == 200 else exit(1)"

# Command d'exécution optimisée
# --proxy-headers : Nécessaire derrière un Load Balancer (AWS ALB, Nginx, Traefik)
# --no-access-log : Pour la perf en prod (on a déjà le middleware JSON logging)
# --workers : 1 par défaut, à ajuster selon CPU (souvent 2-4 workers en prod)
CMD ["sh", "-c", "uvicorn house_pricing.api.app:app --host 0.0.0.0 --port $PORT --proxy-headers --no-access-log"]
