"""certificate_sequences_table

Revision ID: 0002
Revises: 
Create Date: 2026-06-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'certificate_sequences',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('sequence', sa.Integer(), server_default='0', nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('organization_id', 'year', name='uq_sequence_org_year'),
    )
    op.create_index('idx_certificate_sequences_org_year', 'certificate_sequences', ['organization_id', 'year'])


def downgrade() -> None:
    op.drop_index('idx_certificate_sequences_org_year', table_name='certificate_sequences')
    op.drop_table('certificate_sequences')
