"""Add market field to orders

Revision ID: c9d4efedace8
Revises: a8f9d5c2e1b4
Create Date: 2026-01-21

Adds 'market' field to orders table to distinguish CEA_CASH orders from SWAP orders.
Backfills existing orders based on certificate_type.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c9d4efedace8'
down_revision: Union[str, None] = 'a8f9d5c2e1b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create market enum if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'markettype') THEN
                CREATE TYPE markettype AS ENUM ('CEA_CASH', 'SWAP');
            END IF;
        END$$;
    """)

    # Add market column
    op.add_column('orders',
        sa.Column('market', postgresql.ENUM('CEA_CASH', 'SWAP', name='markettype'), nullable=True)
    )

    # Backfill: All existing orders are CEA_CASH market (cash trading)
    # SWAP market will be implemented separately
    op.execute("""
        UPDATE orders SET market = 'CEA_CASH';
    """)

    # Make NOT NULL after backfill
    op.alter_column('orders', 'market', nullable=False)

    # Add index
    op.create_index('idx_orders_market', 'orders', ['market'])


def downgrade() -> None:
    op.drop_index('idx_orders_market')
    op.drop_column('orders', 'market')
    op.execute("DROP TYPE markettype;")
