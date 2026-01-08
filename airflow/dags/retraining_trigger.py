"""
Retraining Trigger DAG
=======================
Monitors drift status and triggers retraining when drift is detected.

This DAG:
1. Checks drift status via HTTP sensor
2. Triggers training_pipeline DAG if drift detected
3. Logs the trigger event

Schedule: Every hour
"""

import os
from datetime import datetime, timedelta

from airflow.operators.python import PythonOperator, ShortCircuitOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

from airflow import DAG

# =============================================================================
# CONFIGURATION
# =============================================================================

CONFIG = {
    "api_endpoint": os.getenv("DRIFT_API_ENDPOINT", "/monitoring/drift-status"),
    "api_conn_id": os.getenv("DRIFT_API_CONN_ID", "api_conn"),
    "check_interval": int(os.getenv("DRIFT_CHECK_INTERVAL", "3600")),  # 1 hour
    "trigger_dag_id": os.getenv("DRIFT_TRIGGER_DAG", "training_pipeline"),
}

DEFAULT_ARGS = {
    "owner": "Sagombaye",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


# =============================================================================
# TASK FUNCTIONS
# =============================================================================


def check_drift_and_decide(**context) -> bool:
    """
    Check drift status from API response and decide whether to trigger retraining.

    Returns:
        bool: True if retraining should be triggered, False otherwise.
    """
    import logging

    import requests

    logger = logging.getLogger(__name__)

    api_host = os.getenv("API_HOST", "http://api:8000")
    endpoint = CONFIG["api_endpoint"]
    url = f"{api_host}{endpoint}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        drift_detected = data.get("drift_detected", False)
        status = data.get("status", "unknown")
        drifted_columns = data.get("drifted_columns", [])

        logger.info(f"Drift status: {status}, drift_detected: {drift_detected}")

        if drift_detected:
            logger.warning(
                f"Drift detected! Columns: {drifted_columns}. Triggering retraining."
            )
            return True
        else:
            logger.info("No drift detected. Skipping retraining.")
            return False

    except requests.RequestException as e:
        logger.error(f"Failed to check drift status: {e}")
        return False


def log_trigger_event(**context) -> dict:
    """Log the retraining trigger event."""
    import logging

    logger = logging.getLogger(__name__)

    execution_date = context.get("execution_date", datetime.now())
    logger.info(f"Retraining triggered at {execution_date} due to drift detection.")

    return {
        "triggered_at": (
            execution_date.isoformat()
            if hasattr(execution_date, "isoformat")
            else str(execution_date)
        ),
        "reason": "drift_detected",
        "triggered_dag": CONFIG["trigger_dag_id"],
    }


# =============================================================================
# DAG DEFINITION
# =============================================================================

with DAG(
    dag_id="retraining_trigger",
    default_args=DEFAULT_ARGS,
    description="Monitors drift and triggers retraining when detected",
    schedule_interval="@hourly",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["mlops", "drift", "retraining", "automation"],
    doc_md=__doc__,
) as dag:

    # Task 1: Check drift status and decide
    check_drift = ShortCircuitOperator(
        task_id="check_drift",
        python_callable=check_drift_and_decide,
        doc_md="Check drift status from API and short-circuit if no drift",
    )

    # Task 2: Trigger training pipeline
    trigger_training = TriggerDagRunOperator(
        task_id="trigger_training",
        trigger_dag_id=CONFIG["trigger_dag_id"],
        wait_for_completion=False,
        poke_interval=60,
        doc_md="Trigger the training_pipeline DAG",
    )

    # Task 3: Log the trigger event
    log_event = PythonOperator(
        task_id="log_trigger_event",
        python_callable=log_trigger_event,
        doc_md="Log the retraining trigger event",
    )

    # Task dependencies
    check_drift >> trigger_training >> log_event
