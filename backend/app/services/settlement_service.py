"""
Settlement Service

Manages settlement batches for CEA purchases and swaps.
Handles creation, status updates, and finalization of settlements.
"""
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict
from uuid import UUID
import logging

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    SettlementBatch, SettlementStatusHistory, EntityHolding, AssetTransaction,
    SettlementStatus, SettlementType, AssetType, TransactionType, Order, CashMarketTrade, User
)
from .balance_utils import update_entity_balance, get_entity_balance

logger = logging.getLogger(__name__)

# Valid status transitions
VALID_TRANSITIONS: Dict[SettlementStatus, List[SettlementStatus]] = {
    SettlementStatus.PENDING: [SettlementStatus.TRANSFER_INITIATED, SettlementStatus.FAILED],
    SettlementStatus.TRANSFER_INITIATED: [SettlementStatus.IN_TRANSIT, SettlementStatus.FAILED],
    SettlementStatus.IN_TRANSIT: [SettlementStatus.AT_CUSTODY, SettlementStatus.FAILED],
    SettlementStatus.AT_CUSTODY: [SettlementStatus.SETTLED, SettlementStatus.FAILED],
    SettlementStatus.SETTLED: [],  # Terminal state
    SettlementStatus.FAILED: [],  # Terminal state
}

# Settlement progress percentages
SETTLEMENT_PROGRESS_MAP = {
    SettlementStatus.PENDING: 0.0,
    SettlementStatus.TRANSFER_INITIATED: 25.0,
    SettlementStatus.IN_TRANSIT: 50.0,
    SettlementStatus.AT_CUSTODY: 75.0,
    SettlementStatus.SETTLED: 100.0,
    SettlementStatus.FAILED: 0.0,
}


def add_business_days(start_date: datetime, days: int) -> datetime:
    """
    Add business days excluding weekends.
    
    Args:
        start_date: Starting date
        days: Number of business days to add
    
    Returns:
        Date after adding business days
    """
    current = start_date
    added = 0
    while added < days:
        current += timedelta(days=1)
        # Monday=0, Friday=4, Saturday=5, Sunday=6
        if current.weekday() < 5:  # Skip weekends
            added += 1
    return current


async def generate_batch_reference(
    db: AsyncSession,
    settlement_type: SettlementType,
    asset_type: AssetType
) -> str:
    """
    Generate unique batch reference like SET-2026-001234-CEA.
    
    Uses database query to ensure uniqueness by finding the max counter for the year.
    """
    year = datetime.utcnow().year
    prefix = f"SET-{year}-"
    
    # Find the maximum counter for this year
    result = await db.execute(
        select(func.max(SettlementBatch.batch_reference))
        .where(SettlementBatch.batch_reference.like(f"{prefix}%"))
    )
    max_ref = result.scalar_one_or_none()
    
    if max_ref:
        try:
            # Extract counter from reference like "SET-2026-001234-CEA"
            counter = int(max_ref.split('-')[2]) + 1
        except (IndexError, ValueError):
            counter = 1
    else:
        counter = 1
    
    return f"{prefix}{counter:06d}-{asset_type.value}"


def calculate_settlement_date(settlement_type: SettlementType, asset_type: AssetType, order_date: datetime) -> datetime:
    """
    Calculate expected settlement date based on type and asset.
    Uses business days (excludes weekends).
    
    CEA Purchase: T+3 (3 business days)
    Swap CEA Outbound: T+2 (2 business days)
    Swap EUA Inbound: T+5 (5 business days)
    """
    if settlement_type == SettlementType.CEA_PURCHASE:
        # T+3 business days for CEA purchase
        return add_business_days(order_date, 3)
    elif settlement_type == SettlementType.SWAP_CEA_TO_EUA:
        if asset_type == AssetType.CEA:
            # CEA outbound: T+2 business days
            return add_business_days(order_date, 2)
        elif asset_type == AssetType.EUA:
            # EUA inbound: T+5 business days
            return add_business_days(order_date, 5)
    
    # Default: T+3 business days
    return add_business_days(order_date, 3)


