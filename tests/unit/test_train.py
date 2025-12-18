"""
Tests ML Pipeline - Axe 1 Enterprise MLOps
==========================================
Validates that training produces conformant models with acceptable metrics.
"""

import logging

import numpy as np
import pandas as pd
import pytest
from sklearn.datasets import make_regression

from house_pricing.models.algorithms import ModelFactory, RandomForestStrategy

logger = logging.getLogger(__name__)


# --- FIXTURES ---


@pytest.fixture
def synthetic_regression_data():
    """
    Génère des données synthétiques pour tester le training
    sans dépendre des vraies données.
    """
    X, y = make_regression(
        n_samples=500,
        n_features=8,
        n_informative=5,
        noise=0.1,
        random_state=42,
    )
    # Simule les noms de colonnes du dataset California Housing
    columns = [
        "MedInc",
        "HouseAge",
        "AveRooms",
        "AveBedrms",
        "Population",
        "AveOccup",
        "Latitude",
        "Longitude",
    ]
    X_df = pd.DataFrame(X, columns=columns)
    y_series = pd.Series(y, name="MedHouseVal")
    return X_df, y_series


@pytest.fixture
def simple_param_grid():
    """Grille de paramètres réduite pour tests rapides."""
    return {
        "n_estimators": [10],
        "max_depth": [5],
        "random_state": [42],
    }


# --- TESTS UNITAIRES ---


class TestModelFactory:
    """Tests du pattern Factory."""

    def test_get_random_forest_returns_strategy(self):
        """Vérifie que la factory retourne la bonne stratégie."""
        strategy = ModelFactory.get_model("random_forest")
        assert isinstance(strategy, RandomForestStrategy)

    def test_get_unknown_model_raises_error(self):
        """Vérifie qu'un type inconnu lève une exception."""
        with pytest.raises(ValueError, match="Modèle inconnu"):
            ModelFactory.get_model("xgboost")


class TestRandomForestStrategy:
    """Tests de la stratégie Random Forest."""

    def test_train_returns_model_and_params(
        self, synthetic_regression_data, simple_param_grid
    ):
        """Vérifie que train() retourne un modèle et les meilleurs params."""
        X, y = synthetic_regression_data
        strategy = RandomForestStrategy()

        model, best_params = strategy.train(X, y, simple_param_grid, cv=2)

        assert model is not None
        assert "n_estimators" in best_params
        assert "max_depth" in best_params

    def test_predict_returns_array(self, synthetic_regression_data, simple_param_grid):
        """Vérifie que predict() retourne un array de prédictions."""
        X, y = synthetic_regression_data
        strategy = RandomForestStrategy()
        strategy.train(X, y, simple_param_grid, cv=2)

        predictions = strategy.predict(X)

        assert isinstance(predictions, np.ndarray)
        assert len(predictions) == len(X)


class TestModelQualityGates:
    """
    Tests de qualité du modèle - CRITIQUES pour Enterprise.
    Ces tests échoueront si le modèle ne répond pas aux standards minimum.
    """

    def test_model_rmse_below_threshold(
        self, synthetic_regression_data, simple_param_grid
    ):
        """
        GATE: Le RMSE doit être inférieur au seuil acceptable.
        Seuil adapté aux données synthétiques.
        """
        X, y = synthetic_regression_data
        strategy = RandomForestStrategy()
        model, _ = strategy.train(X, y, simple_param_grid, cv=2)

        predictions = strategy.predict(X)
        rmse = np.sqrt(np.mean((y - predictions) ** 2))

        # Seuil: le RMSE doit être raisonnable (adapté aux données synthétiques)
        MAX_ACCEPTABLE_RMSE = 50.0  # Ajuster selon le contexte réel
        assert (
            rmse < MAX_ACCEPTABLE_RMSE
        ), f"RMSE {rmse:.4f} > seuil {MAX_ACCEPTABLE_RMSE}"
        logger.info(f"✅ RMSE Gate passed: {rmse:.4f}")

    def test_model_r2_above_threshold(
        self, synthetic_regression_data, simple_param_grid
    ):
        """
        GATE: Le R² doit être supérieur au seuil minimum.
        Un modèle de production doit expliquer une part significative de la variance.
        """
        X, y = synthetic_regression_data
        strategy = RandomForestStrategy()
        model, _ = strategy.train(X, y, simple_param_grid, cv=2)

        predictions = strategy.predict(X)
        ss_res = np.sum((y - predictions) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1 - (ss_res / ss_tot)

        # Seuil: R² minimum de 0.5 (le modèle doit expliquer 50% de la variance)
        MIN_ACCEPTABLE_R2 = 0.5
        assert r2 > MIN_ACCEPTABLE_R2, f"R² {r2:.4f} < seuil {MIN_ACCEPTABLE_R2}"
        logger.info(f"✅ R² Gate passed: {r2:.4f}")

    def test_predictions_are_positive(
        self, synthetic_regression_data, simple_param_grid
    ):
        """
        GATE: Les prix prédits doivent être positifs.
        Un prix de maison négatif n'a pas de sens métier.
        """
        X, y = synthetic_regression_data
        # Force les targets à être positives (comme des prix réels)
        y_positive = np.abs(y) + 1

        strategy = RandomForestStrategy()
        strategy.train(X, y_positive, simple_param_grid, cv=2)

        predictions = strategy.predict(X)

        # Au moins 95% des prédictions doivent être positives
        positive_ratio = np.mean(predictions > 0)
        assert positive_ratio > 0.95, f"Seulement {positive_ratio:.2%} positives"


class TestModelReproducibility:
    """Tests de reproductibilité - Core pour MLOps."""

    def test_same_seed_produces_same_results(
        self, synthetic_regression_data, simple_param_grid
    ):
        """
        Vérifie que le même random_state produit des résultats identiques.
        """
        X, y = synthetic_regression_data

        strategy1 = RandomForestStrategy()
        strategy1.train(X, y, simple_param_grid, cv=2)
        preds1 = strategy1.predict(X)

        strategy2 = RandomForestStrategy()
        strategy2.train(X, y, simple_param_grid, cv=2)
        preds2 = strategy2.predict(X)

        np.testing.assert_array_almost_equal(
            preds1, preds2, decimal=5, err_msg="Résultats non reproductibles!"
        )
