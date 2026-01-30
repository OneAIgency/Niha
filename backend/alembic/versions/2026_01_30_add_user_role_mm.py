"""Add UserRole MM (Market Maker); admin-created only, no contact requests.

Revision ID: 2026_01_30_add_mm
Revises: 2026_01_30_user_role
Create Date: 2026-01-30

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_30_add_mm"
down_revision = "2026_01_30_user_role"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DO $$ BEGIN ALTER TYPE userrole ADD VALUE "
            + repr("MM")
            + "; EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )


def downgrade():
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
