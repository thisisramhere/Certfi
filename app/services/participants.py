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
    def __init__(self, participant_repo=None):
        self.participant_repo = participant_repo

    async def import_participants(
        self,
        file: UploadFile,
        organization_id: str,
        field_mapping: Optional[dict] = None
    ) -> dict:
        if not is_allowed_extension(file.filename, ["csv", "xlsx"]):
            raise FileUploadError("File must be CSV or Excel")

        file_content = await file.read()

        if file.filename.lower().endswith('.csv'):
            participants_data = parse_csv_file(file_content, field_mapping)
        elif file.filename.lower().endswith('.xlsx'):
            participants_data = parse_excel_file(file_content, field_mapping)
        else:
            participants_data = []

        validation_errors = []
        valid_participants = []

        for participant_data in participants_data:
            validated_data = validate_participant_data(participant_data, organization_id)
            if validated_data.get("errors"):
                validation_errors.append({
                    "data": participant_data,
                    "errors": validated_data["errors"]
                })
            else:
                valid_participants.append(validated_data)

        created_participants = []
        async with get_db_context() as db:
            participant_repo = ParticipantRepository(Participant, db)
            for participant_data in valid_participants:
                existing = await participant_repo.get_by_email_and_organization(
                    participant_data["data"]["email"], organization_id
                )
                if existing:
                    validation_errors.append({
                        "data": participant_data,
                        "errors": [f"Duplicate participant: {existing.email} in {existing.organization_id}"]
                    })
                else:
                    participant_dict = participant_data["data"]
                    participant_dict["organization_id"] = organization_id
                    participant = await participant_repo.create(participant_dict)
                    created_participants.append(participant)

        return {
            "created": len(created_participants),
            "errors": len(validation_errors),
            "validation_errors": validation_errors,
            "participants": [ParticipantResponse.model_validate(p) for p in created_participants]
        }

    async def get_participants(self, organization_id: str, skip: int = 0, limit: int = 100, search: str = None) -> List[ParticipantResponse]:
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
