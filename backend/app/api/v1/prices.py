import asyncio
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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
