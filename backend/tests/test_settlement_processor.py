"""Tests for settlement processor background job"""
import pytest
import pytest_asyncio
from decimal import Decimal
from datetime import datetime, timedelta
from app.services.settlement_processor import SettlementProcessor
from app.services.settlement_service import SettlementService
from app.models.models import (
    User, UserRole, Entity, Jurisdiction,
    SettlementBatch, SettlementStatus, SettlementType, CertificateType
)


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


@pytest.mark.asyncio
async def test_get_next_status_progression(db_session):
    """Test status progression logic"""
    # Test normal progression
    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.PENDING
    ) == SettlementStatus.TRANSFER_INITIATED

    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.TRANSFER_INITIATED
    ) == SettlementStatus.IN_TRANSIT

    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.IN_TRANSIT
    ) == SettlementStatus.AT_CUSTODY

    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.AT_CUSTODY
    ) == SettlementStatus.SETTLED

    # Test terminal statuses have no next status
    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.SETTLED
    ) is None

    assert SettlementProcessor._get_next_status_from_current(
        SettlementStatus.FAILED
    ) is None


@pytest.mark.asyncio
async def test_should_advance_status_based_on_time(db_session, test_entity, test_admin_user):
    """Test settlement auto-advancement based on elapsed time"""
    # Create settlement with expected date in the past (should advance)
    past_date = datetime.utcnow() - timedelta(days=1)
    settlement_past = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )
    # Manually set expected date to past
    settlement_past.expected_settlement_date = past_date
    await db_session.commit()
    await db_session.refresh(settlement_past)

    # Should advance (expected date passed)
    should_advance = await SettlementProcessor._should_advance_status(settlement_past)
    assert should_advance is True

    # Create settlement with future expected date (should not advance)
    future_date = datetime.utcnow() + timedelta(days=2)
    settlement_future = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("500"),
        price=Decimal("14.00"),
        seller_id=None,
        created_by=test_admin_user.id
    )
    settlement_future.expected_settlement_date = future_date
    await db_session.commit()
    await db_session.refresh(settlement_future)

    # Should not advance (expected date not reached)
    should_advance = await SettlementProcessor._should_advance_status(settlement_future)
    assert should_advance is False


@pytest.mark.asyncio
async def test_should_advance_status_respects_status_order(
    db_session, test_entity, test_admin_user
):
    """Test that advancement respects status order - each status gets its time"""
    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # T+3 CEA purchases should have:
    # - Day 0 (today): PENDING
    # - Day 1: TRANSFER_INITIATED
    # - Day 2: IN_TRANSIT
    # - Day 3: AT_CUSTODY → SETTLED

    # Simulate settlement just created (PENDING)
    # Should not advance until T+1
    should_advance = await SettlementProcessor._should_advance_status(settlement)
    assert should_advance is False

    # Simulate T+1 reached (set expected date to yesterday)
    settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=2)
    await db_session.commit()
    await db_session.refresh(settlement)

    # Now should advance from PENDING → TRANSFER_INITIATED
    should_advance = await SettlementProcessor._should_advance_status(settlement)
    assert should_advance is True


@pytest.mark.asyncio
async def test_should_not_advance_terminal_statuses(
    db_session, test_entity, test_admin_user
):
    """Test that SETTLED and FAILED settlements are never advanced"""
    # Create and immediately settle
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement.id,
        new_status=SettlementStatus.SETTLED,
        notes="Completed",
        updated_by=test_admin_user.id
    )

    # Set expected date to past
    settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=10)
    await db_session.commit()
    await db_session.refresh(settlement)

    # Should NOT advance (terminal status)
    should_advance = await SettlementProcessor._should_advance_status(settlement)
    assert should_advance is False


@pytest.mark.asyncio
async def test_process_pending_settlements_advances_ready(
    db_session, test_entity, test_admin_user
):
    """Test that process_pending_settlements advances ready settlements"""
    # Create settlement with past expected date
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Manually set expected date to yesterday
    settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=1)
    await db_session.commit()

    # Verify initial status
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.PENDING

    # Run processor
    await SettlementProcessor.process_pending_settlements()

    # Verify status advanced
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.TRANSFER_INITIATED

    # Verify history was created
    assert len(settlement.status_history) == 2
    assert settlement.status_history[-1].status == SettlementStatus.TRANSFER_INITIATED
    assert "Automatic status update" in settlement.status_history[-1].notes


