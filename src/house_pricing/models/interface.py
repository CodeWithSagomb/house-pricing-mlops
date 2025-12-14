from abc import ABC, abstractmethod
from typing import Any, Dict

import pandas as pd


class ModelStrategy(ABC):
    """
    Interface abstraite pour tous les modèles (Strategy Pattern).
    Garantit que tout modèle possède une méthode train et predict.
    """

    @abstractmethod
    def train(
        self, X_train: pd.DataFrame, y_train: pd.Series, param_grid: Dict[str, Any]
    ):
        """
        Entraîne le modèle (avec GridSearch inclus).
        Doit retourner le meilleur estimateur et les meilleurs paramètres.
        """
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame):
        """
        Effectue des prédictions.
        """
        pass
