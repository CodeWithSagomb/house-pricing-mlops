import yaml
import pandas as pd
from sklearn.datasets import fetch_california_housing
import logging
import os
# Import relatif propre au package
from house_pricing.data.validation import validate_dataframe

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def load_config():
    with open("config/main.yaml", "r") as f:
        return yaml.safe_load(f)

def ingest_pipeline():
    """
    Pipeline complet : Ingestion -> Validation -> Sauvegarde Raw
    """
    config = load_config()
    raw_path = config['data']['raw_path']
    
    try:
        # 1. Ingestion
        logger.info("📡 Téléchargement du dataset California Housing...")
        data = fetch_california_housing(as_frame=True)
        df = data.frame
        
        # 2. Validation (Quality Gate)
        df_validated = validate_dataframe(df)
        
        # 3. Sauvegarde
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        df_validated.to_csv(raw_path, index=False)
        logger.info(f"✅ Données validées et sauvegardées dans : {raw_path}")
        
    except Exception as e:
        logger.error(f"❌ Echec du pipeline d'ingestion : {e}")
        raise e

if __name__ == "__main__":
    ingest_pipeline()
