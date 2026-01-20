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
