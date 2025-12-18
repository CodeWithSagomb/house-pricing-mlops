"""
Drift Detector - Axe 4 Enterprise MLOps
=======================================
Detects data drift and model performance degradation using Evidently AI.

NOTE: Evidently imports are made conditional due to compatibility issues
with certain versions. If imports fail, drift detection is disabled gracefully.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Conditional Evidently imports (compatibility with v0.7+)
EVIDENTLY_AVAILABLE = False
try:
    from evidently.metric_preset import DataDriftPreset
    from evidently.report import Report
    from evidently.utils.data_preprocessing import ColumnMapping

    EVIDENTLY_AVAILABLE = True
except ImportError:
    try:
        # Fallback for older Evidently versions
        from evidently import ColumnMapping
        from evidently.metric_preset import DataDriftPreset
        from evidently.report import Report

        EVIDENTLY_AVAILABLE = True
    except ImportError as e:
        logger.warning(f"⚠️ Evidently not available, drift detection disabled: {e}")
        # Stubs for when Evidently is not available
        ColumnMapping = None
        DataDriftPreset = None
        Report = None


class DriftDetector:
    """
    Service de détection de dérive pour production ML.
    Utilise Evidently AI pour générer des rapports de drift.
    """

    def __init__(
        self,
        reference_data: pd.DataFrame,
        target_column: str = "MedHouseVal",
        prediction_column: str = "prediction",
    ):
        """
        Args:
            reference_data: Données de référence (ex: training set).
            target_column: Nom de la colonne target.
            prediction_column: Nom de la colonne de prédiction.
        """
        if not EVIDENTLY_AVAILABLE:
            logger.warning(
                "⚠️ DriftDetector créé mais inactif (Evidently non disponible)"
            )
            self.enabled = False
            self.reference_data = None
            return

        self.enabled = True
        self.reference_data = reference_data
        self.target_column = target_column
        self.prediction_column = prediction_column

        # Buffer pour accumuler les données de production
        self.production_buffer: list[dict] = []
        self.buffer_size = 100  # Nombre de prédictions avant analyse

        # Mapping des colonnes pour Evidently
        self.column_mapping = ColumnMapping(
            target=target_column,
            prediction=prediction_column,
            numerical_features=[
                "MedInc",
                "HouseAge",
                "AveRooms",
                "AveBedrms",
                "Population",
                "AveOccup",
                "Latitude",
                "Longitude",
            ],
        )

        logger.info(
            f"🔍 DriftDetector initialisé avec {len(reference_data)} échantillons de référence"
        )

    def add_prediction(
        self,
        features: dict,
        prediction: float,
        true_value: Optional[float] = None,
    ):
        """
        Ajoute une prédiction au buffer de monitoring.

        Args:
            features: Features d'entrée (dict).
            prediction: Valeur prédite.
            true_value: Valeur réelle (si disponible via feedback).
        """
        if not self.enabled:
            return None

        record = {
            **features,
            self.prediction_column: prediction,
            self.target_column: true_value if true_value is not None else None,
            "timestamp": datetime.now().isoformat(),
        }
        self.production_buffer.append(record)

        if len(self.production_buffer) >= self.buffer_size:
            logger.info(
                f"📊 Buffer plein ({self.buffer_size} samples). Analyse de drift..."
            )
            return self.analyze_drift()

        return None

    def analyze_drift(self) -> dict:
        """
        Analyse la dérive entre données de référence et production.

        Returns:
            dict avec les résultats de l'analyse.
        """
        if not self.enabled:
            return {"status": "disabled", "reason": "Evidently not available"}

        if len(self.production_buffer) < 10:
            logger.warning("⚠️ Pas assez de données pour l'analyse (min: 10)")
            return {"status": "insufficient_data"}

        production_df = pd.DataFrame(self.production_buffer)

        # Report de Data Drift
        data_drift_report = Report(metrics=[DataDriftPreset()])
        data_drift_report.run(
            reference_data=self.reference_data,
            current_data=production_df,
            column_mapping=self.column_mapping,
        )

        # Extraire les résultats
        drift_results = data_drift_report.as_dict()
        metrics = drift_results.get("metrics", [])

        # Chercher le dataset drift share
        dataset_drift_detected = False
        drifted_columns = []

        for metric in metrics:
            result = metric.get("result", {})
            if "share_of_drifted_columns" in result:
                drift_share = result["share_of_drifted_columns"]
                dataset_drift_detected = drift_share > 0.3  # >30% colonnes en drift
            if "drift_by_columns" in result:
                for col, col_data in result["drift_by_columns"].items():
                    if col_data.get("drift_detected", False):
                        drifted_columns.append(col)

        analysis_result = {
            "status": "drift_detected" if dataset_drift_detected else "stable",
            "timestamp": datetime.now().isoformat(),
            "samples_analyzed": len(self.production_buffer),
            "drifted_columns": drifted_columns,
            "drift_detected": dataset_drift_detected,
        }

        if dataset_drift_detected:
            logger.warning(f"🚨 DRIFT DÉTECTÉ! Colonnes: {drifted_columns}")
        else:
            logger.info("✅ Pas de drift significatif détecté.")

        # Optionnel: sauvegarder le rapport HTML
        self._save_report(data_drift_report)

        # Vider le buffer après analyse
        self.production_buffer = []

        return analysis_result

    def _save_report(self, report):
        """Sauvegarde le rapport HTML dans le dossier de logs."""
        reports_dir = Path("/app/logs/drift_reports")
        reports_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = reports_dir / f"drift_report_{timestamp}.html"

        try:
            report.save_html(str(report_path))
            logger.info(f"📁 Rapport sauvegardé: {report_path}")
        except Exception as e:
            logger.warning(f"⚠️ Impossible de sauvegarder le rapport: {e}")


# Singleton pour l'API
_drift_detector_instance: Optional[DriftDetector] = None


def get_drift_detector() -> Optional[DriftDetector]:
    """Retourne l'instance du DriftDetector (si initialisé)."""
    return _drift_detector_instance


def init_drift_detector(reference_data: pd.DataFrame):
    """Initialise le DriftDetector avec les données de référence."""
    global _drift_detector_instance
    _drift_detector_instance = DriftDetector(reference_data)
    return _drift_detector_instance
