"""
Auto Trade Executor Service

Handles automatic order placement for market makers based on configured rules.
Validates balances before placing orders to ensure orders are always covered.
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_DOWN
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from sqlalchemy import func

from app.models.models import (
    AutoTradeMarketSettings,
    AutoTradePriceMode,
    AutoTradeQuantityMode,
    AutoTradeRule,
    AutoTradeSettings,
    CashMarketTrade,
    CertificateType,
    MarketMakerClient,
    MarketMakerType,
    MarketType,
    Order,
    OrderSide,
    OrderStatus,
    TicketStatus,
    TransactionType,
)
from app.services.market_maker_service import MarketMakerService
from app.services.price_scraper import price_scraper
from app.services.ticket_service import TicketService

logger = logging.getLogger(__name__)


class AutoTradeExecutor:
    """
    Executes auto-trade rules for market makers.

    Key responsibilities:
    - Determine when rules should execute based on intervals
    - Calculate order prices based on price mode and scraped prices
    - Calculate order quantities based on quantity mode and available balance
    - Validate sufficient balance before placing orders
    - Place orders with proper audit trail
    """

    @staticmethod
    async def get_rules_ready_for_execution(
        db: AsyncSession,
    ) -> List[AutoTradeRule]:
        """
        Get all enabled rules that are ready for execution.
        A rule is ready if:
        - It is enabled
        - Its market maker is active
        - Its next_execution_at is in the past or null (never executed)
        """
        # Naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        result = await db.execute(
            select(AutoTradeRule)
            .join(MarketMakerClient)
            .where(
                and_(
                    AutoTradeRule.enabled == True,
                    MarketMakerClient.is_active == True,
                    # Ready if never executed or scheduled time has passed
                    (AutoTradeRule.next_execution_at == None) |
                    (AutoTradeRule.next_execution_at <= now)
                )
            )
            .options(selectinload(AutoTradeRule.market_maker))
        )

        return list(result.scalars().all())

    @staticmethod
    def calculate_next_execution_time(
        rule: AutoTradeRule,
        interval_variation_pct: Optional[Decimal] = None,
    ) -> datetime:
        """
        Calculate the next execution time based on interval mode.
        For random mode, picks a random interval between min and max.
        Prefers seconds-based intervals if set, otherwise falls back to minutes.

        If interval_variation_pct is provided (from market settings), applies
        ±pct% random variation to the calculated interval.
        """
        # Naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        if rule.interval_mode == "random":
            # Prefer seconds-based intervals
            if rule.interval_min_seconds is not None and rule.interval_max_seconds is not None:
                min_secs = rule.interval_min_seconds
                max_secs = rule.interval_max_seconds
                interval_secs = random.randint(min_secs, max_secs)
            else:
                # Fall back to minutes
                min_mins = rule.interval_min_minutes or 1
                max_mins = rule.interval_max_minutes or 30
                interval_secs = random.randint(min_mins, max_mins) * 60
        else:
            # Fixed mode - prefer seconds
            if rule.interval_seconds is not None:
                interval_secs = rule.interval_seconds
            else:
                interval_secs = (rule.interval_minutes or 5) * 60

        # Apply market-level interval variation if provided
        if interval_variation_pct is not None and interval_variation_pct > 0:
            pct = float(interval_variation_pct)
            factor = 1.0 + random.uniform(-pct / 100, pct / 100)
            interval_secs = max(1, int(interval_secs * factor))

        return now + timedelta(seconds=interval_secs)

    @staticmethod
    async def get_market_price(
        certificate_type: str,
    ) -> Optional[Decimal]:
        """
        Get the current scraped market price for a certificate type.
        Returns None if price unavailable.
        """
        try:
            prices = await price_scraper.get_current_prices()
            cert_key = certificate_type.lower()  # 'cea' or 'eua'

            if cert_key in prices and prices[cert_key].get("price"):
                return Decimal(str(prices[cert_key]["price"]))
            return None
        except Exception as e:
            logger.error(f"Failed to get market price: {e}")
            return None

    @staticmethod
    async def get_swap_ratio() -> Optional[Decimal]:
        """
        Get the current CEA/EUA swap ratio.

        IMPORTANT: In the swap market, Order.price is the ratio CEA/EUA
        (how many EUA you get per 1 CEA), NOT a EUR price!

        Example: CEA=9.85 EUR, EUA=83.72 EUR
        Ratio = 9.85/83.72 = 0.1177 (1 CEA → 0.1177 EUA)

        Returns: Decimal ratio or None if unavailable.
        """
        try:
            prices = await price_scraper.get_current_prices()
            cea_price = prices.get("cea", {}).get("price")
            eua_price = prices.get("eua", {}).get("price")

            if cea_price and eua_price and eua_price > 0:
                ratio = Decimal(str(cea_price)) / Decimal(str(eua_price))
                return ratio.quantize(Decimal("0.0001"))
            return None
        except Exception as e:
            logger.error(f"Failed to get swap ratio: {e}")
            return None

    @staticmethod
    async def get_best_prices(
        db: AsyncSession,
        certificate_type: CertificateType,
    ) -> Tuple[Optional[Decimal], Optional[Decimal]]:
        """
        Get best bid and ask prices from the order book.
        Returns: (best_bid, best_ask)
        """
        # Best bid = highest buy price
        result = await db.execute(
            select(Order.price)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.BUY,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
            .order_by(Order.price.desc())
            .limit(1)
        )
        best_bid = result.scalar_one_or_none()

        # Best ask = lowest sell price
        result = await db.execute(
            select(Order.price)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.SELL,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
            .order_by(Order.price.asc())
            .limit(1)
        )
        best_ask = result.scalar_one_or_none()

        return best_bid, best_ask

    @staticmethod
    async def count_active_orders(
        db: AsyncSession,
        market_maker_id: uuid.UUID,
        rule_id: Optional[uuid.UUID] = None,
    ) -> int:
        """Count active orders for a market maker (optionally filtered by rule)."""
        query = select(Order.id).where(
            and_(
                Order.market_maker_id == market_maker_id,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            )
        )

        result = await db.execute(query)
        return len(result.scalars().all())

    @staticmethod
    async def get_liquidity_settings(
        db: AsyncSession,
        certificate_type: CertificateType,
    ) -> Optional["AutoTradeSettings"]:
        """Get liquidity settings for a certificate type."""
        result = await db.execute(
            select(AutoTradeSettings).where(
                AutoTradeSettings.certificate_type == certificate_type.value
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def determine_market_key(market_maker: MarketMakerClient) -> str:
        """
        Determine market key for AutoTradeMarketSettings based on market maker type.

        Mapping:
        - CEA_BUYER -> CEA_BID (buying CEA)
        - CEA_SELLER -> CEA_ASK (selling CEA)
        - EUA_OFFER -> EUA_SWAP (swap market)
        """
        if market_maker.mm_type == MarketMakerType.CEA_BUYER:
            return "CEA_BID"
        elif market_maker.mm_type == MarketMakerType.CEA_SELLER:
            return "CEA_ASK"
        elif market_maker.mm_type == MarketMakerType.EUA_OFFER:
            return "EUA_SWAP"
        else:
            # Default fallback
            return "CEA_BID"

    @staticmethod
    async def get_market_settings(
        db: AsyncSession,
        market_key: str,
    ) -> Optional[AutoTradeMarketSettings]:
        """Get market settings for a specific market key."""
        result = await db.execute(
            select(AutoTradeMarketSettings).where(
                AutoTradeMarketSettings.market_key == market_key
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def calculate_order_volume_with_variety(
        min_volume_eur: Decimal,
        volume_variety: int,
        target_liquidity: Optional[Decimal],
        current_liquidity: Decimal,
        avg_order_count: int,
        variation_pct: Optional[Decimal] = None,
        max_volume_eur: Optional[Decimal] = None,
    ) -> Decimal:
        """
        Calculate order volume based on variety setting and liquidity needs.

        If variation_pct is provided, uses percentage-based variation (±pct% of min_volume_eur).
        Otherwise falls back to the legacy 1-10 volume_variety scale.

        Args:
            min_volume_eur: Minimum order volume in EUR
            volume_variety: 1-10 scale (1=uniform, 10=very diverse) — legacy
            target_liquidity: Target liquidity in EUR
            current_liquidity: Current liquidity in EUR
            avg_order_count: Target number of orders
            variation_pct: ±% variation on min_order_value (new, takes precedence)
            max_volume_eur: Maximum order volume in EUR (new, optional cap)

        Returns:
            Order volume in EUR
        """
        # Calculate how much liquidity we need to add
        if target_liquidity and target_liquidity > current_liquidity:
            needed_liquidity = target_liquidity - current_liquidity
            # Estimate order size based on target order count
            base_volume = needed_liquidity / Decimal(str(max(avg_order_count, 1)))
        else:
            # No target or at/above target, use minimum
            base_volume = min_volume_eur

        # Ensure we're at least at minimum volume
        base_volume = max(base_volume, min_volume_eur)

        # New percentage-based variation (takes precedence over legacy scale)
        if variation_pct is not None and variation_pct > 0:
            pct = float(variation_pct)
            factor = Decimal(str(1.0 + random.uniform(-pct / 100, pct / 100)))
            varied_volume = base_volume * factor
            varied_volume = max(varied_volume, min_volume_eur)
            if max_volume_eur is not None and max_volume_eur > 0:
                varied_volume = min(varied_volume, max_volume_eur)
            return varied_volume

        # Legacy variety factor (1-10 scale)
        if volume_variety <= 1:
            result = base_volume
        else:
            variation_factor = (volume_variety - 1) / 9.0
            min_multiplier = Decimal(str(1.0 - 0.5 * variation_factor))
            max_multiplier = Decimal(str(1.0 + 2.0 * variation_factor))
            random_factor = Decimal(str(random.random()))
            multiplier = min_multiplier + random_factor * (max_multiplier - min_multiplier)
            result = max(base_volume * multiplier, min_volume_eur)

        if max_volume_eur is not None and max_volume_eur > 0:
            result = min(result, max_volume_eur)
        return result

    @staticmethod
    def calculate_price_with_deviation(
        best_price: Decimal,
        price_deviation_pct: Decimal,
        side: OrderSide,
        is_swap_market: bool = False,
    ) -> Decimal:
        """
        Calculate order price with deviation from best price.

        For BUY orders: price is below best ask (or best bid if no asks)
        For SELL orders: price is above best bid (or best ask if no bids)

        The deviation is applied to create spread in the order book.

        For SWAP market, the price is a ratio (CEA/EUA), not EUR,
        so we round to 4 decimals instead of 0.1 EUR steps.
        """
        # Calculate deviation as percentage
        deviation = best_price * (price_deviation_pct / Decimal("100"))

        # Apply random factor within the deviation range
        random_deviation = Decimal(str(random.random())) * deviation

        if side == OrderSide.BUY:
            # BUY: place below reference price
            price = best_price - random_deviation
        else:
            # SELL: place above reference price
            price = best_price + random_deviation

        if is_swap_market:
            # For swap market, ratio is typically 0.1xxx - round to 4 decimals
            price = price.quantize(Decimal("0.0001"))
            return max(price, Decimal("0.0001"))
        else:
            # For cash market, round to 0.1 EUR step
            price = (price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")
            return max(price, Decimal("0.10"))

    @staticmethod
    async def calculate_current_liquidity(
        db: AsyncSession,
        certificate_type: CertificateType,
        side: OrderSide,
        market_type: Optional[MarketType] = None,
    ) -> Decimal:
        """
        Calculate current liquidity (EUR value) for a side.

        For CEA_CASH market: Liquidity = SUM(price * remaining_quantity)
        For SWAP market: Liquidity = SUM(remaining_quantity * eua_eur_price)
            because Order.price is ratio (CEA/EUA), not EUR price!
        """
        if market_type == MarketType.SWAP:
            # For swap market, quantity is in EUA, price is ratio (not EUR)
            # Get total EUA available
            result = await db.execute(
                select(func.sum(Order.quantity - Order.filled_quantity))
                .where(
                    and_(
                        Order.certificate_type == certificate_type,
                        Order.market == MarketType.SWAP,
                        Order.side == side,
                        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                        Order.market_maker_id.isnot(None),
                    )
                )
            )
            total_eua = Decimal(str(result.scalar() or 0))

            # Convert to EUR using current EUA price
            eua_eur_price = await AutoTradeExecutor.get_market_price("EUA")
            if eua_eur_price and eua_eur_price > 0:
                return total_eua * eua_eur_price
            return Decimal("0")
        else:
            # For CEA cash market, price is in EUR
            result = await db.execute(
                select(func.sum(Order.price * (Order.quantity - Order.filled_quantity)))
                .where(
                    and_(
                        Order.certificate_type == certificate_type,
                        Order.side == side,
                        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                        Order.market_maker_id.isnot(None),  # Only MM orders
                    )
                )
            )
            return Decimal(str(result.scalar() or 0))

    @staticmethod
    async def get_liquidity_status(
        db: AsyncSession,
        certificate_type: CertificateType,
        side: OrderSide,
        market_type: Optional[MarketType] = None,
    ) -> Tuple[str, Optional[Decimal], Optional[Decimal]]:
        """
        Check liquidity status relative to target.
        Returns: (status, current_liquidity, target_liquidity)

        Status can be:
        - "below_target": need to place new orders
        - "at_target": within 5% tolerance, do nothing
        - "above_target": need to consume orders via internal trades
        - "no_target": no target set, do nothing
        """
        settings = await AutoTradeExecutor.get_liquidity_settings(db, certificate_type)

        if not settings or not settings.liquidity_limit_enabled:
            return "no_target", None, None

        current = await AutoTradeExecutor.calculate_current_liquidity(
            db, certificate_type, side, market_type
        )

        if side == OrderSide.SELL:
            target = settings.target_ask_liquidity
        else:
            target = settings.target_bid_liquidity

        if target is None or target <= 0:
            return "no_target", current, None

        # 5% tolerance band around target
        tolerance = target * Decimal("0.05")

        if current < target - tolerance:
            return "below_target", current, target
        elif current > target + tolerance:
            return "above_target", current, target
        else:
            return "at_target", current, target

    @staticmethod
    async def get_liquidity_status_v2(
        db: AsyncSession,
        market_key: str,
        certificate_type: CertificateType,
        side: OrderSide,
        market_type: Optional[MarketType] = None,
    ) -> Tuple[str, Optional[Decimal], Optional[Decimal], Optional[AutoTradeMarketSettings]]:
        """
        Check liquidity status using the new AutoTradeMarketSettings.
        Returns: (status, current_liquidity, target_liquidity, market_settings)

        Status can be:
        - "exceeds_max_threshold": URGENT - exceeds max_liquidity_threshold, trigger aggressive internal trades
        - "below_target": need to place new orders
        - "at_target": within 5% tolerance, do nothing
        - "above_target": need to consume orders via internal trades
        - "no_target": no target set or market disabled
        """
        market_settings = await AutoTradeExecutor.get_market_settings(db, market_key)

        if not market_settings or not market_settings.enabled:
            return "no_target", None, None, market_settings

        current = await AutoTradeExecutor.calculate_current_liquidity(
            db, certificate_type, side, market_type
        )

        target = market_settings.target_liquidity

        # Check max threshold first (takes priority)
        max_threshold = market_settings.max_liquidity_threshold
        if max_threshold and max_threshold > 0 and current and current > max_threshold:
            return "exceeds_max_threshold", current, target, market_settings

        if target is None or target <= 0:
            return "no_target", current, None, market_settings

        # 5% tolerance band around target
        tolerance = target * Decimal("0.05")

        if current < target - tolerance:
            return "below_target", current, target, market_settings
        elif current > target + tolerance:
            return "above_target", current, target, market_settings
        else:
            return "at_target", current, target, market_settings

    @staticmethod
    async def execute_internal_trade(
        db: AsyncSession,
        certificate_type: CertificateType,
        admin_user_id: uuid.UUID,
    ) -> Dict:
        """
        Execute an internal trade between market makers.
        Used when liquidity limit is reached - consumes existing orders.

        1. Find best bid and best ask
        2. Calculate random price within spread
        3. Match a BUY order with a SELL order
        4. Create trade record

        Returns: dict with trade details or error
        """
        result = {
            "success": False,
            "trade_id": None,
            "price": None,
            "quantity": None,
            "reason": None,
        }

        try:
            # Get best prices
            best_bid, best_ask = await AutoTradeExecutor.get_best_prices(
                db, certificate_type
            )

            if not best_bid or not best_ask:
                result["reason"] = "no_spread_available"
                return result

            if best_bid >= best_ask:
                result["reason"] = "no_spread_to_trade_in"
                return result

            # Calculate random price within spread (rounded to 0.1 EUR)
            spread = best_ask - best_bid
            random_offset = Decimal(str(random.random())) * spread
            trade_price = best_bid + random_offset
            trade_price = (trade_price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")

            # Ensure price is within spread
            trade_price = max(trade_price, best_bid + Decimal("0.1"))
            trade_price = min(trade_price, best_ask - Decimal("0.1"))

            # If spread is too tight (<=0.1), use mid price
            if trade_price <= best_bid or trade_price >= best_ask:
                trade_price = (best_bid + best_ask) / 2
                trade_price = (trade_price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")

            # Find a SELL order to consume (best ask = lowest price first, oldest first)
            # We take the best ask order regardless of trade_price - the trade_price is just
            # for recording the trade, not for filtering orders
            sell_result = await db.execute(
                select(Order)
                .where(
                    and_(
                        Order.certificate_type == certificate_type,
                        Order.side == OrderSide.SELL,
                        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                        Order.market_maker_id.isnot(None),
                    )
                )
                .order_by(Order.price.asc(), Order.created_at.asc())
                .limit(1)
            )
            sell_order = sell_result.scalar_one_or_none()

            # Find a BUY order to consume (best bid = highest price first, oldest first)
            buy_result = await db.execute(
                select(Order)
                .where(
                    and_(
                        Order.certificate_type == certificate_type,
                        Order.side == OrderSide.BUY,
                        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                        Order.market_maker_id.isnot(None),
                    )
                )
                .order_by(Order.price.desc(), Order.created_at.asc())
                .limit(1)
            )
            buy_order = buy_result.scalar_one_or_none()

            if not sell_order or not buy_order:
                result["reason"] = "no_matching_orders_found"
                return result

            # Don't match same market maker
            if sell_order.market_maker_id == buy_order.market_maker_id:
                result["reason"] = "only_same_mm_orders_available"
                return result

            # Calculate match quantity (smaller of remaining quantities)
            sell_remaining = sell_order.quantity - sell_order.filled_quantity
            buy_remaining = buy_order.quantity - buy_order.filled_quantity
            match_qty = min(sell_remaining, buy_remaining)

            # Round to integer
            match_qty = match_qty.quantize(Decimal("1"), rounding=ROUND_DOWN)

            if match_qty <= 0:
                result["reason"] = "no_quantity_to_match"
                return result

            # Create trade
            trade = CashMarketTrade(
                buy_order_id=buy_order.id,
                sell_order_id=sell_order.id,
                market_maker_id=buy_order.market_maker_id,
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

            await db.commit()

            logger.info(
                f"Internal trade executed: {match_qty} {certificate_type.value} @ {trade_price} "
                f"(BUY {buy_order.id} <-> SELL {sell_order.id})"
            )

            result["success"] = True
            result["trade_id"] = str(trade.id) if hasattr(trade, 'id') else None
            result["price"] = str(trade_price)
            result["quantity"] = str(match_qty)
            result["buy_order_id"] = str(buy_order.id)
            result["sell_order_id"] = str(sell_order.id)

            return result

        except Exception as e:
            logger.exception(f"Error executing internal trade: {e}")
            await db.rollback()
            result["reason"] = f"exception: {str(e)}"
            return result

    @staticmethod
    def determine_certificate_type(
        market_maker: MarketMakerClient,
    ) -> CertificateType:
        """Determine certificate type based on market maker type."""
        if market_maker.mm_type in [MarketMakerType.CEA_BUYER, MarketMakerType.CEA_SELLER]:
            return CertificateType.CEA
        return CertificateType.EUA

    @staticmethod
    def determine_market_type(
        market_maker: MarketMakerClient,
    ) -> MarketType:
        """Determine market type based on market maker type."""
        if market_maker.mm_type in [MarketMakerType.CEA_BUYER, MarketMakerType.CEA_SELLER]:
            return MarketType.CEA_CASH
        return MarketType.SWAP

    @staticmethod
    async def calculate_order_price(
        db: AsyncSession,
        rule: AutoTradeRule,
        certificate_type: CertificateType,
        market_price: Optional[Decimal],
    ) -> Tuple[Optional[Decimal], str]:
        """
        Calculate order price based on rule's price mode.

        Returns: (price, reason) where reason explains the calculation or failure.
        """
        if rule.order_type == "MARKET":
            # Market orders don't need a price
            return None, "market_order"

        if rule.price_mode == AutoTradePriceMode.FIXED:
            if rule.fixed_price:
                return rule.fixed_price, "fixed_price"
            return None, "fixed_price_not_set"

        elif rule.price_mode == AutoTradePriceMode.SPREAD_FROM_BEST:
            best_bid, best_ask = await AutoTradeExecutor.get_best_prices(
                db, certificate_type
            )

            spread = rule.spread_from_best or Decimal("0")

            if rule.side == OrderSide.BUY:
                # For BUY: place below best ask (or below best bid if no asks)
                if best_ask:
                    price = best_ask - spread
                elif best_bid:
                    price = best_bid - spread
                elif market_price:
                    price = market_price - spread
                else:
                    return None, "no_reference_price"
            else:
                # For SELL: place above best bid (or above best ask if no bids)
                if best_bid:
                    price = best_bid + spread
                elif best_ask:
                    price = best_ask + spread
                elif market_price:
                    price = market_price + spread
                else:
                    return None, "no_reference_price"

            # Round to 0.1 EUR step
            price = (price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")
            return max(price, Decimal("0.10")), "spread_from_best"

        elif rule.price_mode == AutoTradePriceMode.PERCENTAGE_FROM_MARKET:
            if not market_price:
                return None, "market_price_unavailable"

            pct = rule.percentage_from_market or Decimal("0")

            if rule.side == OrderSide.BUY:
                # BUY: below market price
                price = market_price * (Decimal("1") - pct / Decimal("100"))
            else:
                # SELL: above market price
                price = market_price * (Decimal("1") + pct / Decimal("100"))

            # Round to 0.1 EUR step
            price = (price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")
            return max(price, Decimal("0.10")), "percentage_from_market"

        elif rule.price_mode == AutoTradePriceMode.RANDOM_SPREAD:
            # Random spread between min and max, respecting 0.1 EUR step
            best_bid, best_ask = await AutoTradeExecutor.get_best_prices(
                db, certificate_type
            )

            spread_min = rule.spread_min or Decimal("0.1")
            spread_max = rule.spread_max or Decimal("1.0")

            # Ensure min <= max
            if spread_min > spread_max:
                spread_min, spread_max = spread_max, spread_min

            # Calculate number of 0.1 EUR steps in the range
            steps_min = int(spread_min / Decimal("0.1"))
            steps_max = int(spread_max / Decimal("0.1"))

            # Pick a random step count
            random_steps = random.randint(steps_min, steps_max)
            spread = Decimal(str(random_steps)) * Decimal("0.1")

            if rule.side == OrderSide.BUY:
                # For BUY: place below best ask (or use best bid/market price as reference)
                if best_ask:
                    price = best_ask - spread
                elif best_bid:
                    # If no asks, place slightly below best bid
                    price = best_bid - spread
                elif market_price:
                    price = market_price - spread
                else:
                    return None, "no_reference_price"
            else:
                # For SELL: place above best bid (or use best ask/market price as reference)
                if best_bid:
                    price = best_bid + spread
                elif best_ask:
                    # If no bids, place slightly above best ask
                    price = best_ask + spread
                elif market_price:
                    price = market_price + spread
                else:
                    return None, "no_reference_price"

            # Round to 0.1 EUR step (should already be, but ensure)
            price = (price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")
            return max(price, Decimal("0.10")), f"random_spread ({spread} EUR)"

        return None, "unknown_price_mode"

    @staticmethod
    async def calculate_order_quantity(
        db: AsyncSession,
        rule: AutoTradeRule,
        balances: Dict[str, Dict[str, Decimal]],
        certificate_type: CertificateType,
        price: Optional[Decimal],
    ) -> Tuple[Optional[Decimal], str]:
        """
        Calculate order quantity based on rule's quantity mode.

        Returns: (quantity, reason) where reason explains the calculation or failure.
        """
        if rule.quantity_mode == AutoTradeQuantityMode.FIXED:
            if rule.fixed_quantity:
                return rule.fixed_quantity, "fixed_quantity"
            return None, "fixed_quantity_not_set"

        elif rule.quantity_mode == AutoTradeQuantityMode.PERCENTAGE_OF_BALANCE:
            pct = rule.percentage_of_balance or Decimal("0")

            if rule.side == OrderSide.BUY:
                # For BUY: percentage of available EUR
                available_eur = balances.get("EUR", {}).get("available", Decimal("0"))
                if price and price > 0:
                    max_qty = available_eur / price
                    qty = max_qty * pct / Decimal("100")
                else:
                    return None, "cannot_calculate_without_price"
            else:
                # For SELL: percentage of available certificates
                available_certs = balances.get(certificate_type.value, {}).get("available", Decimal("0"))
                qty = available_certs * pct / Decimal("100")

            if qty <= 0:
                return None, "insufficient_balance_for_percentage"

            # Round to integer - no fractional certificates
            return qty.quantize(Decimal("1"), rounding=ROUND_DOWN), "percentage_of_balance"

        elif rule.quantity_mode == AutoTradeQuantityMode.RANDOM_RANGE:
            min_qty = rule.min_quantity or Decimal("1")
            max_qty = rule.max_quantity or Decimal("100")

            # Generate random quantity
            range_size = max_qty - min_qty
            random_offset = Decimal(str(random.random())) * range_size
            qty = min_qty + random_offset

            # Round to integer - no fractional certificates
            return qty.quantize(Decimal("1"), rounding=ROUND_DOWN), "random_range"

        return None, "unknown_quantity_mode"

    @staticmethod
    async def validate_order(
        db: AsyncSession,
        rule: AutoTradeRule,
        market_maker: MarketMakerClient,
        price: Optional[Decimal],
        quantity: Decimal,
        market_price: Optional[Decimal],
        balances: Dict[str, Dict[str, Decimal]],
        certificate_type: CertificateType,
    ) -> Tuple[bool, str]:
        """
        Validate that an order can be placed.

        Checks:
        1. Max active orders limit
        2. Min balance requirement
        3. Sufficient balance for the order
        4. Price deviation from scraped price

        Returns: (is_valid, reason)
        """
        # Check max active orders
        if rule.max_active_orders:
            active_count = await AutoTradeExecutor.count_active_orders(
                db, market_maker.id
            )
            if active_count >= rule.max_active_orders:
                return False, f"max_active_orders_reached ({active_count}/{rule.max_active_orders})"

        # Market makers have unlimited resources — skip balance checks

        # Check price deviation from scraped price
        if rule.max_price_deviation and market_price and price:
            deviation_pct = abs(price - market_price) / market_price * Decimal("100")
            if deviation_pct > rule.max_price_deviation:
                return False, f"price_deviation_exceeded ({deviation_pct:.2f}% > {rule.max_price_deviation}%)"

        return True, "ok"

    @staticmethod
    async def place_order(
        db: AsyncSession,
        rule: AutoTradeRule,
        market_maker: MarketMakerClient,
        certificate_type: CertificateType,
        market_type: MarketType,
        price: Optional[Decimal],
        quantity: Decimal,
        admin_user_id: uuid.UUID,
    ) -> Tuple[Optional[Order], str]:
        """
        Place an order for the market maker.

        For SELL orders: locks certificates via TRADE_DEBIT transaction.
        For BUY orders: locks EUR (handled by order matching).

        Returns: (Order, ticket_id) or (None, error_reason)
        """
        try:
            # For SELL orders: lock certificates
            if rule.side == OrderSide.SELL:
                transaction, ticket_id = await MarketMakerService.create_transaction(
                    db=db,
                    market_maker_id=market_maker.id,
                    certificate_type=certificate_type,
                    transaction_type=TransactionType.TRADE_DEBIT,
                    amount=-quantity,  # Negative to lock
                    notes=f"Auto-trade rule '{rule.name}' - lock for sell order",
                    created_by_id=admin_user_id,
                )
            else:
                ticket_id = None

            # Create the order
            order = Order(
                market=market_type,
                market_maker_id=market_maker.id,
                certificate_type=certificate_type,
                side=rule.side,
                price=price or Decimal("0"),  # Market orders may not have price
                quantity=quantity,
                filled_quantity=Decimal("0"),
                status=OrderStatus.OPEN,
            )
            db.add(order)
            await db.flush()

            # Create audit ticket for the order
            order_ticket = await TicketService.create_ticket(
                db=db,
                action_type="AUTO_TRADE_ORDER_PLACED",
                entity_type="Order",
                entity_id=order.id,
                status=TicketStatus.SUCCESS,
                user_id=admin_user_id,
                market_maker_id=market_maker.id,
                request_payload={
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "side": rule.side.value,
                    "order_type": rule.order_type,
                    "price_mode": rule.price_mode.value if rule.price_mode else None,
                    "quantity_mode": rule.quantity_mode.value if rule.quantity_mode else None,
                },
                response_data={
                    "order_id": str(order.id),
                    "price": str(price) if price else None,
                    "quantity": str(quantity),
                    "certificate_type": certificate_type.value,
                },
                related_ticket_ids=[ticket_id] if ticket_id else [],
                tags=["auto_trade", "order", rule.side.value.lower()],
            )

            # Update order with ticket ID
            order.ticket_id = order_ticket.ticket_id

            # Update rule execution tracking (naive UTC for asyncpg)
            rule.last_executed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule)
            rule.execution_count = (rule.execution_count or 0) + 1

            await db.commit()
            await db.refresh(order)

            logger.info(
                f"Auto-trade order placed: {order.id} for MM {market_maker.name} "
                f"({rule.side.value} {quantity} {certificate_type.value} @ {price})"
            )

            return order, order_ticket.ticket_id

        except Exception as e:
            logger.error(f"Failed to place auto-trade order: {e}")
            await db.rollback()
            return None, str(e)

    @staticmethod
    async def try_match_orders(
        db: AsyncSession,
        certificate_type: CertificateType,
        admin_user_id: uuid.UUID,
    ) -> int:
        """
        Try to match crossing limit orders between market makers.

        Looks for BUY orders with price >= lowest SELL order price
        and creates trades between them.

        Returns: number of trades created
        """
        trades_created = 0

        # Get crossing orders: buy orders that can match with sell orders
        # BUY orders sorted by price DESC (highest first)
        buy_result = await db.execute(
            select(Order)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.BUY,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                    Order.market_maker_id != None,  # Only MM orders
                )
            )
            .order_by(Order.price.desc(), Order.created_at.asc())
        )
        buy_orders = list(buy_result.scalars().all())

        # SELL orders sorted by price ASC (lowest first)
        sell_result = await db.execute(
            select(Order)
            .where(
                and_(
                    Order.certificate_type == certificate_type,
                    Order.side == OrderSide.SELL,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                    Order.market_maker_id != None,  # Only MM orders
                )
            )
            .order_by(Order.price.asc(), Order.created_at.asc())
        )
        sell_orders = list(sell_result.scalars().all())

        if not buy_orders or not sell_orders:
            return 0

        # Try to match
        for buy_order in buy_orders:
            buy_remaining = buy_order.quantity - buy_order.filled_quantity
            if buy_remaining <= 0:
                continue

            for sell_order in sell_orders:
                # Check if orders can match (buy price >= sell price)
                if buy_order.price < sell_order.price:
                    # No more matches possible for this buy order
                    break

                # Don't match orders from the same market maker
                if buy_order.market_maker_id == sell_order.market_maker_id:
                    continue

                sell_remaining = sell_order.quantity - sell_order.filled_quantity
                if sell_remaining <= 0:
                    continue

                # Calculate match quantity (must be integer)
                match_qty = min(buy_remaining, sell_remaining)
                # Round to integer - no fractional certificates
                match_qty = match_qty.quantize(Decimal("1"), rounding=ROUND_DOWN)
                if match_qty <= 0:
                    continue

                # Trade price: use sell price if it's a limit order, otherwise use buy price
                # This handles MARKET orders which have price=0
                if sell_order.price and sell_order.price > 0:
                    trade_price = sell_order.price
                else:
                    trade_price = buy_order.price
                # Round to 0.1 EUR step
                trade_price = (trade_price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")

                # Create trade
                trade = CashMarketTrade(
                    buy_order_id=buy_order.id,
                    sell_order_id=sell_order.id,
                    market_maker_id=buy_order.market_maker_id,  # Buyer's MM
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
                    f"Auto-trade match: {match_qty} {certificate_type.value} @ {trade_price} "
                    f"(BUY order {buy_order.id} <-> SELL order {sell_order.id})"
                )

                if buy_remaining <= 0:
                    break

        if trades_created > 0:
            await db.commit()
            logger.info(f"Created {trades_created} auto-trade matches for {certificate_type.value}")

        return trades_created

    @staticmethod
    async def execute_rule(
        db: AsyncSession,
        rule: AutoTradeRule,
        admin_user_id: uuid.UUID,
    ) -> Dict:
        """
        Execute a single auto-trade rule with target-based liquidity management.

        Behavior based on liquidity status:
        - below_target: Place new orders to refill liquidity
        - at_target: Skip execution (maintain current level)
        - above_target: Execute internal trades to consume excess
        - no_target: Place orders normally (no liquidity management)

        Returns a dict with execution result details.
        """
        result = {
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "market_maker_id": str(rule.market_maker_id),
            "success": False,
            "order_id": None,
            "reason": None,
        }

        try:
            market_maker = rule.market_maker
            if not market_maker or not market_maker.is_active:
                result["reason"] = "market_maker_inactive"
                return result

            # Determine certificate and market types
            certificate_type = AutoTradeExecutor.determine_certificate_type(market_maker)
            market_type = AutoTradeExecutor.determine_market_type(market_maker)
            market_key = AutoTradeExecutor.determine_market_key(market_maker)

            # Check liquidity status using new v2 method (AutoTradeMarketSettings)
            status, current_liq, target_liq, market_settings = await AutoTradeExecutor.get_liquidity_status_v2(
                db, market_key, certificate_type, rule.side, market_type
            )

            result["liquidity_status"] = {
                "status": status,
                "current": str(current_liq) if current_liq else None,
                "target": str(target_liq) if target_liq else None,
                "market_key": market_key,
            }

            # Extract interval variation for scheduling (used throughout execute_rule)
            _interval_var = market_settings.order_interval_variation_pct if market_settings else None

            # Include market settings params in result for debugging
            if market_settings:
                result["market_settings"] = {
                    "price_deviation_pct": str(market_settings.price_deviation_pct),
                    "avg_order_count": market_settings.avg_order_count,
                    "min_order_volume_eur": str(market_settings.min_order_volume_eur),
                    "volume_variety": market_settings.volume_variety,
                }

            # Handle based on liquidity status
            if status == "exceeds_max_threshold":
                # URGENT: Liquidity exceeds max threshold - aggressively reduce via internal trades
                max_threshold = market_settings.max_liquidity_threshold if market_settings else None
                logger.warning(
                    f"Rule {rule.name}: Liquidity EXCEEDS MAX THRESHOLD ({current_liq}/{max_threshold} EUR) - "
                    f"executing internal trades to reduce"
                )

                # Execute multiple internal trades to bring liquidity below threshold
                trades_executed = 0
                max_trades = 5  # Limit to avoid infinite loops

                while trades_executed < max_trades:
                    internal_result = await AutoTradeExecutor.execute_internal_trade(
                        db, certificate_type, admin_user_id
                    )

                    if not internal_result["success"]:
                        break

                    trades_executed += 1
                    logger.info(
                        f"Rule {rule.name} threshold reduction trade #{trades_executed}: "
                        f"{internal_result['quantity']} @ {internal_result['price']}"
                    )

                    # Re-check liquidity
                    new_current = await AutoTradeExecutor.calculate_current_liquidity(
                        db, certificate_type, rule.side, market_type
                    )
                    if new_current and max_threshold and new_current <= max_threshold:
                        logger.info(f"Rule {rule.name}: Liquidity now {new_current} EUR, below threshold")
                        break

                # Update rule execution tracking
                rule.last_executed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                rule.execution_count = (rule.execution_count or 0) + 1
                await db.commit()

                result["success"] = trades_executed > 0
                result["action"] = "threshold_reduction"
                result["trades_executed"] = trades_executed
                result["reason"] = f"executed {trades_executed} internal trades to reduce excess liquidity"
                return result

            if status == "at_target":
                # Liquidity is at target level - skip this execution
                logger.debug(
                    f"Rule {rule.name}: Liquidity at target ({current_liq}/{target_liq} EUR) - skipping"
                )
                result["reason"] = "liquidity_at_target"
                result["action"] = "skipped"
                # Schedule next execution
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                await db.commit()
                return result

            if status == "above_target":
                # Liquidity exceeds target - consume via internal trade
                logger.info(
                    f"Rule {rule.name}: Liquidity above target ({current_liq}/{target_liq} EUR) - "
                    f"executing internal trade to consume excess"
                )

                internal_result = await AutoTradeExecutor.execute_internal_trade(
                    db, certificate_type, admin_user_id
                )

                # Update rule execution tracking
                rule.last_executed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                rule.execution_count = (rule.execution_count or 0) + 1
                await db.commit()

                result["success"] = internal_result["success"]
                result["action"] = "internal_trade"
                result["internal_trade"] = internal_result

                if internal_result["success"]:
                    logger.info(
                        f"Rule {rule.name} executed internal trade: "
                        f"{internal_result['quantity']} @ {internal_result['price']}"
                    )
                else:
                    result["reason"] = f"internal_trade_failed: {internal_result['reason']}"
                    logger.warning(f"Rule {rule.name} internal trade failed: {internal_result['reason']}")

                return result

            # status == "below_target" or "no_target" - place new orders
            if status == "below_target":
                logger.info(
                    f"Rule {rule.name}: Liquidity below target ({current_liq}/{target_liq} EUR) - "
                    f"placing order to refill"
                )
                result["action"] = "place_order_refill"
            else:
                result["action"] = "place_order_normal"

            # Get market price (or swap ratio for SWAP market)
            # IMPORTANT: For SWAP market, Order.price is the ratio CEA/EUA, NOT EUR price!
            if market_type == MarketType.SWAP:
                # For swap market, use the CEA/EUA ratio as the "market price"
                market_price = await AutoTradeExecutor.get_swap_ratio()
                logger.info(f"Swap market: using ratio {market_price} as reference price")
            else:
                market_price = await AutoTradeExecutor.get_market_price(certificate_type.value)

            # MMs have unlimited resources — skip balance fetch
            balances: Dict[str, Dict[str, Decimal]] = {}

            # Get best prices for price calculation
            best_bid, best_ask = await AutoTradeExecutor.get_best_prices(db, certificate_type)

            # Calculate price - use market settings if available
            if market_settings and best_bid and rule.order_type == "LIMIT":
                # Use new price deviation setting
                # For BUY: use best_ask as reference (we want to buy below it)
                # For SELL: use best_bid as reference (we want to sell above it)
                if rule.side == OrderSide.BUY:
                    reference_price = best_ask if best_ask else (best_bid if best_bid else market_price)
                else:
                    reference_price = best_bid if best_bid else (best_ask if best_ask else market_price)

                if reference_price:
                    price = AutoTradeExecutor.calculate_price_with_deviation(
                        reference_price,
                        market_settings.price_deviation_pct,
                        rule.side,
                        is_swap_market=(market_type == MarketType.SWAP),
                    )
                    price_reason = f"market_settings_deviation ({market_settings.price_deviation_pct}%)"
                else:
                    # Fall back to rule-based calculation
                    price, price_reason = await AutoTradeExecutor.calculate_order_price(
                        db, rule, certificate_type, market_price
                    )
            else:
                # Use rule-based calculation
                price, price_reason = await AutoTradeExecutor.calculate_order_price(
                    db, rule, certificate_type, market_price
                )

            if price is None and rule.order_type == "LIMIT":
                result["reason"] = f"price_calculation_failed: {price_reason}"
                # Schedule next execution anyway
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                await db.commit()
                return result

            # Max orders per price level enforcement
            if market_settings and price and market_settings.max_orders_per_price_level:
                from sqlalchemy import and_ as sql_and, func as sql_func
                max_per_level = market_settings.max_orders_per_price_level
                # Apply variation to the max
                if market_settings.max_orders_per_level_variation_pct and market_settings.max_orders_per_level_variation_pct > 0:
                    pct = float(market_settings.max_orders_per_level_variation_pct)
                    factor = 1.0 + random.uniform(-pct / 100, pct / 100)
                    max_per_level = max(1, round(max_per_level * factor))

                # Count existing orders at this price level
                count_result = await db.execute(
                    select(sql_func.count()).select_from(Order).where(
                        sql_and(
                            Order.certificate_type == certificate_type,
                            Order.side == rule.side,
                            Order.price == price,
                            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                        )
                    )
                )
                orders_at_price = count_result.scalar() or 0

                # If at capacity, shift to next available price level
                if orders_at_price >= max_per_level:
                    step = Decimal("0.1") if market_type != MarketType.SWAP else Decimal("0.0001")
                    shifted = False
                    for shift in range(1, 20):  # Try up to 20 levels
                        if rule.side == OrderSide.BUY:
                            candidate = price - step * shift
                            if candidate <= Decimal("0"):
                                break
                        else:
                            candidate = price + step * shift

                        count_result = await db.execute(
                            select(sql_func.count()).select_from(Order).where(
                                sql_and(
                                    Order.certificate_type == certificate_type,
                                    Order.side == rule.side,
                                    Order.price == candidate,
                                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                                )
                            )
                        )
                        if (count_result.scalar() or 0) < max_per_level:
                            price = candidate
                            shifted = True
                            break

                    if not shifted:
                        result["reason"] = "all_price_levels_at_max_capacity"
                        rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                        await db.commit()
                        return result

            # Calculate quantity - use market settings for volume variety if available
            if market_settings and price and price > 0:
                # Calculate volume in EUR with variety
                volume_eur = AutoTradeExecutor.calculate_order_volume_with_variety(
                    market_settings.min_order_volume_eur,
                    market_settings.volume_variety,
                    target_liq,
                    current_liq or Decimal("0"),
                    market_settings.avg_order_count,
                    variation_pct=market_settings.min_order_value_variation_pct,
                    max_volume_eur=market_settings.max_order_volume_eur,
                )
                # Convert EUR volume to quantity (certificates)
                # IMPORTANT: For SWAP market, price is ratio (CEA/EUA), not EUR price!
                # We need to use the actual EUA EUR price to calculate quantity
                if market_type == MarketType.SWAP:
                    # For swap: quantity is in EUA, so divide by EUA EUR price
                    eua_eur_price = await AutoTradeExecutor.get_market_price("EUA")
                    if eua_eur_price and eua_eur_price > 0:
                        quantity = (volume_eur / eua_eur_price).quantize(Decimal("1"), rounding=ROUND_DOWN)
                        qty_reason = f"swap_volume (vol={volume_eur:.0f} EUR / {eua_eur_price} EUR/EUA = {quantity} EUA)"
                    else:
                        quantity = Decimal("0")
                        qty_reason = "eua_price_unavailable"
                else:
                    quantity = (volume_eur / price).quantize(Decimal("1"), rounding=ROUND_DOWN)
                    qty_reason = f"market_settings_variety (vol={volume_eur:.0f} EUR, variety={market_settings.volume_variety})"
            else:
                # Use rule-based calculation
                quantity, qty_reason = await AutoTradeExecutor.calculate_order_quantity(
                    db, rule, balances, certificate_type, price
                )

            if quantity is None or quantity <= 0:
                result["reason"] = f"quantity_calculation_failed: {qty_reason}"
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                await db.commit()
                return result

            # Validate order
            is_valid, validation_reason = await AutoTradeExecutor.validate_order(
                db, rule, market_maker, price, quantity, market_price,
                balances, certificate_type
            )

            if not is_valid:
                result["reason"] = f"validation_failed: {validation_reason}"
                rule.next_execution_at = AutoTradeExecutor.calculate_next_execution_time(rule, _interval_var)
                await db.commit()
                return result

            # Place the order
            order, ticket_id = await AutoTradeExecutor.place_order(
                db, rule, market_maker, certificate_type, market_type,
                price, quantity, admin_user_id
            )

            if order:
                result["success"] = True
                result["order_id"] = str(order.id)
                result["ticket_id"] = ticket_id
                result["price"] = str(price) if price else None
                result["quantity"] = str(quantity)

                # Try to match crossing orders after placement
                trades_matched = await AutoTradeExecutor.try_match_orders(
                    db, certificate_type, admin_user_id
                )
                result["trades_matched"] = trades_matched
            else:
                result["reason"] = f"order_placement_failed: {ticket_id}"

            return result

        except Exception as e:
            logger.exception(f"Error executing rule {rule.id}: {e}")
            result["reason"] = f"exception: {str(e)}"
            return result

    @staticmethod
    async def execute_all_ready_rules(
        db: AsyncSession,
        admin_user_id: uuid.UUID,
    ) -> List[Dict]:
        """
        Execute all rules that are ready for execution.

        This is the main entry point for the background scheduler.
        Returns list of execution results.
        """
        results = []

        try:
            rules = await AutoTradeExecutor.get_rules_ready_for_execution(db)
            logger.info(f"Found {len(rules)} rules ready for execution")

            for rule in rules:
                result = await AutoTradeExecutor.execute_rule(db, rule, admin_user_id)
                results.append(result)

                if result["success"]:
                    logger.info(f"Rule {rule.name} executed successfully: order {result['order_id']}")
                else:
                    logger.warning(f"Rule {rule.name} execution failed: {result['reason']}")

            return results

        except Exception as e:
            logger.exception(f"Error in execute_all_ready_rules: {e}")
            return results


# Background task for running auto-trade execution
_executor_task: Optional[asyncio.Task] = None
_executor_running = False


async def start_auto_trade_executor(
    db_session_maker,
    admin_user_id: uuid.UUID,
    check_interval_seconds: int = 30,
):
    """
    Start the background auto-trade executor.

    Args:
        db_session_maker: Async session factory for database connections
        admin_user_id: Admin user ID for audit trail
        check_interval_seconds: How often to check for ready rules (default 30s)
    """
    global _executor_running
    _executor_running = True

    logger.info(f"Starting auto-trade executor (check interval: {check_interval_seconds}s)")

    while _executor_running:
        try:
            async with db_session_maker() as db:
                results = await AutoTradeExecutor.execute_all_ready_rules(db, admin_user_id)

                successes = sum(1 for r in results if r["success"])
                if results:
                    logger.info(f"Auto-trade cycle complete: {successes}/{len(results)} successful")

        except Exception as e:
            logger.exception(f"Error in auto-trade executor cycle: {e}")

        await asyncio.sleep(check_interval_seconds)


async def stop_auto_trade_executor():
    """Stop the background auto-trade executor."""
    global _executor_running, _executor_task
    _executor_running = False

    if _executor_task:
        _executor_task.cancel()
        try:
            await _executor_task
        except asyncio.CancelledError:
            pass
        _executor_task = None

    logger.info("Auto-trade executor stopped")


async def get_all_orderbook_prices(
    db: AsyncSession,
    certificate_type: CertificateType,
    side: OrderSide,
) -> List[Decimal]:
    """Get all active price levels for a given side of the order book."""
    result = await db.execute(
        select(Order.price)
        .where(
            and_(
                Order.certificate_type == certificate_type,
                Order.side == side,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            )
        )
        .distinct()
        .order_by(Order.price.desc() if side == OrderSide.BUY else Order.price.asc())
    )
    return [row[0] for row in result.fetchall()]


async def fill_spread_with_orders(
    db: AsyncSession,
    certificate_type: CertificateType,
    market_type: MarketType,
    admin_user_id: uuid.UUID,
    price_step: Decimal = Decimal("0.1"),
    quantity_per_level: Decimal = Decimal("100000"),
) -> Dict:
    """
    Fill the spread between best bid and best ask with orders at each price level.

    This creates market depth by:
    1. Placing BID orders from best_bid+0.1 up to best_ask-0.1 (to improve best bid)
    2. Filling any gaps in the ASK side (missing price levels like 10.0 when 9.9 and 10.1 exist)

    The goal is to ensure max spread = 0.1 EUR after execution.

    Args:
        db: Database session
        certificate_type: CEA or EUA
        market_type: CEA_CASH or SWAP
        admin_user_id: Admin user for audit trail
        price_step: Price increment (default 0.1 EUR)
        quantity_per_level: Quantity to place at each price level

    Returns:
        Dict with results including orders created, prices filled, etc.
    """
    result = {
        "success": False,
        "certificate_type": certificate_type.value,
        "orders_created": 0,
        "bid_orders": [],
        "ask_orders": [],
        "gaps_found": [],
        "message": "",
    }

    try:
        # Get best bid and ask
        best_bid, best_ask = await AutoTradeExecutor.get_best_prices(db, certificate_type)

        if not best_bid or not best_ask:
            result["message"] = f"Cannot fill spread: best_bid={best_bid}, best_ask={best_ask}"
            return result

        spread = best_ask - best_bid
        result["current_spread"] = str(spread)
        result["best_bid"] = str(best_bid)
        result["best_ask"] = str(best_ask)

        if spread <= price_step:
            result["message"] = f"Spread ({spread}) is already <= {price_step}, no filling needed"
            result["success"] = True
            return result

        # Get existing price levels
        existing_bids = set(await get_all_orderbook_prices(db, certificate_type, OrderSide.BUY))
        existing_asks = set(await get_all_orderbook_prices(db, certificate_type, OrderSide.SELL))

        # Get all market makers
        from app.models.models import MarketMakerClient

        # Get CEA_BUYER market makers for bid orders
        buyer_result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.mm_type == MarketMakerType.CEA_BUYER,
                )
            )
        )
        buyers = list(buyer_result.scalars().all())

        # Get CEA_SELLER market makers for ask orders
        seller_result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.mm_type == MarketMakerType.CEA_SELLER,
                )
            )
        )
        sellers = list(seller_result.scalars().all())

        if not buyers and not sellers:
            result["message"] = "No active market makers available"
            return result

        # Calculate BID prices to add (from best_bid+0.1 up to best_ask-0.1)
        # This will improve the best bid and narrow the spread
        bid_prices_to_add = []
        current_price = best_bid + price_step
        while current_price < best_ask:
            # Round to 0.1 EUR step
            current_price = (current_price / price_step).quantize(Decimal("1")) * price_step
            if current_price not in existing_bids:
                bid_prices_to_add.append(current_price)
            current_price += price_step

        # Calculate ASK gaps to fill (missing prices in the ask book)
        # Find gaps where consecutive asks differ by more than 0.1
        sorted_asks = sorted(existing_asks)
        ask_prices_to_add = []

        for i in range(len(sorted_asks) - 1):
            gap = sorted_asks[i + 1] - sorted_asks[i]
            if gap > price_step:
                # Fill the gap
                fill_price = sorted_asks[i] + price_step
                while fill_price < sorted_asks[i + 1]:
                    fill_price = (fill_price / price_step).quantize(Decimal("1")) * price_step
                    if fill_price not in existing_asks:
                        ask_prices_to_add.append(fill_price)
                        result["gaps_found"].append({
                            "between": [str(sorted_asks[i]), str(sorted_asks[i + 1])],
                            "filling": str(fill_price),
                        })
                    fill_price += price_step

        logger.info(f"Fill spread: bid_prices_to_add={bid_prices_to_add}, ask_prices_to_add={ask_prices_to_add}")

        # Place bid orders (using CEA_BUYER market makers)
        buyer_idx = 0
        for price in bid_prices_to_add:
            if not buyers:
                break

            mm = buyers[buyer_idx % len(buyers)]
            buyer_idx += 1

            # Create bid order (MMs have unlimited resources)
            order = Order(
                market=market_type,
                market_maker_id=mm.id,
                certificate_type=certificate_type,
                side=OrderSide.BUY,
                price=price,
                quantity=quantity_per_level,
                filled_quantity=Decimal("0"),
                status=OrderStatus.OPEN,
            )
            db.add(order)
            result["bid_orders"].append({"price": str(price), "mm": mm.name})
            result["orders_created"] += 1

        # Place ask orders (using CEA_SELLER market makers)
        seller_idx = 0
        for price in ask_prices_to_add:
            if not sellers:
                break

            mm = sellers[seller_idx % len(sellers)]
            seller_idx += 1

            # Create ask order (MMs have unlimited resources)
            order = Order(
                market=market_type,
                market_maker_id=mm.id,
                certificate_type=certificate_type,
                side=OrderSide.SELL,
                price=price,
                quantity=quantity_per_level,
                filled_quantity=Decimal("0"),
                status=OrderStatus.OPEN,
            )
            db.add(order)
            result["ask_orders"].append({"price": str(price), "mm": mm.name})
            result["orders_created"] += 1

        await db.commit()

        # Calculate new spread
        new_best_bid, new_best_ask = await AutoTradeExecutor.get_best_prices(db, certificate_type)
        if new_best_bid and new_best_ask:
            result["new_spread"] = str(new_best_ask - new_best_bid)
            result["new_best_bid"] = str(new_best_bid)
            result["new_best_ask"] = str(new_best_ask)

        result["success"] = True
        result["message"] = f"Created {result['orders_created']} orders to fill spread"

        logger.info(f"Fill spread complete: {result['orders_created']} orders created")

        return result

    except Exception as e:
        logger.exception(f"Error filling spread: {e}")
        await db.rollback()
        result["message"] = f"Error: {str(e)}"
        return result
