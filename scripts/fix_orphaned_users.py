"""
Migration script: Fix users with NULL organization_id.

Run with:
    python scripts/fix_orphaned_users.py

What it does:
    1. Finds all users where organization_id IS NULL
    2. Creates a personal organization for each
    3. Updates the user's organization_id to point to the new org
"""

import asyncio
import re
import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import async_session_maker
from app.models import User, Organization


def normalize_slug(name: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\s]", "", name.lower())
    normalized = re.sub(r"\s+", "-", normalized.strip())
    return normalized[:100]


async def fix_orphaned_users():
    async with async_session_maker() as session:
        result = await session.execute(
            select(User).where(User.organization_id.is_(None))
        )
        orphaned_users = result.scalars().all()

        if not orphaned_users:
            print("No orphaned users found. All users have an organization.")
            return

        print(f"Found {len(orphaned_users)} user(s) with NULL organization_id.\n")

        for user in orphaned_users:
            org_name = f"{user.full_name}'s Organization"
            org_slug = normalize_slug(org_name)

            existing_slug = await session.execute(
                select(Organization).where(Organization.slug == org_slug)
            )
            if existing_slug.scalars().first():
                org_slug = f"{org_slug}-{uuid.uuid4().hex[:8]}"

            org = Organization(
                id=uuid.uuid4(),
                name=org_name,
                slug=org_slug,
                description=f"Organization for {user.full_name}",
                contact_email=user.email,
                is_active=True,
                settings={},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            session.add(org)
            await session.flush()

            await session.execute(
                update(User)
                .where(User.id == user.id)
                .values(organization_id=org.id)
            )

            print(f"  Fixed: {user.email} -> org '{org_name}' (id={org.id})")

        await session.commit()
        print(f"\nDone. {len(orphaned_users)} user(s) repaired.")


if __name__ == "__main__":
    asyncio.run(fix_orphaned_users())
