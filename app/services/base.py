from typing import Any, Dict, List, Optional, Type, TypeVar, Generic, Union
from datetime import datetime
from sqlalchemy import select, update, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.core.exceptions import NotFoundError, ConflictError, ValidationError
from app.models import Base, User, Organization, Template, TemplatePlaceholder, Participant, Certificate, VerificationLog, Analytics, AuditLog, CertificateSequence, CertificateStatus, VerificationStatus

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType], db=None):
        self.model = model
        self._db = db

    @property
    def db(self) -> AsyncSession:
        if self._db is None or (callable(self._db) and not isinstance(self._db, AsyncSession)):
            raise RuntimeError("Repository db must be an AsyncSession. Use get_db_context() in services.")
        return self._db

    async def create(self, obj_in) -> ModelType:
        if isinstance(obj_in, dict):
            obj_in_data = obj_in
        else:
            obj_in_data = obj_in.model_dump(exclude_unset=True)
        db_obj = self.model(**obj_in_data)
        self.db.add(db_obj)
        try:
            await self.db.commit()
            await self.db.refresh(db_obj)
        except IntegrityError as e:
            await self.db.rollback()
            raise ConflictError(details={"error": str(e.orig)})
        return db_obj

    async def get(self, id: Any) -> Optional[ModelType]:
        obj = await self.db.get(self.model, id)
        if not obj:
            raise NotFoundError(f"{self.model.__tablename__} not found")
        return obj

    async def get_multi(self, skip: int = 0, limit: int = 100, **filters) -> List[ModelType]:
        query = select(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update(self, db_obj: ModelType, obj_in) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def remove(self, id: Any) -> ModelType:
        obj = await self.get(id)
        await self.db.delete(obj)
        try:
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise
        return obj

    async def count(self, **filters) -> int:
        query = select(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)
        result = await self.db.execute(query)
        return len(result.scalars().all())


class UserRepository(BaseRepository):
    async def get_by_email(self, email: str) -> Optional[Any]:
        result = await self.db.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalars().first()

    async def get_active_users(self, organization_id: Any) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.is_active == True)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def list_users(self, skip: int = 0, limit: int = 100, organization_id: Any = None) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.is_active == True, self.model.deleted_at.is_(None))
        )
        if organization_id:
            query = query.where(self.model.organization_id == organization_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_last_login(self, user_id: Any) -> None:
        from datetime import datetime
        await self.db.execute(
            update(self.model)
            .where(self.model.id == user_id)
            .values(last_login=datetime.utcnow())
        )
        await self.db.commit()


class OrganizationRepository(BaseRepository):
    async def get_by_slug(self, slug: str) -> Optional[Any]:
        result = await self.db.execute(
            select(self.model).where(self.model.slug == slug)
        )
        return result.scalars().first()

    async def get_active_organizations(self) -> List[Any]:
        query = select(self.model).where(self.model.is_active == True)
        result = await self.db.execute(query)
        return result.scalars().all()


class TemplateRepository(BaseRepository):
    async def get_by_owner(self, owner_id: Any, is_active: bool = True) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.owner_id == owner_id, self.model.is_active == is_active)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_organization(self, organization_id: Any, is_active: bool = True) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.is_active == is_active)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_default_template(self, organization_id: Any) -> Optional[Any]:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.is_default == True, self.model.is_active == True)
        )
        result = await self.db.execute(query)
        return result.scalars().first()


class TemplatePlaceholderRepository(BaseRepository):
    async def get_by_template(self, template_id: Any) -> List[Any]:
        query = select(self.model).where(self.model.template_id == template_id)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_placeholders_bulk(self, placeholders_data: List[Dict]) -> List[Any]:
        placeholders = [self.model(**data) for data in placeholders_data]
        self.db.add_all(placeholders)
        await self.db.commit()
        for placeholder in placeholders:
            await self.db.refresh(placeholder)
        return placeholders

    async def replace_placeholders(self, template_id: Any, placeholders_data: List[Dict]) -> List[Any]:
        from sqlalchemy import delete as sql_delete
        await self.db.execute(
            sql_delete(self.model).where(self.model.template_id == template_id)
        )
        if placeholders_data:
            for pd in placeholders_data:
                pd["template_id"] = template_id
            placeholders = [self.model(**data) for data in placeholders_data]
            self.db.add_all(placeholders)
            await self.db.commit()
            for placeholder in placeholders:
                await self.db.refresh(placeholder)
            return placeholders
        await self.db.commit()
        return []


class ParticipantRepository(BaseRepository):
    async def get_by_email_and_organization(self, email: str, organization_id: Any) -> Optional[Any]:
        result = await self.db.execute(
            select(self.model).where(
                and_(self.model.email == email, self.model.organization_id == organization_id)
            )
        )
        return result.scalars().first()

    async def list_participants(self, organization_id: Any, skip: int = 0, limit: int = 100, search: str = None) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.deleted_at.is_(None))
        )
        if search:
            query = query.where(
                (self.model.name.ilike(f"%{search}%")) |
                (self.model.email.ilike(f"%{search}%"))
            )
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def soft_delete(self, participant_id: Any) -> None:
        from datetime import datetime
        await self.db.execute(
            update(self.model)
            .where(self.model.id == participant_id)
            .values(deleted_at=datetime.utcnow())
        )
        await self.db.commit()


