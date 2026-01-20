"""
Order Matching Service

FIFO price-time priority matching engine for the Cash Market.
Handles order preview, market orders, and limit orders with proper fee calculations.
"""

from decimal import Decimal
from datetime import datetime
from typing import List, Tuple, Optional
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    Order, Seller, Entity, EntityHolding, AssetTransaction, CashMarketTrade,
    OrderSide, OrderStatus, CertificateType, AssetType, TransactionType
)


# Platform fee rate: 0.5%
PLATFORM_FEE_RATE = Decimal("0.005")

# CNY to EUR conversion rate
CNY_TO_EUR = Decimal("0.127")


@dataclass
class OrderFillResult:
    """Result of a single fill from the order book"""
    order_id: UUID
    seller_code: str
    price: Decimal  # Price in CNY
    price_eur: Decimal  # Price in EUR
    quantity: Decimal
    cost_eur: Decimal


@dataclass
class OrderPreviewResult:
    """Result of order preview calculation"""
    fills: List[OrderFillResult]
    total_quantity: Decimal
    total_cost_gross: Decimal
    weighted_avg_price: Decimal
    best_price: Optional[Decimal]
    worst_price: Optional[Decimal]
    platform_fee_amount: Decimal
    total_cost_net: Decimal
    net_price_per_unit: Decimal
    can_execute: bool
    execution_message: str
    partial_fill: bool


async def get_entity_balance(db: AsyncSession, entity_id: UUID, asset_type: AssetType) -> Decimal:
    """Get entity's balance for a specific asset type"""
    result = await db.execute(
        select(EntityHolding).where(
            and_(
                EntityHolding.entity_id == entity_id,
                EntityHolding.asset_type == asset_type
            )
        )
    )
    holding = result.scalar_one_or_none()
    return Decimal(str(holding.quantity)) if holding else Decimal("0")


async def update_entity_balance(
    db: AsyncSession,
    entity_id: UUID,
    asset_type: AssetType,
    amount: Decimal,
    transaction_type: TransactionType,
    created_by: UUID,
    reference: Optional[str] = None,
    notes: Optional[str] = None
) -> Decimal:
    """
    Update entity balance and create audit trail.
    Returns the new balance.
    """
    # Get or create holding record
    result = await db.execute(
        select(EntityHolding).where(
            and_(
                EntityHolding.entity_id == entity_id,
                EntityHolding.asset_type == asset_type
            )
        )
    )
    holding = result.scalar_one_or_none()

    balance_before = Decimal(str(holding.quantity)) if holding else Decimal("0")
    balance_after = balance_before + amount

    if holding:
        holding.quantity = balance_after
        holding.updated_at = datetime.utcnow()
    else:
        # Create new holding
        holding = EntityHolding(
            entity_id=entity_id,
            asset_type=asset_type,
            quantity=balance_after
        )
        db.add(holding)

    # Create audit trail
    transaction = AssetTransaction(
        entity_id=entity_id,
        asset_type=asset_type,
        transaction_type=transaction_type,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        reference=reference,
        notes=notes,
        created_by=created_by
    )
    db.add(transaction)

    return balance_after


async def get_cea_sell_orders(db: AsyncSession, limit_price: Optional[Decimal] = None) -> List[Order]:
    """
    Get available CEA sell orders sorted by price-time priority (FIFO).

    Includes orders from both legacy Sellers and Market Makers.

    Args:
        db: Database session
        limit_price: Optional maximum price (in CNY) to include

    Returns:
        List of Order objects sorted by price ASC, then created_at ASC
    """
    query = (
        select(Order)
        .where(
            and_(
                Order.certificate_type == CertificateType.CEA,
                Order.side == OrderSide.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                # Include orders from Sellers OR Market Makers
                or_(
                    Order.seller_id.isnot(None),
                    Order.market_maker_id.isnot(None)
                )
            )
        )
    )

    if limit_price is not None:
        query = query.where(Order.price <= limit_price)

    query = query.order_by(Order.price.asc(), Order.created_at.asc())

    result = await db.execute(query)
    return result.scalars().all()


