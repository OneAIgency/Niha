import random
import string
from datetime import datetime, timedelta
from typing import List, Dict
from decimal import Decimal
from ..core.security import generate_anonymous_code


class SimulationEngine:
    """
    Generates realistic simulated marketplace data for demo purposes.
    Creates 50+ anonymous sellers with realistic quantities and prices.
    """

    # CEA base price around ¥100 CNY (~$14 USD)
    CEA_BASE_PRICE_USD = 14.0
    # EUA base price around €75 (~$81 USD)
    EUA_BASE_PRICE_USD = 81.0

    # Realistic quantity ranges
    QUANTITY_RANGES = [
        (100, 500),      # Small traders
        (500, 2000),     # Medium traders
        (2000, 10000),   # Large traders
        (10000, 50000),  # Institutional
        (50000, 200000), # Major players
    ]

    # Vintage years for certificates
    VINTAGE_YEARS = [2022, 2023, 2024, 2025]

    def __init__(self):
        self._sellers_cache = None
        self._swaps_cache = None
        self._cache_time = None

    def _get_random_quantity(self) -> float:
        """Get random quantity with realistic distribution"""
        # Weight towards smaller quantities (more common in OTC)
        weights = [0.35, 0.30, 0.20, 0.10, 0.05]
        range_choice = random.choices(self.QUANTITY_RANGES, weights=weights)[0]
        return round(random.uniform(range_choice[0], range_choice[1]), 2)

    def _get_price_variance(self, base_price: float, variance_pct: float = 0.05) -> float:
        """Apply realistic price variance"""
        variance = random.uniform(-variance_pct, variance_pct)
        return round(base_price * (1 + variance), 4)

    def generate_cea_sellers(self, count: int = 50) -> List[Dict]:
        """Generate simulated CEA sellers for marketplace"""
        if self._sellers_cache and self._cache_time:
            cache_age = (datetime.utcnow() - self._cache_time).seconds
            if cache_age < 30:  # Cache for 30 seconds
                return self._sellers_cache

        sellers = []
        base_time = datetime.utcnow() - timedelta(days=30)

        for i in range(count):
            quantity = self._get_random_quantity()
            price = self._get_price_variance(self.CEA_BASE_PRICE_USD)
            vintage = random.choice(self.VINTAGE_YEARS)

            # Earlier listings have more variation in timing
            listing_time = base_time + timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            sellers.append({
                "id": i + 1,
                "anonymous_code": generate_anonymous_code(),
                "certificate_type": "CEA",
                "quantity": quantity,
                "unit_price": price,
                "total_value": round(quantity * price, 2),
                "vintage_year": vintage,
                "status": "available",
                "created_at": listing_time.isoformat(),
                "jurisdiction": random.choice(["CN", "HK", "OTHER"]),
                # Simulated activity indicators
                "views": random.randint(5, 200),
                "inquiries": random.randint(0, 15),
            })

        # Sort by creation time (newest first)
        sellers.sort(key=lambda x: x["created_at"], reverse=True)

        self._sellers_cache = sellers
        self._cache_time = datetime.utcnow()

        return sellers

    def generate_eua_sellers(self, count: int = 30) -> List[Dict]:
        """Generate simulated EUA sellers (fewer, as main focus is CEA)"""
        sellers = []
        base_time = datetime.utcnow() - timedelta(days=30)

        for i in range(count):
            quantity = self._get_random_quantity()
            price = self._get_price_variance(self.EUA_BASE_PRICE_USD)
            vintage = random.choice(self.VINTAGE_YEARS)

            listing_time = base_time + timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            sellers.append({
                "id": i + 1,
                "anonymous_code": generate_anonymous_code(),
                "certificate_type": "EUA",
                "quantity": quantity,
                "unit_price": price,
                "total_value": round(quantity * price, 2),
                "vintage_year": vintage,
                "status": "available",
                "created_at": listing_time.isoformat(),
                "jurisdiction": random.choice(["EU", "HK", "OTHER"]),
                "views": random.randint(10, 300),
                "inquiries": random.randint(0, 20),
            })

        sellers.sort(key=lambda x: x["created_at"], reverse=True)
        return sellers

    def generate_swap_requests(self, count: int = 25) -> List[Dict]:
        """Generate simulated swap requests"""
        if self._swaps_cache and self._cache_time:
            cache_age = (datetime.utcnow() - self._cache_time).seconds
            if cache_age < 30:
                return self._swaps_cache

        swaps = []
        base_time = datetime.utcnow() - timedelta(days=14)

        # Current swap rate: ~5.8 CEA per 1 EUA (based on price difference)
        base_swap_rate = self.EUA_BASE_PRICE_USD / self.CEA_BASE_PRICE_USD

        for i in range(count):
            # Most swaps are EUA → CEA (EU companies wanting Chinese credits)
            is_eua_to_cea = random.random() < 0.7

            if is_eua_to_cea:
                from_type = "EUA"
                to_type = "CEA"
                # Slightly better rate than market (incentive to swap)
                desired_rate = self._get_price_variance(base_swap_rate, 0.03)
            else:
                from_type = "CEA"
                to_type = "EUA"
                desired_rate = self._get_price_variance(1 / base_swap_rate, 0.03)

            quantity = self._get_random_quantity()
            listing_time = base_time + timedelta(
                days=random.randint(0, 14),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            swaps.append({
                "id": i + 1,
                "anonymous_code": generate_anonymous_code(),
                "from_type": from_type,
                "to_type": to_type,
                "quantity": quantity,
                "desired_rate": round(desired_rate, 4),
                "equivalent_quantity": round(quantity * desired_rate, 2),
                "status": random.choices(
                    ["open", "matched"],
                    weights=[0.8, 0.2]
                )[0],
                "created_at": listing_time.isoformat(),
                "expires_at": (listing_time + timedelta(days=30)).isoformat(),
            })

        swaps.sort(key=lambda x: x["created_at"], reverse=True)

        self._swaps_cache = swaps
        self._cache_time = datetime.utcnow()

        return swaps

    def get_market_stats(self) -> Dict:
        """Generate realistic market statistics"""
        cea_sellers = self.generate_cea_sellers()
        eua_sellers = self.generate_eua_sellers()
        swaps = self.generate_swap_requests()

        total_cea_volume = sum(s["quantity"] for s in cea_sellers)
        total_eua_volume = sum(s["quantity"] for s in eua_sellers)
        total_cea_value = sum(s["total_value"] for s in cea_sellers)
        total_eua_value = sum(s["total_value"] for s in eua_sellers)

        return {
            "cea_listings": len(cea_sellers),
            "eua_listings": len(eua_sellers),
            "active_swaps": len([s for s in swaps if s["status"] == "open"]),
            "total_cea_volume": round(total_cea_volume, 2),
            "total_eua_volume": round(total_eua_volume, 2),
            "total_market_value_usd": round(total_cea_value + total_eua_value, 2),
            "avg_cea_price": round(sum(s["unit_price"] for s in cea_sellers) / len(cea_sellers), 4),
            "avg_eua_price": round(sum(s["unit_price"] for s in eua_sellers) / len(eua_sellers), 4),
            "jurisdictions_served": ["EU", "CN", "HK", "CH", "SG", "AE"],
            "trades_24h": random.randint(15, 45),
            "volume_24h_usd": round(random.uniform(500000, 2000000), 2),
        }


# Singleton instance
simulation_engine = SimulationEngine()
