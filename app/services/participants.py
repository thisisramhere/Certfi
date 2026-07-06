from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status, UploadFile
from uuid import uuid4
from app.database.session import get_db_context
from app.models import Participant, Organization
from app.schemas import ParticipantCreate, ParticipantUpdate, ParticipantResponse
from app.services.base import ParticipantRepository
from app.core.exceptions import NotFoundError, ConflictError, FileUploadError
from app.utils.helpers import secure_filename, is_allowed_extension, parse_csv_file, parse_excel_file, validate_participant_data
from app.core.logging import get_logger

logger = get_logger(__name__)


class ParticipantService:
    VALID_COLUMNS = {"name", "email", "event", "position"}
    
    def __init__(self, participant_repo=None):
        self.participant_repo = participant_repo

    async def create_participant(self, participant_data: "ParticipantCreate", organization_id: str) -> "ParticipantResponse":
        from app.schemas import ParticipantResponse
        async with get_db_context() as db:
            participant_repo = ParticipantRepository(Participant, db)

            email = participant_data.email.strip().lower()
            existing = await participant_repo.get_by_email_and_organization(email, organization_id)
            if existing:
                raise ConflictError(f"Participant with email '{email}' already exists in this organization")

            model_data = {
                "name": participant_data.name.strip(),
                "email": email,
                "organization_id": organization_id,
                "custom_fields": participant_data.custom_fields or {},
            }
            if participant_data.event:
                model_data["event"] = participant_data.event
            if participant_data.position:
                model_data["position"] = participant_data.position

            db_obj = Participant(**model_data)
            db.add(db_obj)
            await db.flush()
            await db.refresh(db_obj)

            logger.info("CREATE PARTICIPANT: id=%s, email=%s, org=%s", db_obj.id, email, organization_id)
            return ParticipantResponse.model_validate(db_obj)

    async def import_participants(
        self,
        file: UploadFile,
        organization_id: str,
        field_mapping: Optional[dict] = None
    ) -> dict:
        logger.info("IMPORT: Starting import for org_id=%s, filename=%s", organization_id, file.filename)
        
        if not is_allowed_extension(file.filename, ["csv", "xlsx"]):
            raise FileUploadError("File must be CSV or Excel")

        file_content = await file.read()

        if file.filename.lower().endswith('.csv'):
            participants_data = parse_csv_file(file_content, field_mapping)
        elif file.filename.lower().endswith('.xlsx'):
            participants_data = parse_excel_file(file_content, field_mapping)
        else:
            participants_data = []

        logger.info("IMPORT: Parsed %d rows from file", len(participants_data))

        validation_errors = []
        valid_participants = []

        for idx, participant_data in enumerate(participants_data):
            validated_data = validate_participant_data(participant_data, organization_id)
            if validated_data.get("errors"):
                validation_errors.append({
                    "row": idx + 1,
                    "data": participant_data,
                    "errors": validated_data["errors"]
                })
            else:
                valid_participants.append(validated_data)

        logger.info("IMPORT: %d valid participants, %d with errors", len(valid_participants), len(validation_errors))

        created_count = 0
        skipped_count = 0
        created_participants = []

        async with get_db_context() as db:
            participant_repo = ParticipantRepository(Participant, db)
            
            for idx, participant_data in enumerate(valid_participants):
                try:
                    participant_dict = participant_data["data"]
                    email = participant_dict.get("email", "").strip().lower()
                    participant_dict["email"] = email
                    participant_dict["organization_id"] = organization_id

                    existing = await participant_repo.get_by_email_and_organization(
                        email, organization_id
                    )
                    if existing:
                        skipped_count += 1
                        logger.info("IMPORT: Skipped duplicate email=%s (existing id=%s)", email, existing.id)
                        continue

                    model_data = {}
                    custom_fields = {}
                    for key, value in participant_dict.items():
                        if key in self.VALID_COLUMNS:
                            model_data[key] = value
                        elif key != "organization_id":
                            custom_fields[key] = value
                    model_data["organization_id"] = organization_id
                    model_data["custom_fields"] = custom_fields

                    db_obj = Participant(**model_data)
                    db.add(db_obj)
                    await db.flush()
                    await db.refresh(db_obj)
                    created_count += 1
                    created_participants.append(db_obj)
                    logger.info("IMPORT: Queued participant email=%s", email)
                except Exception as e:
                    skipped_count += 1
                    validation_errors.append({
                        "row": idx + 1,
                        "data": participant_data["data"],
                        "errors": [f"Create failed: {str(e)}"]
                    })
                    logger.warning("IMPORT: Failed to queue participant row=%d email=%s: %s", idx + 1, participant_dict.get("email"), str(e))

        logger.info("IMPORT: Completed. created=%d, skipped=%d, errors=%d", created_count, skipped_count, len(validation_errors))

        return {
            "success": True,
            "created": created_count,
            "updated": 0,
            "skipped": skipped_count,
            "errors": len(validation_errors),
            "validation_errors": validation_errors,
            "participants": [ParticipantResponse.model_validate(p) for p in created_participants]
        }

    async def get_participants(self, organization_id: str, skip: int = 0, limit: Optional[int] = None, search: str = None) -> List[ParticipantResponse]:
        async with get_db_context() as db:
            participant_repo = ParticipantRepository(Participant, db)
            participants = await participant_repo.list_participants(
                organization_id, skip, limit, search
            )
            return [ParticipantResponse.model_validate(p) for p in participants]

    async def delete_participant(self, participant_id: str, organization_id: str) -> None:
        async with get_db_context() as db:
            participant_repo = ParticipantRepository(Participant, db)
            participant = await participant_repo.get(participant_id)

            if organization_id and str(participant.organization_id) != str(organization_id):
                raise NotFoundError("Participant not found in this organization")

            await participant_repo.soft_delete(participant_id)
