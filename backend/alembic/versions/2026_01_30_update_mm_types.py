"""Update MarketMakerType enum values from old to new.

Old: CEA_CASH_SELLER, CASH_BUYER, SWAP_MAKER
New: CEA_SELLER, CEA_BUYER, EUA_OFFER

This migration uses a different approach to handle PostgreSQL's enum limitations:
1. Convert column to text temporarily
2. Update values
3. Add new enum values
4. Convert column back to enum

Revision ID: 2026_01_30_mm_types
Revises: 2026_01_30_add_mm, 2026_01_30_eur_price
Create Date: 2026-01-30

"""
import sqlalchemy as sa
from alembic import op

revision = "2026_01_30_mm_types"
down_revision = ("2026_01_30_add_mm", "2026_01_30_eur_price")
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Step 1: Convert mm_type column to text temporarily
    conn.execute(
        sa.text("""
            ALTER TABLE market_maker_clients
            ALTER COLUMN mm_type TYPE text
        """)
    )

    # Step 2: Update existing records to use new values
    # CEA_CASH_SELLER -> CEA_SELLER
    # CASH_BUYER -> CEA_BUYER
    # SWAP_MAKER -> EUA_OFFER
    conn.execute(
        sa.text("""
            UPDATE market_maker_clients
            SET mm_type = CASE mm_type
                WHEN 'CEA_CASH_SELLER' THEN 'CEA_SELLER'
                WHEN 'CASH_BUYER' THEN 'CEA_BUYER'
                WHEN 'SWAP_MAKER' THEN 'EUA_OFFER'
                ELSE mm_type
            END
        """)
    )

    # Step 3: Drop the old enum type and create new one
    conn.execute(sa.text("DROP TYPE IF EXISTS marketmakertype CASCADE"))
    conn.execute(
        sa.text("""
            CREATE TYPE marketmakertype AS ENUM ('CEA_SELLER', 'CEA_BUYER', 'EUA_OFFER')
        """)
    )

    # Step 4: Convert column back to enum type
    conn.execute(
        sa.text("""
            ALTER TABLE market_maker_clients
            ALTER COLUMN mm_type TYPE marketmakertype USING mm_type::marketmakertype
        """)
    )


def downgrade():
    conn = op.get_bind()

    # Convert to text
    conn.execute(
        sa.text("""
            ALTER TABLE market_maker_clients
            ALTER COLUMN mm_type TYPE text
        """)
    )

    # Revert to old values
    conn.execute(
        sa.text("""
            UPDATE market_maker_clients
            SET mm_type = CASE mm_type
                WHEN 'CEA_SELLER' THEN 'CEA_CASH_SELLER'
                WHEN 'CEA_BUYER' THEN 'CASH_BUYER'
                WHEN 'EUA_OFFER' THEN 'SWAP_MAKER'
                ELSE mm_type
            END
        """)
    )

    # Recreate old enum type
    conn.execute(sa.text("DROP TYPE IF EXISTS marketmakertype CASCADE"))
    conn.execute(
        sa.text("""
            CREATE TYPE marketmakertype AS ENUM ('CEA_CASH_SELLER', 'CASH_BUYER', 'SWAP_MAKER')
        """)
    )

    # Convert back to enum
    conn.execute(
        sa.text("""
            ALTER TABLE market_maker_clients
            ALTER COLUMN mm_type TYPE marketmakertype USING mm_type::marketmakertype
        """)
    )
