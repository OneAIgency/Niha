"""Add CHECK constraints for positive/non-negative amounts.

Deposits: amount and reported_amount must be > 0 when set.
Entity holdings and entities: quantity/balance totals >= 0.
Orders: quantity > 0, price >= 0. Withdrawals: amount > 0.

Revision ID: 2026_02_10_positive_checks
Revises: 2026_02_10_entity_holding_uq
Create Date: 2026-02-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_10_positive_checks"
down_revision: Union[str, None] = "2026_02_10_entity_holding_uq"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_entity_holdings_quantity_non_neg",
        "entity_holdings",
        "quantity >= 0",
    )
    op.create_check_constraint(
        "ck_orders_quantity_positive",
        "orders",
        "quantity > 0",
    )
    op.create_check_constraint(
        "ck_orders_price_non_neg",
        "orders",
        "price >= 0",
    )
    op.create_check_constraint(
        "ck_withdrawals_amount_positive",
        "withdrawals",
        "amount > 0",
    )
    op.create_check_constraint(
        "ck_deposits_amounts_positive",
        "deposits",
        "(amount IS NULL OR amount > 0) AND (reported_amount IS NULL OR reported_amount > 0)",
    )
    op.create_check_constraint(
        "ck_entities_balances_non_neg",
        "entities",
        "balance_amount >= 0 AND total_deposited >= 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_entities_balances_non_neg", "entities", type_="check")
    op.drop_constraint("ck_deposits_amounts_positive", "deposits", type_="check")
    op.drop_constraint("ck_withdrawals_amount_positive", "withdrawals", type_="check")
    op.drop_constraint("ck_orders_price_non_neg", "orders", type_="check")
    op.drop_constraint("ck_orders_quantity_positive", "orders", type_="check")
    op.drop_constraint("ck_entity_holdings_quantity_non_neg", "entity_holdings", type_="check")
