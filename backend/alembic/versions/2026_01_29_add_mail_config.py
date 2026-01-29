"""Add mail_config table for admin-configurable mail and invitation settings

Revision ID: 2026_01_29_mail_config
Revises: 2026_01_29_baseline
Create Date: 2026-01-29

"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, UUID

from alembic import op

revision = "2026_01_29_mail_config"
down_revision = "2026_01_29_baseline"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Create enum type only if it does not exist
    # (idempotent; app init_db may have created it)
    conn.execute(sa.text(
        "DO $$ BEGIN CREATE TYPE mailprovider AS ENUM ('resend', 'smtp'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    ))

    # Create table only if it does not exist
    # (idempotent; app init_db may have created it)
    insp = sa.inspect(conn)
    if "mail_config" in insp.get_table_names():
        return

    mail_provider_enum = ENUM("resend", "smtp", name="mailprovider", create_type=False)
    op.create_table(
        "mail_config",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "provider", mail_provider_enum, nullable=False, server_default="resend"
        ),
        sa.Column(
            "use_env_credentials",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column("from_email", sa.String(255), nullable=False),
        sa.Column("resend_api_key", sa.String(500), nullable=True),
        sa.Column("smtp_host", sa.String(255), nullable=True),
        sa.Column("smtp_port", sa.Integer(), nullable=True),
        sa.Column(
            "smtp_use_tls", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("smtp_username", sa.String(255), nullable=True),
        sa.Column("smtp_password", sa.String(500), nullable=True),
        sa.Column("invitation_subject", sa.String(255), nullable=True),
        sa.Column("invitation_body_html", sa.Text(), nullable=True),
        sa.Column("invitation_link_base_url", sa.String(500), nullable=True),
        sa.Column(
            "invitation_token_expiry_days",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("7"),
        ),
        sa.Column("verification_method", sa.String(50), nullable=True),
        sa.Column("auth_method", sa.String(50), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )


def downgrade():
    op.drop_table("mail_config")
    op.execute("DROP TYPE IF EXISTS mailprovider")
