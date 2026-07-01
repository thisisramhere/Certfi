import logging
import logging.config
import sys
from typing import Any, Dict
from app.core.config import settings


def setup_logging() -> None:
    log_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json" if settings.LOG_FORMAT == "json" else "default",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            "": {
                "handlers": ["console"],
                "level": settings.LOG_LEVEL,
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "handlers": ["console"],
                "level": "WARNING" if not settings.DEBUG else "INFO",
                "propagate": False,
            },
        },
    }
    logging.config.dictConfig(log_config)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)