"""
Training Pipeline DAG
======================
Automated model training pipeline with MLflow integration.

This DAG orchestrates the complete training workflow:
1. Load preprocessed data
2. Train model with cross-validation
3. Evaluate on test set
4. Register model in MLflow
5. Optionally promote to champion

All configuration is externalized via environment variables.
"""

import os
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, Dict, Tuple

if TYPE_CHECKING:
    import numpy as np
    import pandas as pd

from airflow.operators.python import PythonOperator

from airflow import DAG

# =============================================================================
# CONFIGURATION
# =============================================================================
# All paths and settings from environment variables (no hardcoded values)

CONFIG = {
    "data": {
        "train_path": os.getenv(
            "TRAINING_DATA_PATH", "/opt/airflow/data/processed/train.csv"
        ),
        "test_path": os.getenv(
            "TRAINING_TEST_PATH", "/opt/airflow/data/processed/test.csv"
        ),
        "target_column": os.getenv("TRAINING_TARGET_COL", "MedHouseVal"),
    },
    "mlflow": {
        "tracking_uri": os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000"),
        "experiment_name": os.getenv("MLFLOW_EXPERIMENT", "HousePricing_Experiment"),
        "model_name": os.getenv("MLFLOW_MODEL_NAME", "HousePricing_RandomForest"),
    },
    "training": {
        "model_type": os.getenv("TRAINING_MODEL_TYPE", "random_forest"),
        "cv_folds": int(os.getenv("TRAINING_CV_FOLDS", "5")),
        "test_size": float(os.getenv("TRAINING_TEST_SIZE", "0.2")),
    },
}

# Default DAG arguments
DEFAULT_ARGS = {
    "owner": "Sagombaye",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}


# =============================================================================
# DATA LAYER
# =============================================================================


class DataLoader:
    """Responsible for loading and validating training data."""

    @staticmethod
    def load_dataset(path: str) -> "pd.DataFrame":
        """Load CSV dataset from path."""
        import pandas as pd

        if not os.path.exists(path):
            raise FileNotFoundError(f"Dataset not found: {path}")

        return pd.read_csv(path)

    @staticmethod
    def validate_dataset(df: "pd.DataFrame", target_col: str) -> bool:
        """Validate dataset has required structure."""
        if df.empty:
            raise ValueError("Dataset is empty")

        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found")

        if df.isnull().any().any():
            null_cols = df.columns[df.isnull().any()].tolist()
            raise ValueError(f"Null values found in columns: {null_cols}")

        return True

    @staticmethod
    def split_features_target(
        df: "pd.DataFrame", target_col: str
    ) -> Tuple["pd.DataFrame", "pd.Series"]:
        """Split dataframe into features and target."""
        X = df.drop(columns=[target_col])
        y = df[target_col]
        return X, y


# =============================================================================
# MODEL LAYER
# =============================================================================


class ModelTrainer:
    """Responsible for model training with cross-validation."""

    def __init__(self, model_type: str, cv_folds: int):
        self.model_type = model_type
        self.cv_folds = cv_folds
        self.model = None
        self.best_params = None

    def _get_model_and_params(self) -> Tuple[Any, Dict]:
        """Factory method to get model and parameter grid."""
        from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
        from sklearn.linear_model import Ridge

        models = {
            "random_forest": (
                RandomForestRegressor(random_state=42),
                {
                    "n_estimators": [100, 200],
                    "max_depth": [10, 20, None],
                    "min_samples_split": [2, 5],
                },
            ),
            "gradient_boosting": (
                GradientBoostingRegressor(random_state=42),
                {
                    "n_estimators": [100, 200],
                    "max_depth": [3, 5],
                    "learning_rate": [0.1, 0.05],
                },
            ),
            "ridge": (Ridge(), {"alpha": [0.1, 1.0, 10.0]}),
        }

        if self.model_type not in models:
            raise ValueError(f"Unknown model type: {self.model_type}")

        return models[self.model_type]

    def train(self, X: "pd.DataFrame", y: "pd.Series") -> Tuple[Any, Dict]:
        """Train model with GridSearchCV."""
        from sklearn.model_selection import GridSearchCV

        base_model, param_grid = self._get_model_and_params()

        grid_search = GridSearchCV(
            estimator=base_model,
            param_grid=param_grid,
            cv=self.cv_folds,
            scoring="neg_mean_squared_error",
            n_jobs=-1,
            verbose=1,
        )

        grid_search.fit(X, y)

        self.model = grid_search.best_estimator_
        self.best_params = grid_search.best_params_

        return self.model, self.best_params

    def predict(self, X: "pd.DataFrame") -> "np.ndarray":
        """Generate predictions."""
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first.")
        return self.model.predict(X)


