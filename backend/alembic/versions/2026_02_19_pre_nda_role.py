"""add PRE_NDA to userrole enum

Revision ID: 2026_02_19_pre_nda_role
Revises: 2026_02_19_price_alerts
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2026_02_19_pre_nda_role"
down_revision: Union[str, None] = "2026_02_19_price_alerts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'PRE_NDA'")


def downgrade() -> None:
    pass
