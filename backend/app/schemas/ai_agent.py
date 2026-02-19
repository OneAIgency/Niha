"""Pydantic schemas for AI Agent configuration and knowledge base."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# -- Agent Config ----------------------------------------------------------
class AIAgentConfigResponse(BaseModel):
    id: UUID
    role: str
    model: str
    system_prompt: str
    temperature: float
    max_tokens: int
    allow_internet: bool
    allow_off_knowledge: bool
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIAgentConfigUpdate(BaseModel):
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=256, le=8192)
    allow_internet: Optional[bool] = None
    allow_off_knowledge: Optional[bool] = None
    enabled: Optional[bool] = None


# -- Knowledge Source ------------------------------------------------------
class AIKnowledgeSourceResponse(BaseModel):
    id: UUID
    name: str
    source_type: str
    file_path: Optional[str] = None
    url: Optional[str] = None
    content_hash: Optional[str] = None
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    indexed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIKnowledgeSourceAddURL(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1, max_length=512)


# -- Knowledge Chunk -------------------------------------------------------
class AIKnowledgeChunkResponse(BaseModel):
    id: UUID
    chunk_index: int
    content: str
    token_count: int
    metadata_: Optional[dict] = Field(None, alias="metadata")
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# -- API Keys --------------------------------------------------------------
class APIKeysResponse(BaseModel):
    anthropic_key_masked: str
    openai_key_masked: str
    anthropic_use_env: bool
    openai_use_env: bool


class APIKeysUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_use_env: Optional[bool] = None
    openai_use_env: Optional[bool] = None


# -- Test Chat --------------------------------------------------------------
class TestChatRequest(BaseModel):
    messages: list[dict]  # [{role, content}]
    role: str = "INTRODUCER"


class DualChatRequest(BaseModel):
    messages: list[dict]