class CertificateRepository(BaseRepository):
    async def get_by_id_with_details(self, certificate_id: Any) -> Optional[Any]:
        query = select(self.model).where(self.model.id == certificate_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_certificate_id(self, certificate_id: str) -> Optional[Any]:
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(self.model)
            .options(selectinload(self.model.participant), selectinload(self.model.template), selectinload(self.model.organization))
            .where(self.model.certificate_id == certificate_id)
        )
        return result.scalars().first()

    async def list_certificates(self, organization_id: Any, status: CertificateStatus = None, skip: int = 0, limit: int = 100) -> List[Any]:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.deleted_at.is_(None))
        )
        if status:
            query = query.where(self.model.status == status)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_status(self, certificate_id: Any, status: CertificateStatus, error_message: str = None) -> None:
        update_data = {"status": status}
        if error_message:
            update_data["error_message"] = error_message
        if status == CertificateStatus.GENERATED:
            update_data["issued_at"] = datetime.utcnow()
        await self.db.execute(
            update(self.model)
            .where(self.model.id == certificate_id)
            .values(**update_data)
        )
        await self.db.commit()

    async def hard_delete(self, certificate_id: Any) -> None:
        await self.db.execute(delete(self.model).where(self.model.id == certificate_id))
        await self.db.commit()

    async def get_organization_certificates_count(self, organization_id: Any, from_date: datetime = None, to_date: datetime = None) -> int:
        query = select(self.model).where(
            and_(self.model.organization_id == organization_id, self.model.deleted_at.is_(None))
        )
        if from_date and to_date:
            query = query.where(
                and_(
                    self.model.created_at >= from_date,
                    self.model.created_at <= to_date
                )
            )
        result = await self.db.execute(query)
        return len(result.scalars().all())


class VerificationLogRepository(BaseRepository):
    async def create_log(self, certificate_id: str, status: VerificationStatus, ip_address: str = None, user_agent: str = None) -> Any:
        obj_data = {
            "certificate_id": certificate_id,
            "status": status,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        return await self.create(obj_data)

    async def get_verification_stats(self, organization_id: Any, from_date: datetime = None, to_date: datetime = None) -> Dict:
        stats = {
            "total": 0,
            "valid": 0,
            "invalid": 0,
            "tampered": 0,
        }
        query = select(self.model)

        if from_date and to_date:
            query = query.where(
                and_(
                    self.model.created_at >= from_date,
                    self.model.created_at <= to_date
                )
            )

        result = await self.db.execute(query)
        verifications = result.scalars().all()

        for v in verifications:
            stats["total"] += 1
            if v.status == VerificationStatus.VALID:
                stats["valid"] += 1
            elif v.status == VerificationStatus.INVALID:
                stats["invalid"] += 1
            elif v.status == VerificationStatus.TAMPERED:
                stats["tampered"] += 1

        return stats


class AnalyticsRepository(BaseRepository):
    async def get_daily_analytics(self, organization_id: Any, date: datetime) -> Optional[Any]:
        result = await self.db.execute(
            select(self.model).where(
                and_(self.model.organization_id == organization_id, self.model.date == date)
            )
        )
        return result.scalars().first()

    async def update_analytics(self, organization_id: Any, date: datetime, **updates) -> Any:
        analytics = await self.get_daily_analytics(organization_id, date)
        if not analytics:
            analytics_data = {
                "organization_id": organization_id,
                "date": date,
                **updates
            }
            return await self.create(analytics_data)
        else:
            for key, value in updates.items():
                if hasattr(analytics, key):
                    current_value = getattr(analytics, key)
                    if isinstance(current_value, int):
                        setattr(analytics, key, current_value + value)
                    else:
                        setattr(analytics, key, value)
            await self.db.commit()
            await self.db.refresh(analytics)
            return analytics


class AuditLogRepository(BaseRepository):
    async def create_log(self, action: str, resource_type: str, resource_id: str = None, details: dict = None, user_id: Any = None, organization_id: Any = None, ip_address: str = None, user_agent: str = None) -> Any:
        obj_data = {
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "user_id": user_id,
            "organization_id": organization_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        return await self.create(obj_data)


class CertificateSequenceRepository(BaseRepository):
    async def get_next_sequence(self, organization_id: Any, year: int) -> int:
        result = await self.db.execute(
            select(self.model).where(
                and_(self.model.organization_id == organization_id, self.model.year == year)
            )
        )
        sequence_record = result.scalars().first()

        if not sequence_record:
            sequence_record = await self.create({
                "year": year,
                "sequence": 1,
                "organization_id": organization_id
            })
            return 1

        sequence_record.sequence += 1
        await self.db.commit()
        await self.db.refresh(sequence_record)

        return sequence_record.sequence
