import os
from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path

# Get absolute path to backend directory
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    # No silent fallback to SQLite — force correct DB
    DATABASE_URL: str = Field(..., env="DATABASE_URL", description="Primary MySQL Database Connection URL")

    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Instantiate settings. This will automatically raise a ValidationError
# if DATABASE_URL or SECRET_KEY are missing from the environment / .env file.
try:
    settings = Settings()
except Exception as e:
    import sys
    print("❌ FATAL: Configuration error. Please ensure your .env file is correctly configured.")
    print(f"Details: {e}")
    sys.exit(1)