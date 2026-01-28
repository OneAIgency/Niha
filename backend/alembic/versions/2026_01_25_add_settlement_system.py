"""Add settlement system

Revision ID: 2026_01_25_settlement
Revises: f873b8199176
Create Date: 2026-01-25 12:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_01_25_settlement"
down_revision = "c9d4efedace8"  # Latest migration: 2026_01_21_add_market_to_orders
branch_labels = None
depends_on = None


def upgrade():
    # Create SettlementStatus enum
    settlement_status_enum = postgresql.ENUM(
        "PENDING",
        "TRANSFER_INITIATED",
        "IN_TRANSIT",
        "AT_CUSTODY",
        "SETTLED",
        "FAILED",
        name="settlementstatus",
        create_type=True,
    )
    settlement_status_enum.create(op.get_bind(), checkfirst=True)

    # Create SettlementType enum
    settlement_type_enum = postgresql.ENUM(
        "CEA_PURCHASE", "SWAP_CEA_TO_EUA", name="settlementtype", create_type=True
    )
    settlement_type_enum.create(op.get_bind(), checkfirst=True)

    # Create settlement_batches table
    op.create_table(
        "settlement_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_reference", sa.String(50), nullable=False, unique=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("trade_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("settlement_type", settlement_type_enum, nullable=False),
        sa.Column(
            "status", settlement_status_enum, nullable=False, server_default="PENDING"
        ),
        sa.Column(
            "asset_type",
            postgresql.ENUM("EUR", "CEA", "EUA", name="assettype", create_type=True),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(18, 2), nullable=False),
        sa.Column("price", sa.Numeric(18, 4), nullable=False),
        sa.Column("total_value_eur", sa.Numeric(18, 2), nullable=False),
        sa.Column("expected_settlement_date", sa.DateTime(), nullable=False),
        sa.Column("actual_settlement_date", sa.DateTime(), nullable=True),
        sa.Column("registry_reference", sa.String(100), nullable=True),
        sa.Column("counterparty_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("counterparty_type", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["entity_id"], ["entities.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["trade_id"], ["cash_market_trades.id"]),
    )

    # Create indexes for settlement_batches
    op.create_index(
        "ix_settlement_batches_batch_reference",
        "settlement_batches",
        ["batch_reference"],
    )
    op.create_index(
        "ix_settlement_batches_entity_id", "settlement_batches", ["entity_id"]
    )
    op.create_index(
        "ix_settlement_batches_order_id", "settlement_batches", ["order_id"]
    )
    op.create_index(
        "ix_settlement_batches_trade_id", "settlement_batches", ["trade_id"]
    )
    op.create_index(
        "ix_settlement_batches_settlement_type",
        "settlement_batches",
        ["settlement_type"],
    )
    op.create_index("ix_settlement_batches_status", "settlement_batches", ["status"])
    op.create_index(
        "ix_settlement_batches_expected_settlement_date",
        "settlement_batches",
        ["expected_settlement_date"],
    )
    op.create_index(
        "ix_settlement_batches_created_at", "settlement_batches", ["created_at"]
    )

    # Create settlement_status_history table
    op.create_table(
        "settlement_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("settlement_batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", settlement_status_enum, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["settlement_batch_id"], ["settlement_batches.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"]),
    )

    # Create indexes for settlement_status_history
    op.create_index(
        "ix_settlement_status_history_settlement_batch_id",
        "settlement_status_history",
        ["settlement_batch_id"],
    )
    op.create_index(
        "ix_settlement_status_history_created_at",
        "settlement_status_history",
        ["created_at"],
    )
    op.create_index(
        "ix_settlement_status_history_status", "settlement_status_history", ["status"]
    )

    # Add settlement_batch_id to orders table
    op.add_column(
        "orders",
        sa.Column("settlement_batch_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_orders_settlement_batch_id",
        "orders",
        "settlement_batches",
        ["settlement_batch_id"],
        ["id"],
    )
    op.create_index("ix_orders_settlement_batch_id", "orders", ["settlement_batch_id"])

    # Add settlement_batch_id to cash_market_trades table
    op.add_column(
        "cash_market_trades",
        sa.Column("settlement_batch_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_cash_market_trades_settlement_batch_id",
        "cash_market_trades",
        "settlement_batches",
        ["settlement_batch_id"],
        ["id"],
    )
    op.create_index(
        "ix_cash_market_trades_settlement_batch_id",
        "cash_market_trades",
        ["settlement_batch_id"],
    )


def downgrade():
    # Remove columns from existing tables
    op.drop_index("ix_cash_market_trades_settlement_batch_id", "cash_market_trades")
    op.drop_constraint(
        "fk_cash_market_trades_settlement_batch_id",
        "cash_market_trades",
        type_="foreignkey",
    )
    op.drop_column("cash_market_trades", "settlement_batch_id")

    op.drop_index("ix_orders_settlement_batch_id", "orders")
    op.drop_constraint("fk_orders_settlement_batch_id", "orders", type_="foreignkey")
    op.drop_column("orders", "settlement_batch_id")

    # Drop settlement_status_history table
    op.drop_index("ix_settlement_status_history_status", "settlement_status_history")
    op.drop_index(
        "ix_settlement_status_history_created_at", "settlement_status_history"
    )
    op.drop_index(
        "ix_settlement_status_history_settlement_batch_id", "settlement_status_history"
    )
    op.drop_table("settlement_status_history")

    # Drop settlement_batches table
    op.drop_index("ix_settlement_batches_created_at", "settlement_batches")
    op.drop_index(
        "ix_settlement_batches_expected_settlement_date", "settlement_batches"
    )
    op.drop_index("ix_settlement_batches_status", "settlement_batches")
    op.drop_index("ix_settlement_batches_settlement_type", "settlement_batches")
    op.drop_index("ix_settlement_batches_trade_id", "settlement_batches")
    op.drop_index("ix_settlement_batches_order_id", "settlement_batches")
    op.drop_index("ix_settlement_batches_entity_id", "settlement_batches")
    op.drop_index("ix_settlement_batches_batch_reference", "settlement_batches")
    op.drop_table("settlement_batches")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS settlementstatus")
    op.execute("DROP TYPE IF EXISTS settlementtype")