async def preview_buy_order(
    db: AsyncSession,
    entity_id: UUID,
    amount_eur: Optional[Decimal] = None,
    quantity: Optional[Decimal] = None,
    limit_price: Optional[Decimal] = None,
    all_or_none: bool = False
) -> OrderPreviewResult:
    """
    Preview a buy order without executing it.

    Shows how much CEA can be bought with the given EUR amount,
    including fee calculations and price breakdown.

    Args:
        db: Database session
        entity_id: Buyer's entity ID
        amount_eur: EUR amount to spend (mutually exclusive with quantity)
        quantity: CEA quantity to buy (mutually exclusive with amount_eur)
        limit_price: Maximum price in CNY (for limit orders)
        all_or_none: If True, only return fills if entire order can be matched

    Returns:
        OrderPreviewResult with all fill and fee details
    """
    # Get available balance
    available_eur = await get_entity_balance(db, entity_id, AssetType.EUR)

    # Validate inputs
    if amount_eur is None and quantity is None:
        return OrderPreviewResult(
            fills=[],
            total_quantity=Decimal("0"),
            total_cost_gross=Decimal("0"),
            weighted_avg_price=Decimal("0"),
            best_price=None,
            worst_price=None,
            platform_fee_amount=Decimal("0"),
            total_cost_net=Decimal("0"),
            net_price_per_unit=Decimal("0"),
            can_execute=False,
            execution_message="Must specify either amount_eur or quantity",
            partial_fill=False
        )

    # Get sell orders
    sell_orders = await get_cea_sell_orders(db, limit_price)

    if not sell_orders:
        return OrderPreviewResult(
            fills=[],
            total_quantity=Decimal("0"),
            total_cost_gross=Decimal("0"),
            weighted_avg_price=Decimal("0"),
            best_price=None,
            worst_price=None,
            platform_fee_amount=Decimal("0"),
            total_cost_net=Decimal("0"),
            net_price_per_unit=Decimal("0"),
            can_execute=False,
            execution_message="No CEA sellers available",
            partial_fill=False
        )

    # Calculate max gross we can spend (accounting for fees)
    # total_net = total_gross + fee = total_gross * (1 + fee_rate)
    # So: max_gross = available_eur / (1 + fee_rate)
    if amount_eur is not None:
        # Use minimum of requested amount and available balance
        spending_limit_net = min(amount_eur, available_eur)
        max_gross = spending_limit_net / (Decimal("1") + PLATFORM_FEE_RATE)
    else:
        # For quantity-based, we'll calculate as we go
        max_gross = available_eur / (Decimal("1") + PLATFORM_FEE_RATE)

    # Simulate FIFO matching
    fills: List[OrderFillResult] = []
    remaining_budget = max_gross if amount_eur is not None else None
    remaining_qty = quantity
    total_cost_gross = Decimal("0")
    total_quantity = Decimal("0")

    for order in sell_orders:
        if amount_eur is not None and remaining_budget <= Decimal("0"):
            break
        if quantity is not None and remaining_qty <= Decimal("0"):
            break

        order_price_cny = Decimal(str(order.price))
        order_price_eur = order_price_cny * CNY_TO_EUR
        remaining_order_qty = Decimal(str(order.quantity)) - Decimal(str(order.filled_quantity))

        if remaining_order_qty <= Decimal("0"):
            continue

        # Calculate how much we can buy from this order
        if amount_eur is not None:
            # Budget-based: calculate max quantity we can afford
            max_qty_by_funds = remaining_budget / order_price_eur
            qty_to_buy = min(max_qty_by_funds, remaining_order_qty)
        else:
            # Quantity-based: buy up to the requested quantity
            qty_to_buy = min(remaining_qty, remaining_order_qty)
            # But also check if we have enough funds
            cost_for_qty = qty_to_buy * order_price_eur
            fee_for_cost = cost_for_qty * PLATFORM_FEE_RATE
            total_needed = cost_for_qty + fee_for_cost
            if total_needed > available_eur - total_cost_gross - (total_cost_gross * PLATFORM_FEE_RATE):
                # Adjust quantity to what we can afford
                max_gross_remaining = (available_eur - total_cost_gross * (Decimal("1") + PLATFORM_FEE_RATE)) / (Decimal("1") + PLATFORM_FEE_RATE)
                qty_to_buy = min(qty_to_buy, max_gross_remaining / order_price_eur)

        if qty_to_buy <= Decimal("0"):
            continue

        cost_eur = qty_to_buy * order_price_eur

        # Get seller/MM code for display (fetch lazily only when needed)
        # For now, use order ID as code - callers can fetch seller/MM info separately if needed
        seller_code = str(order.seller_id) if order.seller_id else str(order.market_maker_id)

        fills.append(OrderFillResult(
            order_id=order.id,
            seller_code=seller_code,
            price=order_price_cny,
            price_eur=order_price_eur,
            quantity=qty_to_buy,
            cost_eur=cost_eur
        ))

        total_cost_gross += cost_eur
        total_quantity += qty_to_buy

        if amount_eur is not None:
            remaining_budget -= cost_eur
        if quantity is not None:
            remaining_qty -= qty_to_buy

    # Calculate summary
    platform_fee_amount = total_cost_gross * PLATFORM_FEE_RATE
    total_cost_net = total_cost_gross + platform_fee_amount
    weighted_avg_price = (total_cost_gross / total_quantity) if total_quantity > Decimal("0") else Decimal("0")
    net_price_per_unit = (total_cost_net / total_quantity) if total_quantity > Decimal("0") else Decimal("0")

    # Best and worst prices
    best_price = fills[0].price_eur if fills else None
    worst_price = fills[-1].price_eur if fills else None

    # Check all-or-none condition
    partial_fill = False
    if quantity is not None and total_quantity < quantity:
        partial_fill = True
        if all_or_none:
            return OrderPreviewResult(
                fills=fills,
                total_quantity=total_quantity,
                total_cost_gross=total_cost_gross,
                weighted_avg_price=weighted_avg_price,
                best_price=best_price,
                worst_price=worst_price,
                platform_fee_amount=platform_fee_amount,
                total_cost_net=total_cost_net,
                net_price_per_unit=net_price_per_unit,
                can_execute=False,
                execution_message=f"All-or-none: Only {total_quantity:.2f} of {quantity:.2f} CEA available",
                partial_fill=True
            )

    # Check if we can actually execute
    can_execute = total_quantity > Decimal("0") and total_cost_net <= available_eur
    execution_message = "Ready to execute" if can_execute else "Insufficient balance or no matching orders"

    if total_cost_net > available_eur:
        execution_message = f"Insufficient balance: need {total_cost_net:.2f} EUR, have {available_eur:.2f} EUR"
        can_execute = False

    return OrderPreviewResult(
        fills=fills,
        total_quantity=total_quantity,
        total_cost_gross=total_cost_gross,
        weighted_avg_price=weighted_avg_price,
        best_price=best_price,
        worst_price=worst_price,
        platform_fee_amount=platform_fee_amount,
        total_cost_net=total_cost_net,
        net_price_per_unit=net_price_per_unit,
        can_execute=can_execute,
        execution_message=execution_message,
        partial_fill=partial_fill
    )


