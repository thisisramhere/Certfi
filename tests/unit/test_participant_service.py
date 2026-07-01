import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import UploadFile
from app.schemas import ParticipantCreate, ParticipantResponse
from app.services.participants import ParticipantService
from app.core.exceptions import NotFoundError, FileUploadError


class TestParticipantService:
    @pytest.fixture
    def mock_participant_repo(self):
        return Mock()

    @pytest.fixture
    def participant_service(self, mock_participant_repo):
        return ParticipantService(mock_participant_repo)

    @pytest.mark.asyncio
    async def test_import_participants_csv(self, participant_service, mock_participant_repo):
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "participants.csv"
        mock_file.read = AsyncMock(return_value=b"name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com")

        mock_participant = Mock(
            id="participant123",
            name="John Doe",
            email="john@example.com",
            organization_id="org123"
        )
        mock_participant_repo.create.return_value = mock_participant
        mock_participant_repo.get_by_email_and_organization.return_value = None

        with patch('app.services.participants.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            with patch('app.services.participants.parse_csv_file', return_value=[
                {"name": "John Doe", "email": "john@example.com"},
                {"name": "Jane Smith", "email": "jane@example.com"}
            ]):
                with patch('app.services.participants.validate_participant_data', side_effect=lambda data, org_id: {"data": data, "errors": []}):
                    result = await participant_service.import_participants(mock_file, "org123")

        assert result["created"] == 2
        assert result["errors"] == 0

    @pytest.mark.asyncio
    async def test_import_participants_invalid_extension(self, participant_service):
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "participants.txt"

        with pytest.raises(FileUploadError):
            await participant_service.import_participants(mock_file, "org123")

    @pytest.mark.asyncio
    async def test_get_participants(self, participant_service, mock_participant_repo):
        mock_participants = [
            Mock(id="p1", name="John Doe", email="john@example.com", organization_id="org123"),
            Mock(id="p2", name="Jane Smith", email="jane@example.com", organization_id="org123")
        ]
        mock_participant_repo.list_participants.return_value = mock_participants

        result = await participant_service.get_participants("org123")

        assert len(result) == 2
        assert result[0].name == "John Doe"
        assert result[1].name == "Jane Smith"

    @pytest.mark.asyncio
    async def test_delete_participant(self, participant_service, mock_participant_repo):
        mock_participant = Mock(id="participant123", organization_id="org123")
        mock_participant_repo.get.return_value = mock_participant

        await participant_service.delete_participant("participant123", "org123")

        mock_participant_repo.soft_delete.assert_called_once_with("participant123")

    @pytest.mark.asyncio
    async def test_delete_participant_wrong_organization(self, participant_service, mock_participant_repo):
        mock_participant = Mock(id="participant123", organization_id="org456")
        mock_participant_repo.get.return_value = mock_participant

        with pytest.raises(NotFoundError):
            await participant_service.delete_participant("participant123", "org123")

    @pytest.mark.asyncio
    async def test_check_duplicates(self, participant_service, mock_participant_repo):
        mock_participant = Mock(id="participant123", email="john@example.com")
        mock_participant_repo.get_by_email_and_organization.return_value = mock_participant

        result = await participant_service._check_duplicates({"email": "john@example.com", "organization_id": "org123"})

        assert result is not None
        assert result.email == "john@example.com"

    @pytest.mark.asyncio
    async def test_check_no_duplicates(self, participant_service, mock_participant_repo):
        mock_participant_repo.get_by_email_and_organization.return_value = None

        result = await participant_service._check_duplicates({"email": "new@example.com", "organization_id": "org123"})

        assert result is None
