"""Unit tests for order matching service"""

from decimal import Decimal
from uuid import uuid4

import pytest

from app.models.models import (
    CertificateType,
    MarketMakerType,
    Order,
    OrderSide,
    OrderStatus,
    Seller,
)
from app.services.order_matching import get_real_orderbook


@pytest.mark.asyncio
async def test_get_real_orderbook_empty(db_session):
    """Test order book with no orders"""
    orderbook = await get_real_orderbook(db_session, "CEA")

    assert orderbook["certificate_type"] == "CEA"
    assert orderbook["bids"] == []
    assert orderbook["asks"] == []
    assert orderbook["best_bid"] is None
    assert orderbook["best_ask"] is None
    assert orderbook["spread"] is None
    assert orderbook["last_price"] == 63.0  # Default CEA price
    assert orderbook["volume_24h"] == 0.0


@pytest.mark.asyncio
async def test_get_real_orderbook_market_maker_sell_orders(db_session, test_admin_user):
    """Test that Market Maker SELL orders appear in order book"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM Seller",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Create SELL order from Market Maker
    from app.services.order_service import determine_order_market

    order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify Market Maker order appears in asks
    assert len(orderbook["asks"]) == 1
    assert orderbook["asks"][0]["price"] == 12.50
    assert orderbook["asks"][0]["quantity"] == 1000.0
    assert orderbook["asks"][0]["order_count"] == 1
    assert orderbook["best_ask"] == 12.50


@pytest.mark.asyncio
async def test_get_real_orderbook_market_maker_buy_orders(db_session, test_admin_user):
    """Test that Market Maker BUY orders appear in order book"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM Buyer",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CASH_BUYER,
        initial_eur_balance=Decimal("50000"),
    )
    await db_session.commit()

    # Create BUY order from Market Maker
    from app.services.order_service import determine_order_market

    order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.BUY,
        price=Decimal("12.00"),
        quantity=Decimal("2000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify Market Maker order appears in bids
    assert len(orderbook["bids"]) == 1
    assert orderbook["bids"][0]["price"] == 12.00
    assert orderbook["bids"][0]["quantity"] == 2000.0
    assert orderbook["bids"][0]["order_count"] == 1
    assert orderbook["best_bid"] == 12.00


@pytest.mark.asyncio
async def test_get_real_orderbook_mixed_sources(db_session, test_admin_user):
    """Test order book with both Seller and Market Maker orders"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )

    # Create Seller
    seller = Seller(
        name="Test Seller",
        client_code="SELL-001",
        company_name="Test Company",
        cea_balance=Decimal("5000"),
        is_active=True,
    )
    db_session.add(seller)
    await db_session.flush()

    # Create SELL order from Market Maker
    from app.services.order_service import determine_order_market

    mm_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(mm_order)

    # Create SELL order from Seller
    seller_order = Order(
        market="CEA_CASH",
        seller_id=seller.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.75"),
        quantity=Decimal("500"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(seller_order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify both orders appear (sorted by price)
    assert len(orderbook["asks"]) == 2
    assert orderbook["asks"][0]["price"] == 12.50  # MM order (better price)
    assert orderbook["asks"][1]["price"] == 12.75  # Seller order
    assert orderbook["best_ask"] == 12.50


@pytest.mark.asyncio
async def test_get_real_orderbook_price_aggregation(db_session, test_admin_user):
    """Test that orders at same price are aggregated correctly"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

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

    # Create multiple SELL orders at same price
    from app.services.order_service import determine_order_market

    order1 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order1)

    order2 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("500"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order2)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify orders are aggregated at same price level
    assert len(orderbook["asks"]) == 1
    assert orderbook["asks"][0]["price"] == 12.50
    assert orderbook["asks"][0]["quantity"] == 1500.0  # 1000 + 500
    assert orderbook["asks"][0]["order_count"] == 2


