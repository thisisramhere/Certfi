import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_user():
    return Mock(
        id="user123",
        email="test@example.com",
        full_name="Test User",
        role="viewer",
        is_active=True,
        is_verified=False,
        organization_id="org123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_organization():
    return Mock(
        id="org123",
        name="Test Organization",
        slug="test-organization",
        description="A test organization",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_template():
    return Mock(
        id="template123",
        name="Test Template",
        description="A test template",
        file_type="pdf",
        filename="template.pdf",
        file_path="storage/uploads/templates/template.pdf",
        file_size=1024,
        width=800,
        height=600,
        dpi=300,
        background_color="#FFFFFF",
        is_active=True,
        is_default=False,
        owner_id="user123",
        organization_id="org123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_participant():
    return Mock(
        id="participant123",
        name="John Doe",
        email="john@example.com",
        event="Annual Conference",
        position="Speaker",
        custom_fields={},
        organization_id="org123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_certificate():
    return Mock(
        id="cert123",
        certificate_id="CERT-2026-000001",
        qr_token="qr_token_123",
        tamper_hash="hash123",
        status="generated",
        pdf_path="storage/generated/pdf/20260101120000_CERT-2026-000001.pdf",
        png_path="storage/generated/png/20260101120000_CERT-2026-000001.png",
        issued_at=datetime.utcnow(),
        sent_at=None,
        error_message=None,
        template_id="template123",
        participant_id="participant123",
        creator_id="user123",
        organization_id="org123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_analytics():
    return Mock(
        id="analytics123",
        date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
        certificates_generated=10,
        certificates_sent=8,
        certificates_failed=2,
        verifications_total=50,
        verifications_valid=45,
        verifications_invalid=3,
        verifications_tampered=2,
        downloads_pdf=20,
        downloads_png=15,
        downloads_zip=5,
        unique_participants=25,
        organization_id="org123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_verification_log():
    return Mock(
        id="log123",
        certificate_id="CERT-2026-000001",
        status="valid",
        ip_address="127.0.0.1",
        user_agent="test-agent",
        verified_at=datetime.utcnow(),
        certificate_fk="cert123"
    )


@pytest.fixture
def mock_audit_log():
    return Mock(
        id="audit123",
        action="login",
        resource_type="user",
        resource_id="user123",
        details={"ip": "127.0.0.1"},
        ip_address="127.0.0.1",
        user_agent="test-agent",
        user_id="user123",
        organization_id="org123",
        created_at=datetime.utcnow()
    )
