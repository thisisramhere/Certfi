"""initial_tables

Revision ID: 0001
Revises: 
Create Date: 2026-06-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'organizations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, index=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('settings', JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), server_default='viewer', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=True),
    )
    op.create_index('ix_users_email_active', 'users', ['email', 'is_active'])

    op.create_table(
        'templates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_type', sa.String(10), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('dpi', sa.Integer(), server_default='300', nullable=False),
        sa.Column('background_color', sa.String(7), server_default='#FFFFFF', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
    )
    op.create_index('ix_templates_owner_active', 'templates', ['owner_id', 'is_active'])
    op.create_index('ix_templates_org_active', 'templates', ['organization_id', 'is_active'])

    op.create_table(
        'template_placeholders',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('custom_key', sa.String(100), nullable=True),
        sa.Column('x', sa.Integer(), nullable=False),
        sa.Column('y', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('font_family', sa.String(100), server_default='Helvetica', nullable=False),
        sa.Column('font_size', sa.Integer(), server_default='12', nullable=False),
        sa.Column('font_weight', sa.String(20), server_default='normal', nullable=False),
        sa.Column('font_color', sa.String(7), server_default='#000000', nullable=False),
        sa.Column('alignment', sa.String(20), server_default='left', nullable=False),
        sa.Column('rotation', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('opacity', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('is_required', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('default_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('template_id', UUID(as_uuid=True), sa.ForeignKey('templates.id'), nullable=False),
    )
    op.create_index('ix_placeholders_template', 'template_placeholders', ['template_id'])

    op.create_table(
        'participants',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), index=True, nullable=False),
        sa.Column('event', sa.String(255), nullable=True),
        sa.Column('position', sa.String(255), nullable=True),
        sa.Column('custom_fields', JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
    )
    op.create_index('ix_participants_org_email', 'participants', ['organization_id', 'email'])
    op.create_index('ix_participants_org_event', 'participants', ['organization_id', 'event'])

    op.create_table(
        'certificates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('certificate_id', sa.String(50), unique=True, index=True, nullable=False),
        sa.Column('qr_token', sa.String(500), unique=True, index=True, nullable=False),
        sa.Column('tamper_hash', sa.String(64), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('pdf_path', sa.String(500), nullable=True),
        sa.Column('png_path', sa.String(500), nullable=True),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('template_id', UUID(as_uuid=True), sa.ForeignKey('templates.id'), nullable=False),
        sa.Column('participant_id', UUID(as_uuid=True), sa.ForeignKey('participants.id'), nullable=False),
        sa.Column('creator_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
    )
    op.create_index('ix_certificates_org_status', 'certificates', ['organization_id', 'status'])
    op.create_index('ix_certificates_participant', 'certificates', ['participant_id'])
    op.create_index('ix_certificates_template', 'certificates', ['template_id'])
    op.create_index('ix_certificates_creator', 'certificates', ['creator_id'])
    op.create_index('ix_certificates_issued', 'certificates', ['issued_at'])

    op.create_table(
        'verification_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('certificate_id', sa.String(50), index=True, nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('certificate_fk', UUID(as_uuid=True), sa.ForeignKey('certificates.id'), nullable=True),
    )
    op.create_index('ix_verification_logs_cert', 'verification_logs', ['certificate_id'])
    op.create_index('ix_verification_logs_verified', 'verification_logs', ['verified_at'])

    op.create_table(
        'analytics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('date', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('certificates_generated', sa.Integer(), server_default='0', nullable=False),
        sa.Column('certificates_sent', sa.Integer(), server_default='0', nullable=False),
        sa.Column('certificates_failed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('verifications_total', sa.Integer(), server_default='0', nullable=False),
        sa.Column('verifications_valid', sa.Integer(), server_default='0', nullable=False),
        sa.Column('verifications_invalid', sa.Integer(), server_default='0', nullable=False),
        sa.Column('verifications_tampered', sa.Integer(), server_default='0', nullable=False),
        sa.Column('downloads_pdf', sa.Integer(), server_default='0', nullable=False),
        sa.Column('downloads_png', sa.Integer(), server_default='0', nullable=False),
        sa.Column('downloads_zip', sa.Integer(), server_default='0', nullable=False),
        sa.Column('unique_participants', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
    )

    op.create_table(
        'audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('action', sa.String(100), index=True, nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(100), nullable=True),
        sa.Column('details', JSON(), server_default='{}', nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
    )
    op.create_index('ix_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_org_action', 'audit_logs', ['organization_id', 'action'])
    op.create_index('ix_audit_logs_created', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('analytics')
    op.drop_table('verification_logs')
    op.drop_table('certificates')
    op.drop_table('participants')
    op.drop_table('template_placeholders')
    op.drop_table('templates')
    op.drop_table('users')
    op.drop_table('organizations')
