"""Convert legacy CONFIRMED deposits to CLEARED.

Optional data migration: direct-create deposits now use CLEARED; any existing
CONFIRMED rows (legacy) are converted so count queries and service layer stay consistent.

Revision ID: 2026_02_10_conf_cleared
Revises: fe405e6fd550
Create Date: 2026-02-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_10_conf_cleared"
down_revision: Union[str, None] = "fe405e6fd550"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE deposits SET status = 'CLEARED' WHERE status = 'CONFIRMED'"
    )


def downgrade() -> None:
    # No safe way to revert: we cannot know which rows were originally CONFIRMED
    pass
