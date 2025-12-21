"""
DataOps Pipeline - Main Orchestrator
======================================
Entry point for running the complete data pipeline.
"""

import logging
import os
import sys

import yaml

from house_pricing.dataops.base import DataPipeline, PipelineContext
from house_pricing.dataops.ingestion import IngestionStep
from house_pricing.dataops.transformation import TransformationStep
from house_pricing.dataops.validation import ValidationStep
from house_pricing.dataops.versioning import VersioningStep

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("dataops")


def load_config(config_path: str = "config/main.yaml") -> dict:
    """Load pipeline configuration from YAML."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def run_pipeline(config_path: str = "config/main.yaml") -> PipelineContext:
    """
    Execute the complete DataOps pipeline.

    Pipeline Steps:
    1. Ingestion - Load data from source
    2. Validation - Validate against Pandera schemas
    3. Transformation - Feature engineering + train/test split
    4. Versioning - DVC tracking and push to MinIO

    Args:
        config_path: Path to the configuration YAML file.

    Returns:
        PipelineContext with all metadata from the run.
    """
    logger.info("=" * 60)
    logger.info("🚀 DATAOPS PIPELINE - Starting")
    logger.info("=" * 60)

    # Load configuration
    config = load_config(config_path)

    # Initialize context
    context = PipelineContext(config=config)

    # Define pipeline steps
    pipeline = DataPipeline(
        [
            IngestionStep(),
            ValidationStep(),
            TransformationStep(),
            VersioningStep(),
        ]
    )

    # Execute pipeline
    try:
        context = pipeline.execute(context)

        logger.info("=" * 60)
        logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
        logger.info(f"   Run ID: {context.run_id}")
        logger.info(f"   Steps: {list(context.metadata.keys())}")
        logger.info("=" * 60)

        return context

    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"❌ PIPELINE FAILED: {e}")
        logger.error("=" * 60)
        raise


def create_lineage_table():
    """
    Create the data_lineage table in PostgreSQL if it doesn't exist.
    Run this once before enabling db_logging.
    """
    import psycopg2

    db_config = {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": os.getenv("POSTGRES_USER", "mlops"),
        "password": os.getenv("POSTGRES_PASSWORD", "mlops_password"),
        "database": os.getenv("POSTGRES_DB", "mlflow_db"),
    }

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS data_lineage (
        id SERIAL PRIMARY KEY,
        run_id VARCHAR(36) NOT NULL,
        step_name VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        git_commit VARCHAR(40),
        row_count INTEGER,
        columns_count INTEGER,
        dvc_hash VARCHAR(32),
        status VARCHAR(20),
        metadata JSONB
    );

    CREATE INDEX IF NOT EXISTS idx_lineage_run_id ON data_lineage(run_id);
    CREATE INDEX IF NOT EXISTS idx_lineage_timestamp ON data_lineage(timestamp);
    """

    try:
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()
        cur.execute(create_table_sql)
        conn.commit()
        cur.close()
        conn.close()
        logger.info("✅ data_lineage table created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create table: {e}")
        raise


if __name__ == "__main__":
    # Check for --init-db flag
    if len(sys.argv) > 1 and sys.argv[1] == "--init-db":
        create_lineage_table()
    else:
        run_pipeline()
