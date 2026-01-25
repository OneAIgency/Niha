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
    settlement_type: Optional[SettlementType] = Query(None, description="Filter by settlement type (CEA_PURCHASE, SWAP_CEA_TO_EUA)"),
    status_filter: Optional[SettlementStatus] = Query(None, description="Filter by status (PENDING, TRANSFER_INITIATED, IN_TRANSIT, AT_CUSTODY, SETTLED, FAILED)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending settlements for the current user's entity.

    Returns list of settlement batches with their current status and progress percentage.
    Settlements represent T+N external registry transfers for CEA purchases and swaps.

    **Query Parameters:**
    - `settlement_type` (optional): Filter by CEA_PURCHASE or SWAP_CEA_TO_EUA
    - `status_filter` (optional): Filter by specific settlement status

    **Response:**
    ```json
    {
      "data": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "batch_reference": "SET-2026-000001-CEA",
          "settlement_type": "CEA_PURCHASE",
          "status": "IN_TRANSIT",
          "asset_type": "CEA",
          "quantity": 1000.0,
          "price": 13.50,
          "total_value_eur": 13500.0,
          "expected_settlement_date": "2026-01-28T00:00:00",
          "actual_settlement_date": null,
          "progress_percent": 50,
          "created_at": "2026-01-25T10:00:00",
          "updated_at": "2026-01-26T14:30:00"
        }
      ],
      "count": 1
    }
    ```

    **Status Progression:**
    - PENDING (0%) → TRANSFER_INITIATED (25%) → IN_TRANSIT (50%) → AT_CUSTODY (75%) → SETTLED (100%)
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

    Includes full settlement details with complete status history timeline.
    Each timeline entry shows status change, timestamp, notes, and user who made the change.

    **Path Parameters:**
    - `settlement_batch_id` (UUID): The unique ID of the settlement batch

    **Authorization:**
    - User must own the settlement (settlement.entity_id == current_user.entity_id)
    - Returns 403 Forbidden if user doesn't own the settlement

    **Response:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "batch_reference": "SET-2026-000001-CEA",
      "settlement_type": "CEA_PURCHASE",
      "status": "IN_TRANSIT",
      "asset_type": "CEA",
      "quantity": 1000.0,
      "price": 13.50,
      "total_value_eur": 13500.0,
      "expected_settlement_date": "2026-01-28T00:00:00",
      "actual_settlement_date": null,
      "registry_reference": "REG-CN-2026-12345",
      "counterparty_id": null,
      "counterparty_type": null,
      "notes": "Standard T+3 CEA purchase settlement",
      "progress_percent": 50,
      "timeline": [
        {
          "status": "PENDING",
          "notes": "Settlement batch created - awaiting T+1",
          "created_at": "2026-01-25T10:00:00",
          "updated_by": "user-uuid"
        },
        {
          "status": "TRANSFER_INITIATED",
          "notes": "Automatic status update by settlement processor",
          "created_at": "2026-01-26T10:00:00",
          "updated_by": "system-uuid"
        },
        {
          "status": "IN_TRANSIT",
          "notes": "Automatic status update by settlement processor",
          "created_at": "2026-01-27T10:00:00",
          "updated_by": "system-uuid"
        }
      ],
      "created_at": "2026-01-25T10:00:00",
      "updated_at": "2026-01-27T10:00:00"
    }
    ```

    **Timeline Entries:**
    - Chronological list of all status changes
    - Shows who made each change (user or automated system)
    - Includes notes explaining the reason for each status change
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

    Returns chronological list of all status updates for a specific settlement batch.
    This is a lightweight endpoint that returns only timeline data without full settlement details.

    **Path Parameters:**
    - `settlement_batch_id` (UUID): The unique ID of the settlement batch

    **Authorization:**
    - User must own the settlement (settlement.entity_id == current_user.entity_id)
    - Returns 403 Forbidden if user doesn't own the settlement

    **Response:**
    ```json
    {
      "settlement_batch_id": "123e4567-e89b-12d3-a456-426614174000",
      "batch_reference": "SET-2026-000001-CEA",
      "current_status": "IN_TRANSIT",
      "expected_settlement_date": "2026-01-28T00:00:00",
      "progress_percent": 50,
      "timeline": [
        {
          "status": "PENDING",
          "notes": "Settlement batch created - awaiting T+1",
          "created_at": "2026-01-25T10:00:00",
          "updated_by": "user-uuid-here"
        },
        {
          "status": "TRANSFER_INITIATED",
          "notes": "Automatic status update by settlement processor",
          "created_at": "2026-01-26T10:00:00",
          "updated_by": "system-uuid-here"
        },
        {
          "status": "IN_TRANSIT",
          "notes": "Automatic status update by settlement processor",
          "created_at": "2026-01-27T10:00:00",
          "updated_by": "system-uuid-here"
        }
      ]
    }
    ```

    **Timeline Entry Fields:**
    - `status`: The settlement status at this point in time
    - `notes`: Explanation of the status change (automated or manual)
    - `created_at`: ISO 8601 timestamp of when this status was set
    - `updated_by`: UUID of user/system that triggered this status change

    **Use Cases:**
    - Display settlement progress in UI without loading full details
    - Track audit trail of settlement status changes
    - Monitor automated vs manual status updates
    - Debug settlement progression issues
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
