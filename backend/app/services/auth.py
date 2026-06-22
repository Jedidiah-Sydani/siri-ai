import hashlib
import hmac
import os
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import load_root_env
from app.schemas import User
from app.seed_data import CURRENT_USER


DEFAULT_EMAIL = "admin@gmail.com"
DEFAULT_PASSWORD = "admin"

load_root_env()

security = HTTPBearer(auto_error=False)
active_tokens: set[str] = set()

account_email = os.getenv("SIRI_AUTH_EMAIL", DEFAULT_EMAIL).strip().lower()
password_hash = hashlib.sha256(
    os.getenv("SIRI_AUTH_PASSWORD", DEFAULT_PASSWORD).encode("utf-8"),
).hexdigest()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def authenticate(email: str, password: str) -> bool:
    return hmac.compare_digest(email.strip().lower(), account_email) and hmac.compare_digest(
        hash_password(password),
        password_hash,
    )


def issue_token() -> str:
    token = secrets.token_urlsafe(32)
    active_tokens.add(token)
    return token


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    if credentials.credentials not in active_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session.",
        )

    return CURRENT_USER.model_copy(deep=True)


def change_password(old_password: str, new_password: str, confirm_password: str) -> None:
    global password_hash

    if not hmac.compare_digest(hash_password(old_password), password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect.",
        )
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match.",
        )
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters.",
        )

    password_hash = hash_password(new_password)
