import logging

import pandas as pd
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)


# Définition stricte d'une ligne de données valide
class HousingSchema(BaseModel):
    # Les noms correspondent au dataset California Housing
    MedInc: float = Field(..., ge=0, description="Median Income (doit être positif)")
    HouseAge: float = Field(..., ge=0, le=200, description="Age de la maison")
    AveRooms: float = Field(..., ge=0, description="Nombre moyen de chambres")
    AveBedrms: float = Field(..., ge=0)
    Population: float = Field(..., ge=0)
    AveOccup: float = Field(..., ge=0)
    Latitude: float = Field(
        ..., ge=32, le=42
    )  # Limites approximatives de la Californie
    Longitude: float = Field(..., ge=-125, le=-114)
    MedHouseVal: float = Field(..., ge=0)


def validate_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Valide un DataFrame entier selon le schéma Pydantic.
    Rejette les lignes invalides mais ne crashe pas le pipeline si < 5% d'erreurs.
    """
    logger.info("🛡️ Démarrage de la validation des données (Quality Gate)...")

    valid_rows = []
    errors = 0

    # On itère sur les lignes (optimisation possible avec pandera plus tard)
    for index, row in df.iterrows():
        try:
            # Validation Pydantic
            item = HousingSchema(**row.to_dict())
            valid_rows.append(item.model_dump())
        except ValidationError as e:
            errors += 1
            if (
                errors < 5
            ):  # On loggue seulement les premières erreurs pour ne pas spammer
                logger.warning(f"⚠️ Ligne {index} invalide : {e}")

    total_rows = len(df)
    error_rate = errors / total_rows

    logger.info(
        f"📊 Rapport Qualité : {len(valid_rows)} valides / {errors} invalides ({error_rate:.2%})"
    )

    # Règle du PRD : "Arrêt immédiat si qualité < 95%"
    if error_rate > 0.05:
        raise ValueError(
            f"❌ QUALITÉ CRITIQUE : Taux d'erreur {error_rate:.2%} supérieur au seuil de 5%. Pipeline stoppé."
        )

    return pd.DataFrame(valid_rows)