async def create_cea_purchase_settlement(
    db: AsyncSession,
    order_id: UUID,
    trade_id: UUID,
    entity_id: UUID,
    quantity: Decimal,
    price: Decimal,
    total_value_eur: Decimal,
    seller_id: Optional[UUID] = None,
    market_maker_id: Optional[UUID] = None,
    order_date: Optional[datetime] = None
) -> UUID:
    """
    Create settlement batch for CEA purchase.
    
    Args:
        db: Database session
        order_id: Order that generated the settlement
        trade_id: Trade record
        entity_id: Buyer entity
        quantity: CEA quantity
        price: Price per unit
        total_value_eur: Total value in EUR
        seller_id: Seller ID (if from seller)
        market_maker_id: Market maker ID (if from market maker)
        order_date: Order creation date (defaults to now)
    
    Returns:
        Settlement batch ID
    """
    if order_date is None:
        order_date = datetime.utcnow()
    
    batch_reference = await generate_batch_reference(db, SettlementType.CEA_PURCHASE, AssetType.CEA)
    expected_settlement_date = calculate_settlement_date(
        SettlementType.CEA_PURCHASE, AssetType.CEA, order_date
    )
    
    settlement_batch = SettlementBatch(
        batch_reference=batch_reference,
        entity_id=entity_id,
        order_id=order_id,
        trade_id=trade_id,
        settlement_type=SettlementType.CEA_PURCHASE,
        status=SettlementStatus.PENDING,
        asset_type=AssetType.CEA,
        quantity=quantity,
        price=price,
        total_value_eur=total_value_eur,
        expected_settlement_date=expected_settlement_date,
        counterparty_id=seller_id or market_maker_id,
        counterparty_type="SELLER" if seller_id else "MARKET_MAKER" if market_maker_id else None
    )
    
    db.add(settlement_batch)
    await db.flush()  # Get the ID
    
    # Create initial status history
    status_history = SettlementStatusHistory(
        settlement_batch_id=settlement_batch.id,
        status=SettlementStatus.PENDING,
        notes="Settlement batch created for CEA purchase"
    )
    db.add(status_history)
    
    # Link settlement to order and trade
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one()
    order.settlement_batch_id = settlement_batch.id
    
    trade_result = await db.execute(select(CashMarketTrade).where(CashMarketTrade.id == trade_id))
    trade = trade_result.scalar_one()
    trade.settlement_batch_id = settlement_batch.id
    
    await db.commit()
    
    # Send confirmation email (non-blocking)
    try:
        from ..models.models import Entity
        from ..services.email_service import email_service
        
        # Get entity and user email
        entity_result = await db.execute(
            select(Entity).where(Entity.id == entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        
        if entity:
            user_result = await db.execute(
                select(User).where(User.entity_id == entity.id).limit(1)
            )
            user = user_result.scalar_one_or_none()
            
            if user and user.email:
                await email_service.send_settlement_confirmation(
                    to_email=user.email,
                    batch_reference=batch_reference,
                    settlement_type="CEA_PURCHASE",
                    asset_type="CEA",
                    quantity=float(quantity),
                    total_value_eur=float(total_value_eur),
                    expected_settlement_date=expected_settlement_date.strftime("%B %d, %Y")
                )
            elif user:
                logger.warning(f"User {user.id} has no email, skipping settlement confirmation")
    except Exception as e:
        logger.error(f"Failed to send settlement confirmation email: {e}", exc_info=True)
        # Don't fail creation if email fails
    
    logger.info(f"Created CEA purchase settlement {batch_reference} for order {order_id}")
    
    return settlement_batch.id


async def create_swap_settlement(
    db: AsyncSession,
    order_id: UUID,
    trade_id: UUID,
    entity_id: UUID,
    cea_quantity: Decimal,
    eua_quantity: Decimal,
    ratio: Decimal,
    market_maker_id: UUID,
    order_date: Optional[datetime] = None
) -> Tuple[UUID, UUID]:
    """
    Create settlement batches for swap CEA→EUA.
    
    Creates two settlement batches:
    1. CEA outbound (sent to counterparty)
    2. EUA inbound (received from counterparty)
    
    Args:
        db: Database session
        order_id: Order that generated the settlement
        trade_id: Trade record
        entity_id: Entity performing swap
        cea_quantity: CEA quantity to send
        eua_quantity: EUA quantity to receive
        ratio: CEA/EUA ratio
        market_maker_id: Market maker counterparty
        order_date: Order creation date (defaults to now)
    
    Returns:
        Tuple of (CEA settlement batch ID, EUA settlement batch ID)
    """
    if order_date is None:
        order_date = datetime.utcnow()
    
    # Get current market prices from price service
    try:
        from ..services.price_scraper import price_scraper
        prices = await price_scraper.get_current_prices()
        cea_price_eur = Decimal(str(prices.get("cea", {}).get("price", 12.96)))
        eua_price_eur = Decimal(str(prices.get("eua", {}).get("price", 87.81)))
    except Exception as e:
        logger.warning(f"Failed to get prices from price service, using defaults: {e}")
        # Fallback to defaults
        cea_price_eur = Decimal("12.96")
        eua_price_eur = Decimal("87.81")
    
    # CEA outbound settlement
    cea_batch_reference = await generate_batch_reference(db, SettlementType.SWAP_CEA_TO_EUA, AssetType.CEA)
    cea_expected_date = calculate_settlement_date(
        SettlementType.SWAP_CEA_TO_EUA, AssetType.CEA, order_date
    )
    
    cea_settlement = SettlementBatch(
        batch_reference=cea_batch_reference,
        entity_id=entity_id,
        order_id=order_id,
        trade_id=trade_id,
        settlement_type=SettlementType.SWAP_CEA_TO_EUA,
        status=SettlementStatus.PENDING,
        asset_type=AssetType.CEA,
        quantity=cea_quantity,
        price=cea_price_eur,
        total_value_eur=cea_quantity * cea_price_eur,
        expected_settlement_date=cea_expected_date,
        counterparty_id=market_maker_id,
        counterparty_type="MARKET_MAKER"
    )
    
    # EUA inbound settlement
    eua_batch_reference = await generate_batch_reference(db, SettlementType.SWAP_CEA_TO_EUA, AssetType.EUA)
    eua_expected_date = calculate_settlement_date(
        SettlementType.SWAP_CEA_TO_EUA, AssetType.EUA, order_date
    )
    
    eua_settlement = SettlementBatch(
        batch_reference=eua_batch_reference,
        entity_id=entity_id,
        order_id=order_id,
        trade_id=trade_id,
        settlement_type=SettlementType.SWAP_CEA_TO_EUA,
        status=SettlementStatus.PENDING,
        asset_type=AssetType.EUA,
        quantity=eua_quantity,
        price=eua_price_eur,
        total_value_eur=eua_quantity * eua_price_eur,
        expected_settlement_date=eua_expected_date,
        counterparty_id=market_maker_id,
        counterparty_type="MARKET_MAKER"
    )
    
    db.add(cea_settlement)
    db.add(eua_settlement)
    await db.flush()  # Get the IDs
    
    # Create initial status history for both
    cea_history = SettlementStatusHistory(
        settlement_batch_id=cea_settlement.id,
        status=SettlementStatus.PENDING,
        notes="CEA outbound settlement created for swap"
    )
    eua_history = SettlementStatusHistory(
        settlement_batch_id=eua_settlement.id,
        status=SettlementStatus.PENDING,
        notes="EUA inbound settlement created for swap"
    )
    
    db.add(cea_history)
    db.add(eua_history)
    
    # Link settlement to order and trade (use CEA settlement as primary)
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one()
    order.settlement_batch_id = cea_settlement.id  # Primary link
    
    trade_result = await db.execute(select(CashMarketTrade).where(CashMarketTrade.id == trade_id))
    trade = trade_result.scalar_one()
    trade.settlement_batch_id = cea_settlement.id  # Primary link
    
    await db.commit()
    
    # Send confirmation email (non-blocking)
    try:
        from ..models.models import Entity
        from ..services.email_service import email_service
        
        # Get entity and user email
        entity_result = await db.execute(
            select(Entity).where(Entity.id == entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        
        if entity:
            user_result = await db.execute(
                select(User).where(User.entity_id == entity.id).limit(1)
            )
            user = user_result.scalar_one_or_none()
            
            if user and user.email:
                # Send email for CEA outbound (primary settlement)
                await email_service.send_settlement_confirmation(
                    to_email=user.email,
                    batch_reference=cea_batch_reference,
                    settlement_type="SWAP_CEA_TO_EUA",
                    asset_type="CEA",
                    quantity=float(cea_quantity),
                    total_value_eur=float(cea_quantity * cea_price_eur),
                    expected_settlement_date=cea_expected_date.strftime("%B %d, %Y")
                )
            elif user:
                logger.warning(f"User {user.id} has no email, skipping swap settlement confirmation")
    except Exception as e:
        logger.error(f"Failed to send swap settlement confirmation email: {e}", exc_info=True)
        # Don't fail creation if email fails
    
    logger.info(f"Created swap settlement: CEA {cea_batch_reference}, EUA {eua_batch_reference} for order {order_id}")
    
    return cea_settlement.id, eua_settlement.id


async def update_settlement_status(
    db: AsyncSession,
    settlement_batch_id: UUID,
    new_status: SettlementStatus,
    notes: Optional[str] = None,
    updated_by: Optional[UUID] = None,
    registry_reference: Optional[str] = None,
    send_email: bool = True
) -> None:
    """
    Update settlement batch status and create history entry.
    
    Validates status transitions and ensures only valid state changes occur.
    
    Args:
        db: Database session
        settlement_batch_id: Settlement batch to update
        new_status: New status
        notes: Optional notes
        updated_by: User who updated (for admin updates)
        registry_reference: Registry reference if available
        send_email: Whether to send email notification
    
    Raises:
        ValueError: If settlement not found or invalid status transition
    """
    result = await db.execute(
        select(SettlementBatch).where(SettlementBatch.id == settlement_batch_id)
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise ValueError(f"Settlement batch {settlement_batch_id} not found")
    
    old_status = settlement.status
    
    # Validate status transition (allow FAILED from any state, SETTLED only from AT_CUSTODY)
    if new_status != SettlementStatus.FAILED:
        if new_status == SettlementStatus.SETTLED:
            # SETTLED can only come from AT_CUSTODY
            if old_status != SettlementStatus.AT_CUSTODY:
                raise ValueError(
                    f"Invalid status transition: {old_status.value} -> {new_status.value}. "
                    f"SETTLED can only be reached from AT_CUSTODY"
                )
        else:
            # Check if transition is valid
            valid_next = VALID_TRANSITIONS.get(old_status, [])
            if new_status not in valid_next:
                raise ValueError(
                    f"Invalid status transition: {old_status.value} -> {new_status.value}. "
                    f"Valid transitions from {old_status.value}: {[s.value for s in valid_next]}"
                )
    
    settlement.status = new_status
    settlement.updated_at = datetime.utcnow()
    
    if registry_reference:
        settlement.registry_reference = registry_reference
    
    # Create status history entry
    history = SettlementStatusHistory(
        settlement_batch_id=settlement_batch_id,
        status=new_status,
        notes=notes or f"Status updated from {old_status.value} to {new_status.value}",
        updated_by=updated_by
    )
    db.add(history)
    
    # If status is SETTLED, finalize the settlement
    if new_status == SettlementStatus.SETTLED:
        await finalize_settlement(db, settlement_batch_id)
    
    await db.commit()
    
    # Send email notification if enabled (non-blocking)
    if send_email:
        try:
            from ..models.models import Entity
            from ..services.email_service import email_service
            
            # Get entity and user email
            entity_result = await db.execute(
                select(Entity).where(Entity.id == settlement.entity_id)
            )
            entity = entity_result.scalar_one_or_none()
            
            if entity:
                # Get first user for entity
                user_result = await db.execute(
                    select(User).where(User.entity_id == entity.id).limit(1)
                )
                user = user_result.scalar_one_or_none()
                
                if user and user.email:
                    progress = calculate_settlement_progress(settlement)
                    
                    if new_status == SettlementStatus.SETTLED:
                        # Send completion email
                        await email_service.send_settlement_completed(
                            to_email=user.email,
                            batch_reference=settlement.batch_reference,
                            asset_type=settlement.asset_type.value,
                            quantity=float(settlement.quantity),
                            total_value_eur=float(settlement.total_value_eur),
                            actual_settlement_date=settlement.actual_settlement_date.strftime("%B %d, %Y") if settlement.actual_settlement_date else ""
                        )
                    else:
                        # Send status update email
                        await email_service.send_settlement_status_update(
                            to_email=user.email,
                            batch_reference=settlement.batch_reference,
                            old_status=old_status.value,
                            new_status=new_status.value,
                            progress_percent=progress,
                            notes=notes
                        )
                elif user:
                    logger.warning(f"User {user.id} has no email, skipping settlement status update email")
        except Exception as e:
            logger.error(f"Failed to send settlement email: {e}", exc_info=True)
            # Don't fail the update if email fails
    
    logger.info(f"Updated settlement {settlement.batch_reference} from {old_status.value} to {new_status.value}")


async def finalize_settlement(
    db: AsyncSession,
    settlement_batch_id: UUID
) -> None:
    """
    Finalize settlement by updating entity holdings.
    
    This is called when status becomes SETTLED.
    
    Args:
        db: Database session
        settlement_batch_id: Settlement batch to finalize
    """
    result = await db.execute(
        select(SettlementBatch).where(SettlementBatch.id == settlement_batch_id)
    )
    settlement = result.scalar_one_or_none()
    
    if not settlement:
        raise ValueError(f"Settlement batch {settlement_batch_id} not found")
    
    if settlement.status != SettlementStatus.SETTLED:
        raise ValueError(f"Settlement {settlement.batch_reference} is not SETTLED (current: {settlement.status.value})")
    
    # Get user_id for audit trail - find user associated with entity
    user_result = await db.execute(
        select(User).where(User.entity_id == settlement.entity_id).limit(1)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise ValueError(f"No user found for entity {settlement.entity_id}")
    
    user_id = user.id
    
    # Update entity holdings based on settlement type
    if settlement.settlement_type == SettlementType.CEA_PURCHASE:
        # Add CEA to entity
        await update_entity_balance(
            db=db,
            entity_id=settlement.entity_id,
            asset_type=AssetType.CEA,
            amount=settlement.quantity,
            transaction_type=TransactionType.TRADE_BUY,
            created_by=user_id,
            reference=settlement.batch_reference,
            notes=f"CEA purchase settlement completed: {settlement.quantity} CEA"
        )
    
    elif settlement.settlement_type == SettlementType.SWAP_CEA_TO_EUA:
        if settlement.asset_type == AssetType.CEA:
            # Deduct CEA from entity (outbound)
            await update_entity_balance(
                db=db,
                entity_id=settlement.entity_id,
                asset_type=AssetType.CEA,
                amount=-settlement.quantity,
                transaction_type=TransactionType.TRADE_SELL,
                created_by=user_id,
                reference=settlement.batch_reference,
                notes=f"Swap CEA outbound settlement completed: {settlement.quantity} CEA"
            )
        elif settlement.asset_type == AssetType.EUA:
            # Add EUA to entity (inbound)
            await update_entity_balance(
                db=db,
                entity_id=settlement.entity_id,
                asset_type=AssetType.EUA,
                amount=settlement.quantity,
                transaction_type=TransactionType.TRADE_BUY,
                created_by=user_id,
                reference=settlement.batch_reference,
                notes=f"Swap EUA inbound settlement completed: {settlement.quantity} EUA"
            )
    
    # Update actual settlement date
    settlement.actual_settlement_date = datetime.utcnow()
    
    await db.commit()
    
    logger.info(f"Finalized settlement {settlement.batch_reference}")


async def get_pending_settlements(
    db: AsyncSession,
    entity_id: Optional[UUID] = None,
    settlement_type: Optional[SettlementType] = None,
    status: Optional[SettlementStatus] = None
) -> List[SettlementBatch]:
    """
    Get pending settlements with optional filters.
    
    Args:
        db: Database session
        entity_id: Filter by entity
        settlement_type: Filter by settlement type
        status: Filter by status (defaults to non-SETTLED)
    
    Returns:
        List of settlement batches
    """
    query = select(SettlementBatch)
    
    conditions = []
    
    if entity_id:
        conditions.append(SettlementBatch.entity_id == entity_id)
    
    if settlement_type:
        conditions.append(SettlementBatch.settlement_type == settlement_type)
    
    if status:
        conditions.append(SettlementBatch.status == status)
    else:
        # Default: exclude SETTLED
        conditions.append(SettlementBatch.status != SettlementStatus.SETTLED)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(SettlementBatch.expected_settlement_date.asc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_settlement_timeline(
    db: AsyncSession,
    settlement_batch_id: UUID
) -> Tuple[SettlementBatch, List[SettlementStatusHistory]]:
    """
    Get settlement batch with full timeline.
    
    Args:
        db: Database session
        settlement_batch_id: Settlement batch ID
    
    Returns:
        Tuple of (settlement batch, status history list)
    """
    settlement_result = await db.execute(
        select(SettlementBatch).where(SettlementBatch.id == settlement_batch_id)
    )
    settlement = settlement_result.scalar_one_or_none()
    
    if not settlement:
        raise ValueError(f"Settlement batch {settlement_batch_id} not found")
    
    history_result = await db.execute(
        select(SettlementStatusHistory)
        .where(SettlementStatusHistory.settlement_batch_id == settlement_batch_id)
        .order_by(SettlementStatusHistory.created_at.asc())
    )
    history = list(history_result.scalars().all())
    
    return settlement, history


def calculate_settlement_progress(settlement: SettlementBatch) -> float:
    """
    Calculate settlement progress percentage (0-100).
    
    Based on status and expected settlement date.
    Returns 95% for overdue settlements to indicate they're almost done.
    """
    base_progress = SETTLEMENT_PROGRESS_MAP.get(settlement.status, 0.0)
    
    # If not settled, add time-based progress
    if settlement.status != SettlementStatus.SETTLED and settlement.status != SettlementStatus.FAILED:
        now = datetime.utcnow()
        if now >= settlement.expected_settlement_date:
            # Overdue, show 95% to indicate almost done
            return 95.0
        else:
            # Calculate days elapsed vs total days
            total_days = (settlement.expected_settlement_date - settlement.created_at).days
            elapsed_days = (now - settlement.created_at).days
            if total_days > 0:
                time_progress = (elapsed_days / total_days) * 25.0  # Max 25% from time
                return min(base_progress + time_progress, 95.0)
    
    return base_progress
