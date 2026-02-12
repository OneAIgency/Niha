"""Add execution tracking and max_price_deviation to auto_trade_rules.

NOTE: These columns are already added by 2026_02_02_add_random_interval.py.
This migration is kept for chain integrity but uses IF NOT EXISTS checks
to avoid failures on fresh databases.

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


def _column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.fetchone() is not None


def upgrade():
    if not _column_exists("auto_trade_rules", "max_price_deviation"):
        op.add_column(
            "auto_trade_rules",
            sa.Column("max_price_deviation", sa.Numeric(8, 4), nullable=True),
        )
    if not _column_exists("auto_trade_rules", "last_executed_at"):
        op.add_column(
            "auto_trade_rules",
            sa.Column("last_executed_at", sa.DateTime(), nullable=True),
        )
    if not _column_exists("auto_trade_rules", "next_execution_at"):
        op.add_column(
            "auto_trade_rules",
            sa.Column("next_execution_at", sa.DateTime(), nullable=True),
        )
    if not _column_exists("auto_trade_rules", "execution_count"):
        op.add_column(
            "auto_trade_rules",
            sa.Column(
                "execution_count", sa.Integer(), nullable=False, server_default="0"
            ),
        )


def downgrade():
    op.drop_column("auto_trade_rules", "execution_count")
    op.drop_column("auto_trade_rules", "next_execution_at")
    op.drop_column("auto_trade_rules", "last_executed_at")
    op.drop_column("auto_trade_rules", "max_price_deviation")
