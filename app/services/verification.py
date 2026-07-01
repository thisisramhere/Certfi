from typing import Optional
from datetime import datetime
from fastapi import Request
from app.database.session import get_db_context
from app.models import Certificate, VerificationLog, VerificationStatus, Organization
from app.schemas import CertificateResponse
from app.services.base import VerificationLogRepository, CertificateRepository
from app.core.exceptions import NotFoundError, ConflictError
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class VerificationService:
    def __init__(
        self,
        verification_repo: VerificationLogRepository,
        cert_repo: CertificateRepository
    ):
        self.verification_repo = verification_repo
        self.cert_repo = cert_repo

    async def verify_certificate(self, certificate_id: str, request: Request = None) -> dict:
        participant_name = "Unknown"
        participant_email = "Unknown"
        org_name = "Unknown"
        template_name = "Unknown"
        issued_at = None
        tamper_hash = None
        participant_event = None

        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            cert = await cert_repo.get_by_certificate_id(certificate_id)
            if not cert:
                raise NotFoundError("Certificate not found")

            participant_name = cert.participant.name if cert.participant else "Unknown"
            participant_email = cert.participant.email if cert.participant else "Unknown"
            org_name = cert.organization.name if cert.organization else "Unknown"
            template_name = cert.template.name if cert.template else "Unknown"
            issued_at = cert.issued_at
            tamper_hash = cert.tamper_hash
            participant_event = cert.participant.event if cert.participant else ""

            from app.utils.helpers import verify_tamper_hash
            is_valid = verify_tamper_hash(
                participant=cert.participant,
                certificate_id=cert.certificate_id,
                event=participant_event,
                date=cert.issued_at.isoformat() if cert.issued_at else datetime.utcnow().isoformat(),
                stored_hash=cert.tamper_hash,
                secret=settings.TAMPER_SECRET_KEY
            )
            status_val = VerificationStatus.VALID if is_valid else VerificationStatus.INVALID

            ip_address = request.client.host if request else None
            user_agent = request.headers.get("user-agent") if request else None

            from sqlalchemy import insert
            await db.execute(
                insert(VerificationLog).values(
                    certificate_id=certificate_id,
                    status=status_val,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            )
            await db.commit()

        return {
            "certificate_id": certificate_id,
            "status": status_val.value,
            "is_valid": is_valid,
            "participant": {
                "name": participant_name,
                "email": participant_email
            },
            "organization": {
                "name": org_name
            },
            "issue_date": issued_at,
            "template": {
                "name": template_name
            }
        }

    async def _verify_certificate(self, certificate: Certificate) -> dict:
        from app.utils.helpers import verify_tamper_hash

        is_valid = verify_tamper_hash(
            participant=certificate.participant,
            certificate_id=certificate.certificate_id,
            event=certificate.participant.event,
            date=certificate.issued_at.isoformat() if certificate.issued_at else datetime.utcnow().isoformat(),
            stored_hash=certificate.tamper_hash,
            secret=settings.TAMPER_SECRET_KEY
        )

        status = VerificationStatus.VALID if is_valid else VerificationStatus.INVALID

        return {
            "status": status,
            "is_valid": is_valid
        }

    async def get_verification_stats(self, organization_id: str, from_date: datetime = None, to_date: datetime = None) -> dict:
        async with get_db_context() as db:
            verification_repo = VerificationLogRepository(VerificationLog, db)
            stats = await verification_repo.get_verification_stats(organization_id, from_date, to_date)
            return stats