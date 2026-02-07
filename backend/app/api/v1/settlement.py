"""
Settlement API Router

Endpoints for managing and viewing settlement batches.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import (
    SettlementStatus,
    SettlementType,
    User,
)
from ...services.settlement_monitoring import SettlementMonitoring
from ...services.settlement_service import (
    calculate_settlement_progress,
    get_pending_settlements,
    get_settlement_timeline,
)

router = APIRouter(prefix="/settlement", tags=["Settlement"])


@router.get("/pending")
async def get_my_pending_settlements(
    settlement_type: Optional[SettlementType] = Query(  # noqa: B008
        None, description="Filter by settlement type (CEA_PURCHASE, SWAP_CEA_TO_EUA)"
    ),
    status_filter: Optional[SettlementStatus] = Query(  # noqa: B008
        None,
        description=(
            "Filter by status (PENDING, TRANSFER_INITIATED, "
            "IN_TRANSIT, AT_CUSTODY, SETTLED, FAILED)"
        ),
    ),
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get pending settlements for the current user's entity.

    Returns list of settlement batches with their current status and progress
    percentage. Settlements represent T+N external registry transfers for
    CEA purchases and swaps.

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
    - PENDING (0%) -> TRANSFER_INITIATED (25%) -> IN_TRANSIT (50%)
      -> AT_CUSTODY (75%) -> SETTLED (100%)
    """
    if not current_user.entity_id:
        return {"data": [], "count": 0}

    settlements = await get_pending_settlements(
        db=db,
        entity_id=current_user.entity_id,
        settlement_type=settlement_type,
        status=status_filter,
    )

    settlement_data = []
    for settlement in settlements:
        progress = calculate_settlement_progress(settlement)
        settlement_data.append(
            {
                "id": str(settlement.id),
                "batch_reference": settlement.batch_reference,
                "settlement_type": settlement.settlement_type.value,
                "status": settlement.status.value,
                "asset_type": settlement.asset_type.value,
                "quantity": int(round(float(settlement.quantity))),
                "price": float(settlement.price),
                "total_value_eur": float(settlement.total_value_eur),
                "expected_settlement_date": (
                    settlement.expected_settlement_date.isoformat()
                ),
                "actual_settlement_date": settlement.actual_settlement_date.isoformat()
                if settlement.actual_settlement_date
                else None,
                "progress_percent": progress,
                "created_at": settlement.created_at.isoformat(),
                "updated_at": settlement.updated_at.isoformat(),
            }
        )

    return {"data": settlement_data, "count": len(settlement_data)}


@router.get("/{settlement_batch_id}")
async def get_settlement_details(
    settlement_batch_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get detailed information about a specific settlement batch.

    Includes full settlement details with complete status history timeline.
    Each timeline entry shows status change, timestamp, notes, and user who
    made the change.

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
            detail="User must be associated with an entity",
        )

    try:
        settlement, history = await get_settlement_timeline(db, settlement_batch_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    # Verify ownership
    if settlement.entity_id != current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this settlement",
        )

    progress = calculate_settlement_progress(settlement)

    timeline = []
    for h in history:
        timeline.append(
            {
                "status": h.status.value,
                "notes": h.notes,
                "created_at": h.created_at.isoformat(),
                "updated_by": str(h.updated_by) if h.updated_by else None,
            }
        )

    return {
        "id": str(settlement.id),
        "batch_reference": settlement.batch_reference,
        "settlement_type": settlement.settlement_type.value,
        "status": settlement.status.value,
        "asset_type": settlement.asset_type.value,
        "quantity": int(round(float(settlement.quantity))),
        "price": float(settlement.price),
        "total_value_eur": float(settlement.total_value_eur),
        "expected_settlement_date": settlement.expected_settlement_date.isoformat(),
        "actual_settlement_date": settlement.actual_settlement_date.isoformat()
        if settlement.actual_settlement_date
        else None,
        "registry_reference": settlement.registry_reference,
        "counterparty_id": str(settlement.counterparty_id)
        if settlement.counterparty_id
        else None,
        "notes": settlement.notes,
        "progress_percent": progress,
        "timeline": timeline,
        "created_at": settlement.created_at.isoformat(),
        "updated_at": settlement.updated_at.isoformat(),
    }


