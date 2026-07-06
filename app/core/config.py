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

    # =====================
    # APP
    # =====================
    APP_NAME: str = "CertFi"
    APP_VERSION: str = "1.0.0"

    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    SECRET_KEY: str = Field(..., min_length=32)

    API_PREFIX: str = "/api/v1"


    # =====================
    # SERVER
    # =====================
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    BACKEND_URL: str = "https://certfi.onrender.com"
    FRONTEND_URL: str = "https://www.certfi.online"


    # =====================
    # DATABASE
    # =====================
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL async connection string"
    )

    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10


    # =====================
    # AUTH / JWT
    # =====================
    JWT_SECRET_KEY: str = Field(..., min_length=32)

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BCRYPT_ROUNDS: int = 12


    # =====================
    # CORS
    # =====================
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://certfi-three.vercel.app",
        "https://certfi.online",
        "https://www.certfi.online",
    ]


    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):

        if isinstance(value, str):

            # Render JSON style:
            # ["url1","url2"]
            if value.startswith("["):
                import json
                return json.loads(value)

            # Render comma style:
            # url1,url2,url3
            return [
                origin.strip()
                for origin in value.split(",")
            ]

        return value


    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]


    # =====================
    # RATE LIMIT
    # =====================
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60


    # =====================
    # STORAGE
    # =====================
    STORAGE_TYPE: str = "local"

    STORAGE_BASE_PATH: str = "./app/storage"

    MAX_UPLOAD_SIZE: int = 10485760

    ALLOWED_TEMPLATE_EXTENSIONS: List[str] = [
        "png",
        "jpg",
        "jpeg",
        "pdf",
    ]

    ALLOWED_PARTICIPANT_EXTENSIONS: List[str] = [
        "csv",
        "xlsx",
    ]


    # =====================
    # EMAIL
    # =====================
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    SMTP_TLS: bool = True

    EMAIL_FROM: str = "noreply@certfi.com"
    EMAIL_FROM_NAME: str = "CertFi"


    # =====================
    # CERTIFICATE
    # =====================
    VERIFICATION_BASE_URL: str = (
        "https://www.certfi.online"
    )

    CERTIFICATE_ID_PREFIX: str = "CERT"

    CERTIFICATE_ID_FORMAT: str = (
        "{prefix}-{year}-{sequence:06d}"
    )


    # =====================
    # QR CODE
    # =====================
    QR_CODE_VERSION: int = 1
    QR_CODE_ERROR_CORRECTION: str = "L"
    QR_CODE_BOX_SIZE: int = 10
    QR_CODE_BORDER: int = 4


    # =====================
    # WATERMARK
    # =====================
    DEFAULT_WATERMARK_OPACITY: float = 0.3
    DEFAULT_WATERMARK_TEXT: str = "CertFi"


    # =====================
    # SECURITY
    # =====================
    TAMPER_SECRET_KEY: str = Field(
        ...,
        min_length=32
    )


    # =====================
    # LOGGING
    # =====================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


    # =====================
    # PAGINATION
    # =====================
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100



@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
