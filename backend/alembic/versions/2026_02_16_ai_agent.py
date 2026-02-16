"""AI Agent: config, knowledge sources, chunk embeddings with pgvector

Revision ID: 2026_02_16_ai_agent
Revises: 2026_02_13_introducer
Create Date: 2026-02-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = "2026_02_16_ai_agent"
down_revision: Union[str, None] = "2026_02_13_introducer"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_INTRODUCER_PROMPT = """You are a carbon markets specialist assistant for NIHA Group's introducer portal. Your role is to help business introducers understand the NIHA carbon trading platform so they can confidently present it to their clients.

Be professional, knowledgeable, and approachable. Cite specific numbers, not vague claims. Acknowledge risks before presenting mitigations.

You have tools to navigate the portal page. When you reference content that exists on the page, USE the tools to scroll there, expand the relevant accordion, or switch to the right tab."""

DEFAULT_ADMIN_PROMPT = """You are a carbon markets specialist assistant for NIHA Group administrators. You have full access to platform knowledge and can answer detailed technical, regulatory, and operational questions.

Be precise, data-driven, and comprehensive. You may reference internal platform mechanics and operational details."""


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ai_agent_config
    op.create_table(
        "ai_agent_config",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("role", sa.String(32), unique=True, nullable=False),
        sa.Column("model", sa.String(64), server_default="claude-sonnet-4-20250514"),
        sa.Column("system_prompt", sa.Text(), server_default=""),
        sa.Column("temperature", sa.Float(), server_default="0.7"),
        sa.Column("max_tokens", sa.Integer(), server_default="4096"),
        sa.Column("allow_internet", sa.Boolean(), server_default="false"),
        sa.Column("allow_off_knowledge", sa.Boolean(), server_default="false"),
        sa.Column("enabled", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    # Seed default configs
    op.execute(
        sa.text(
            "INSERT INTO ai_agent_config (role, system_prompt) VALUES (:role, :prompt)"
        ).bindparams(role="INTRODUCER", prompt=DEFAULT_INTRODUCER_PROMPT)
    )
    op.execute(
        sa.text(
            "INSERT INTO ai_agent_config (role, system_prompt) VALUES (:role, :prompt)"
        ).bindparams(role="ADMIN", prompt=DEFAULT_ADMIN_PROMPT)
    )

    # ai_knowledge_source
    op.create_table(
        "ai_knowledge_source",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("source_type", sa.String(32), nullable=False),
        sa.Column("file_path", sa.String(512), nullable=True),
        sa.Column("url", sa.String(512), nullable=True),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("chunk_count", sa.Integer(), server_default="0"),
        sa.Column("status", sa.String(32), server_default=sa.text("'pending'")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("indexed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    # ai_knowledge_chunk
    op.create_table(
        "ai_knowledge_chunk",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_id", UUID(as_uuid=True), sa.ForeignKey("ai_knowledge_source.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), server_default="0"),
        sa.Column("metadata", JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    # Add vector column separately (pgvector type)
    op.execute("ALTER TABLE ai_knowledge_chunk ADD COLUMN embedding vector(1536)")

    # IVFFlat index for cosine similarity search
    op.execute(
        "CREATE INDEX ix_ai_knowledge_chunk_embedding "
        "ON ai_knowledge_chunk USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.drop_table("ai_knowledge_chunk")
    op.drop_table("ai_knowledge_source")
    op.drop_table("ai_agent_config")
    op.execute("DROP EXTENSION IF EXISTS vector")
