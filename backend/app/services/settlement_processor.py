"""
Settlement Processor

Background job that processes settlement batches and updates their status
according to the settlement timeline (T+1, T+2, T+3, T+5).
"""
from datetime import datetime, timedelta
from typing import List
from uuid import UUID
import logging

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    SettlementBatch, SettlementStatusHistory, SettlementStatus, SettlementType, AssetType
)
from .settlement_service import update_settlement_status, finalize_settlement

logger = logging.getLogger(__name__)


async def process_settlement_batches(db: AsyncSession) -> dict:
    """
    Process all pending settlement batches and update their status based on timeline.
    
    This function should be called periodically (e.g., hourly) to progress settlements.
    
    Returns:
        dict with processing statistics
    """
    stats = {
        "processed": 0,
        "updated": 0,
        "finalized": 0,
        "errors": 0
    }
    
    # Get all pending settlements
    pending_query = select(SettlementBatch).where(
        SettlementBatch.status.in_([
            SettlementStatus.PENDING,
            SettlementStatus.TRANSFER_INITIATED,
            SettlementStatus.IN_TRANSIT,
            SettlementStatus.AT_CUSTODY
        ])
    )
    
    result = await db.execute(pending_query)
    pending_settlements = result.scalars().all()
    
    stats["processed"] = len(pending_settlements)
    
    now = datetime.utcnow()
    
    for settlement in pending_settlements:
        # Process each settlement with error isolation
        # Note: update_settlement_status handles its own commits, so errors are isolated per settlement
        try:
            days_since_order = (now - settlement.created_at).days
            expected_status = _calculate_expected_status(settlement, days_since_order)
            
            # Only update if status should change
            if expected_status != settlement.status:
                await update_settlement_status(
                    db=db,
                    settlement_batch_id=settlement.id,
                    new_status=expected_status,
                    notes=f"Status automatically updated based on timeline (T+{days_since_order})",
                    send_email=True  # Send email notifications for automatic updates
                )
                stats["updated"] += 1
                
                # If status is SETTLED, finalize will be called automatically
                if expected_status == SettlementStatus.SETTLED:
                    stats["finalized"] += 1
                    
                logger.info(
                    f"Updated settlement {settlement.batch_reference} "
                    f"from {settlement.status.value} to {expected_status.value} (T+{days_since_order})"
                )
        except Exception as e:
            # Error is logged, but we continue processing other settlements
            # update_settlement_status handles its own transaction, so failures don't affect others
            logger.error(f"Error processing settlement {settlement.batch_reference}: {e}", exc_info=True)
            stats["errors"] += 1
    
    return stats


def _calculate_expected_status(settlement: SettlementBatch, days_since_order: int) -> SettlementStatus:
    """
    Calculate expected status based on settlement type and days since order.
    
    CEA Purchase timeline:
    - T+0: PENDING
    - T+1: TRANSFER_INITIATED
    - T+2: IN_TRANSIT
    - T+3: AT_CUSTODY → SETTLED
    
    Swap CEA Outbound timeline:
    - T+0: PENDING
    - T+1: TRANSFER_INITIATED
    - T+2: AT_CUSTODY → SETTLED
    
    Swap EUA Inbound timeline:
    - T+0: PENDING
    - T+2: TRANSFER_INITIATED
    - T+3: AT_CUSTODY
    - T+5: SETTLED
    """
    if settlement.settlement_type == SettlementType.CEA_PURCHASE:
        if days_since_order >= 3:
            if settlement.status == SettlementStatus.AT_CUSTODY:
                return SettlementStatus.SETTLED
            elif settlement.status in [SettlementStatus.PENDING, SettlementStatus.TRANSFER_INITIATED, SettlementStatus.IN_TRANSIT]:
                return SettlementStatus.AT_CUSTODY
        elif days_since_order >= 2:
            if settlement.status in [SettlementStatus.PENDING, SettlementStatus.TRANSFER_INITIATED]:
                return SettlementStatus.IN_TRANSIT
        elif days_since_order >= 1:
            if settlement.status == SettlementStatus.PENDING:
                return SettlementStatus.TRANSFER_INITIATED
    
    elif settlement.settlement_type == SettlementType.SWAP_CEA_TO_EUA:
        if settlement.asset_type == AssetType.CEA:
            # CEA outbound: T+2
            if days_since_order >= 2:
                if settlement.status == SettlementStatus.AT_CUSTODY:
                    return SettlementStatus.SETTLED
                elif settlement.status in [SettlementStatus.PENDING, SettlementStatus.TRANSFER_INITIATED, SettlementStatus.IN_TRANSIT]:
                    return SettlementStatus.AT_CUSTODY
            elif days_since_order >= 1:
                if settlement.status == SettlementStatus.PENDING:
                    return SettlementStatus.TRANSFER_INITIATED
        
        elif settlement.asset_type == AssetType.EUA:
            # EUA inbound: T+5
            if days_since_order >= 5:
                if settlement.status == SettlementStatus.AT_CUSTODY:
                    return SettlementStatus.SETTLED
                elif settlement.status in [SettlementStatus.PENDING, SettlementStatus.TRANSFER_INITIATED, SettlementStatus.IN_TRANSIT]:
                    return SettlementStatus.AT_CUSTODY
            elif days_since_order >= 3:
                if settlement.status in [SettlementStatus.PENDING, SettlementStatus.TRANSFER_INITIATED]:
                    return SettlementStatus.AT_CUSTODY
            elif days_since_order >= 2:
                if settlement.status == SettlementStatus.PENDING:
                    return SettlementStatus.TRANSFER_INITIATED
    
    # No change needed
    return settlement.status


async def check_settlement_overdue(db: AsyncSession) -> List[SettlementBatch]:
    """
    Check for settlements that are overdue (past expected settlement date).
    
    Returns:
        List of overdue settlement batches
    """
    now = datetime.utcnow()
    
    overdue_query = select(SettlementBatch).where(
        and_(
            SettlementBatch.expected_settlement_date < now,
            SettlementBatch.status != SettlementStatus.SETTLED,
            SettlementBatch.status != SettlementStatus.FAILED
        )
    )
    
    result = await db.execute(overdue_query)
    overdue = list(result.scalars().all())
    
    if overdue:
        logger.warning(f"Found {len(overdue)} overdue settlements")
        for settlement in overdue:
            days_overdue = (now - settlement.expected_settlement_date).days
            logger.warning(
                f"Settlement {settlement.batch_reference} is {days_overdue} days overdue "
                f"(expected: {settlement.expected_settlement_date}, status: {settlement.status.value})"
            )
    
    return overdue


async def run_settlement_processor(db: AsyncSession) -> dict:
    """
    Main function to run settlement processor.
    
    This should be called periodically (e.g., hourly) as a background task.
    
    Returns:
        dict with processing statistics
    """
    logger.info("Starting settlement processor...")
    
    # Process pending settlements
    stats = await process_settlement_batches(db)
    
    # Check for overdue settlements
    overdue = await check_settlement_overdue(db)
    stats["overdue"] = len(overdue)
    
    logger.info(
        f"Settlement processor completed: "
        f"processed={stats['processed']}, updated={stats['updated']}, "
        f"finalized={stats['finalized']}, errors={stats['errors']}, overdue={stats['overdue']}"
    )
    
    return stats
