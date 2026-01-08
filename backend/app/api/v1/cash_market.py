"""
Cash Market API Router

Order-driven market with order book, market depth, and FIFO matching.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from decimal import Decimal

from ...schemas.schemas import (
    OrderCreate,
    OrderResponse,
    OrderBookResponse,
    OrderBookLevel,
    MarketDepthResponse,
    MarketDepthPoint,
    CashMarketTradeResponse,
    MarketStatsResponse,
    CertificateType,
    OrderSide,
    MessageResponse,
)
from ...services.simulation import simulation_engine

router = APIRouter(prefix="/cash-market", tags=["Cash Market"])


class OrderBookSimulator:
    """
    Generates realistic simulated order book data for demo purposes.
    In production, this would query the actual database orders.
    """

    # Base prices
    EUA_BASE_PRICE = 81.0
    CEA_BASE_PRICE = 14.0

    def __init__(self):
        self._orderbook_cache = {}
        self._trades_cache = {}
        self._cache_time = {}

    def _generate_orders(self, cert_type: str, side: str, count: int, base_price: float) -> List[dict]:
        """Generate simulated orders for one side of the book"""
        orders = []

        if side == "BUY":
            # Bids below market price, best bid closest to base
            price_start = base_price * 0.995  # Start 0.5% below
            price_step = -0.01  # Decrease by $0.01 per level
        else:
            # Asks above market price, best ask closest to base
            price_start = base_price * 1.005  # Start 0.5% above
            price_step = 0.01  # Increase by $0.01 per level

        for i in range(count):
            price = round(price_start + (i * price_step), 2)

            # More orders near the spread, fewer further out
            if i < 5:
                order_count = random.randint(3, 8)
                base_qty = random.uniform(500, 2000)
            elif i < 10:
                order_count = random.randint(2, 5)
                base_qty = random.uniform(1000, 5000)
            else:
                order_count = random.randint(1, 3)
                base_qty = random.uniform(2000, 10000)

            quantity = round(base_qty * order_count, 2)

            orders.append({
                "price": price,
                "quantity": quantity,
                "order_count": order_count,
            })

        return orders

    def get_orderbook(self, cert_type: str) -> dict:
        """Get the complete order book for a certificate type"""
        cache_key = f"orderbook_{cert_type}"

        # Check cache (30 second TTL for realistic updates)
        if cache_key in self._cache_time:
            cache_age = (datetime.utcnow() - self._cache_time[cache_key]).seconds
            if cache_age < 30 and cache_key in self._orderbook_cache:
                return self._orderbook_cache[cache_key]

        base_price = self.EUA_BASE_PRICE if cert_type == "EUA" else self.CEA_BASE_PRICE

        # Add some random variance to base price
        current_price = base_price * (1 + random.uniform(-0.02, 0.02))

        # Generate bids and asks
        bids = self._generate_orders(cert_type, "BUY", 15, current_price)
        asks = self._generate_orders(cert_type, "SELL", 15, current_price)

        # Calculate cumulative quantities
        bid_cumulative = 0
        for bid in bids:
            bid_cumulative += bid["quantity"]
            bid["cumulative_quantity"] = round(bid_cumulative, 2)

        ask_cumulative = 0
        for ask in asks:
            ask_cumulative += ask["quantity"]
            ask["cumulative_quantity"] = round(ask_cumulative, 2)

        # Best bid/ask
        best_bid = bids[0]["price"] if bids else None
        best_ask = asks[0]["price"] if asks else None
        spread = round(best_ask - best_bid, 4) if best_bid and best_ask else None

        # 24h stats
        volume_24h = round(random.uniform(50000, 200000), 2)
        change_24h = round(random.uniform(-3.0, 3.0), 2)

        orderbook = {
            "certificate_type": cert_type,
            "bids": bids,
            "asks": asks,
            "spread": spread,
            "best_bid": best_bid,
            "best_ask": best_ask,
            "last_price": round(current_price, 2),
            "volume_24h": volume_24h,
            "change_24h": change_24h,
        }

        # Cache the result
        self._orderbook_cache[cache_key] = orderbook
        self._cache_time[cache_key] = datetime.utcnow()

        return orderbook

    def get_recent_trades(self, cert_type: str, limit: int = 50) -> List[dict]:
        """Generate simulated recent trades"""
        cache_key = f"trades_{cert_type}"

        if cache_key in self._cache_time:
            cache_age = (datetime.utcnow() - self._cache_time[cache_key]).seconds
            if cache_age < 10 and cache_key in self._trades_cache:
                return self._trades_cache[cache_key][:limit]

        base_price = self.EUA_BASE_PRICE if cert_type == "EUA" else self.CEA_BASE_PRICE
        trades = []

        base_time = datetime.utcnow()

        for i in range(100):  # Generate more than limit for variety
            # Price with small variance
            price = round(base_price * (1 + random.uniform(-0.01, 0.01)), 2)

            # Quantity
            quantity = round(random.uniform(100, 5000), 2)

            # Time (spread over last hour)
            executed_at = base_time - timedelta(
                minutes=random.randint(0, 60),
                seconds=random.randint(0, 59)
            )

            # Side (slightly favor buys for bullish appearance)
            side = "BUY" if random.random() < 0.52 else "SELL"

            trades.append({
                "id": str(uuid.uuid4()),
                "certificate_type": cert_type,
                "price": price,
                "quantity": quantity,
                "side": side,
                "executed_at": executed_at.isoformat(),
            })

        # Sort by time (newest first)
        trades.sort(key=lambda x: x["executed_at"], reverse=True)

        self._trades_cache[cache_key] = trades
        self._cache_time[cache_key] = datetime.utcnow()

        return trades[:limit]

    def get_market_depth(self, cert_type: str) -> dict:
        """Get market depth data for chart visualization"""
        orderbook = self.get_orderbook(cert_type)

        # Convert to cumulative depth points
        bid_depth = []
        for bid in orderbook["bids"]:
            bid_depth.append({
                "price": bid["price"],
                "cumulative_quantity": bid["cumulative_quantity"],
            })

        ask_depth = []
        for ask in orderbook["asks"]:
            ask_depth.append({
                "price": ask["price"],
                "cumulative_quantity": ask["cumulative_quantity"],
            })

        return {
            "certificate_type": cert_type,
            "bids": bid_depth,
            "asks": ask_depth,
        }


# Singleton instance
orderbook_simulator = OrderBookSimulator()


@router.get("/orderbook/{certificate_type}", response_model=OrderBookResponse)
async def get_orderbook(certificate_type: CertificateType):
    """
    Get the order book for a specific certificate type.
    Returns bids (buy orders) and asks (sell orders) aggregated by price level.
    """
    orderbook = orderbook_simulator.get_orderbook(certificate_type.value)

    return OrderBookResponse(
        certificate_type=orderbook["certificate_type"],
        bids=[OrderBookLevel(**b) for b in orderbook["bids"]],
        asks=[OrderBookLevel(**a) for a in orderbook["asks"]],
        spread=orderbook["spread"],
        best_bid=orderbook["best_bid"],
        best_ask=orderbook["best_ask"],
        last_price=orderbook["last_price"],
        volume_24h=orderbook["volume_24h"],
        change_24h=orderbook["change_24h"],
    )


@router.get("/depth/{certificate_type}", response_model=MarketDepthResponse)
async def get_market_depth(certificate_type: CertificateType):
    """
    Get market depth data for visualization.
    Returns cumulative quantities at each price level.
    """
    depth = orderbook_simulator.get_market_depth(certificate_type.value)

    return MarketDepthResponse(
        certificate_type=depth["certificate_type"],
        bids=[MarketDepthPoint(**b) for b in depth["bids"]],
        asks=[MarketDepthPoint(**a) for a in depth["asks"]],
    )


@router.get("/trades/{certificate_type}", response_model=List[CashMarketTradeResponse])
async def get_recent_trades(
    certificate_type: CertificateType,
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get recent executed trades for a certificate type.
    """
    trades = orderbook_simulator.get_recent_trades(certificate_type.value, limit)

    return [
        CashMarketTradeResponse(
            id=uuid.UUID(t["id"]),
            certificate_type=t["certificate_type"],
            price=t["price"],
            quantity=t["quantity"],
            side=t["side"],
            executed_at=datetime.fromisoformat(t["executed_at"]),
        )
        for t in trades
    ]


