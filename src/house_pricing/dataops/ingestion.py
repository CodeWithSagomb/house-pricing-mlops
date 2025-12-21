"""
DataOps Pipeline - Ingestion Step
==================================
Handles data ingestion from various sources with tracking.
"""

import logging
import os
from typing import Literal

import pandas as pd
from sklearn.datasets import fetch_california_housing

from house_pricing.dataops.base import PipelineContext, PipelineStep

logger = logging.getLogger(__name__)


class IngestionStep(PipelineStep):
    """
    Data ingestion step supporting multiple sources.
    Sources: sklearn (California Housing), file (CSV), database (future).
    """

    def __init__(
        self,
        source_type: Literal["sklearn", "file", "database"] = "sklearn",
        file_path: str = None,
    ):
        super().__init__("ingestion")
        self.source_type = source_type
        self.file_path = file_path

    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Ingest data from the configured source.
        """
        source_type = context.config.get("dataops", {}).get(
            "source_type", self.source_type
        )

        if source_type == "sklearn":
            df = self._ingest_sklearn()
        elif source_type == "file":
            file_path = self.file_path or context.config.get("data", {}).get("raw_path")
            df = self._ingest_file(file_path)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        # Update context
        context.df = df
        context.add_metadata(
            self.name,
            {
                "source_type": source_type,
                "row_count": len(df),
                "columns": list(df.columns),
                "memory_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
            },
        )

        self.logger.info(f"   Loaded {len(df)} rows, {len(df.columns)} columns")

        return context

    def _ingest_sklearn(self) -> pd.DataFrame:
        """Load California Housing dataset from sklearn."""
        self.logger.info("📡 Loading California Housing from sklearn...")
        data = fetch_california_housing(as_frame=True)
        return data.frame

    def _ingest_file(self, file_path: str) -> pd.DataFrame:
        """Load data from a CSV file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Data file not found: {file_path}")

        self.logger.info(f"📁 Loading data from {file_path}...")
        return pd.read_csv(file_path)
