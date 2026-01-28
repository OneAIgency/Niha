"""Unit tests for Market Maker balance calculations"""

from decimal import Decimal
from uuid import uuid4

import pytest

from app.models.models import (
    CertificateType,
    MarketMakerType,
    Order,
    OrderSide,
    OrderStatus,
)
from app.services.market_maker_service import MarketMakerService


@pytest.mark.asyncio
async def test_get_balances_no_transactions(db_session, test_admin_user):
    """Test balance calculation with no transactions"""
    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
    )
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    assert balances["CEA"]["total"] == Decimal("0")
    assert balances["CEA"]["locked"] == Decimal("0")
    assert balances["CEA"]["available"] == Decimal("0")
    assert balances["EUA"]["total"] == Decimal("0")
    assert balances["EUA"]["locked"] == Decimal("0")
    assert balances["EUA"]["available"] == Decimal("0")


@pytest.mark.asyncio
async def test_get_balances_with_deposits(db_session, test_admin_user):
    """Test balance calculation with deposits"""
    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000"), "EUA": Decimal("5000")},
    )
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    assert balances["CEA"]["total"] == Decimal("10000")
    assert balances["CEA"]["locked"] == Decimal("0")
    assert balances["CEA"]["available"] == Decimal("10000")
    assert balances["EUA"]["total"] == Decimal("5000")
    assert balances["EUA"]["locked"] == Decimal("0")
    assert balances["EUA"]["available"] == Decimal("5000")


@pytest.mark.asyncio
async def test_get_balances_locked_by_sell_orders(db_session, test_admin_user):
    """Test that only SELL orders lock certificates, not BUY orders"""
    from app.services.order_service import determine_order_market

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Create a SELL order (should lock CEA)
    sell_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("10.00"),
        quantity=Decimal("2000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(sell_order)

    # Create a BUY order (should NOT lock CEA)
    buy_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.BUY,
        price=Decimal("9.00"),
        quantity=Decimal("5000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(buy_order)
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    # Total should be 10000 (from deposit)
    assert balances["CEA"]["total"] == Decimal("10000")
    # Locked should only include SELL order (2000), not BUY order (5000)
    assert balances["CEA"]["locked"] == Decimal("2000")
    # Available should be total - locked = 10000 - 2000 = 8000
    assert balances["CEA"]["available"] == Decimal("8000")


@pytest.mark.asyncio
async def test_get_balances_partially_filled_order(db_session, test_admin_user):
    """Test balance calculation with partially filled order"""
    from app.services.order_service import determine_order_market

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Create a partially filled SELL order
    # Original quantity: 3000, Filled: 1000, Remaining: 2000
    sell_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("10.00"),
        quantity=Decimal("3000"),
        filled_quantity=Decimal("1000"),
        status=OrderStatus.PARTIALLY_FILLED,
    )
    db_session.add(sell_order)
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    # Locked should be remaining quantity (3000 - 1000 = 2000)
    assert balances["CEA"]["locked"] == Decimal("2000")
    # Available should be total - locked = 10000 - 2000 = 8000
    assert balances["CEA"]["available"] == Decimal("8000")


@pytest.mark.asyncio
async def test_get_balances_multiple_sell_orders(db_session, test_admin_user):
    """Test balance calculation with multiple SELL orders"""
    from app.services.order_service import determine_order_market

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Create multiple SELL orders
    order1 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("10.00"),
        quantity=Decimal("2000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    order2 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("11.00"),
        quantity=Decimal("3000"),
        filled_quantity=Decimal("500"),
        status=OrderStatus.PARTIALLY_FILLED,
    )
    db_session.add(order1)
    db_session.add(order2)
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    # Locked should be sum of remaining quantities:
    # order1: 2000 - 0 = 2000
    # order2: 3000 - 500 = 2500
    # Total locked: 4500
    assert balances["CEA"]["locked"] == Decimal("4500")
    # Available should be total - locked = 10000 - 4500 = 5500
    assert balances["CEA"]["available"] == Decimal("5500")


@pytest.mark.asyncio
async def test_get_balances_filled_order_not_locked(db_session, test_admin_user):
    """Test that FILLED orders don't lock balance"""
    from app.services.order_service import determine_order_market

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Create a filled SELL order (should NOT lock)
    filled_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("10.00"),
        quantity=Decimal("2000"),
        filled_quantity=Decimal("2000"),
        status=OrderStatus.FILLED,
    )
    db_session.add(filled_order)

    # Create a cancelled SELL order (should NOT lock)
    cancelled_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("11.00"),
        quantity=Decimal("3000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.CANCELLED,
    )
    db_session.add(cancelled_order)
    await db_session.commit()

    balances = await MarketMakerService.get_balances(db_session, mm.id)

    # Neither FILLED nor CANCELLED orders should lock balance
    assert balances["CEA"]["locked"] == Decimal("0")
    assert balances["CEA"]["available"] == Decimal("10000")


@pytest.mark.asyncio
async def test_validate_sufficient_balance_sufficient(db_session, test_admin_user):
    """Test balance validation when balance is sufficient"""
    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Request 5000, available is 10000
    has_sufficient = await MarketMakerService.validate_sufficient_balance(
        db=db_session,
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        required_amount=Decimal("5000"),
    )

    assert has_sufficient is True


@pytest.mark.asyncio
async def test_validate_sufficient_balance_insufficient(db_session, test_admin_user):
    """Test balance validation when balance is insufficient"""
    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Request 15000, available is 10000
    has_sufficient = await MarketMakerService.validate_sufficient_balance(
        db=db_session,
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        required_amount=Decimal("15000"),
    )

    assert has_sufficient is False


@pytest.mark.asyncio
async def test_validate_sufficient_balance_with_locked(db_session, test_admin_user):
    """Test balance validation considers locked balance"""
    from app.services.order_service import determine_order_market

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Lock 6000 in a SELL order
    sell_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("10.00"),
        quantity=Decimal("6000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(sell_order)
    await db_session.commit()

    # Request 5000, available is 10000 - 6000 = 4000
    has_sufficient = await MarketMakerService.validate_sufficient_balance(
        db=db_session,
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        required_amount=Decimal("5000"),
    )

    assert has_sufficient is False  # Should fail because only 4000 available

    # Request 3000, available is 4000
    has_sufficient = await MarketMakerService.validate_sufficient_balance(
        db=db_session,
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        required_amount=Decimal("3000"),
    )

    assert has_sufficient is True  # Should pass because 4000 >= 3000
