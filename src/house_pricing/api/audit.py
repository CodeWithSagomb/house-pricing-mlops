"""
Audit Logging Module - Track all security-sensitive actions.

Provides structured logging for:
- Authentication events (login, register, logout)
- Prediction requests
- API errors and security violations
"""

import json
import logging
from typing import Any

from fastapi import Request

# Configure audit logger with JSON format
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create handler if not exists
if not audit_logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            '{"timestamp":"%(asctime)s","level":"%(levelname)s","message":%(message)s}'
        )
    )
    audit_logger.addHandler(handler)


def get_client_ip(request: Request) -> str:
    """Extract real client IP considering proxies."""
    # Check X-Forwarded-For header (from reverse proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fallback to direct client
    return request.client.host if request.client else "unknown"


def log_auth_event(
    event: str,
    request: Request,
    user_id: int | None = None,
    email: str | None = None,
    success: bool = True,
    details: dict[str, Any] | None = None,
) -> None:
    """
    Log authentication-related events.

    Events: login, register, logout, token_refresh, password_reset
    """
    log_entry = {
        "type": "auth",
        "event": event,
        "ip": get_client_ip(request),
        "user_id": user_id,
        "email": email,
        "success": success,
        "user_agent": request.headers.get("User-Agent", "unknown")[:100],
        "details": details or {},
    }
    audit_logger.info(json.dumps(log_entry))


def log_prediction(
    request: Request,
    user_id: int | None,
    features: dict,
    prediction: float,
    model_version: str,
    processing_time_ms: float,
) -> None:
    """Log prediction requests for audit trail."""
    log_entry = {
        "type": "prediction",
        "ip": get_client_ip(request),
        "user_id": user_id,
        "model_version": model_version,
        "processing_time_ms": round(processing_time_ms, 2),
        # Don't log full features for privacy, just key metrics
        "feature_summary": {
            "MedInc": features.get("MedInc"),
            "location": f"{features.get('Latitude'):.2f},{features.get('Longitude'):.2f}",
        },
        "prediction": round(prediction, 4),
    }
    audit_logger.info(json.dumps(log_entry))


def log_security_event(
    event: str,
    request: Request,
    severity: str = "warning",
    details: dict[str, Any] | None = None,
) -> None:
    """
    Log security-related events.

    Events: rate_limit_exceeded, invalid_api_key, unauthorized_access, etc.
    """
    log_entry = {
        "type": "security",
        "event": event,
        "severity": severity,
        "ip": get_client_ip(request),
        "path": request.url.path,
        "method": request.method,
        "user_agent": request.headers.get("User-Agent", "unknown")[:100],
        "details": details or {},
    }

    if severity == "critical":
        audit_logger.critical(json.dumps(log_entry))
    elif severity == "error":
        audit_logger.error(json.dumps(log_entry))
    elif severity == "warning":
        audit_logger.warning(json.dumps(log_entry))
    else:
        audit_logger.info(json.dumps(log_entry))


def log_api_error(
    request: Request,
    error_type: str,
    error_message: str,
    status_code: int,
) -> None:
    """Log API errors for debugging and monitoring."""
    log_entry = {
        "type": "error",
        "error_type": error_type,
        "message": error_message[:200],  # Truncate long messages
        "status_code": status_code,
        "ip": get_client_ip(request),
        "path": request.url.path,
        "method": request.method,
    }
    audit_logger.error(json.dumps(log_entry))
