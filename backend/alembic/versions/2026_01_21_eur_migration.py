"""EUR migration - add price currency tracking

Revision ID: e5f6a7b8c9d0
Revises: d4c523e409d9
Create Date: 2026-01-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4c523e409d9'
branch_labels = None
depends_on = None


def upgrade():
    # Add price_currency field to orders table (nullable for backward compatibility)
    # Legacy orders (created before 2026-01-21) are assumed to be in CNY
    # New orders will be stored in EUR
    op.add_column('orders', sa.Column('price_currency', sa.String(3), nullable=True, server_default='EUR'))

    # Add index for performance
    op.create_index('ix_orders_price_currency', 'orders', ['price_currency'])

    # Update PriceHistory default to EUR for new records
    op.alter_column('price_history', 'currency', server_default='EUR')


def downgrade():
    # Remove the index
    op.drop_index('ix_orders_price_currency')

    # Remove the column
    op.drop_column('orders', 'price_currency')

    # Restore PriceHistory default
    op.alter_column('price_history', 'currency', server_default=None)
