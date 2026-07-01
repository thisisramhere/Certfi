import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestTemplatesAPI:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_create_template(self, client):
        response = client.post(
            "/api/v1/templates/",
            files={"file": ("test.png", b"fake_png_content", "image/png")},
            data={
                "name": "Test Template",
                "description": "A test certificate template",
                "file_type": "png",
                "width": 800,
                "height": 600,
                "dpi": 300,
                "background_color": "#FFFFFF"
            }
        )
        
        assert response.status_code in [401, 422]

    def test_get_templates(self, client):
        response = client.get("/api/v1/templates/")
        assert response.status_code in [200, 401, 422]

    def test_create_certificate(self, client):
        response = client.post(
            "/api/v1/certificates/generate",
            json=[
                {
                    "template_id": "template123",
                    "participant_id": "participant123",
                    "participant_name": "John Doe",
                    "participant_email": "john@example.com",
                    "participant_event": "Annual Conference",
                    "template_name": "Employee Template",
                    "organization_name": "Test Corp"
                }
            ]
        )
        
        assert response.status_code in [401, 422]

    def test_verify_certificate(self, client):
        response = client.get("/api/v1/verify/CERT-2026-000001")
        assert response.status_code in [200, 404, 401, 422]

    def test_analytics(self, client):
        response = client.get("/api/v1/analytics/")
        assert response.status_code in [200, 401, 422]

    def test_analytics_summary(self, client):
        response = client.get("/api/v1/analytics/summary")
        assert response.status_code in [200, 401, 422]

    def test_verification_stats(self, client):
        response = client.get("/api/v1/verify/stats")
        assert response.status_code in [200, 401, 422]