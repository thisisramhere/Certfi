"""add_custom_font_fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('template_placeholders', sa.Column('font_file_url', sa.String(500), nullable=True))
    op.add_column('template_placeholders', sa.Column('font_file_path', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('template_placeholders', 'font_file_path')
    op.drop_column('template_placeholders', 'font_file_url')
