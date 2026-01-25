"""Tests for settlement service"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
from app.services.settlement_service import SettlementService
from app.models.models import (
    User, UserRole, Entity, Jurisdiction, CertificateType,
    SettlementBatch, SettlementStatus, SettlementType
)


@pytest.mark.asyncio
async def test_calculate_business_days_no_weekends(db_session):
    """Test business days calculation with no weekends in between"""
    # Monday to Tuesday (1 business day)
    monday = datetime(2026, 1, 26, 10, 0, 0)  # Monday
    result = SettlementService.calculate_business_days(monday, 1)

    assert result.weekday() == 1  # Tuesday
    assert (result - monday).days == 1


@pytest.mark.asyncio
async def test_calculate_business_days_with_weekend(db_session):
    """Test business days calculation skipping weekend"""
    # Friday to Monday (1 business day, but 3 calendar days)
    friday = datetime(2026, 1, 23, 10, 0, 0)  # Friday
    result = SettlementService.calculate_business_days(friday, 1)

    assert result.weekday() == 0  # Monday
    assert (result - friday).days == 3


@pytest.mark.asyncio
async def test_calculate_business_days_t_plus_3(db_session):
    """Test T+3 calculation for CEA settlements"""
    # Wednesday to following Monday (T+3)
    wednesday = datetime(2026, 1, 28, 10, 0, 0)  # Wednesday
    result = SettlementService.calculate_business_days(wednesday, 3)

    # Should skip weekend: Thu, Fri, Mon
    assert result.weekday() == 0  # Monday
    assert (result - wednesday).days == 4  # 4 calendar days (Thu, Fri, Sat, Sun skipped)


@pytest.mark.asyncio
async def test_generate_batch_reference_unique(db_session, test_admin_user):
    """Test settlement batch reference generation is unique"""
    ref1 = await SettlementService.generate_batch_reference(
        db_session,
        SettlementType.CEA_PURCHASE,
        CertificateType.CEA
    )
    ref2 = await SettlementService.generate_batch_reference(
        db_session,
        SettlementType.CEA_PURCHASE,
        CertificateType.CEA
    )

    assert ref1 != ref2
    assert ref1.startswith("SET-2026-")
    assert ref1.endswith("-CEA")
    assert ref2.startswith("SET-2026-")
    assert ref2.endswith("-CEA")


@pytest.mark.asyncio
async def test_create_cea_purchase_settlement(db_session, test_admin_user):
    """Test creating a CEA purchase settlement batch"""
    # Create entity
    entity = Entity(
        name="Test Buyer Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create settlement (order_id can be None for testing)
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Verify settlement
    assert settlement is not None
    assert settlement.entity_id == entity.id
    assert settlement.order_id == order.id
    assert settlement.settlement_type == SettlementType.CEA_PURCHASE
    assert settlement.status == SettlementStatus.PENDING
    assert settlement.asset_type == CertificateType.CEA
    assert settlement.quantity == Decimal("1000")
    assert settlement.price == Decimal("13.50")
    assert settlement.total_value_eur == Decimal("13500")
    assert settlement.batch_reference.startswith("SET-")

    # Verify T+3 calculation (expected date should be 3 business days from today)
    today = datetime.utcnow()
    expected_settlement = SettlementService.calculate_business_days(today, 3)
    assert settlement.expected_settlement_date.date() == expected_settlement.date()

    # Verify history entry was created
    assert len(settlement.status_history) == 1
    assert settlement.status_history[0].status == SettlementStatus.PENDING
    assert settlement.status_history[0].notes == "Settlement batch created - awaiting T+1"


@pytest.mark.asyncio
async def test_create_swap_cea_to_eua_settlement(db_session, test_admin_user):
    """Test creating a CEA to EUA swap settlement batch"""
    # Create entity
    entity = Entity(
        name="Test Swapper Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create settlement
    settlement = await SettlementService.create_swap_cea_to_eua_settlement(
        db=db_session,
        entity_id=entity.id,
        cea_quantity=Decimal("500"),
        eua_quantity=Decimal("500"),
        created_by=test_admin_user.id
    )

    # Verify settlement
    assert settlement is not None
    assert settlement.entity_id == entity.id
    assert settlement.settlement_type == SettlementType.SWAP_CEA_TO_EUA
    assert settlement.status == SettlementStatus.PENDING
    assert settlement.asset_type == CertificateType.CEA  # Input asset
    assert settlement.quantity == Decimal("500")  # CEA quantity
    assert settlement.batch_reference.startswith("SET-")
    assert settlement.batch_reference.endswith("-SWAP")

    # Verify T+1 calculation for swaps
    today = datetime.utcnow()
    expected_settlement = SettlementService.calculate_business_days(today, 1)
    assert settlement.expected_settlement_date.date() == expected_settlement.date()


@pytest.mark.asyncio
async def test_update_settlement_status(db_session, test_admin_user):
    """Test updating settlement status with history tracking"""
    # Create entity and settlement
    entity = Entity(
        name="Test Entity",
        entity_type=EntityType.EUA_HOLDER,
        category=EntityCategory.OPERATOR,
        created_by=test_admin_user.id
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Update status to TRANSFER_INITIATED
    updated = await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Manual update for testing",
        updated_by=test_admin_user.id
    )

    # Verify status change
    assert updated.status == SettlementStatus.TRANSFER_INITIATED
    assert len(updated.status_history) == 2  # Initial + new status

    # Verify history entry
    latest_history = updated.status_history[-1]
    assert latest_history.status == SettlementStatus.TRANSFER_INITIATED
    assert latest_history.notes == "Manual update for testing"
    assert latest_history.updated_by == test_admin_user.id


@pytest.mark.asyncio
async def test_get_pending_settlements(db_session, test_admin_user):
    """Test retrieving pending settlements for an entity"""
    # Create entity
    entity = Entity(
        name="Test Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create 3 settlements with different statuses
    settlement1 = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    settlement2 = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("500"),
        price=Decimal("14.00"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Mark one as SETTLED (should not appear in pending)
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement2.id,
        new_status=SettlementStatus.SETTLED,
        notes="Completed",
        updated_by=test_admin_user.id
    )

    # Get pending settlements
    pending = await SettlementService.get_pending_settlements(
        db=db_session,
        entity_id=entity.id
    )

    # Should only return settlement1 (PENDING)
    assert len(pending) == 1
    assert pending[0].id == settlement1.id
    assert pending[0].status == SettlementStatus.PENDING


@pytest.mark.asyncio
async def test_get_pending_settlements_with_filters(db_session, test_admin_user):
    """Test filtering pending settlements by type and status"""
    # Create entity
    entity = Entity(
        name="Test Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create CEA purchase settlement
    cea_settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Create swap settlement
    swap_settlement = await SettlementService.create_swap_cea_to_eua_settlement(
        db=db_session,
        entity_id=entity.id,
        cea_quantity=Decimal("500"),
        eua_quantity=Decimal("500"),
        created_by=test_admin_user.id
    )

    # Update CEA settlement to IN_TRANSIT
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=cea_settlement.id,
        new_status=SettlementStatus.IN_TRANSIT,
        notes="In transit",
        updated_by=test_admin_user.id
    )

    # Filter by CEA_PURCHASE type
    cea_only = await SettlementService.get_pending_settlements(
        db=db_session,
        entity_id=entity.id,
        settlement_type=SettlementType.CEA_PURCHASE
    )
    assert len(cea_only) == 1
    assert cea_only[0].settlement_type == SettlementType.CEA_PURCHASE

    # Filter by PENDING status
    pending_only = await SettlementService.get_pending_settlements(
        db=db_session,
        entity_id=entity.id,
        status=SettlementStatus.PENDING
    )
    assert len(pending_only) == 1
    assert pending_only[0].status == SettlementStatus.PENDING


@pytest.mark.asyncio
async def test_get_settlement_timeline(db_session, test_admin_user):
    """Test retrieving settlement with full status history timeline"""
    # Create entity
    entity = Entity(
        name="Test Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Progress through statuses
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Transfer started",
        updated_by=test_admin_user.id
    )

    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.IN_TRANSIT,
        notes="In transit to registry",
        updated_by=test_admin_user.id
    )

    # Get timeline
    settlement_obj, history = await SettlementService.get_settlement_timeline(
        db=db_session,
        settlement_id=settlement.id
    )

    # Verify timeline
    assert settlement_obj.id == settlement.id
    assert len(history) == 3  # PENDING, TRANSFER_INITIATED, IN_TRANSIT
    assert history[0].status == SettlementStatus.PENDING
    assert history[1].status == SettlementStatus.TRANSFER_INITIATED
    assert history[2].status == SettlementStatus.IN_TRANSIT

    # Verify chronological order
    assert history[0].created_at <= history[1].created_at
    assert history[1].created_at <= history[2].created_at


@pytest.mark.asyncio
async def test_calculate_settlement_progress(db_session, test_admin_user):
    """Test progress percentage calculation for different statuses"""
    # Create entity
    entity = Entity(
        name="Test Entity",
        jurisdiction=Jurisdiction.EU
    )
    db_session.add(entity)
    await db_session.commit()
    await db_session.refresh(entity)

    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Test progress at different statuses
    assert SettlementService.calculate_settlement_progress(settlement) == 0  # PENDING

    await SettlementService.update_settlement_status(
        db=db_session, settlement_id=settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Test", updated_by=test_admin_user.id
    )
    await db_session.refresh(settlement)
    assert SettlementService.calculate_settlement_progress(settlement) == 25

    await SettlementService.update_settlement_status(
        db=db_session, settlement_id=settlement.id,
        new_status=SettlementStatus.IN_TRANSIT,
        notes="Test", updated_by=test_admin_user.id
    )
    await db_session.refresh(settlement)
    assert SettlementService.calculate_settlement_progress(settlement) == 50

    await SettlementService.update_settlement_status(
        db=db_session, settlement_id=settlement.id,
        new_status=SettlementStatus.AT_CUSTODY,
        notes="Test", updated_by=test_admin_user.id
    )
    await db_session.refresh(settlement)
    assert SettlementService.calculate_settlement_progress(settlement) == 75

    await SettlementService.update_settlement_status(
        db=db_session, settlement_id=settlement.id,
        new_status=SettlementStatus.SETTLED,
        notes="Test", updated_by=test_admin_user.id
    )
    await db_session.refresh(settlement)
    assert SettlementService.calculate_settlement_progress(settlement) == 100
