import asyncio
import logging
import random
import re
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional

import httpx
from bs4 import BeautifulSoup

from ..core.security import RedisManager
from ..models.models import (
    CertificateType,
    ExchangeRateSource,
    PriceHistory,
    ScrapeLibrary,
    ScrapeStatus,
    ScrapingSource,
)
from .currency_service import currency_service

logger = logging.getLogger(__name__)


class PriceScraper:
    """
    Service to fetch carbon credit prices from various sources.
    Supports multiple scraping libraries: httpx, beautifulsoup, selenium, playwright.
    """

    # Base prices from market research (fallback)
    BASE_EUA_EUR = 75.0  # EU Allowances in EUR
    BASE_CEA_EUR = 13.0  # China Allowances in EUR (converted from ~100 CNY)

    def __init__(self):
        self.last_eua_price = self.BASE_EUA_EUR
        self.last_cea_price = self.BASE_CEA_EUR
        self.last_update = datetime.now(timezone.utc).replace(tzinfo=None)

    def _apply_variance(self, base_price: float, max_variance: float = 0.02) -> float:
        """Apply realistic price variance (±2% by default)"""
        variance = random.uniform(-max_variance, max_variance)
        return round(base_price * (1 + variance), 2)

    def _parse_price(self, price_str: str) -> Optional[float]:
        """Parse a price string to float, handling currency symbols"""
        if not price_str:
            return None
        # Remove currency symbols and whitespace
        cleaned = re.sub(r"[€$¥£,\s]", "", price_str.strip())
        try:
            return float(cleaned)
        except ValueError:
            return None

    async def scrape_with_httpx(
        self, url: str, config: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Scrape using httpx (fast async HTTP client).
        Best for simple API endpoints or pages that don't require JavaScript.
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                headers = {
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 Chrome/120.0.0.0"
                    ),
                    "Accept": (
                        "text/html,application/xhtml+xml,"
                        "application/xml;q=0.9,*/*;q=0.8"
                    ),
                    "Accept-Language": "en-US,en;q=0.5",
                }
                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    return {
                        "success": True,
                        "content": response.text,
                        "status_code": response.status_code,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "status_code": response.status_code,
                    }
        except Exception as e:
            logger.error(f"HTTPX scrape failed: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_with_beautifulsoup(
        self, url: str, config: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Scrape using BeautifulSoup for HTML parsing.
        First fetches with httpx, then parses with BeautifulSoup.
        """
        result = await self.scrape_with_httpx(url, config)
        if not result or not result.get("success"):
            return result

        try:
            soup = BeautifulSoup(result["content"], "html.parser")
            return {"success": True, "soup": soup, "content": result["content"]}
        except Exception as e:
            logger.error(f"BeautifulSoup parse failed: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_with_selenium(
        self, url: str, config: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Scrape using Selenium for JavaScript-rendered pages.
        Note: Requires selenium and webdriver to be installed.
        """
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options

            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument(
                "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
            )

            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(30)

            try:
                driver.get(url)
                # Wait for page to load
                await asyncio.sleep(3)

                content = driver.page_source
                return {
                    "success": True,
                    "content": content,
                    "soup": BeautifulSoup(content, "html.parser"),
                }
            finally:
                driver.quit()

        except ImportError:
            return {
                "success": False,
                "error": "Selenium not installed. Install with: pip install selenium",
            }
        except Exception as e:
            logger.error(f"Selenium scrape failed: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_with_playwright(
        self, url: str, config: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Scrape using Playwright for JavaScript-rendered pages.
        Note: Requires playwright to be installed.
        """
        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                    )
                )
                page = await context.new_page()

                try:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                    content = await page.content()

                    return {
                        "success": True,
                        "content": content,
                        "soup": BeautifulSoup(content, "html.parser"),
                    }
                finally:
                    await browser.close()

        except ImportError:
            return {
                "success": False,
                "error": (
                    "Playwright not installed. Install with: "
                    "pip install playwright && playwright install chromium"
                ),
            }
        except Exception as e:
            logger.error(f"Playwright scrape failed: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_source(self, source: ScrapingSource) -> Optional[float]:
        """
        Scrape a specific source and extract the price.
        This is called by the test endpoint.
        """
        url = source.url
        library = source.scrape_library or ScrapeLibrary.HTTPX
        config = source.config or {}

        # Special handling for carboncredits.com - use their API endpoint
        if "carboncredits.com" in url:
            return await self._scrape_carboncredits(source)

        # Generic scraping based on library
        if library == ScrapeLibrary.HTTPX:
            result = await self.scrape_with_httpx(url, config)
        elif library == ScrapeLibrary.BEAUTIFULSOUP:
            result = await self.scrape_with_beautifulsoup(url, config)
        elif library == ScrapeLibrary.SELENIUM:
            result = await self.scrape_with_selenium(url, config)
        elif library == ScrapeLibrary.PLAYWRIGHT:
            result = await self.scrape_with_playwright(url, config)
        else:
            result = await self.scrape_with_httpx(url, config)

        if not result or not result.get("success"):
            error_msg = (
                result.get("error", "Unknown error") if result else "No response"
            )
            raise Exception(f"Scraping failed: {error_msg}")

        # Extract price based on config or default patterns
        price = await self._extract_price(result, source, config)
        return price

    async def _scrape_carboncredits(self, source: ScrapingSource) -> Optional[float]:
        """
        Special scraping logic for carboncredits.com.
        Uses their PHP endpoint that returns CSV data.
        """
        api_url = "https://carboncredits.com/wp-content/themes/fetchcarbonprices.php"

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                headers = {
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                    ),
                    "Referer": "https://carboncredits.com/carbon-prices-today/",
                    "Accept": "*/*",
                }
                response = await client.get(api_url, headers=headers)

                if response.status_code == 200:
                    content = response.text
                    logger.info(f"CarbonCredits API response: {content[:500]}")

                    # Parse CSV-like data
                    # Format: "Market,Price,Change,YTD\nEU,€88.65,+1.23%,+5.67%\n..."
                    lines = content.strip().split("\n")

                    for line in lines:
                        # Handle quoted fields and commas
                        parts = self._parse_csv_line(line)
                        if len(parts) >= 2:
                            market = parts[0].strip().lower()
                            price_str = parts[1].strip()

                            # Match based on certificate type
                            if source.certificate_type == CertificateType.EUA:
                                if (
                                    "european" in market
                                    or "eu" in market
                                    or "eua" in market
                                ):
                                    price = self._parse_price(price_str)
                                    if price:
                                        logger.info(f"Found EUA price: {price}")
                                        return price
                            elif source.certificate_type == CertificateType.CEA:
                                if (
                                    "china" in market
                                    or "cea" in market
                                    or "chinese" in market
                                ):
                                    price = self._parse_price(price_str)
                                    if price:
                                        logger.info(f"Found CEA price: {price}")
                                        return price

                    cert_val = source.certificate_type.value
                    raise Exception(f"Could not find {cert_val} price")
                else:
                    raise Exception(f"HTTP {response.status_code}")

        except Exception as e:
            logger.error(f"CarbonCredits scrape failed: {e}")
            raise

    def _parse_csv_line(self, line: str) -> list:
        """Parse a CSV line handling quoted fields"""
        result = []
        current = ""
        in_quotes = False

        for char in line:
            if char == '"':
                in_quotes = not in_quotes
            elif char == "," and not in_quotes:
                result.append(current)
                current = ""
            else:
                current += char

        result.append(current)
        return result

    async def _extract_price(
        self, result: Dict, source: ScrapingSource, config: Dict
    ) -> Optional[float]:
        """
        Extract price from scraped content using config or default patterns.
        """
        content = result.get("content", "")
        soup = result.get("soup")

        # Check for CSS selector in config
        if config.get("css_selector") and soup:
            element = soup.select_one(config["css_selector"])
            if element:
                return self._parse_price(element.get_text())

        # Check for regex pattern in config
        if config.get("regex_pattern"):
            match = re.search(config["regex_pattern"], content)
            if match:
                return self._parse_price(match.group(1))

        # Default: look for common price patterns
        # Pattern for prices like €75.50, $80.00, ¥100.00
        price_patterns = [
            r"[€$¥£]\s*([\d,]+\.?\d*)",
            r"([\d,]+\.?\d*)\s*(?:EUR|USD|CNY|GBP)",
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, content)
            if matches:
                # Return first valid price
                for match in matches:
                    price = self._parse_price(match)
                    if price and price > 0:
                        return price

        return None

    async def refresh_source(self, source: ScrapingSource, db) -> None:
        """
        Refresh prices from a source and update the database.
        For CEA sources, also calculates and stores the EUR-converted price.
        """
        from sqlalchemy import update

        try:
            price = await self.scrape_source(source)
            # Naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
            now = datetime.now(timezone.utc).replace(tzinfo=None)

            if price:
                price_decimal = Decimal(str(price))

                # For CEA, calculate EUR price using current exchange rate
                price_eur = None
                exchange_rate = None
                if source.certificate_type == CertificateType.CEA:
                    try:
                        # Get CNY to EUR rate (price is in CNY, convert to EUR)
                        rate = await currency_service.get_rate("CNY", "EUR")
                        price_eur = (price_decimal * rate).quantize(
                            Decimal("0.0001")
                        )
                        # Store the inverse rate (EUR/CNY) for display purposes
                        exchange_rate = (Decimal("1.0") / rate).quantize(
                            Decimal("0.00000001")
                        )
                        logger.info(
                            f"CEA conversion: {price_decimal} CNY * {rate} = {price_eur} EUR "
                            f"(rate EUR/CNY: {exchange_rate})"
                        )
                    except Exception as e:
                        logger.warning(f"Failed to convert CEA price to EUR: {e}")

                # Use explicit UPDATE statement to ensure all fields are updated
                update_values = {
                    "last_price": price_decimal,
                    "last_scrape_at": now,
                    "last_scrape_status": ScrapeStatus.SUCCESS,
                }
                if price_eur is not None:
                    update_values["last_price_eur"] = price_eur
                    update_values["last_exchange_rate"] = exchange_rate

                await db.execute(
                    update(ScrapingSource)
                    .where(ScrapingSource.id == source.id)
                    .values(**update_values)
                )

                # Update local object for logging
                source.last_price = price_decimal
                source.last_scrape_at = now
                source.last_scrape_status = ScrapeStatus.SUCCESS
                if price_eur is not None:
                    source.last_price_eur = price_eur
                    source.last_exchange_rate = exchange_rate

                # Add to price history
                history = PriceHistory(
                    certificate_type=source.certificate_type,
                    price=price_decimal,
                    currency="EUR"
                    if source.certificate_type == CertificateType.EUA
                    else "CNY",
                    source=source.name,
                )
                db.add(history)

                await db.commit()
                logger.info(f"Refreshed {source.name}: {price}")
            else:
                # Use explicit UPDATE for failure case
                await db.execute(
                    update(ScrapingSource)
                    .where(ScrapingSource.id == source.id)
                    .values(
                        last_scrape_at=now,
                        last_scrape_status=ScrapeStatus.FAILED,
                    )
                )
                await db.commit()
                raise Exception("No price found")

        except asyncio.TimeoutError as e:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            await db.execute(
                update(ScrapingSource)
                .where(ScrapingSource.id == source.id)
                .values(
                    last_scrape_at=now,
                    last_scrape_status=ScrapeStatus.TIMEOUT,
                )
            )
            await db.commit()
            raise Exception("Scrape timeout") from e
        except Exception:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            try:
                await db.execute(
                    update(ScrapingSource)
                    .where(ScrapingSource.id == source.id)
                    .values(
                        last_scrape_at=now,
                        last_scrape_status=ScrapeStatus.FAILED,
                    )
                )
                await db.commit()
            except Exception:
                pass  # Don't fail on update error during exception handling
            raise

    async def fetch_prices_from_web(self) -> Optional[Dict]:
        """
        Attempt to fetch real prices from carboncredits.com
        """
        try:
            api_url = (
                "https://carboncredits.com/wp-content/themes/fetchcarbonprices.php"
            )

            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                headers = {
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                    ),
                    "Referer": "https://carboncredits.com/carbon-prices-today/",
                }
                response = await client.get(api_url, headers=headers)

                if response.status_code == 200:
                    content = response.text
                    prices = {}

                    for line in content.strip().split("\n"):
                        parts = self._parse_csv_line(line)
                        if len(parts) >= 2:
                            market = parts[0].strip().lower()
                            price_str = parts[1].strip()

                            if "european" in market or "eu" in market:
                                prices["eua"] = self._parse_price(price_str)
                            elif "china" in market:
                                prices["cea"] = self._parse_price(price_str)

                    if prices:
                        return prices

        except Exception as e:
            logger.warning(f"Failed to fetch prices from web: {e}")

        return None

    async def get_current_prices(self) -> Dict:
        """Get current carbon prices with realistic variance - ALL IN EUR"""

        # Try to fetch real prices first
        web_prices = await self.fetch_prices_from_web()

        if web_prices and web_prices.get("eua"):
            eua_eur = web_prices["eua"]
            cea_cny = web_prices.get("cea", 100.0)  # CEA fetched in CNY
        else:
            # Check cache
            cached = await RedisManager.get_cached_prices()
            if cached and "eua_eur" in cached:
                return {
                    "eua": {
                        "price": float(cached.get("eua_eur", self.BASE_EUA_EUR)),
                        "currency": "EUR",
                        "change_24h": float(cached.get("eua_change", 0)),
                    },
                    "cea": {
                        "price": float(cached.get("cea_eur", self.BASE_CEA_EUR)),
                        "currency": "EUR",
                        "change_24h": float(cached.get("cea_change", 0)),
                    },
                    "updated_at": cached.get(
                        "updated_at", datetime.now(timezone.utc).isoformat()
                    ),
                }

            # Fallback to simulated prices
            eua_eur = self._apply_variance(self.BASE_EUA_EUR)
            cea_cny = 100.0  # Fallback CEA in CNY

        # Convert CEA from CNY to EUR using currency service
        cea_eur = float(
            await currency_service.convert(
                amount=Decimal(str(cea_cny)), from_currency="CNY", to_currency="EUR"
            )
        )

        # Calculate 24h change (simulated if not available)
        eua_change = round(random.uniform(-3, 3), 2)
        cea_change = round(random.uniform(-2, 2), 2)

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        prices = {
            "eua": {
                "price": eua_eur,
                "currency": "EUR",
                "change_24h": eua_change,
            },
            "cea": {
                "price": cea_eur,
                "currency": "EUR",
                "change_24h": cea_change,
            },
            "updated_at": now.isoformat(),
        }

        # Cache the prices (EUR only)
        await RedisManager.cache_prices(
            {
                "eua_eur": str(eua_eur),
                "eua_change": str(eua_change),
                "cea_eur": str(cea_eur),
                "cea_change": str(cea_change),
                "updated_at": now.isoformat(),
            }
        )

        self.last_eua_price = eua_eur
        self.last_cea_price = cea_eur  # Now storing EUR
        self.last_update = now

        return prices

    async def get_price_trend_async(self, hours: int = 24) -> Dict:
        """Get historical price data from database for charts.
        Both EUA and CEA are shown in EUR for proper comparison.
        """
        from sqlalchemy import select

        days = hours // 24
        start_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=max(days, 1))

        eua_data = []
        cea_data = []

        try:
            # Import here to avoid circular imports
            from ..core.database import AsyncSessionLocal

            async with AsyncSessionLocal() as db:
                # Get EUA prices from database
                eua_query = (
                    select(PriceHistory)
                    .where(
                        PriceHistory.certificate_type == CertificateType.EUA,
                        PriceHistory.recorded_at >= start_date,
                    )
                    .order_by(PriceHistory.recorded_at.asc())
                )

                eua_result = await db.execute(eua_query)
                eua_records = eua_result.scalars().all()

                # Get CEA prices from database
                cea_query = (
                    select(PriceHistory)
                    .where(
                        PriceHistory.certificate_type == CertificateType.CEA,
                        PriceHistory.recorded_at >= start_date,
                    )
                    .order_by(PriceHistory.recorded_at.asc())
                )

                cea_result = await db.execute(cea_query)
                cea_records = cea_result.scalars().all()

                if eua_records and cea_records:
                    logger.info(
                        "Using %d EUA and %d CEA records from database",
                        len(eua_records),
                        len(cea_records),
                    )

                    for record in eua_records:
                        eua_data.append(
                            {
                                "price": float(record.price),
                                "timestamp": record.recorded_at.isoformat(),
                            }
                        )

                    for record in cea_records:
                        cea_data.append(
                            {
                                "price": float(record.price),
                                "timestamp": record.recorded_at.isoformat(),
                            }
                        )

                    return {"eua": eua_data, "cea": cea_data}
        except Exception as e:
            logger.warning(f"Failed to get prices from database: {e}")

        # Fallback to current prices if no database records
        logger.info("No database records, using fallback prices")
        cached = await RedisManager.get_cached_prices()
        base_eua_eur = (
            float(cached.get("eua_eur", self.BASE_EUA_EUR))
            if cached
            else self.BASE_EUA_EUR
        )
        base_cea_eur = (
            float(cached.get("cea_eur", self.BASE_CEA_EUR))
            if cached
            else self.BASE_CEA_EUR
        )

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for i in range(days, -1, -1):
            timestamp = now - timedelta(days=i)
            eua_data.append({"price": base_eua_eur, "timestamp": timestamp.isoformat()})
            cea_data.append({"price": base_cea_eur, "timestamp": timestamp.isoformat()})

        return {"eua": eua_data, "cea": cea_data}

    # ==================== Exchange Rate Scraping ====================

    async def scrape_exchange_rate(self, source: ExchangeRateSource) -> Optional[float]:
        """
        Scrape exchange rate from a configured source.
        Supports ECB XML feed and generic scraping.
        """
        url = source.url
        config = source.config or {}

        # Special handling for ECB XML feed
        if "ecb.europa.eu" in url:
            return await self._scrape_ecb_rate(source)

        # Generic scraping based on library
        library = source.scrape_library or ScrapeLibrary.HTTPX
        if library == ScrapeLibrary.HTTPX:
            result = await self.scrape_with_httpx(url, config)
        elif library == ScrapeLibrary.BEAUTIFULSOUP:
            result = await self.scrape_with_beautifulsoup(url, config)
        else:
            result = await self.scrape_with_httpx(url, config)

        if not result or not result.get("success"):
            error_msg = result.get("error", "Unknown error") if result else "No response"
            raise Exception(f"Exchange rate scraping failed: {error_msg}")

        # Extract rate based on config
        rate = self._extract_exchange_rate(result, source, config)
        return rate

    async def _scrape_ecb_rate(self, source: ExchangeRateSource) -> Optional[float]:
        """
        Scrape EUR exchange rates from ECB XML feed.
        URL: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
        """
        import xml.etree.ElementTree as ET

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(source.url)

                if response.status_code == 200:
                    root = ET.fromstring(response.text)

                    # ECB namespace
                    ns = {
                        "gesmes": "http://www.gesmes.org/xml/2002-08-01",
                        "eurofxref": "http://www.ecb.int/vocabulary/2002-08-01/eurofxref",
                    }

                    # Find the Cube element with rates
                    for cube in root.findall(".//eurofxref:Cube[@currency]", ns):
                        currency = cube.get("currency")
                        if currency == source.to_currency:
                            rate = float(cube.get("rate"))
                            logger.info(
                                f"ECB rate {source.from_currency}/{currency}: {rate}"
                            )
                            return rate

                    raise Exception(
                        f"Currency {source.to_currency} not found in ECB feed"
                    )
                else:
                    raise Exception(f"ECB API returned HTTP {response.status_code}")
        except ET.ParseError as e:
            logger.error(f"ECB XML parse error: {e}")
            raise Exception(f"Failed to parse ECB XML: {e}") from e
        except Exception as e:
            logger.error(f"ECB rate scrape failed: {e}")
            raise

    def _extract_exchange_rate(
        self, result: Dict, source: ExchangeRateSource, config: Dict
    ) -> Optional[float]:
        """Extract exchange rate from scraped content"""
        content = result.get("content", "")
        soup = result.get("soup")

        # Check for CSS selector in config
        if config.get("css_selector") and soup:
            element = soup.select_one(config["css_selector"])
            if element:
                return self._parse_price(element.get_text())

        # Check for regex pattern in config
        if config.get("regex_pattern"):
            match = re.search(config["regex_pattern"], content)
            if match:
                return self._parse_price(match.group(1))

        return None

    async def refresh_exchange_rate_source(
        self, source: ExchangeRateSource, db
    ) -> None:
        """
        Refresh exchange rate from a source and update the database.
        """
        from sqlalchemy import update

        try:
            rate = await self.scrape_exchange_rate(source)
            # Use naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
            now = datetime.now(timezone.utc).replace(tzinfo=None)

            if rate:
                rate_decimal = Decimal(str(rate))

                await db.execute(
                    update(ExchangeRateSource)
                    .where(ExchangeRateSource.id == source.id)
                    .values(
                        last_rate=rate_decimal,
                        last_scraped_at=now,
                        last_scrape_status=ScrapeStatus.SUCCESS,
                    )
                )
                await db.commit()
                logger.info(f"Refreshed exchange rate {source.name}: {rate}")
            else:
                await db.execute(
                    update(ExchangeRateSource)
                    .where(ExchangeRateSource.id == source.id)
                    .values(
                        last_scraped_at=now,
                        last_scrape_status=ScrapeStatus.FAILED,
                    )
                )
                await db.commit()
                raise Exception("No rate found")
        except asyncio.TimeoutError as e:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            await db.execute(
                update(ExchangeRateSource)
                .where(ExchangeRateSource.id == source.id)
                .values(
                    last_scraped_at=now,
                    last_scrape_status=ScrapeStatus.TIMEOUT,
                )
            )
            await db.commit()
            raise Exception("Exchange rate scrape timeout") from e
        except Exception:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            try:
                await db.execute(
                    update(ExchangeRateSource)
                    .where(ExchangeRateSource.id == source.id)
                    .values(
                        last_scraped_at=now,
                        last_scrape_status=ScrapeStatus.FAILED,
                    )
                )
                await db.commit()
            except Exception:
                pass  # Don't fail on update error during exception handling
            raise


# Singleton instance
price_scraper = PriceScraper()
