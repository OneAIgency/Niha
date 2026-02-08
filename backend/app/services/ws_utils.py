"""
WebSocket Utilities — helpers for broadcasting to entity users.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import User


async def get_entity_user_ids(db: AsyncSession, entity_id: UUID) -> list[UUID]:
    """Get all user IDs for a given entity (for WebSocket broadcasting)."""
    result = await db.execute(select(User.id).where(User.entity_id == entity_id))
    return [row[0] for row in result.all()]
