"""Add avg_spread and tick_size to auto_trade_market_settings

Revision ID: 2026_02_13_spread_and_tick_size
Revises: 2026_02_11_check_constraints
Create Date: 2026-02-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2026_02_13_spread_and_tick_size"
down_revision: Union[str, None] = "2026_02_11_check_constraints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("avg_spread", sa.Numeric(10, 4), nullable=True),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("tick_size", sa.Numeric(10, 4), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auto_trade_market_settings", "tick_size")
    op.drop_column("auto_trade_market_settings", "avg_spread")
