"""Unify UserRole and ContactStatus to ADMIN + NDA only

- users.role: keep ADMIN, map PENDING/APPROVED/FUNDED/MARKET_MAKER -> NDA
- contact_requests.status: only NDA (map new/contacted/enrolled/rejected -> NDA)

Revision ID: 2026_01_29_nda_only
Revises: 2026_01_29_simplify
Create Date: 2026-01-29

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_29_nda_only"
down_revision = "2026_01_29_simplify"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # --- users.role: userrole enum -> only ADMIN, NDA ---
    # Create new enum type
    conn.execute(
        sa.text(
            "DO $$ BEGIN CREATE TYPE userrole_new AS ENUM ('ADMIN', 'NDA'); "
            "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )
    op.add_column(
        "users",
        sa.Column("role_new", sa.Enum("ADMIN", "NDA", name="userrole_new", create_type=False), nullable=True),
    )
    # Map: ADMIN -> ADMIN, anything else -> NDA
    conn.execute(sa.text("""
        UPDATE users SET role_new = CASE role::text
            WHEN 'ADMIN' THEN 'ADMIN'::userrole_new
            ELSE 'NDA'::userrole_new
        END;
    """))
    op.drop_column("users", "role")
    op.alter_column(
        "users",
        "role_new",
        new_column_name="role",
    )
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'NDA'::userrole_new;"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET NOT NULL;"))
    # Drop old type and rename (handle both possible existing type names)
    conn.execute(sa.text("DROP TYPE IF EXISTS userrole CASCADE;"))
    conn.execute(sa.text("DROP TYPE IF EXISTS user_role CASCADE;"))
    conn.execute(sa.text("ALTER TYPE userrole_new RENAME TO userrole;"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'NDA'::userrole;"))

    # --- contact_requests.status: only NDA ---
    # Detect current type name (contactstatus, contact_status, or onboarding_status)
    r = conn.execute(sa.text("""
        SELECT udt_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contact_requests' AND column_name = 'status';
    """))
    row = r.fetchone()
    current_type = row[0] if row else "contactstatus"

    conn.execute(
        sa.text(
            "DO $$ BEGIN CREATE TYPE contactstatus_new AS ENUM ('NDA'); "
            "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )
    op.add_column(
        "contact_requests",
        sa.Column("status_new", sa.Enum("NDA", name="contactstatus_new", create_type=False), nullable=True),
    )
    # Map all existing values to NDA
    conn.execute(sa.text("""
        UPDATE contact_requests SET status_new = 'NDA'::contactstatus_new;
    """))
    op.drop_column("contact_requests", "status")
    op.alter_column(
        "contact_requests",
        "status_new",
        new_column_name="status",
    )
    conn.execute(sa.text("ALTER TABLE contact_requests ALTER COLUMN status SET DEFAULT 'NDA'::contactstatus_new;"))
    conn.execute(sa.text("ALTER TABLE contact_requests ALTER COLUMN status SET NOT NULL;"))
    conn.execute(sa.text(f"DROP TYPE IF EXISTS {current_type} CASCADE;"))
    conn.execute(sa.text("DROP TYPE IF EXISTS onboarding_status CASCADE;"))
    conn.execute(sa.text("ALTER TYPE contactstatus_new RENAME TO contactstatus;"))
    conn.execute(sa.text("ALTER TABLE contact_requests ALTER COLUMN status SET DEFAULT 'NDA'::contactstatus;"))


def downgrade():
    # Restore previous enum values would require storing old types; skip for now.
    pass