# =============================================================================
# EVALUATION LAYER
# =============================================================================


class ModelEvaluator:
    """Responsible for model evaluation metrics."""

    @staticmethod
    def calculate_metrics(
        y_true: "pd.Series", y_pred: "np.ndarray"
    ) -> Dict[str, float]:
        """Calculate regression metrics."""
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

        mse = mean_squared_error(y_true, y_pred)

        return {
            "mse": mse,
            "rmse": mse**0.5,
            "mae": mean_absolute_error(y_true, y_pred),
            "r2": r2_score(y_true, y_pred),
        }


# =============================================================================
# MLFLOW LAYER
# =============================================================================


class MLflowManager:
    """Responsible for MLflow tracking and model registry."""

    def __init__(self, tracking_uri: str, experiment_name: str):
        import mlflow

        mlflow.set_tracking_uri(tracking_uri)
        mlflow.set_experiment(experiment_name)
        self.mlflow = mlflow

    def start_run(self, run_name: str):
        """Start MLflow run."""
        return self.mlflow.start_run(run_name=run_name)

    def log_params(self, params: Dict):
        """Log parameters."""
        self.mlflow.log_params(params)

    def log_metrics(self, metrics: Dict):
        """Log metrics."""
        for key, value in metrics.items():
            self.mlflow.log_metric(key, value)

    def log_tags(self, tags: Dict):
        """Log tags."""
        for key, value in tags.items():
            self.mlflow.set_tag(key, value)

    def register_model(self, model: Any, model_name: str, X_sample: "pd.DataFrame"):
        """Register model to MLflow registry."""
        import mlflow.sklearn

        signature = self.mlflow.models.infer_signature(
            X_sample, model.predict(X_sample)
        )

        mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path="model",
            signature=signature,
            registered_model_name=model_name,
        )

    def log_artifact(self, path: str, artifact_path: str = None):
        """Log artifact file."""
        if os.path.exists(path):
            self.mlflow.log_artifact(path, artifact_path=artifact_path)


# =============================================================================
# TASK FUNCTIONS
# =============================================================================


def task_load_data(**context) -> Dict:
    """Load and validate training data."""
    import logging

    logger = logging.getLogger(__name__)

    train_path = CONFIG["data"]["train_path"]
    test_path = CONFIG["data"]["test_path"]
    target_col = CONFIG["data"]["target_column"]

    logger.info(f"Loading training data from {train_path}")
    df_train = DataLoader.load_dataset(train_path)
    DataLoader.validate_dataset(df_train, target_col)

    logger.info(f"Loading test data from {test_path}")
    df_test = DataLoader.load_dataset(test_path)
    DataLoader.validate_dataset(df_test, target_col)

    logger.info(f"Data loaded: train={len(df_train)} rows, test={len(df_test)} rows")

    return {
        "train_rows": len(df_train),
        "test_rows": len(df_test),
        "features": len(df_train.columns) - 1,
    }


def task_train_model(**context) -> Dict:
    """Train model with cross-validation."""
    import logging

    logger = logging.getLogger(__name__)

    train_path = CONFIG["data"]["train_path"]
    target_col = CONFIG["data"]["target_column"]
    model_type = CONFIG["training"]["model_type"]
    cv_folds = CONFIG["training"]["cv_folds"]

    df_train = DataLoader.load_dataset(train_path)
    X_train, y_train = DataLoader.split_features_target(df_train, target_col)

    logger.info(f"Training {model_type} with {cv_folds}-fold CV")
    trainer = ModelTrainer(model_type, cv_folds)
    model, best_params = trainer.train(X_train, y_train)

    logger.info(f"Training complete. Best params: {best_params}")

    # Store model in XCom via pickle path
    import pickle

    model_path = "/tmp/trained_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump((model, best_params), f)

    return {
        "model_type": model_type,
        "best_params": best_params,
        "model_path": model_path,
    }


