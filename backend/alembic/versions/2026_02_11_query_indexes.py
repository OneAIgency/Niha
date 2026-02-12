"""Add indexes on frequently filtered/sorted columns.

These columns appear in WHERE/ORDER BY clauses across the codebase
but lacked indexes, causing sequential scans on large tables.

Revision ID: 2026_02_11_query_indexes
Revises: 2026_02_11_fk_indexes
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_11_query_indexes"
down_revision: Union[str, None] = "2026_02_11_fk_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (index_name, table_name, column_name(s))
QUERY_INDEXES = [
    ("ix_deposits_status", "deposits", ["status"]),
    ("ix_orders_status", "orders", ["status"]),
    ("ix_contact_requests_user_role", "contact_requests", ["user_role"]),
    ("ix_contact_requests_created_at", "contact_requests", ["created_at"]),
    ("ix_price_history_certificate_type", "price_history", ["certificate_type"]),
    ("ix_withdrawals_status", "withdrawals", ["status"]),
    ("ix_trades_status", "trades", ["status"]),
    ("ix_trades_created_at", "trades", ["created_at"]),
]


def upgrade() -> None:
    for idx_name, table, columns in QUERY_INDEXES:
        op.create_index(idx_name, table, columns, if_not_exists=True)


def downgrade() -> None:
    for idx_name, table, _columns in reversed(QUERY_INDEXES):
        op.drop_index(idx_name, table_name=table, if_exists=True)
