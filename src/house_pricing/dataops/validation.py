"""
DataOps Pipeline - Validation Step
====================================
Data quality validation using Pandera schemas.
"""

import logging
from typing import Literal

import pandas as pd
from pandera.errors import SchemaErrors

from house_pricing.data.contracts import validate_raw_data
from house_pricing.dataops.base import PipelineContext, PipelineStep

logger = logging.getLogger(__name__)


class ValidationStep(PipelineStep):
    """
    Data validation step using Pandera contracts.
    Supports strict (fail on any error) and permissive (log and filter) modes.
    """

    def __init__(self, mode: Literal["strict", "permissive"] = "strict"):
        super().__init__("validation")
        self.mode = mode

    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Validate data against the RawDataSchema.
        """
        if context.df is None:
            raise ValueError("No data to validate. Run ingestion first.")

        mode = context.config.get("dataops", {}).get("validation_mode", self.mode)
        initial_count = len(context.df)

        self.logger.info(f"🔍 Validating {initial_count} rows (mode: {mode})...")

        if mode == "strict":
            df_validated = self._validate_strict(context.df)
        else:
            df_validated = self._validate_permissive(context.df)

        final_count = len(df_validated)
        valid_ratio = final_count / initial_count if initial_count > 0 else 0

        # Update context
        context.df = df_validated
        context.add_metadata(
            self.name,
            {
                "mode": mode,
                "initial_count": initial_count,
                "valid_count": final_count,
                "rejected_count": initial_count - final_count,
                "valid_ratio": round(valid_ratio, 4),
            },
        )

        self.logger.info(
            f"   Validation: {final_count}/{initial_count} rows passed ({valid_ratio:.1%})"
        )

        # Quality gate: fail if valid ratio < 95%
        if valid_ratio < 0.95:
            raise ValueError(
                f"Quality gate failed: only {valid_ratio:.1%} valid (minimum 95%)"
            )

        return context

    def _validate_strict(self, df: pd.DataFrame) -> pd.DataFrame:
        """Strict mode: fail on any validation error."""
        return validate_raw_data(df)

    def _validate_permissive(self, df: pd.DataFrame) -> pd.DataFrame:
        """Permissive mode: log errors and return valid rows only."""
        try:
            return validate_raw_data(df)
        except SchemaErrors as e:
            self.logger.warning(f"⚠️ Validation errors found: {len(e.failure_cases)}")

            # Get indices of invalid rows
            invalid_indices = set()
            for _, failure in e.failure_cases.iterrows():
                if "index" in failure:
                    invalid_indices.add(failure["index"])

            # Return only valid rows
            valid_mask = ~df.index.isin(invalid_indices)
            return df[valid_mask].reset_index(drop=True)
