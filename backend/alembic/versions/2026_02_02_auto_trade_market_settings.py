"""auto_trade_market_settings

Revision ID: auto_trade_market_settings
Revises: liquidity_to_target
Create Date: 2026-02-02 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'auto_trade_market_settings'
down_revision: Union[str, None] = 'liquidity_to_target'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create new table for per-market-side settings
    op.create_table(
        'auto_trade_market_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('market_key', sa.String(20), nullable=False, unique=True),  # 'CEA_BID', 'CEA_ASK', 'EUA_SWAP'
        sa.Column('enabled', sa.Boolean(), nullable=False, default=True),

        # Target liquidity in EUR
        sa.Column('target_liquidity', sa.Numeric(18, 2), nullable=True),

        # Price deviation from best price (percentage)
        sa.Column('price_deviation_pct', sa.Numeric(5, 2), nullable=False, default=0.5),

        # Average number of orders to maintain
        sa.Column('avg_order_count', sa.Integer(), nullable=False, default=10),

        # Minimum volume per order in EUR
        sa.Column('min_order_volume_eur', sa.Numeric(18, 2), nullable=False, default=1000),

        # Volume variety indicator (1-10)
        # 1 = orders close to min volume
        # 10 = very diverse order sizes
        sa.Column('volume_variety', sa.Integer(), nullable=False, default=5),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create index on market_key
    op.create_index('ix_auto_trade_market_settings_market_key', 'auto_trade_market_settings', ['market_key'])

    # Insert default rows for each market
    op.execute("""
        INSERT INTO auto_trade_market_settings (id, market_key, enabled, target_liquidity, price_deviation_pct, avg_order_count, min_order_volume_eur, volume_variety, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'CEA_BID', true, 80000000, 0.50, 10, 1000, 5, NOW(), NOW()),
            (gen_random_uuid(), 'CEA_ASK', true, 80000000, 0.50, 10, 1000, 5, NOW(), NOW()),
            (gen_random_uuid(), 'EUA_SWAP', true, 50000000, 0.50, 10, 1000, 5, NOW(), NOW())
    """)


def downgrade() -> None:
    op.drop_index('ix_auto_trade_market_settings_market_key', table_name='auto_trade_market_settings')
    op.drop_table('auto_trade_market_settings')
