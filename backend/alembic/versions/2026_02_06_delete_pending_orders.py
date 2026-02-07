"""Delete pending (OPEN and PARTIALLY_FILLED) orders - market-only flow

Revision ID: 2026_02_06_pending
Revises: internal_trade_settings
Create Date: 2026-02-06

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2026_02_06_pending'
down_revision: Union[str, None] = 'internal_trade_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Cancel PARTIALLY_FILLED orders (they have trades - cannot delete without losing history)
    op.execute(
        "UPDATE orders SET status = 'CANCELLED' WHERE status = 'PARTIALLY_FILLED'"
    )
    # Delete OPEN orders (no trades, safe to delete)
    op.execute(
        "DELETE FROM orders WHERE status = 'OPEN'"
    )


def downgrade() -> None:
    # Irreversible - we cannot restore deleted/cancelled orders
    pass