@router.get("/stats/{certificate_type}", response_model=MarketStatsResponse)
async def get_market_stats(certificate_type: CertificateType):
    """
    Get market statistics for a certificate type.
    """
    orderbook = orderbook_simulator.get_orderbook(certificate_type.value)
    base_price = orderbook["last_price"]

    return MarketStatsResponse(
        certificate_type=certificate_type.value,
        last_price=base_price,
        change_24h=orderbook["change_24h"],
        high_24h=round(base_price * 1.02, 2),
        low_24h=round(base_price * 0.98, 2),
        volume_24h=orderbook["volume_24h"],
        total_bids=len(orderbook["bids"]),
        total_asks=len(orderbook["asks"]),
    )


@router.post("/orders", response_model=MessageResponse)
async def place_order(order: OrderCreate):
    """
    Place a new order in the cash market.
    In demo mode, this simulates order placement.
    """
    # In demo mode, just acknowledge the order
    # In production, this would:
    # 1. Validate the user has sufficient balance/holdings
    # 2. Insert the order into the database
    # 3. Run the matching engine
    # 4. Return any executed trades

    return MessageResponse(
        message=f"Order placed: {order.side.value} {order.quantity} {order.certificate_type.value} @ ${order.price}",
        success=True
    )


@router.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, FILLED, CANCELLED"),
    certificate_type: Optional[CertificateType] = None,
):
    """
    Get the current user's orders.
    In demo mode, returns simulated orders.
    """
    # In demo mode, return sample orders
    base_time = datetime.utcnow()

    sample_orders = [
        {
            "id": str(uuid.uuid4()),
            "entity_id": str(uuid.uuid4()),
            "certificate_type": "EUA",
            "side": "BUY",
            "price": 80.50,
            "quantity": 500,
            "filled_quantity": 0,
            "remaining_quantity": 500,
            "status": "OPEN",
            "created_at": (base_time - timedelta(hours=2)).isoformat(),
            "updated_at": None,
        },
        {
            "id": str(uuid.uuid4()),
            "entity_id": str(uuid.uuid4()),
            "certificate_type": "CEA",
            "side": "SELL",
            "price": 14.20,
            "quantity": 1000,
            "filled_quantity": 350,
            "remaining_quantity": 650,
            "status": "PARTIALLY_FILLED",
            "created_at": (base_time - timedelta(hours=5)).isoformat(),
            "updated_at": (base_time - timedelta(hours=1)).isoformat(),
        },
    ]

    # Apply filters
    if status:
        sample_orders = [o for o in sample_orders if o["status"] == status]
    if certificate_type:
        sample_orders = [o for o in sample_orders if o["certificate_type"] == certificate_type.value]

    return [
        OrderResponse(
            id=uuid.UUID(o["id"]),
            entity_id=uuid.UUID(o["entity_id"]),
            certificate_type=o["certificate_type"],
            side=o["side"],
            price=o["price"],
            quantity=o["quantity"],
            filled_quantity=o["filled_quantity"],
            remaining_quantity=o["remaining_quantity"],
            status=o["status"],
            created_at=datetime.fromisoformat(o["created_at"]),
            updated_at=datetime.fromisoformat(o["updated_at"]) if o["updated_at"] else None,
        )
        for o in sample_orders
    ]


@router.delete("/orders/{order_id}", response_model=MessageResponse)
async def cancel_order(order_id: str):
    """
    Cancel an open order.
    In demo mode, this simulates cancellation.
    """
    return MessageResponse(
        message=f"Order {order_id} cancelled successfully",
        success=True
    )
