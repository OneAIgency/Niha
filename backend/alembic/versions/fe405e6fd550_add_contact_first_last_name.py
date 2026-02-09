"""add_contact_first_last_name

Revision ID: fe405e6fd550
Revises: 2026_02_07_at_fields
Create Date: 2026-02-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fe405e6fd550"
down_revision: Union[str, None] = "2026_02_07_at_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("contact_requests", sa.Column("contact_first_name", sa.String(128), nullable=True))
    op.add_column("contact_requests", sa.Column("contact_last_name", sa.String(128), nullable=True))

    # Migrate existing contact_name data: split "First Last" into first/last
    op.execute("""
        UPDATE contact_requests
        SET contact_first_name = split_part(contact_name, ' ', 1),
            contact_last_name = CASE
                WHEN position(' ' in contact_name) > 0
                THEN substring(contact_name from position(' ' in contact_name) + 1)
                ELSE NULL
            END
        WHERE contact_name IS NOT NULL
          AND contact_first_name IS NULL
    """)


def downgrade() -> None:
    op.drop_column("contact_requests", "contact_last_name")
    op.drop_column("contact_requests", "contact_first_name")
