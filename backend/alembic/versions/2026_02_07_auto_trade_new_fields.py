"""Add new variation fields to auto_trade_market_settings

Revision ID: 2026_02_07_at_fields
Revises: 2026_02_07_drop_demo
Create Date: 2026-02-07
"""
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "2026_02_07_at_fields"
down_revision: Union[str, None] = "2026_02_07_drop_demo"
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("avg_order_count_variation_pct", sa.Numeric(5, 2), nullable=False, server_default="10.0"),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("max_orders_per_price_level", sa.Integer(), nullable=False, server_default="3"),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("max_orders_per_level_variation_pct", sa.Numeric(5, 2), nullable=False, server_default="10.0"),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("min_order_value_variation_pct", sa.Numeric(5, 2), nullable=False, server_default="10.0"),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("order_interval_variation_pct", sa.Numeric(5, 2), nullable=False, server_default="10.0"),
    )
    op.add_column(
        "auto_trade_market_settings",
        sa.Column("max_order_volume_eur", sa.Numeric(18, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auto_trade_market_settings", "max_order_volume_eur")
    op.drop_column("auto_trade_market_settings", "order_interval_variation_pct")
    op.drop_column("auto_trade_market_settings", "min_order_value_variation_pct")
    op.drop_column("auto_trade_market_settings", "max_orders_per_level_variation_pct")
    op.drop_column("auto_trade_market_settings", "max_orders_per_price_level")
    op.drop_column("auto_trade_market_settings", "avg_order_count_variation_pct")
