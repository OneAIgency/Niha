"""Liquidity management service"""
import uuid
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import (
    MarketMakerClient, MarketMakerType, Order, OrderSide, OrderStatus,
    CertificateType, AssetTransaction, TransactionType, LiquidityOperation
)
from app.services.ticket_service import TicketService
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
