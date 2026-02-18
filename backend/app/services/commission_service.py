"""Commission calculation service.

Called from order matching after a CashMarketTrade is created.
Checks if the buying entity's user was referred by an INTRODUCER,
and if so, creates a CommissionLedger row snapshotting the trade value.
"""

import logging
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    CashMarketTrade,
    CommissionLedger,
    ContactRequest,
    User,
    UserRole,
)

logger = logging.getLogger(__name__)

# Platform default commission rate (1%)
DEFAULT_COMMISSION_RATE = Decimal("0.010000")


async def maybe_create_commission(
    db: AsyncSession,
    trade: CashMarketTrade,
    buyer_entity_id: UUID,
) -> None:
    """If the buying entity's user was referred by an INTRODUCER, record commission.

    This runs inside the caller's transaction -- no separate commit.
    Safe to call for every trade; returns early if no referral link exists.
    """
    # 1. Find user(s) associated with the buying entity
    result = await db.execute(
        select(User).where(User.entity_id == buyer_entity_id).limit(1)
    )
    buyer_user = result.scalar_one_or_none()
    if not buyer_user:
        return

    # 2. Check if this user was referred (ContactRequest with referred_by_user_id)
    cr_result = await db.execute(
        select(ContactRequest)
        .where(ContactRequest.contact_email == buyer_user.email)
        .where(ContactRequest.referred_by_user_id.isnot(None))
        .limit(1)
    )
    cr = cr_result.scalar_one_or_none()
    if not cr or not cr.referred_by_user_id:
        return

    # 3. Verify introducer is still active
    introducer = await db.get(User, cr.referred_by_user_id)
    if not introducer or introducer.role not in (UserRole.INTRODUCER, UserRole.ADMIN):
        return

    # 4. Calculate commission
    trade_eur = trade.price * trade.quantity
    rate = introducer.commission_rate or DEFAULT_COMMISSION_RATE
    commission = (trade_eur * rate).quantize(Decimal("0.01"))

    if commission <= 0:
        return

    # 5. Create ledger entry (append-only)
    entry = CommissionLedger(
        introducer_user_id=cr.referred_by_user_id,
        referred_user_id=buyer_user.id,
        referred_entity_id=buyer_entity_id,
        cash_market_trade_id=trade.id,
        trade_eur_value=trade_eur,
        commission_rate=rate,
        commission_eur=commission,
        trade_executed_at=trade.executed_at,
    )
    db.add(entry)
    logger.info(
        "Commission recorded: introducer=%s referred=%s trade=%s EUR=%.2f commission=%.2f",
        cr.referred_by_user_id,
        buyer_user.id,
        trade.id,
        trade_eur,
        commission,
    )
