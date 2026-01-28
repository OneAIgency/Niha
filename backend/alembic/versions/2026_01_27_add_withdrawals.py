"""Add withdrawals table

Revision ID: 2026_01_27_withdrawals
Revises: 2026_01_27_aml_hold
Create Date: 2026-01-27 15:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_01_27_withdrawals"
down_revision = "2026_01_27_aml_hold"
branch_labels = None
depends_on = None


def upgrade():
    # Create WithdrawalStatus enum
    withdrawal_status = postgresql.ENUM(
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "REJECTED",
        name="withdrawalstatus",
        create_type=False,
    )
    withdrawal_status.create(op.get_bind(), checkfirst=True)

    # Create withdrawals table
    op.create_table(
        "withdrawals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("entities.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
            index=True,
        ),
        # Asset details
        sa.Column(
            "asset_type",
            sa.Enum("EUR", "CEA", "EUA", name="assettype", create_type=False),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        # Status
        sa.Column(
            "status",
            postgresql.ENUM(
                "PENDING",
                "PROCESSING",
                "COMPLETED",
                "REJECTED",
                name="withdrawalstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="PENDING",
        ),
        # Destination details (for EUR withdrawals)
        sa.Column("destination_bank", sa.String(255), nullable=True),
        sa.Column("destination_iban", sa.String(50), nullable=True),
        sa.Column("destination_swift", sa.String(20), nullable=True),
        sa.Column("destination_account_holder", sa.String(255), nullable=True),
        # Destination details (for CEA/EUA transfers)
        sa.Column("destination_registry", sa.String(100), nullable=True),
        sa.Column("destination_account_id", sa.String(100), nullable=True),
        # Reference numbers
        sa.Column("wire_reference", sa.String(100), nullable=True),
        sa.Column("internal_reference", sa.String(100), nullable=True, unique=True),
        # Rejection details
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        # Notes
        sa.Column("client_notes", sa.Text(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        # Timestamps
        sa.Column(
            "requested_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
        # Admin tracking
        sa.Column(
            "processed_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "completed_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "rejected_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        # Standard audit columns
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create indexes for efficient querying
    op.create_index("idx_withdrawals_status", "withdrawals", ["status"])
    op.create_index("idx_withdrawals_asset_type", "withdrawals", ["asset_type"])
    op.create_index("idx_withdrawals_requested_at", "withdrawals", ["requested_at"])


def downgrade():
    # Drop indexes
    op.drop_index("idx_withdrawals_requested_at", table_name="withdrawals")
    op.drop_index("idx_withdrawals_asset_type", table_name="withdrawals")
    op.drop_index("idx_withdrawals_status", table_name="withdrawals")

    # Drop table
    op.drop_table("withdrawals")

    # Drop enum type
    op.execute("DROP TYPE IF EXISTS withdrawalstatus")
