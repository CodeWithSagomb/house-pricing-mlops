import pandas as pd
import yaml
import logging
import os
import joblib # Pour sauvegarder le pipeline
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def load_config():
    with open("config/main.yaml", "r") as f:
        return yaml.safe_load(f)

def build_features():
    logger.info(" Démarrage du Feature Engineering...")
    config = load_config()
    
    # 1. Chargement Raw
    raw_path = config['data']['raw_path']
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"❌ Données brutes absentes : {raw_path}")
    
    df = pd.read_csv(raw_path)
    
    # 2. Split Train/Test (CRUCIAL : Avant le processing)
    # On sépare X (Features) et y (Target)
    target_col = "MedHouseVal"
    X = df.drop(columns=[target_col])
    y = df[target_col]

    logger.info(f" Séparation Train/Test (Ratio: {config['data']['test_size']})")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=config['data']['test_size'], 
        random_state=config['data']['random_state']
    )

    # 3. Définition du Pipeline de Transformation
    # On identifie les colonnes numériques (toutes dans ce dataset)
    numeric_features = X.columns.tolist()

    # Pipeline :
    # a. Imputer : Remplace les valeurs manquantes par la médiane (robustesse)
    # b. Scaler : Standardise (Moyenne 0, Ecart-type 1) pour aider les modèles linéaires
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Le ColumnTransformer applique les transformations aux bonnes colonnes
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features)
        ]
    )

    # 4. Fit & Transform
    logger.info(" Entraînement du Preprocessor (Fit sur Train uniquement)...")
    
    # On 'Fit' sur le TRAIN seulement pour éviter la fuite de données
    X_train_processed = preprocessor.fit_transform(X_train)
    
    # On 'Transform' le TEST (avec les moyennes du Train)
    X_test_processed = preprocessor.transform(X_test)
    
    # 5. Reconstruction des DataFrames pour sauvegarde
    # (Le scaler renvoie des numpy arrays, on remet ça propre en DF)
    train_df = pd.DataFrame(X_train_processed, columns=numeric_features)
    train_df[target_col] = y_train.values # On remet la target

    test_df = pd.DataFrame(X_test_processed, columns=numeric_features)
    test_df[target_col] = y_test.values

    # 6. Sauvegarde
    os.makedirs("data/processed", exist_ok=True)
    
    # A. Sauvegarde des données transformées
    train_path = config['data']['train_path']
    test_path = config['data']['test_path']
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    # B. Sauvegarde de l'objet Preprocessor (L'intelligence)
    preprocessor_path = config['data']['preprocessor_path']
    joblib.dump(preprocessor, preprocessor_path)

    logger.info(f" Feature Engineering terminé.")
    logger.info(f"   Train set : {train_df.shape} -> {train_path}")
    logger.info(f"   Test set  : {test_df.shape} -> {test_path}")
    logger.info(f"   Preprocessor sauvegardé -> {preprocessor_path}")

if __name__ == "__main__":
    build_features()

