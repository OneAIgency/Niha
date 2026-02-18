"""Add TRODUCER role to userrole enum — intermediate introducer state (NDA pending)

Revision ID: 2026_02_17_troducer_role
Revises: 2026_02_16_referral_codes
Create Date: 2026-02-17
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "2026_02_17_troducer_role"
down_revision: Union[str, None] = "2026_02_16_referral_codes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'TRODUCER'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op
    pass
