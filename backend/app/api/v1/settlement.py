"""
Settlement API Router

Endpoints for managing and viewing settlement batches.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import User, SettlementBatch, SettlementStatusHistory, SettlementStatus, SettlementType
from ...services.settlement_service import (
    get_pending_settlements, get_settlement_timeline, calculate_settlement_progress
)
from ...schemas.schemas import MessageResponse

router = APIRouter(prefix="/settlement", tags=["Settlement"])


@router.get("/pending")
async def get_my_pending_settlements(
    settlement_type: Optional[SettlementType] = Query(None, description="Filter by settlement type"),
    status_filter: Optional[SettlementStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending settlements for the current user's entity.
    
    Returns list of settlement batches with their current status and progress.
    """
    if not current_user.entity_id:
        return {"data": [], "count": 0}
    
    settlements = await get_pending_settlements(
        db=db,
        entity_id=current_user.entity_id,
        settlement_type=settlement_type,
        status=status_filter
    )
    
    settlement_data = []
    for settlement in settlements:
        progress = calculate_settlement_progress(settlement)
        settlement_data.append({
            "id": str(settlement.id),
            "batch_reference": settlement.batch_reference,
            "settlement_type": settlement.settlement_type.value,
            "status": settlement.status.value,
            "asset_type": settlement.asset_type.value,
            "quantity": float(settlement.quantity),
            "price": float(settlement.price),
            "total_value_eur": float(settlement.total_value_eur),
            "expected_settlement_date": settlement.expected_settlement_date.isoformat(),
            "actual_settlement_date": settlement.actual_settlement_date.isoformat() if settlement.actual_settlement_date else None,
            "progress_percent": progress,
            "created_at": settlement.created_at.isoformat(),
            "updated_at": settlement.updated_at.isoformat(),
        })
    
    return {
        "data": settlement_data,
        "count": len(settlement_data)
    }


@router.get("/{settlement_batch_id}")
async def get_settlement_details(
    settlement_batch_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific settlement batch.
    
    Includes full timeline and status history.
    """
    if not current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be associated with an entity"
        )
    
    settlement, history = await get_settlement_timeline(db, settlement_batch_id)
    
    # Verify ownership
    if settlement.entity_id != current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this settlement"
        )
    
    progress = calculate_settlement_progress(settlement)
    
    timeline = []
    for h in history:
        timeline.append({
            "status": h.status.value,
            "notes": h.notes,
            "created_at": h.created_at.isoformat(),
            "updated_by": str(h.updated_by) if h.updated_by else None,
        })
    
    return {
        "id": str(settlement.id),
        "batch_reference": settlement.batch_reference,
        "settlement_type": settlement.settlement_type.value,
        "status": settlement.status.value,
        "asset_type": settlement.asset_type.value,
        "quantity": float(settlement.quantity),
        "price": float(settlement.price),
        "total_value_eur": float(settlement.total_value_eur),
        "expected_settlement_date": settlement.expected_settlement_date.isoformat(),
        "actual_settlement_date": settlement.actual_settlement_date.isoformat() if settlement.actual_settlement_date else None,
        "registry_reference": settlement.registry_reference,
        "counterparty_id": str(settlement.counterparty_id) if settlement.counterparty_id else None,
        "counterparty_type": settlement.counterparty_type,
        "notes": settlement.notes,
        "progress_percent": progress,
        "timeline": timeline,
        "created_at": settlement.created_at.isoformat(),
        "updated_at": settlement.updated_at.isoformat(),
    }


@router.get("/{settlement_batch_id}/timeline")
async def get_settlement_timeline_endpoint(
    settlement_batch_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get settlement timeline with all status changes.
    
    Returns chronological list of all status updates.
    """
    if not current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be associated with an entity"
        )
    
    settlement, history = await get_settlement_timeline(db, settlement_batch_id)
    
    # Verify ownership
    if settlement.entity_id != current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this settlement"
        )
    
    timeline = []
    for h in history:
        timeline.append({
            "status": h.status.value,
            "notes": h.notes,
            "created_at": h.created_at.isoformat(),
            "updated_by": str(h.updated_by) if h.updated_by else None,
        })
    
    return {
        "settlement_batch_id": str(settlement_batch_id),
        "batch_reference": settlement.batch_reference,
        "current_status": settlement.status.value,
        "expected_settlement_date": settlement.expected_settlement_date.isoformat(),
        "progress_percent": calculate_settlement_progress(settlement),
        "timeline": timeline
    }
