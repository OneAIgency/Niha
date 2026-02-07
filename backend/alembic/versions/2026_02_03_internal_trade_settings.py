"""Add internal trade settings to auto_trade_market_settings

Revision ID: internal_trade_settings
Revises: simplified_auto_trade
Create Date: 2026-02-03 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'internal_trade_settings'
down_revision: Union[str, None] = 'simplified_auto_trade'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add internal trade interval (seconds)
    op.add_column(
        'auto_trade_market_settings',
        sa.Column('internal_trade_interval', sa.Integer(), nullable=True)
    )

    # Add internal trade volume min (EUR)
    op.add_column(
        'auto_trade_market_settings',
        sa.Column('internal_trade_volume_min', sa.Numeric(18, 2), nullable=True)
    )

    # Add internal trade volume max (EUR)
    op.add_column(
        'auto_trade_market_settings',
        sa.Column('internal_trade_volume_max', sa.Numeric(18, 2), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('auto_trade_market_settings', 'internal_trade_volume_max')
    op.drop_column('auto_trade_market_settings', 'internal_trade_volume_min')
    op.drop_column('auto_trade_market_settings', 'internal_trade_interval')
