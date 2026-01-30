"""Drop request_type from contact_requests; use status (role) only.

Revision ID: 2026_01_30_request_type
Revises: 2026_01_29_full_flow
Create Date: 2026-01-30

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_30_request_type"
down_revision = "2026_01_29_full_flow"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("contact_requests", "request_type", schema=None)


def downgrade():
    op.add_column(
        "contact_requests",
        sa.Column("request_type", sa.String(50), nullable=True, server_default="join"),
        schema=None,
    )
