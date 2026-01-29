"""Add liquidity operations table

Revision ID: f873b8199176
Revises: 02f592fbda69
Create Date: 2026-01-20 14:18:37.742292

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f873b8199176"
down_revision: Union[str, None] = "02f592fbda69"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the liquidity_operations table using existing certificatetype enum
    certificatetype = postgresql.ENUM(
        "EUA", "CEA", name="certificatetype", create_type=False
    )

    op.create_table(
        "liquidity_operations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("ticket_id", sa.String(length=30), nullable=False),
        sa.Column("certificate_type", certificatetype, nullable=False),
        sa.Column(
            "target_bid_liquidity_eur",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
        ),
        sa.Column(
            "target_ask_liquidity_eur",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
        ),
        sa.Column(
            "actual_bid_liquidity_eur",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
        ),
        sa.Column(
            "actual_ask_liquidity_eur",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
        ),
        sa.Column(
            "market_makers_used",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("orders_created", postgresql.ARRAY(sa.UUID()), nullable=False),
        sa.Column("reference_price", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index(
        op.f("ix_liquidity_operations_certificate_type"),
        "liquidity_operations",
        ["certificate_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_liquidity_operations_created_at"),
        "liquidity_operations",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_liquidity_operations_created_by"),
        "liquidity_operations",
        ["created_by"],
        unique=False,
    )
    op.create_index(
        op.f("ix_liquidity_operations_ticket_id"),
        "liquidity_operations",
        ["ticket_id"],
        unique=True,
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index(
        op.f("ix_liquidity_operations_ticket_id"), table_name="liquidity_operations"
    )
    op.drop_index(
        op.f("ix_liquidity_operations_created_by"), table_name="liquidity_operations"
    )
    op.drop_index(
        op.f("ix_liquidity_operations_created_at"), table_name="liquidity_operations"
    )
    op.drop_index(
        op.f("ix_liquidity_operations_certificate_type"),
        table_name="liquidity_operations",
    )

    # Drop table
    op.drop_table("liquidity_operations")
