"""Add random interval fields to auto_trade_rules.

Adds:
- interval_mode: 'fixed' or 'random'
- interval_min_minutes: Min interval when mode='random'
- interval_max_minutes: Max interval when mode='random'
- max_price_deviation: Max % deviation from scraped price allowed
- last_executed_at: When this rule last placed an order
- next_execution_at: When this rule should next execute
- execution_count: Total orders placed by this rule

Revision ID: 2026_02_02_random_int
Revises: 2026_02_02_auto_trade
Create Date: 2026-02-02

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_02_02_random_int"
down_revision = "2026_02_02_auto_trade"
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns for random interval support
    op.add_column(
        "auto_trade_rules",
        sa.Column("interval_mode", sa.String(20), nullable=False, server_default="fixed"),
    )
    op.add_column(
        "auto_trade_rules",
        sa.Column("interval_min_minutes", sa.Integer(), nullable=True),
    )
    op.add_column(
        "auto_trade_rules",
        sa.Column("interval_max_minutes", sa.Integer(), nullable=True),
    )
    # Add max price deviation
    op.add_column(
        "auto_trade_rules",
        sa.Column("max_price_deviation", sa.Numeric(8, 4), nullable=True),
    )
    # Add execution tracking columns
    op.add_column(
        "auto_trade_rules",
        sa.Column("last_executed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "auto_trade_rules",
        sa.Column("next_execution_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "auto_trade_rules",
        sa.Column("execution_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_column("auto_trade_rules", "execution_count")
    op.drop_column("auto_trade_rules", "next_execution_at")
    op.drop_column("auto_trade_rules", "last_executed_at")
    op.drop_column("auto_trade_rules", "max_price_deviation")
    op.drop_column("auto_trade_rules", "interval_max_minutes")
    op.drop_column("auto_trade_rules", "interval_min_minutes")
    op.drop_column("auto_trade_rules", "interval_mode")
