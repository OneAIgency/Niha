"""Add exchange_rate_sources table for EUR/CNY and other currency pair scraping

Revision ID: 2026_01_30_exchange_rates
Revises: 2026_01_29_mail_config
Create Date: 2026-01-30

"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, UUID

from alembic import op

revision = "2026_01_30_exchange_rates"
down_revision = "2026_01_29_full_flow"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Reuse existing enums (scrapelibrary, scrapestatus) from scraping_sources
    # These should already exist from the baseline migration

    # Create table only if it does not exist (idempotent)
    insp = sa.inspect(conn)
    if "exchange_rate_sources" in insp.get_table_names():
        return

    # Reuse existing enum types
    scrape_library_enum = ENUM(
        "HTTPX", "BEAUTIFULSOUP", "SELENIUM", "PLAYWRIGHT",
        name="scrapelibrary", create_type=False
    )
    scrape_status_enum = ENUM(
        "SUCCESS", "FAILED", "TIMEOUT",
        name="scrapestatus", create_type=False
    )

    op.create_table(
        "exchange_rate_sources",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("from_currency", sa.String(3), nullable=False),
        sa.Column("to_currency", sa.String(3), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("scrape_library", scrape_library_enum, server_default="HTTPX"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("is_primary", sa.Boolean(), server_default="false"),
        sa.Column("scrape_interval_minutes", sa.Integer(), server_default="60"),
        sa.Column("last_rate", sa.Numeric(18, 8), nullable=True),
        sa.Column("last_scraped_at", sa.DateTime(), nullable=True),
        sa.Column("last_scrape_status", scrape_status_enum, nullable=True),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Create index for currency pair lookups
    op.create_index(
        "ix_exchange_rate_sources_currency_pair",
        "exchange_rate_sources",
        ["from_currency", "to_currency"]
    )


def downgrade():
    op.drop_index("ix_exchange_rate_sources_currency_pair")
    op.drop_table("exchange_rate_sources")
