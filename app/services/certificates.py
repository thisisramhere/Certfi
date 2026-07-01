from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status, UploadFile
from uuid import uuid4
from app.database.session import get_db_context
from app.models import Certificate, CertificateStatus, VerificationStatus, VerificationLog, Participant, Template, Organization, User, Analytics, CertificateSequence
from app.schemas import CertificateCreate, CertificateUpdate, CertificateResponse
from app.services.base import CertificateRepository, AnalyticsRepository, CertificateSequenceRepository
from app.core.exceptions import NotFoundError, ConflictError
from app.utils.helpers import generate_certificate_id, generate_qr_code, generate_watermark, compute_tamper_hash, generate_unique_filename
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class CertificateService:
    def __init__(
        self,
        cert_repo: CertificateRepository,
        analytics_repo: AnalyticsRepository
    ):
        self.cert_repo = cert_repo
        self.analytics_repo = analytics_repo

    async def generate_certificate(
        self,
        participant_id: str,
        template_id: str,
        organization_id: str,
        creator_id: str,
        participant_data: dict,
        template_data: dict,
        placeholder_values: dict
    ) -> CertificateResponse:
        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            analytics_repo = AnalyticsRepository(Analytics, db)
            
            participant = await db.get(Participant, participant_id)
            if not participant:
                raise NotFoundError("Participant not found")
            
            template = await db.get(Template, template_id)
            if not template:
                raise NotFoundError("Template not found")
            
            organization = await db.get(Organization, organization_id)
            if not organization:
                raise NotFoundError("Organization not found")
            
            creator = await db.get(User, creator_id)
            if not creator:
                raise NotFoundError("Creator not found")
            
            certificate = None
            try:
                certificate_data = await self._prepare_certificate_data(
                    participant, template, participant_data, template_data, placeholder_values, creator_id, cert_repo
                )
                
                certificate = await cert_repo.create(certificate_data)
                
                try:
                    self._generate_certificate_files(certificate, template, participant, placeholder_values, cert_repo)
                except Exception as file_error:
                    logger.warning(f"Certificate file generation failed (non-fatal): {file_error}")
                
                await cert_repo.update_status(certificate.id, CertificateStatus.GENERATED)
                
                await self._update_analytics(organization_id)
                
                logger.info(f"Certificate generated: {certificate.certificate_id} for {participant.name}")
                return CertificateResponse.model_validate(certificate)
                
            except Exception as e:
                raise

    async def _prepare_certificate_data(
        self,
        participant: Participant,
        template: Template,
        participant_data: dict,
        template_data: dict,
        placeholder_values: dict,
        creator_id: str = None,
        cert_repo=None
    ) -> dict:
        now = datetime.utcnow()
        
        current_year = now.year
        next_year = current_year + 1 if now.month > 6 else current_year
        
        year = next_year
        
        certificate_id = await self._generate_unique_certificate_id(participant.organization_id, year, cert_repo)
        
        qr_token = generate_qr_code({
            "certificate_id": certificate_id,
            "participant_id": str(participant.id),
            "template_id": str(template.id),
            "organization_id": str(participant.organization_id),
            "issue_date": now.isoformat(),
            "secret": settings.TAMPER_SECRET_KEY[:32]
        })
        
        tamper_hash = compute_tamper_hash(
            participant=participant,
            certificate_id=certificate_id,
            event=participant.event,
            date=now.isoformat(),
            secret=settings.TAMPER_SECRET_KEY
        )
        
        return {
            "certificate_id": certificate_id,
            "qr_token": qr_token,
            "tamper_hash": tamper_hash,
            "status": CertificateStatus.PENDING,
            "template_id": template.id,
            "participant_id": participant.id,
            "creator_id": creator_id,
            "organization_id": participant.organization_id
        }

    async def _generate_unique_certificate_id(self, organization_id: str, year: int, cert_repo=None) -> str:
        sequence = await self._get_next_sequence_for_year(organization_id, year)
        
        certificate_id = settings.CERTIFICATE_ID_FORMAT.format(
            prefix=settings.CERTIFICATE_ID_PREFIX,
            year=year,
            sequence=sequence
        )
        
        repo = cert_repo or self.cert_repo
        existing = await repo.get_by_certificate_id(certificate_id)
        if existing:
            return await self._generate_unique_certificate_id(organization_id, year, cert_repo)
        
        return certificate_id

    async def _get_next_sequence_for_year(self, organization_id: str, year: int) -> int:
        async with get_db_context() as db:
            sequence_repo = CertificateSequenceRepository(CertificateSequence, db)
            sequence = await sequence_repo.get_next_sequence(organization_id, year)
            return sequence

    async def _generate_certificate_files(
        self,
        certificate: Certificate,
        template: Template,
        participant: Participant,
        placeholder_values: dict,
        cert_repo=None
    ) -> None:
        import os
        pdf_path = generate_unique_filename("pdf", certificate.certificate_id)
        png_path = generate_unique_filename("png", certificate.certificate_id)
        
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        os.makedirs(os.path.dirname(png_path), exist_ok=True)
        
        try:
            self._render_certificate_to_pdf(
                template.file_path,
                certificate,
                participant,
                placeholder_values,
                pdf_path
            )
        except Exception as e:
            logger.warning(f"PDF render failed: {e}")
            pdf_path = None

        try:
            self._render_certificate_to_png(
                template.file_path,
                certificate,
                participant,
                placeholder_values,
                png_path
            )
        except Exception as e:
            logger.warning(f"PNG render failed: {e}")
            png_path = None

        repo = cert_repo or self.cert_repo
        update_fields = {}
        if pdf_path and os.path.exists(pdf_path):
            update_fields["pdf_path"] = pdf_path
        if png_path and os.path.exists(png_path):
            update_fields["png_path"] = png_path
        if update_fields:
            async with get_db_context() as db:
                cert_repo_db = CertificateRepository(Certificate, db)
                cert_db = await db.get(Certificate, certificate.id)
                if cert_db:
                    for k, v in update_fields.items():
                        setattr(cert_db, k, v)
                    await db.commit()

    async def _update_analytics(self, organization_id: str) -> None:
        from dateutil.relativedelta import relativedelta
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        async with get_db_context() as db:
            analytics_repo = AnalyticsRepository(Analytics, db)
            await analytics_repo.update_analytics(
                organization_id, today,
                certificates_generated=1
            )

    async def get_certificates(self, organization_id: str, status: CertificateStatus = None) -> List[CertificateResponse]:
        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            certificates = await cert_repo.list_certificates(organization_id, status)
            return [CertificateResponse.model_validate(cert) for cert in certificates]

    async def get_certificate(self, certificate_id: str) -> CertificateResponse:
        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            certificate = await cert_repo.get_by_certificate_id(certificate_id)
            return CertificateResponse.model_validate(certificate)

    async def get_certificate_files(self, certificate_id: str) -> dict:
        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            cert = await cert_repo.get_by_certificate_id(certificate_id)
            
            files = {}
            if cert and cert.pdf_path:
                files["pdf"] = cert.pdf_path
            if cert and cert.png_path:
                files["png"] = cert.png_path
                
            return files

    async def download_all_certificates(self, organization_id: str) -> str:
        import zipfile
        import os
        async with get_db_context() as db:
            cert_repo = CertificateRepository(Certificate, db)
            certificates = await cert_repo.list_certificates(organization_id)
            
            zip_path = generate_unique_filename("zip", f"bulk_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}")
            os.makedirs(os.path.dirname(zip_path), exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for cert in certificates:
                    if cert.pdf_path and os.path.exists(cert.pdf_path):
                        zf.write(cert.pdf_path, f"{cert.certificate_id}.pdf")
                    if cert.png_path and os.path.exists(cert.png_path):
                        zf.write(cert.png_path, f"{cert.certificate_id}.png")
                    
            return zip_path

    def _render_certificate_to_pdf(self, template_path: str, certificate: Certificate, participant: Participant, placeholder_values: dict, output_path: str) -> None:
        from reportlab.lib.pagesizes import landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib.utils import ImageReader
        import os
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        c = canvas.Canvas(output_path, pagesize=(800, 600))
        
        if os.path.exists(template_path):
            try:
                c.drawImage(template_path, 0, 0, width=800, height=600)
            except Exception:
                c.setFillColorRGB(1, 1, 1)
                c.rect(0, 0, 800, 600, fill=1)
        
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 24)
        
        name = placeholder_values.get("name", participant.name)
        c.drawCentredString(400, 400, name)
        
        c.setFont("Helvetica", 16)
        event = placeholder_values.get("event", participant.event or "")
        c.drawCentredString(400, 350, event)
        
        c.setFont("Helvetica", 12)
        c.drawCentredString(400, 300, f"Certificate ID: {certificate.certificate_id}")
        c.drawCentredString(400, 280, f"Issued: {certificate.issued_at.strftime('%B %d, %Y') if certificate.issued_at else 'Pending'}")
        
        c.save()

    def _render_certificate_to_png(self, template_path: str, certificate: Certificate, participant: Participant, placeholder_values: dict, output_path: str) -> None:
        from PIL import Image, ImageDraw, ImageFont
        import os
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        img = Image.new('RGB', (800, 600), color=(255, 255, 255))
        
        if os.path.exists(template_path):
            try:
                template_img = Image.open(template_path)
                template_img = template_img.resize((800, 600), Image.Resampling.LANCZOS)
                img = template_img.convert('RGB')
            except Exception:
                pass
        
        draw = ImageDraw.Draw(img)
        
        try:
            font_large = ImageFont.truetype("arial.ttf", 24)
            font_medium = ImageFont.truetype("arial.ttf", 16)
            font_small = ImageFont.truetype("arial.ttf", 12)
        except Exception:
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        name = placeholder_values.get("name", participant.name)
        name_bbox = draw.textbbox((0, 0), name, font=font_large)
        name_width = name_bbox[2] - name_bbox[0]
        draw.text(((800 - name_width) // 2, 400), name, fill=(0, 0, 0), font=font_large)
        
        event = placeholder_values.get("event", participant.event or "")
        event_bbox = draw.textbbox((0, 0), event, font=font_medium)
        event_width = event_bbox[2] - event_bbox[0]
        draw.text(((800 - event_width) // 2, 350), event, fill=(0, 0, 0), font=font_medium)
        
        cert_id_text = f"Certificate ID: {certificate.certificate_id}"
        cert_bbox = draw.textbbox((0, 0), cert_id_text, font=font_small)
        cert_width = cert_bbox[2] - cert_bbox[0]
        draw.text(((800 - cert_width) // 2, 300), cert_id_text, fill=(0, 0, 0), font=font_small)
        
        img.save(output_path, "PNG")