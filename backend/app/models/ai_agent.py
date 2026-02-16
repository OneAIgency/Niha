"""AI Agent configuration, knowledge sources, and chunk embeddings."""
import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer,
    String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from ..core.database import Base


class AIAgentConfig(Base):
    __tablename__ = "ai_agent_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(32), unique=True, nullable=False)  # 'INTRODUCER' or 'ADMIN'
    model = Column(String(64), default="claude-sonnet-4-20250514")
    system_prompt = Column(Text, default="")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    allow_internet = Column(Boolean, default=False)
    allow_off_knowledge = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class AIKnowledgeSource(Base):
    __tablename__ = "ai_knowledge_source"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    source_type = Column(String(32), nullable=False)  # 'pdf', 'text', 'url', 'app_content'
    file_path = Column(String(512), nullable=True)
    url = Column(String(512), nullable=True)
    content_hash = Column(String(64), nullable=True)
    chunk_count = Column(Integer, default=0)
    status = Column(String(32), default="pending")  # 'pending', 'indexing', 'indexed', 'error'
    error_message = Column(Text, nullable=True)
    indexed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chunks = relationship("AIKnowledgeChunk", back_populates="source", cascade="all, delete-orphan")


class AIKnowledgeChunk(Base):
    __tablename__ = "ai_knowledge_chunk"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("ai_knowledge_source.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding = Column(Vector(1536), nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source = relationship("AIKnowledgeSource", back_populates="chunks")
