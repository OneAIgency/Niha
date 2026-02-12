"""Add indexes on 23 FK columns that were missing indexes.

Without indexes, JOINs and cascading DELETEs on these FKs trigger
full table scans. All operations are CREATE INDEX IF NOT EXISTS
and DROP INDEX IF EXISTS for idempotency.

Revision ID: 2026_02_11_fk_indexes
Revises: 2026_02_10_server_defaults
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_11_fk_indexes"
down_revision: Union[str, None] = "2026_02_10_server_defaults"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (index_name, table_name, column_name)
FK_INDEXES = [
    ("ix_trading_fee_configs_updated_by", "trading_fee_configs", "updated_by"),
    ("ix_entity_fee_overrides_updated_by", "entity_fee_overrides", "updated_by"),
    ("ix_entities_kyc_approved_by", "entities", "kyc_approved_by"),
    ("ix_users_entity_id", "users", "entity_id"),
    ("ix_users_created_by", "users", "created_by"),
    ("ix_contact_requests_agent_id", "contact_requests", "agent_id"),
    ("ix_certificates_entity_id", "certificates", "entity_id"),
    ("ix_trades_buyer_entity_id", "trades", "buyer_entity_id"),
    ("ix_trades_seller_entity_id", "trades", "seller_entity_id"),
    ("ix_trades_certificate_id", "trades", "certificate_id"),
    ("ix_swap_requests_entity_id", "swap_requests", "entity_id"),
    ("ix_swap_requests_matched_with", "swap_requests", "matched_with"),
    ("ix_kyc_documents_reviewed_by", "kyc_documents", "reviewed_by"),
    ("ix_deposits_cleared_by_admin_id", "deposits", "cleared_by_admin_id"),
    ("ix_deposits_rejected_by_admin_id", "deposits", "rejected_by_admin_id"),
    ("ix_deposits_confirmed_by", "deposits", "confirmed_by"),
    ("ix_asset_transactions_created_by", "asset_transactions", "created_by"),
    ("ix_ticket_logs_session_id", "ticket_logs", "session_id"),
    ("ix_liquidity_operations_created_by", "liquidity_operations", "created_by"),
    ("ix_settlement_status_history_updated_by", "settlement_status_history", "updated_by"),
    ("ix_withdrawals_processed_by", "withdrawals", "processed_by"),
    ("ix_withdrawals_completed_by", "withdrawals", "completed_by"),
    ("ix_withdrawals_rejected_by", "withdrawals", "rejected_by"),
]


def upgrade() -> None:
    for idx_name, table, column in FK_INDEXES:
        op.create_index(idx_name, table, [column], if_not_exists=True)


def downgrade() -> None:
    for idx_name, table, _column in reversed(FK_INDEXES):
        op.drop_index(idx_name, table_name=table, if_exists=True)
