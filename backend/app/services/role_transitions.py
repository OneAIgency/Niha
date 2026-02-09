"""
Role transitions for onboarding flow (0010).

- CEA → CEA_SETTLE: when entity EUR balance reaches 0 (all money spent on CEA).
- CEA_SETTLE → SWAP: when all CEA_PURCHASE settlement batches for entity are SETTLED.
- SWAP → EUA_SETTLE: when entity CEA balance reaches 0 (all CEA swapped).
- EUA_SETTLE → EUA: when all SWAP_CEA_TO_EUA settlement batches for entity are SETTLED.

All transitions push a `role_updated` WebSocket message so the client UI updates
in realtime (refetches GET /users/me and updates the auth store).
"""

import logging
from decimal import Decimal
from typing import List
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    AssetType,
    SettlementBatch,
    SettlementStatus,
    SettlementType,
    User,
    UserRole,
)
from .balance_utils import get_entity_balance

logger = logging.getLogger(__name__)


async def _notify_role_updated(user_ids: List[UUID], new_role: str, entity_id: UUID) -> None:
    """
    Schedule role_updated WebSocket push after a brief delay.

    The delay ensures the DB commit has completed before the client
    refetches GET /users/me (transition functions are called pre-commit).
    """
    if not user_ids:
        return

    import asyncio

    async def _send():
        await asyncio.sleep(0.15)  # 150ms — commit will have completed by now
        try:
            from ..api.v1.client_ws import client_ws_manager

            await client_ws_manager.broadcast_to_users(
                user_ids,
                {"type": "role_updated", "data": {"role": new_role, "entity_id": str(entity_id)}},
            )
            logger.info("WebSocket role_updated sent to %d user(s) → %s", len(user_ids), new_role)
        except Exception as e:
            logger.warning("Failed to send role_updated WS: %s", e)

    asyncio.create_task(_send())


async def _send_transition_emails(users: list, method_name: str) -> None:
    """
    Fire-and-forget email notifications for role transitions.
    Uses lazy import to avoid circular dependency with email_service.
    """
    if not users:
        return

    import asyncio

    async def _send():
        await asyncio.sleep(0.3)  # wait for commit
        try:
            from .email_service import email_service

            send_fn = getattr(email_service, method_name, None)
            if not send_fn:
                logger.warning("Email method %s not found", method_name)
                return
            for u in users:
                try:
                    await send_fn(u.email, first_name=u.first_name or "")
                except Exception as e:
                    logger.warning("Failed to send %s email to %s: %s", method_name, u.email, e)
        except Exception as e:
            logger.warning("Failed to send transition emails (%s): %s", method_name, e)

    asyncio.create_task(_send())


async def transition_cea_to_cea_settle_if_eur_zero(
    db: AsyncSession, entity_id: UUID, eur_balance_after: Decimal
) -> int:
    """
    If entity EUR balance is 0 (or below threshold), set users with role CEA to CEA_SETTLE.
    Call after debiting EUR (e.g. CEA purchase). Returns number of users updated.
    """
    if eur_balance_after > Decimal("0"):
        return 0
    result = await db.execute(
        select(User).where(
            User.entity_id == entity_id,
            User.role == UserRole.CEA,
        )
    )
    users = result.scalars().all()
    for u in users:
        u.role = UserRole.CEA_SETTLE
    if users:
        await db.flush()
        logger.info(
            "Role transition CEA→CEA_SETTLE for entity %s (%s user(s))",
            entity_id,
            len(users),
        )
        await _notify_role_updated([u.id for u in users], "CEA_SETTLE", entity_id)
        await _send_transition_emails(users, "send_cea_settlement_pending")
    return len(users)


