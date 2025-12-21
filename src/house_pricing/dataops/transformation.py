"""
DataOps Pipeline - Transformation Step
========================================
Feature engineering with sklearn pipelines.
"""

import logging
import os

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from house_pricing.dataops.base import PipelineContext, PipelineStep

logger = logging.getLogger(__name__)


class TransformationStep(PipelineStep):
    """
    Feature engineering step:
    - Train/Test split
    - StandardScaler + Imputer
    - Saves preprocessor artifact
    """

    def __init__(self, target_column: str = "MedHouseVal"):
        super().__init__("transformation")
        self.target_column = target_column
        self.preprocessor = None

    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Transform data and save train/test splits.
        """
        if context.df is None:
            raise ValueError("No data to transform. Run validation first.")

        df = context.df
        config = context.config.get("data", {})

        # Configuration
        test_size = config.get("test_size", 0.2)
        random_state = config.get("random_state", 42)
        train_path = config.get("train_path", "data/processed/train.csv")
        test_path = config.get("test_path", "data/processed/test.csv")
        preprocessor_path = config.get(
            "preprocessor_path", "data/processed/preprocessor.pkl"
        )

        self.logger.info(f"🔧 Starting feature engineering (test_size={test_size})...")

        # 1. Split X/y
        X = df.drop(columns=[self.target_column])
        y = df[self.target_column]

        # 2. Train/Test split (BEFORE fitting preprocessor)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        self.logger.info(f"   Train: {len(X_train)} | Test: {len(X_test)}")

        # 3. Build preprocessor pipeline
        numeric_features = X.columns.tolist()
        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )

        self.preprocessor = ColumnTransformer(
            transformers=[("num", numeric_transformer, numeric_features)]
        )

        # 4. Fit on train, transform both
        X_train_processed = self.preprocessor.fit_transform(X_train)
        X_test_processed = self.preprocessor.transform(X_test)

        # 5. Reconstruct DataFrames
        train_df = pd.DataFrame(X_train_processed, columns=numeric_features)
        train_df[self.target_column] = y_train.values

        test_df = pd.DataFrame(X_test_processed, columns=numeric_features)
        test_df[self.target_column] = y_test.values

        # 6. Save artifacts
        os.makedirs(os.path.dirname(train_path), exist_ok=True)

        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)
        joblib.dump(self.preprocessor, preprocessor_path)

        self.logger.info(f"   Saved: {train_path}, {test_path}")
        self.logger.info(f"   Preprocessor: {preprocessor_path}")

        # Update context with train data for potential next steps
        context.df = train_df
        context.artifacts = {
            "train_path": train_path,
            "test_path": test_path,
            "preprocessor_path": preprocessor_path,
        }

        context.add_metadata(
            self.name,
            {
                "train_rows": len(train_df),
                "test_rows": len(test_df),
                "features": numeric_features,
                "test_size": test_size,
                "preprocessor_saved": True,
            },
        )

        return context
