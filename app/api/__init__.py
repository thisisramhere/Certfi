from fastapi import APIRouter, Depends, status, UploadFile, File, Form, BackgroundTasks, Query, Body, Request
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, List
from datetime import datetime
from app.core.security import get_current_user, get_current_organization
from app.core.exceptions import NotFoundError, ValidationError
from app.models import User, Organization, Template, TemplatePlaceholder, Participant, Certificate, VerificationLog, Analytics
from app.schemas import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    OrganizationCreate, OrganizationUpdate,
    TemplateCreate, TemplateUpdate,
    ParticipantCreate, CertificateCreate,
    TemplatePlaceholderCreate, TemplatePlaceholderUpdate, TemplatePlaceholderResponse
)
from app.services.auth import AuthService, OrganizationService, UserService
from app.services.templates import TemplateService
from app.services.participants import ParticipantService
from app.services.certificates import CertificateService
from app.services.verification import VerificationService
from app.services.analytics import AnalyticsService
from app.services.base import (
    UserRepository, OrganizationRepository, TemplateRepository,
    TemplatePlaceholderRepository, ParticipantRepository, CertificateRepository,
    VerificationLogRepository, AnalyticsRepository, AuditLogRepository,
    CertificateSequenceRepository
)
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)

auth_router = APIRouter(prefix="/auth")
users_router = APIRouter(prefix="/users")
organizations_router = APIRouter(prefix="/organizations")
templates_router = APIRouter(prefix="/templates")
participants_router = APIRouter(prefix="/participants")
certificates_router = APIRouter(prefix="/certificates")
verification_router = APIRouter(prefix="/verify")
analytics_router = APIRouter(prefix="/analytics")


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(lambda: AuthService(UserRepository(User)))
):
    return await auth_service.register(user_data)


@auth_router.post("/login")
async def login(
    login_data: UserLogin,
    request: Request,
    auth_service: AuthService = Depends(lambda: AuthService(UserRepository(User)))
):
    request_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await auth_service.login(login_data, request_ip, user_agent)


@auth_router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(lambda: AuthService(UserRepository(User)))
):
    await auth_service.logout(current_user["sub"])
    return {"message": "Logged out successfully"}


@auth_router.post("/refresh")
async def refresh_token(
    body: dict = Body(...),
    auth_service: AuthService = Depends(lambda: AuthService(UserRepository(User)))
):
    token = body.get("refresh_token", "")
    return await auth_service.refresh_token(token)


@auth_router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(lambda: UserService(UserRepository(User)))
):
    return await user_service.get_user(current_user["sub"])


@organizations_router.post("/")
async def create_organization(
    org_data: OrganizationCreate,
    current_user: dict = Depends(get_current_user),
    organization_service: OrganizationService = Depends(lambda: OrganizationService(OrganizationRepository(Organization)))
):
    return await organization_service.create_organization(org_data, current_user["sub"])


@organizations_router.get("/{org_id}")
async def get_organization(
    org_id: str,
    organization_service: OrganizationService = Depends(lambda: OrganizationService(OrganizationRepository(Organization)))
):
    return await organization_service.get_organization(org_id)


@organizations_router.put("/{org_id}")
async def update_organization(
    org_id: str,
    org_data: OrganizationUpdate,
    organization_service: OrganizationService = Depends(lambda: OrganizationService(OrganizationRepository(Organization)))
):
    return await organization_service.update_organization(org_id, org_data)


@users_router.get("/")
async def list_users(
    skip: int = Query(0),
    limit: int = Query(100),
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(lambda: UserService(UserRepository(User)))
):
    organization_id = current_user.get("organization_id")
    return await user_service.get_users(skip, limit, organization_id)


@users_router.get("/{user_id}")
async def get_user(
    user_id: str,
    user_service: UserService = Depends(lambda: UserService(UserRepository(User)))
):
    return await user_service.get_user(user_id)


@users_router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(lambda: UserService(UserRepository(User)))
):
    return await user_service.update_user(user_id, user_data)


@users_router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(lambda: UserService(UserRepository(User)))
):
    await user_service.delete_user(user_id)
    return {"message": "User deleted successfully"}


