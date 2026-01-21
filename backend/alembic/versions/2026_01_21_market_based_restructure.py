"""Market-based market maker restructure

Revision ID: a8f9d5c2e1b4
Revises: f873b8199176
Create Date: 2026-01-21

Changes MarketMakerType enum from certificate-based (ASSET_HOLDER, LIQUIDITY_PROVIDER)
to market-based (CEA_CASH_SELLER, CASH_BUYER, SWAP_MAKER).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8f9d5c2e1b4'
down_revision: Union[str, None] = 'f873b8199176'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the default value first
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type DROP DEFAULT;
    """)

    # Convert column to text to allow free-form updates
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE text;
    """)

    # Update existing LIQUIDITY_PROVIDER to CASH_BUYER
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'CASH_BUYER'
        WHERE mm_type = 'LIQUIDITY_PROVIDER';
    """)

    # Update existing ASSET_HOLDER to CEA_CASH_SELLER (assume they sell CEA for cash)
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'CEA_CASH_SELLER'
        WHERE mm_type = 'ASSET_HOLDER';
    """)

    # Drop old enum and create new one
    op.execute("""
        DROP TYPE marketmakertype;

        CREATE TYPE marketmakertype AS ENUM (
            'CEA_CASH_SELLER',
            'CASH_BUYER',
            'SWAP_MAKER'
        );
    """)

    # Convert column back to enum
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE marketmakertype
        USING mm_type::text::marketmakertype;
    """)

    # Restore default value with new enum value
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type SET DEFAULT 'CEA_CASH_SELLER'::marketmakertype;
    """)


def downgrade() -> None:
    # Drop the default value first
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type DROP DEFAULT;
    """)

    # Convert column to text to allow free-form updates
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE text;
    """)

    # Reverse mapping
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'LIQUIDITY_PROVIDER'
        WHERE mm_type = 'CASH_BUYER';
    """)

    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'ASSET_HOLDER'
        WHERE mm_type IN ('CEA_CASH_SELLER', 'SWAP_MAKER');
    """)

    # Restore old enum
    op.execute("""
        DROP TYPE marketmakertype;

        CREATE TYPE marketmakertype AS ENUM (
            'ASSET_HOLDER',
            'LIQUIDITY_PROVIDER'
        );
    """)

    # Convert column back to enum
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE marketmakertype
        USING mm_type::text::marketmakertype;
    """)

    # Restore default value with old enum value
    op.execute("""
        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type SET DEFAULT 'ASSET_HOLDER'::marketmakertype;
    """)
