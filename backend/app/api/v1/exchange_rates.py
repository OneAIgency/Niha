"""Public exchange rate history endpoint (any authenticated user)."""

from datetime import datetime, timedelta, timezone
from enum import Enum

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import ExchangeRateHistory, ExchangeRateSource, User

router = APIRouter(prefix="/exchange-rates", tags=["exchange-rates"])


class Period(str, Enum):
    H24 = "24h"
    D7 = "7d"
    D30 = "30d"
    D90 = "90d"
    Y1 = "1y"


_PERIOD_HOURS = {
    Period.H24: 24,
    Period.D7: 7 * 24,
    Period.D30: 30 * 24,
    Period.D90: 90 * 24,
    Period.Y1: 365 * 24,
}


@router.get("/history")
async def get_exchange_rate_history(
    from_currency: str = Query("EUR", min_length=3, max_length=3),
    to_currency: str = Query("CNY", min_length=3, max_length=3),
    period: Period = Query(Period.H24),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return exchange rate history for a currency pair.

    Short periods (24h, 7d, 30d) return raw data points.
    Long periods (90d, 1y) return daily averages for performance.
    """
    hours = _PERIOD_HOURS[period]
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours)

    use_daily = period in (Period.D90, Period.Y1)

    if use_daily:
        day_col = func.date_trunc("day", ExchangeRateHistory.recorded_at)
        query = (
            select(
                day_col.label("day"),
                func.avg(ExchangeRateHistory.rate).label("avg_rate"),
            )
            .where(
                ExchangeRateHistory.from_currency == from_currency.upper(),
                ExchangeRateHistory.to_currency == to_currency.upper(),
                ExchangeRateHistory.recorded_at >= since,
            )
            .group_by(day_col)
            .order_by(day_col.asc())
        )
        rows = (await db.execute(query)).all()
        points = [
            {"rate": round(float(r.avg_rate), 8), "recorded_at": r.day.isoformat() + "Z"}
            for r in rows
        ]
    else:
        query = (
            select(ExchangeRateHistory)
            .where(
                ExchangeRateHistory.from_currency == from_currency.upper(),
                ExchangeRateHistory.to_currency == to_currency.upper(),
                ExchangeRateHistory.recorded_at >= since,
            )
            .order_by(ExchangeRateHistory.recorded_at.asc())
        )
        rows = (await db.execute(query)).scalars().all()
        points = [
            {"rate": float(r.rate), "recorded_at": r.recorded_at.isoformat() + "Z"}
            for r in rows
        ]

    # Current rate from primary source
    source_q = (
        select(ExchangeRateSource)
        .where(
            ExchangeRateSource.from_currency == from_currency.upper(),
            ExchangeRateSource.to_currency == to_currency.upper(),
            ExchangeRateSource.is_active.is_(True),
        )
        .order_by(ExchangeRateSource.is_primary.desc())
        .limit(1)
    )
    source = (await db.execute(source_q)).scalar_one_or_none()
    current_rate = float(source.last_rate) if source and source.last_rate else None

    return {
        "pair": f"{from_currency.upper()}/{to_currency.upper()}",
        "period": period.value,
        "current_rate": current_rate,
        "points": points,
    }
