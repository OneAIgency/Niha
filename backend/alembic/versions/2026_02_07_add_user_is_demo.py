"""Add is_demo to users (demo user classification)

Revision ID: 2026_02_07_is_demo
Revises: 2026_02_06_pending
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2026_02_07_is_demo"
down_revision: Union[str, None] = "2026_02_06_pending"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "is_demo")
