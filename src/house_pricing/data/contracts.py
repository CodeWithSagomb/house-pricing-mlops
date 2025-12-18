"""
Data Contracts - Axe 2 Enterprise MLOps
=======================================
Pandera schemas for strict data validation at each pipeline stage.
"""

from pandera import Check, Column, DataFrameSchema
from pandera.typing import DataFrame

# --- SCHEMA 1: RAW DATA ---
# Données brutes après ingestion, avant preprocessing

RawDataSchema = DataFrameSchema(
    {
        "MedInc": Column(
            float,
            checks=[
                Check.ge(0, error="MedInc doit être >= 0"),
                Check.le(20, error="MedInc suspicieusement élevé (> 20)"),
            ],
            description="Median income in block group",
        ),
        "HouseAge": Column(
            float,
            checks=[
                Check.ge(0, error="HouseAge ne peut pas être négatif"),
                Check.le(100, error="HouseAge > 100 ans semble incohérent"),
            ],
            description="Median house age in block group",
        ),
        "AveRooms": Column(
            float,
            checks=Check.ge(0, error="AveRooms doit être >= 0"),
            description="Average number of rooms per household",
        ),
        "AveBedrms": Column(
            float,
            checks=Check.ge(0, error="AveBedrms doit être >= 0"),
            description="Average number of bedrooms per household",
        ),
        "Population": Column(
            float,
            checks=Check.ge(0, error="Population doit être >= 0"),
            description="Block group population",
        ),
        "AveOccup": Column(
            float,
            checks=[
                Check.ge(0, error="AveOccup doit être >= 0"),
                Check.le(100, error="AveOccup > 100 personnes par foyer semble faux"),
            ],
            description="Average number of household members",
        ),
        "Latitude": Column(
            float,
            checks=[
                Check.ge(32, error="Latitude hors Californie (< 32)"),
                Check.le(42, error="Latitude hors Californie (> 42)"),
            ],
            description="Block group latitude",
        ),
        "Longitude": Column(
            float,
            checks=[
                Check.ge(-125, error="Longitude hors Californie (< -125)"),
                Check.le(-114, error="Longitude hors Californie (> -114)"),
            ],
            description="Block group longitude",
        ),
        "MedHouseVal": Column(
            float,
            checks=[
                Check.ge(0, error="Prix négatif impossible"),
                Check.le(10, error="Prix > 10 (100k$) suspicieux"),
            ],
            description="Median house value for households (in 100k$)",
            required=True,
        ),
    },
    name="RawDataSchema",
    strict=False,  # Permet colonnes supplémentaires si besoin
    coerce=True,  # Essaie de convertir les types automatiquement
)


# --- SCHEMA 2: PROCESSED DATA ---
# Données après feature engineering (normalisées/standardisées)
# Note: Les features peuvent être négatives après StandardScaler

ProcessedDataSchema = DataFrameSchema(
    {
        "MedInc": Column(float),  # Peut être négatif après normalisation
        "HouseAge": Column(float),
        "AveRooms": Column(float),
        "AveBedrms": Column(float),
        "Population": Column(float),
        "AveOccup": Column(float),
        "Latitude": Column(float),
        "Longitude": Column(float),
        "MedHouseVal": Column(float, checks=Check.ge(0)),  # Target reste positive
    },
    name="ProcessedDataSchema",
    strict=True,  # Pas de colonnes inattendues
    coerce=True,
)


# --- SCHEMA 3: INFERENCE INPUT ---
# Payload de l'API (sans target)

InferenceInputSchema = DataFrameSchema(
    {
        "MedInc": Column(float, checks=[Check.ge(0), Check.le(20)]),
        "HouseAge": Column(float, checks=[Check.ge(0), Check.le(100)]),
        "AveRooms": Column(float, checks=Check.ge(0)),
        "AveBedrms": Column(float, checks=Check.ge(0)),
        "Population": Column(float, checks=Check.ge(0)),
        "AveOccup": Column(float, checks=[Check.ge(0), Check.le(100)]),
        "Latitude": Column(float, checks=[Check.ge(32), Check.le(42)]),
        "Longitude": Column(float, checks=[Check.ge(-125), Check.le(-114)]),
    },
    name="InferenceInputSchema",
    strict=True,  # Pas de colonnes inattendues
    coerce=True,
)


# --- HELPER FUNCTIONS ---


def validate_raw_data(df) -> DataFrame:
    """Valide les données brutes."""
    return RawDataSchema.validate(df, lazy=True)


def validate_processed_data(df) -> DataFrame:
    """Valide les données processées."""
    return ProcessedDataSchema.validate(df, lazy=True)


def validate_inference_input(df) -> DataFrame:
    """Valide les données d'inférence."""
    return InferenceInputSchema.validate(df, lazy=True)
