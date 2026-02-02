"""Add auto trade rules table for market makers.

Creates:
- auto_trade_rules: Configuration for automatic order placement by market makers

Revision ID: 2026_02_02_auto_trade
Revises: 2026_01_30_fees
Create Date: 2026-02-02

"""
import uuid

import sqlalchemy as sa
from alembic import op

revision = "2026_02_02_auto_trade"
down_revision = "2026_01_30_fees"
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types for auto trade
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE autotradepricemode AS ENUM ('fixed', 'spread_from_best', 'percentage_from_market');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE autotradequantitymode AS ENUM ('fixed', 'percentage_of_balance', 'random_range');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create auto_trade_rules table
    op.create_table(
        "auto_trade_rules",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column(
            "market_maker_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("market_maker_clients.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="false"),

        # Order settings - use text initially, will convert to enum
        sa.Column("side", sa.Text(), nullable=False),  # BUY or SELL
        sa.Column("order_type", sa.String(20), nullable=False, server_default="LIMIT"),  # LIMIT or MARKET

        # Price settings
        sa.Column("price_mode", sa.Text(), nullable=False, server_default="spread_from_best"),
        sa.Column("fixed_price", sa.Numeric(18, 4), nullable=True),
        sa.Column("spread_from_best", sa.Numeric(18, 4), nullable=True),
        sa.Column("percentage_from_market", sa.Numeric(8, 4), nullable=True),

        # Quantity settings
        sa.Column("quantity_mode", sa.Text(), nullable=False, server_default="fixed"),
        sa.Column("fixed_quantity", sa.Numeric(18, 2), nullable=True),
        sa.Column("percentage_of_balance", sa.Numeric(8, 4), nullable=True),
        sa.Column("min_quantity", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_quantity", sa.Numeric(18, 2), nullable=True),

        # Timing
        sa.Column("interval_minutes", sa.Integer(), nullable=False, server_default="5"),

        # Conditions
        sa.Column("min_balance", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_active_orders", sa.Integer(), nullable=True),

        # Timestamps
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # Convert side column to use existing orderside enum
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE auto_trade_rules
        ALTER COLUMN side TYPE orderside USING side::orderside
    """))

    # Convert price_mode to use new enum
    conn.execute(sa.text("""
        ALTER TABLE auto_trade_rules
        ALTER COLUMN price_mode TYPE autotradepricemode USING price_mode::autotradepricemode
    """))

    # Convert quantity_mode to use new enum
    conn.execute(sa.text("""
        ALTER TABLE auto_trade_rules
        ALTER COLUMN quantity_mode TYPE autotradequantitymode USING quantity_mode::autotradequantitymode
    """))


def downgrade():
    op.drop_table("auto_trade_rules")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS autotradepricemode")
    op.execute("DROP TYPE IF EXISTS autotradequantitymode")
