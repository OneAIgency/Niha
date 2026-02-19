import asyncio
from decimal import Decimal
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import AlertDirection, CertificateType, PriceAlert, User
from ...services.price_scraper import price_scraper

router = APIRouter(prefix="/prices", tags=["Prices"])


class ConnectionManager:
    """Manage WebSocket connections for live price updates"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@router.get("/current")
async def get_current_prices():
    """
    Get current carbon credit prices for EUA and CEA.
    Returns prices in native currency and USD equivalent.
    """
    prices = await price_scraper.get_current_prices()
    return prices


@router.get("/history")
async def get_price_history(hours: int = 24):
    """
    Get historical price data for charts.
    Both EUA and CEA prices are returned in EUR for proper comparison.
    """
    return await price_scraper.get_price_trend_async(hours)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time price updates.
    Broadcasts price updates every 30 seconds.
    """
    await manager.connect(websocket)

    try:
        # Send initial prices
        prices = await price_scraper.get_current_prices()
        await websocket.send_json(prices)

        # Keep connection alive and send updates
        while True:
            await asyncio.sleep(30)  # Update every 30 seconds
            prices = await price_scraper.get_current_prices()
            await websocket.send_json(prices)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ==================== Price Alerts ====================


class CreateAlertRequest(BaseModel):
    certificate_type: str = Field(..., pattern="^(EUA|CEA)$")
    direction: str = Field(..., pattern="^(ABOVE|BELOW)$")
    target_price: float = Field(..., gt=0)


MAX_ACTIVE_ALERTS = 10


@router.get("/alerts")
async def list_alerts(
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """List all price alerts for the current user."""
    result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
    )
    alerts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "certificateType": a.certificate_type.value,
            "direction": a.direction.value,
            "targetPrice": float(a.target_price),
            "isActive": a.is_active,
            "triggeredAt": a.triggered_at.isoformat() + "Z" if a.triggered_at else None,
            "createdAt": a.created_at.isoformat() + "Z" if a.created_at else None,
        }
        for a in alerts
    ]


@router.post("/alerts", status_code=201)
async def create_alert(
    body: CreateAlertRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Create a new price alert."""
    # Limit active alerts per user
    count_result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user.id, PriceAlert.is_active.is_(True))
    )
    active_count = len(count_result.scalars().all())
    if active_count >= MAX_ACTIVE_ALERTS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_ACTIVE_ALERTS} active alerts allowed")

    alert = PriceAlert(
        user_id=current_user.id,
        certificate_type=CertificateType(body.certificate_type),
        direction=AlertDirection(body.direction),
        target_price=Decimal(str(body.target_price)),
    )
    db.add(alert)
    await db.commit()

    return {
        "id": str(alert.id),
        "certificateType": alert.certificate_type.value,
        "direction": alert.direction.value,
        "targetPrice": float(alert.target_price),
        "isActive": alert.is_active,
        "triggeredAt": None,
        "createdAt": alert.created_at.isoformat() + "Z" if alert.created_at else None,
    }


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Delete a price alert."""
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.id == UUID(alert_id),
            PriceAlert.user_id == current_user.id,
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.delete(alert)
    await db.commit()
    return {"message": "Alert deleted"}
