"""Drop orphan legacy enum types from init.sql.

These lowercase enums (user_role, contact_status, etc.) were created by
init.sql but never used by SQLAlchemy, which creates its own UPPERCASE
variants (userrole, contactstatus, etc.). Removing them to reduce confusion.

Revision ID: 2026_02_10_drop_orphans
Revises: 2026_02_10_positive_checks
Create Date: 2026-02-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "2026_02_10_drop_orphans"
down_revision: Union[str, None] = "2026_02_10_positive_checks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ORPHAN_ENUMS = [
    "user_role",
    "contact_status",
    "kyc_status",
    "certificate_status",
    "certificate_type",
    "trade_type",
    "trade_status",
    "swap_status",
]


def _type_exists(name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
        {"name": name},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    for enum_name in ORPHAN_ENUMS:
        if _type_exists(enum_name):
            op.execute(sa.text(f"DROP TYPE {enum_name}"))


def downgrade() -> None:
    # Recreate legacy enums if needed (lowercase values)
    recreate = {
        "user_role": "('admin', 'trader', 'viewer')",
        "contact_status": "('new', 'contacted', 'enrolled', 'rejected')",
        "kyc_status": "('pending', 'approved', 'rejected')",
        "certificate_status": "('available', 'reserved', 'sold')",
        "certificate_type": "('EUA', 'CEA')",
        "trade_type": "('buy', 'sell', 'swap')",
        "trade_status": "('pending', 'confirmed', 'completed', 'cancelled')",
        "swap_status": "('open', 'matched', 'completed', 'cancelled')",
    }
    for enum_name, values in recreate.items():
        if not _type_exists(enum_name):
            op.execute(sa.text(f"CREATE TYPE {enum_name} AS ENUM {values}"))
