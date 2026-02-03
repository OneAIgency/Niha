"""Add random spread columns to auto_trade_rules

Revision ID: add_random_spread_cols
Revises: 2026_02_02_execution
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_random_spread_cols'
down_revision = '2026_02_02_execution'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns for random spread mode
    op.add_column('auto_trade_rules', sa.Column('spread_min', sa.Numeric(18, 4), nullable=True))
    op.add_column('auto_trade_rules', sa.Column('spread_max', sa.Numeric(18, 4), nullable=True))

    # Update the enum to include the new value
    # PostgreSQL enums need special handling
    op.execute("ALTER TYPE autotradeprice" "mode ADD VALUE IF NOT EXISTS 'random_spread'")


def downgrade() -> None:
    op.drop_column('auto_trade_rules', 'spread_max')
    op.drop_column('auto_trade_rules', 'spread_min')
    # Note: PostgreSQL doesn't support removing enum values easily
