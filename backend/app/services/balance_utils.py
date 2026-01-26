"""
Balance Utilities

Shared utilities for entity balance management.
Moved from order_matching to avoid circular imports.
"""
from decimal import Decimal
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    EntityHolding, AssetTransaction, AssetType, TransactionType
)

logger = __import__('logging').getLogger(__name__)


async def get_entity_balance(
    db: AsyncSession,
    entity_id: UUID,
    asset_type: AssetType
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
                EntityHolding.asset_type == asset_type
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
    notes: Optional[str] = None
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
                EntityHolding.asset_type == asset_type
            )
        )
    )
    holding = result.scalar_one_or_none()

    balance_before = Decimal(str(holding.quantity)) if holding else Decimal("0")
    balance_after = balance_before + amount

    if holding:
        holding.quantity = balance_after
        holding.updated_at = datetime.utcnow()
    else:
        # Create new holding
        holding = EntityHolding(
            entity_id=entity_id,
            asset_type=asset_type,
            quantity=balance_after
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
        created_by=created_by
    )
    db.add(transaction)

    return balance_after
