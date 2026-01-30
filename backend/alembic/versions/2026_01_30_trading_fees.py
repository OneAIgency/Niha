"""Add trading fee configuration tables.

Creates:
- trading_fee_configs: Default fees per market (CEA_CASH, SWAP) for buyers and sellers
- entity_fee_overrides: Custom fee rates per entity/client

Revision ID: 2026_01_30_fees
Revises: 2026_01_30_mm_types
Create Date: 2026-01-30

"""
import uuid
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "2026_01_30_fees"
down_revision = "2026_01_30_mm_types"
branch_labels = None
depends_on = None


def upgrade():
    # Create trading_fee_configs table
    # Note: markettype enum already exists from previous migrations
    op.create_table(
        "trading_fee_configs",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("market", sa.Text(), nullable=False, unique=True),  # Use text, will cast to enum
        sa.Column("bid_fee_rate", sa.Numeric(8, 6), nullable=False, server_default="0.005"),
        sa.Column("ask_fee_rate", sa.Numeric(8, 6), nullable=False, server_default="0.005"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_by", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )

    # Convert market column to use existing markettype enum
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE trading_fee_configs
        ALTER COLUMN market TYPE markettype USING market::markettype
    """))

    # Create entity_fee_overrides table
    op.create_table(
        "entity_fee_overrides",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("entity_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("entities.id"), nullable=False, index=True),
        sa.Column("market", sa.Text(), nullable=False),  # Use text, will cast to enum
        sa.Column("bid_fee_rate", sa.Numeric(8, 6), nullable=True),  # NULL = use default
        sa.Column("ask_fee_rate", sa.Numeric(8, 6), nullable=True),  # NULL = use default
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_by", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.UniqueConstraint("entity_id", "market", name="uq_entity_market_fee"),
    )

    # Convert market column to use existing markettype enum
    conn.execute(sa.text("""
        ALTER TABLE entity_fee_overrides
        ALTER COLUMN market TYPE markettype USING market::markettype
    """))

    # Seed default fee configs for both markets
    conn = op.get_bind()
    conn.execute(
        sa.text("""
            INSERT INTO trading_fee_configs (id, market, bid_fee_rate, ask_fee_rate, is_active, created_at, updated_at)
            VALUES
                (gen_random_uuid(), 'CEA_CASH', 0.005, 0.005, true, now(), now()),
                (gen_random_uuid(), 'SWAP', 0.005, 0.005, true, now(), now())
            ON CONFLICT (market) DO NOTHING
        """)
    )


def downgrade():
    op.drop_table("entity_fee_overrides")
    op.drop_table("trading_fee_configs")
