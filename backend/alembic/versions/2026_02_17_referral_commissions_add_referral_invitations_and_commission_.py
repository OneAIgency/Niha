"""add referral_invitations and commission_ledger tables

Revision ID: 2026_02_17_referral_commissions
Revises: 2026_02_17_troducer_role
Create Date: 2026-02-19 00:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "2026_02_17_referral_commissions"
down_revision: Union[str, None] = "2026_02_17_troducer_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Create referral_invitations table (if not exists) ─────────────
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if "referral_invitations" not in existing_tables:
        op.create_table(
            "referral_invitations",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("introducer_user_id", sa.UUID(), nullable=False),
            sa.Column("invited_email", sa.String(length=255), nullable=False),
            sa.Column("invited_first_name", sa.String(length=100), nullable=True),
            sa.Column("personal_note", sa.String(length=200), nullable=True),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column(
                "status",
                sa.Enum("pending", "clicked", "registered", "expired", name="invitationstatus"),
                nullable=False,
            ),
            sa.Column("clicked_at", sa.DateTime(), nullable=True),
            sa.Column("registered_at", sa.DateTime(), nullable=True),
            sa.Column("registered_user_id", sa.UUID(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["introducer_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["registered_user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token_hash"),
            sa.UniqueConstraint(
                "introducer_user_id", "invited_email", name="uq_introducer_invite_email"
            ),
        )
        op.create_index(
            "ix_referral_invitations_introducer_user_id",
            "referral_invitations",
            ["introducer_user_id"],
        )
        op.create_index(
            "ix_referral_invitations_invited_email",
            "referral_invitations",
            ["invited_email"],
        )
        op.create_index(
            "ix_referral_invitations_status",
            "referral_invitations",
            ["status"],
        )

    # ── Create commission_ledger table (if not exists) ────────────────
    if "commission_ledger" not in existing_tables:
        op.create_table(
            "commission_ledger",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("introducer_user_id", sa.UUID(), nullable=False),
            sa.Column("referred_user_id", sa.UUID(), nullable=False),
            sa.Column("referred_entity_id", sa.UUID(), nullable=False),
            sa.Column("cash_market_trade_id", sa.UUID(), nullable=False),
            sa.Column("trade_eur_value", sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column("commission_rate", sa.Numeric(precision=8, scale=6), nullable=False),
            sa.Column("commission_eur", sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column(
                "status",
                sa.Enum("pending", "confirmed", "paid", "reversed", name="commissionstatus"),
                nullable=False,
            ),
            sa.Column("trade_executed_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("confirmed_at", sa.DateTime(), nullable=True),
            sa.Column("paid_at", sa.DateTime(), nullable=True),
            sa.Column("confirmed_by", sa.UUID(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["introducer_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["referred_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["referred_entity_id"], ["entities.id"]),
            sa.ForeignKeyConstraint(["cash_market_trade_id"], ["cash_market_trades.id"]),
            sa.ForeignKeyConstraint(["confirmed_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("cash_market_trade_id"),
        )
        op.create_index(
            "ix_commission_ledger_introducer_user_id",
            "commission_ledger",
            ["introducer_user_id"],
        )
        op.create_index(
            "ix_commission_ledger_referred_user_id",
            "commission_ledger",
            ["referred_user_id"],
        )
        op.create_index(
            "ix_commission_ledger_referred_entity_id",
            "commission_ledger",
            ["referred_entity_id"],
        )
        op.create_index(
            "ix_commission_ledger_cash_market_trade_id",
            "commission_ledger",
            ["cash_market_trade_id"],
            unique=True,
        )
        op.create_index(
            "ix_commission_ledger_status",
            "commission_ledger",
            ["status"],
        )
        op.create_index(
            "ix_commission_ledger_created_at",
            "commission_ledger",
            ["created_at"],
        )

    # ── Add commission_rate column to users table ─────────────────────
    existing_columns = [c["name"] for c in inspector.get_columns("users")]
    if "commission_rate" not in existing_columns:
        op.add_column(
            "users",
            sa.Column("commission_rate", sa.Numeric(precision=8, scale=6), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("users", "commission_rate")
    op.drop_table("commission_ledger")
    op.drop_table("referral_invitations")
    # Drop the enum types created for the new tables
    op.execute("DROP TYPE IF EXISTS commissionstatus")
    op.execute("DROP TYPE IF EXISTS invitationstatus")
