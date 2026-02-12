"""Add CHECK constraints for positive values on remaining tables.

Tables already covered by 2026_02_10_positive_amount_checks:
  entity_holdings, orders, withdrawals, deposits, entities.

This migration covers the rest: cash_market_trades, certificates,
settlement_batches, trades, swap_requests, market_maker_clients.

Revision ID: 2026_02_11_check_constraints
Revises: 2026_02_11_string_to_enum
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_11_check_constraints"
down_revision: Union[str, None] = "2026_02_11_string_to_enum"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (constraint_name, table_name, expression)
CONSTRAINTS = [
    ("ck_cash_market_trades_price_positive", "cash_market_trades", "price > 0"),
    ("ck_cash_market_trades_quantity_positive", "cash_market_trades", "quantity > 0"),
    ("ck_certificates_quantity_positive", "certificates", "quantity > 0"),
    ("ck_certificates_unit_price_positive", "certificates", "unit_price > 0"),
    ("ck_settlement_batches_quantity_positive", "settlement_batches", "quantity > 0"),
    ("ck_settlement_batches_price_non_neg", "settlement_batches", "price >= 0"),
    ("ck_settlement_batches_total_value_non_neg", "settlement_batches", "total_value_eur >= 0"),
    ("ck_trades_quantity_positive", "trades", "quantity > 0"),
    ("ck_trades_price_per_unit_positive", "trades", "price_per_unit > 0"),
    ("ck_trades_total_value_positive", "trades", "total_value > 0"),
    ("ck_swap_requests_quantity_positive", "swap_requests", "quantity > 0"),
    ("ck_market_maker_clients_eur_balance_non_neg", "market_maker_clients", "eur_balance >= 0"),
    ("ck_market_maker_clients_eua_balance_non_neg", "market_maker_clients", "eua_balance >= 0"),
]


def upgrade() -> None:
    for name, table, expr in CONSTRAINTS:
        op.create_check_constraint(name, table, expr)


def downgrade() -> None:
    for name, table, _expr in reversed(CONSTRAINTS):
        op.drop_constraint(name, table, type_="check")
