from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from typing import Optional
from app.core.exceptions import ValidationError as AppValidationError


async def validate_content_type(request: Request, allowed_types: Optional[list] = None) -> bool:
    if allowed_types:
        content_type = request.headers.get("content-type", "")
        if not any(ct in content_type for ct in allowed_types):
            raise HTTPException(status_code=415, detail="Unsupported media type")
    return True


async def sanitize_input(data: dict) -> dict:
    if isinstance(data, dict):
        return {k: sanitize_input(v) if isinstance(v, dict) else v for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return str(data).strip()