"""RAG pipeline: ingest documents, chunk text, embed via OpenAI, retrieve via pgvector."""
import hashlib
import logging
from datetime import datetime, timezone
import httpx
import tiktoken
from openai import AsyncOpenAI
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..models.ai_agent import AIKnowledgeChunk, AIKnowledgeSource

logger = logging.getLogger(__name__)

# -- Constants -------------------------------------------------------------
CHUNK_SIZE = 500       # tokens
CHUNK_OVERLAP = 100    # tokens
TOP_K = 5
SIMILARITY_THRESHOLD = 0.7
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536

_enc = tiktoken.get_encoding("cl100k_base")


# -- Text Extraction -------------------------------------------------------
async def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using pdfplumber."""
    import pdfplumber
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                pages.append(page_text)
    return "\n\n".join(pages)


async def extract_text_from_url(url: str) -> str:
    """Fetch and extract text from a URL."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content = resp.text
        if "<html" in content.lower() or "<body" in content.lower():
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            content = soup.get_text(separator=" ", strip=True)
        return content


# -- Chunking --------------------------------------------------------------
def chunk_text(raw_text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[dict]:
    """Split text into overlapping chunks at sentence boundaries."""
    tokens = _enc.encode(raw_text)
    chunks = []
    start = 0

    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_str = _enc.decode(chunk_tokens)

        # Try to end at a sentence boundary
        if end < len(tokens):
            last_period = chunk_text_str.rfind(".")
            last_newline = chunk_text_str.rfind("\n")
            boundary = max(last_period, last_newline)
            if boundary > len(chunk_text_str) * 0.5:
                chunk_text_str = chunk_text_str[: boundary + 1]

        token_count = len(_enc.encode(chunk_text_str))
        chunks.append({
            "content": chunk_text_str.strip(),
            "token_count": token_count,
            "chunk_index": len(chunks),
        })

        start += chunk_size - overlap

    return chunks


# -- Embedding -------------------------------------------------------------
def _get_openai_client() -> AsyncOpenAI:
    """Get OpenAI client with the configured API key."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    return AsyncOpenAI(api_key=api_key)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts using OpenAI text-embedding-3-small."""
    client = _get_openai_client()
    embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i : i + 100]
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )
        embeddings.extend([item.embedding for item in response.data])
    return embeddings


async def embed_query(query: str) -> list[float]:
    """Embed a single query text."""
    result = await embed_texts([query])
    return result[0]


# -- Ingest Pipeline -------------------------------------------------------
async def ingest_source(db: AsyncSession, source_id: str) -> None:
    """Full ingest pipeline: extract text, chunk, embed, store."""
    result = await db.execute(
        select(AIKnowledgeSource).where(AIKnowledgeSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise ValueError(f"Source {source_id} not found")

    try:
        source.status = "indexing"
        source.error_message = None
        await db.commit()

        # 1. Extract text
        if source.source_type == "pdf":
            raw_text = await extract_text_from_pdf(source.file_path)
        elif source.source_type == "url":
            raw_text = await extract_text_from_url(source.url)
        elif source.source_type in ("text", "app_content"):
            raw_text = source.file_path or ""
        else:
            raise ValueError(f"Unknown source type: {source.source_type}")

        if not raw_text.strip():
            raise ValueError("No text extracted from source")

        # 2. Content hash for change detection
        content_hash = hashlib.sha256(raw_text.encode()).hexdigest()

        # 3. Delete existing chunks
        await db.execute(
            delete(AIKnowledgeChunk).where(AIKnowledgeChunk.source_id == source.id)
        )

        # 4. Chunk text
        chunks = chunk_text(raw_text)
        if not chunks:
            raise ValueError("No chunks generated")

        # 5. Embed all chunks
        chunk_texts = [c["content"] for c in chunks]
        embeddings = await embed_texts(chunk_texts)

        # 6. Store chunks with embeddings
        for chunk_data, embedding in zip(chunks, embeddings):
            chunk = AIKnowledgeChunk(
                source_id=source.id,
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"],
                token_count=chunk_data["token_count"],
                embedding=embedding,
                metadata_={},
            )
            db.add(chunk)

        # 7. Update source
        source.content_hash = content_hash
        source.chunk_count = len(chunks)
        source.status = "indexed"
        source.indexed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("Indexed source %s: %d chunks", source.name, len(chunks))

    except Exception as e:
        await db.rollback()
        result = await db.execute(
            select(AIKnowledgeSource).where(AIKnowledgeSource.id == source_id)
        )
        source = result.scalar_one_or_none()
        if source:
            source.status = "error"
            source.error_message = str(e)[:500]
            await db.commit()
        logger.error("Failed to ingest source %s: %s", source_id, e)
        raise


# -- Retrieval -------------------------------------------------------------
async def retrieve_relevant_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = TOP_K,
    threshold: float = SIMILARITY_THRESHOLD,
) -> list[dict]:
    """Embed query and retrieve top-K similar chunks via pgvector."""
    query_embedding = await embed_query(query)

    max_distance = 1.0 - threshold
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    result = await db.execute(
        text("""
            SELECT c.id, c.content, c.token_count, c.chunk_index,
                   s.name as source_name,
                   1 - (c.embedding <=> :embedding::vector) as similarity
            FROM ai_knowledge_chunk c
            JOIN ai_knowledge_source s ON c.source_id = s.id
            WHERE s.status = 'indexed'
              AND (c.embedding <=> :embedding::vector) < :max_distance
            ORDER BY c.embedding <=> :embedding::vector
            LIMIT :limit
        """),
        {
            "embedding": embedding_str,
            "max_distance": max_distance,
            "limit": top_k,
        },
    )

    rows = result.fetchall()
    return [
        {
            "id": str(row.id),
            "content": row.content,
            "token_count": row.token_count,
            "chunk_index": row.chunk_index,
            "source_name": row.source_name,
            "similarity": round(row.similarity, 4),
        }
        for row in rows
    ]
