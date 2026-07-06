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


def convert_placeholder_position(placeholder: dict, image_width: int, image_height: int) -> dict:
    """Convert percentage-based placeholder coordinates to pixel values."""
    return {
        "x": int((placeholder["x"] / 100) * image_width),
        "y": int((placeholder["y"] / 100) * image_height),
        "width": int((placeholder["width"] / 100) * image_width),
        "height": int((placeholder["height"] / 100) * image_height),
    }


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

            from sqlalchemy.orm import selectinload
            from sqlalchemy import select
            result = await db.execute(
                select(Template).options(
                    selectinload(Template.placeholders)
                ).where(Template.id == template_id)
            )
            template = result.unique().scalars().first()
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
                    await self._generate_certificate_files(certificate, template, participant, placeholder_values, cert_repo)
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

        placeholders = []
        if template and template.placeholders:
            logger.info(
                "CERT RENDER: template.id=%s, template.placeholders type=%s, len=%d",
                template.id, type(template.placeholders).__name__,
                len(template.placeholders) if template.placeholders else -1,
            )
            placeholders = [
                {
                    "type": p.type.value if hasattr(p.type, "value") else str(p.type),
                    "x": float(p.x),
                    "y": float(p.y),
                    "width": float(p.width),
                    "height": float(p.height),
                    "font_family": p.font_family or "Helvetica",
                    "font_size": p.font_size or 12,
                    "font_weight": p.font_weight or "normal",
                    "font_color": p.font_color or "#000000",
                    "font_file_url": getattr(p, "font_file_url", None),
                    "font_file_path": getattr(p, "font_file_path", None),
                    "alignment": p.alignment or "center",
                }
                for p in template.placeholders
            ]
            logger.info(
                "CERT RENDER: loaded %d placeholders from template %s",
                len(placeholders), template.id,
            )
            for ph in placeholders:
                logger.info(
                    "CERT RENDER placeholder: type=%s x=%.1f y=%.1f w=%.1f h=%.1f",
                    ph["type"], ph["x"], ph["y"], ph["width"], ph["height"],
                )
        else:
            logger.warning("CERT RENDER: template %s has no placeholders, using defaults", template.id if template else "None")

        if not placeholders:
            raise RuntimeError(
                f"Template {template.id} has zero placeholders - render aborted. "
                "Run AI Analyze and Accept AI Placement first."
            )

        try:
            self._render_certificate_to_pdf(
                template.file_path if template else None,
                certificate,
                participant,
                placeholder_values,
                pdf_path,
                placeholders,
            )
        except Exception as e:
            logger.warning(f"PDF render failed: {e}")
            pdf_path = None

        try:
            self._render_certificate_to_png(
                template.file_path if template else None,
                certificate,
                participant,
                placeholder_values,
                png_path,
                placeholders,
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

    def _render_certificate_to_pdf(self, template_path: str, certificate: Certificate, participant: Participant, placeholder_values: dict, output_path: str, placeholders: list = None) -> None:
        from reportlab.lib.pagesizes import landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib.utils import ImageReader
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os

        canvas_w = 800
        canvas_h = 600

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        c = canvas.Canvas(output_path, pagesize=(canvas_w, canvas_h))

        if template_path and os.path.exists(template_path):
            try:
                c.drawImage(template_path, 0, 0, width=canvas_w, height=canvas_h)
            except Exception:
                c.setFillColorRGB(1, 1, 1)
                c.rect(0, 0, canvas_w, canvas_h, fill=1)

        ph_list = placeholders or []

        if not ph_list:
            logger.info("CERT RENDER PDF: no placeholders, using hardcoded fallback")
            c.setFillColorRGB(0, 0, 0)
            c.setFont("Helvetica-Bold", 24)
            name = placeholder_values.get("name", participant.name)
            c.drawCentredString(canvas_w / 2, canvas_h / 2, name)
            c.setFont("Helvetica", 12)
            c.drawCentredString(canvas_w / 2, canvas_h / 2 - 30, f"Certificate ID: {certificate.certificate_id}")
            c.save()
            return

        for ph in ph_list:
            ph_type = ph["type"]

            pos = convert_placeholder_position(ph, canvas_w, canvas_h)
            render_x = pos["x"]
            render_y = canvas_h - pos["y"] - pos["height"]
            render_w = pos["width"]
            render_h = pos["height"]

            placeholder_value = placeholder_values.get(ph_type, "")
            if not placeholder_value:
                if ph_type == "certificate_id":
                    placeholder_value = certificate.certificate_id
                elif ph_type in ("name", "participant_name"):
                    placeholder_value = participant.name
                elif ph_type == "qr_code":
                    placeholder_value = ""

            if ph_type == "qr_code":
                continue

            if ph_type in ("name", "participant_name"):
                font_size = int(ph.get("font_size", 48))
            elif ph_type == "certificate_id":
                font_size = int(ph.get("font_size", 20))
            else:
                font_size = int(ph.get("font_size", 14))

            font_family = ph.get("font_family", "Helvetica")
            font_weight = ph.get("font_weight", "normal")
            font_color = ph.get("font_color", "#000000")
            font_file_path = ph.get("font_file_path")
            alignment = "right" if ph_type == "certificate_id" else ph.get("alignment", "center")

            r = int(font_color[1:3], 16) / 255.0 if len(font_color) == 7 else 0
            g = int(font_color[3:5], 16) / 255.0 if len(font_color) == 7 else 0
            b = int(font_color[5:7], 16) / 255.0 if len(font_color) == 7 else 0
            c.setFillColorRGB(r, g, b)

            pdf_font = font_family
            if font_file_path and os.path.exists(font_file_path):
                try:
                    pdfmetrics.registerFont(TTFont(font_family, font_file_path))
                except Exception:
                    pass
                if font_weight == "bold":
                    try:
                        bold_path = font_file_path.replace(".ttf", "-Bold.ttf").replace(".otf", "-Bold.otf")
                        if os.path.exists(bold_path):
                            pdfmetrics.registerFont(TTFont(f"{font_family}-Bold", bold_path))
                            pdf_font = f"{font_family}-Bold"
                    except Exception:
                        pass
            else:
                if font_weight == "bold":
                    pdf_font = f"{font_family}-Bold"
                else:
                    pdf_font = font_family
            try:
                c.setFont(pdf_font, font_size)
            except Exception:
                c.setFont("Helvetica", font_size)

            text = str(placeholder_value)
            text_baseline = render_y + render_h / 2 - font_size * 0.35
            if alignment == "center":
                c.drawCentredString(render_x + render_w / 2, text_baseline, text)
            elif alignment == "right":
                c.drawRightString(render_x + render_w, text_baseline, text)
            else:
                c.drawString(render_x, text_baseline, text)

            logger.debug("CERT RENDER PDF: type=%s text=%s at (%.0f, %.0f) w=%.0f font=%s size=%d",
                         ph_type, text[:30], render_x, render_y, render_w, pdf_font, font_size)

        c.save()

    def _render_certificate_to_png(self, template_path: str, certificate: Certificate, participant: Participant, placeholder_values: dict, output_path: str, placeholders: list = None) -> None:
        from PIL import Image, ImageDraw, ImageFont
        import os

        canvas_w = 800
        canvas_h = 600

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        img = Image.new('RGB', (canvas_w, canvas_h), color=(255, 255, 255))

        if template_path and os.path.exists(template_path):
            try:
                template_img = Image.open(template_path)
                template_img = template_img.resize((canvas_w, canvas_h), Image.Resampling.LANCZOS)
                img = template_img.convert('RGB')
            except Exception:
                pass

        draw = ImageDraw.Draw(img)

        ph_list = placeholders or []

        if not ph_list:
            logger.info("CERT RENDER PNG: no placeholders, using hardcoded fallback")
            try:
                font_fallback = ImageFont.truetype("arial.ttf", 24)
            except Exception:
                font_fallback = ImageFont.load_default()
            name = placeholder_values.get("name", participant.name)
            name_bbox = draw.textbbox((0, 0), name, font=font_fallback)
            name_width = name_bbox[2] - name_bbox[0]
            draw.text(((canvas_w - name_width) // 2, canvas_h // 2), name, fill=(0, 0, 0), font=font_fallback)
            img.save(output_path, "PNG")
            return

        for ph in ph_list:
            ph_type = ph["type"]

            pos = convert_placeholder_position(ph, canvas_w, canvas_h)
            render_x = pos["x"]
            render_y = pos["y"]
            render_w = pos["width"]
            render_h = pos["height"]

            placeholder_value = placeholder_values.get(ph_type, "")
            if not placeholder_value:
                if ph_type == "certificate_id":
                    placeholder_value = certificate.certificate_id
                elif ph_type in ("name", "participant_name"):
                    placeholder_value = participant.name
                elif ph_type == "qr_code":
                    placeholder_value = ""

            if ph_type == "qr_code":
                import qrcode
                try:
                    verify_url = f"{settings.VERIFICATION_BASE_URL}/verify/{certificate.certificate_id}"
                    qr_img = qrcode.make(verify_url)
                    qr_size = min(render_w, render_h)
                    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
                    if qr_img.mode != 'RGB':
                        qr_img = qr_img.convert('RGB')
                    img.paste(qr_img, (render_x, render_y))
                except Exception as e:
                    logger.warning(f"QR code render failed: {e}")
                continue

            if ph_type in ("name", "participant_name"):
                font_size = int(ph.get("font_size", 48))
            elif ph_type == "certificate_id":
                font_size = int(ph.get("font_size", 20))
            else:
                font_size = int(ph.get("font_size", 14))

            font_family = ph.get("font_family", "Helvetica")
            font_weight = ph.get("font_weight", "normal")
            font_color = ph.get("font_color", "#000000")
            font_file_path = ph.get("font_file_path")
            alignment = "right" if ph_type == "certificate_id" else ph.get("alignment", "center")

            pil_font = None
            if font_file_path and os.path.exists(font_file_path):
                try:
                    pil_font = ImageFont.truetype(font_file_path, font_size)
                except Exception:
                    pass

            if pil_font is None:
                FONT_FILE = {
                    "Arial": {"normal": "arial.ttf", "bold": "arialbd.ttf"},
                    "Helvetica": {"normal": "arial.ttf", "bold": "arialbd.ttf"},
                    "Times New Roman": {"normal": "times.ttf", "bold": "timesbd.ttf"},
                    "Georgia": {"normal": "georgia.ttf", "bold": "georgiab.ttf"},
                    "Poppins": {"normal": "Poppins-Regular.ttf", "bold": "Poppins-Bold.ttf"},
                    "Montserrat": {"normal": "Montserrat-Regular.ttf", "bold": "Montserrat-Bold.ttf"},
                    "Playfair Display": {"normal": "PlayfairDisplay-Regular.ttf", "bold": "PlayfairDisplay-Bold.ttf"},
                    "Dancing Script": {"normal": "DancingScript-Regular.ttf", "bold": "DancingScript-Bold.ttf"},
                    "Great Vibes": {"normal": "GreatVibes-Regular.ttf", "bold": "GreatVibes-Regular.ttf"},
                }
                family_map = FONT_FILE.get(font_family, {})
                font_file = family_map.get(font_weight, family_map.get("normal", "arial.ttf"))
                try:
                    pil_font = ImageFont.truetype(font_file, font_size)
                except Exception:
                    try:
                        pil_font = ImageFont.truetype("arial.ttf", font_size)
                    except Exception:
                        pil_font = ImageFont.load_default()

            r = int(font_color[1:3], 16) if len(font_color) == 7 else 0
            g = int(font_color[3:5], 16) if len(font_color) == 7 else 0
            b = int(font_color[5:7], 16) if len(font_color) == 7 else 0

            text = str(placeholder_value)
            text_bbox = draw.textbbox((0, 0), text, font=pil_font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height_val = text_bbox[3] - text_bbox[1]

            cx = render_x + render_w / 2
            cy = render_y + render_h / 2

            if alignment == "center":
                tx = cx - text_width / 2
            elif alignment == "right":
                tx = render_x + render_w - text_width
            else:
                tx = render_x
            ty = cy - text_height_val / 2

            draw.text((tx, ty), text, fill=(r, g, b), font=pil_font)

            logger.debug("CERT RENDER PNG: type=%s text=%s at (%.0f, %.0f) w=%.0f font_size=%d",
                         ph_type, text[:30], tx, ty, render_w, font_size)

        img.save(output_path, "PNG")