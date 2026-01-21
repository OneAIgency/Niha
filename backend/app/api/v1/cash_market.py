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
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import joinedload

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
    OrderPreviewRequest,
    OrderPreviewResponse,
    OrderFill,
    MarketOrderRequest,
    LimitOrderRequest,
    OrderExecutionResponse,
    OrderType,
)
from ...services.simulation import simulation_engine
from ...services.order_matching import (
    preview_buy_order,
    execute_market_buy_order,
    get_real_orderbook,
    get_entity_balance,
    PLATFORM_FEE_RATE,
)
from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import Order, CashMarketTrade, Seller, Entity, User, EntityHolding, AssetType, MarketType
from ...models.models import OrderSide as OrderSideEnum, OrderStatus, CertificateType as CertTypeEnum

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


@router.post("/orders", response_model=OrderResponse)
async def place_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Place a new order in the cash market.
    Creates a real order in the database linked to the user's entity.
    """
    if not current_user.entity_id:
        raise HTTPException(status_code=400, detail="User must have an entity to place orders")

    # Create the order in database
    new_order = Order(
        market=MarketType.CEA_CASH,
        entity_id=current_user.entity_id,
        certificate_type=CertTypeEnum(order.certificate_type.value),
        side=OrderSideEnum(order.side.value),
        price=Decimal(str(order.price)),
        quantity=Decimal(str(order.quantity)),
        filled_quantity=Decimal('0'),
        status=OrderStatus.OPEN
    )

    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    return OrderResponse(
        id=new_order.id,
        entity_id=new_order.entity_id,
        certificate_type=new_order.certificate_type.value,
        side=new_order.side.value,
        price=float(new_order.price),
        quantity=float(new_order.quantity),
        filled_quantity=float(new_order.filled_quantity),
        remaining_quantity=float(new_order.quantity - new_order.filled_quantity),
        status=new_order.status.value,
        created_at=new_order.created_at,
        updated_at=new_order.updated_at,
    )


@router.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, FILLED, CANCELLED"),
    certificate_type: Optional[CertificateType] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Get the current user's orders from the database.
    Returns orders linked to the user's entity.
    """
    if not current_user.entity_id:
        return []  # User has no entity, no orders

    # Build query
    query = select(Order).where(Order.entity_id == current_user.entity_id)

    # Apply filters
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter

    if certificate_type:
        query = query.where(Order.certificate_type == CertTypeEnum(certificate_type.value))

    # Order by most recent first
    query = query.order_by(Order.created_at.desc()).limit(100)

    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        OrderResponse(
            id=o.id,
            entity_id=o.entity_id,
            certificate_type=o.certificate_type.value,
            side=o.side.value,
            price=float(o.price),
            quantity=float(o.quantity),
            filled_quantity=float(o.filled_quantity),
            remaining_quantity=float(o.quantity - o.filled_quantity),
            status=o.status.value,
            created_at=o.created_at,
            updated_at=o.updated_at,
        )
        for o in orders
    ]


