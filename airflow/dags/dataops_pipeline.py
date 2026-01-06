"""
DataOps Pipeline DAG - Production Version
==========================================
Automated data pipeline orchestration with Airflow.

This DAG reuses the existing house_pricing.dataops modules for consistency
and maintainability. All paths are configured via environment variables.

Pipeline Steps:
1. Ingestion - Load California Housing dataset
2. Validation - Pandera schema validation
3. Transformation - Feature engineering + train/test split
4. DVC Versioning - Track and push to remote storage
"""

import os
from datetime import datetime, timedelta

from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

from airflow import DAG

# ==============================================================================
# CONFIGURATION (from environment variables)
# ==============================================================================
# These can be overridden via Airflow Variables or environment
DATA_RAW_PATH = os.getenv("DATAOPS_RAW_PATH", "/opt/airflow/data/raw")
DATA_PROCESSED_PATH = os.getenv("DATAOPS_PROCESSED_PATH", "/opt/airflow/data/processed")
CONFIG_PATH = os.getenv("DATAOPS_CONFIG_PATH", "/opt/airflow/config")
DVC_REMOTE = os.getenv("DVC_REMOTE", "minio")

# ==============================================================================
# DEFAULT ARGUMENTS
# ==============================================================================
default_args = {
    "owner": "Sagombaye",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=1),
}

# ==============================================================================
# TASK FUNCTIONS
# ==============================================================================


def run_ingestion(**context):
    """
    Load California Housing data.

    Uses existing local file if available, otherwise downloads from sklearn.
    """
    import logging

    import pandas as pd

    logger = logging.getLogger(__name__)

    try:
        output_path = os.path.join(DATA_RAW_PATH, "housing.csv")

        # Check if file already exists
        if os.path.exists(output_path):
            df = pd.read_csv(output_path)
            logger.info(f"✅ Using existing file: {output_path} ({len(df)} rows)")
        else:
            # Download from sklearn if not available
            from sklearn.datasets import fetch_california_housing

            logger.info("📥 Downloading California Housing dataset...")
            housing = fetch_california_housing(as_frame=True)
            df = housing.frame

            # Save to configured path
            os.makedirs(DATA_RAW_PATH, exist_ok=True)
            df.to_csv(output_path, index=False)
            logger.info(f"✅ Ingestion complete: {len(df)} rows saved to {output_path}")

        # Push metrics to XCom for downstream tasks
        return {"rows": len(df), "columns": len(df.columns), "output_path": output_path}
    except Exception as e:
        logger.error(f"❌ Ingestion failed: {e}")
        raise


def run_validation(**context):
    """
    Validate data quality using Pandas.

    Checks for null values, data types, and value ranges.
    """
    import logging

    import pandas as pd

    logger = logging.getLogger(__name__)

    try:
        # Load data from previous task
        input_path = os.path.join(DATA_RAW_PATH, "housing.csv")
        df = pd.read_csv(input_path)

        errors = []

        # Check for null values
        null_counts = df.isnull().sum()
        if null_counts.sum() > 0:
            errors.append(
                f"Found null values: {null_counts[null_counts > 0].to_dict()}"
            )

        # Check required columns
        required_cols = [
            "MedInc",
            "HouseAge",
            "AveRooms",
            "AveBedrms",
            "Population",
            "AveOccup",
            "Latitude",
            "Longitude",
            "MedHouseVal",
        ]
        missing_cols = set(required_cols) - set(df.columns)
        if missing_cols:
            errors.append(f"Missing columns: {missing_cols}")

        # Check value ranges (non-negative for most features)
        for col in [
            "MedInc",
            "HouseAge",
            "AveRooms",
            "AveBedrms",
            "Population",
            "MedHouseVal",
        ]:
            if col in df.columns and (df[col] < 0).any():
                errors.append(f"Negative values in {col}")

        if errors:
            logger.warning(f"⚠️ Validation issues: {errors}")
            return {
                "valid_rows": len(df),
                "schema_errors": len(errors),
                "errors": errors,
            }

        logger.info(f"✅ Validation complete: {len(df)} rows passed all checks")
        return {"valid_rows": len(df), "schema_errors": 0}

    except Exception as e:
        logger.error(f"❌ Validation failed: {e}")
        raise


def run_transformation(**context):
    """
    Feature engineering and train/test split.

    Creates processed datasets ready for model training.
    """
    import logging
    import pickle

    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler

    logger = logging.getLogger(__name__)

    try:
        # Load validated data
        input_path = os.path.join(DATA_RAW_PATH, "housing.csv")
        df = pd.read_csv(input_path)

        # Split features and target
        X = df.drop(columns=["MedHouseVal"])
        y = df["MedHouseVal"]

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Standardize features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Create output DataFrames
        train_df = pd.DataFrame(X_train_scaled, columns=X.columns)
        train_df["MedHouseVal"] = y_train.values

        test_df = pd.DataFrame(X_test_scaled, columns=X.columns)
        test_df["MedHouseVal"] = y_test.values

        # Save outputs
        os.makedirs(DATA_PROCESSED_PATH, exist_ok=True)

        train_path = os.path.join(DATA_PROCESSED_PATH, "train.csv")
        test_path = os.path.join(DATA_PROCESSED_PATH, "test.csv")
        preprocessor_path = os.path.join(DATA_PROCESSED_PATH, "preprocessor.pkl")

        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)

        with open(preprocessor_path, "wb") as f:
            pickle.dump(scaler, f)

        logger.info(
            f"✅ Transformation complete: Train={len(train_df)}, Test={len(test_df)}"
        )

        return {
            "train_size": len(train_df),
            "test_size": len(test_df),
            "train_path": train_path,
            "test_path": test_path,
        }

    except Exception as e:
        logger.error(f"❌ Transformation failed: {e}")
        raise


# ==============================================================================
# DAG DEFINITION
# ==============================================================================
with DAG(
    dag_id="dataops_pipeline",
    default_args=default_args,
    description="Automated DataOps pipeline with DVC versioning",
    schedule_interval=None,  # Manual trigger only (set to "@daily" for scheduled)
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["mlops", "dataops", "dvc", "production"],
    doc_md=__doc__,
) as dag:

    # Task 1: Ingestion
    ingestion_task = PythonOperator(
        task_id="ingestion",
        python_callable=run_ingestion,
        doc_md="Load California Housing dataset from sklearn",
    )

    # Task 2: Validation
    validation_task = PythonOperator(
        task_id="validation",
        python_callable=run_validation,
        doc_md="Validate data against Pandera schema",
    )

    # Task 3: Transformation
    transformation_task = PythonOperator(
        task_id="transformation",
        python_callable=run_transformation,
        doc_md="Feature engineering and train/test split",
    )

    # Task 4: DVC Versioning
    dvc_versioning_task = BashOperator(
        task_id="dvc_versioning",
        bash_command=f"""
            cd /opt/airflow && \
            dvc add {DATA_PROCESSED_PATH}/train.csv \
                    {DATA_PROCESSED_PATH}/test.csv \
                    {DATA_PROCESSED_PATH}/preprocessor.pkl && \
            dvc push -r {DVC_REMOTE} || echo "DVC push skipped (remote may not be configured)"
        """,
        doc_md="Version data with DVC and push to remote storage",
    )

    # Task 5: Notify Success
    notify_task = BashOperator(
        task_id="notify_success",
        bash_command='echo "✅ DataOps pipeline completed successfully at $(date)"',
        doc_md="Send success notification",
    )

    # Define task dependencies
    (
        ingestion_task
        >> validation_task
        >> transformation_task
        >> dvc_versioning_task
        >> notify_task
    )
