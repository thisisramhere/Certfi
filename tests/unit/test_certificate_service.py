import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.schemas import CertificateCreate, CertificateResponse, CertificateStatus
from app.services.certificates import CertificateService


class TestCertificateService:
    @pytest.fixture
    def mock_cert_repo(self):
        return Mock()

    @pytest.fixture
    def mock_analytics_repo(self):
        return Mock()

    @pytest.fixture
    def certificate_service(self, mock_cert_repo, mock_analytics_repo):
        return CertificateService(mock_cert_repo, mock_analytics_repo)

    @pytest.mark.asyncio
    async def test_generate_certificate_success(self, certificate_service, mock_cert_repo, mock_analytics_repo):
        participant = Mock(
            id="participant123",
            name="John Doe",
            email="john@example.com",
            event="Annual Conference",
            organization_id="org123"
        )

        template = Mock(
            id="template123",
            name="Employee Template",
            file_path="templates/employee.png"
        )

        organization = Mock(id="org123")

        creator = Mock(id="creator123")

        with patch('app.services.certificates.get_db_context') as mock_context:
            mock_db = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_db
            mock_context.return_value.__aexit__.return_value = None

            mock_db.get.side_effect = lambda model, id: {
                "Participant": participant,
                "Template": template,
                "Organization": organization,
                "User": creator
            }.get(model.__name__)

            mock_cert_repo.create.return_value = Mock(
                id="cert123",
                certificate_id="CERT-2026-000001",
                qr_token="qr_token123",
                tamper_hash="hash123",
                status=CertificateStatus.GENERATED
            )

            with patch('app.services.certificates.datetime') as mock_datetime:
                mock_datetime.utcnow.return_value = Mock(
                    year=2026,
                    month=7,
                    day=30,
                    hour=12,
                    minute=0,
                    second=0,
                    microsecond=0
                )

                result = await certificate_service.generate_certificate(
                    participant_id="participant123",
                    template_id="template123",
                    organization_id="org123",
                    creator_id="creator123",
                    participant_data={"name": "John Doe", "email": "john@example.com", "event": "Annual Conference"},
                    template_data={"name": "Employee Template"},
                    placeholder_values={"name": "John Doe", "event": "Annual Conference"}
                )

        assert result.certificate_id == "CERT-2026-000001"
        assert result.status == CertificateStatus.GENERATED
        mock_cert_repo.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_certificates(self, certificate_service, mock_cert_repo):
        mock_certificates = [
            Mock(certificate_id="CERT-2026-000001", status=CertificateStatus.GENERATED),
            Mock(certificate_id="CERT-2026-000002", status=CertificateStatus.PENDING)
        ]

        with patch('app.services.certificates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            mock_cert_repo.list_certificates.return_value = mock_certificates

            result = await certificate_service.get_certificates("org123", CertificateStatus.GENERATED)

        assert len(result) == 1
        assert result[0].certificate_id == "CERT-2026-000001"

    @pytest.mark.asyncio
    async def test_get_certificate(self, certificate_service, mock_cert_repo):
        mock_certificate = Mock(
            certificate_id="CERT-2026-000001",
            status=CertificateStatus.GENERATED
        )
        mock_cert_repo.get_by_certificate_id.return_value = mock_certificate

        with patch('app.services.certificates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await certificate_service.get_certificate("CERT-2026-000001")

        assert result.certificate_id == "CERT-2026-000001"
        mock_cert_repo.get_by_certificate_id.assert_called_once_with("CERT-2026-000001")