import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from app.schemas import VerificationResponse, VerificationStatus
from app.services.verification import VerificationService
from app.core.exceptions import NotFoundError


class TestVerificationService:
    @pytest.fixture
    def mock_verification_repo(self):
        return Mock()

    @pytest.fixture
    def mock_cert_repo(self):
        return Mock()

    @pytest.fixture
    def verification_service(self, mock_verification_repo, mock_cert_repo):
        return VerificationService(mock_verification_repo, mock_cert_repo)

    @pytest.mark.asyncio
    async def test_verify_certificate_valid(self, verification_service, mock_cert_repo, mock_verification_repo):
        mock_certificate = Mock(
            certificate_id="CERT-2026-000001",
            tamper_hash="valid_hash",
            issued_at=datetime(2026, 1, 1),
            participant=Mock(name="John Doe", email="john@example.com", event="Conference"),
            organization=Mock(name="Test Org"),
            template=Mock(name="Template")
        )
        mock_cert_repo.get_by_certificate_id.return_value = mock_certificate

        with patch('app.services.verification.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            with patch('app.services.verification.verify_tamper_hash', return_value=True):
                mock_request = Mock()
                mock_request.client.host = "127.0.0.1"
                mock_request.headers.get.return_value = "test-agent"

                result = await verification_service.verify_certificate("CERT-2026-000001", mock_request)

        assert result["certificate_id"] == "CERT-2026-000001"
        assert result["status"] == VerificationStatus.VALID.value
        assert result["is_valid"] is True
        assert result["participant"]["name"] == "John Doe"

    @pytest.mark.asyncio
    async def test_verify_certificate_invalid(self, verification_service, mock_cert_repo):
        mock_certificate = Mock(
            certificate_id="CERT-2026-000001",
            tamper_hash="invalid_hash",
            issued_at=datetime(2026, 1, 1),
            participant=Mock(name="John Doe", email="john@example.com", event="Conference"),
            organization=Mock(name="Test Org"),
            template=Mock(name="Template")
        )
        mock_cert_repo.get_by_certificate_id.return_value = mock_certificate

        with patch('app.services.verification.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            with patch('app.services.verification.verify_tamper_hash', return_value=False):
                mock_request = Mock()
                mock_request.client.host = "127.0.0.1"
                mock_request.headers.get.return_value = "test-agent"

                result = await verification_service.verify_certificate("CERT-2026-000001", mock_request)

        assert result["status"] == VerificationStatus.INVALID.value
        assert result["is_valid"] is False

    @pytest.mark.asyncio
    async def test_verify_certificate_not_found(self, verification_service, mock_cert_repo):
        mock_cert_repo.get_by_certificate_id.return_value = None

        with patch('app.services.verification.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            with pytest.raises(NotFoundError):
                await verification_service.verify_certificate("CERT-2026-999999")

    @pytest.mark.asyncio
    async def test_verify_certificate_no_request(self, verification_service, mock_cert_repo):
        mock_certificate = Mock(
            certificate_id="CERT-2026-000001",
            tamper_hash="valid_hash",
            issued_at=datetime(2026, 1, 1),
            participant=Mock(name="John Doe", email="john@example.com", event="Conference"),
            organization=Mock(name="Test Org"),
            template=Mock(name="Template")
        )
        mock_cert_repo.get_by_certificate_id.return_value = mock_certificate

        with patch('app.services.verification.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            with patch('app.services.verification.verify_tamper_hash', return_value=True):
                result = await verification_service.verify_certificate("CERT-2026-000001", None)

        assert result["certificate_id"] == "CERT-2026-000001"

    @pytest.mark.asyncio
    async def test_get_verification_stats(self, verification_service, mock_verification_repo):
        mock_stats = {
            "total": 100,
            "valid": 90,
            "invalid": 5,
            "tampered": 5
        }
        mock_verification_repo.get_verification_stats.return_value = mock_stats

        with patch('app.services.verification.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await verification_service.get_verification_stats("org123")

        assert result["total"] == 100
        assert result["valid"] == 90
