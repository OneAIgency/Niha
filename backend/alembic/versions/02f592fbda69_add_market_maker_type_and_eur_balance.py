"""Add market maker type and EUR balance

Revision ID: 02f592fbda69
Revises: e5f6a7b8c9d0
Create Date: 2026-01-20 13:57:46.298851

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "02f592fbda69"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old MarketMakerType enum if it exists (with old values: BUYER, SELLER, BOTH)
    # and create new one with ASSET_HOLDER, LIQUIDITY_PROVIDER
    op.execute("""
        DO $$ BEGIN
            -- Drop the old enum type if it exists
            DROP TYPE IF EXISTS marketmakertype CASCADE;
            -- Create new enum type
            CREATE TYPE marketmakertype AS ENUM ('ASSET_HOLDER', 'LIQUIDITY_PROVIDER');
        END $$;
    """)

    # Add mm_type column to market_maker_clients (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE market_maker_clients
            ADD COLUMN mm_type marketmakertype NOT NULL DEFAULT 'ASSET_HOLDER';
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;
    """)

    # Add eur_balance column to market_maker_clients (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE market_maker_clients
            ADD COLUMN eur_balance NUMERIC(18, 2) NOT NULL DEFAULT 0;
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;
    """)


def downgrade() -> None:
    # Drop columns
    op.drop_column("market_maker_clients", "eur_balance")
    op.drop_column("market_maker_clients", "mm_type")

    # Drop enum type
    op.execute("DROP TYPE marketmakertype")