@router.delete("/orders/{order_id}", response_model=MessageResponse)
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Cancel an open order.
    Only the owner (same entity) can cancel their orders.
    """
    if not current_user.entity_id:
        raise HTTPException(status_code=400, detail="User must have an entity")

    # Find the order
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    result = await db.execute(
        select(Order).where(Order.id == order_uuid)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify ownership
    if order.entity_id != current_user.entity_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")

    # Check if order can be cancelled
    if order.status not in [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status {order.status.value}")

    # Cancel the order
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    await db.commit()

    return MessageResponse(
        message=f"Order {order_id} cancelled successfully",
        success=True
    )


# ====================
# REAL CEA ORDER BOOK ENDPOINTS
# ====================

@router.get("/cea/orderbook", response_model=OrderBookResponse)
async def get_cea_orderbook(db=Depends(get_db)):
    """
    Get the real CEA order book from database.
    Returns sell orders from registered sellers sorted by price-time priority (FIFO).
    """
    # Fetch real CEA sell orders sorted by price ASC (best price first), then by time ASC (FIFO)
    result = await db.execute(
        select(Order, Seller)
        .join(Seller, Order.seller_id == Seller.id)
        .where(
            and_(
                Order.certificate_type == CertTypeEnum.CEA,
                Order.side == OrderSideEnum.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
            )
        )
        .order_by(Order.price.asc(), Order.created_at.asc())
    )
    orders = result.all()

    # Aggregate orders by price level for display
    price_levels = {}
    for order, seller in orders:
        remaining = float(order.quantity) - float(order.filled_quantity)
        price_key = float(order.price)
        if price_key not in price_levels:
            price_levels[price_key] = {
                "price": price_key,
                "quantity": 0,
                "order_count": 0,
                "cumulative_quantity": 0,
                "seller_codes": []
            }
        price_levels[price_key]["quantity"] += remaining
        price_levels[price_key]["order_count"] += 1
        price_levels[price_key]["seller_codes"].append(seller.client_code)

    # Convert to sorted list and calculate cumulative
    asks = sorted(price_levels.values(), key=lambda x: x["price"])
    cumulative = 0
    for ask in asks:
        cumulative += ask["quantity"]
        ask["cumulative_quantity"] = round(cumulative, 2)
        ask["quantity"] = round(ask["quantity"], 2)

    # Calculate market stats
    best_ask = asks[0]["price"] if asks else None
    last_price = best_ask if best_ask else 63.0  # Default CEA price
    total_volume = sum(a["quantity"] for a in asks)

    return OrderBookResponse(
        certificate_type="CEA",
        bids=[],  # No real bids yet - buyers come from entities
        asks=[OrderBookLevel(
            price=a["price"],
            quantity=a["quantity"],
            order_count=a["order_count"],
            cumulative_quantity=a["cumulative_quantity"]
        ) for a in asks],
        spread=None,
        best_bid=None,
        best_ask=best_ask,
        last_price=last_price,
        volume_24h=total_volume,
        change_24h=random.uniform(-2.0, 2.0),  # Mock 24h change
    )


@router.get("/cea/sellers")
async def get_cea_sellers(db=Depends(get_db)):
    """
    Get all CEA sellers with their available inventory.
    """
    result = await db.execute(
        select(Seller)
        .where(Seller.is_active == True)
        .order_by(Seller.client_code)
    )
    sellers = result.scalars().all()

    return [
        {
            "client_code": s.client_code,
            "name": s.name,
            "company_name": s.company_name,
            "cea_balance": float(s.cea_balance) if s.cea_balance else 0,
            "cea_sold": float(s.cea_sold) if s.cea_sold else 0,
            "total_transactions": s.total_transactions or 0,
        }
        for s in sellers
    ]


@router.post("/cea/buy")
async def buy_cea_fifo(
    amount_eur: float,
    entity_id: str,
    db=Depends(get_db)
):
    """
    Execute a CEA buy order using FIFO price-time priority matching.

    This creates multiple transactions with multiple sellers to fill a single buy order.
    The buyer spends their entire cash balance to buy CEA from all available sellers.

    Algorithm:
    1. Fetch all open CEA sell orders sorted by price ASC (best price), then created_at ASC (FIFO)
    2. Match against orders until buyer's funds are exhausted or no more orders
    3. Create CashMarketTrade for each matched order
    4. Update seller statistics
    """
    # CNY to EUR conversion rate
    CNY_TO_EUR = 0.127

    # Fetch entity to verify balance
    entity_result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
    )
    entity = entity_result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    available_balance = float(entity.balance_amount or 0)
    if available_balance <= 0:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Use the minimum of requested amount and available balance
    spending_amount = min(amount_eur, available_balance)

    # Fetch all open CEA sell orders sorted by price-time priority (FIFO)
    result = await db.execute(
        select(Order, Seller)
        .join(Seller, Order.seller_id == Seller.id)
        .where(
            and_(
                Order.certificate_type == CertTypeEnum.CEA,
                Order.side == OrderSideEnum.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
            )
        )
        .order_by(Order.price.asc(), Order.created_at.asc())
    )
    sell_orders = result.all()

    if not sell_orders:
        raise HTTPException(status_code=400, detail="No CEA sellers available")

    # Execute FIFO matching
    remaining_eur = spending_amount
    trades_executed = []
    total_cea_bought = 0

    for order, seller in sell_orders:
        if remaining_eur <= 0:
            break

        order_price_cny = float(order.price)
        order_price_eur = order_price_cny * CNY_TO_EUR
        remaining_qty = float(order.quantity) - float(order.filled_quantity)

        if remaining_qty <= 0:
            continue

        # Calculate how much we can buy from this order
        max_qty_by_funds = remaining_eur / order_price_eur
        qty_to_buy = min(max_qty_by_funds, remaining_qty)
        cost_eur = qty_to_buy * order_price_eur

        # Create the trade record
        trade = CashMarketTrade(
            buy_order_id=None,  # Will be set if we create a buy order record
            sell_order_id=order.id,
            certificate_type=CertTypeEnum.CEA,
            price=Decimal(str(order_price_cny)),
            quantity=Decimal(str(qty_to_buy)),
            executed_at=datetime.utcnow()
        )
        db.add(trade)

        # Update the sell order
        order.filled_quantity = Decimal(str(float(order.filled_quantity) + qty_to_buy))
        if order.filled_quantity >= order.quantity:
            order.status = OrderStatus.FILLED
        else:
            order.status = OrderStatus.PARTIALLY_FILLED

        # Update seller statistics
        seller.cea_sold = Decimal(str(float(seller.cea_sold or 0) + qty_to_buy))
        seller.total_transactions = (seller.total_transactions or 0) + 1

        # Track the trade
        trades_executed.append({
            "seller_code": seller.client_code,
            "seller_name": seller.name,
            "quantity": round(qty_to_buy, 2),
            "price_cny": round(order_price_cny, 4),
            "price_eur": round(order_price_eur, 4),
            "cost_eur": round(cost_eur, 2),
        })

        remaining_eur -= cost_eur
        total_cea_bought += qty_to_buy

    # Update entity balance
    spent_amount = spending_amount - remaining_eur
    entity.balance_amount = Decimal(str(available_balance - spent_amount))

    await db.commit()

    return {
        "success": True,
        "message": f"Purchased {round(total_cea_bought, 2)} CEA from {len(trades_executed)} sellers",
        "total_cea_bought": round(total_cea_bought, 2),
        "total_spent_eur": round(spent_amount, 2),
        "remaining_balance_eur": round(available_balance - spent_amount, 2),
        "transactions": trades_executed,
    }


# ====================
# NEW REAL TRADING ENDPOINTS
# ====================

@router.get("/real/orderbook/{certificate_type}", response_model=OrderBookResponse)
async def get_real_orderbook_endpoint(
    certificate_type: CertificateType,
    db=Depends(get_db)
):
    """
    Get the real order book from database.
    Returns both bids (buy orders) and asks (sell orders).
    """
    orderbook = await get_real_orderbook(db, certificate_type.value)

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


@router.get("/user/balances")
async def get_user_balances(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Get the current user's asset balances (EUR, CEA, EUA).
    """
    if not current_user.entity_id:
        return {
            "entity_id": None,
            "eur_balance": 0,
            "cea_balance": 0,
            "eua_balance": 0,
        }

    eur_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUR)
    cea_balance = await get_entity_balance(db, current_user.entity_id, AssetType.CEA)
    eua_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUA)

    return {
        "entity_id": str(current_user.entity_id),
        "eur_balance": float(eur_balance),
        "cea_balance": float(cea_balance),
        "eua_balance": float(eua_balance),
    }


