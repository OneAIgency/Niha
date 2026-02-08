"""
Balance Utilities

Shared utilities for entity balance management.
Moved from order_matching to avoid circular imports.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import AssetTransaction, AssetType, Entity, EntityHolding, TransactionType

logger = __import__("logging").getLogger(__name__)


async def get_entity_eur_balance(
    db: AsyncSession,
    entity_id: UUID,
    *,
    entity: Optional[Entity] = None,
    eur_holding_quantity: Optional[Decimal] = None,
) -> Decimal:
    """
    Return EUR balance for display/availability across the platform.

    Uses EntityHolding (EUR) as the source of truth.  Falls back to
    Entity.balance_amount ONLY when no EntityHolding row exists at all
    (i.e. for legacy/seeded entities that haven't had their first deposit yet).

    Once an EntityHolding(EUR) row exists (created by a deposit), the holding
    quantity is authoritative — even if it's zero or negative.  This prevents
    the fallback from re-surfacing the seed balance_amount after the user
    spent all their EUR, which would allow double-spending.
    """
    # Fast-path when caller already fetched the holding quantity
    if eur_holding_quantity is not None:
        if eur_holding_quantity > 0:
            return eur_holding_quantity
        # Caller told us the holding exists (they passed a value) — don't fallback
        return Decimal("0")

    # Check if an EntityHolding(EUR) row exists
    result = await db.execute(
        select(EntityHolding).where(
            and_(
                EntityHolding.entity_id == entity_id,
                EntityHolding.asset_type == AssetType.EUR,
            )
        )
    )
    holding = result.scalar_one_or_none()

    if holding is not None:
        # Holding row exists — its quantity is the truth (even if 0 or negative)
        qty = Decimal(str(holding.quantity))
        return qty if qty > 0 else Decimal("0")

    # No holding row at all — fall back to Entity.balance_amount (legacy seed data)
    if entity is not None and entity.balance_amount is not None and entity.balance_amount > 0:
        return Decimal(str(entity.balance_amount))
    ent_result = await db.execute(select(Entity).where(Entity.id == entity_id))
    loaded_entity = ent_result.scalar_one_or_none()
    if loaded_entity and loaded_entity.balance_amount is not None and loaded_entity.balance_amount > 0:
        return Decimal(str(loaded_entity.balance_amount))
    return Decimal("0")


async def get_entity_balance(
    db: AsyncSession, entity_id: UUID, asset_type: AssetType
) -> Decimal:
    """
    Get current entity balance for an asset type.

    Returns:
        Current balance (0 if no holding exists)
    """
    result = await db.execute(
        select(EntityHolding).where(
            and_(
                EntityHolding.entity_id == entity_id,
                EntityHolding.asset_type == asset_type,
            )
        )
    )
    holding = result.scalar_one_or_none()
    return Decimal(str(holding.quantity)) if holding else Decimal("0")


async def update_entity_balance(
    db: AsyncSession,
    entity_id: UUID,
    asset_type: AssetType,
    amount: Decimal,
    transaction_type: TransactionType,
    created_by: UUID,
    reference: Optional[str] = None,
    notes: Optional[str] = None,
) -> Decimal:
    """
    Update entity balance and create audit trail.
    Returns the new balance.
    """
    # Get or create holding record
    result = await db.execute(
        select(EntityHolding).where(
            and_(
                EntityHolding.entity_id == entity_id,
                EntityHolding.asset_type == asset_type,
            )
        )
    )
    holding = result.scalar_one_or_none()

    balance_before = Decimal(str(holding.quantity)) if holding else Decimal("0")
    balance_after = balance_before + amount

    if holding:
        holding.quantity = balance_after
        holding.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    else:
        # Create new holding
        holding = EntityHolding(
            entity_id=entity_id, asset_type=asset_type, quantity=balance_after
        )
        db.add(holding)

    # Create audit trail
    transaction = AssetTransaction(
        entity_id=entity_id,
        asset_type=asset_type,
        transaction_type=transaction_type,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        reference=reference,
        notes=notes,
        created_by=created_by,
    )
    db.add(transaction)

    return balance_after
