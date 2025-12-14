import json
import logging
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class JSONFormatter(logging.Formatter):
    """Formatter pour sortir des logs en JSON."""

    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }
        # Ajout des champs extra (contextual logging)
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id

        return json.dumps(log_obj)


def setup_logging():
    """Configure le logging racine pour utiliser le JSONFormatter."""
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.handlers = [handler]
    logger.setLevel(logging.INFO)
    # Supprimer les handlers par défaut pour éviter les doublons
    logger.propagate = False


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware pour ajouter un request_id à chaque requête et le logger."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())

        # On peut stocker dans contextvar si on veut du logging partout,
        # mais ici on va just logger le début et la fin.

        # Pour simplifier, on injecte dans le logger 'api' localement si on utilisait structlog,
        # mais avec logging standard c'est plus dur de passer le context.
        # On va l'ajouter au state de la request.
        request.state.request_id = request_id

        logger = logging.getLogger("api.middleware")
        # On triche un peu pour passer le context au formatter via 'extra'
        # Mais le formatter standard ne prend pas extra aussi facilement sans adapter le RecordFactory ou utiliser LoggerAdapter.
        # On va faire simple : on loggue manuellement.

        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        log_data = {
            "action": "request",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(process_time, 2),
            "request_id": request_id,
        }

        logger.info(json.dumps(log_data))

        # On renvoie header X-Request-ID
        response.headers["X-Request-ID"] = request_id
        return response
