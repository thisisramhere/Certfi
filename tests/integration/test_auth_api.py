import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestAuthAPI:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_register_success(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
                "role": "viewer"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_register_duplicate_email(self, client):
        # First registration
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123",
                "full_name": "Test User",
                "role": "viewer"
            }
        )
        
        assert response.status_code == 201
        
        # Second registration with same email
        response2 = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password456",
                "full_name": "Test User 2",
                "role": "viewer"
            }
        )
        
        assert response2.status_code == 409
        assert "User with email" in response2.json()["message"]

    def test_login_success(self, client):
        # Create user first
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "login_test@example.com",
                "password": "password123",
                "full_name": "Login Test User",
                "role": "viewer"
            }
        )
        
        # Then login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "login_test@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token_pair" in data
        assert data["token_pair"]["token_type"] == "bearer"
        assert "access_token" in data["token_pair"]
        assert "refresh_token" in data["token_pair"]

    def test_login_invalid_credentials(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "Authentication failed" in response.json()["message"]

    def test_get_current_user(self, client):
        # Register user
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "getuser@example.com",
                "password": "password123",
                "full_name": "Get User Test",
                "role": "staff"
            }
        )
        
        assert register_response.status_code == 201
        
        # Get token from login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "getuser@example.com",
                "password": "password123"
            }
        )
        
        assert login_response.status_code == 200
        token = login_response.json()["token_pair"]["access_token"]
        
        # Get current user with token
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "getuser@example.com"

    def test_refresh_token(self, client):
        # Register user
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresh@example.com",
                "password": "password123",
                "full_name": "Refresh Test",
                "role": "viewer"
            }
        )
        
        assert register_response.status_code == 201
        
        # Get refresh token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "refresh@example.com",
                "password": "password123"
            }
        )
        
        assert login_response.status_code == 200
        refresh_token = login_response.json()["token_pair"]["refresh_token"]
        
        # Use refresh token to get new tokens
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_logout(self, client):
        # Register user
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "logout@example.com",
                "password": "password123",
                "full_name": "Logout Test",
                "role": "viewer"
            }
        )
        
        assert register_response.status_code == 201
        
        # Get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "logout@example.com",
                "password": "password123"
            }
        )
        
        assert login_response.status_code == 200
        token = login_response.json()["token_pair"]["access_token"]
        
        # Logout
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert "Logged out successfully" in response.json()["message"]