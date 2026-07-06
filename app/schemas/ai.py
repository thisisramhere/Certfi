from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import uuid
from enum import Enum


class PlaceholderType(str, Enum):
    NAME = "name"
    CERTIFICATE_ID = "certificate_id"
    QR_CODE = "qr_code"


class PlaceholderResponse(BaseModel):
    id: uuid.UUID
    type: PlaceholderType
    x: float = Field(..., description="X coordinate as percentage (0-100)", ge=0, le=100)
    y: float = Field(..., description="Y coordinate as percentage (0-100)", ge=0, le=100)
    width: float = Field(..., description="Width as percentage (0-100)", ge=0, le=100)
    height: float = Field(..., description="Height as percentage (0-100)", ge=0, le=100)
    rotation: float = Field(default=0.0, description="Rotation in degrees", ge=0, le=360)
    alignment: str = Field(default="left", description="Text alignment")
    font_recommendation: str = Field(default="Helvetica", description="Recommended font family")
    confidence_score: float = Field(default=1.0, description="Confidence score of placement", ge=0, le=1)
    custom_key: Optional[str] = Field(None, description="Custom key for placeholder identification")
    is_required: bool = Field(default=True, description="Whether placeholder is required")
    default_value: Optional[str] = Field(None, description="Default value for the placeholder")


class AIPlacementResponse(BaseModel):
    template_id: uuid.UUID
    placeholders: List[PlaceholderResponse]
    analysis_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata from AI analysis"
    )
    
    class Config:
        arbitrary_types_allowed = True
