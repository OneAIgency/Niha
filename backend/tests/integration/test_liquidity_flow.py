"""
End-to-end integration tests for liquidity management flow.

Tests the complete flow from Market Maker creation through preview to execution,
verifying orders and balance updates.
"""

import pytest
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import (
    MarketMaker,
    MarketMakerType,
    Order,
    OrderSide,
    OrderStatus,
    Ticket,
    TicketType,
    TicketStatus,
    Asset,
)
from backend.services.liquidity_service import LiquidityService


@pytest.fixture
def db_session():
    """Create a test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def setup_test_data(db_session: Session):
    """Set up test data: assets and market makers."""
    # Create test assets
    cea = Asset(
        ticker="CEA",
        name="Carbon Emissions Allowance",
        asset_type="carbon",
        is_active=True,
    )
    eua = Asset(
        ticker="EUA",
        name="European Union Allowance",
        asset_type="carbon",
        is_active=True,
    )
    eur = Asset(
        ticker="EUR",
        name="Euro",
        asset_type="currency",
        is_active=True,
    )
    db_session.add_all([cea, eua, eur])
    db_session.flush()

    # Create Liquidity Provider Market Maker
    lp_mm = MarketMaker(
        name="LP-CEA/EUR-50-10-2025-01-20",
        market_maker_type=MarketMakerType.LIQUIDITY_PROVIDER,
        base_asset_id=cea.asset_id,
        quote_asset_id=eur.asset_id,
        mid_price=Decimal("50.00"),
        spread_bps=10,
        total_base_quantity=Decimal("1000.0"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )

    # Create Arbitrage Hedger Market Maker
    ah_mm = MarketMaker(
        name="AH-CEA/EUA-1.05-20-2025-01-20",
        market_maker_type=MarketMakerType.ARBITRAGE_HEDGER,
        base_asset_id=cea.asset_id,
        quote_asset_id=eua.asset_id,
        mid_price=Decimal("1.05"),
        spread_bps=20,
        total_base_quantity=Decimal("500.0"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )

    db_session.add_all([lp_mm, ah_mm])
    db_session.commit()

    return {
        "cea": cea,
        "eua": eua,
        "eur": eur,
        "lp_mm": lp_mm,
        "ah_mm": ah_mm,
    }


class TestLiquidityFlowIntegration:
    """Integration tests for complete liquidity management flow."""

    def test_lp_complete_flow(self, db_session: Session, setup_test_data):
        """Test complete LP flow: create → preview → execute → verify."""
        lp_mm = setup_test_data["lp_mm"]
        cea = setup_test_data["cea"]
        eur = setup_test_data["eur"]

        service = LiquidityService(db_session)

        # Step 1: Preview orders
        preview = service.preview_market_maker_orders(lp_mm.market_maker_id)

        assert preview is not None
        assert preview["market_maker_id"] == lp_mm.market_maker_id
        assert preview["market_maker_type"] == MarketMakerType.LIQUIDITY_PROVIDER.value
        assert len(preview["orders"]) == 2

        # Verify BID order preview
        bid_order = next(o for o in preview["orders"] if o["side"] == "BID")
        assert bid_order["base_asset"] == "CEA"
        assert bid_order["quote_asset"] == "EUR"
        assert Decimal(bid_order["price"]) == Decimal("49.975")  # 50 * (1 - 0.0005)
        assert Decimal(bid_order["quantity"]) == Decimal("1000.0")
        assert Decimal(bid_order["total_value"]) == Decimal("49975.00")

        # Verify ASK order preview
        ask_order = next(o for o in preview["orders"] if o["side"] == "ASK")
        assert ask_order["base_asset"] == "CEA"
        assert ask_order["quote_asset"] == "EUR"
        assert Decimal(ask_order["price"]) == Decimal("50.025")  # 50 * (1 + 0.0005)
        assert Decimal(ask_order["quantity"]) == Decimal("1000.0")
        assert Decimal(ask_order["total_value"]) == Decimal("50025.00")

        # Step 2: Execute orders
        result = service.execute_market_maker_orders(lp_mm.market_maker_id)

        assert result["success"] is True
        assert result["market_maker_id"] == lp_mm.market_maker_id
        assert result["orders_created"] == 2

        # Step 3: Verify orders in database
        orders = (
            db_session.query(Order)
            .filter(Order.market_maker_id == lp_mm.market_maker_id)
            .all()
        )

        assert len(orders) == 2

        bid_order_db = next(o for o in orders if o.order_side == OrderSide.BID)
        ask_order_db = next(o for o in orders if o.order_side == OrderSide.ASK)

        # Verify BID order
        assert bid_order_db.base_asset_id == cea.asset_id
        assert bid_order_db.quote_asset_id == eur.asset_id
        assert bid_order_db.price == Decimal("49.975")
        assert bid_order_db.quantity == Decimal("1000.0")
        assert bid_order_db.order_status == OrderStatus.ACTIVE

        # Verify ASK order
        assert ask_order_db.base_asset_id == cea.asset_id
        assert ask_order_db.quote_asset_id == eur.asset_id
        assert ask_order_db.price == Decimal("50.025")
        assert ask_order_db.quantity == Decimal("1000.0")
        assert ask_order_db.order_status == OrderStatus.ACTIVE

        # Step 4: Verify tickets created
        tickets = (
            db_session.query(Ticket)
            .filter(Ticket.market_maker_id == lp_mm.market_maker_id)
            .all()
        )

        assert len(tickets) == 2

        for ticket in tickets:
            assert ticket.ticket_type == TicketType.ORDER_CREATION
            assert ticket.ticket_status == TicketStatus.COMPLETED
            assert ticket.market_maker_id == lp_mm.market_maker_id

        # Step 5: Verify market maker remains active
        db_session.refresh(lp_mm)
        assert lp_mm.is_active is True

    def test_ah_complete_flow(self, db_session: Session, setup_test_data):
        """Test complete AH flow: create → preview → execute → verify."""
        ah_mm = setup_test_data["ah_mm"]
        cea = setup_test_data["cea"]
        eua = setup_test_data["eua"]

        service = LiquidityService(db_session)

        # Step 1: Preview orders
        preview = service.preview_market_maker_orders(ah_mm.market_maker_id)

        assert preview is not None
        assert preview["market_maker_id"] == ah_mm.market_maker_id
        assert preview["market_maker_type"] == MarketMakerType.ARBITRAGE_HEDGER.value
        assert len(preview["orders"]) == 2

        # Verify BID CEA / ASK EUA order preview
        bid_cea_order = next(
            o for o in preview["orders"] if o["side"] == "BID" and o["base_asset"] == "CEA"
        )
        assert bid_cea_order["quote_asset"] == "EUA"
        assert Decimal(bid_cea_order["price"]) == Decimal("1.0490")  # 1.05 * (1 - 0.001)
        assert Decimal(bid_cea_order["quantity"]) == Decimal("500.0")

        # Verify ASK CEA / BID EUA order preview
        ask_cea_order = next(
            o for o in preview["orders"] if o["side"] == "ASK" and o["base_asset"] == "CEA"
        )
        assert ask_cea_order["quote_asset"] == "EUA"
        assert Decimal(ask_cea_order["price"]) == Decimal("1.0510")  # 1.05 * (1 + 0.001)
        assert Decimal(ask_cea_order["quantity"]) == Decimal("500.0")

        # Step 2: Execute orders
        result = service.execute_market_maker_orders(ah_mm.market_maker_id)

        assert result["success"] is True
        assert result["market_maker_id"] == ah_mm.market_maker_id
        assert result["orders_created"] == 2

        # Step 3: Verify orders in database
        orders = (
            db_session.query(Order)
            .filter(Order.market_maker_id == ah_mm.market_maker_id)
            .all()
        )

        assert len(orders) == 2

        bid_cea_order_db = next(
            o for o in orders if o.order_side == OrderSide.BID and o.base_asset_id == cea.asset_id
        )
        ask_cea_order_db = next(
            o for o in orders if o.order_side == OrderSide.ASK and o.base_asset_id == cea.asset_id
        )

        # Verify BID CEA order
        assert bid_cea_order_db.base_asset_id == cea.asset_id
        assert bid_cea_order_db.quote_asset_id == eua.asset_id
        assert bid_cea_order_db.price == Decimal("1.0490")
        assert bid_cea_order_db.quantity == Decimal("500.0")
        assert bid_cea_order_db.order_status == OrderStatus.ACTIVE

        # Verify ASK CEA order
        assert ask_cea_order_db.base_asset_id == cea.asset_id
        assert ask_cea_order_db.quote_asset_id == eua.asset_id
        assert ask_cea_order_db.price == Decimal("1.0510")
        assert ask_cea_order_db.quantity == Decimal("500.0")
        assert ask_cea_order_db.order_status == OrderStatus.ACTIVE

        # Step 4: Verify tickets created
        tickets = (
            db_session.query(Ticket)
            .filter(Ticket.market_maker_id == ah_mm.market_maker_id)
            .all()
        )

        assert len(tickets) == 2

        for ticket in tickets:
            assert ticket.ticket_type == TicketType.ORDER_CREATION
            assert ticket.ticket_status == TicketStatus.COMPLETED
            assert ticket.market_maker_id == ah_mm.market_maker_id

    def test_multiple_mm_execution(self, db_session: Session, setup_test_data):
        """Test executing multiple market makers simultaneously."""
        lp_mm = setup_test_data["lp_mm"]
        ah_mm = setup_test_data["ah_mm"]

        service = LiquidityService(db_session)

        # Execute both market makers
        lp_result = service.execute_market_maker_orders(lp_mm.market_maker_id)
        ah_result = service.execute_market_maker_orders(ah_mm.market_maker_id)

        assert lp_result["success"] is True
        assert ah_result["success"] is True

        # Verify total orders created
        total_orders = db_session.query(Order).count()
        assert total_orders == 4  # 2 from LP + 2 from AH

        # Verify orders are isolated by market maker
        lp_orders = (
            db_session.query(Order)
            .filter(Order.market_maker_id == lp_mm.market_maker_id)
            .all()
        )
        ah_orders = (
            db_session.query(Order)
            .filter(Order.market_maker_id == ah_mm.market_maker_id)
            .all()
        )

        assert len(lp_orders) == 2
        assert len(ah_orders) == 2

        # Verify no cross-contamination
        for order in lp_orders:
            assert order.market_maker_id == lp_mm.market_maker_id
            assert order.quote_asset_id == setup_test_data["eur"].asset_id

        for order in ah_orders:
            assert order.market_maker_id == ah_mm.market_maker_id
            assert order.quote_asset_id == setup_test_data["eua"].asset_id

    def test_preview_without_execution(self, db_session: Session, setup_test_data):
        """Test that preview doesn't create any database records."""
        lp_mm = setup_test_data["lp_mm"]

        service = LiquidityService(db_session)

        # Get initial counts
        initial_order_count = db_session.query(Order).count()
        initial_ticket_count = db_session.query(Ticket).count()

        # Preview orders
        preview = service.preview_market_maker_orders(lp_mm.market_maker_id)

        assert preview is not None
        assert len(preview["orders"]) == 2

        # Verify no records created
        final_order_count = db_session.query(Order).count()
        final_ticket_count = db_session.query(Ticket).count()

        assert final_order_count == initial_order_count
        assert final_ticket_count == initial_ticket_count

    def test_error_handling_invalid_mm(self, db_session: Session):
        """Test error handling for invalid market maker ID."""
        service = LiquidityService(db_session)

        # Test preview with invalid ID
        preview = service.preview_market_maker_orders(99999)
        assert preview is None

        # Test execution with invalid ID
        result = service.execute_market_maker_orders(99999)
        assert result["success"] is False
        assert "not found" in result["error"].lower()
