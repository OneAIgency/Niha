"""Add PostgreSQL server defaults for critical columns.

Ensures direct SQL inserts, data recovery, and migration operations get
sensible defaults even when SQLAlchemy is bypassed. Python-side defaults
remain as-is for normal ORM usage.

Revision ID: 2026_02_10_server_defaults
Revises: 2026_02_10_drop_orphans
Create Date: 2026-02-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "2026_02_10_server_defaults"
down_revision: Union[str, None] = "2026_02_10_drop_orphans"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# All tables with created_at columns that need server_default = now()
TIMESTAMP_COLUMNS = [
    ("users", "created_at"),
    ("users", "updated_at"),
    ("entities", "created_at"),
    ("entities", "updated_at"),
    ("contact_requests", "created_at"),
    ("contact_requests", "updated_at"),
    ("certificates", "created_at"),
    ("certificates", "updated_at"),
    ("trades", "created_at"),
    ("swap_requests", "created_at"),
    ("swap_requests", "updated_at"),
    ("price_history", "recorded_at"),
    ("activity_logs", "created_at"),
    ("kyc_documents", "created_at"),
    ("kyc_documents", "updated_at"),
    ("scraping_sources", "created_at"),
    ("scraping_sources", "updated_at"),
    ("exchange_rate_sources", "created_at"),
    ("exchange_rate_sources", "updated_at"),
    ("user_sessions", "started_at"),
    ("orders", "created_at"),
    ("orders", "updated_at"),
    ("cash_market_trades", "executed_at"),
    ("authentication_attempts", "created_at"),
    ("sellers", "created_at"),
    ("sellers", "updated_at"),
    ("deposits", "created_at"),
    ("deposits", "updated_at"),
    ("entity_holdings", "created_at"),
    ("entity_holdings", "updated_at"),
    ("asset_transactions", "created_at"),
    ("ticket_logs", "timestamp"),
    ("liquidity_operations", "created_at"),
    ("settlement_batches", "created_at"),
    ("settlement_batches", "updated_at"),
    ("settlement_status_history", "created_at"),
    ("withdrawals", "created_at"),
    ("withdrawals", "updated_at"),
    ("auto_trade_rules", "created_at"),
    ("auto_trade_rules", "updated_at"),
    ("auto_trade_settings", "created_at"),
    ("auto_trade_settings", "updated_at"),
    ("auto_trade_market_settings", "created_at"),
    ("auto_trade_market_settings", "updated_at"),
    ("trading_fee_configs", "created_at"),
    ("trading_fee_configs", "updated_at"),
    ("entity_fee_overrides", "created_at"),
    ("mail_config", "created_at"),
    ("mail_config", "updated_at"),
    ("market_maker_clients", "created_at"),
    ("market_maker_clients", "updated_at"),
]

# Boolean columns: (table, column, default_value)
BOOLEAN_DEFAULTS = [
    ("users", "is_active", "true"),
    ("users", "must_change_password", "true"),
    ("entities", "verified", "false"),
    ("market_maker_clients", "is_active", "true"),
    ("scraping_sources", "is_active", "true"),
    ("exchange_rate_sources", "is_active", "true"),
    ("exchange_rate_sources", "is_primary", "false"),
    ("user_sessions", "is_active", "true"),
    ("sellers", "is_active", "true"),
    ("trading_fee_configs", "is_active", "true"),
    ("entity_fee_overrides", "is_active", "true"),
    ("auto_trade_rules", "enabled", "false"),
    ("auto_trade_market_settings", "enabled", "true"),
    ("auto_trade_settings", "liquidity_limit_enabled", "true"),
    ("mail_config", "use_env_credentials", "true"),
    ("mail_config", "smtp_use_tls", "true"),
]

# Numeric columns: (table, column, default_value)
NUMERIC_DEFAULTS = [
    ("entities", "balance_amount", "0"),
    ("entities", "total_deposited", "0"),
    ("orders", "filled_quantity", "0"),
    ("entity_holdings", "quantity", "0"),
    ("market_maker_clients", "eur_balance", "0"),
    ("market_maker_clients", "eua_balance", "0"),
    ("sellers", "cea_balance", "0"),
    ("sellers", "cea_sold", "0"),
    ("sellers", "total_transactions", "0"),
]


def _column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    # Timestamps: DEFAULT (now() AT TIME ZONE 'utc')
    for table, col in TIMESTAMP_COLUMNS:
        if _column_exists(table, col):
            op.alter_column(
                table,
                col,
                server_default=sa.text("(now() AT TIME ZONE 'utc')"),
            )

    # Booleans
    for table, col, val in BOOLEAN_DEFAULTS:
        if _column_exists(table, col):
            op.alter_column(table, col, server_default=sa.text(val))

    # Numerics
    for table, col, val in NUMERIC_DEFAULTS:
        if _column_exists(table, col):
            op.alter_column(table, col, server_default=sa.text(val))


def downgrade() -> None:
    # Remove all server defaults
    for table, col in TIMESTAMP_COLUMNS:
        if _column_exists(table, col):
            op.alter_column(table, col, server_default=None)

    for table, col, _ in BOOLEAN_DEFAULTS:
        if _column_exists(table, col):
            op.alter_column(table, col, server_default=None)

    for table, col, _ in NUMERIC_DEFAULTS:
        if _column_exists(table, col):
            op.alter_column(table, col, server_default=None)
