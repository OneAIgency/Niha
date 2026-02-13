"""Add is_primary to scraping_sources

Revision ID: 2026_02_13_source_primary
Revises: 2026_02_13_spread_and_tick_size
Create Date: 2026-02-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2026_02_13_source_primary"
down_revision: Union[str, None] = "2026_02_13_spread_and_tick_size"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "scraping_sources",
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("scraping_sources", "is_primary")
