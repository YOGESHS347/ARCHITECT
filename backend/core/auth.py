"""
auth.py
=======
Authentication core supporting both custom JWT (default) and Supabase Auth.
Selected via AUTH_PROVIDER=jwt (default) vs AUTH_PROVIDER=supabase.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt  # type: ignore
from passlib.context import CryptContext  # type: ignore
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
try:
    from bson import ObjectId
    from bson.errors import InvalidId
except ImportError:
    ObjectId = None  # type: ignore
    InvalidId = Exception  # type: ignore

from db.supabase_client import (
    get_auth_provider,
    get_database_provider,
    get_supabase_jwt_secret,
    get_supabase_client,
    validate_supabase_config,
)
from db.database import users_collection, DATABASE_PROVIDER

AUTH_PROVIDER = get_auth_provider()

# ── Key validation ────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET")
SUPABASE_JWT_SECRET = get_supabase_jwt_secret()

if AUTH_PROVIDER == "jwt":
    if not JWT_SECRET:
        raise ValueError(
            "CRITICAL: JWT_SECRET environment variable is missing for AUTH_PROVIDER=jwt. "
            "Please configure JWT_SECRET in backend/.env"
        )
elif AUTH_PROVIDER == "supabase":
    # If Supabase is selected, ensure we have the secret or credentials to validate tokens
    validate_supabase_config(for_db=False, for_auth=True)
else:
    raise ValueError(f"CRITICAL: Unknown AUTH_PROVIDER='{AUTH_PROVIDER}'. Must be 'jwt' or 'supabase'.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    try:
        pw_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")
    except Exception:
        return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """Create a standard JWT token for AUTH_PROVIDER=jwt."""
    secret = JWT_SECRET or SUPABASE_JWT_SECRET
    if not secret:
        raise ValueError("Cannot sign JWT without a configured secret key.")
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Validate the incoming Bearer token and return the authenticated user dict.
    Supports custom JWT tokens as well as Supabase Auth tokens.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # ── Supabase Auth Verification ────────────────────────────────────────────
    if AUTH_PROVIDER == "supabase":
        secret = SUPABASE_JWT_SECRET or JWT_SECRET
        user_id: Optional[str] = None
        user_email: Optional[str] = None
        user_name: Optional[str] = None

        # 1. Try decoding locally with SUPABASE_JWT_SECRET
        if secret:
            try:
                # Supabase tokens may omit audience verification or use 'authenticated'
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=[ALGORITHM],
                    options={"verify_aud": False},
                )
                user_id = payload.get("sub")
                user_email = payload.get("email")
                metadata = payload.get("user_metadata") or {}
                user_name = metadata.get("full_name") or metadata.get("name") or user_email
            except JWTError:
                pass

        # 2. If local decode failed, verify directly with Supabase Auth API
        if not user_id:
            try:
                sb = get_supabase_client()
                sb_user = await sb.get_user_from_token(token)
                if sb_user:
                    user_id = sb_user.get("id")
                    user_email = sb_user.get("email")
                    metadata = sb_user.get("user_metadata") or {}
                    user_name = metadata.get("full_name") or metadata.get("name") or user_email
            except Exception:
                pass

        if not user_id:
            raise credentials_exception

        return {
            "id": str(user_id),
            "email": user_email or "",
            "name": user_name or "Architect",
        }

    # ── Standard Custom JWT Verification (AUTH_PROVIDER=jwt) ──────────────────
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    from db.repositories import get_user_by_id
    user = await get_user_by_id(user_id_str)
    if user is None:
        return {"id": user_id_str, "email": payload.get("email", ""), "name": payload.get("name", "Architect")}
    user["id"] = str(user.get("_id") or user.get("id", user_id_str))
    return user
