# src/house_pricing/api/schemas.py
"""
API Schemas with strict input validation.

Based on California Housing Dataset statistics:
- MedInc: 0.5 - 15 (median income in $10k)
- HouseAge: 1 - 52 (years)
- AveRooms: 1 - 15 (avg rooms per household)
- AveBedrms: 0.3 - 5 (avg bedrooms per household)
- Population: 3 - 35000 (block population)
- AveOccup: 0.5 - 10 (avg household occupancy)
- Latitude: 32.5 - 42 (California bounds)
- Longitude: -124.5 - -114 (California bounds)
"""
import datetime

from pydantic import BaseModel, Field


class HouseFeatures(BaseModel):
    """
    House features for price prediction.
    All fields are strictly validated against California Housing Dataset ranges.
    """

    MedInc: float = Field(
        ...,
        ge=0.5,
        le=15.0,
        description="Median income in block (tens of thousands USD)",
        json_schema_extra={"example": 8.3},
    )
    HouseAge: float = Field(
        ...,
        ge=1,
        le=52,
        description="Median house age in block (years)",
        json_schema_extra={"example": 41.0},
    )
    AveRooms: float = Field(
        ...,
        ge=1,
        le=15,
        description="Average number of rooms per household",
        json_schema_extra={"example": 6.9},
    )
    AveBedrms: float = Field(
        ...,
        ge=0.3,
        le=5,
        description="Average number of bedrooms per household",
        json_schema_extra={"example": 1.0},
    )
    Population: float = Field(
        ...,
        ge=3,
        le=35000,
        description="Block population",
        json_schema_extra={"example": 322.0},
    )
    AveOccup: float = Field(
        ...,
        ge=0.5,
        le=10,
        description="Average household occupancy",
        json_schema_extra={"example": 2.5},
    )
    Latitude: float = Field(
        ...,
        ge=32.5,
        le=42.0,
        description="Latitude coordinate (California bounds)",
        json_schema_extra={"example": 37.88},
    )
    Longitude: float = Field(
        ...,
        ge=-124.5,
        le=-114.0,
        description="Longitude coordinate (California bounds)",
        json_schema_extra={"example": -122.23},
    )


class PredictionResponse(BaseModel):
    predicted_price: float
    model_version: str
    processing_time_ms: float


# Ground truth for drift monitoring
class Feedback(BaseModel):
    request_id: str
    true_price: float
    features: HouseFeatures | None = None
    prediction: float | None = None
    comments: str | None = None


class RootResponse(BaseModel):
    message: str
    docs_url: str


# Internal monitoring
class PredictionLog(BaseModel):
    timestamp: datetime.datetime
    inputs: HouseFeatures
    output: float
    model_version: str


# Batch predictions
class BatchPredictionRequest(BaseModel):
    predictions: list[HouseFeatures] = Field(..., min_length=1, max_length=100)


class BatchPredictionItem(BaseModel):
    index: int
    predicted_price: float


class BatchPredictionResponse(BaseModel):
    results: list[BatchPredictionItem]
    total: int
    model_version: str
    processing_time_ms: float
