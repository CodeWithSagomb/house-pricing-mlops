"""
A/B Testing Module for Model Deployment
========================================
Provides traffic routing between champion and challenger models.
"""

import logging
import random
from dataclasses import dataclass
from typing import Optional

from prometheus_client import Counter

from house_pricing.api.config import get_settings

logger = logging.getLogger("api.ab_testing")

# Prometheus metrics for A/B testing
AB_PREDICTIONS_TOTAL = Counter(
    "ab_predictions_total",
    "Total predictions by model variant",
    ["variant"],
)


@dataclass
class ABPredictionResult:
    """Result of an A/B test prediction."""

    predicted_price: float
    model_version: str
    variant: str  # "champion" or "challenger"
    processing_time_ms: float


class ABRouter:
    """
    Routes traffic between champion and challenger models.

    The router uses a simple random split based on configured traffic ratio.
    All routing decisions are logged for analysis.
    """

    def __init__(self):
        self.settings = get_settings()
        self.champion_model = None
        self.champion_preprocessor = None
        self.champion_version = None
        self.challenger_model = None
        self.challenger_preprocessor = None
        self.challenger_version = None
        self._enabled = False

    @property
    def enabled(self) -> bool:
        """Check if A/B testing is enabled and both models are loaded."""
        return (
            self._enabled
            and self.champion_model is not None
            and self.challenger_model is not None
        )

    def configure(
        self,
        champion_model,
        champion_preprocessor,
        champion_version: str,
        challenger_model=None,
        challenger_preprocessor=None,
        challenger_version: str = None,
    ):
        """Configure the router with models."""
        self.champion_model = champion_model
        self.champion_preprocessor = champion_preprocessor
        self.champion_version = champion_version
        self.challenger_model = challenger_model
        self.challenger_preprocessor = challenger_preprocessor
        self.challenger_version = challenger_version

        if challenger_model is not None:
            self._enabled = self.settings.AB_TESTING_ENABLED
            logger.info(
                f"ABRouter configured: champion=v{champion_version}, "
                f"challenger=v{challenger_version}, "
                f"split={self.settings.AB_TRAFFIC_SPLIT}"
            )
        else:
            self._enabled = False
            logger.info(f"ABRouter: Only champion loaded (v{champion_version})")

    def select_variant(self) -> str:
        """
        Select which model variant to use for this request.

        Returns:
            "champion" or "challenger" based on traffic split.
        """
        if not self.enabled:
            return "champion"

        if random.random() < self.settings.AB_TRAFFIC_SPLIT:
            return "champion"
        else:
            return "challenger"

    def get_model_for_variant(self, variant: str) -> tuple:
        """
        Get the model and preprocessor for a given variant.

        Returns:
            Tuple of (model, preprocessor, version)
        """
        if variant == "challenger" and self.challenger_model is not None:
            return (
                self.challenger_model,
                self.challenger_preprocessor,
                self.challenger_version,
            )
        return (
            self.champion_model,
            self.champion_preprocessor,
            self.champion_version,
        )

    def record_prediction(self, variant: str):
        """Record a prediction for metrics."""
        AB_PREDICTIONS_TOTAL.labels(variant=variant).inc()

    def get_status(self) -> dict:
        """Return current A/B testing status."""
        return {
            "enabled": self.enabled,
            "config_enabled": self.settings.AB_TESTING_ENABLED,
            "traffic_split": self.settings.AB_TRAFFIC_SPLIT,
            "champion": {
                "version": self.champion_version,
                "loaded": self.champion_model is not None,
            },
            "challenger": {
                "alias": self.settings.AB_CHALLENGER_ALIAS,
                "version": self.challenger_version,
                "loaded": self.challenger_model is not None,
            },
        }


# Singleton instance
_ab_router: Optional[ABRouter] = None


def get_ab_router() -> ABRouter:
    """Get or create the singleton ABRouter instance."""
    global _ab_router
    if _ab_router is None:
        _ab_router = ABRouter()
    return _ab_router


def init_ab_router(
    champion_model,
    champion_preprocessor,
    champion_version: str,
    challenger_model=None,
    challenger_preprocessor=None,
    challenger_version: str = None,
):
    """Initialize the A/B router with models."""
    router = get_ab_router()
    router.configure(
        champion_model=champion_model,
        champion_preprocessor=champion_preprocessor,
        champion_version=champion_version,
        challenger_model=challenger_model,
        challenger_preprocessor=challenger_preprocessor,
        challenger_version=challenger_version,
    )
    return router
