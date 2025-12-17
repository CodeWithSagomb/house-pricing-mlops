import logging
import os

import git  # Pour tracker le commit hash
import mlflow
import mlflow.sklearn
import pandas as pd
import yaml
from dotenv import load_dotenv
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Import de notre Factory
from house_pricing.models.algorithms import ModelFactory

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def get_git_commit():
    repo = git.Repo(search_parent_directories=True)
    return repo.head.object.hexsha


def train_pipeline():
    # 1. Chargement des Configs
    main_config = load_yaml("config/main.yaml")
    model_config = load_yaml("config/model.yaml")

    # 2. Chargement des données Processed (Feature Engineering déjà fait !)
    train_path = main_config["data"]["train_path"]
    test_path = main_config["data"]["test_path"]

    logger.info(f"Chargement des données depuis {train_path}...")
    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)

    # Séparation X/y (On sait que la target est à la fin ou nommée MedHouseVal)
    target_col = "MedHouseVal"
    X_train = df_train.drop(columns=[target_col])
    y_train = df_train[target_col]
    X_test = df_test.drop(columns=[target_col])
    y_test = df_test[target_col]

    # 3. Initialisation MLflow
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))
    experiment_name = main_config["mlflow"]["experiment_name"]
    mlflow.set_experiment(experiment_name)

    # 4. Choix du modèle via la Factory
    model_type = model_config["training"]["model_type"]
    strategy = ModelFactory.get_model(model_type)

    # Paramètres pour le GridSearch
    param_grid = model_config[model_type]

    logger.info(f"Démarrage Run MLflow pour : {model_type}")

    with mlflow.start_run(run_name=f"train_{model_type}"):
        # A. Tagging (Traçabilité)
        mlflow.set_tag("git.commit", get_git_commit())
        mlflow.set_tag("model.type", model_type)
        mlflow.set_tag("author", "Sagombaye")

        # B. Entraînement (GridSearch interne)
        trained_model, best_params = strategy.train(
            X_train, y_train, param_grid, cv=model_config["training"]["cv_folds"]
        )

        # C. Log des Hyperparamètres (Les meilleurs trouvés)
        mlflow.log_params(best_params)

        # D. Evaluation sur le Test Set
        predictions = strategy.predict(X_test)

        mse = mean_squared_error(y_test, predictions)
        rmse = mse**0.5
        mae = mean_absolute_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)

        logger.info(f"Métriques -> RMSE: {rmse:.4f} | R2: {r2:.4f}")

        # E. Log des Métriques
        mlflow.log_metric("rmse", rmse)
        mlflow.log_metric("mae", mae)
        mlflow.log_metric("r2", r2)

        # F. Enregistrement du Modèle (Registry)
        # On loggue le modèle Scikit-Learn pur
        signature = mlflow.models.infer_signature(X_train, predictions)

        mlflow.sklearn.log_model(
            sk_model=trained_model,
            artifact_path="model",
            signature=signature,
            registered_model_name=f"HousePricing_{model_type}",  # Créer une version dans le Registry
        )

        # G. Enregistrement du Preprocessor (Dynamic Loading)
        # On suppose qu'il est déjà généré dans data/processed/ (par build_features.py)
        preprocessor_path = "data/processed/preprocessor.pkl"
        if os.path.exists(preprocessor_path):
            mlflow.log_artifact(preprocessor_path, artifact_path="preprocessor")
            logger.info("Preprocessor pushé sur MLflow Artifacts")
        else:
            logger.warning(
                "Attention : preprocessor.pkl non trouvé, il ne sera pas versionné !"
            )

        logger.info("Modèle pushé sur MLflow Registry (MinIO Backend)")


if __name__ == "__main__":
    train_pipeline()
