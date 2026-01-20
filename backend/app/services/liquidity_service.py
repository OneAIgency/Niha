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
        """
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