def task_evaluate_model(**context) -> Dict:
    """Evaluate model on test set."""
    import logging
    import pickle

    logger = logging.getLogger(__name__)

    test_path = CONFIG["data"]["test_path"]
    target_col = CONFIG["data"]["target_column"]

    # Load model from previous task
    model_path = "/tmp/trained_model.pkl"
    with open(model_path, "rb") as f:
        model, best_params = pickle.load(f)

    df_test = DataLoader.load_dataset(test_path)
    X_test, y_test = DataLoader.split_features_target(df_test, target_col)

    y_pred = model.predict(X_test)
    metrics = ModelEvaluator.calculate_metrics(y_test, y_pred)

    logger.info(
        f"Evaluation metrics: RMSE={metrics['rmse']:.4f}, R2={metrics['r2']:.4f}"
    )

    return metrics


def task_register_model(**context) -> Dict:
    """Register model in MLflow."""
    import logging
    import pickle

    logger = logging.getLogger(__name__)

    train_path = CONFIG["data"]["train_path"]
    target_col = CONFIG["data"]["target_column"]
    tracking_uri = CONFIG["mlflow"]["tracking_uri"]
    experiment_name = CONFIG["mlflow"]["experiment_name"]
    model_name = CONFIG["mlflow"]["model_name"]
    model_type = CONFIG["training"]["model_type"]

    # Load model
    model_path = "/tmp/trained_model.pkl"
    with open(model_path, "rb") as f:
        model, best_params = pickle.load(f)

    # Get metrics from XCom or recalculate if not available
    ti = context["ti"]
    metrics = ti.xcom_pull(task_ids="evaluate_model")

    # Fallback: recalculate metrics if XCom not available (test mode)
    if metrics is None:
        logger.info("XCom metrics not available, recalculating...")
        test_path = CONFIG["data"]["test_path"]
        df_test = DataLoader.load_dataset(test_path)
        X_test, y_test = DataLoader.split_features_target(df_test, target_col)
        y_pred = model.predict(X_test)
        metrics = ModelEvaluator.calculate_metrics(y_test, y_pred)

    # Load sample data for signature
    df_train = DataLoader.load_dataset(train_path)
    X_train, _ = DataLoader.split_features_target(df_train, target_col)

    # MLflow registration
    mlflow_mgr = MLflowManager(tracking_uri, experiment_name)

    with mlflow_mgr.start_run(run_name=f"airflow_{model_type}"):
        mlflow_mgr.log_tags(
            {
                "model.type": model_type,
                "author": "Sagombaye",
                "source": "airflow",
            }
        )
        mlflow_mgr.log_params(best_params)
        mlflow_mgr.log_metrics(metrics)
        mlflow_mgr.register_model(model, model_name, X_train.head(10))

        # Log preprocessor if exists
        preprocessor_path = "/opt/airflow/data/processed/preprocessor.pkl"
        mlflow_mgr.log_artifact(preprocessor_path, artifact_path="preprocessor")

    logger.info(f"Model registered as {model_name}")

    return {"model_name": model_name, "metrics": metrics}


# =============================================================================
# DAG DEFINITION
# =============================================================================

with DAG(
    dag_id="training_pipeline",
    default_args=DEFAULT_ARGS,
    description="Automated model training with MLflow integration",
    schedule_interval=None,
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["mlops", "training", "mlflow"],
    doc_md=__doc__,
) as dag:

    load_data = PythonOperator(
        task_id="load_data",
        python_callable=task_load_data,
        doc_md="Load and validate training/test datasets",
    )

    train_model = PythonOperator(
        task_id="train_model",
        python_callable=task_train_model,
        doc_md="Train model with GridSearchCV",
    )

    evaluate_model = PythonOperator(
        task_id="evaluate_model",
        python_callable=task_evaluate_model,
        doc_md="Evaluate model on test set",
    )

    register_model = PythonOperator(
        task_id="register_model",
        python_callable=task_register_model,
        doc_md="Register model in MLflow registry",
    )

    # Task dependencies
    load_data >> train_model >> evaluate_model >> register_model
