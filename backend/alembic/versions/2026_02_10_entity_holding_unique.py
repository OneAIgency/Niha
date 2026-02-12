"""Add unique constraint on entity_holdings (entity_id, asset_type).

Ensures one row per entity per asset type; prevents duplicate balance rows.

Revision ID: 2026_02_10_entity_holding_uq
Revises: 2026_02_10_conf_cleared
Create Date: 2026-02-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_10_entity_holding_uq"
down_revision: Union[str, None] = "2026_02_10_conf_cleared"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_entity_holding_asset",
        "entity_holdings",
        ["entity_id", "asset_type"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_entity_holding_asset",
        "entity_holdings",
        type_="unique",
    )
