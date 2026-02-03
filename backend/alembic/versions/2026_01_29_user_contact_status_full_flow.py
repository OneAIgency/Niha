"""Extend UserRole and ContactStatus for full onboarding flow (NDA → EUA)

- userrole: add REJECTED, KYC, APPROVED, FUNDING, AML, CEA, CEA_SETTLE, SWAP, EUA_SETTLE, EUA
- contactstatus: add REJECTED, KYC

Revision ID: 2026_01_29_full_flow
Revises: 2026_01_29_nda_only
Create Date: 2026-01-29

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_29_full_flow"
down_revision = "2026_01_29_nda_only"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Add new values to userrole (existing: ADMIN, NDA)
    for value in (
        "REJECTED",
        "KYC",
        "APPROVED",
        "FUNDING",
        "AML",
        "CEA",
        "CEA_SETTLE",
        "SWAP",
        "EUA_SETTLE",
        "EUA",
    ):
        conn.execute(
            sa.text(
                "DO $$ BEGIN ALTER TYPE userrole ADD VALUE "
                + repr(value)
                + "; EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
            )
        )

    # Add new values to contactstatus (existing: NDA)
    for value in ("REJECTED", "KYC"):
        conn.execute(
            sa.text(
                "DO $$ BEGIN ALTER TYPE contactstatus ADD VALUE "
                + repr(value)
                + "; EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
            )
        )


def downgrade():
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
