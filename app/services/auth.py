from typing import Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.core.security import (
    verify_password, get_password_hash, create_token_pair, decode_token
)
from app.core.exceptions import AuthenticationError, ConflictError
from app.database.session import get_db_context
from app.models import User, Organization, UserRole
from app.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, OrganizationCreate, OrganizationUpdate
from app.services.base import UserRepository, OrganizationRepository
from app.utils import normalize_slug
from app.core.logging import get_logger

logger = get_logger(__name__)


class AuthService:
    def __init__(self, user_repo=None):
        self.user_repo = user_repo

    async def register(self, user_data: UserCreate) -> UserResponse:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)

            existing_user = await user_repo.get_by_email(user_data.email)
            if existing_user:
                raise ConflictError(f"User with email '{user_data.email}' already exists")

            hashed_password = get_password_hash(user_data.password)
            user_dict = user_data.model_dump(exclude={"password"})
            user_dict["hashed_password"] = hashed_password

            user = await user_repo.create(user_dict)
            logger.info(f"User registered: {user.email}")
            return UserResponse.model_validate(user)

    async def login(self, login_data: UserLogin, request_ip: str = None, user_agent: str = None) -> dict:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)

            user = await user_repo.get_by_email(login_data.email)
            if not user or not verify_password(login_data.password, user.hashed_password):
                raise AuthenticationError("Invalid email or password")

            if not user.is_active:
                raise AuthenticationError("Account is deactivated")

            await user_repo.update_last_login(user.id)

            return {
                "user": UserResponse.model_validate(user),
                "token_pair": create_token_pair(str(user.id), user.email, str(user.role.value))
            }

    async def validate_token(self, token: str) -> dict:
        payload = decode_token(token)
        if not payload:
            raise AuthenticationError("Invalid or expired token")

        async with get_db_context() as db:
            user_repo = UserRepository(User, db)
            user = await user_repo.get(payload.get("sub"))

            if not user.is_active:
                raise AuthenticationError("Account is deactivated")

            return {
                "user_id": str(user.id),
                "email": user.email,
                "role": str(user.role.value)
            }

    async def refresh_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload:
            raise AuthenticationError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        token_type = payload.get("type")
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")

        return create_token_pair(user_id, email, role)

    async def logout(self, user_id: str) -> None:
        logger.info(f"User logged out: {user_id}")


class OrganizationService:
    def __init__(self, org_repo=None):
        self.org_repo = org_repo

    async def create_organization(self, org_data: OrganizationCreate, owner_id: str) -> dict:
        async with get_db_context() as db:
            org_repo = OrganizationRepository(Organization, db)

            normalized_slug = normalize_slug(org_data.name)
            org_data.slug = normalized_slug

            org = await org_repo.create(org_data.model_dump())

            user_repo = UserRepository(User, db)
            user = await user_repo.get(owner_id)
            user.organization_id = org.id
            await user_repo.update(user, {"organization_id": str(org.id)})

            return {"organization": org, "owner_role_updated": True}

    async def get_organization(self, org_id: str) -> Organization:
        async with get_db_context() as db:
            org_repo = OrganizationRepository(Organization, db)
            return await org_repo.get(org_id)

    async def update_organization(self, org_id: str, org_data: OrganizationUpdate) -> Organization:
        async with get_db_context() as db:
            org_repo = OrganizationRepository(Organization, db)
            org = await org_repo.get(org_id)

            return await org_repo.update(org, org_data)


class UserService:
    def __init__(self, user_repo=None):
        self.user_repo = user_repo

    async def get_user(self, user_id: str) -> UserResponse:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)
            user = await user_repo.get(user_id)
            return UserResponse.model_validate(user)

    async def get_users(self, skip: int = 0, limit: int = 100, organization_id: str = None) -> list:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)
            users = await user_repo.list_users(skip, limit, organization_id)
            return [UserResponse.model_validate(user) for user in users]

    async def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)
            user = await user_repo.get(user_id)
            updated_user = await user_repo.update(user, user_data)
            return UserResponse.model_validate(updated_user)

    async def delete_user(self, user_id: str) -> None:
        async with get_db_context() as db:
            user_repo = UserRepository(User, db)
            await user_repo.remove(user_id)
