import logging

from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV

from house_pricing.models.interface import ModelStrategy

logger = logging.getLogger(__name__)


class LinearRegressionStrategy(ModelStrategy):
    def __init__(self):
        self.model = None
        self.best_params = {}

    def train(
        self, X_train, y_train, param_grid, cv=3, scoring="neg_root_mean_squared_error"
    ):
        logger.info("Entraînement : Linear Regression avec GridSearchCV")
        grid = GridSearchCV(
            LinearRegression(), param_grid, cv=cv, scoring=scoring, n_jobs=-1
        )
        grid.fit(X_train, y_train)

        self.model = grid.best_estimator_
        self.best_params = grid.best_params_
        logger.info(f"Meilleurs params Linear : {self.best_params}")
        return self.model, self.best_params

    def predict(self, X):
        return self.model.predict(X)


class RandomForestStrategy(ModelStrategy):
    def __init__(self):
        self.model = None
        self.best_params = {}

    def train(
        self, X_train, y_train, param_grid, cv=3, scoring="neg_root_mean_squared_error"
    ):
        logger.info("Entraînement : Random Forest avec GridSearchCV")
        grid = GridSearchCV(
            RandomForestRegressor(), param_grid, cv=cv, scoring=scoring, n_jobs=-1
        )
        grid.fit(X_train, y_train)

        self.model = grid.best_estimator_
        self.best_params = grid.best_params_
        logger.info(f"Meilleurs params RF : {self.best_params}")
        return self.model, self.best_params

    def predict(self, X):
        return self.model.predict(X)


# --- LE FACTORY PATTERN ---
class ModelFactory:
    @staticmethod
    def get_model(model_type: str) -> ModelStrategy:
        if model_type == "linear_regression":
            return LinearRegressionStrategy()
        elif model_type == "random_forest":
            return RandomForestStrategy()
        else:
            raise ValueError(f"Modèle inconnu : {model_type}")
