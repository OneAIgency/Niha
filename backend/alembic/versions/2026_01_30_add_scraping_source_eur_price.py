"""Add last_price_eur and last_exchange_rate columns to scraping_sources

Revision ID: 2026_01_30_eur_price
Revises: 2026_01_30_exchange_rates
Create Date: 2026-01-30

"""

import sqlalchemy as sa

from alembic import op

revision = "2026_01_30_eur_price"
down_revision = "2026_01_30_exchange_rates"
branch_labels = None
depends_on = None


def upgrade():
    # Add columns for storing EUR-converted price and the exchange rate used
    op.add_column(
        "scraping_sources",
        sa.Column("last_price_eur", sa.Numeric(18, 4), nullable=True),
    )
    op.add_column(
        "scraping_sources",
        sa.Column("last_exchange_rate", sa.Numeric(18, 8), nullable=True),
    )


def downgrade():
    op.drop_column("scraping_sources", "last_exchange_rate")
    op.drop_column("scraping_sources", "last_price_eur")
