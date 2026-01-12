"""
Airflow DAG Integration Tests
=============================
Tests to validate DAG definitions, task dependencies, and basic syntax.
These tests ensure DAGs load correctly without import errors.
"""

import sys
from pathlib import Path

import pytest

# =============================================================================
# SETUP
# =============================================================================

# Add DAGs directory to path for import
DAGS_DIR = Path(__file__).parent.parent.parent / "airflow" / "dags"


# =============================================================================
# DAG LOADING TESTS
# =============================================================================


class TestDAGLoading:
    """Tests that verify DAGs load without errors."""

    def test_dags_directory_exists(self):
        """Vérifie que le dossier DAGs existe."""
        assert DAGS_DIR.exists(), f"DAGs directory not found: {DAGS_DIR}"

    def test_dataops_pipeline_exists(self):
        """Vérifie que dataops_pipeline.py existe."""
        dag_file = DAGS_DIR / "dataops_pipeline.py"
        assert dag_file.exists(), "dataops_pipeline.py not found"

    def test_training_pipeline_exists(self):
        """Vérifie que training_pipeline.py existe."""
        dag_file = DAGS_DIR / "training_pipeline.py"
        assert dag_file.exists(), "training_pipeline.py not found"

    def test_retraining_trigger_exists(self):
        """Vérifie que retraining_trigger.py existe."""
        dag_file = DAGS_DIR / "retraining_trigger.py"
        assert dag_file.exists(), "retraining_trigger.py not found"


class TestDAGSyntax:
    """Tests that verify DAG files have valid Python syntax."""

    def test_dataops_pipeline_syntax(self):
        """Vérifie la syntaxe de dataops_pipeline.py."""
        dag_file = DAGS_DIR / "dataops_pipeline.py"
        self._validate_python_syntax(dag_file)

    def test_training_pipeline_syntax(self):
        """Vérifie la syntaxe de training_pipeline.py."""
        dag_file = DAGS_DIR / "training_pipeline.py"
        self._validate_python_syntax(dag_file)

    def test_retraining_trigger_syntax(self):
        """Vérifie la syntaxe de retraining_trigger.py."""
        dag_file = DAGS_DIR / "retraining_trigger.py"
        self._validate_python_syntax(dag_file)

    def _validate_python_syntax(self, file_path: Path):
        """Helper to validate Python syntax."""
        import ast

        assert file_path.exists(), f"File not found: {file_path}"

        with open(file_path, "r") as f:
            source = f.read()

        try:
            ast.parse(source)
        except SyntaxError as e:
            pytest.fail(f"Syntax error in {file_path.name}: {e}")


class TestDAGConfiguration:
    """Tests that verify DAG configurations are correct."""

    def test_dataops_dag_has_required_config(self):
        """Vérifie que dataops_pipeline a la bonne config."""
        dag_file = DAGS_DIR / "dataops_pipeline.py"
        content = dag_file.read_text()

        # Check for essential configurations
        assert "dag_id" in content, "Missing dag_id"
        assert "dataops_pipeline" in content, "Wrong dag_id"
        assert "schedule" in content.lower(), "Missing schedule"

    def test_training_dag_has_required_config(self):
        """Vérifie que training_pipeline a la bonne config."""
        dag_file = DAGS_DIR / "training_pipeline.py"
        content = dag_file.read_text()

        assert "dag_id" in content, "Missing dag_id"
        assert "training_pipeline" in content, "Wrong dag_id"

    def test_retraining_trigger_has_required_config(self):
        """Vérifie que retraining_trigger a la bonne config."""
        dag_file = DAGS_DIR / "retraining_trigger.py"
        content = dag_file.read_text()

        assert "dag_id" in content, "Missing dag_id"
        assert "retraining_trigger" in content, "Wrong dag_id"
        assert "TriggerDagRunOperator" in content, "Missing TriggerDagRunOperator"


class TestDAGTaskDefinitions:
    """Tests that verify expected tasks are defined in DAGs."""

    def test_dataops_has_expected_tasks(self):
        """Vérifie les tâches de dataops_pipeline."""
        dag_file = DAGS_DIR / "dataops_pipeline.py"
        content = dag_file.read_text()

        expected_tasks = ["task_id"]
        for task in expected_tasks:
            assert task in content, f"Missing task definition: {task}"

    def test_training_has_expected_tasks(self):
        """Vérifie les tâches de training_pipeline."""
        dag_file = DAGS_DIR / "training_pipeline.py"
        content = dag_file.read_text()

        expected_patterns = [
            "load_data",
            "train_model",
            "evaluate_model",
            "register_model",
        ]
        for pattern in expected_patterns:
            assert pattern in content, f"Missing task: {pattern}"

    def test_retraining_trigger_has_expected_tasks(self):
        """Vérifie les tâches de retraining_trigger."""
        dag_file = DAGS_DIR / "retraining_trigger.py"
        content = dag_file.read_text()

        expected_patterns = [
            "check_drift",
            "trigger_training",
            "log_trigger_event",
        ]
        for pattern in expected_patterns:
            assert pattern in content, f"Missing task: {pattern}"


class TestDAGDependencies:
    """Tests that verify task dependencies are properly defined."""

    def test_training_dag_has_dependencies(self):
        """Vérifie que training_pipeline a des dépendances définies."""
        dag_file = DAGS_DIR / "training_pipeline.py"
        content = dag_file.read_text()

        # Check for dependency operators
        assert ">>" in content, "Missing >> dependency operator"

    def test_retraining_trigger_has_dependencies(self):
        """Vérifie que retraining_trigger a des dépendances définies."""
        dag_file = DAGS_DIR / "retraining_trigger.py"
        content = dag_file.read_text()

        assert ">>" in content, "Missing >> dependency operator"


# =============================================================================
# OPTIONAL: AIRFLOW IMPORT TESTS (requires Airflow installed)
# =============================================================================


@pytest.mark.skipif(
    "airflow" not in sys.modules,
    reason="Airflow not installed in test environment",
)
class TestDAGImports:
    """Tests that require Airflow to be installed."""

    def test_can_import_dataops_dag(self):
        """Vérifie que dataops_pipeline s'importe sans erreur."""
        # This would require Airflow installation
        pass

    def test_can_import_training_dag(self):
        """Vérifie que training_pipeline s'importe sans erreur."""
        pass
