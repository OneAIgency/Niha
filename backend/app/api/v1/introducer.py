"""
Introducer Portal AI Chat Endpoint

POST /api/v1/introducer/chat
- Requires INTRODUCER or ADMIN role
- Streams responses via SSE
- Supports tool_use for page navigation
"""
import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import settings
from ...core.database import get_db
from ...core.security import get_introducer_user
from ...models.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/introducer", tags=["introducer"])


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    language: str = "en"  # 'en' or 'ro'


# Navigation tools the AI can call
TOOLS = [
    {
        "name": "switchToTab",
        "description": "Switch the portal to a specific content tab. Use this when you reference a section so the user can see it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sectionId": {
                    "type": "string",
                    "enum": [
                        "overview", "mechanism", "markets", "advantages",
                        "legal", "calculator", "resources", "faq",
                    ],
                    "description": "The section to scroll to",
                },
            },
            "required": ["sectionId"],
        },
    },
    {
        "name": "expandAccordion",
        "description": "Expand a specific accordion item to show detailed content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sectionId": {
                    "type": "string",
                    "description": "The accordion group ID (e.g., 'markets-eu', 'legal', 'timing')",
                },
                "itemId": {
                    "type": "string",
                    "description": "The specific accordion item ID to expand",
                },
            },
            "required": ["sectionId", "itemId"],
        },
    },
    {
        "name": "setActiveTab",
        "description": "Switch to a specific tab in a tabbed section.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sectionId": {
                    "type": "string",
                    "description": "The tabbed section ID (e.g., 'markets', 'faq')",
                },
                "tabId": {
                    "type": "string",
                    "description": "The tab to switch to (e.g., 'eu-ets', 'china-ets', 'comparison')",
                },
            },
            "required": ["sectionId", "tabId"],
        },
    },
    {
        "name": "highlightSection",
        "description": "Briefly highlight a section with a visual pulse to draw attention.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sectionId": {
                    "type": "string",
                    "description": "The section ID to highlight",
                },
            },
            "required": ["sectionId"],
        },
    },
]

SYSTEM_PROMPT = """You are a carbon markets specialist assistant for NIHA Group's introducer portal. Your role is to help business introducers understand the NIHA carbon trading platform so they can confidently present it to their clients.

## YOUR IDENTITY
- Name: NIHA Carbon Specialist
- Tone: Professional, knowledgeable, approachable — like a senior colleague briefing a partner
- You speak with authority on carbon markets but acknowledge uncertainty when appropriate
- Default language: English. If the user writes in Romanian, respond in Romanian.

## NAVIGATION
You have tools to navigate the portal page. When you reference content that exists on the page, USE the tools to scroll there, expand the relevant accordion, or switch to the right tab. This creates a seamless experience where your answers are linked to visual content.

## NIHA BUSINESS MODEL

NIHA Group (Hong Kong) operates the only cross-border bridge between the EU ETS and the China ETS:
1. EU entities need EUA for compliance but pay market price (~€81/tonne)
2. Chinese entities have CEA priced at ¥80-100 (~€9-11/tonne) — a 7-10× price gap
3. NIHA sources CEA bilaterally, executes CEA→EUA swap
4. Result: EU entities receive EUA at 8-12% discount

Hong Kong is the ONLY jurisdiction with simultaneous access to China's carbon markets (GBA), EU ETS, NRA-RMB banking, and Core Climate Exchange.

## KEY METRICS
| Metric | EU ETS | China ETS |
|--------|--------|-----------|
| Spot price | €81/t | ~€9-11/t |
| Daily volume | €3B+ | €9.5M |
| Bid-ask spread | 2-5 bps | 1-2% |
| Entities | ~10,000 | 3,500+ |
| Settlement | T+2 | T+0 (restricted) |

NIHA: 8-12% savings, T+0 settlement, 24/7, zero market impact.

## THREE CLIENT PATHS
- Path A (EU Entity): Deposits EUR → NIHA sources CEA → swap → receives EUA at 8-12% discount
- Path B (Chinese Entity): Sells CEA to NIHA → receives EUR at 5-8% above domestic exchange
- Path C (Non-EU Swap): Deposits EUA → atomic swap → receives CEA, no FX conversion

## LEGAL FRAMEWORK
- China's national ETS closed to foreign entities (State Council regulation)
- HK's Greater Bay Area gives access to Shenzhen pilot market
- NIHA must hold CEA in custody (registry accounts require Chinese entity)
- Singapore/Dubai/London cannot replicate — no GBA access

## WHY 2026
1. EU CBAM full effect — importers buy CBAM certificates
2. EUA free allocation drops 8% — "Fit for 55"
3. China ETS expanded: steel, cement, aluminium added (3,500+ entities)
4. Arbitrage window closing: 7-10× gap compressing to ~5× by 2030

## RISKS
1. Regulatory: HK structure uses legal pathways, no grey area
2. Counterparty: Escrow + staged settlement
3. FX: T+0 minimizes exposure; hedging available
4. Convergence: Early movers capture widest gap

## COMMUNICATION GUIDELINES
- Cite specific numbers, not vague claims
- Acknowledge risks before presenting mitigations
- For beginners: "Think of NIHA like a foreign exchange desk, but for carbon certificates"
- Never hallucinate regulatory details — say "I'd recommend checking with the legal team"
"""

