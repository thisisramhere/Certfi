import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import UploadFile
from app.schemas import TemplateCreate, TemplateUpdate, TemplateResponse, TemplateFileType, TemplatePlaceholderResponse
from app.services.templates import TemplateService
from app.core.exceptions import NotFoundError, FileUploadError


class TestTemplateService:
    @pytest.fixture
    def mock_template_repo(self):
        return Mock()

    @pytest.fixture
    def mock_placeholder_repo(self):
        return Mock()

    @pytest.fixture
    def template_service(self, mock_template_repo, mock_placeholder_repo):
        return TemplateService(mock_template_repo, mock_placeholder_repo)

    @pytest.mark.asyncio
    async def test_create_template_success(self, template_service, mock_template_repo, mock_placeholder_repo):
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "template.pdf"
        mock_file.read = AsyncMock(return_value=b"PDF content")

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None
            
            with patch('app.services.templates.secure_filename', return_value="template.pdf"):
                with patch('app.services.templates.uuid4') as mock_uuid:
                    mock_uuid.return_value.hex = "123456"
                    
                    with patch('app.services.templates.is_allowed_extension', return_value=True):
                        mock_template = Mock(
                            id="template123",
                            name="Test Template",
                            file_type=TemplateFileType.PDF,
                            filename="template.pdf",
                            file_path="storage/uploads/templates/123456_template.pdf",
                            file_size=12,
                            width=800,
                            height=600,
                            dpi=300,
                            background_color="#FFFFFF",
                            owner_id="user123",
                            organization_id="org123"
                        )
                        mock_template_repo.create.return_value = mock_template

                        mock_placeholder_repo.create_placeholders_bulk.return_value = []

                        result = await template_service.create_template(
                            name="Test Template",
                            description="Test description",
                            file=mock_file,
                            file_type=TemplateFileType.PDF.value,
                            width=800,
                            height=600,
                            dpi=300,
                            background_color="#FFFFFF",
                            owner_id="user123",
                            organization_id="org123"
                        )

        assert result.name == "Test Template"
        assert result.id == "template123"
        mock_placeholder_repo.create_placeholders_bulk.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_templates_by_organization(self, template_service, mock_template_repo):
        mock_template = Mock(
            id="template123",
            name="Test Template",
            file_type=TemplateFileType.PDF,
            filename="template.pdf",
            file_path="storage/uploads/templates/template.pdf",
            file_size=12,
            width=800,
            height=600,
            is_active=True
        )
        mock_template_repo.get_by_organization.return_value = [mock_template]

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await template_service.get_templates_by_organization("org123")

        assert len(result) == 1
        assert result[0].name == "Test Template"

    @pytest.mark.asyncio
    async def test_get_template(self, template_service, mock_template_repo):
        mock_template = Mock(
            id="template123",
            name="Test Template",
            file_type=TemplateFileType.PDF,
            filename="template.pdf",
            file_path="storage/uploads/templates/template.pdf",
            file_size=12,
            width=800,
            height=600
        )
        mock_template_repo.get.return_value = mock_template

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await template_service.get_template("template123")

        assert result.id == "template123"
        assert result.name == "Test Template"

    @pytest.mark.asyncio
    async def test_update_template(self, template_service, mock_template_repo):
        template_data = TemplateUpdate(name="Updated Template")
        mock_template = Mock(id="template123", name="Test Template")

        mock_template_repo.get.return_value = mock_template
        mock_template_repo.update.return_value = Mock(id="template123", name="Updated Template")

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await template_service.update_template("template123", template_data)

        assert result.name == "Updated Template"
        mock_template_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_placeholder_to_template(self, template_service, mock_placeholder_repo):
        placeholder_data = Mock(type="name", x=0, y=0, width=100, height=20)
        mock_placeholder = Mock(
            id="placeholder123",
            type="name",
            x=0,
            y=0,
            width=100,
            height=20,
            template_id="template123"
        )

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            mock_placeholder_repo.create.return_value = mock_placeholder

            result = await template_service.add_placeholder_to_template("template123", placeholder_data)

        assert result.id == "placeholder123"
        assert result.template_id == "template123"

    @pytest.mark.asyncio
    async def test_update_placeholder(self, template_service, mock_placeholder_repo):
        placeholder_data = TemplateUpdate(font_size=16)
        mock_placeholder = Mock(
            id="placeholder123",
            template_id="template123",
            type="name"
        )
        mock_placeholder_repo.get.return_value = mock_placeholder
        mock_placeholder_repo.update.return_value = Mock(
            id="placeholder123",
            template_id="template123",
            type="name",
            font_size=16
        )

        with patch('app.services.templates.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await template_service.update_placeholder("template123", "placeholder123", placeholder_data)

        assert result.font_size == 16
        mock_placeholder_repo.update.assert_called_once()