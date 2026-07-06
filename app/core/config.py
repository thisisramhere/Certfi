from functools import lru_cache
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "CertFi"
    APP_VERSION: str = "1.0.0"

    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    SECRET_KEY: str = Field(..., min_length=32)
    API_PREFIX: str = "/api/v1"


    HOST: str = "0.0.0.0"
    PORT: int = 8000


    BACKEND_URL: str = "https://certfi.onrender.com"
    FRONTEND_URL: str = "https://www.certfi.online"


    DATABASE_URL: str = Field(...)

    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"


    # ---------------------------
    # FIXED CORS
    # ---------------------------

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://certfi-three.vercel.app",
        "https://certfi.online",
        "https://www.certfi.online"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):

        if isinstance(value, str):

            # JSON style from Render
            if value.startswith("["):
                import json
                return json.loads(value)

            # comma separated style
            return [
                origin.strip()
                for origin in value.split(",")
            ]

        return value


    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]


    VERIFICATION_BASE_URL: str = "https://www.certfi.online"



@lru_cache
def get_settings():
    return Settings()
