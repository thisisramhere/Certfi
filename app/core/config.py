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
            if value.startswith("["):
                import json
                return json.loads(value)
            return [
                origin.strip()
                for origin in value.split(",")
            ]
        return value

    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "noreply@certiflow.com"
    EMAIL_FROM_NAME: str = "CertiFlow"

    VERIFICATION_BASE_URL: str = "https://www.certfi.online"

    DEFAULT_WATERMARK_OPACITY: float = 0.3
    DEFAULT_WATERMARK_TEXT: str = "CertiFlow"

    CERTIFICATE_ID_PREFIX: str = "CERT"
    CERTIFICATE_ID_FORMAT: str = "{prefix}-{year}-{sequence:06d}"

    QR_CODE_VERSION: int = 1
    QR_CODE_ERROR_CORRECTION: str = "L"
    QR_CODE_BOX_SIZE: int = 10
    QR_CODE_BORDER: int = 4

    TAMPER_SECRET_KEY: str = Field(..., min_length=32)

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


@lru_cache
def get_settings():
    return Settings()
