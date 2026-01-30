"""Rename contact_requests.status to user_role; single source for client state.

Revision ID: 2026_01_30_user_role
Revises: 2026_01_30_request_type
Create Date: 2026-01-30

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_30_user_role"
down_revision = "2026_01_30_request_type"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "contact_requests",
        "status",
        new_column_name="user_role",
        schema=None,
    )


def downgrade():
    op.alter_column(
        "contact_requests",
        "user_role",
        new_column_name="status",
        schema=None,
    )
