"""add_eua_balance_to_market_maker

Revision ID: d96d8a0b2dce
Revises: add_random_spread_cols
Create Date: 2026-02-02 12:03:28.608299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd96d8a0b2dce'
down_revision: Union[str, None] = 'add_random_spread_cols'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add eua_balance column to market_maker_clients table
    op.add_column(
        'market_maker_clients',
        sa.Column('eua_balance', sa.Numeric(precision=18, scale=2), nullable=False, server_default='0')
    )


def downgrade() -> None:
    # Remove eua_balance column from market_maker_clients table
    op.drop_column('market_maker_clients', 'eua_balance')
