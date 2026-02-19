"""Add platform_settings table

Revision ID: 2026_02_19_platform_settings
Revises: 2026_02_19_buyer_nda_flow
Create Date: 2026-02-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "2026_02_19_platform_settings"
down_revision = "2026_02_19_buyer_nda_flow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.String(500), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    # Seed default commission rate
    op.execute(
        "INSERT INTO platform_settings (key, value) VALUES ('introducer_commission_rate', '0.010000')"
    )


def downgrade() -> None:
    op.drop_table("platform_settings")
