"""Add referral code system — PREINTRODUCER role, referral_code/nda_signed on users, referred_by on contact_requests

Revision ID: 2026_02_16_referral_codes
Revises: 2026_02_16_ai_agent
Create Date: 2026-02-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2026_02_16_referral_codes"
down_revision: Union[str, None] = "2026_02_16_ai_agent"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add PREINTRODUCER to userrole enum
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'PREINTRODUCER'")

    # Add referral_code and nda_signed to users
    op.add_column("users", sa.Column("referral_code", sa.String(16), nullable=True))
    op.add_column("users", sa.Column("nda_signed", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("users", sa.Column("nda_file_data", sa.LargeBinary(), nullable=True))
    op.add_column("users", sa.Column("nda_file_name", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_users_referral_code", "users", ["referral_code"])

    # Add referred_by fields to contact_requests
    op.add_column("contact_requests", sa.Column("referred_by_user_id", sa.UUID(), nullable=True))
    op.add_column("contact_requests", sa.Column("referral_code_used", sa.String(16), nullable=True))
    op.create_foreign_key(
        "fk_contact_requests_referred_by",
        "contact_requests", "users",
        ["referred_by_user_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_contact_requests_referred_by", "contact_requests", type_="foreignkey")
    op.drop_column("contact_requests", "referral_code_used")
    op.drop_column("contact_requests", "referred_by_user_id")
    op.drop_constraint("uq_users_referral_code", "users", type_="unique")
    op.drop_column("users", "nda_file_name")
    op.drop_column("users", "nda_file_data")
    op.drop_column("users", "nda_signed")
    op.drop_column("users", "referral_code")
    # Note: Cannot remove enum value in PostgreSQL
