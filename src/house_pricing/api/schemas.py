# src/house_pricing/api/schemas.py
import datetime

from pydantic import BaseModel, Field


class HouseFeatures(BaseModel):
    MedInc: float = Field(..., ge=0, example=8.3252)
    HouseAge: float = Field(..., ge=0, le=200, example=41.0)
    AveRooms: float = Field(..., ge=0, example=6.984)
    AveBedrms: float = Field(..., ge=0, example=1.023)
    Population: float = Field(..., ge=0, example=322.0)
    AveOccup: float = Field(..., ge=0, example=2.55)
    Latitude: float = Field(..., ge=32, le=42, example=37.88)
    Longitude: float = Field(..., ge=-125, le=-114, example=-122.23)


class PredictionResponse(BaseModel):
    predicted_price: float
    model_version: str
    processing_time_ms: float


# Vérité terrain pour le drift
class Feedback(BaseModel):
    request_id: str
    true_price: float
    comments: str | None = None


class RootResponse(BaseModel):
    message: str
    docs_url: str


# Pour le monitoring interne
class PredictionLog(BaseModel):
    timestamp: datetime.datetime
    inputs: HouseFeatures
    output: float
    model_version: str
