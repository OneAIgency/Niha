"""Drop reference column from contact_requests

Revision ID: 2026_01_29_reference
Revises: 2026_01_27_withdrawals
Create Date: 2026-01-29

"""

import sqlalchemy as sa
from alembic import op

revision = "2026_01_29_reference"
down_revision = "2026_01_27_withdrawals"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("contact_requests", "reference")


def downgrade():
    op.add_column("contact_requests", sa.Column("reference", sa.String(255), nullable=True))