from __future__ import annotations
import os
from functools import lru_cache
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Missing SUPABASE_URL or SUPABASE_KEY environment variables. "
            "Copy .env.example to .env and fill in your Supabase credentials."
        )
    return create_client(url, key)


def get_client() -> Client:
    return get_supabase_client()
