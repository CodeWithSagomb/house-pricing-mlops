"""
Model Validation Gate - Axe 3 Enterprise MLOps
===============================================
Automates Champion vs Challenger comparison.
Promotes new model only if it beats the current champion.
"""

import logging
import os
import sys

import mlflow
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Configuration
MODEL_NAME = os.getenv("MODEL_NAME", "HousePricing_random_forest")
CHAMPION_ALIAS = "champion"
CHALLENGER_ALIAS = "challenger"

# Seuils de promotion
METRIC_NAME = "rmse"  # Lower is better
IMPROVEMENT_THRESHOLD = 0.01  # Le challenger doit être 1% meilleur


def get_model_metrics(client: mlflow.MlflowClient, name: str, alias: str) -> dict:
    """Récupère les métriques d'un modèle via son alias."""
    try:
        mv = client.get_model_version_by_alias(name, alias)
        run = client.get_run(mv.run_id)
        metrics = run.data.metrics
        return {
            "version": mv.version,
            "run_id": mv.run_id,
            "rmse": metrics.get("rmse"),
            "r2": metrics.get("r2"),
            "mae": metrics.get("mae"),
        }
    except mlflow.exceptions.MlflowException as e:
        logger.warning(f"Alias '{alias}' non trouvé: {e}")
        return None


def compare_models(champion_metrics: dict, challenger_metrics: dict) -> bool:
    """
    Compare le challenger au champion.
    Retourne True si le challenger est meilleur.
    """
    if champion_metrics is None:
        logger.info(
            "🆕 Pas de champion existant - le challenger devient champion par défaut."
        )
        return True

    champion_rmse = champion_metrics.get(METRIC_NAME)
    challenger_rmse = challenger_metrics.get(METRIC_NAME)

    if champion_rmse is None or challenger_rmse is None:
        logger.error(f"❌ Métrique '{METRIC_NAME}' manquante. Comparaison impossible.")
        return False

    improvement = (champion_rmse - challenger_rmse) / champion_rmse

    logger.info(
        f"📊 Champion RMSE: {champion_rmse:.4f} | Challenger RMSE: {challenger_rmse:.4f}"
    )
    logger.info(
        f"📈 Amélioration: {improvement:.2%} (seuil: {IMPROVEMENT_THRESHOLD:.2%})"
    )

    if improvement >= IMPROVEMENT_THRESHOLD:
        logger.info("✅ Challenger MEILLEUR que Champion! Promotion autorisée.")
        return True
    else:
        logger.info("❌ Challenger n'est pas suffisamment meilleur. Promotion refusée.")
        return False


def promote_challenger(client: mlflow.MlflowClient, challenger_version: str):
    """Promeut le challenger en nouveau champion."""
    logger.info(f"🏆 Promotion de la version {challenger_version} en 'champion'...")
    client.set_registered_model_alias(MODEL_NAME, CHAMPION_ALIAS, challenger_version)
    logger.info(
        f"✅ {MODEL_NAME}@{CHAMPION_ALIAS} est maintenant la version {challenger_version}"
    )


def validation_gate():
    """
    Pipeline principal de validation.
    - Compare challenger vs champion
    - Promeut si meilleur
    - Sinon, échoue avec exit code 1
    """
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))
    client = mlflow.MlflowClient()

    logger.info("=" * 50)
    logger.info("🚦 MODEL VALIDATION GATE - Champion vs Challenger")
    logger.info("=" * 50)

    # 1. Récupérer les métriques
    champion_metrics = get_model_metrics(client, MODEL_NAME, CHAMPION_ALIAS)
    challenger_metrics = get_model_metrics(client, MODEL_NAME, CHALLENGER_ALIAS)

    if challenger_metrics is None:
        logger.error(
            "❌ Aucun modèle avec l'alias 'challenger' trouvé. Exécutez d'abord le training."
        )
        sys.exit(1)

    # 2. Comparer
    should_promote = compare_models(champion_metrics, challenger_metrics)

    # 3. Décision
    if should_promote:
        promote_challenger(client, challenger_metrics["version"])
        logger.info("🎉 Validation Gate: PASSED")
        sys.exit(0)
    else:
        logger.warning("⛔ Validation Gate: FAILED - Challenger rejected")
        sys.exit(1)


if __name__ == "__main__":
    validation_gate()
