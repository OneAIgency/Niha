"""Admin Market Orders API - Place/cancel orders on behalf of Market Makers"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

# Price step for CEA cash market (0.1 EUR)
PRICE_STEP = Decimal("0.1")


def validate_price_step(price: Decimal) -> bool:
    """
    Validate that price respects the quote step of 0.1 EUR.
    Returns True if price is a valid multiple of 0.1.
    """
    remainder = price % PRICE_STEP
    return remainder == Decimal("0")

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import (
    CertificateType,
    Entity,
    MarketMakerClient,
    Order,
    OrderSide,
    OrderStatus,
    TicketStatus,
    TransactionType,
    User,
)
from ...schemas.schemas import (
    OrderBookLevel,
    OrderBookResponse,
)
from ...services.limit_order_matching import LimitOrderMatcher
from ...services.market_maker_service import MarketMakerService
from ...services.order_service import determine_order_market
from ...services.ticket_service import TicketService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-orders", tags=["Admin Market Orders"])


# Request/Response Models
class AdminOrderCreate(BaseModel):
    """Request to create order on behalf of Market Maker"""

    market_maker_id: UUID
    certificate_type: str = Field(..., pattern="^(EUA|CEA)$")
    side: str = Field(..., pattern="^(BID|ASK)$")  # BID (buy) or ASK (sell) orders
    price: float = Field(..., gt=0)
    quantity: float = Field(..., gt=0)


class AdminOrderResponse(BaseModel):
    """Response after creating order"""

    order_id: UUID
    ticket_id: str
    message: str
    locked_amount: float
    balance_after: float
    # Matching info
    trades_matched: int = 0
    filled_quantity: float = 0.0
    remaining_quantity: float = 0.0
    order_status: str = "OPEN"


class MarketMakerOrderResponse(BaseModel):
    """Order details with MM info"""

    id: UUID
    market_maker_id: UUID
    market_maker_name: str
    certificate_type: str
    side: str
    price: float
    quantity: float
    filled_quantity: float
    remaining_quantity: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    ticket_id: Optional[str]


class AllOrderResponse(BaseModel):
    """Order details for any order (entity or market maker)"""

    id: UUID
    entity_id: Optional[UUID] = None
    entity_name: Optional[str] = None
    market_maker_id: Optional[UUID] = None
    market_maker_name: Optional[str] = None
    certificate_type: str
    side: str
    price: float
    quantity: float
    filled_quantity: float
    remaining_quantity: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    ticket_id: Optional[str]
    order_type: str  # "entity" or "market_maker"


@router.get("/orderbook/{certificate_type}", response_model=OrderBookResponse)
async def get_orderbook_replica(
    certificate_type: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get order book replica showing all open orders.
    Admin-only endpoint for monitoring market state.

    Returns real-time view of all buy/sell orders from all participants
    (regular entities, sellers, and market makers).
    """
    # Validate certificate type
    try:
        cert_type = CertificateType(certificate_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
        ) from e

    # Fetch SELL orders (asks) sorted by price ASC, then created_at ASC (FIFO)
    sell_result = await db.execute(
        select(Order)
        .where(
            and_(
                Order.certificate_type == cert_type,
                Order.side == OrderSide.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            )
        )
        .order_by(Order.price.asc(), Order.created_at.asc())
    )
    sell_orders = sell_result.scalars().all()

    # Fetch BUY orders (bids) sorted by price DESC, then created_at ASC (FIFO)
    buy_result = await db.execute(
        select(Order)
        .where(
            and_(
                Order.certificate_type == cert_type,
                Order.side == OrderSide.BUY,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            )
        )
        .order_by(Order.price.desc(), Order.created_at.asc())
    )
    buy_orders = buy_result.scalars().all()

    # Aggregate SELL orders by price level
    ask_levels = {}
    for order in sell_orders:
        remaining = float(order.quantity) - float(order.filled_quantity)
        price_key = float(order.price)
        if price_key not in ask_levels:
            ask_levels[price_key] = {
                "price": price_key,
                "quantity": 0,
                "order_count": 0,
                "cumulative_quantity": 0,
            }
        ask_levels[price_key]["quantity"] += remaining
        ask_levels[price_key]["order_count"] += 1

    # Aggregate BUY orders by price level
    bid_levels = {}
    for order in buy_orders:
        remaining = float(order.quantity) - float(order.filled_quantity)
        price_key = float(order.price)
        if price_key not in bid_levels:
            bid_levels[price_key] = {
                "price": price_key,
                "quantity": 0,
                "order_count": 0,
                "cumulative_quantity": 0,
            }
        bid_levels[price_key]["quantity"] += remaining
        bid_levels[price_key]["order_count"] += 1

    # Convert to sorted lists and calculate cumulative
    asks = sorted(ask_levels.values(), key=lambda x: x["price"])
    cumulative_ask = 0
    for ask in asks:
        cumulative_ask += ask["quantity"]
        ask["cumulative_quantity"] = round(cumulative_ask, 2)
        ask["quantity"] = round(ask["quantity"], 2)

    bids = sorted(bid_levels.values(), key=lambda x: x["price"], reverse=True)
    cumulative_bid = 0
    for bid in bids:
        cumulative_bid += bid["quantity"]
        bid["cumulative_quantity"] = round(cumulative_bid, 2)
        bid["quantity"] = round(bid["quantity"], 2)

    # Calculate market stats
    best_ask = asks[0]["price"] if asks else None
    best_bid = bids[0]["price"] if bids else None
    spread = round(best_ask - best_bid, 4) if best_ask and best_bid else None
    last_price = best_ask if best_ask else (best_bid if best_bid else 0)

    # Calculate 24h volume (mock for now)
    total_volume = sum(a["quantity"] for a in asks) + sum(b["quantity"] for b in bids)

    return OrderBookResponse(
        certificate_type=certificate_type,
        bids=[OrderBookLevel(**b) for b in bids],
        asks=[OrderBookLevel(**a) for a in asks],
        spread=spread,
        best_bid=best_bid,
        best_ask=best_ask,
        last_price=last_price,
        volume_24h=total_volume,
        change_24h=0.0,  # Mock 24h change
    )


