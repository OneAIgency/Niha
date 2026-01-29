"""Add AML hold fields to deposits

Revision ID: 2026_01_27_aml_hold
Revises: 2026_01_25_settlement
Create Date: 2026-01-27 12:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_01_27_aml_hold"
down_revision = "2026_01_25_settlement"
branch_labels = None
depends_on = None


def upgrade():
    # Add new status values to DepositStatus enum
    # PostgreSQL requires special handling for adding enum values
    op.execute("ALTER TYPE depositstatus ADD VALUE IF NOT EXISTS 'on_hold'")
    op.execute("ALTER TYPE depositstatus ADD VALUE IF NOT EXISTS 'cleared'")

    # Add AML hold fields to deposits table
    op.add_column(
        "deposits", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column("deposits", sa.Column("hold_type", sa.String(50), nullable=True))
    op.add_column(
        "deposits", sa.Column("hold_days_required", sa.Integer(), nullable=True)
    )
    op.add_column(
        "deposits", sa.Column("hold_expires_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "deposits",
        sa.Column("aml_status", sa.String(50), nullable=True, server_default="PENDING"),
    )
    op.add_column("deposits", sa.Column("cleared_at", sa.DateTime(), nullable=True))
    op.add_column(
        "deposits",
        sa.Column("cleared_by_admin_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("deposits", sa.Column("rejected_at", sa.DateTime(), nullable=True))
    op.add_column(
        "deposits",
        sa.Column("rejected_by_admin_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("deposits", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column("deposits", sa.Column("admin_notes", sa.Text(), nullable=True))
    op.add_column("deposits", sa.Column("source_bank", sa.String(255), nullable=True))
    op.add_column("deposits", sa.Column("source_iban", sa.String(50), nullable=True))
    op.add_column("deposits", sa.Column("source_swift", sa.String(20), nullable=True))
    op.add_column("deposits", sa.Column("client_notes", sa.Text(), nullable=True))

    # Add foreign key constraints
    op.create_foreign_key(
        "fk_deposits_user_id", "deposits", "users", ["user_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_deposits_cleared_by_admin_id",
        "deposits",
        "users",
        ["cleared_by_admin_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_deposits_rejected_by_admin_id",
        "deposits",
        "users",
        ["rejected_by_admin_id"],
        ["id"],
    )

    # Add indexes for efficient querying
    op.create_index("idx_deposits_aml_status", "deposits", ["aml_status"])
    op.create_index("idx_deposits_hold_expires_at", "deposits", ["hold_expires_at"])
    op.create_index("idx_deposits_user_id", "deposits", ["user_id"])


def downgrade():
    # Drop indexes
    op.drop_index("idx_deposits_user_id", table_name="deposits")
    op.drop_index("idx_deposits_hold_expires_at", table_name="deposits")
    op.drop_index("idx_deposits_aml_status", table_name="deposits")

    # Drop foreign keys
    op.drop_constraint(
        "fk_deposits_rejected_by_admin_id", "deposits", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_deposits_cleared_by_admin_id", "deposits", type_="foreignkey"
    )
    op.drop_constraint("fk_deposits_user_id", "deposits", type_="foreignkey")

    # Drop columns
    op.drop_column("deposits", "client_notes")
    op.drop_column("deposits", "source_swift")
    op.drop_column("deposits", "source_iban")
    op.drop_column("deposits", "source_bank")
    op.drop_column("deposits", "admin_notes")
    op.drop_column("deposits", "rejection_reason")
    op.drop_column("deposits", "rejected_by_admin_id")
    op.drop_column("deposits", "rejected_at")
    op.drop_column("deposits", "cleared_by_admin_id")
    op.drop_column("deposits", "cleared_at")
    op.drop_column("deposits", "aml_status")
    op.drop_column("deposits", "hold_expires_at")
    op.drop_column("deposits", "hold_days_required")
    op.drop_column("deposits", "hold_type")
    op.drop_column("deposits", "user_id")

    # Note: Cannot remove enum values in PostgreSQL without recreating the type
    # The added enum values (on_hold, cleared) will remain
