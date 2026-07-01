import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Enum, Integer, Boolean, 
    Index, UniqueConstraint, func, JSON, BigInteger
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    VIEWER = "viewer"


class TemplateFileType(str, enum.Enum):
    PNG = "png"
    JPG = "jpg"
    JPEG = "jpeg"
    PDF = "pdf"


class PlaceholderType(str, enum.Enum):
    NAME = "name"
    EMAIL = "email"
    EVENT = "event"
    POSITION = "position"
    DATE = "date"
    CERTIFICATE_ID = "certificate_id"
    QR_CODE = "qr_code"
    SIGNATURE = "signature"
    WATERMARK = "watermark"
    CUSTOM = "custom"


class CertificateStatus(str, enum.Enum):
    PENDING = "pending"
    GENERATED = "generated"
    SENT = "sent"
    FAILED = "failed"


class VerificationStatus(str, enum.Enum):
    VALID = "valid"
    INVALID = "invalid"
    TAMPERED = "tampered"


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    templates: Mapped[List["Template"]] = relationship("Template", back_populates="owner")
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="creator")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")
    
    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
    )


class Organization(Base):
    __tablename__ = "organizations"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    users: Mapped[List["User"]] = relationship("User", back_populates="organization")
    templates: Mapped[List["Template"]] = relationship("Template", back_populates="organization")
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="organization")
    analytics: Mapped[List["Analytics"]] = relationship("Analytics", back_populates="organization")


class Template(Base):
    __tablename__ = "templates"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_type: Mapped[TemplateFileType] = mapped_column(Enum(TemplateFileType), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    dpi: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    background_color: Mapped[str] = mapped_column(String(7), default="#FFFFFF", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    owner: Mapped["User"] = relationship("User", back_populates="templates")
    organization: Mapped["Organization"] = relationship("Organization", back_populates="templates")
    placeholders: Mapped[List["TemplatePlaceholder"]] = relationship("TemplatePlaceholder", back_populates="template", cascade="all, delete-orphan")
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="template")
    
    __table_args__ = (
        Index("ix_templates_owner_active", "owner_id", "is_active"),
        Index("ix_templates_org_active", "organization_id", "is_active"),
    )


class TemplatePlaceholder(Base):
    __tablename__ = "template_placeholders"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[PlaceholderType] = mapped_column(Enum(PlaceholderType), nullable=False)
    custom_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    font_family: Mapped[str] = mapped_column(String(100), default="Helvetica", nullable=False)
    font_size: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    font_weight: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    font_color: Mapped[str] = mapped_column(String(7), default="#000000", nullable=False)
    alignment: Mapped[str] = mapped_column(String(20), default="left", nullable=False)
    rotation: Mapped[float] = mapped_column(default=0.0, nullable=False)
    opacity: Mapped[float] = mapped_column(default=1.0, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    default_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    
    template: Mapped["Template"] = relationship("Template", back_populates="placeholders")
    
    __table_args__ = (
        Index("ix_placeholders_template", "template_id"),
    )


class Participant(Base):
    __tablename__ = "participants"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    event: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    custom_fields: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    organization: Mapped["Organization"] = relationship("Organization")
    certificates: Mapped[List["Certificate"]] = relationship("Certificate", back_populates="participant")
    
    __table_args__ = (
        UniqueConstraint("email", "organization_id", name="uq_participant_email_org"),
        Index("ix_participants_org_email", "organization_id", "email"),
        Index("ix_participants_org_event", "organization_id", "event"),
    )


class Certificate(Base):
    __tablename__ = "certificates"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    qr_token: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    tamper_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[CertificateStatus] = mapped_column(Enum(CertificateStatus), default=CertificateStatus.PENDING, nullable=False)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    png_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    participant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False)
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    template: Mapped["Template"] = relationship("Template", back_populates="certificates")
    participant: Mapped["Participant"] = relationship("Participant", back_populates="certificates")
    creator: Mapped["User"] = relationship("User", back_populates="certificates")
    organization: Mapped["Organization"] = relationship("Organization", back_populates="certificates")
    verification_logs: Mapped[List["VerificationLog"]] = relationship("VerificationLog", back_populates="certificate")
    
    __table_args__ = (
        Index("ix_certificates_org_status", "organization_id", "status"),
        Index("ix_certificates_participant", "participant_id"),
        Index("ix_certificates_template", "template_id"),
        Index("ix_certificates_creator", "creator_id"),
        Index("ix_certificates_issued", "issued_at"),
    )


class VerificationLog(Base):
    __tablename__ = "verification_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    certificate_fk: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("certificates.id"), nullable=True)
    
    certificate: Mapped[Optional["Certificate"]] = relationship("Certificate", back_populates="verification_logs")
    
    __table_args__ = (
        Index("ix_verification_logs_cert", "certificate_id"),
        Index("ix_verification_logs_verified", "verified_at"),
    )


class Analytics(Base):
    __tablename__ = "analytics"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    certificates_generated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    certificates_sent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    certificates_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verifications_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verifications_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verifications_invalid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verifications_tampered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    downloads_pdf: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    downloads_png: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    downloads_zip: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_participants: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    organization: Mapped["Organization"] = relationship("Organization", back_populates="analytics")
    
    __table_args__ = (
        UniqueConstraint("organization_id", "date", name="uq_analytics_org_date"),
        Index("ix_analytics_org_date", "organization_id", "date"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
    organization: Mapped["Organization"] = relationship("Organization")
    
    __table_args__ = (
        Index("ix_audit_logs_user", "user_id"),
        Index("ix_audit_logs_org_action", "organization_id", "action"),
        Index("ix_audit_logs_created", "created_at"),
    )


class CertificateSequence(Base):
    __tablename__ = "certificate_sequences"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    organization: Mapped["Organization"] = relationship("Organization")
    
    __table_args__ = (
        UniqueConstraint("organization_id", "year", name="uq_sequence_org_year"),
    )