"""AI Agent admin endpoints: config, knowledge base, test chat, API keys."""
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import settings
from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.ai_agent import AIAgentConfig, AIKnowledgeChunk, AIKnowledgeSource
from ...models.models import User
from ...schemas.ai_agent import (
    AIAgentConfigResponse,
    AIAgentConfigUpdate,
    AIKnowledgeChunkResponse,
    AIKnowledgeSourceAddURL,
    AIKnowledgeSourceResponse,
    APIKeysResponse,
    APIKeysUpdate,
    DualChatRequest,
    TestChatRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/ai-agent", tags=["ai-agent"])

UPLOAD_DIR = Path("/app/uploads/knowledge")


# -- Agent Config ----------------------------------------------------------

@router.get("/configs", response_model=list[AIAgentConfigResponse])
async def list_configs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(AIAgentConfig).order_by(AIAgentConfig.role))
    return result.scalars().all()


@router.put("/configs/{role}", response_model=AIAgentConfigResponse)
async def update_config(
    role: str,
    update: AIAgentConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    role = role.upper()
    if role not in ("INTRODUCER", "ADMIN"):
        raise HTTPException(status_code=400, detail="Role must be INTRODUCER or ADMIN")

    result = await db.execute(
        select(AIAgentConfig).where(AIAgentConfig.role == role)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail=f"Config for role {role} not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    config.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(config)
    return config


# -- Knowledge Base --------------------------------------------------------

@router.get("/knowledge", response_model=list[AIKnowledgeSourceResponse])
async def list_knowledge_sources(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(AIKnowledgeSource).order_by(AIKnowledgeSource.created_at.desc())
    )
    return result.scalars().all()


@router.post("/knowledge/upload", response_model=AIKnowledgeSourceResponse)
async def upload_knowledge_file(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    allowed_types = {".pdf", ".txt", ".md"}
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported. Allowed: {allowed_types}")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}{ext}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    source_type = "pdf" if ext == ".pdf" else "text"
    source = AIKnowledgeSource(
        name=name,
        source_type=source_type,
        file_path=str(file_path),
        status="pending",
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    background_tasks.add_task(_ingest_background, str(source.id))
    return source


@router.post("/knowledge/add-url", response_model=AIKnowledgeSourceResponse)
async def add_url_source(
    body: AIKnowledgeSourceAddURL,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    source = AIKnowledgeSource(
        name=body.name,
        source_type="url",
        url=body.url,
        status="pending",
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    background_tasks.add_task(_ingest_background, str(source.id))
    return source


@router.delete("/knowledge/{source_id}")
async def delete_knowledge_source(
    source_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(AIKnowledgeSource).where(AIKnowledgeSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)

    await db.delete(source)
    await db.commit()
    return {"message": "Source deleted"}


@router.post("/knowledge/{source_id}/reindex")
async def reindex_source(
    source_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(AIKnowledgeSource).where(AIKnowledgeSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    source.status = "pending"
    await db.commit()

    background_tasks.add_task(_ingest_background, source_id)
    return {"message": "Reindexing started"}


@router.get("/knowledge/{source_id}/chunks", response_model=list[AIKnowledgeChunkResponse])
async def get_source_chunks(
    source_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(AIKnowledgeChunk)
        .where(AIKnowledgeChunk.source_id == source_id)
        .order_by(AIKnowledgeChunk.chunk_index)
    )
    return result.scalars().all()


# -- API Keys --------------------------------------------------------------

@router.get("/api-keys", response_model=APIKeysResponse)
async def get_api_keys(
    _: User = Depends(get_admin_user),
):
    anthropic_key = settings.ANTHROPIC_API_KEY
    openai_key = settings.OPENAI_API_KEY

    return APIKeysResponse(
        anthropic_key_masked=_mask_key(anthropic_key),
        openai_key_masked=_mask_key(openai_key),
        anthropic_use_env=bool(os.environ.get("ANTHROPIC_API_KEY")),
        openai_use_env=bool(os.environ.get("OPENAI_API_KEY")),
    )


@router.put("/api-keys")
async def update_api_keys(
    update: APIKeysUpdate,
    _: User = Depends(get_admin_user),
):
    """Update API keys in environment (runtime only)."""
    if update.anthropic_api_key is not None:
        os.environ["ANTHROPIC_API_KEY"] = update.anthropic_api_key
        settings.ANTHROPIC_API_KEY = update.anthropic_api_key
    if update.openai_api_key is not None:
        os.environ["OPENAI_API_KEY"] = update.openai_api_key
        settings.OPENAI_API_KEY = update.openai_api_key
    return {"message": "API keys updated (runtime only)"}


# -- Test Chat -------------------------------------------------------------

@router.post("/test-chat")
async def test_chat(
    body: TestChatRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Send a chat request simulating a specific role. Non-streaming response."""
    from .introducer import _build_system_prompt

    role = body.role.upper()
    system_prompt = await _build_system_prompt(db, role, body.messages[-1]["content"] if body.messages else "")

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="Anthropic API key not configured")

    result = await db.execute(
        select(AIAgentConfig).where(AIAgentConfig.role == role)
    )
    config = result.scalar_one_or_none()

    import httpx as httpx_lib
    async with httpx_lib.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": config.model if config else "claude-sonnet-4-20250514",
                "max_tokens": config.max_tokens if config else 2048,
                "system": system_prompt,
                "messages": body.messages,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Claude API error: {resp.status_code}")

    data = resp.json()
    text_content = ""
    for block in data.get("content", []):
        if block.get("type") == "text":
            text_content += block.get("text", "")

    return {
        "role": role,
        "response": text_content,
        "model": data.get("model"),
        "usage": data.get("usage"),
    }


@router.post("/dual-chat")
async def dual_chat(
    body: DualChatRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Send same message to both INTRODUCER and ADMIN configs, return both responses."""
    import asyncio

    async def _chat_for_role(role: str):
        req = TestChatRequest(messages=body.messages, role=role)
        return await test_chat(req, db, _)

    introducer_resp, admin_resp = await asyncio.gather(
        _chat_for_role("INTRODUCER"),
        _chat_for_role("ADMIN"),
    )
    return {"introducer": introducer_resp, "admin": admin_resp}


# -- Helpers ---------------------------------------------------------------

def _mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return key[:8] + "..." + "****"


async def _ingest_background(source_id: str) -> None:
    """Run ingestion in background task with its own DB session."""
    from ...core.database import AsyncSessionLocal
    from ...services.ai_knowledge_service import ingest_source

    async with AsyncSessionLocal() as db:
        try:
            await ingest_source(db, source_id)
        except Exception as e:
            logger.error("Background ingest failed for %s: %s", source_id, e)
