from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
import uuid

from app.models import UserRole, PlaceholderType, CertificateStatus, VerificationStatus


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True


class UserCreate(BaseSchema):
    email: str
    password: str
    full_name: str
    role: Optional[UserRole] = UserRole.VIEWER
    organization_id: Optional[uuid.UUID] = None


class UserLogin(BaseSchema):
    email: str
    password: str


class UserResponse(BaseSchema):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    organization_id: Optional[uuid.UUID] = None


class UserUpdate(BaseSchema):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None


class OrganizationCreate(BaseSchema):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OrganizationUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class OrganizationResponse(BaseSchema):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: datetime


class TemplateCreate(BaseSchema):
    name: str
    description: Optional[str] = None
    file_type: str
    width: int
    height: int
    dpi: int = 300
    background_color: str = "#FFFFFF"


class TemplateUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    background_color: Optional[str] = None


class TemplateResponse(BaseSchema):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    file_type: str
    filename: str
    file_path: str
    file_size: int
    width: int
    height: int
    dpi: int
    background_color: str
    is_active: bool
    is_default: bool
    created_at: datetime
    owner_id: uuid.UUID
    organization_id: uuid.UUID


class TemplatePlaceholderBase(BaseSchema):
    type: PlaceholderType
    custom_key: Optional[str] = None
    x: int
    y: int
    width: int
    height: int
    font_family: str = "Helvetica"
    font_size: int = 12
    font_weight: str = "normal"
    font_color: str = "#000000"
    alignment: str = "left"
    rotation: float = 0.0
    opacity: float = 1.0
    is_required: bool = True
    default_value: Optional[str] = None


class TemplatePlaceholderCreate(TemplatePlaceholderBase):
    pass


class TemplatePlaceholderUpdate(BaseSchema):
    type: Optional[PlaceholderType] = None
    custom_key: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    font_weight: Optional[str] = None
    font_color: Optional[str] = None
    alignment: Optional[str] = None
    rotation: Optional[float] = None
    opacity: Optional[float] = None
    is_required: Optional[bool] = None
    default_value: Optional[str] = None


class TemplatePlaceholderResponse(TemplatePlaceholderBase):
    id: uuid.UUID
    template_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ParticipantCreate(BaseSchema):
    name: str
    email: str
    event: Optional[str] = None
    position: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ParticipantUpdate(BaseSchema):
    name: Optional[str] = None
    email: Optional[str] = None
    event: Optional[str] = None
    position: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ParticipantResponse(BaseSchema):
    id: uuid.UUID
    name: str
    email: str
    event: Optional[str] = None
    position: Optional[str] = None
    custom_fields: Dict[str, Any] = {}
    created_at: datetime
    organization_id: uuid.UUID


class CertificateCreate(BaseSchema):
    participant_id: uuid.UUID
    template_id: uuid.UUID
    participant_name: str
    participant_email: str
    participant_event: Optional[str] = None
    template_name: str


class CertificateUpdate(BaseSchema):
    status: Optional[CertificateStatus] = None
    pdf_path: Optional[str] = None
    png_path: Optional[str] = None
    error_message: Optional[str] = None


class CertificateResponse(BaseSchema):
    id: uuid.UUID
    certificate_id: str
    qr_token: str
    tamper_hash: str
    status: CertificateStatus
    pdf_path: Optional[str] = None
    png_path: Optional[str] = None
    issued_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    template_id: uuid.UUID
    participant_id: uuid.UUID
    creator_id: uuid.UUID
    organization_id: uuid.UUID


class VerificationResponse(BaseSchema):
    status: VerificationStatus
    certificate_id: str
    message: str
    details: Optional[Dict[str, Any]] = None


class AnalyticsResponse(BaseSchema):
    id: uuid.UUID
    date: datetime
    certificates_generated: int
    certificates_sent: int
    certificates_failed: int
    verifications_total: int
    verifications_valid: int
    verifications_invalid: int
    verifications_tampered: int
    downloads_pdf: int
    downloads_png: int
    downloads_zip: int
    unique_participants: int
    organization_id: uuid.UUID


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseSchema):
    message: str


class ErrorResponse(BaseSchema):
    detail: str
    status_code: int