@templates_router.post("/")
async def create_template(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    file_type: str = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    dpi: int = Form(default=300),
    background_color: str = Form(default="#FFFFFF"),
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
    await file.seek(0)
    organization_id = current_user.get("organization_id")
    return await template_service.create_template(
        name, description, file, file_type, width, height, dpi, background_color,
        current_user["sub"], organization_id
    )


@templates_router.get("/")
async def list_templates(
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    organization_id = current_user.get("organization_id")
    if organization_id:
        return await template_service.get_templates_by_organization(organization_id)
    return []


@templates_router.get("/{template_id}")
async def get_template(
    template_id: str,
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.get_template(template_id)


@templates_router.put("/{template_id}")
async def update_template(
    template_id: str,
    template_data: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.update_template(template_id, template_data)


@templates_router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    await template_service.delete_template(template_id)
    return {"message": "Template deleted successfully"}


@templates_router.post("/{template_id}/placeholders")
async def add_placeholder(
    template_id: str,
    placeholder_data: TemplatePlaceholderCreate,
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.add_placeholder_to_template(template_id, placeholder_data)


@templates_router.get("/{template_id}/placeholders")
async def get_placeholders(
    template_id: str,
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.get_template_placeholders(template_id)


@templates_router.put("/{template_id}/placeholders/{placeholder_id}")
async def update_placeholder(
    template_id: str,
    placeholder_id: str,
    placeholder_data: TemplatePlaceholderUpdate,
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.update_placeholder(template_id, placeholder_id, placeholder_data)


@templates_router.put("/{template_id}/placeholders")
async def replace_placeholders(
    template_id: str,
    placeholders: List[dict],
    current_user: dict = Depends(get_current_user),
    template_service: TemplateService = Depends(lambda: TemplateService(TemplateRepository(Template), TemplatePlaceholderRepository(TemplatePlaceholder)))
):
    return await template_service.replace_placeholders(template_id, placeholders)


@participants_router.post("/import")
async def import_participants(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    field_mapping: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    participant_service: ParticipantService = Depends(lambda: ParticipantService(ParticipantRepository(Participant)))
):
    import json
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
    await file.seek(0)
    mapping = json.loads(field_mapping) if field_mapping else None
    organization_id = current_user.get("organization_id")
    return await participant_service.import_participants(file, organization_id, mapping)


@participants_router.get("/")
async def list_participants(
    skip: int = Query(0),
    limit: int = Query(100),
    search: str = Query(None),
    current_user: dict = Depends(get_current_user),
    participant_service: ParticipantService = Depends(lambda: ParticipantService(ParticipantRepository(Participant)))
):
    organization_id = current_user.get("organization_id")
    if organization_id:
        return await participant_service.get_participants(organization_id, skip, limit, search)
    return []


@participants_router.delete("/{participant_id}")
async def delete_participant(
    participant_id: str,
    current_user: dict = Depends(get_current_user),
    participant_service: ParticipantService = Depends(lambda: ParticipantService(ParticipantRepository(Participant)))
):
    organization_id = current_user.get("organization_id")
    await participant_service.delete_participant(participant_id, organization_id)
    return {"message": "Participant deleted successfully"}


@certificates_router.post("/generate")
async def generate_certificates(
    background_tasks: BackgroundTasks,
    certificates_data: List[CertificateCreate],
    current_user: dict = Depends(get_current_user),
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    organization_id = current_user.get("organization_id")
    results = []
    for cert_data in certificates_data:
        try:
            certificate = await certificate_service.generate_certificate(
                participant_id=cert_data.participant_id,
                template_id=cert_data.template_id,
                organization_id=organization_id,
                creator_id=current_user["sub"],
                participant_data={"name": cert_data.participant_name, "email": cert_data.participant_email, "event": cert_data.participant_event},
                template_data={"name": cert_data.template_name},
                placeholder_values={"name": cert_data.participant_name, "event": cert_data.participant_event or ""}
            )
            results.append({"certificate_id": certificate.certificate_id, "status": "success"})
        except Exception as e:
            results.append({"certificate_id": None, "status": "failed", "error": str(e)})

    return {"results": results}


@certificates_router.get("/")
async def list_certificates(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    from app.models import CertificateStatus
    organization_id = current_user.get("organization_id")
    status_enum = CertificateStatus(status) if status else None
    if organization_id:
        return await certificate_service.get_certificates(organization_id, status_enum)
    return []


@certificates_router.get("/download-all")
async def download_all_certificates(
    current_user: dict = Depends(get_current_user),
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    organization_id = current_user.get("organization_id")
    zip_filename = await certificate_service.download_all_certificates(organization_id)
    return FileResponse(zip_filename, filename="certificates.zip")


@certificates_router.get("/{certificate_id}")
async def get_certificate(
    certificate_id: str,
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    return await certificate_service.get_certificate(certificate_id)


@certificates_router.get("/{certificate_id}/pdf")
async def download_pdf(
    certificate_id: str,
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    files = await certificate_service.get_certificate_files(certificate_id)
    if not files.get("pdf"):
        raise NotFoundError("PDF not found for this certificate")
    return FileResponse(files["pdf"], filename=f"{certificate_id}.pdf")


@certificates_router.get("/{certificate_id}/png")
async def download_png(
    certificate_id: str,
    certificate_service: CertificateService = Depends(lambda: CertificateService(
        CertificateRepository(Certificate), AnalyticsRepository(Analytics)
    ))
):
    files = await certificate_service.get_certificate_files(certificate_id)
    if not files.get("png"):
        raise NotFoundError("PNG not found for this certificate")
    return FileResponse(files["png"], filename=f"{certificate_id}.png")


@verification_router.get("/stats")
async def get_verification_stats(
    current_user: dict = Depends(get_current_user),
    from_date: datetime = Query(None),
    to_date: datetime = Query(None),
    verification_service: VerificationService = Depends(lambda: VerificationService(
        VerificationLogRepository(VerificationLog), CertificateRepository(Certificate)
    ))
):
    organization_id = current_user.get("organization_id")
    return await verification_service.get_verification_stats(organization_id, from_date, to_date)


@verification_router.get("/{certificate_id}")
async def verify_certificate(
    certificate_id: str,
    request: Request,
    verification_service: VerificationService = Depends(lambda: VerificationService(
        VerificationLogRepository(VerificationLog), CertificateRepository(Certificate)
    ))
):
    return await verification_service.verify_certificate(certificate_id, request)


@analytics_router.get("/summary")
async def get_analytics_summary(
    current_user: dict = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService(AnalyticsRepository(Analytics)))
):
    organization_id = current_user.get("organization_id")
    return await analytics_service.get_summary(organization_id)


@analytics_router.get("/")
async def get_analytics(
    period: str = Query("daily"),
    current_user: dict = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: AnalyticsService(AnalyticsRepository(Analytics)))
):
    organization_id = current_user.get("organization_id")
    return await analytics_service.get_analytics(organization_id, period)


main_router = APIRouter()
main_router.include_router(auth_router)
main_router.include_router(users_router)
main_router.include_router(organizations_router)
main_router.include_router(templates_router)
main_router.include_router(participants_router)
main_router.include_router(certificates_router)
main_router.include_router(verification_router)
main_router.include_router(analytics_router)