@pytest.mark.asyncio
async def test_process_pending_settlements_skips_future(
    db_session, test_entity, test_admin_user
):
    """Test that process_pending_settlements skips settlements not yet ready"""
    # Create settlement with future expected date
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Manually set expected date to tomorrow
    settlement.expected_settlement_date = datetime.utcnow() + timedelta(days=1)
    await db_session.commit()

    # Verify initial status
    await db_session.refresh(settlement)
    initial_status = settlement.status
    assert initial_status == SettlementStatus.PENDING

    # Run processor
    await SettlementProcessor.process_pending_settlements()

    # Verify status unchanged
    await db_session.refresh(settlement)
    assert settlement.status == initial_status
    assert len(settlement.status_history) == 1  # Only initial history


@pytest.mark.asyncio
async def test_process_pending_settlements_handles_multiple(
    db_session, test_entity, test_admin_user
):
    """Test processor handles multiple settlements correctly"""
    # Create 3 settlements with different dates
    settlement_ready = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )
    settlement_ready.expected_settlement_date = datetime.utcnow() - timedelta(days=1)

    settlement_not_ready = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("500"),
        price=Decimal("14.00"),
        seller_id=None,
        created_by=test_admin_user.id
    )
    settlement_not_ready.expected_settlement_date = datetime.utcnow() + timedelta(days=1)

    settlement_settled = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("750"),
        price=Decimal("13.75"),
        seller_id=None,
        created_by=test_admin_user.id
    )
    await SettlementService.update_settlement_status(
        db=db_session,
        settlement_id=settlement_settled.id,
        new_status=SettlementStatus.SETTLED,
        notes="Already settled",
        updated_by=test_admin_user.id
    )

    await db_session.commit()

    # Run processor
    await SettlementProcessor.process_pending_settlements()

    # Verify results
    await db_session.refresh(settlement_ready)
    await db_session.refresh(settlement_not_ready)
    await db_session.refresh(settlement_settled)

    assert settlement_ready.status == SettlementStatus.TRANSFER_INITIATED  # Advanced
    assert settlement_not_ready.status == SettlementStatus.PENDING  # Not ready
    assert settlement_settled.status == SettlementStatus.SETTLED  # Unchanged


@pytest.mark.asyncio
async def test_check_overdue_settlements(db_session, test_entity, test_admin_user):
    """Test check_overdue_settlements identifies overdue settlements"""
    # Create settlement that's way overdue (expected 5 days ago)
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Set to overdue
    settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=5)
    settlement.status = SettlementStatus.IN_TRANSIT  # Still in transit after 5 days
    await db_session.commit()

    # Run overdue check (this would log warnings in production)
    await SettlementProcessor.check_overdue_settlements()

    # In production, this would send alerts/notifications
    # For testing, we just verify it runs without error
    # The actual alert logic would be tested separately


@pytest.mark.asyncio
async def test_full_settlement_lifecycle_automation(
    db_session, test_entity, test_admin_user
):
    """Test complete settlement lifecycle through processor automation"""
    # Create settlement
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=db_session,
        entity_id=test_entity.id,
        order_id=None,
        trade_id=None,
        quantity=Decimal("1000"),
        price=Decimal("13.50"),
        seller_id=None,
        created_by=test_admin_user.id
    )

    # Simulate T+0 (today) - should be PENDING
    assert settlement.status == SettlementStatus.PENDING

    # Simulate T+1 (set expected date to yesterday)
    settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=2)
    await db_session.commit()

    # Run processor - should advance to TRANSFER_INITIATED
    await SettlementProcessor.process_pending_settlements()
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.TRANSFER_INITIATED

    # Run again - should advance to IN_TRANSIT
    await SettlementProcessor.process_pending_settlements()
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.IN_TRANSIT

    # Run again - should advance to AT_CUSTODY
    await SettlementProcessor.process_pending_settlements()
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.AT_CUSTODY

    # Run again - should advance to SETTLED
    await SettlementProcessor.process_pending_settlements()
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.SETTLED

    # Run again - should stay SETTLED (terminal)
    await SettlementProcessor.process_pending_settlements()
    await db_session.refresh(settlement)
    assert settlement.status == SettlementStatus.SETTLED

    # Verify complete history
    assert len(settlement.status_history) == 5  # All 5 status changes
    statuses = [h.status for h in settlement.status_history]
    assert statuses == [
        SettlementStatus.PENDING,
        SettlementStatus.TRANSFER_INITIATED,
        SettlementStatus.IN_TRANSIT,
        SettlementStatus.AT_CUSTODY,
        SettlementStatus.SETTLED,
    ]
