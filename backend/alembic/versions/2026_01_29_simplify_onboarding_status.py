"""Simplify OnboardingStatus enum: NDA, REJECTED, KYC, FUNDING, AML, CEA, CEA_SETTLE, SWAP, EUA_SETTLE, EUA

Remove nda_submitted, pending, approved. Map: pending->kyc, approved->funding, nda_submitted->nda.

Revision ID: 2026_01_29_simplify
Revises: 2026_01_29_onboarding
Create Date: 2026-01-29

"""

import sqlalchemy as sa
from alembic import op

revision = "2026_01_29_simplify"
down_revision = "2026_01_29_onboarding"
branch_labels = None
depends_on = None

NEW_VALUES = (
    "nda",
    "rejected",
    "kyc",
    "funding",
    "aml",
    "cea",
    "cea_settle",
    "swap",
    "eua_settle",
    "eua",
)


def upgrade():
    conn = op.get_bind()

    # Check if contact_requests.status is already the simplified type (e.g. has 'kyc' value)
    r = conn.execute(sa.text("""
        SELECT enumlabel FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'onboarding_status')
        ORDER BY enumsortorder;
    """))
    labels = [row[0] for row in r.fetchall()]
    if set(labels) == set(NEW_VALUES):
        return  # Already simplified

    # Create new enum type with simplified values
    conn.execute(
        sa.text(
            "DO $$ BEGIN CREATE TYPE onboarding_status_new AS ENUM ("
            "'nda', 'rejected', 'kyc', 'funding', 'aml',"
            "'cea', 'cea_settle', 'swap', 'eua_settle', 'eua'"
            "); EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )

    # contact_requests: migrate status
    op.add_column(
        "contact_requests",
        sa.Column(
            "status_new",
            sa.Enum(*NEW_VALUES, name="onboarding_status_new", create_type=False),
            nullable=True,
        ),
    )
    conn.execute(sa.text("""
        UPDATE contact_requests SET status_new = CASE status::text
            WHEN 'nda' THEN 'nda'::onboarding_status_new
            WHEN 'nda_submitted' THEN 'nda'::onboarding_status_new
            WHEN 'pending' THEN 'kyc'::onboarding_status_new
            WHEN 'approved' THEN 'funding'::onboarding_status_new
            WHEN 'funding' THEN 'funding'::onboarding_status_new
            WHEN 'aml' THEN 'aml'::onboarding_status_new
            WHEN 'cea' THEN 'cea'::onboarding_status_new
            WHEN 'cea_settle' THEN 'cea_settle'::onboarding_status_new
            WHEN 'swap' THEN 'swap'::onboarding_status_new
            WHEN 'eua_settle' THEN 'eua_settle'::onboarding_status_new
            WHEN 'eua' THEN 'eua'::onboarding_status_new
            WHEN 'rejected' THEN 'rejected'::onboarding_status_new
            ELSE 'nda'::onboarding_status_new
        END;
    """))
    op.drop_column("contact_requests", "status")
    op.alter_column(
        "contact_requests",
        "status_new",
        new_column_name="status",
    )
    conn.execute(sa.text("""
        ALTER TABLE contact_requests
        ALTER COLUMN status SET DEFAULT 'nda'::onboarding_status_new;
        ALTER TABLE contact_requests ALTER COLUMN status SET NOT NULL;
    """))

    # users: migrate onboarding_status
    insp = sa.inspect(conn)
    if "users" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("users")]
        if "onboarding_status" in cols:
            op.add_column(
                "users",
                sa.Column(
                    "onboarding_status_new",
                    sa.Enum(*NEW_VALUES, name="onboarding_status_new", create_type=False),
                    nullable=True,
                ),
            )
            conn.execute(sa.text("""
                UPDATE users SET onboarding_status_new = CASE onboarding_status::text
                    WHEN 'nda' THEN 'nda'::onboarding_status_new
                    WHEN 'nda_submitted' THEN 'nda'::onboarding_status_new
                    WHEN 'pending' THEN 'kyc'::onboarding_status_new
                    WHEN 'approved' THEN 'funding'::onboarding_status_new
                    WHEN 'funding' THEN 'funding'::onboarding_status_new
                    WHEN 'aml' THEN 'aml'::onboarding_status_new
                    WHEN 'cea' THEN 'cea'::onboarding_status_new
                    WHEN 'cea_settle' THEN 'cea_settle'::onboarding_status_new
                    WHEN 'swap' THEN 'swap'::onboarding_status_new
                    WHEN 'eua_settle' THEN 'eua_settle'::onboarding_status_new
                    WHEN 'eua' THEN 'eua'::onboarding_status_new
                    WHEN 'rejected' THEN 'rejected'::onboarding_status_new
                    ELSE NULL
                END;
            """))
            op.drop_column("users", "onboarding_status")
            op.alter_column(
                "users",
                "onboarding_status_new",
                new_column_name="onboarding_status",
            )

    # Drop old type and rename new type
    conn.execute(sa.text("DROP TYPE IF EXISTS onboarding_status CASCADE;"))
    conn.execute(sa.text("ALTER TYPE onboarding_status_new RENAME TO onboarding_status;"))


def downgrade():
    # No downgrade to old 12-value enum; would require recreating old type and mapping back.
    pass
