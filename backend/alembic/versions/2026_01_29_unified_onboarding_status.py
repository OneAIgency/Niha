"""Unified onboarding status for ContactRequest and User

Replace contact_status enum with onboarding_status (same categories for
contact requests and users). Add users.onboarding_status column.

Revision ID: 2026_01_29_onboarding
Revises: 2026_01_29_mail_config
Create Date: 2026-01-29

"""

import sqlalchemy as sa
from alembic import op

revision = "2026_01_29_onboarding"
down_revision = "2026_01_29_mail_config"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Create new enum type (idempotent; init.sql may have created it)
    conn.execute(
        sa.text(
            "DO $$ BEGIN CREATE TYPE onboarding_status AS ENUM ("
            "'nda', 'nda_submitted', 'pending', 'approved', 'funding',"
            "'aml', 'cea', 'cea_settle', 'swap', 'eua_settle', 'eua', 'rejected'"
            "); EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )

    # contact_requests: migrate only if table has old contact_status type
    r = conn.execute(sa.text("""
        SELECT udt_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contact_requests'
        AND column_name = 'status';
    """))
    row = r.fetchone()
    if row and row[0] == "contact_status":
        op.add_column(
            "contact_requests",
            sa.Column("status_new", sa.Enum(
                "nda", "nda_submitted", "pending", "approved", "funding",
                "aml", "cea", "cea_settle", "swap", "eua_settle", "eua", "rejected",
                name="onboarding_status", create_type=False,
            ), nullable=True),
        )
        conn.execute(sa.text("""
            UPDATE contact_requests SET status_new = CASE status::text
                WHEN 'new' THEN 'nda'::onboarding_status
                WHEN 'contacted' THEN 'nda_submitted'::onboarding_status
                WHEN 'enrolled' THEN 'approved'::onboarding_status
                WHEN 'rejected' THEN 'rejected'::onboarding_status
                ELSE 'nda'::onboarding_status
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
            ALTER COLUMN status SET DEFAULT 'nda'::onboarding_status;
            ALTER TABLE contact_requests ALTER COLUMN status SET NOT NULL;
        """))

    # users: add onboarding_status if not present
    insp = sa.inspect(conn)
    if "users" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("users")]
        if "onboarding_status" not in cols:
            op.add_column(
                "users",
                sa.Column(
                    "onboarding_status",
                    sa.Enum(
                        "nda", "nda_submitted", "pending", "approved", "funding",
                        "aml", "cea", "cea_settle", "swap", "eua_settle", "eua", "rejected",
                        name="onboarding_status",
                        create_type=False,
                    ),
                    nullable=True,
                ),
            )
            conn.execute(sa.text("""
                UPDATE users SET onboarding_status = CASE role::text
                    WHEN 'PENDING' THEN 'pending'::onboarding_status
                    WHEN 'APPROVED' THEN 'approved'::onboarding_status
                    WHEN 'FUNDED' THEN 'funding'::onboarding_status
                    ELSE NULL
                END
                WHERE role IN ('PENDING', 'APPROVED', 'FUNDED');
            """))

    # Drop old contact_status type (only if no other columns use it)
    conn.execute(
        sa.text("DROP TYPE IF EXISTS contact_status CASCADE;")
    )


def downgrade():
    conn = op.get_bind()

    # Recreate contact_status enum
    conn.execute(
        sa.text(
            "DO $$ BEGIN CREATE TYPE contact_status AS ENUM "
            "('new', 'contacted', 'enrolled', 'rejected'); "
            "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )

    # contact_requests: revert to contact_status (map back)
    op.add_column(
        "contact_requests",
        sa.Column("status_old", sa.Enum("new", "contacted", "enrolled", "rejected", name="contact_status"), nullable=True),
    )
    conn.execute(sa.text("""
        UPDATE contact_requests SET status_old = CASE status::text
            WHEN 'nda' THEN 'new'::contact_status
            WHEN 'nda_submitted' THEN 'contacted'::contact_status
            WHEN 'pending' THEN 'contacted'::contact_status
            WHEN 'approved' THEN 'enrolled'::contact_status
            WHEN 'rejected' THEN 'rejected'::contact_status
            ELSE 'new'::contact_status
        END;
    """))
    op.drop_column("contact_requests", "status")
    op.alter_column("contact_requests", "status_old", new_column_name="status")
    conn.execute(sa.text("ALTER TABLE contact_requests ALTER COLUMN status SET DEFAULT 'new'::contact_status;"))

    # users: drop onboarding_status
    op.drop_column("users", "onboarding_status")

    conn.execute(sa.text("DROP TYPE IF EXISTS onboarding_status CASCADE;"))