@router.get("/all", response_model=List[AllOrderResponse])
async def list_all_orders(
    certificate_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(100, ge=1, le=500),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    List ALL orders (both entity orders and market maker orders).
    Admin-only endpoint.

    This endpoint provides a unified view of all orders in the system,
    matching what's shown in the aggregated order book.

    Filters:
    - certificate_type: Filter by EUA or CEA
    - status: Filter by OPEN, FILLED, CANCELLED, etc.
    """
    from sqlalchemy.orm import selectinload

    # Build base query for all orders
    query = select(Order)

    # Apply certificate type filter
    if certificate_type:
        try:
            cert_type = CertificateType(certificate_type)
            query = query.where(Order.certificate_type == cert_type)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
            ) from e

    # Apply status filter
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid status: {status}"
            ) from e

    # Order by most recent first
    query = query.order_by(Order.created_at.desc())

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    orders = result.scalars().all()

    # Fetch related entities and market makers
    entity_ids = [o.entity_id for o in orders if o.entity_id]
    mm_ids = [o.market_maker_id for o in orders if o.market_maker_id]

    # Fetch entities
    entities_map = {}
    if entity_ids:
        entity_result = await db.execute(
            select(Entity).where(Entity.id.in_(entity_ids))
        )
        for entity in entity_result.scalars().all():
            entities_map[entity.id] = entity

    # Fetch market makers
    mm_map = {}
    if mm_ids:
        mm_result = await db.execute(
            select(MarketMakerClient).where(MarketMakerClient.id.in_(mm_ids))
        )
        for mm in mm_result.scalars().all():
            mm_map[mm.id] = mm

    # Build response
    response_orders = []
    for order in orders:
        entity = entities_map.get(order.entity_id) if order.entity_id else None
        mm = mm_map.get(order.market_maker_id) if order.market_maker_id else None

        order_type = "market_maker" if order.market_maker_id else "entity"

        response_orders.append(
            AllOrderResponse(
                id=order.id,
                entity_id=order.entity_id,
                entity_name=entity.legal_name if entity else None,
                market_maker_id=order.market_maker_id,
                market_maker_name=mm.name if mm else None,
                certificate_type=order.certificate_type.value,
                side=order.side.value,
                price=float(order.price),
                quantity=float(order.quantity),
                filled_quantity=float(order.filled_quantity),
                remaining_quantity=float(order.quantity - order.filled_quantity),
                status=order.status.value,
                created_at=order.created_at,
                updated_at=order.updated_at,
                ticket_id=order.ticket_id,
                order_type=order_type,
            )
        )

    return response_orders


@router.post("", response_model=AdminOrderResponse)
async def create_market_order(
    data: AdminOrderCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Admin places BID (buy) or ASK (sell) order on behalf of Market Maker.

    Process:
    1. Validate MM exists and is active
    2. Map side: BID→BUY, ASK→SELL
    3. For ASK: Check certificate balance, lock via TRADE_DEBIT
    4. For BID: Calculate notional EUR cost (no balance check for now)
    5. Create order in database
    6. Create audit ticket

    The order appears in the order book and can be matched using FIFO.
    """
    # Validate MM exists and is active
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == data.market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    if not mm.is_active:
        raise HTTPException(status_code=400, detail="Market Maker is inactive")

    # Validate certificate type
    try:
        cert_type = CertificateType(data.certificate_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid certificate_type: {data.certificate_type}"
        ) from e

    # Map frontend side (BID/ASK) to backend OrderSide (BUY/SELL)
    if data.side == "BID":
        order_side = OrderSide.BUY
        side_display = "BUY"
    elif data.side == "ASK":
        order_side = OrderSide.SELL
        side_display = "SELL"
    else:
        raise HTTPException(status_code=400, detail=f"Invalid side: {data.side}")

    # Convert to Decimal
    price = Decimal(str(data.price))
    quantity = Decimal(str(data.quantity))

    # Validate price step (0.1 EUR)
    if not validate_price_step(price):
        raise HTTPException(
            status_code=400,
            detail=f"Price must be a multiple of {PRICE_STEP} EUR. Got {data.price}, expected values like 9.30, 9.40, 9.50, etc."
        )

    # Balance validation and asset locking (only for ASK/SELL orders)
    trans_ticket_id = None
    locked_amount = 0.0
    balance_after = 0.0

    if order_side == OrderSide.SELL:
        # ASK order: Check certificate balance and lock assets
        has_sufficient = await MarketMakerService.validate_sufficient_balance(
            db=db,
            market_maker_id=data.market_maker_id,
            certificate_type=cert_type,
            required_amount=quantity,
        )

        if not has_sufficient:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {cert_type.value} balance for this ASK order",
            )

        # Get current balance before locking
        balances = await MarketMakerService.get_balances(db, data.market_maker_id)
        balances[cert_type.value]["available"]

        # Lock assets via TRADE_DEBIT transaction
        transaction, trans_ticket_id = await MarketMakerService.create_transaction(
            db=db,
            market_maker_id=data.market_maker_id,
            certificate_type=cert_type,
            transaction_type=TransactionType.TRADE_DEBIT,
            amount=-quantity,  # Negative for debit
            notes=f"Lock {quantity} {cert_type.value} for ASK order at {price}",
            created_by_id=admin_user.id,
        )
        locked_amount = float(quantity)
        balance_after = float(transaction.balance_after)
    else:
        # BID order: No asset locking (EUR balance tracking not implemented for MMs yet)
        # The order will sit in the order book but won't be automatically matched
        # until matching engine is updated to include MM orders
        locked_amount = 0.0
        balance_after = 0.0

    # Create the order
    order = Order(
        market=determine_order_market(market_maker=mm),
        market_maker_id=data.market_maker_id,
        certificate_type=cert_type,
        side=order_side,
        price=price,
        quantity=quantity,
        filled_quantity=Decimal("0"),
        status=OrderStatus.OPEN,
        ticket_id=trans_ticket_id,  # Link to transaction ticket (None for BID orders)
    )
    db.add(order)
    await db.flush()

    # Create audit ticket for order creation
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_ORDER_PLACED",
        entity_type="Order",
        entity_id=order.id,
        status=TicketStatus.SUCCESS,
        user_id=admin_user.id,
        market_maker_id=data.market_maker_id,
        request_payload={
            "market_maker_id": str(data.market_maker_id),
            "certificate_type": data.certificate_type,
            "side": data.side,
            "price": float(price),
            "quantity": float(quantity),
        },
        after_state={
            "order_id": str(order.id),
            "status": order.status.value,
            "order_side": order_side.value,
            "transaction_ticket_id": trans_ticket_id,
        },
        tags=["market_maker", "order", side_display.lower()],
    )

    # Update order with ticket_id
    order.ticket_id = ticket.ticket_id

    # Try to match the order against the book immediately
    # This ensures we never have crossing orders (negative spread)
    match_result = await LimitOrderMatcher.match_incoming_order(
        db=db,
        incoming_order=order,
        user_id=admin_user.id,
    )

    await db.commit()
    await db.refresh(order)

    match_info = ""
    if match_result.trades_created > 0:
        match_info = f" | Matched {match_result.trades_created} trade(s), filled {match_result.total_filled}"

    logger.info(
        f"Admin {admin_user.email} placed {side_display} order for MM {mm.name}: "
        f"{quantity} {cert_type.value} at {price}{match_info}"
    )

    # Build message with match info
    message = f"{side_display} order placed: {quantity} {cert_type.value} at {price}"
    if match_result.trades_created > 0:
        message += f" | {match_result.trades_created} trade(s) executed, {match_result.total_filled} filled"

    return AdminOrderResponse(
        order_id=order.id,
        ticket_id=ticket.ticket_id,
        message=message,
        locked_amount=locked_amount,
        balance_after=balance_after,
        trades_matched=match_result.trades_created,
        filled_quantity=float(match_result.total_filled),
        remaining_quantity=float(match_result.remaining_quantity),
        order_status=order.status.value,
    )


