"""Liquidity management service"""
import uuid
from decimal import Decimal
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import (
    MarketMakerClient, MarketMakerType, Order, OrderSide, OrderStatus,
    CertificateType, AssetTransaction, TransactionType, LiquidityOperation,
    MarketType
)
from app.services.ticket_service import TicketService
from app.services.market_maker_service import MarketMakerService
from app.models.models import TicketStatus
import logging

logger = logging.getLogger(__name__)


class InsufficientAssetsError(Exception):
    """Raised when market makers lack sufficient assets"""
    def __init__(self, asset_type: str, required: Decimal, available: Decimal):
        self.asset_type = asset_type
        self.required = required
        self.available = available
        self.shortfall = required - available
        super().__init__(
            f"Insufficient {asset_type}: need {required}, have {available}, short {self.shortfall}"
        )


class LiquidityService:
    """
    Service for managing liquidity operations.
    
    Provides automated liquidity injection by coordinating orders across multiple
    market makers. Supports two market maker types:
    - CASH_BUYER: Holds EUR, places BUY orders (BID liquidity)
    - CEA_CASH_SELLER: Holds certificates, places SELL orders (ASK liquidity)
    
    Orders are distributed across 3 price levels with tight spreads (0.2-0.5%)
    and volume allocation (50/30/20) for optimal market depth.
    """

    # Default prices when no market data available
    DEFAULT_PRICES = {
        CertificateType.CEA: Decimal("14.0"),
        CertificateType.EUA: Decimal("81.0")
    }

    # Liquidity operation constants
    ESTIMATED_SPREAD_PERCENT = 0.5  # 0.5% spread
    ORDERS_PER_MM = 3  # Price levels per market maker

    @staticmethod
    async def get_liquidity_providers(db: AsyncSession) -> List[MarketMakerClient]:
        """
        Get all active EUR-holding market makers with balances.
        
        Returns market makers of type CASH_BUYER that have positive EUR balance
        and are active. Used for placing BID orders.
        
        Args:
            db: Database session
            
        Returns:
            List of MarketMakerClient instances, sorted by EUR balance descending
        """
        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.CASH_BUYER,
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.eur_balance > 0
                )
            )
            .order_by(MarketMakerClient.eur_balance.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_asset_holders(
        db: AsyncSession,
        certificate_type: CertificateType
    ) -> List[Dict[str, Any]]:
        """
        Get all active asset-holding market makers with certificate balances.
        
        Returns market makers of type CEA_CASH_SELLER that have available
        certificate balance for the specified type. Used for placing ASK orders.
        
        Args:
            db: Database session
            certificate_type: Type of certificate (CEA or EUA)
            
        Returns:
            List of dictionaries with 'mm' (MarketMakerClient) and 'available'
            (Decimal balance) keys, sorted by available balance descending
            
        Note:
            This method has a known N+1 query issue. It fetches all asset holder
            MMs in one query, then separately queries balances for each MM.
            Future optimization: Refactor balance calculation to use joins.
        """
        # NOTE: This method has a known N+1 query issue. It fetches all asset holder MMs
        # in one query, then separately queries balances for each MM. This results in
        # 1 + (N × 5) queries where N is the number of asset holders.
        # Future optimization: Refactor balance calculation to use joins for bulk retrieval.

        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.CEA_CASH_SELLER,
                    MarketMakerClient.is_active == True
                )
            )
        )
        mms = result.scalars().all()

        # Get balances for each MM
        mm_data = []
        for mm in mms:
            balances = await MarketMakerService.get_balances(db, mm.id)
            balance_data = balances.get(certificate_type.value)
            if not balance_data:
                logger.warning(f"No balance data for {certificate_type.value} on MM {mm.id}")
                continue

            available = balance_data.get("available", Decimal("0"))
            if available > 0:
                mm_data.append({
                    "mm": mm,
                    "available": available
                })

        # Sort by available balance descending
        mm_data.sort(key=lambda x: x["available"], reverse=True)
        return mm_data

    @staticmethod
    async def calculate_reference_price(
        db: AsyncSession,
        certificate_type: CertificateType
    ) -> Decimal:
        """Calculate reference price from current orderbook"""
        from app.services.order_matching import get_real_orderbook

        try:
            orderbook = await get_real_orderbook(db, certificate_type.value)

            # Use mid-price if both sides exist
            if orderbook["best_bid"] and orderbook["best_ask"]:
                return (Decimal(str(orderbook["best_bid"])) +
                       Decimal(str(orderbook["best_ask"]))) / 2

            # Use best bid or ask if only one exists
            if orderbook["best_bid"]:
                return Decimal(str(orderbook["best_bid"]))
            if orderbook["best_ask"]:
                return Decimal(str(orderbook["best_ask"]))

            # Use last price if available
            if orderbook["last_price"]:
                return Decimal(str(orderbook["last_price"]))

        except Exception as e:
            logger.warning(f"Could not get orderbook price: {e}")
            logger.debug(f"Exception type: {type(e).__name__}", exc_info=True)

        # Fallback to default
        return LiquidityService.DEFAULT_PRICES[certificate_type]

    @staticmethod
    def generate_price_levels(
        reference_price: Decimal,
        side: OrderSide
    ) -> List[Tuple[Decimal, Decimal]]:
        """
        Generate 3 price levels with volume distribution.
        Returns: [(price, percentage), ...]

        Args:
            reference_price: Must be positive
            side: BUY or SELL

        Raises:
            ValueError: If reference_price <= 0
        """
        if reference_price <= 0:
            raise ValueError(f"reference_price must be positive, got {reference_price}")

        if side == OrderSide.BUY:
            # BID levels: 0.2%, 0.4%, 0.5% below mid
            levels = [
                (reference_price * Decimal("0.998"), Decimal("0.5")),  # 50% volume
                (reference_price * Decimal("0.996"), Decimal("0.3")),  # 30% volume
                (reference_price * Decimal("0.995"), Decimal("0.2")),  # 20% volume
            ]
        else:  # SELL
            # ASK levels: 0.2%, 0.4%, 0.5% above mid
            levels = [
                (reference_price * Decimal("1.002"), Decimal("0.5")),  # 50% volume
                (reference_price * Decimal("1.004"), Decimal("0.3")),  # 30% volume
                (reference_price * Decimal("1.005"), Decimal("0.2")),  # 20% volume
            ]

        return levels

    @staticmethod
    async def preview_liquidity_creation(
        db: AsyncSession,
        certificate_type: CertificateType,
        bid_amount_eur: Decimal,
        ask_amount_eur: Decimal
    ) -> Dict:
        """
        Preview liquidity creation without executing.

        Args:
            db: Database session
            certificate_type: Type of certificate (CEA or EUA)
            bid_amount_eur: Total EUR to allocate for BID orders (must be positive)
            ask_amount_eur: Total EUR value for ASK orders (must be positive)

        Returns:
            Dictionary containing:
                - can_execute (bool): Whether operation can proceed
                - certificate_type (str): Certificate type value
                - bid_plan (dict): BID order allocation plan with mms and price_levels
                - ask_plan (dict): ASK order allocation plan with mms and price_levels
                - missing_assets (list|None): List of missing asset details if insufficient
                - suggested_actions (list): Recommended actions if can't execute
                - total_orders_count (int): Total orders to be created
                - estimated_spread (float): Expected spread percentage

        Raises:
            ValueError: If amounts are non-positive or reference price is invalid

        Note:
            Does not modify database state. Used for validation before execution.
        """
        # Input validation
        if bid_amount_eur <= 0:
            raise ValueError(f"bid_amount_eur must be positive, got {bid_amount_eur}")
        if ask_amount_eur <= 0:
            raise ValueError(f"ask_amount_eur must be positive, got {ask_amount_eur}")

        # Calculate reference price
        reference_price = await LiquidityService.calculate_reference_price(
            db, certificate_type
        )

        if reference_price <= 0:
            raise ValueError(f"Invalid reference price: {reference_price}")

        # Get liquidity providers
        lp_mms = await LiquidityService.get_liquidity_providers(db)
        total_eur_available = sum(mm.eur_balance for mm in lp_mms)

        # Check BID liquidity
        bid_sufficient = total_eur_available >= bid_amount_eur
        missing_assets_list = []

        if not bid_sufficient:
            missing_assets_list.append({
                "asset_type": "EUR",
                "required": float(bid_amount_eur),
                "available": float(total_eur_available),
                "shortfall": float(bid_amount_eur - total_eur_available)
            })

        # Get asset holders
        ah_data = await LiquidityService.get_asset_holders(db, certificate_type)
        total_certs_available = sum(Decimal(str(ah["available"])) for ah in ah_data)
        ask_quantity_needed = ask_amount_eur / reference_price

        # Check ASK liquidity
        ask_sufficient = total_certs_available >= ask_quantity_needed

        if not ask_sufficient:
            missing_assets_list.append({
                "asset_type": certificate_type.value,
                "required": float(ask_quantity_needed),
                "available": float(total_certs_available),
                "shortfall": float(ask_quantity_needed - total_certs_available)
            })

        # Build BID plan
        bid_plan = {
            "mms": [],
            "total_amount": float(bid_amount_eur),
            "price_levels": []
        }

        if lp_mms:
            eur_per_mm = bid_amount_eur / len(lp_mms)
            for mm in lp_mms:
                bid_plan["mms"].append({
                    "mm_id": str(mm.id),
                    "mm_name": mm.name,
                    "mm_type": mm.mm_type.value,
                    "allocation": float(eur_per_mm),
                    "orders_count": LiquidityService.ORDERS_PER_MM
                })

            # Price levels
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.BUY)
            for price, pct in levels:
                bid_plan["price_levels"].append({
                    "price": float(price),
                    "percentage": float(pct * 100)
                })

        # Build ASK plan
        ask_plan = {
            "mms": [],
            "total_amount": float(ask_amount_eur),
            "price_levels": []
        }

        if ah_data:
            quantity_per_mm = ask_quantity_needed / len(ah_data)
            for ah in ah_data:
                ask_plan["mms"].append({
                    "mm_id": str(ah["mm"].id),
                    "mm_name": ah["mm"].name,
                    "mm_type": ah["mm"].mm_type.value,
                    "allocation": float(quantity_per_mm),
                    "orders_count": LiquidityService.ORDERS_PER_MM
                })

            # Price levels
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.SELL)
            for price, pct in levels:
                ask_plan["price_levels"].append({
                    "price": float(price),
                    "percentage": float(pct * 100)
                })

        # Suggested actions if insufficient
        suggested_actions = []
        if missing_assets_list:
            for missing in missing_assets_list:
                if missing["asset_type"] == "EUR":
                    suggested_actions.append("create_liquidity_providers")
                    suggested_actions.append("fund_existing_lps")
                else:
                    suggested_actions.append("create_asset_holders")
                    suggested_actions.append("fund_existing_ahs")

        return {
            "can_execute": bid_sufficient and ask_sufficient,
            "certificate_type": certificate_type.value,
            "bid_plan": bid_plan,
            "ask_plan": ask_plan,
            "missing_assets": missing_assets_list if missing_assets_list else None,
            "suggested_actions": suggested_actions,
            "total_orders_count": len(bid_plan["mms"]) * LiquidityService.ORDERS_PER_MM + len(ask_plan["mms"]) * LiquidityService.ORDERS_PER_MM,
            "estimated_spread": LiquidityService.ESTIMATED_SPREAD_PERCENT
        }

    @staticmethod
    async def create_liquidity(
        db: AsyncSession,
        certificate_type: CertificateType,
        bid_amount_eur: Decimal,
        ask_amount_eur: Decimal,
        created_by_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> LiquidityOperation:
        """
        Execute liquidity creation by placing orders across MMs.
        Raises InsufficientAssetsError if assets lacking.

        NOTE: This method has a known TOCTOU (time-of-check-time-of-use) issue
        between preview validation and execution. For production use, consider
        adding row-level locking or re-validating balances after fetching MMs.

        Args:
            db: Database session
            certificate_type: Type of certificate (CEA or EUA)
            bid_amount_eur: Total EUR to allocate for BID orders
            ask_amount_eur: Total EUR value for ASK orders
            created_by_id: User ID executing the operation
            notes: Optional notes for audit trail

        Returns:
            LiquidityOperation record with execution details

        Raises:
            InsufficientAssetsError: If insufficient assets to execute
            ValueError: If amounts are non-positive or no market makers available
        """
        # Step 1: Validate using preview
        preview = await LiquidityService.preview_liquidity_creation(
            db=db,
            certificate_type=certificate_type,
            bid_amount_eur=bid_amount_eur,
            ask_amount_eur=ask_amount_eur
        )

        if not preview["can_execute"]:
            # Raise error with details from preview
            missing = preview["missing_assets"][0]
            raise InsufficientAssetsError(
                asset_type=missing["asset_type"],
                required=Decimal(str(missing["required"])),
                available=Decimal(str(missing["available"]))
            )

        # Step 2: Calculate reference price
        reference_price = await LiquidityService.calculate_reference_price(
            db, certificate_type
        )

        # Step 3: Get liquidity providers and asset holders
        lp_mms = await LiquidityService.get_liquidity_providers(db)
        ah_data = await LiquidityService.get_asset_holders(db, certificate_type)

        # Validate we have market makers to work with
        if not lp_mms or len(lp_mms) == 0:
            raise ValueError("No active liquidity providers available for BID orders")
        if not ah_data or len(ah_data) == 0:
            raise ValueError(f"No active asset holders available for ASK orders with {certificate_type.value}")

        # Step 4: Create BID orders across liquidity providers
        bid_orders = []
        eur_per_lp = bid_amount_eur / len(lp_mms)
        bid_price_levels = LiquidityService.generate_price_levels(reference_price, OrderSide.BUY)

        for lp_mm in lp_mms:
            for price, pct in bid_price_levels:
                order_eur = eur_per_lp * pct
                quantity = order_eur / price

                order = Order(
                    id=uuid.uuid4(),
                    market=MarketType.CEA_CASH,
                    market_maker_id=lp_mm.id,
                    certificate_type=certificate_type,
                    side=OrderSide.BUY,
                    quantity=quantity,
                    price=price,
                    status=OrderStatus.OPEN
                )
                db.add(order)
                bid_orders.append(order)

            # Step 5: Validate and lock EUR
            if lp_mm.eur_balance < eur_per_lp:
                raise InsufficientAssetsError("EUR", eur_per_lp, lp_mm.eur_balance)
            lp_mm.eur_balance -= eur_per_lp

        # Step 6: Create ASK orders across asset holders
        ask_orders = []
        ask_quantity_needed = ask_amount_eur / reference_price
        quantity_per_ah = ask_quantity_needed / len(ah_data)
        ask_price_levels = LiquidityService.generate_price_levels(reference_price, OrderSide.SELL)

        for ah in ah_data:
            ah_mm = ah["mm"]
            for price, pct in ask_price_levels:
                quantity = quantity_per_ah * pct

                order = Order(
                    id=uuid.uuid4(),
                    market=MarketType.CEA_CASH,
                    market_maker_id=ah_mm.id,
                    certificate_type=certificate_type,
                    side=OrderSide.SELL,
                    quantity=quantity,
                    price=price,
                    status=OrderStatus.OPEN
                )
                db.add(order)
                ask_orders.append(order)

            # Lock certificates by creating asset transaction
            # Note: AssetTransaction uses 'amount' field, not 'quantity'
            # TRADE_DEBIT is used to lock assets when order is placed

            # Convert CertificateType to AssetType (same values: CEA/EUA)
            from app.models.models import AssetType
            asset_type_value = AssetType(certificate_type.value)

            transaction = AssetTransaction(
                id=uuid.uuid4(),
                market_maker_id=ah_mm.id,
                asset_type=asset_type_value,  # Populate for backward compatibility
                certificate_type=certificate_type,
                transaction_type=TransactionType.TRADE_DEBIT,
                amount=-quantity_per_ah,  # Negative for debit (lock)
                balance_before=ah["available"],  # Balance before the lock
                balance_after=ah["available"] - quantity_per_ah,  # Balance after the lock
                created_by=created_by_id
            )
            db.add(transaction)

        # Step 7: Create ticket for audit trail
        ticket = await TicketService.create_ticket(
            db=db,
            action_type="LIQUIDITY_CREATION",
            entity_type="LIQUIDITY_OPERATION",
            entity_id=None,  # Will be filled after operation is created
            status=TicketStatus.SUCCESS,
            user_id=created_by_id,
            request_payload={
                "certificate_type": certificate_type.value,
                "bid_amount_eur": str(bid_amount_eur),
                "ask_amount_eur": str(ask_amount_eur)
            },
            response_data={
                "bid_orders_count": len(lp_mms) * LiquidityService.ORDERS_PER_MM,
                "ask_orders_count": len(ah_data) * LiquidityService.ORDERS_PER_MM,
                "reference_price": str(reference_price)
            }
        )

        # Step 8: Create LiquidityOperation record
        market_makers_used = []
        for lp_mm in lp_mms:
            market_makers_used.append({
                "mm_id": str(lp_mm.id),
                "mm_type": lp_mm.mm_type.value,
                "amount": str(eur_per_lp)
            })
        for ah in ah_data:
            market_makers_used.append({
                "mm_id": str(ah["mm"].id),
                "mm_type": ah["mm"].mm_type.value,
                "amount": str(quantity_per_ah)
            })

        all_orders = bid_orders + ask_orders
        operation = LiquidityOperation(
            id=uuid.uuid4(),
            ticket_id=ticket.ticket_id,
            certificate_type=certificate_type,
            target_bid_liquidity_eur=bid_amount_eur,
            target_ask_liquidity_eur=ask_amount_eur,
            actual_bid_liquidity_eur=bid_amount_eur,
            actual_ask_liquidity_eur=ask_amount_eur,
            market_makers_used=market_makers_used,
            orders_created=[order.id for order in all_orders],
            reference_price=reference_price,
            created_by=created_by_id,
            notes=notes
        )
        db.add(operation)

        # Step 9: Commit and return
        await db.flush()
        await db.refresh(operation)

        return operation
