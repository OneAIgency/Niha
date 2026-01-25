"""Tests for settlement API endpoints"""
import pytest
import pytest_asyncio
from decimal import Decimal
from datetime import datetime
from httpx import AsyncClient
from app.main import app
from app.core.security import create_access_token
from app.models.models import (
    User, UserRole, Entity, Jurisdiction,
    SettlementBatch, SettlementStatus, SettlementType, CertificateType
)
from app.services.settlement_service import SettlementService


@pytest_asyncio.fixture
async def test_entity(db_session, test_admin_user):
    """Create a test entity"""
    entity = Entity(
        name="Test Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)
    return entity


@pytest_asyncio.fixture
async def test_user_with_entity(db_session, test_entity):
    """Create a test user associated with an entity"""
    user = User(
        email="user@test.com",
        first_name="Test",
        last_name="User",
        password_hash="hashed_password_here",
        role=UserRole.USER,
        is_active=True,
        entity_id=test_entity.id
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def auth_headers(test_user_with_entity):
    """Create authorization headers for test user"""
    token = create_access_token(
        data={"sub": test_user_with_entity.email, "user_id": str(test_user_with_entity.id)}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_pending_settlements_empty(db_session, test_user_with_entity, auth_headers):
    """Test GET /settlement/pending with no settlements"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/settlement/pending", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "count" in data
    assert data["count"] == 0
    assert len(data["data"]) == 0


@pytest.mark.asyncio
async def test_get_pending_settlements_with_data(
    db_session, test_user_with_entity, test_entity, auth_headers
):
    """Test GET /settlement/pending with settlements"""
    # Create settlements
    settlement1 = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    settlement2 = await SettlementService.create_swap_cea_to_eua_settlement(
        db=db_session,
        entity_id=test_entity.id,
        cea_quantity=Decimal("500"),
        eua_quantity=Decimal("500"),
        created_by=test_user_with_entity.id
    )

    # Mark one as settled (should not appear)
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement2.id,
        new_status=SettlementStatus.SETTLED,
        notes="Completed",
        updated_by=test_user_with_entity.id
    )

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/settlement/pending", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1

    # Verify settlement data structure
    settlement_data = data["data"][0]
    assert "id" in settlement_data
    assert "batch_reference" in settlement_data
    assert "settlement_type" in settlement_data
    assert "status" in settlement_data
    assert "asset_type" in settlement_data
    assert "quantity" in settlement_data
    assert "price" in settlement_data
    assert "total_value_eur" in settlement_data
    assert "expected_settlement_date" in settlement_data
    assert "progress_percent" in settlement_data

    assert settlement_data["settlement_type"] == "CEA_PURCHASE"
    assert settlement_data["status"] == "PENDING"
    assert settlement_data["quantity"] == 1000.0
    assert settlement_data["price"] == 13.50
    assert settlement_data["total_value_eur"] == 13500.0
    assert settlement_data["progress_percent"] == 0


@pytest.mark.asyncio
async def test_get_pending_settlements_filter_by_type(
    db_session, test_user_with_entity, test_entity, auth_headers
):
    """Test GET /settlement/pending with settlement_type filter"""
    # Create both types
    await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    await SettlementService.create_swap_cea_to_eua_settlement(
        db=db_session,
        entity_id=test_entity.id,
        cea_quantity=Decimal("500"),
        eua_quantity=Decimal("500"),
        created_by=test_user_with_entity.id
    )

    # Filter for CEA_PURCHASE only
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/settlement/pending?settlement_type=CEA_PURCHASE",
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["settlement_type"] == "CEA_PURCHASE"


@pytest.mark.asyncio
async def test_get_pending_settlements_filter_by_status(
    db_session, test_user_with_entity, test_entity, auth_headers
):
    """Test GET /settlement/pending with status filter"""
    # Create settlements
    settlement1 = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    settlement2 = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("500"),
        price=Decimal("14.00"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    # Update one to IN_TRANSIT
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement2.id,
        new_status=SettlementStatus.IN_TRANSIT,
        notes="In transit",
        updated_by=test_user_with_entity.id
    )

    # Filter for IN_TRANSIT only
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/settlement/pending?status_filter=IN_TRANSIT",
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["status"] == "IN_TRANSIT"


@pytest.mark.asyncio
async def test_get_pending_settlements_no_entity(db_session, test_admin_user):
    """Test GET /settlement/pending for user without entity returns empty"""
    # Create user without entity
    user_no_entity = User(
        email="noentity@test.com",
        first_name="No",
        last_name="Entity",
        password_hash="hashed_password_here",
        role=UserRole.USER,
        is_active=True,
        entity_id=None  # No entity
    )
    db_session.add(user_no_entity)
    await db_session.commit()

    token = create_access_token(
        data={"sub": user_no_entity.email, "user_id": str(user_no_entity.id)}
    )
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/settlement/pending", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


@pytest.mark.asyncio
async def test_get_settlement_details(
    db_session, test_user_with_entity, test_entity, auth_headers
):
    """Test GET /settlement/{id} returns full settlement details"""
    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    # Progress through some statuses
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Transfer started",
        updated_by=test_user_with_entity.id
    )

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/settlement/{settlement.id}",
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.json()

    # Verify structure
    assert data["id"] == str(settlement.id)
    assert data["batch_reference"] == settlement.batch_reference
    assert data["settlement_type"] == "CEA_PURCHASE"
    assert data["status"] == "TRANSFER_INITIATED"
    assert data["asset_type"] == "CEA"
    assert data["quantity"] == 1000.0
    assert data["price"] == 13.50
    assert data["total_value_eur"] == 13500.0
    assert "expected_settlement_date" in data
    assert "progress_percent" in data
    assert "timeline" in data

    # Verify timeline
    assert len(data["timeline"]) == 2  # PENDING + TRANSFER_INITIATED
    assert data["timeline"][0]["status"] == "PENDING"
    assert data["timeline"][1]["status"] == "TRANSFER_INITIATED"
    assert data["timeline"][1]["notes"] == "Transfer started"


@pytest.mark.asyncio
async def test_get_settlement_details_forbidden_other_entity(
    db_session, test_user_with_entity, test_admin_user, auth_headers
):
    """Test GET /settlement/{id} returns 403 for settlement owned by different entity"""
    # Create different entity
    other_entity = Entity(
        name="Other Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(other_entity)
    await db_session.commit()
    await db_session.refresh(other_entity)

    # Create settlement for other entity
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=other_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Try to access with different user's credentials
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/settlement/{settlement.id}",
            headers=auth_headers
        )

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_settlement_details_not_found(db_session, auth_headers):
    """Test GET /settlement/{id} returns 404 for non-existent settlement"""
    from uuid import uuid4

    fake_id = uuid4()

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/settlement/{fake_id}",
            headers=auth_headers
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_settlement_timeline(
    db_session, test_user_with_entity, test_entity, auth_headers
):
    """Test GET /settlement/{id}/timeline returns timeline data"""
    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_user_with_entity.id
    )

    # Progress through statuses
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Transfer started",
        updated_by=test_user_with_entity.id
    )

    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.IN_TRANSIT,
        notes="In transit to registry",
        updated_by=test_user_with_entity.id
    )

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/settlement/{settlement.id}/timeline",
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.json()

    # Verify structure
    assert data["settlement_batch_id"] == str(settlement.id)
    assert data["batch_reference"] == settlement.batch_reference
    assert data["current_status"] == "IN_TRANSIT"
    assert "expected_settlement_date" in data
    assert "progress_percent" in data
    assert "timeline" in data

    # Verify timeline
    assert len(data["timeline"]) == 3
    assert data["timeline"][0]["status"] == "PENDING"
    assert data["timeline"][1]["status"] == "TRANSFER_INITIATED"
    assert data["timeline"][2]["status"] == "IN_TRANSIT"

    # Verify timeline entry structure
    for entry in data["timeline"]:
        assert "status" in entry
        assert "notes" in entry
        assert "created_at" in entry
        assert "updated_by" in entry


@pytest.mark.asyncio
async def test_get_settlement_timeline_forbidden_other_entity(
    db_session, test_user_with_entity, test_admin_user, auth_headers
):
    """Test GET /settlement/{id}/timeline returns 403 for other entity's settlement"""
    # Create different entity
    other_entity = Entity(
        name="Other Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(other_entity)
    await db_session.commit()
    await db_session.refresh(other_entity)

    # Create settlement for other entity
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=other_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Try to access with different user's credentials
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/settlement/{settlement.id}/timeline",
            headers=auth_headers
        )

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_access(db_session):
    """Test all settlement endpoints require authentication"""
    from uuid import uuid4

    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test without auth headers
        response1 = await client.get("/api/v1/settlement/pending")
        assert response1.status_code == 401

        fake_id = uuid4()
        response2 = await client.get(f"/api/v1/settlement/{fake_id}")
        assert response2.status_code == 401

        response3 = await client.get(f"/api/v1/settlement/{fake_id}/timeline")
        assert response3.status_code == 401
