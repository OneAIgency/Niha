"""Add PRE_NDA to contactstatus enum, add nda_accepted fields to contact_requests

Revision ID: 2026_02_19_buyer_nda_flow
Revises: 2026_02_19_pre_nda_role
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "2026_02_19_buyer_nda_flow"
down_revision: Union[str, None] = "2026_02_19_pre_nda_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add PRE_NDA to contactstatus enum
    op.execute("ALTER TYPE contactstatus ADD VALUE IF NOT EXISTS 'PRE_NDA'")

    # Add nda_accepted fields to contact_requests
    op.add_column("contact_requests", sa.Column("nda_accepted", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("contact_requests", sa.Column("nda_accepted_at", sa.DateTime(), nullable=True))
    op.add_column("contact_requests", sa.Column("nda_accepted_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_contact_requests_nda_accepted_by",
        "contact_requests",
        "users",
        ["nda_accepted_by"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_contact_requests_nda_accepted_by", "contact_requests", type_="foreignkey")
    op.drop_column("contact_requests", "nda_accepted_by")
    op.drop_column("contact_requests", "nda_accepted_at")
    op.drop_column("contact_requests", "nda_accepted")
