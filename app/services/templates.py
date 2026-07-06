import os
import time
import shutil
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status, UploadFile
from uuid import uuid4
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database.session import get_db_context
from app.models import Template, TemplatePlaceholder, Organization, User
from app.schemas import (
    TemplateCreate, TemplateUpdate, TemplateResponse, TemplatePlaceholderCreate,
    TemplatePlaceholderUpdate, TemplatePlaceholderResponse
)
from app.services.base import TemplateRepository, TemplatePlaceholderRepository
from app.core.exceptions import NotFoundError, ConflictError, FileUploadError, AppException
from app.utils.helpers import secure_filename, is_allowed_extension
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _resolve_file_path(file_path: str) -> str:
    if not file_path:
        return file_path
    if file_path.startswith("./"):
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        resolved = os.path.join(base, file_path[2:])
        if os.path.exists(resolved):
            return resolved
    return file_path


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
        if not organization_id:
            raise AppException(
                message="User is not associated with an organization.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if not is_allowed_extension(file.filename, ["png", "jpg", "jpeg", "pdf"]):
            raise FileUploadError("Template file must be PNG, JPG, or PDF")

        filename = secure_filename(file.filename)
        file_content = await file.read()
        file_size = len(file_content)

        unique_filename = f"{uuid4().hex}_{filename}"
        file_path = f"{settings.STORAGE_BASE_PATH}/uploads/templates/{unique_filename}"

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)

        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)

            existing = await db.execute(
                select(Template).where(
                    Template.organization_id == organization_id,
                    Template.filename == filename,
                    Template.file_size == file_size,
                    Template.is_active == True,
                )
            )
            existing_template = existing.scalar_one_or_none()
            if existing_template:
                logger.info(f"Duplicate template detected, returning existing: {existing_template.id}")
                result = await db.execute(
                    select(Template).options(
                        selectinload(Template.placeholders)
                    ).where(Template.id == existing_template.id)
                )
                existing_template = result.scalars().first()
                return TemplateResponse.model_validate(existing_template)

            template_dict = {
                "name": name,
                "description": description,
                "file_type": file_type,
                "filename": filename,
                "file_path": file_path,
                "file_size": file_size,
                "width": width,
                "height": height,
                "dpi": dpi,
                "background_color": background_color,
                "owner_id": owner_id,
                "organization_id": organization_id
            }

            template = await template_repo.create(template_dict)

            result = await db.execute(
                select(Template).options(
                    selectinload(Template.placeholders)
                ).where(Template.id == template.id)
            )
            template = result.scalars().first()
            return TemplateResponse.model_validate(template)

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
        file_path_to_delete = None

        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            template = await template_repo.get(template_id)

            if template.file_path:
                resolved = _resolve_file_path(template.file_path)
                if os.path.exists(resolved):
                    file_path_to_delete = resolved

            from sqlalchemy import delete as sql_delete
            from app.models import Certificate
            await db.execute(sql_delete(TemplatePlaceholder).where(TemplatePlaceholder.template_id == template_id))
            await db.execute(sql_delete(Certificate).where(Certificate.template_id == template_id))
            await db.execute(sql_delete(Template).where(Template.id == template_id))

        if file_path_to_delete:
            try:
                os.remove(file_path_to_delete)
            except OSError:
                logger.warning(f"Could not remove template file: {file_path_to_delete}")

    async def duplicate_template(self, template_id: str, owner_id: str) -> TemplateResponse:
        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            original = await template_repo.get(template_id)

            src_path = _resolve_file_path(original.file_path)
            unique_filename = f"{uuid4().hex}_{original.filename}"
            dst_path = f"{settings.STORAGE_BASE_PATH}/uploads/templates/{unique_filename}"

            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            if os.path.exists(src_path):
                shutil.copy2(src_path, dst_path)
            else:
                raise AppException(
                    message="Template source file not found",
                    status_code=status.HTTP_404_NOT_FOUND
                )

            new_template = await template_repo.create({
                "name": f"{original.name} (Copy)",
                "description": original.description,
                "file_type": original.file_type,
                "filename": original.filename,
                "file_path": dst_path,
                "file_size": original.file_size,
                "width": original.width,
                "height": original.height,
                "dpi": original.dpi,
                "background_color": original.background_color,
                "owner_id": owner_id,
                "organization_id": original.organization_id,
            })

        logger.info(f"Template duplicated: {original.id} -> {new_template.id}")
        return TemplateResponse.model_validate(new_template)

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

    async def analyze_template_with_ai(self, template_id: str) -> dict:
        from uuid import uuid4
        from app.models import Template
        from app.services.ai import AIPlacementService

        t0 = time.perf_counter()

        async with get_db_context() as db:
            template_repo = TemplateRepository(Template, db)
            template = await template_repo.get(template_id)

            file_path = _resolve_file_path(template.file_path)

            t1 = time.perf_counter()
            ai_service = AIPlacementService()
            analysis_result = await ai_service.analyze_and_placeholders(
                template_id, file_path
            )
            t2 = time.perf_counter()

            placeholder_dicts = []
            for placeholder in analysis_result.placeholders:
                placeholder_dict = placeholder.model_dump()
                placeholder_dict["template_id"] = template_id
                placeholder_dicts.append(placeholder_dict)

            for pd in placeholder_dicts:
                logger.info(
                    "AI PLACEHOLDER: type=%s x=%.1f y=%.1f width=%.1f height=%.1f confidence=%.2f",
                    pd.get("type"), pd.get("x", 0), pd.get("y", 0),
                    pd.get("width", 0), pd.get("height", 0),
                    pd.get("confidence_score", 0),
                )

            elapsed_total = (time.perf_counter() - t0) * 1000
            elapsed_opencv = (t2 - t1) * 1000
            logger.info(f"AI ANALYZE: opencv: {elapsed_opencv:.0f}ms, TOTAL: {elapsed_total:.0f}ms")

            return {
                "id": str(uuid4()),
                "template_id": template_id,
                "placeholders": placeholder_dicts,
                "analysis_metadata": analysis_result.analysis_metadata,
                "status": "success",
                "confidence": sum(p.confidence_score for p in analysis_result.placeholders) / len(analysis_result.placeholders) if analysis_result.placeholders else 0,
            }

    async def save_ai_placeholders(self, template_id: str, placeholder_data: TemplatePlaceholderCreate) -> TemplatePlaceholderResponse:
        async with get_db_context() as db:
            placeholder_repo = TemplatePlaceholderRepository(TemplatePlaceholder, db)
            placeholder = await placeholder_repo.create(placeholder_data.model_dump())
            return TemplatePlaceholderResponse.model_validate(placeholder)
