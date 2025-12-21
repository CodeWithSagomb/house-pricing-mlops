"""
DataOps Pipeline - Base Classes
================================
Abstract base class and context object for modular pipeline architecture.
"""

import logging
import os
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import git
import pandas as pd
import psycopg2
from psycopg2.extras import Json

logger = logging.getLogger(__name__)


@dataclass
class PipelineContext:
    """
    Shared context object passed between pipeline steps.
    Accumulates data, metadata, and tracking information.
    """

    # Core data
    df: Optional[pd.DataFrame] = None

    # Run tracking
    run_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    started_at: datetime = field(default_factory=datetime.now)

    # Git tracking
    git_commit: str = ""

    # Configuration
    config: dict = field(default_factory=dict)

    # Metadata accumulator (each step adds its metrics)
    metadata: dict = field(default_factory=dict)

    # Path tracking
    artifacts: dict = field(default_factory=dict)

    def __post_init__(self):
        """Initialize git commit hash."""
        try:
            repo = git.Repo(search_parent_directories=True)
            self.git_commit = repo.head.object.hexsha[:8]
        except Exception:
            self.git_commit = "unknown"

    def add_metadata(self, step_name: str, data: dict):
        """Add metadata from a pipeline step."""
        self.metadata[step_name] = {
            "timestamp": datetime.now().isoformat(),
            **data,
        }

    def to_summary(self) -> dict:
        """Return a summary of the pipeline run."""
        return {
            "run_id": self.run_id,
            "git_commit": self.git_commit,
            "started_at": self.started_at.isoformat(),
            "steps_completed": list(self.metadata.keys()),
            "final_shape": self.df.shape if self.df is not None else None,
        }


class PipelineStep(ABC):
    """
    Abstract base class for all pipeline steps.
    Implements the Template Method pattern.
    """

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"dataops.{name}")

    @abstractmethod
    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Execute the pipeline step logic.
        Must be implemented by subclasses.

        Args:
            context: The shared pipeline context.

        Returns:
            Updated pipeline context.
        """
        pass

    def run(self, context: PipelineContext) -> PipelineContext:
        """
        Template method that wraps execute with logging and error handling.
        """
        self.logger.info(f"▶️  Starting step: {self.name}")
        start_time = datetime.now()

        try:
            context = self.execute(context)

            elapsed = (datetime.now() - start_time).total_seconds()
            self.logger.info(f"✅ Completed step: {self.name} ({elapsed:.2f}s)")

            # Log to database if enabled
            if context.config.get("dataops", {}).get("db_logging", False):
                self._log_to_db(context)

            return context

        except Exception as e:
            self.logger.error(f"❌ Failed step: {self.name} - {e}")
            raise

    def _log_to_db(self, context: PipelineContext):
        """Log step execution to PostgreSQL data_lineage table."""
        try:
            db_config = {
                "host": os.getenv("POSTGRES_HOST", "localhost"),
                "port": os.getenv("POSTGRES_PORT", "5432"),
                "user": os.getenv("POSTGRES_USER", "mlops"),
                "password": os.getenv("POSTGRES_PASSWORD", "mlops_password"),
                "database": os.getenv("POSTGRES_DB", "mlflow_db"),
            }

            conn = psycopg2.connect(**db_config)
            cur = conn.cursor()

            # Insert lineage record
            cur.execute(
                """
                INSERT INTO data_lineage
                (run_id, step_name, git_commit, row_count, columns_count, status, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    context.run_id,
                    self.name,
                    context.git_commit,
                    len(context.df) if context.df is not None else 0,
                    len(context.df.columns) if context.df is not None else 0,
                    "success",
                    Json(context.metadata.get(self.name, {})),
                ),
            )

            conn.commit()
            cur.close()
            conn.close()
            self.logger.debug(f"📝 Logged to data_lineage: {self.name}")

        except Exception as e:
            self.logger.warning(f"⚠️ DB logging failed (non-blocking): {e}")


class DataPipeline:
    """
    Orchestrator that chains multiple pipeline steps.
    """

    def __init__(self, steps: list[PipelineStep]):
        self.steps = steps
        self.logger = logging.getLogger("dataops.pipeline")

    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Execute all steps in sequence.

        Args:
            context: Initial pipeline context.

        Returns:
            Final pipeline context after all steps.
        """
        self.logger.info(f"🚀 Starting pipeline with {len(self.steps)} steps")
        self.logger.info(f"   Run ID: {context.run_id}")
        self.logger.info(f"   Git Commit: {context.git_commit}")

        for step in self.steps:
            context = step.run(context)

        self.logger.info("🎉 Pipeline completed successfully!")
        self.logger.info(f"   Summary: {context.to_summary()}")

        return context
