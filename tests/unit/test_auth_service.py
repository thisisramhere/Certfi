import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException
from app.schemas import UserCreate, UserLogin, UserResponse, UserRole
from app.services.auth import AuthService, OrganizationService, UserService
from app.core.exceptions import AuthenticationError, ConflictError


class TestAuthService:
    @pytest.fixture
    def mock_user_repo_with_db(self):
        mock_db = AsyncMock()
        mock_repo = Mock(db=mock_db)
        return Mock(return_value=mock_repo)

    @pytest.fixture
    def auth_service(self, mock_user_repo_with_db):
        return AuthService(mock_user_repo_with_db())

    @pytest.mark.asyncio
    async def test_register_success(self, auth_service, mock_user_repo_with_db):
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            role=UserRole.VIEWER
        )

        mock_user = Mock(id="123", email="test@example.com", hashed_password="hashed")
        mock_user_repo_with_db().create.return_value = mock_user

        with patch('app.services.auth.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None
            
            with patch('app.services.auth.get_password_hash') as mock_hash:
                mock_hash.return_value = "hashed_password"

                result = await auth_service.register(user_data)

        assert result.email == "test@example.com"
        assert result.full_name == "Test User"

    @pytest.mark.asyncio
    async def test_login_success(self, auth_service, mock_user_repo_with_db):
        login_data = UserLogin(email="test@example.com", password="password123")
        
        mock_user = Mock(
            id="123",
            email="test@example.com",
            full_name="Test User",
            role=UserRole.VIEWER,
            is_active=True,
            hashed_password="hashed"
        )
        
        mock_user_repo_with_db().get_by_email.return_value = mock_user
        
        with patch('app.services.auth.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None
            
            with patch('app.services.auth.get_password_hash') as mock_hash:
                mock_hash.return_value = "hashed_password"

                result = await auth_service.login(login_data, "127.0.0.1", "test-agent")

        assert result["user"].email == "test@example.com"
        assert "token_pair" in result
        assert result["token_pair"]["token_type"] == "bearer"


class TestOrganizationService:
    @pytest.fixture
    def mock_org_repo(self):
        return Mock()

    @pytest.fixture
    def org_service(self, mock_org_repo):
        return OrganizationService(mock_org_repo)

    @pytest.mark.asyncio
    async def test_create_organization(self, org_service, mock_org_repo):
        from app.schemas import OrganizationCreate

        org_data = OrganizationCreate(
            name="Test Org",
            slug="test-org",
            description="Test description"
        )

        mock_org = Mock(id="org123")
        mock_org_repo.create.return_value = mock_org

        with patch('app.services.auth.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None
            
            with patch('app.services.auth.UserRepository') as mock_user_repo_class:
                mock_user_repo_class.return_value.get.return_value = Mock(id="user123", organization_id=None)
                mock_user_repo_class.return_value.update.return_value = Mock()

                result = await org_service.create_organization(org_data, "user123")

        assert result["organization"].id == "org123"
        assert result["owner_role_updated"] is True


class TestUserService:
    @pytest.fixture
    def mock_user_repo(self):
        return Mock()

    @pytest.fixture
    def user_service(self, mock_user_repo):
        return UserService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_get_user(self, user_service, mock_user_repo):
        mock_user = Mock(
            id="user123",
            email="test@example.com",
            full_name="Test User",
            role=UserRole.VIEWER,
            is_active=True,
            is_verified=False
        )

        mock_user_repo.get.return_value = mock_user

        with patch('app.services.auth.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await user_service.get_user("user123")

        assert result.id == "user123"
        assert result.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_update_user(self, user_service, mock_user_repo):
        from app.schemas import UserUpdate

        user_data = UserUpdate(full_name="Updated Name")
        mock_user = Mock(id="user123")

        mock_user_repo.get.return_value = mock_user
        mock_user_repo.update.return_value = mock_user

        with patch('app.services.auth.get_db_context') as mock_context:
            mock_context.return_value.__aenter__.return_value = AsyncMock()
            mock_context.return_value.__aexit__.return_value = None

            result = await user_service.update_user("user123", user_data)

        assert result.full_name == "Updated Name"
        mock_user_repo.update.assert_called_once()