@pytest.mark.asyncio
async def test_get_real_orderbook_excludes_filled_orders(db_session, test_admin_user):
    """Test that filled orders are excluded from order book"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

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

    # Create FILLED order (should be excluded)
    from app.services.order_service import determine_order_market

    filled_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("1000"),  # Fully filled
        status=OrderStatus.FILLED,
    )
    db_session.add(filled_order)

    # Create OPEN order (should be included)
    open_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.75"),
        quantity=Decimal("500"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(open_order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify only OPEN order appears
    assert len(orderbook["asks"]) == 1
    assert orderbook["asks"][0]["price"] == 12.75
    assert orderbook["asks"][0]["quantity"] == 500.0


@pytest.mark.asyncio
async def test_get_real_orderbook_excludes_partially_filled_zero_remaining(
    db_session, test_admin_user
):
    """Test that orders with zero remaining quantity are excluded"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

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

    # Create order with zero remaining (should be excluded)
    from app.services.order_service import determine_order_market

    zero_remaining_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("1000"),  # Fully filled
        status=OrderStatus.PARTIALLY_FILLED,  # Zero remaining
    )
    db_session.add(zero_remaining_order)

    # Create order with remaining quantity (should be included)
    remaining_order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.75"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("300"),  # 700 remaining
        status=OrderStatus.PARTIALLY_FILLED,
    )
    db_session.add(remaining_order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify only order with remaining quantity appears
    assert len(orderbook["asks"]) == 1
    assert orderbook["asks"][0]["price"] == 12.75
    assert orderbook["asks"][0]["quantity"] == 700.0  # 1000 - 300


@pytest.mark.asyncio
async def test_get_real_orderbook_cumulative_quantities(db_session, test_admin_user):
    """Test that cumulative quantities are calculated correctly"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

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

    # Create multiple orders at different prices
    from app.services.order_service import determine_order_market

    order1 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order1)

    order2 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.75"),
        quantity=Decimal("500"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order2)

    order3 = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("13.00"),
        quantity=Decimal("200"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order3)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify cumulative quantities (asks sorted ascending by price)
    assert len(orderbook["asks"]) == 3
    assert orderbook["asks"][0]["price"] == 12.50
    assert orderbook["asks"][0]["cumulative_quantity"] == 1000.0
    assert orderbook["asks"][1]["price"] == 12.75
    assert orderbook["asks"][1]["cumulative_quantity"] == 1500.0  # 1000 + 500
    assert orderbook["asks"][2]["price"] == 13.00
    assert orderbook["asks"][2]["cumulative_quantity"] == 1700.0  # 1000 + 500 + 200


@pytest.mark.asyncio
async def test_get_real_orderbook_eua_certificate_type(db_session, test_admin_user):
    """Test order book for EUA certificate type"""
    # Create Market Maker
    from app.services.market_maker_service import MarketMakerService

    mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM EUA",
        email=f"mm-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.SWAP_MAKER,
        initial_balances={"EUA": Decimal("1000")},
    )
    await db_session.commit()

    # Create EUA SELL order
    from app.services.order_service import determine_order_market

    order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=mm.id,
        certificate_type=CertificateType.EUA,
        side=OrderSide.SELL,
        price=Decimal("80.00"),
        quantity=Decimal("100"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "EUA")

    # Verify EUA order appears
    assert orderbook["certificate_type"] == "EUA"
    assert len(orderbook["asks"]) == 1
    assert orderbook["asks"][0]["price"] == 80.00
    assert orderbook["last_price"] == (
        80.00 or orderbook["last_price"] == 81.0  # Default or actual
    )


@pytest.mark.asyncio
async def test_get_real_orderbook_spread_calculation(db_session, test_admin_user):
    """Test that spread is calculated correctly when both bids and asks exist"""
    # Create Market Makers
    from app.services.market_maker_service import MarketMakerService

    mm_seller, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM Seller",
        email=f"mm-seller-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        initial_balances={"CEA": Decimal("10000")},
    )

    mm_buyer, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="Test MM Buyer",
        email=f"mm-buyer-{uuid4().hex[:8]}@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        mm_type=MarketMakerType.CASH_BUYER,
        initial_eur_balance=Decimal("50000"),
    )
    await db_session.commit()

    # Create SELL order
    from app.services.order_service import determine_order_market

    sell_order = Order(
        market=determine_order_market(market_maker=mm_seller),
        market_maker_id=mm_seller.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.SELL,
        price=Decimal("12.50"),
        quantity=Decimal("1000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(sell_order)

    # Create BUY order
    buy_order = Order(
        market=determine_order_market(market_maker=mm_buyer),
        market_maker_id=mm_buyer.id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.BUY,
        price=Decimal("12.00"),
        quantity=Decimal("2000"),
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
    )
    db_session.add(buy_order)
    await db_session.commit()

    # Get order book
    orderbook = await get_real_orderbook(db_session, "CEA")

    # Verify spread calculation
    assert orderbook["best_bid"] == 12.00
    assert orderbook["best_ask"] == 12.50
    assert orderbook["spread"] == 0.50  # 12.50 - 12.00
