"""Admin Market Orders API - Place/cancel orders on behalf of Market Makers"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import (
    User, MarketMakerClient, AssetTransaction, CertificateType,
    TransactionType, Order, OrderStatus, OrderSide, TicketStatus
)
from ...schemas.schemas import (
    OrderResponse, OrderBookResponse, OrderBookLevel, MessageResponse
)
from ...services.market_maker_service import MarketMakerService
from ...services.ticket_service import TicketService
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-orders", tags=["Admin Market Orders"])


# Request/Response Models
class AdminOrderCreate(BaseModel):
    """Request to create order on behalf of Market Maker"""
    market_maker_id: UUID
    certificate_type: str = Field(..., pattern="^(EUA|CEA)$")
    side: str = Field(..., pattern="^SELL$")  # Only SELL orders allowed for MMs
    price: float = Field(..., gt=0)
    quantity: float = Field(..., gt=0)


class AdminOrderResponse(BaseModel):
    """Response after creating order"""
    order_id: UUID
    ticket_id: str
    message: str
    locked_amount: float
    balance_after: float


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


@router.get("/orderbook/{certificate_type}", response_model=OrderBookResponse)
async def get_orderbook_replica(
    certificate_type: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
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
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid certificate_type: {certificate_type}")

    # Fetch SELL orders (asks) sorted by price ASC, then created_at ASC (FIFO)
    sell_result = await db.execute(
        select(Order)
        .where(
            and_(
                Order.certificate_type == cert_type,
                Order.side == OrderSide.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
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
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
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


@router.post("", response_model=AdminOrderResponse)
async def create_market_order(
    data: AdminOrderCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin places SELL order on behalf of Market Maker.

    Process:
    1. Validate MM exists and is active
    2. Check sufficient balance for certificate type
    3. Lock assets via TRADE_DEBIT transaction
    4. Create order in database
    5. Create audit ticket

    Only SELL orders are allowed. The order appears in public order book
    and can be matched by any buyer using FIFO matching.
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
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid certificate_type: {data.certificate_type}")

    # Validate side (only SELL allowed)
    if data.side != "SELL":
        raise HTTPException(status_code=400, detail="Only SELL orders are allowed for Market Makers")

    # Convert to Decimal
    price = Decimal(str(data.price))
    quantity = Decimal(str(data.quantity))

    # Check sufficient balance
    has_sufficient = await MarketMakerService.validate_sufficient_balance(
        db=db,
        market_maker_id=data.market_maker_id,
        certificate_type=cert_type,
        required_amount=quantity,
    )

    if not has_sufficient:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {cert_type.value} balance for this order"
        )

    # Get current balance before locking
    balances = await MarketMakerService.get_balances(db, data.market_maker_id)
    balance_before = balances[cert_type.value]["available"]

    # Lock assets via TRADE_DEBIT transaction
    transaction, trans_ticket_id = await MarketMakerService.create_transaction(
        db=db,
        market_maker_id=data.market_maker_id,
        certificate_type=cert_type,
        transaction_type=TransactionType.TRADE_DEBIT,
        amount=-quantity,  # Negative for debit
        notes=f"Lock {quantity} {cert_type.value} for SELL order at {price}",
        created_by_id=admin_user.id,
    )

    # Create the order
    order = Order(
        market_maker_id=data.market_maker_id,
        certificate_type=cert_type,
        side=OrderSide.SELL,
        price=price,
        quantity=quantity,
        filled_quantity=Decimal('0'),
        status=OrderStatus.OPEN,
        ticket_id=trans_ticket_id,  # Link to transaction ticket
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
            "transaction_ticket_id": trans_ticket_id,
        },
        tags=["market_maker", "order", "sell"],
    )

    # Update order with ticket_id
    order.ticket_id = ticket.ticket_id

    await db.commit()
    await db.refresh(order)
    await db.refresh(transaction)

    logger.info(
        f"Admin {admin_user.email} placed SELL order for MM {mm.name}: "
        f"{quantity} {cert_type.value} at {price}"
    )

    return AdminOrderResponse(
        order_id=order.id,
        ticket_id=ticket.ticket_id,
        message=f"SELL order placed: {quantity} {cert_type.value} at {price}",
        locked_amount=float(quantity),
        balance_after=float(transaction.balance_after),
    )


@router.get("", response_model=List[MarketMakerOrderResponse])
async def list_market_maker_orders(
    market_maker_id: Optional[UUID] = None,
    certificate_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
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
    query = select(Order, MarketMakerClient).join(
        MarketMakerClient, Order.market_maker_id == MarketMakerClient.id
    ).where(
        Order.market_maker_id.isnot(None)  # Only MM orders
    )

    # Apply filters
    if market_maker_id:
        query = query.where(Order.market_maker_id == market_maker_id)

    if certificate_type:
        try:
            cert_type = CertificateType(certificate_type)
            query = query.where(Order.certificate_type == cert_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid certificate_type: {certificate_type}")

    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

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
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin cancels Market Maker order and releases locked assets.

    Process:
    1. Validate order exists and belongs to MM
    2. Check order can be cancelled (OPEN or PARTIALLY_FILLED)
    3. Release locked assets via TRADE_CREDIT transaction
    4. Update order status to CANCELLED
    5. Create audit ticket
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
        raise HTTPException(status_code=400, detail="Order does not belong to a Market Maker")

    # Check if order can be cancelled
    if order.status not in [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status {order.status.value}"
        )

    # Calculate remaining quantity to release
    remaining_quantity = order.quantity - order.filled_quantity

    # Release locked assets via TRADE_CREDIT transaction
    if remaining_quantity > 0:
        transaction, trans_ticket_id = await MarketMakerService.create_transaction(
            db=db,
            market_maker_id=order.market_maker_id,
            certificate_type=order.certificate_type,
            transaction_type=TransactionType.TRADE_CREDIT,
            amount=remaining_quantity,  # Positive for credit
            notes=f"Release {remaining_quantity} {order.certificate_type.value} from cancelled order {order.id}",
            created_by_id=admin_user.id,
        )
    else:
        trans_ticket_id = None

    # Capture before state
    before_state = {
        "order_id": str(order.id),
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

    logger.info(
        f"Admin {admin_user.email} cancelled order {order.id} for MM {mm.name}: "
        f"released {remaining_quantity} {order.certificate_type.value}"
    )

    return {
        "ticket_id": ticket.ticket_id,
        "message": f"Order {order.id} cancelled successfully",
        "released_amount": float(remaining_quantity),
        "release_ticket_id": trans_ticket_id,
    }