# Keep original prompt as fallback
_DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPT


async def _build_system_prompt(db: AsyncSession, role: str, last_message: str) -> str:
    """Build system prompt from DB config + RAG knowledge chunks."""
    from ...models.ai_agent import AIAgentConfig

    result = await db.execute(
        select(AIAgentConfig).where(AIAgentConfig.role == role)
    )
    config = result.scalar_one_or_none()

    base_prompt = config.system_prompt if config and config.system_prompt else _DEFAULT_SYSTEM_PROMPT

    # Try RAG retrieval (graceful failure if OpenAI not configured)
    knowledge_section = ""
    try:
        from ...services.ai_knowledge_service import retrieve_relevant_chunks
        chunks = await retrieve_relevant_chunks(db, last_message)
        if chunks:
            knowledge_section = "\n\n## Relevant Knowledge\n"
            for c in chunks:
                knowledge_section += f"\n[Source: {c['source_name']}]\n{c['content']}\n"
    except Exception as e:
        logger.warning("RAG retrieval skipped: %s", e)

    restrictions = ""
    if config and not config.allow_internet:
        restrictions += "\nDo not cite external sources or URLs you haven't been given."
    if config and not config.allow_off_knowledge:
        restrictions += "\nOnly answer from the provided knowledge and your training data about carbon markets."

    return base_prompt + knowledge_section + restrictions


@router.post("/chat")
async def introducer_chat(
    request: ChatRequest,
    current_user: User = Depends(get_introducer_user),
    db: AsyncSession = Depends(get_db),
):
    """AI chat endpoint for introducer portal. Streams responses via SSE."""
    from ...models.ai_agent import AIAgentConfig

    # Determine role
    role = "ADMIN" if current_user.role and current_user.role.value == "ADMIN" else "INTRODUCER"

    # Load config
    result = await db.execute(
        select(AIAgentConfig).where(AIAgentConfig.role == role)
    )
    config = result.scalar_one_or_none()

    if config and not config.enabled:
        raise HTTPException(status_code=403, detail="AI agent is disabled for your role")

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    model = config.model if config else "claude-sonnet-4-20250514"
    max_tokens = config.max_tokens if config else 2048
    temperature = config.temperature if config else 0.7

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    # Build system prompt with RAG
    last_user_msg = ""
    for m in reversed(request.messages):
        if m.role == "user":
            last_user_msg = m.content
            break

    system_prompt = await _build_system_prompt(db, role, last_user_msg)

    async def event_stream() -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "system": system_prompt,
                        "messages": messages,
                        "tools": TOOLS,
                        "stream": True,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        logger.error("Anthropic API error: %s - %s", response.status_code, error_body)
                        yield f"data: {json.dumps({'type': 'error', 'error': 'AI service error'})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                            break
                        try:
                            event = json.loads(data)
                            event_type = event.get("type", "")

                            if event_type == "content_block_start":
                                block = event.get("content_block", {})
                                if block.get("type") == "tool_use":
                                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': block.get('name'), 'id': block.get('id')})}\n\n"

                            elif event_type == "content_block_delta":
                                delta = event.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    yield f"data: {json.dumps({'type': 'text', 'text': delta.get('text', '')})}\n\n"
                                elif delta.get("type") == "input_json_delta":
                                    yield f"data: {json.dumps({'type': 'tool_input', 'partial_json': delta.get('partial_json', '')})}\n\n"

                            elif event_type == "content_block_stop":
                                yield f"data: {json.dumps({'type': 'block_stop'})}\n\n"

                            elif event_type == "message_stop":
                                yield f"data: {json.dumps({'type': 'done'})}\n\n"

                        except json.JSONDecodeError:
                            continue

            except httpx.TimeoutException:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Request timed out'})}\n\n"
            except Exception as e:
                logger.error("Chat stream error: %s", e)
                yield f"data: {json.dumps({'type': 'error', 'error': 'Internal error'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
