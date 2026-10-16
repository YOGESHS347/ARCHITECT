"""
supabase_client.py
==================
Supabase configuration and PostgREST client driver layer.
Provides clean async methods for interacting with Supabase PostgreSQL and Auth
via PostgREST when DATABASE_PROVIDER=supabase or AUTH_PROVIDER=supabase.
"""

from __future__ import annotations

import os
from typing import Any, Optional, Dict, List
import httpx

def get_database_provider() -> str:
    """Return the active database provider ('mongodb' or 'supabase'). Default: 'mongodb'."""
    return os.getenv("DATABASE_PROVIDER", "mongodb").strip().lower()

def get_auth_provider() -> str:
    """Return the active auth provider ('jwt' or 'supabase'). Default: 'jwt'."""
    return os.getenv("AUTH_PROVIDER", "jwt").strip().lower()

def get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip().rstrip("/")

def get_supabase_service_role_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

def get_supabase_jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip()

def get_supabase_db_url() -> str:
    return os.getenv("SUPABASE_DB_URL", "").strip()

def validate_supabase_config(for_db: bool = True, for_auth: bool = False) -> None:
    """
    Validate that required Supabase environment variables are present.
    Fails fast with a clear, descriptive ValueError if missing.
    Does NOT fall back to MongoDB.
    """
    url = get_supabase_url()
    service_key = get_supabase_service_role_key()
    db_url = get_supabase_db_url()
    jwt_secret = get_supabase_jwt_secret()

    if for_db:
        if not url:
            raise ValueError(
                "CRITICAL: DATABASE_PROVIDER is set to 'supabase', but SUPABASE_URL is missing. "
                "Please configure SUPABASE_URL in backend/.env"
            )
        if not service_key and not db_url:
            raise ValueError(
                "CRITICAL: DATABASE_PROVIDER is set to 'supabase', but neither SUPABASE_SERVICE_ROLE_KEY "
                "nor SUPABASE_DB_URL is configured. Cannot connect to Supabase PostgreSQL."
            )

    if for_auth:
        if not jwt_secret and not service_key and not url:
            raise ValueError(
                "CRITICAL: AUTH_PROVIDER is set to 'supabase', but neither SUPABASE_JWT_SECRET "
                "nor SUPABASE_SERVICE_ROLE_KEY is configured. Cannot validate Supabase auth tokens."
            )

class SupabaseClient:
    """Async client interacting with Supabase PostgREST & Auth endpoints."""

    def __init__(self):
        self.url = get_supabase_url()
        self.service_key = get_supabase_service_role_key()

    def _headers(self, user_token: Optional[str] = None) -> Dict[str, str]:
        auth_header = f"Bearer {user_token}" if user_token else f"Bearer {self.service_key}"
        return {
            "apikey": self.service_key,
            "Authorization": auth_header,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def select(
        self,
        table: str,
        select: str = "*",
        match: Optional[Dict[str, Any]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
        user_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query rows from a Supabase table using PostgREST."""
        params: Dict[str, Any] = {"select": select}
        if match:
            for k, v in match.items():
                params[f"{k}"] = f"eq.{v}"
        if order:
            params["order"] = order
        if limit:
            params["limit"] = str(limit)

        endpoint = f"{self.url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(endpoint, headers=self._headers(user_token), params=params)
            if resp.status_code >= 400:
                raise RuntimeError(f"Supabase PostgREST select error ({resp.status_code}): {resp.text}")
            return resp.json()

    async def insert(
        self,
        table: str,
        data: Dict[str, Any],
        user_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Insert a row into a Supabase table."""
        endpoint = f"{self.url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint, headers=self._headers(user_token), json=data)
            if resp.status_code >= 400:
                raise RuntimeError(f"Supabase PostgREST insert error ({resp.status_code}): {resp.text}")
            return resp.json()

    async def update(
        self,
        table: str,
        data: Dict[str, Any],
        match: Dict[str, Any],
        user_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Update rows in a Supabase table matching given criteria."""
        params: Dict[str, Any] = {}
        for k, v in match.items():
            params[f"{k}"] = f"eq.{v}"

        endpoint = f"{self.url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.patch(endpoint, headers=self._headers(user_token), params=params, json=data)
            if resp.status_code >= 400:
                raise RuntimeError(f"Supabase PostgREST update error ({resp.status_code}): {resp.text}")
            return resp.json()

    async def delete(
        self,
        table: str,
        match: Dict[str, Any],
        user_token: Optional[str] = None,
    ) -> int:
        """Delete rows matching criteria. Returns count of deleted rows."""
        params: Dict[str, Any] = {}
        for k, v in match.items():
            params[f"{k}"] = f"eq.{v}"

        endpoint = f"{self.url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.delete(endpoint, headers=self._headers(user_token), params=params)
            if resp.status_code >= 400:
                raise RuntimeError(f"Supabase PostgREST delete error ({resp.status_code}): {resp.text}")
            res_data = resp.json()
            return len(res_data) if isinstance(res_data, list) else 1

    async def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Fetch user record from Supabase Auth API using a Bearer token."""
        endpoint = f"{self.url}/auth/v1/user"
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {token}",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(endpoint, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return None

# Singleton client instance
_supabase_client_instance: Optional[SupabaseClient] = None

def get_supabase_client() -> SupabaseClient:
    global _supabase_client_instance
    if _supabase_client_instance is None:
        validate_supabase_config(for_db=True)
        _supabase_client_instance = SupabaseClient()
    return _supabase_client_instance
