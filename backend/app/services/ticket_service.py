"""Ticket generation and audit logging service"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import RedisManager
from app.models.models import TicketLog, TicketStatus

logger = logging.getLogger(__name__)


class TicketService:
    """Service for generating ticket IDs and managing audit logs"""

    @staticmethod
    async def generate_ticket_id() -> str:
        """
        Generate unique ticket ID: TKT-YYYY-NNNNNN
        Uses Redis counter for atomic increment
        """
        year = datetime.utcnow().year
        redis = await RedisManager.get_redis()

        # Atomic increment counter for this year
        counter_key = f"ticket_counter:{year}"
        counter = await redis.incr(counter_key)

        # Set expiry on first creation (end of next year)
        if counter == 1:
            await redis.expire(counter_key, 60 * 60 * 24 * 400)  # ~13 months

        ticket_id = f"TKT-{year}-{counter:06d}"
        return ticket_id

    @staticmethod
    async def create_ticket(
        db: AsyncSession,
        action_type: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID],
        status: TicketStatus,
        user_id: Optional[uuid.UUID] = None,
        market_maker_id: Optional[uuid.UUID] = None,
        request_payload: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[uuid.UUID] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        related_ticket_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> TicketLog:
        """Create audit ticket"""
        ticket_id = await TicketService.generate_ticket_id()

        ticket = TicketLog(
            ticket_id=ticket_id,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            market_maker_id=market_maker_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status,
            request_payload=request_payload,
            response_data=response_data,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            before_state=before_state,
            after_state=after_state,
            related_ticket_ids=related_ticket_ids or [],
            tags=tags or [],
        )

        db.add(ticket)
        await db.flush()  # Flush to get ID, but don't commit yet
        await db.refresh(ticket)

        logger.info(f"Created ticket {ticket_id} for {action_type} on {entity_type}")
        return ticket

    @staticmethod
    async def get_entity_state(
        db: AsyncSession, entity_type: str, entity_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """Get current state of entity for before/after tracking"""
        # Import here to avoid circular imports
        from app.models.models import AssetTransaction, MarketMakerClient, Order, User

        model_map = {
            "Order": Order,
            "User": User,
            "MarketMaker": MarketMakerClient,
            "AssetTransaction": AssetTransaction,
        }

        model = model_map.get(entity_type)
        if not model:
            return None

        result = await db.execute(select(model).where(model.id == entity_id))
        entity = result.scalar_one_or_none()

        if not entity:
            return None

        # Convert to dict, excluding relationships
        from decimal import Decimal

        state = {}
        for column in model.__table__.columns:
            value = getattr(entity, column.name)
            # Convert non-serializable types
            if isinstance(value, uuid.UUID):
                state[column.name] = str(value)
            elif isinstance(value, datetime):
                state[column.name] = value.isoformat()
            elif isinstance(value, Decimal):
                state[column.name] = float(value)
            elif hasattr(value, 'value'):  # Enum
                state[column.name] = value.value
            else:
                state[column.name] = value

        return state
