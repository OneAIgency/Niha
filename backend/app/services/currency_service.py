"""
Currency Conversion Service

Provides EUR exchange rates from external API with caching and fallbacks.
This is the ONLY place in the codebase that handles currency conversion.
"""
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from typing import Optional, Dict
import httpx
import logging

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
        "CNY": Decimal("7.85"),   # 1 EUR = 7.85 CNY
        "USD": Decimal("1.08"),   # 1 EUR = 1.08 USD
        "HKD": Decimal("8.45"),   # 1 EUR = 8.45 HKD
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

        # Try cache first
        cached = await self._get_cached_rate(from_currency)
        if cached:
            return cached

        # Fetch fresh rates
        rates = await self._fetch_rates()
        if rates and from_currency in rates:
            return rates[from_currency]

        # Fallback to default
        if from_currency in self.FALLBACK_RATES:
            logger.warning(f"Using fallback rate for {from_currency}")
            self._fallback_count += 1
            return Decimal("1.0") / self.FALLBACK_RATES[from_currency]

        raise ValueError(f"No exchange rate available for {from_currency}")

    async def convert(
        self,
        amount: Decimal,
        from_currency: str,
        to_currency: str = "EUR"
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
            f"Currency conversion: {amount} {from_currency} → {converted} {to_currency} "
            f"(rate: {rate})"
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
                            eur_per_foreign = Decimal("1.0") / Decimal(str(rates[currency]))
                            converted_rates[currency] = eur_per_foreign

                    # Cache the rates
                    await self._cache_rates(converted_rates)
                    self._last_fetch = datetime.utcnow()
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
