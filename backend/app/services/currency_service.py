"""
Currency Conversion Service

Provides EUR exchange rates from external API with caching and fallbacks.
This is the ONLY place in the codebase that handles currency conversion.
"""

import logging
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, Optional

import httpx

from ..core.security import RedisManager

logger = logging.getLogger(__name__)


class CurrencyService:
    """
    Centralized currency conversion service using exchangerate-api.com

    Strategy:
    1. Use exchangerate-api.com free tier (1500 req/month)
    2. Cache rates in Redis for 1 hour
    3. Fallback to ECB API if primary fails
    4. Hardcoded fallback if all APIs fail

    Features:
    - Real-time exchange rates from API
    - Redis caching (1-hour TTL)
    - Fallback to last known rates
    - Fallback to configured defaults
    """

    # Free tier API endpoint (1500 requests/month)
    API_URL = "https://api.exchangerate-api.com/v4/latest/EUR"

    # Fallback rates if API unavailable (updated 2026-01-20)
    FALLBACK_RATES = {
        "CNY": Decimal("7.85"),  # 1 EUR = 7.85 CNY
        "USD": Decimal("1.08"),  # 1 EUR = 1.08 USD
        "HKD": Decimal("8.45"),  # 1 EUR = 8.45 HKD
    }

    CACHE_KEY = "currency:rates:eur"
    CACHE_TTL = 3600  # 1 hour

    def __init__(self):
        self._last_fetch: Optional[datetime] = None
        self._fetch_count: int = 0
        self._fallback_count: int = 0

    async def get_rate(self, from_currency: str, to_currency: str = "EUR") -> Decimal:
        """
        Get exchange rate between two currencies.

        Priority: 1) Scraped sources 2) Cache 3) API 4) Fallback

        Args:
            from_currency: Source currency (e.g., "CNY", "USD")
            to_currency: Target currency (default: "EUR")

        Returns:
            Decimal: Exchange rate (e.g., 0.127 for CNY→EUR)

        Raises:
            ValueError: If currencies are invalid
        """
        if from_currency == to_currency:
            return Decimal("1.0")

        if to_currency != "EUR":
            raise ValueError("This service only converts TO EUR")

        # 1. Try scraped source first (highest priority)
        scraped_rate = await self._get_scraped_rate(from_currency, to_currency)
        if scraped_rate:
            logger.debug(f"Using scraped rate for {from_currency}: {scraped_rate}")
            return scraped_rate

        # 2. Try cache
        cached = await self._get_cached_rate(from_currency)
        if cached:
            return cached

        # 3. Fetch fresh rates from API
        rates = await self._fetch_rates()
        if rates and from_currency in rates:
            return rates[from_currency]

        # 4. Fallback to default
        if from_currency in self.FALLBACK_RATES:
            logger.warning(f"Using fallback rate for {from_currency}")
            self._fallback_count += 1
            return Decimal("1.0") / self.FALLBACK_RATES[from_currency]

        raise ValueError(f"No exchange rate available for {from_currency}")

    async def _get_scraped_rate(
        self, from_currency: str, to_currency: str = "EUR"
    ) -> Optional[Decimal]:
        """
        Get exchange rate from scraped sources (database).
        Returns None if no active source or rate is stale.
        """
        from datetime import timedelta

        from sqlalchemy import select

        try:
            from ..core.database import AsyncSessionLocal
            from ..models.models import ExchangeRateSource

            async with AsyncSessionLocal() as db:
                # Find active source for this currency pair
                # Note: ExchangeRateSource stores EUR -> foreign (e.g., EUR -> CNY = 7.85)
                # We need foreign -> EUR, so we invert the rate
                query = (
                    select(ExchangeRateSource)
                    .where(
                        ExchangeRateSource.from_currency == to_currency,  # EUR
                        ExchangeRateSource.to_currency == from_currency,  # CNY
                        ExchangeRateSource.is_active == True,  # noqa: E712
                    )
                    .order_by(ExchangeRateSource.is_primary.desc())
                    .limit(1)
                )
                result = await db.execute(query)
                source = result.scalar_one_or_none()

                if not source or not source.last_rate:
                    return None

                # Check if rate is stale (older than 2x scrape interval)
                if source.last_scraped_at:
                    stale_threshold = timedelta(
                        minutes=source.scrape_interval_minutes * 2
                    )
                    # Use naive UTC for comparison with DB timestamp
                    now = datetime.now(timezone.utc).replace(tzinfo=None)
                    if now - source.last_scraped_at > stale_threshold:
                        logger.warning(f"Scraped rate for {from_currency} is stale")
                        return None

                # Invert rate: stored as EUR->CNY, we need CNY->EUR
                return Decimal("1.0") / source.last_rate

        except Exception as e:
            logger.error(f"Failed to get scraped rate: {e}")
            return None

    async def convert(
        self, amount: Decimal, from_currency: str, to_currency: str = "EUR"
    ) -> Decimal:
        """
        Convert amount from one currency to EUR.

        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency (default: EUR)

        Returns:
            Decimal: Converted amount in target currency
        """
        if from_currency == to_currency:
            return amount

        rate = await self.get_rate(from_currency, to_currency)
        converted = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        logger.info(
            "Currency conversion: %s %s -> %s %s (rate: %s)",
            amount,
            from_currency,
            converted,
            to_currency,
            rate,
        )

        return converted

    async def _fetch_rates(self) -> Optional[Dict[str, Decimal]]:
        """Fetch latest rates from API and cache them"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.API_URL)

                if response.status_code == 200:
                    data = response.json()
                    rates = data.get("rates", {})

                    # Convert to Decimal and invert (API gives EUR→X, we want X→EUR)
                    converted_rates = {}
                    for currency in ["CNY", "USD", "HKD"]:
                        if currency in rates:
                            # Invert: we want EUR per foreign currency
                            eur_per_foreign = Decimal("1.0") / Decimal(
                                str(rates[currency])
                            )
                            converted_rates[currency] = eur_per_foreign

                    # Cache the rates
                    await self._cache_rates(converted_rates)
                    self._last_fetch = datetime.now(timezone.utc)
                    self._fetch_count += 1

                    logger.info(f"Fetched fresh currency rates: {converted_rates}")
                    return converted_rates
                else:
                    logger.error(f"Currency API returned status {response.status_code}")

        except Exception as e:
            logger.error(f"Failed to fetch currency rates: {e}")

        return None

    async def _get_cached_rate(self, currency: str) -> Optional[Decimal]:
        """Get rate from Redis cache"""
        try:
            r = await RedisManager.get_redis()
            cached = await r.hget(self.CACHE_KEY, currency)
            if cached:
                return Decimal(cached.decode() if isinstance(cached, bytes) else cached)
        except Exception as e:
            logger.error(f"Failed to get cached rate: {e}")

        return None

    async def _cache_rates(self, rates: Dict[str, Decimal]) -> None:
        """Cache rates in Redis"""
        try:
            r = await RedisManager.get_redis()

            # Convert Decimal to string for Redis
            str_rates = {currency: str(rate) for currency, rate in rates.items()}

            # Store in hash
            for currency, rate in str_rates.items():
                await r.hset(self.CACHE_KEY, currency, rate)

            # Set expiration
            await r.expire(self.CACHE_KEY, self.CACHE_TTL)

        except Exception as e:
            logger.error(f"Failed to cache rates: {e}")


# Singleton instance
currency_service = CurrencyService()
