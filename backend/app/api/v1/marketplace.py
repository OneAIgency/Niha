from enum import Enum
from typing import Optional

from fastapi import APIRouter, Query

from ...services.price_scraper import price_scraper
from ...services.simulation import simulation_engine

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


class SortBy(str, Enum):
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    QUANTITY_ASC = "quantity_asc"
    QUANTITY_DESC = "quantity_desc"
    DATE_DESC = "date_desc"
    DATE_ASC = "date_asc"


@router.get("/cea")
async def get_cea_marketplace(
    sort_by: SortBy = SortBy.DATE_DESC,
    min_quantity: Optional[float] = None,
    max_quantity: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    vintage_year: Optional[int] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
):
    """
    Get CEA marketplace listings with filtering and sorting.
    Returns anonymous sellers with realistic simulated data.
    """
    sellers = simulation_engine.generate_cea_sellers(count=60)

    # Apply filters
    if min_quantity:
        sellers = [s for s in sellers if s["quantity"] >= min_quantity]
    if max_quantity:
        sellers = [s for s in sellers if s["quantity"] <= max_quantity]
    if min_price:
        sellers = [s for s in sellers if s["unit_price"] >= min_price]
    if max_price:
        sellers = [s for s in sellers if s["unit_price"] <= max_price]
    if vintage_year:
        sellers = [s for s in sellers if s["vintage_year"] == vintage_year]

    # Apply sorting
    if sort_by == SortBy.PRICE_ASC:
        sellers.sort(key=lambda x: x["unit_price"])
    elif sort_by == SortBy.PRICE_DESC:
        sellers.sort(key=lambda x: x["unit_price"], reverse=True)
    elif sort_by == SortBy.QUANTITY_ASC:
        sellers.sort(key=lambda x: x["quantity"])
    elif sort_by == SortBy.QUANTITY_DESC:
        sellers.sort(key=lambda x: x["quantity"], reverse=True)
    elif sort_by == SortBy.DATE_ASC:
        sellers.sort(key=lambda x: x["created_at"])
    # DATE_DESC is default

    # Pagination
    total = len(sellers)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = sellers[start:end]

    return {
        "data": paginated,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        },
    }


@router.get("/eua")
async def get_eua_marketplace(
    sort_by: SortBy = SortBy.DATE_DESC,
    min_quantity: Optional[float] = None,
    max_quantity: Optional[float] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
):
    """
    Get EUA marketplace listings.
    """
    sellers = simulation_engine.generate_eua_sellers(count=35)

    # Apply filters
    if min_quantity:
        sellers = [s for s in sellers if s["quantity"] >= min_quantity]
    if max_quantity:
        sellers = [s for s in sellers if s["quantity"] <= max_quantity]

    # Apply sorting
    if sort_by == SortBy.PRICE_ASC:
        sellers.sort(key=lambda x: x["unit_price"])
    elif sort_by == SortBy.PRICE_DESC:
        sellers.sort(key=lambda x: x["unit_price"], reverse=True)
    elif sort_by == SortBy.QUANTITY_ASC:
        sellers.sort(key=lambda x: x["quantity"])
    elif sort_by == SortBy.QUANTITY_DESC:
        sellers.sort(key=lambda x: x["quantity"], reverse=True)

    # Pagination
    total = len(sellers)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = sellers[start:end]

    return {
        "data": paginated,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        },
    }


@router.get("/stats")
async def get_marketplace_stats():
    """
    Get overall marketplace statistics.
    """
    stats = simulation_engine.get_market_stats()
    prices = await price_scraper.get_current_prices()

    return {**stats, "current_prices": prices}


@router.get("/listing/{anonymous_code}")
async def get_listing_details(anonymous_code: str):
    """
    Get details of a specific listing by anonymous code.
    """
    # Search in both CEA and EUA listings
    cea_sellers = simulation_engine.generate_cea_sellers()
    eua_sellers = simulation_engine.generate_eua_sellers()

    all_sellers = cea_sellers + eua_sellers

    listing = next(
        (s for s in all_sellers if s["anonymous_code"] == anonymous_code), None
    )

    if not listing:
        return {"error": "Listing not found"}

    return listing