async def transition_cea_settle_to_swap_if_all_cea_settled(
    db: AsyncSession, entity_id: UUID
) -> int:
    """
    If all CEA_PURCHASE settlement batches for entity are SETTLED, set CEA_SETTLE → SWAP.
    Call when a CEA batch becomes SETTLED. Returns number of users updated.
    """
    # Count CEA_PURCHASE batches for this entity.
    # Expect at least one: CEA_SETTLE is reached only after CEA purchase, which creates a batch.
    total_result = await db.execute(
        select(func.count(SettlementBatch.id)).where(
            and_(
                SettlementBatch.entity_id == entity_id,
                SettlementBatch.settlement_type == SettlementType.CEA_PURCHASE,
            )
        )
    )
    total = total_result.scalar() or 0
    if total == 0:
        return 0
    settled_result = await db.execute(
        select(func.count(SettlementBatch.id)).where(
            and_(
                SettlementBatch.entity_id == entity_id,
                SettlementBatch.settlement_type == SettlementType.CEA_PURCHASE,
                SettlementBatch.status == SettlementStatus.SETTLED,
            )
        )
    )
    settled = settled_result.scalar() or 0
    if settled < total:
        return 0
    result = await db.execute(
        select(User).where(
            User.entity_id == entity_id,
            User.role == UserRole.CEA_SETTLE,
        )
    )
    users = result.scalars().all()
    for u in users:
        u.role = UserRole.SWAP
    if users:
        await db.flush()
        logger.info(
            "Role transition CEA_SETTLE→SWAP for entity %s (%s user(s))",
            entity_id,
            len(users),
        )
        await _notify_role_updated([u.id for u in users], "SWAP", entity_id)
        await _send_transition_emails(users, "send_swap_access_granted")
    return len(users)


async def transition_swap_to_eua_settle_if_cea_zero(
    db: AsyncSession, entity_id: UUID
) -> int:
    """
    If entity CEA balance is 0, set users with role SWAP to EUA_SETTLE.
    Call after swap completion or when CEA is debited. Returns number of users updated.
    """
    cea_balance = await get_entity_balance(db, entity_id, AssetType.CEA)
    if cea_balance > Decimal("0"):
        return 0
    result = await db.execute(
        select(User).where(
            User.entity_id == entity_id,
            User.role == UserRole.SWAP,
        )
    )
    users = result.scalars().all()
    for u in users:
        u.role = UserRole.EUA_SETTLE
    if users:
        await db.flush()
        logger.info(
            "Role transition SWAP→EUA_SETTLE for entity %s (%s user(s))",
            entity_id,
            len(users),
        )
        await _notify_role_updated([u.id for u in users], "EUA_SETTLE", entity_id)
        await _send_transition_emails(users, "send_eua_settlement_pending")
    return len(users)


async def transition_eua_settle_to_eua_if_all_swap_settled(
    db: AsyncSession, entity_id: UUID
) -> int:
    """
    If all SWAP_CEA_TO_EUA settlement batches for entity are SETTLED, set EUA_SETTLE → EUA.
    Call when a swap batch becomes SETTLED. Returns number of users updated.
    """
    total_result = await db.execute(
        select(func.count(SettlementBatch.id)).where(
            and_(
                SettlementBatch.entity_id == entity_id,
                SettlementBatch.settlement_type == SettlementType.SWAP_CEA_TO_EUA,
            )
        )
    )
    total = total_result.scalar() or 0
    if total == 0:
        return 0
    settled_result = await db.execute(
        select(func.count(SettlementBatch.id)).where(
            and_(
                SettlementBatch.entity_id == entity_id,
                SettlementBatch.settlement_type == SettlementType.SWAP_CEA_TO_EUA,
                SettlementBatch.status == SettlementStatus.SETTLED,
            )
        )
    )
    settled = settled_result.scalar() or 0
    if settled < total:
        return 0
    result = await db.execute(
        select(User).where(
            User.entity_id == entity_id,
            User.role == UserRole.EUA_SETTLE,
        )
    )
    users = result.scalars().all()
    for u in users:
        u.role = UserRole.EUA
    if users:
        await db.flush()
        logger.info(
            "Role transition EUA_SETTLE→EUA for entity %s (%s user(s))",
            entity_id,
            len(users),
        )
        await _notify_role_updated([u.id for u in users], "EUA", entity_id)
        await _send_transition_emails(users, "send_eua_access_granted")
    return len(users)