@router.post("/order/preview", response_model=OrderPreviewResponse)
async def preview_order(
    request: OrderPreviewRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Preview an order before execution.

    Shows the expected fills, fees, and final cost without placing the order.
    Useful for showing the user what they'll get before they commit.
    """
    if not current_user.entity_id:
        raise HTTPException(status_code=400, detail="User must have an entity to trade")

    # Get available balance
    available_eur = await get_entity_balance(db, current_user.entity_id, AssetType.EUR)

    # Only support BUY for now (CEA market)
    if request.side != OrderSide.BUY:
        raise HTTPException(status_code=400, detail="Only BUY orders are currently supported")

    if request.certificate_type != CertificateType.CEA:
        raise HTTPException(status_code=400, detail="Only CEA trading is currently supported")

    # Convert to Decimal
    amount_eur = Decimal(str(request.amount_eur)) if request.amount_eur else None
    quantity = Decimal(str(request.quantity)) if request.quantity else None
    limit_price = Decimal(str(request.limit_price)) if request.limit_price else None

    # Get preview
    preview = await preview_buy_order(
        db=db,
        entity_id=current_user.entity_id,
        amount_eur=amount_eur,
        quantity=quantity,
        limit_price=limit_price,
        all_or_none=request.all_or_none
    )

    return OrderPreviewResponse(
        certificate_type=request.certificate_type.value,
        side=request.side.value,
        order_type=request.order_type.value,
        amount_eur=float(amount_eur) if amount_eur else None,
        quantity_requested=float(quantity) if quantity else None,
        limit_price=float(limit_price) if limit_price else None,
        all_or_none=request.all_or_none,
        fills=[
            OrderFill(
                seller_code=f.seller_code,
                price=float(f.price_eur),
                quantity=float(f.quantity),
                cost=float(f.cost_eur)
            )
            for f in preview.fills
        ],
        total_quantity=float(preview.total_quantity),
        total_cost_gross=float(preview.total_cost_gross),
        weighted_avg_price=float(preview.weighted_avg_price),
        best_price=float(preview.best_price) if preview.best_price else None,
        worst_price=float(preview.worst_price) if preview.worst_price else None,
        platform_fee_rate=float(PLATFORM_FEE_RATE),
        platform_fee_amount=float(preview.platform_fee_amount),
        total_cost_net=float(preview.total_cost_net),
        net_price_per_unit=float(preview.net_price_per_unit),
        available_balance=float(available_eur),
        remaining_balance=float(available_eur - preview.total_cost_net),
        can_execute=preview.can_execute,
        execution_message=preview.execution_message,
        partial_fill=preview.partial_fill
    )


@router.post("/order/market", response_model=OrderExecutionResponse)
async def execute_market_order(
    request: MarketOrderRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Execute a market order immediately at best available prices.

    Market orders are filled immediately using FIFO price-time priority.
    A 0.5% platform fee is charged on the transaction value.
    """
    if not current_user.entity_id:
        raise HTTPException(status_code=400, detail="User must have an entity to trade")

    # Only support BUY for now
    if request.side != OrderSide.BUY:
        raise HTTPException(status_code=400, detail="Only BUY orders are currently supported")

    if request.certificate_type != CertificateType.CEA:
        raise HTTPException(status_code=400, detail="Only CEA trading is currently supported")

    # Convert to Decimal
    amount_eur = Decimal(str(request.amount_eur)) if request.amount_eur else None
    quantity = Decimal(str(request.quantity)) if request.quantity else None

    # Execute the order
    result = await execute_market_buy_order(
        db=db,
        entity_id=current_user.entity_id,
        user_id=current_user.id,
        amount_eur=amount_eur,
        quantity=quantity,
        all_or_none=request.all_or_none
    )

    return OrderExecutionResponse(
        success=result.success,
        order_id=result.order_id,
        message=result.message,
        certificate_type=request.certificate_type.value,
        side=request.side.value,
        order_type="MARKET",
        total_quantity=float(result.total_quantity),
        total_cost_gross=float(result.total_cost_gross),
        platform_fee=float(result.platform_fee),
        total_cost_net=float(result.total_cost_net),
        weighted_avg_price=float(result.weighted_avg_price),
        trades=[
            OrderFill(
                seller_code=f.seller_code,
                price=float(f.price_eur),
                quantity=float(f.quantity),
                cost=float(f.cost_eur)
            )
            for f in result.fills
        ],
        eur_balance=float(result.eur_balance),
        certificate_balance=float(result.certificate_balance)
    )
