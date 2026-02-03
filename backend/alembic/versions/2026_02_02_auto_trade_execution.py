"""Add execution tracking and max_price_deviation to auto_trade_rules.

Adds:
- max_price_deviation: Max % deviation from scraped price allowed
- last_executed_at: When this rule last placed an order
- next_execution_at: When this rule should next execute
- execution_count: Total orders placed by this rule

Revision ID: 2026_02_02_execution
Revises: 2026_02_02_random_int
Create Date: 2026-02-02

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_02_02_execution"
down_revision = "2026_02_02_random_int"
branch_labels = None
depends_on = None


def upgrade():
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