@dataclass
class OrderExecutionResult:
    """Result of order execution"""
    success: bool
    order_id: Optional[UUID]
    message: str
    fills: List[OrderFillResult]
    total_quantity: Decimal
    total_cost_gross: Decimal
    platform_fee: Decimal
    total_cost_net: Decimal
    weighted_avg_price: Decimal
    eur_balance: Decimal
    certificate_balance: Decimal


async def execute_market_buy_order(
    db: AsyncSession,
    entity_id: UUID,
    user_id: UUID,
    amount_eur: Optional[Decimal] = None,
    quantity: Optional[Decimal] = None,
    all_or_none: bool = False
) -> OrderExecutionResult:
    """
    Execute a market buy order for CEA.

    This is an atomic operation that:
    1. Finds matching sell orders using FIFO
    2. Creates trade records
    3. Updates seller statistics
    4. Updates buyer's balance

    Args:
        db: Database session
        entity_id: Buyer's entity ID
        user_id: User making the trade (for audit)
        amount_eur: EUR amount to spend
        quantity: CEA quantity to buy
        all_or_none: Reject partial fills

    Returns:
        OrderExecutionResult with trade details
    """
    # First preview the order
    preview = await preview_buy_order(
        db=db,
        entity_id=entity_id,
        amount_eur=amount_eur,
        quantity=quantity,
        limit_price=None,  # Market order - no limit
        all_or_none=all_or_none
    )

    if not preview.can_execute:
        return OrderExecutionResult(
            success=False,
            order_id=None,
            message=preview.execution_message,
            fills=[],
            total_quantity=Decimal("0"),
            total_cost_gross=Decimal("0"),
            platform_fee=Decimal("0"),
            total_cost_net=Decimal("0"),
            weighted_avg_price=Decimal("0"),
            eur_balance=await get_entity_balance(db, entity_id, AssetType.EUR),
            certificate_balance=await get_entity_balance(db, entity_id, AssetType.CEA)
        )

    # Create buy order record
    buy_order = Order(
        entity_id=entity_id,
        certificate_type=CertificateType.CEA,
        side=OrderSide.BUY,
        price=Decimal(str(preview.weighted_avg_price / CNY_TO_EUR)),  # Store in CNY
        quantity=preview.total_quantity,
        filled_quantity=preview.total_quantity,
        status=OrderStatus.FILLED
    )
    db.add(buy_order)
    await db.flush()  # Get the order ID

    # Execute trades
    for fill in preview.fills:
        # Get the sell order
        result = await db.execute(
            select(Order).where(Order.id == fill.order_id)
        )
        sell_order = result.scalar_one()

        # Create trade record
        trade = CashMarketTrade(
            buy_order_id=buy_order.id,
            sell_order_id=sell_order.id,
            certificate_type=CertificateType.CEA,
            price=fill.price,
            quantity=fill.quantity,
            executed_at=datetime.utcnow()
        )
        db.add(trade)

        # Update sell order
        sell_order.filled_quantity = Decimal(str(sell_order.filled_quantity)) + fill.quantity
        if sell_order.filled_quantity >= sell_order.quantity:
            sell_order.status = OrderStatus.FILLED
        else:
            sell_order.status = OrderStatus.PARTIALLY_FILLED
        sell_order.updated_at = datetime.utcnow()

        # Update seller stats (only for legacy sellers, not Market Makers)
        if sell_order.seller_id:
            seller_result = await db.execute(
                select(Seller).where(Seller.id == sell_order.seller_id)
            )
            seller = seller_result.scalar_one_or_none()
            if seller:
                seller.cea_sold = Decimal(str(seller.cea_sold or 0)) + fill.quantity
                seller.total_transactions = (seller.total_transactions or 0) + 1

    # Update buyer balances
    # Deduct EUR (total cost + fees)
    new_eur_balance = await update_entity_balance(
        db=db,
        entity_id=entity_id,
        asset_type=AssetType.EUR,
        amount=-preview.total_cost_net,
        transaction_type=TransactionType.TRADE_BUY,
        created_by=user_id,
        reference=str(buy_order.id),
        notes=f"Market buy {preview.total_quantity:.2f} CEA @ avg {preview.weighted_avg_price:.4f} EUR/CEA"
    )

    # Add CEA
    new_cea_balance = await update_entity_balance(
        db=db,
        entity_id=entity_id,
        asset_type=AssetType.CEA,
        amount=preview.total_quantity,
        transaction_type=TransactionType.TRADE_BUY,
        created_by=user_id,
        reference=str(buy_order.id),
        notes=f"Market buy {preview.total_quantity:.2f} CEA"
    )

    await db.commit()

    return OrderExecutionResult(
        success=True,
        order_id=buy_order.id,
        message=f"Successfully purchased {preview.total_quantity:.2f} CEA from {len(preview.fills)} sellers",
        fills=preview.fills,
        total_quantity=preview.total_quantity,
        total_cost_gross=preview.total_cost_gross,
        platform_fee=preview.platform_fee_amount,
        total_cost_net=preview.total_cost_net,
        weighted_avg_price=preview.weighted_avg_price,
        eur_balance=new_eur_balance,
        certificate_balance=new_cea_balance
    )


