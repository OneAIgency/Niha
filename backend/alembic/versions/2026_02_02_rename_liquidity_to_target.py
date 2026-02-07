"""rename_liquidity_to_target

Revision ID: liquidity_to_target
Revises: auto_trade_settings
Create Date: 2026-02-02 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'liquidity_to_target'
down_revision: Union[str, None] = 'auto_trade_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns from max_*_liquidity to target_*_liquidity
    op.alter_column('auto_trade_settings', 'max_ask_liquidity',
                    new_column_name='target_ask_liquidity')
    op.alter_column('auto_trade_settings', 'max_bid_liquidity',
                    new_column_name='target_bid_liquidity')


def downgrade() -> None:
    op.alter_column('auto_trade_settings', 'target_ask_liquidity',
                    new_column_name='max_ask_liquidity')
    op.alter_column('auto_trade_settings', 'target_bid_liquidity',
                    new_column_name='max_bid_liquidity')
