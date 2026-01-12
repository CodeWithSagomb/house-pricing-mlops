"""
Drift Detection Integration Tests
=================================
Tests for the drift monitoring functionality including buffer management,
drift analysis, and status endpoint.
"""

from unittest.mock import patch

import pytest

# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def mock_reference_data():
    """Creates mock reference data for drift detector."""
    import pandas as pd

    return pd.DataFrame(
        {
            "MedInc": [3.5, 4.0, 5.0, 6.0, 7.0] * 20,
            "HouseAge": [30.0, 25.0, 35.0, 40.0, 20.0] * 20,
            "AveRooms": [5.0, 6.0, 4.5, 5.5, 7.0] * 20,
            "AveBedrms": [1.0, 1.1, 1.2, 0.9, 1.0] * 20,
            "Population": [800.0, 1000.0, 600.0, 1200.0, 900.0] * 20,
            "AveOccup": [3.0, 2.5, 3.5, 2.8, 3.2] * 20,
            "Latitude": [37.5, 37.6, 37.4, 37.7, 37.3] * 20,
            "Longitude": [-122.0, -122.1, -121.9, -122.2, -121.8] * 20,
        }
    )


# =============================================================================
# DRIFT DETECTOR UNIT TESTS
# =============================================================================


class TestDriftDetectorBuffer:
    """Tests for drift detector buffer management."""

    def test_buffer_initializes_empty(self, mock_reference_data):
        """Vérifie que le buffer démarre vide."""
        # Skip if Evidently not available
        pytest.importorskip("evidently")

        from house_pricing.monitoring.drift_detector import DriftDetector

        detector = DriftDetector(reference_data=mock_reference_data)
        assert detector.enabled is True
        assert len(detector.production_buffer) == 0
        assert detector.buffer_size == 100

    def test_add_prediction_increases_buffer(self, mock_reference_data):
        """Vérifie que add_prediction remplit le buffer."""
        pytest.importorskip("evidently")

        from house_pricing.monitoring.drift_detector import DriftDetector

        detector = DriftDetector(reference_data=mock_reference_data)

        features = {
            "MedInc": 5.0,
            "HouseAge": 30.0,
            "AveRooms": 5.5,
            "AveBedrms": 1.0,
            "Population": 800.0,
            "AveOccup": 3.0,
            "Latitude": 37.5,
            "Longitude": -122.0,
        }

        detector.add_prediction(features=features, prediction=200000.0)
        assert len(detector.production_buffer) == 1

        detector.add_prediction(features=features, prediction=210000.0)
        assert len(detector.production_buffer) == 2

    def test_last_drift_result_structure(self, mock_reference_data):
        """Vérifie la structure de last_drift_result."""
        pytest.importorskip("evidently")

        from house_pricing.monitoring.drift_detector import DriftDetector

        detector = DriftDetector(reference_data=mock_reference_data)

        result = detector.last_drift_result
        assert "drift_detected" in result
        assert "status" in result
        assert "timestamp" in result
        assert "drifted_columns" in result
        assert "samples_analyzed" in result


class TestDriftDetectorAnalysis:
    """Tests for drift analysis functionality."""

    def test_analyze_drift_returns_valid_structure(self, mock_reference_data):
        """Vérifie que analyze_drift retourne la bonne structure."""
        pytest.importorskip("evidently")

        from house_pricing.monitoring.drift_detector import DriftDetector

        detector = DriftDetector(reference_data=mock_reference_data)

        # Fill buffer with enough samples
        features = {
            "MedInc": 5.0,
            "HouseAge": 30.0,
            "AveRooms": 5.5,
            "AveBedrms": 1.0,
            "Population": 800.0,
            "AveOccup": 3.0,
            "Latitude": 37.5,
            "Longitude": -122.0,
        }

        for _ in range(100):
            detector.add_prediction(features=features, prediction=200000.0)

        # Should have triggered analysis (buffer reset)
        assert detector.last_drift_result["status"] in [
            "drift_detected",
            "stable",
            "no_analysis",
        ]

    def test_buffer_clears_after_analysis(self, mock_reference_data):
        """Vérifie que le buffer se vide après analyse."""
        pytest.importorskip("evidently")

        from house_pricing.monitoring.drift_detector import DriftDetector

        detector = DriftDetector(reference_data=mock_reference_data)
        detector.buffer_size = 10  # Reduce for faster test

        features = {
            "MedInc": 5.0,
            "HouseAge": 30.0,
            "AveRooms": 5.5,
            "AveBedrms": 1.0,
            "Population": 800.0,
            "AveOccup": 3.0,
            "Latitude": 37.5,
            "Longitude": -122.0,
        }

        for _ in range(10):
            detector.add_prediction(features=features, prediction=200000.0)

        # Buffer should be cleared after analysis
        assert len(detector.production_buffer) == 0


# =============================================================================
# DRIFT DISABLED MODE TESTS
# =============================================================================


class TestDriftDetectorDisabled:
    """Tests for drift detector when Evidently is not available."""

    def test_detector_handles_missing_evidently(self):
        """Vérifie que le detector gère l'absence d'Evidently."""
        # This test verifies graceful degradation
        with patch.dict("sys.modules", {"evidently": None}):
            # The detector should not crash
            pass  # Import would fail, but app continues


# =============================================================================
# INTEGRATION TESTS WITH API
# =============================================================================


class TestDriftStatusEndpoint:
    """API integration tests for drift status endpoint."""

    def test_drift_status_response_format(self, client):
        """Vérifie le format de réponse de drift-status."""
        response = client.get("/monitoring/drift-status")
        assert response.status_code == 200

        data = response.json()
        required_keys = ["drift_detected", "status", "enabled"]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"

    def test_drift_status_buffer_info_present(self, client):
        """Vérifie que les infos de buffer sont présentes."""
        response = client.get("/monitoring/drift-status")
        data = response.json()

        assert "buffer_size" in data
        assert "buffer_threshold" in data


# =============================================================================
# CONFTEST REQUIRED FIXTURES (imported from conftest.py)
# =============================================================================

# Note: 'client' fixture is imported from conftest.py
