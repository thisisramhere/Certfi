from typing import Optional, Dict, List
from datetime import datetime, timedelta
from app.database.session import get_db_context
from app.models import Analytics
from app.services.base import AnalyticsRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, analytics_repo: AnalyticsRepository):
        self.analytics_repo = analytics_repo

    async def get_analytics(self, organization_id: str, period: str = "daily") -> List[Dict]:
        async with get_db_context() as db:
            analytics_repo = AnalyticsRepository(Analytics, db)
            
            if period == "daily":
                days_ago = 30
                current_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                analytics_list = []
                
                for i in range(days_ago):
                    date = current_date - timedelta(days=i)
                    analytics = await analytics_repo.get_daily_analytics(organization_id, date)
                    if analytics:
                        analytics_list.append({
                            "date": date.isoformat(),
                            "certificates_generated": analytics.certificates_generated,
                            "certificates_sent": analytics.certificates_sent,
                            "certificates_failed": analytics.certificates_failed,
                            "verifications_total": analytics.verifications_total,
                            "verifications_valid": analytics.verifications_valid,
                            "verifications_invalid": analytics.verifications_invalid,
                            "verifications_tampered": analytics.verifications_tampered,
                            "downloads_pdf": analytics.downloads_pdf,
                            "downloads_png": analytics.downloads_png,
                            "downloads_zip": analytics.downloads_zip,
                            "unique_participants": analytics.unique_participants
                        })
                
                return sorted(analytics_list, key=lambda x: x["date"])
            
            return []

    async def get_summary(self, organization_id: str) -> Dict:
        async with get_db_context() as db:
            from sqlalchemy import select, func
            from app.models import Certificate, CertificateStatus, VerificationLog, Template, Participant

            analytics_repo = AnalyticsRepository(Analytics, db)

            total_certs_q = await db.execute(
                select(func.count()).select_from(Certificate).where(Certificate.organization_id == organization_id)
            )
            total_certificates = total_certs_q.scalar() or 0

            total_verifs_q = await db.execute(
                select(func.count()).select_from(VerificationLog)
            )
            total_verifications = total_verifs_q.scalar() or 0

            from dateutil.relativedelta import relativedelta
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            current_month = today.replace(day=1)

            today_analytics = await analytics_repo.get_daily_analytics(organization_id, today)
            month_analytics = await analytics_repo.get_daily_analytics(organization_id, current_month)

            return {
                "total_certificates": total_certificates,
                "total_verifications": total_verifications,
                "tampered_count": 0,
                "total_downloads": (month_analytics.downloads_pdf + month_analytics.downloads_png + month_analytics.downloads_zip) if month_analytics else 0,
                "today": {
                    "certificates_generated": today_analytics.certificates_generated if today_analytics else 0,
                    "certificates_sent": today_analytics.certificates_sent if today_analytics else 0,
                    "verifications_total": today_analytics.verifications_total if today_analytics else 0,
                    "verifications_valid": today_analytics.verifications_valid if today_analytics else 0
                },
                "this_month": {
                    "certificates_generated": month_analytics.certificates_generated if month_analytics else 0,
                    "verifications_total": month_analytics.verifications_total if month_analytics else 0,
                    "downloads_pdf": month_analytics.downloads_pdf if month_analytics else 0
                }
            }