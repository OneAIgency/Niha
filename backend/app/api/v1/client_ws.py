"""
Client WebSocket – realtime updates for authenticated users (e.g. role_updated on AML→CEA).

- Endpoint: WS /api/v1/client/ws?token=<jwt>
- Manager maps user_id → connections; broadcast_to_users(user_ids, message) for targeted push.
- Used after clear_deposit to notify upgraded users to refetch /users/me.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ...core.security import RedisManager, verify_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/client", tags=["Client Realtime"])


class ClientConnectionManager:
    """Manage WebSocket connections per user for client realtime updates (e.g. role_updated)."""

    def __init__(self):
        # user_id (UUID) -> list of WebSocket connections (one tab may reconnect; we replace or allow multiple)
        self._connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: UUID) -> None:
        if user_id in self._connections:
            conns = self._connections[user_id]
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                del self._connections[user_id]

    async def broadcast_to_users(self, user_ids: List[UUID], message: dict) -> None:
        """Send a JSON message to all connections for the given user IDs."""
        payload = {
            **message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        disconnected: List[tuple] = []
        for uid in user_ids:
            for conn in self._connections.get(uid, []):
                try:
                    await conn.send_json(payload)
                except Exception as e:
                    logger.debug("Client WS broadcast failed for user %s: %s", uid, e)
                    disconnected.append((uid, conn))
        for uid, conn in disconnected:
            self.disconnect(conn, uid)


client_ws_manager = ClientConnectionManager()


@router.websocket("/ws")
async def client_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket for authenticated clients. Query param: token=<jwt>.
    On role_updated (e.g. AML→CEA after clear deposit), client should refetch GET /users/me and update auth.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    if await RedisManager.is_token_blacklisted(token):
        await websocket.close(code=4001, reason="Token invalidated")
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    sub = payload.get("sub")
    if not sub:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    try:
        user_id = UUID(sub) if isinstance(sub, str) else sub
    except (TypeError, ValueError):
        await websocket.close(code=4001, reason="Invalid user id")
        return

    await client_ws_manager.connect(websocket, user_id)

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "message": "Connected to client realtime updates",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        while True:
            await asyncio.sleep(30)
            try:
                await websocket.send_json(
                    {"type": "heartbeat", "timestamp": datetime.now(timezone.utc).isoformat()}
                )
            except Exception:
                break
    except WebSocketDisconnect:
        client_ws_manager.disconnect(websocket, user_id)
    except Exception:
        client_ws_manager.disconnect(websocket, user_id)
