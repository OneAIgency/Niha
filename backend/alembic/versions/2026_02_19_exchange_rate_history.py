"""add exchange_rate_history table

Revision ID: 2026_02_19_exchange_rate_history
Revises: 2026_02_17_referral_commissions
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "2026_02_19_exchange_rate_history"
down_revision: Union[str, None] = "2026_02_17_referral_commissions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exchange_rate_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("from_currency", sa.String(3), nullable=False),
        sa.Column("to_currency", sa.String(3), nullable=False),
        sa.Column("rate", sa.Numeric(18, 8), nullable=False),
        sa.Column("source", sa.String(100)),
        sa.Column("recorded_at", sa.DateTime, index=True),
    )


def downgrade() -> None:
    op.drop_table("exchange_rate_history")
