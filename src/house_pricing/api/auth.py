"""
Authentication Module - JWT-based authentication for the MLOps API.

Features:
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- Prediction history tracking
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from house_pricing.api.config import get_settings

logger = logging.getLogger("api.auth")
settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer scheme
security = HTTPBearer(auto_error=False)

# JWT Configuration
SECRET_KEY = (
    settings.JWT_SECRET_KEY
    if hasattr(settings, "JWT_SECRET_KEY")
    else "mlops-secret-key-change-in-production"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# ============ SCHEMAS ============


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without password)."""

    id: int
    email: str
    name: str
    created_at: datetime


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded token data."""

    user_id: Optional[int] = None
    email: Optional[str] = None


class PredictionHistoryItem(BaseModel):
    """Schema for prediction history item."""

    id: int
    predicted_price: float
    model_version: str
    features: dict
    created_at: datetime


# ============ IN-MEMORY STORAGE (Replace with DB in production) ============

# Simple in-memory storage for demo purposes
# In production, use SQLAlchemy with PostgreSQL
_users_db: dict[int, dict] = {}
_predictions_db: dict[int, list] = {}
_next_user_id = 1
_next_prediction_id = 1


def get_user_by_email(email: str) -> Optional[dict]:
    """Find user by email."""
    for user in _users_db.values():
        if user["email"] == email:
            return user
    return None


def get_user_by_id(user_id: int) -> Optional[dict]:
    """Find user by ID."""
    return _users_db.get(user_id)


def create_user(email: str, name: str, hashed_password: str) -> dict:
    """Create a new user."""
    global _next_user_id
    user = {
        "id": _next_user_id,
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
    }
    _users_db[_next_user_id] = user
    _predictions_db[_next_user_id] = []
    _next_user_id += 1
    logger.info(f"User created: {email}")
    return user


def add_prediction_to_history(
    user_id: int, predicted_price: float, model_version: str, features: dict
) -> dict:
    """Add prediction to user's history."""
    global _next_prediction_id
    prediction = {
        "id": _next_prediction_id,
        "predicted_price": predicted_price,
        "model_version": model_version,
        "features": features,
        "created_at": datetime.utcnow(),
    }
    if user_id in _predictions_db:
        _predictions_db[user_id].append(prediction)
    _next_prediction_id += 1
    return prediction


def get_user_predictions(user_id: int, limit: int = 50) -> list:
    """Get user's prediction history."""
    predictions = _predictions_db.get(user_id, [])
    return sorted(predictions, key=lambda x: x["created_at"], reverse=True)[:limit]


# ============ PASSWORD FUNCTIONS ============


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


# ============ JWT FUNCTIONS ============


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None


# ============ DEPENDENCIES ============


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Get current user from JWT token (optional).
    Returns None if no valid token provided.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    token_data = decode_token(token)

    if token_data is None or token_data.user_id is None:
        return None

    user = get_user_by_id(token_data.user_id)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Get current user from JWT token (required).
    Raises 401 if no valid token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    token = credentials.credentials
    token_data = decode_token(token)

    if token_data is None or token_data.user_id is None:
        raise credentials_exception

    user = get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception

    return user


# ============ AUTH FUNCTIONS ============


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate a user by email and password."""
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def register_user(email: str, name: str, password: str) -> dict:
    """Register a new user."""
    # Check if user already exists
    if get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create user with hashed password
    hashed_password = get_password_hash(password)
    user = create_user(email, name, hashed_password)
    return user
