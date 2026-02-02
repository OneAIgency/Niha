"""increase_anonymous_code_length

Revision ID: increase_anon_code_len
Revises: d96d8a0b2dce
Create Date: 2026-02-02 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'increase_anon_code_len'
down_revision: Union[str, None] = 'd96d8a0b2dce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Increase anonymous_code column length from 10 to 20 characters
    # to accommodate SWAP-XXXXXX format (11 chars)
    op.alter_column(
        'swap_requests',
        'anonymous_code',
        existing_type=sa.String(10),
        type_=sa.String(20),
        existing_nullable=False
    )


def downgrade() -> None:
    op.alter_column(
        'swap_requests',
        'anonymous_code',
        existing_type=sa.String(20),
        type_=sa.String(10),
        existing_nullable=False
    )
