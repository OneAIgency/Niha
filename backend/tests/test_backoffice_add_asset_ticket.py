"""
Test that add-asset (deposit/withdraw) creates audit tickets with expected action_type, entity_type, tags.
Run from backend container: pytest tests/test_backoffice_add_asset_ticket.py -v
Uses async tests and httpx.AsyncClient so DB and HTTP share the same event loop.
"""

import pytest
import httpx
from httpx import ASGITransport
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.main import app
from app.models.models import Entity, TicketLog


async def _get_first_entity_id() -> str:
    """Return the first entity id from the database (for add-asset tests)."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Entity.id).limit(1))
        row = result.first()
        if not row:
            pytest.skip("No entity in database (run migrations and seed)")
        return str(row[0])


async def _get_latest_ticket_by_action_type(action_type: str) -> TicketLog | None:
    """Return the most recent TicketLog with the given action_type."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TicketLog)
            .where(TicketLog.action_type == action_type)
            .order_by(TicketLog.timestamp.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


@pytest.mark.asyncio
async def test_add_asset_deposit_creates_ticket():
    """POST add-asset (deposit) creates a ticket with ENTITY_ASSET_DEPOSIT, entity_type AssetTransaction, tags."""
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@nihaogroup.com", "password": "Admin123!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        entity_id = await _get_first_entity_id()

        response = await client.post(
            f"/api/v1/backoffice/entities/{entity_id}/add-asset",
            json={
                "asset_type": "EUR",
                "amount": 100,
                "operation": "deposit",
                "notes": "pytest add-asset deposit",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text

    ticket = await _get_latest_ticket_by_action_type("ENTITY_ASSET_DEPOSIT")
    assert ticket is not None
    assert ticket.entity_type == "AssetTransaction"
    assert ticket.entity_id is not None
    assert "entity_asset" in (ticket.tags or [])
    assert "deposit" in (ticket.tags or [])
    assert ticket.after_state is not None
    assert ticket.after_state.get("operation") == "deposit"


@pytest.mark.asyncio
async def test_add_asset_withdrawal_creates_ticket():
    """POST add-asset (withdraw) creates a ticket with ENTITY_ASSET_WITHDRAWAL, entity_type AssetTransaction, tags."""
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@nihaogroup.com", "password": "Admin123!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        entity_id = await _get_first_entity_id()

        dep = await client.post(
            f"/api/v1/backoffice/entities/{entity_id}/add-asset",
            json={
                "asset_type": "EUR",
                "amount": 50,
                "operation": "deposit",
                "notes": "pytest setup for withdrawal test",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert dep.status_code == 200, dep.text

        response = await client.post(
            f"/api/v1/backoffice/entities/{entity_id}/add-asset",
            json={
                "asset_type": "EUR",
                "amount": 50,
                "operation": "withdraw",
                "notes": "pytest add-asset withdraw",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text

    ticket = await _get_latest_ticket_by_action_type("ENTITY_ASSET_WITHDRAWAL")
    assert ticket is not None
    assert ticket.entity_type == "AssetTransaction"
    assert "entity_asset" in (ticket.tags or [])
    assert "withdrawal" in (ticket.tags or [])
    assert ticket.after_state is not None
    assert ticket.after_state.get("operation") == "withdraw"
