"""Liquidity management service"""
import uuid
from decimal import Decimal
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import (
    MarketMakerClient, MarketMakerType, Order, OrderSide, OrderStatus,
    CertificateType, AssetTransaction, TransactionType, LiquidityOperation
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
    """Service for managing liquidity operations"""

    # Default prices when no market data available
    DEFAULT_PRICES = {
        CertificateType.CEA: Decimal("14.0"),
        CertificateType.EUA: Decimal("81.0")
    }

    @staticmethod
    async def get_liquidity_providers(db: AsyncSession) -> List[MarketMakerClient]:
        """Get all active EUR-holding market makers with balances"""
        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.LIQUIDITY_PROVIDER,
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
        """Get all active asset-holding MMs with certificate balances"""
        # NOTE: This method has a known N+1 query issue. It fetches all asset holder MMs
        # in one query, then separately queries balances for each MM. This results in
        # 1 + (N × 5) queries where N is the number of asset holders.
        # Future optimization: Refactor balance calculation to use joins for bulk retrieval.

        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.ASSET_HOLDER,
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
        Returns plan showing what will be executed.
        """
        # Calculate reference price
        reference_price = await LiquidityService.calculate_reference_price(
            db, certificate_type
        )

        # Get liquidity providers
        lp_mms = await LiquidityService.get_liquidity_providers(db)
        total_eur_available = sum(mm.eur_balance for mm in lp_mms)

        # Check BID liquidity
        bid_sufficient = total_eur_available >= bid_amount_eur
        missing_assets = None

        if not bid_sufficient:
            missing_assets = {
                "asset_type": "EUR",
                "required": float(bid_amount_eur),
                "available": float(total_eur_available),
                "shortfall": float(bid_amount_eur - total_eur_available)
            }

        # Get asset holders
        ah_data = await LiquidityService.get_asset_holders(db, certificate_type)
        total_certs_available = sum(Decimal(str(ah["available"])) for ah in ah_data)
        ask_quantity_needed = ask_amount_eur / reference_price

        # Check ASK liquidity
        ask_sufficient = total_certs_available >= ask_quantity_needed

        if not ask_sufficient and not missing_assets:
            missing_assets = {
                "asset_type": certificate_type.value,
                "required": float(ask_quantity_needed),
                "available": float(total_certs_available),
                "shortfall": float(ask_quantity_needed - total_certs_available)
            }

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
                    "mm_type": "LIQUIDITY_PROVIDER",
                    "allocation": float(eur_per_mm),
                    "orders_count": 3
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
                    "mm_type": "ASSET_HOLDER",
                    "allocation": float(quantity_per_mm),
                    "orders_count": 3
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
        if missing_assets:
            if missing_assets["asset_type"] == "EUR":
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
            "missing_assets": missing_assets,
            "suggested_actions": suggested_actions,
            "total_orders_count": len(bid_plan["mms"]) * 3 + len(ask_plan["mms"]) * 3,
            "estimated_spread": 0.5  # 0.5% spread
        }
