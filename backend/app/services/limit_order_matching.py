"""
Limit Order Matching Service

Provides real-time order matching for limit orders in the cash market.
When a new order is placed, this service checks for crossing orders and
executes trades immediately, ensuring the order book never has negative spread.

Key principles:
- Price-time priority (FIFO): best price first, then oldest order
- Trade price = maker's price (the order already in the book)
- Orders from the same owner cannot match with each other
- Fractional certificates not allowed (integer quantities only)
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_DOWN
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    CashMarketTrade,
    CertificateType,
    Order,
    OrderSide,
    OrderStatus,
    TicketStatus,
)
from app.services.ticket_service import TicketService

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    """Result of a single order match"""
    trade_id: UUID
    counterparty_order_id: UUID
    price: Decimal
    quantity: Decimal
    maker_is_buyer: bool  # True if the existing order (maker) was the buyer


@dataclass
class OrderMatchingResult:
    """Result of attempting to match an incoming order"""
    matches: List[MatchResult]
    total_filled: Decimal
    remaining_quantity: Decimal
    order_status: OrderStatus
    trades_created: int


class LimitOrderMatcher:
    """
    Matches limit orders against the existing order book.

    Called immediately when a new limit order is placed to execute
    any crossing orders and prevent negative spread.
    """

    @staticmethod
    async def match_incoming_order(
        db: AsyncSession,
        incoming_order: Order,
        user_id: Optional[UUID] = None,
    ) -> OrderMatchingResult:
        """
        Match an incoming order against the order book.

        For a BUY order: looks for SELL orders with price <= incoming price
        For a SELL order: looks for BUY orders with price >= incoming price

        Args:
            db: Database session
            incoming_order: The newly placed order to match
            user_id: User ID for audit trail (optional)

        Returns:
            OrderMatchingResult with match details
        """
        matches: List[MatchResult] = []
        total_filled = Decimal("0")
        remaining = incoming_order.quantity - incoming_order.filled_quantity

        if remaining <= 0:
            return OrderMatchingResult(
                matches=[],
                total_filled=Decimal("0"),
                remaining_quantity=Decimal("0"),
                order_status=incoming_order.status,
                trades_created=0,
            )

        # Get contra-side orders that could match
        contra_orders = await LimitOrderMatcher._get_matchable_orders(
            db=db,
            certificate_type=incoming_order.certificate_type,
            incoming_side=incoming_order.side,
            incoming_price=incoming_order.price,
            incoming_order_id=incoming_order.id,
            incoming_entity_id=incoming_order.entity_id,
            incoming_mm_id=incoming_order.market_maker_id,
        )

        if not contra_orders:
            return OrderMatchingResult(
                matches=[],
                total_filled=Decimal("0"),
                remaining_quantity=remaining,
                order_status=incoming_order.status,
                trades_created=0,
            )

        # Match against contra orders
        for contra_order in contra_orders:
            if remaining <= 0:
                break

            contra_remaining = contra_order.quantity - contra_order.filled_quantity
            if contra_remaining <= 0:
                continue

            # Calculate match quantity (integer only)
            match_qty = min(remaining, contra_remaining)
            match_qty = match_qty.quantize(Decimal("1"), rounding=ROUND_DOWN)

            if match_qty <= 0:
                continue

            # Trade price = maker's price (the contra order that was already in book)
            trade_price = contra_order.price

            # Determine buyer and seller
            if incoming_order.side == OrderSide.BUY:
                buy_order = incoming_order
                sell_order = contra_order
                maker_is_buyer = False
            else:
                buy_order = contra_order
                sell_order = incoming_order
                maker_is_buyer = True

            # Create trade record
            trade = CashMarketTrade(
                buy_order_id=buy_order.id,
                sell_order_id=sell_order.id,
                market_maker_id=buy_order.market_maker_id or sell_order.market_maker_id,
                certificate_type=incoming_order.certificate_type,
                price=trade_price,
                quantity=match_qty,
                executed_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            db.add(trade)
            await db.flush()  # Get trade ID

            # Update incoming order
            incoming_order.filled_quantity = incoming_order.filled_quantity + match_qty
            incoming_order.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            # Update contra order
            contra_order.filled_quantity = contra_order.filled_quantity + match_qty
            contra_order.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            # Update order statuses
            if contra_order.filled_quantity >= contra_order.quantity:
                contra_order.status = OrderStatus.FILLED
            else:
                contra_order.status = OrderStatus.PARTIALLY_FILLED

            # Track match
            matches.append(MatchResult(
                trade_id=trade.id,
                counterparty_order_id=contra_order.id,
                price=trade_price,
                quantity=match_qty,
                maker_is_buyer=maker_is_buyer,
            ))

            total_filled += match_qty
            remaining -= match_qty

            logger.info(
                f"Order matched: {match_qty} {incoming_order.certificate_type.value} @ {trade_price} "
                f"(Order {incoming_order.id} <-> Order {contra_order.id})"
            )

        # Update incoming order status
        if incoming_order.filled_quantity >= incoming_order.quantity:
            incoming_order.status = OrderStatus.FILLED
        elif incoming_order.filled_quantity > 0:
            incoming_order.status = OrderStatus.PARTIALLY_FILLED
        # else: remains OPEN

        return OrderMatchingResult(
            matches=matches,
            total_filled=total_filled,
            remaining_quantity=remaining,
            order_status=incoming_order.status,
            trades_created=len(matches),
        )

    @staticmethod
    async def _get_matchable_orders(
        db: AsyncSession,
        certificate_type: CertificateType,
        incoming_side: OrderSide,
        incoming_price: Decimal,
        incoming_order_id: UUID,
        incoming_entity_id: Optional[UUID],
        incoming_mm_id: Optional[UUID],
    ) -> List[Order]:
        """
        Get orders from the contra side that can match with the incoming order.

        For BUY incoming: get SELL orders with price <= incoming_price (sorted ASC)
        For SELL incoming: get BUY orders with price >= incoming_price (sorted DESC)

        Excludes:
        - The incoming order itself
        - Orders from the same entity (if entity_id matches)
        - Orders from the same market maker (if market_maker_id matches)
        """
        if incoming_side == OrderSide.BUY:
            # Looking for SELL orders at or below our buy price
            contra_side = OrderSide.SELL
            price_filter = Order.price <= incoming_price
            order_by = [Order.price.asc(), Order.created_at.asc()]  # Cheapest first
        else:
            # Looking for BUY orders at or above our sell price
            contra_side = OrderSide.BUY
            price_filter = Order.price >= incoming_price
            order_by = [Order.price.desc(), Order.created_at.asc()]  # Highest first

        # Build query
        query = (
            select(Order)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == contra_side,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                    price_filter,
                    Order.id != incoming_order_id,  # Not the same order
                )
            )
            .order_by(*order_by)
        )

        result = await db.execute(query)
        orders = list(result.scalars().all())

        # Filter out orders from the same owner
        filtered_orders = []
        for order in orders:
            # Skip if same entity
            if incoming_entity_id and order.entity_id == incoming_entity_id:
                continue
            # Skip if same market maker
            if incoming_mm_id and order.market_maker_id == incoming_mm_id:
                continue
            filtered_orders.append(order)

        return filtered_orders

    @staticmethod
    async def match_all_crossing_orders(
        db: AsyncSession,
        certificate_type: CertificateType,
    ) -> int:
        """
        Match all crossing orders in the order book for a certificate type.

        This is a bulk matching function that can be called to clean up
        any existing crossing orders (e.g., after a bug fix or migration).

        Returns: number of trades created
        """
        trades_created = 0

        # Get all open BUY orders sorted by price DESC, time ASC
        buy_result = await db.execute(
            select(Order)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.BUY,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
            .order_by(Order.price.desc(), Order.created_at.asc())
        )
        buy_orders = list(buy_result.scalars().all())

        # Get all open SELL orders sorted by price ASC, time ASC
        sell_result = await db.execute(
            select(Order)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.SELL,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
            .order_by(Order.price.asc(), Order.created_at.asc())
        )
        sell_orders = list(sell_result.scalars().all())

        if not buy_orders or not sell_orders:
            return 0

        # Match crossing orders
        for buy_order in buy_orders:
            buy_remaining = buy_order.quantity - buy_order.filled_quantity
            if buy_remaining <= 0:
                continue

            for sell_order in sell_orders:
                # Check if orders can match (buy price >= sell price)
                if buy_order.price < sell_order.price:
                    # No more matches possible for this buy order
                    break

                # Don't match orders from the same owner
                if buy_order.entity_id and buy_order.entity_id == sell_order.entity_id:
                    continue
                if buy_order.market_maker_id and buy_order.market_maker_id == sell_order.market_maker_id:
                    continue

                sell_remaining = sell_order.quantity - sell_order.filled_quantity
                if sell_remaining <= 0:
                    continue

                # Calculate match quantity (integer only)
                match_qty = min(buy_remaining, sell_remaining)
                match_qty = match_qty.quantize(Decimal("1"), rounding=ROUND_DOWN)
                if match_qty <= 0:
                    continue

                # Trade at the maker's price (sell order was first)
                trade_price = sell_order.price

                # Create trade
                trade = CashMarketTrade(
                    buy_order_id=buy_order.id,
                    sell_order_id=sell_order.id,
                    market_maker_id=buy_order.market_maker_id or sell_order.market_maker_id,
                    certificate_type=certificate_type,
                    price=trade_price,
                    quantity=match_qty,
                    executed_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
                db.add(trade)

                # Update buy order
                buy_order.filled_quantity = buy_order.filled_quantity + match_qty
                if buy_order.filled_quantity >= buy_order.quantity:
                    buy_order.status = OrderStatus.FILLED
                else:
                    buy_order.status = OrderStatus.PARTIALLY_FILLED
                buy_order.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

                # Update sell order
                sell_order.filled_quantity = sell_order.filled_quantity + match_qty
                if sell_order.filled_quantity >= sell_order.quantity:
                    sell_order.status = OrderStatus.FILLED
                else:
                    sell_order.status = OrderStatus.PARTIALLY_FILLED
                sell_order.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

                trades_created += 1
                buy_remaining -= match_qty

                logger.info(
                    f"Bulk match: {match_qty} {certificate_type.value} @ {trade_price} "
                    f"(BUY {buy_order.id} <-> SELL {sell_order.id})"
                )

                if buy_remaining <= 0:
                    break

        if trades_created > 0:
            await db.commit()
            logger.info(f"Bulk matching created {trades_created} trades for {certificate_type.value}")

        return trades_created
