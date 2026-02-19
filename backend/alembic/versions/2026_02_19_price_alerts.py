"""add price_alerts table

Revision ID: 2026_02_19_price_alerts
Revises: 2026_02_19_exchange_rate_history
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "2026_02_19_price_alerts"
down_revision: Union[str, None] = "2026_02_19_exchange_rate_history"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "price_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("certificate_type", sa.Enum("EUA", "CEA", name="certificatetype", create_type=False), nullable=False),
        sa.Column("direction", sa.Enum("ABOVE", "BELOW", name="alertdirection"), nullable=False),
        sa.Column("target_price", sa.Numeric(18, 4), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, index=True),
        sa.Column("triggered_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime),
    )


def downgrade() -> None:
    op.drop_table("price_alerts")
    op.execute("DROP TYPE IF EXISTS alertdirection")
