"""Add INTRODUCER role and request_flow to contact_requests.

Revision ID: 2026_02_13_introducer
Revises: 2026_02_13_source_primary
Create Date: 2026-02-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2026_02_13_introducer"
down_revision: Union[str, None] = "2026_02_13_source_primary"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add INTRODUCER to userrole enum
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DO $$ BEGIN ALTER TYPE userrole ADD VALUE "
            + repr("INTRODUCER")
            + "; EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
        )
    )
    # Add request_flow column to contact_requests
    op.add_column(
        "contact_requests",
        sa.Column("request_flow", sa.String(32), nullable=False, server_default="buyer"),
    )


def downgrade() -> None:
    op.drop_column("contact_requests", "request_flow")
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