async def get_real_orderbook(db: AsyncSession, certificate_type: str) -> dict:
    """
    Get the real order book for a certificate type from the database.

    Returns both bids (buy orders from entities) and asks (sell orders from sellers).
    """
    cert_enum = CertificateType.CEA if certificate_type == "CEA" else CertificateType.EUA

    # Get sell orders (asks) - from Sellers
    sell_result = await db.execute(
        select(Order, Seller)
        .join(Seller, Order.seller_id == Seller.id, isouter=True)
        .where(
            and_(
                Order.certificate_type == cert_enum,
                Order.side == OrderSide.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
            )
        )
        .order_by(Order.price.asc(), Order.created_at.asc())
    )
    sell_orders = sell_result.all()

    # Get buy orders (bids) - from Entities
    buy_result = await db.execute(
        select(Order, Entity)
        .join(Entity, Order.entity_id == Entity.id, isouter=True)
        .where(
            and_(
                Order.certificate_type == cert_enum,
                Order.side == OrderSide.BUY,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
            )
        )
        .order_by(Order.price.desc(), Order.created_at.asc())  # Best bid first
    )
    buy_orders = buy_result.all()

    # Aggregate asks by price level
    ask_levels = {}
    for order, seller in sell_orders:
        remaining = float(order.quantity) - float(order.filled_quantity)
        if remaining <= 0:
            continue
        price_key = float(order.price)
        if price_key not in ask_levels:
            ask_levels[price_key] = {
                "price": price_key,
                "quantity": 0,
                "order_count": 0,
            }
        ask_levels[price_key]["quantity"] += remaining
        ask_levels[price_key]["order_count"] += 1

    # Aggregate bids by price level
    bid_levels = {}
    for order, entity in buy_orders:
        remaining = float(order.quantity) - float(order.filled_quantity)
        if remaining <= 0:
            continue
        price_key = float(order.price)
        if price_key not in bid_levels:
            bid_levels[price_key] = {
                "price": price_key,
                "quantity": 0,
                "order_count": 0,
            }
        bid_levels[price_key]["quantity"] += remaining
        bid_levels[price_key]["order_count"] += 1

    # Convert to sorted lists
    asks = sorted(ask_levels.values(), key=lambda x: x["price"])
    bids = sorted(bid_levels.values(), key=lambda x: x["price"], reverse=True)

    # Calculate cumulative quantities
    ask_cumulative = 0
    for ask in asks:
        ask_cumulative += ask["quantity"]
        ask["cumulative_quantity"] = round(ask_cumulative, 2)
        ask["quantity"] = round(ask["quantity"], 2)

    bid_cumulative = 0
    for bid in bids:
        bid_cumulative += bid["quantity"]
        bid["cumulative_quantity"] = round(bid_cumulative, 2)
        bid["quantity"] = round(bid["quantity"], 2)

    # Market stats
    best_ask = asks[0]["price"] if asks else None
    best_bid = bids[0]["price"] if bids else None
    spread = round(best_ask - best_bid, 4) if best_ask and best_bid else None
    last_price = best_ask or best_bid or (63.0 if certificate_type == "CEA" else 81.0)

    total_ask_volume = sum(a["quantity"] for a in asks)
    total_bid_volume = sum(b["quantity"] for b in bids)

    return {
        "certificate_type": certificate_type,
        "bids": bids,
        "asks": asks,
        "spread": spread,
        "best_bid": best_bid,
        "best_ask": best_ask,
        "last_price": last_price,
        "volume_24h": total_ask_volume + total_bid_volume,
        "change_24h": 0.0,  # Would need historical data
    }
