"""add_auto_trade_settings

Revision ID: auto_trade_settings
Revises: increase_anon_code_len
Create Date: 2026-02-02 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'auto_trade_settings'
down_revision: Union[str, None] = 'increase_anon_code_len'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create auto_trade_settings table for global liquidity limits
    op.create_table(
        'auto_trade_settings',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('certificate_type', sa.String(10), nullable=False),

        # Liquidity limits in EUR
        sa.Column('max_ask_liquidity', sa.Numeric(18, 2), nullable=True),
        sa.Column('max_bid_liquidity', sa.Numeric(18, 2), nullable=True),

        # Enable/disable liquidity limiting
        sa.Column('liquidity_limit_enabled', sa.Boolean(), nullable=False, server_default='true'),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('certificate_type', name='uq_auto_trade_settings_certificate_type'),
    )

    # Insert default settings for CEA and EUA
    op.execute("""
        INSERT INTO auto_trade_settings (certificate_type, max_ask_liquidity, max_bid_liquidity, liquidity_limit_enabled)
        VALUES
            ('CEA', 50000, 50000, true),
            ('EUA', 50000, 50000, true)
    """)


def downgrade() -> None:
    op.drop_table('auto_trade_settings')
