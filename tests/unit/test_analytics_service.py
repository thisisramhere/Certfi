import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from app.services.analytics import AnalyticsService


class TestAnalyticsService:
    @pytest.fixture
    def mock_analytics_repo(self):
        return Mock()

    @pytest.fixture
    def analytics_service(self, mock_analytics_repo):
        return AnalyticsService(mock_analytics_repo)

    @pytest.mark.asyncio
    async def test_get_analytics_daily(self, analytics_service, mock_analytics_repo):
        mock_analytics = Mock(
            certificates_generated=10,
            certificates_sent=8,
            certificates_failed=2,
            verifications_total=50,
            verifications_valid=45,
            verifications_invalid=3,
            verifications_tampered=2,
            downloads_pdf=20,
            downloads_png=15,
            downloads_zip=5,
            unique_participants=25
        )
        mock_analytics_repo.get_daily_analytics.return_value = mock_analytics

        with patch('app.services.analytics.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await analytics_service.get_analytics("org123", "daily")

        assert isinstance(result, list)
        assert len(result) > 0
        assert result[0]["certificates_generated"] == 10

    @pytest.mark.asyncio
    async def test_get_analytics_monthly(self, analytics_service, mock_analytics_repo):
        mock_analytics = Mock(
            certificates_generated=100,
            certificates_sent=90,
            certificates_failed=10,
            verifications_total=500,
            verifications_valid=450,
            verifications_invalid=30,
            verifications_tampered=20,
            downloads_pdf=200,
            downloads_png=150,
            downloads_zip=50,
            unique_participants=250
        )
        mock_analytics_repo.get_daily_analytics.return_value = mock_analytics

        with patch('app.services.analytics.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await analytics_service.get_analytics("org123", "monthly")

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_summary(self, analytics_service, mock_analytics_repo):
        mock_today = Mock(
            certificates_generated=5,
            certificates_sent=4,
            verifications_total=25,
            verifications_valid=22
        )
        mock_month = Mock(
            certificates_generated=100,
            verifications_total=500,
            downloads_pdf=200
        )
        mock_analytics_repo.get_daily_analytics.side_effect = [mock_today, mock_month]

        with patch('app.services.analytics.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await analytics_service.get_summary("org123")

        assert "today" in result
        assert "this_month" in result
        assert result["today"]["certificates_generated"] == 5
        assert result["this_month"]["certificates_generated"] == 100

    @pytest.mark.asyncio
    async def test_get_summary_no_data(self, analytics_service, mock_analytics_repo):
        mock_analytics_repo.get_daily_analytics.return_value = None

        with patch('app.services.analytics.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await analytics_service.get_summary("org123")

        assert result["today"]["certificates_generated"] == 0
        assert result["this_month"]["certificates_generated"] == 0
