from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status, UploadFile
from uuid import uuid4
from app.database.session import get_db_context
from app.models import Template, TemplatePlaceholder, Organization, User
from app.schemas import (
    TemplateCreate, TemplateUpdate, TemplateResponse, TemplatePlaceholderCreate,
    TemplatePlaceholderUpdate, TemplatePlaceholderResponse
)
from app.services.base import TemplateRepository, TemplatePlaceholderRepository
from app.core.exceptions import NotFoundError, ConflictError, FileUploadError
from app.utils.helpers import secure_filename, is_allowed_extension
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TemplateService:
    def __init__(self, template_repo=None, placeholder_repo=None):
        self.template_repo = template_repo
        self.placeholder_repo = placeholder_repo

    async def create_template(
        self,
        name: str,
        description: str,
        file: UploadFile,
        file_type: str,
        width: int,
        height: int,
        dpi: int,
        background_color: str,
        owner_id: str,
        organization_id: str
    ) -> TemplateResponse:
        if not is_allowed_extension(file.filename, ["png", "jpg", "jpeg", "pdf"]):
            raise FileUploadError("Template file must be PNG, JPG, or PDF")

        filename = secure_filename(file.filename)
        unique_filename = f"{uuid4().hex}_{filename}"
        file_path = f"{settings.STORAGE_BASE_PATH}/uploads/templates/{unique_filename}"

        file_content = await file.read()

        template_dict = {
            "name": name,
            "description": description,
            "file_type": file_type,
            "filename": filename,
            "file_path": file_path,
            "file_size": len(file_content),
            "width": width,
            "height": height,
            "dpi": dpi,
            "background_color": background_color,
            "owner_id": owner_id,
            "organization_id": organization_id
        }

        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            template = await template_repo.create(template_dict)

            await self._create_default_placeholders(template.id, width, height)

        logger.info(f"Template created: {template.name} by {owner_id}")
        return TemplateResponse.model_validate(template)

    async def _create_default_placeholders(self, template_id: str, width: int, height: int) -> None:
        default_placeholders = [
            {
                "type": "name",
                "x": int(width * 0.2),
                "y": int(height * 0.3),
                "width": int(width * 0.6),
                "height": int(height * 0.1)
            },
            {
                "type": "event",
                "x": int(width * 0.2),
                "y": int(height * 0.5),
                "width": int(width * 0.6),
                "height": int(height * 0.08)
            },
            {
                "type": "date",
                "x": int(width * 0.2),
                "y": int(height * 0.65),
                "width": int(width * 0.6),
                "height": int(height * 0.08)
            }
        ]

        placeholders_data = []
        for placeholder_data in default_placeholders:
            placeholder_data["template_id"] = template_id
            placeholders_data.append(placeholder_data)

        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            await placeholder_repo.create_placeholders_bulk(placeholders_data)

    async def get_templates_by_organization(self, organization_id: str, skip: int = 0, limit: int = 100) -> List[TemplateResponse]:
        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            templates = await template_repo.get_by_organization(organization_id, is_active=True)
            return [TemplateResponse.model_validate(template) for template in templates]

    async def get_template(self, template_id: str) -> TemplateResponse:
        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            template = await template_repo.get(template_id)
            return TemplateResponse.model_validate(template)

    async def update_template(self, template_id: str, template_data: TemplateUpdate) -> TemplateResponse:
        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            template = await template_repo.get(template_id)
            updated_template = await template_repo.update(template, template_data)
            return TemplateResponse.model_validate(updated_template)

    async def delete_template(self, template_id: str) -> None:
        async with get_db_context() as db:
            from sqlalchemy import delete as sql_delete
            from app.models import TemplatePlaceholder, Certificate
            await db.execute(sql_delete(TemplatePlaceholder).where(TemplatePlaceholder.template_id == template_id))
            await db.execute(sql_delete(Certificate).where(Certificate.template_id == template_id))
            await db.commit()
            template_repo = TemplateRepository(Template, db)
            await template_repo.remove(template_id)

    async def add_placeholder_to_template(self, template_id: str, placeholder_data: TemplatePlaceholderCreate) -> TemplatePlaceholderResponse:
        placeholder_dict = placeholder_data.model_dump()
        placeholder_dict["template_id"] = template_id

        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            placeholder = await placeholder_repo.create(placeholder_dict)
            return TemplatePlaceholderResponse.model_validate(placeholder)

    async def get_template_placeholders(self, template_id: str) -> List[TemplatePlaceholderResponse]:
        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            placeholders = await placeholder_repo.get_by_template(template_id)
            return [TemplatePlaceholderResponse.model_validate(placeholder) for placeholder in placeholders]

    async def update_placeholder(
        self,
        template_id: str,
        placeholder_id: str,
        placeholder_data: TemplatePlaceholderUpdate
    ) -> TemplatePlaceholderResponse:
        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            placeholder = await placeholder_repo.get(placeholder_id)

            if str(placeholder.template_id) != str(template_id):
                raise NotFoundError("Placeholder does not belong to this template")

            updated_placeholder = await placeholder_repo.update(placeholder, placeholder_data)
            return TemplatePlaceholderResponse.model_validate(updated_placeholder)

    async def replace_placeholders(self, template_id: str, placeholders: List[dict]) -> List[TemplatePlaceholderResponse]:
        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            results = await placeholder_repo.replace_placeholders(template_id, placeholders)
            return [TemplatePlaceholderResponse.model_validate(p) for p in results]
