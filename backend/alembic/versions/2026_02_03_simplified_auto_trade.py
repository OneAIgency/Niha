"""Add interval_seconds and max_liquidity_threshold to auto_trade_market_settings

Revision ID: simplified_auto_trade
Revises: auto_trade_market_settings
Create Date: 2026-02-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'simplified_auto_trade'
down_revision: Union[str, None] = 'auto_trade_market_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add interval_seconds column with default 60 seconds
    op.add_column(
        'auto_trade_market_settings',
        sa.Column('interval_seconds', sa.Integer(), nullable=False, server_default='60')
    )

    # Add max_liquidity_threshold column (nullable - no default max)
    op.add_column(
        'auto_trade_market_settings',
        sa.Column('max_liquidity_threshold', sa.Numeric(18, 2), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('auto_trade_market_settings', 'max_liquidity_threshold')
    op.drop_column('auto_trade_market_settings', 'interval_seconds')
