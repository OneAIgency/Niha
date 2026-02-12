"""Convert String columns to proper PostgreSQL Enum types.

- deposits.hold_type: String(50) -> holdtype enum
- deposits.aml_status: String(50) -> amlstatus enum
- auto_trade_settings.certificate_type: String(10) -> certificatetype (reuse existing)

Existing string values already match enum labels, so a direct USING cast works.

Revision ID: 2026_02_11_string_to_enum
Revises: 2026_02_11_query_indexes
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op

revision: str = "2026_02_11_string_to_enum"
down_revision: Union[str, None] = "2026_02_11_query_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create enum types if they don't already exist (SQLAlchemy may have auto-created them)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE holdtype AS ENUM ('FIRST_DEPOSIT', 'SUBSEQUENT', 'LARGE_AMOUNT');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE amlstatus AS ENUM ('PENDING', 'ON_HOLD', 'CLEARED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    # 2. Convert deposits.hold_type: String(50) -> holdtype
    op.execute(
        "ALTER TABLE deposits "
        "ALTER COLUMN hold_type TYPE holdtype USING hold_type::holdtype"
    )

    # 3. Convert deposits.aml_status: String(50) -> amlstatus
    #    Drop the default first (it's a string 'PENDING'), re-add as enum default after.
    op.execute("ALTER TABLE deposits ALTER COLUMN aml_status DROP DEFAULT")
    op.execute(
        "ALTER TABLE deposits "
        "ALTER COLUMN aml_status TYPE amlstatus USING aml_status::amlstatus"
    )
    op.execute("ALTER TABLE deposits ALTER COLUMN aml_status SET DEFAULT 'PENDING'::amlstatus")

    # 4. Convert auto_trade_settings.certificate_type: String(10) -> certificatetype (existing enum)
    op.execute(
        "ALTER TABLE auto_trade_settings "
        "ALTER COLUMN certificate_type TYPE certificatetype "
        "USING certificate_type::certificatetype"
    )


def downgrade() -> None:
    # Reverse: enum -> varchar
    op.execute(
        "ALTER TABLE auto_trade_settings "
        "ALTER COLUMN certificate_type TYPE varchar(10) "
        "USING certificate_type::text"
    )

    op.execute("ALTER TABLE deposits ALTER COLUMN aml_status DROP DEFAULT")
    op.execute(
        "ALTER TABLE deposits "
        "ALTER COLUMN aml_status TYPE varchar(50) "
        "USING aml_status::text"
    )
    op.execute("ALTER TABLE deposits ALTER COLUMN aml_status SET DEFAULT 'PENDING'")

    op.execute(
        "ALTER TABLE deposits "
        "ALTER COLUMN hold_type TYPE varchar(50) "
        "USING hold_type::text"
    )

    # Drop enum types (IF EXISTS for safety — other models may keep them)
    op.execute("DROP TYPE IF EXISTS amlstatus")
    op.execute("DROP TYPE IF EXISTS holdtype")