@router.get("", response_model=List[MarketMakerOrderResponse])
async def list_market_maker_orders(
    market_maker_id: Optional[UUID] = None,
    certificate_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(50, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    List orders placed by Market Makers.
    Admin-only endpoint.

    Filters:
    - market_maker_id: Filter by specific MM
    - certificate_type: Filter by EUA or CEA
    - status: Filter by OPEN, FILLED, CANCELLED, etc.
    """
    # Build query
    query = (
        select(Order, MarketMakerClient)
        .join(MarketMakerClient, Order.market_maker_id == MarketMakerClient.id)
        .where(
            Order.market_maker_id.isnot(None)  # Only MM orders
        )
    )

    # Apply filters
    if market_maker_id:
        query = query.where(Order.market_maker_id == market_maker_id)

    if certificate_type:
        try:
            cert_type = CertificateType(certificate_type)
            query = query.where(Order.certificate_type == cert_type)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
            ) from e

    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid status: {status}"
            ) from e

    # Order by most recent first
    query = query.order_by(Order.created_at.desc())

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    orders = result.all()

    return [
        MarketMakerOrderResponse(
            id=order.id,
            market_maker_id=order.market_maker_id,
            market_maker_name=mm.name,
            certificate_type=order.certificate_type.value,
            side=order.side.value,
            price=float(order.price),
            quantity=float(order.quantity),
            filled_quantity=float(order.filled_quantity),
            remaining_quantity=float(order.quantity - order.filled_quantity),
            status=order.status.value,
            created_at=order.created_at,
            updated_at=order.updated_at,
            ticket_id=order.ticket_id,
        )
        for order, mm in orders
    ]


@router.delete("/{order_id}", response_model=dict)
async def cancel_market_order(
    order_id: UUID,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Admin cancels Market Maker order and releases locked assets (for ASK orders).

    Process:
    1. Validate order exists and belongs to MM
    2. Check order can be cancelled (OPEN or PARTIALLY_FILLED)
    3. For ASK orders: Release locked assets via TRADE_CREDIT transaction
    4. For BID orders: No assets to release
    5. Update order status to CANCELLED
    6. Create audit ticket
    """
    # Find the order
    result = await db.execute(
        select(Order, MarketMakerClient)
        .join(MarketMakerClient, Order.market_maker_id == MarketMakerClient.id)
        .where(Order.id == order_id)
    )
    order_data = result.first()

    if not order_data:
        raise HTTPException(status_code=404, detail="Order not found")

    order, mm = order_data

    # Verify it's a MM order
    if not order.market_maker_id:
        raise HTTPException(
            status_code=400, detail="Order does not belong to a Market Maker"
        )

    # Check if order can be cancelled
    if order.status not in [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status {order.status.value}",
        )

    # Calculate remaining quantity to release
    remaining_quantity = order.quantity - order.filled_quantity

    # Release locked assets via TRADE_CREDIT transaction (only for SELL/ASK orders)
    trans_ticket_id = None
    if order.side == OrderSide.SELL and remaining_quantity > 0:
        transaction, trans_ticket_id = await MarketMakerService.create_transaction(
            db=db,
            market_maker_id=order.market_maker_id,
            certificate_type=order.certificate_type,
            transaction_type=TransactionType.TRADE_CREDIT,
            amount=remaining_quantity,  # Positive for credit
            notes=(
                f"Release {remaining_quantity} {order.certificate_type.value} "
                f"from cancelled ASK order {order.id}"
            ),
            created_by_id=admin_user.id,
        )

    # Capture before state
    before_state = {
        "order_id": str(order.id),
        "side": order.side.value,
        "status": order.status.value,
        "remaining_quantity": float(remaining_quantity),
    }

    # Cancel the order
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()

    # Capture after state
    after_state = {
        "order_id": str(order.id),
        "status": order.status.value,
        "remaining_quantity": 0,
        "release_ticket_id": trans_ticket_id,
    }

    # Create audit ticket
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_ORDER_CANCELLED",
        entity_type="Order",
        entity_id=order.id,
        status=TicketStatus.SUCCESS,
        user_id=admin_user.id,
        market_maker_id=order.market_maker_id,
        before_state=before_state,
        after_state=after_state,
        tags=["market_maker", "order", "cancel"],
    )

    await db.commit()

    side_display = "BID" if order.side == OrderSide.BUY else "ASK"
    log_message = (
        f"Admin {admin_user.email} cancelled {side_display} order "
        f"{order.id} for MM {mm.name}"
    )
    if order.side == OrderSide.SELL:
        log_message += f": released {remaining_quantity} {order.certificate_type.value}"
    logger.info(log_message)

    return {
        "ticket_id": ticket.ticket_id,
        "message": f"Order {order.id} cancelled successfully",
        "released_amount": float(remaining_quantity)
        if order.side == OrderSide.SELL
        else 0.0,
        "release_ticket_id": trans_ticket_id,
    }


@router.post("/match-crossing/{certificate_type}", response_model=dict)
async def match_crossing_orders(
    certificate_type: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Manually trigger matching of all crossing orders in the order book.

    This endpoint should be called to clean up any existing crossing orders
    (orders where bid price >= ask price) that weren't matched automatically.

    In a properly functioning market, this should return 0 trades as all
    crossing orders should be matched immediately upon placement.
    """
    try:
        cert_type = CertificateType(certificate_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
        ) from e

    trades_created = await LimitOrderMatcher.match_all_crossing_orders(
        db=db,
        certificate_type=cert_type,
    )

    logger.info(
        f"Admin {admin_user.email} triggered crossing order matching for {certificate_type}: "
        f"{trades_created} trades created"
    )

    return {
        "certificate_type": certificate_type,
        "trades_created": trades_created,
        "message": f"Matched {trades_created} crossing order(s)" if trades_created > 0 else "No crossing orders found",
    }


@router.post("/cleanup-dust/{certificate_type}", response_model=dict)
async def cleanup_dust_orders(
    certificate_type: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Clean up "dust" orders - orders with remaining quantity < 1 certificate.

    These fractional remainders can cause display issues (negative spread)
    when they appear in the order book but can't actually be matched.

    Marks such orders as FILLED since the fractional remainder is negligible.
    """
    from decimal import Decimal

    try:
        cert_type = CertificateType(certificate_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
        ) from e

    # Find orders with remaining < 1
    result = await db.execute(
        select(Order)
        .where(
            and_(
                Order.certificate_type == cert_type,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                (Order.quantity - Order.filled_quantity) < Decimal("1"),
                (Order.quantity - Order.filled_quantity) > Decimal("0"),
            )
        )
    )
    dust_orders = list(result.scalars().all())

    cleaned_count = 0
    for order in dust_orders:
        remaining = order.quantity - order.filled_quantity
        # Mark as filled (set filled_quantity = quantity)
        order.filled_quantity = order.quantity
        order.status = OrderStatus.FILLED
        order.updated_at = datetime.utcnow()
        cleaned_count += 1
        logger.info(
            f"Cleaned dust order {order.id}: {order.side.value} {remaining} {cert_type.value} @ {order.price}"
        )

    if cleaned_count > 0:
        await db.commit()

    logger.info(
        f"Admin {admin_user.email} cleaned up {cleaned_count} dust orders for {certificate_type}"
    )

    return {
        "certificate_type": certificate_type,
        "orders_cleaned": cleaned_count,
        "message": f"Cleaned {cleaned_count} dust order(s)" if cleaned_count > 0 else "No dust orders found",
    }