@router.get("/{settlement_batch_id}/timeline")
async def get_settlement_timeline_endpoint(
    settlement_batch_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get settlement timeline with all status changes.

    Returns chronological list of all status updates for a specific settlement
    batch. This is a lightweight endpoint that returns only timeline data
    without full settlement details.

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
            detail="User must be associated with an entity",
        )

    try:
        settlement, history = await get_settlement_timeline(db, settlement_batch_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    # Verify ownership
    if settlement.entity_id != current_user.entity_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this settlement",
        )

    timeline = []
    for h in history:
        timeline.append(
            {
                "status": h.status.value,
                "notes": h.notes,
                "created_at": h.created_at.isoformat(),
                "updated_by": str(h.updated_by) if h.updated_by else None,
            }
        )

    return {
        "settlement_batch_id": str(settlement_batch_id),
        "batch_reference": settlement.batch_reference,
        "current_status": settlement.status.value,
        "expected_settlement_date": settlement.expected_settlement_date.isoformat(),
        "progress_percent": calculate_settlement_progress(settlement),
        "timeline": timeline,
    }


@router.get("/monitoring/metrics")
async def get_settlement_metrics(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get settlement system health metrics (Admin only).

    Returns comprehensive metrics about the settlement system:
    - Counts by status (pending, in progress, settled, failed)
    - Overdue settlements count
    - Total values pending and settled
    - Average settlement time
    - Oldest pending settlement age

    **Authorization:** Requires ADMIN role

    **Response:**
    ```json
    {
      "total_pending": 5,
      "total_in_progress": 3,
      "total_settled_today": 12,
      "total_failed": 0,
      "total_overdue": 1,
      "avg_settlement_time_hours": 72.5,
      "total_value_pending_eur": 45000.00,
      "total_value_settled_today_eur": 128500.00,
      "oldest_pending_days": 2
    }
    ```
    """
    # Verify admin role
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    metrics = await SettlementMonitoring.get_system_metrics(db)

    return {
        "total_pending": metrics.total_pending,
        "total_in_progress": metrics.total_in_progress,
        "total_settled_today": metrics.total_settled_today,
        "total_failed": metrics.total_failed,
        "total_overdue": metrics.total_overdue,
        "avg_settlement_time_hours": metrics.avg_settlement_time_hours,
        "total_value_pending_eur": float(metrics.total_value_pending_eur),
        "total_value_settled_today_eur": float(metrics.total_value_settled_today_eur),
        "oldest_pending_days": metrics.oldest_pending_days,
    }


@router.get("/monitoring/alerts")
async def get_settlement_alerts(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get active settlement alerts (Admin only).

    Returns settlements requiring attention:
    - CRITICAL: Failed settlements
    - ERROR: Critically overdue (3+ days past expected)
    - WARNING: Overdue (1+ days) or stuck in status

    Alerts are sorted by severity (CRITICAL > ERROR > WARNING).

    **Authorization:** Requires ADMIN role

    **Response:**
    ```json
    {
      "alerts": [
        {
          "severity": "ERROR",
          "settlement_id": "123e4567-e89b-12d3-a456-426614174000",
          "batch_reference": "SET-2026-000001-CEA",
          "alert_type": "CRITICALLY_OVERDUE",
          "message": "Settlement 3 days overdue - urgent review required",
          "entity_name": "Test Entity",
          "days_overdue": 3,
          "total_value_eur": 13500.00
        }
      ],
      "count": 1,
      "critical_count": 0,
      "error_count": 1,
      "warning_count": 0
    }
    ```
    """
    # Verify admin role
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    alerts = await SettlementMonitoring.detect_alerts(db)

    return {
        "alerts": [
            {
                "severity": alert.severity,
                "settlement_id": alert.settlement_id,
                "batch_reference": alert.batch_reference,
                "alert_type": alert.alert_type,
                "message": alert.message,
                "entity_name": alert.entity_name,
                "days_overdue": alert.days_overdue,
                "total_value_eur": float(alert.total_value_eur)
                if alert.total_value_eur
                else None,
            }
            for alert in alerts
        ],
        "count": len(alerts),
        "critical_count": len([a for a in alerts if a.severity == "CRITICAL"]),
        "error_count": len([a for a in alerts if a.severity == "ERROR"]),
        "warning_count": len([a for a in alerts if a.severity == "WARNING"]),
    }


@router.get("/monitoring/report")
async def get_daily_report(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get daily settlement system report (Admin only).

    Comprehensive report including:
    - System metrics
    - Active alerts
    - Settlements completed today
    - Performance summary

    **Authorization:** Requires ADMIN role
    """
    # Verify admin role
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    report = await SettlementMonitoring.generate_daily_report(db)
    return report
