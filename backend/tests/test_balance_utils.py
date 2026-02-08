"""
Unit tests for balance_utils.get_entity_eur_balance.
Run from backend container: pytest tests/test_balance_utils.py -v
"""

import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.models import AssetType, Entity, EntityHolding, Jurisdiction
from app.services.balance_utils import get_entity_eur_balance


@pytest.mark.asyncio
async def test_get_entity_eur_balance_no_holding_fallback_to_balance_amount():
    """When there is no EUR EntityHolding, return Entity.balance_amount if set."""
    entity_id = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        entity = Entity(
            id=entity_id,
            name="Test EUR Fallback",
            jurisdiction=Jurisdiction.OTHER,
            balance_amount=Decimal("3000000.00"),
        )
        db.add(entity)
        await db.flush()

        result = await get_entity_eur_balance(db, entity_id)
        assert result == Decimal("3000000.00")

        await db.rollback()


@pytest.mark.asyncio
async def test_get_entity_eur_balance_holding_zero_fallback_to_balance_amount():
    """When EntityHolding EUR exists but is 0, fall back to Entity.balance_amount."""
    entity_id = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        entity = Entity(
            id=entity_id,
            name="Test EUR Zero Holding",
            jurisdiction=Jurisdiction.OTHER,
            balance_amount=Decimal("1000.50"),
        )
        db.add(entity)
        await db.flush()

        holding = EntityHolding(
            entity_id=entity_id,
            asset_type=AssetType.EUR,
            quantity=Decimal("0"),
        )
        db.add(holding)
        await db.flush()

        result = await get_entity_eur_balance(db, entity_id)
        assert result == Decimal("1000.50")

        await db.rollback()


@pytest.mark.asyncio
async def test_get_entity_eur_balance_holding_takes_precedence():
    """When EntityHolding EUR > 0, return it; do not use Entity.balance_amount."""
    entity_id = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        entity = Entity(
            id=entity_id,
            name="Test EUR Holding Wins",
            jurisdiction=Jurisdiction.OTHER,
            balance_amount=Decimal("999.00"),
        )
        db.add(entity)
        await db.flush()

        holding = EntityHolding(
            entity_id=entity_id,
            asset_type=AssetType.EUR,
            quantity=Decimal("500.25"),
        )
        db.add(holding)
        await db.flush()

        result = await get_entity_eur_balance(db, entity_id)
        assert result == Decimal("500.25")

        await db.rollback()


@pytest.mark.asyncio
async def test_get_entity_eur_balance_entity_missing_returns_zero():
    """When entity_id does not exist, return 0."""
    async with AsyncSessionLocal() as db:
        result = await get_entity_eur_balance(db, uuid.uuid4())
        assert result == Decimal("0")


@pytest.mark.asyncio
async def test_get_entity_eur_balance_no_holding_no_balance_amount_returns_zero():
    """When there is no EUR holding and entity.balance_amount is 0/None, return 0."""
    entity_id = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        entity = Entity(
            id=entity_id,
            name="Test EUR Zero",
            jurisdiction=Jurisdiction.OTHER,
            balance_amount=Decimal("0"),
        )
        db.add(entity)
        await db.flush()

        result = await get_entity_eur_balance(db, entity_id)
        assert result == Decimal("0")

        await db.rollback()
