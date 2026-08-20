from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Bcrypt-based password hashing context.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject=subject,
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
        token_type="access",
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject=subject,
        expires_delta=timedelta(days=settings.jwt_refresh_token_expire_days),
        token_type="refresh",
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
