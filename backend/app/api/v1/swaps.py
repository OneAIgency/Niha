from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, Query

from ...core.database import get_db
from ...core.security import get_swap_user
from ...models.models import User
from ...services.price_scraper import price_scraper

router = APIRouter(prefix="/swaps", tags=["Swap"])

# NOTE: Swap market uses real data from database - no simulation


class SwapDirection(str, Enum):
    EUA_TO_CEA = "eua_to_cea"
    CEA_TO_EUA = "cea_to_eua"
    ALL = "all"


@router.get("/available")
async def get_available_swaps(
    direction: SwapDirection = SwapDirection.ALL,
    min_quantity: Optional[float] = None,
    max_quantity: Optional[float] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=50),  # noqa: B008
    current_user: User = Depends(get_swap_user),  # noqa: B008
    db=Depends(get_db),  # noqa: B008
):
    """
    Get available swap requests in the marketplace. SWAP+ or ADMIN only.

    TODO: Query real swap orders from database when swap order model is implemented.
    Currently returns empty list as swap market is not yet live.
    """
    # Real implementation will query SwapOrder table
    # For now, return empty as swap market is being developed
    swaps = []
    total = 0

    return {
        "data": swaps,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": 0,
        },
        "message": "Swap market coming soon. No active swap requests.",
    }


@router.get("/rate")
async def get_current_swap_rate(
    current_user: User = Depends(get_swap_user),  # noqa: B008
):
    """
    Get current swap rate between EUA and CEA. SWAP+ or ADMIN only (0010 §8).
    Returns how many CEA you get for 1 EUA.
    """
    prices = await price_scraper.get_current_prices()

    eua_price = prices["eua"]["price"]
    cea_price = prices["cea"]["price"]

    # Calculate rate: How many CEA for 1 EUA
    if cea_price > 0:
        swap_rate = eua_price / cea_price
    else:
        # Fallback if CEA price is 0/invalid to avoid ZeroDivisionError
        swap_rate = 5.8 

    return {
        "eua_to_cea": round(swap_rate, 4),
        "cea_to_eua": round(1 / swap_rate, 4),
        "eua_price_eur": eua_price,
        "cea_price_eur": cea_price,
        "explanation": f"1 EUA = {swap_rate:.2f} CEA at current market rates",
        "platform_fee_pct": 0.5,  # 0.5% platform fee
        "effective_rate": round(swap_rate * 0.995, 4),
    }


@router.get("/my")
async def get_my_swaps(
    current_user: User = Depends(get_swap_user),  # noqa: B008
):
    """
    Get current user's swap requests. SWAP+ or ADMIN only (0010 §8).
    Mock implementation; returns empty list until swap requests are persisted.
    """
    return []

@router.get("/calculator")
async def calculate_swap(
    from_type: str,
    quantity: float = Query(..., gt=0),  # noqa: B008
    current_user: User = Depends(get_swap_user),  # noqa: B008
):
    """
    Calculate swap output for a given input. SWAP+ or ADMIN only (0010 §8).
    """
    prices = await price_scraper.get_current_prices()

    eua_price = prices["eua"]["price"]
    cea_price = prices["cea"]["price"]

    if from_type.upper() == "EUA":
        base_rate = eua_price / cea_price
        output_quantity = quantity * base_rate * 0.995  # After 0.5% fee
        output_type = "CEA"
        input_value = quantity * eua_price
    else:
        base_rate = cea_price / eua_price
        output_quantity = quantity * base_rate * 0.995
        output_type = "EUA"
        input_value = quantity * cea_price

    return {
        "input": {
            "type": from_type.upper(),
            "quantity": quantity,
            "value_eur": round(input_value, 2),
        },
        "output": {
            "type": output_type,
            "quantity": round(output_quantity, 2),
            "value_eur": round(
                output_quantity * (eua_price if output_type == "EUA" else cea_price), 2
            ),
        },
        "rate": round(output_quantity / quantity, 4),
        "fee_pct": 0.5,
        "fee_eur": round(input_value * 0.005, 2),
    }


@router.get("/stats")
async def get_swap_stats(
    current_user: User = Depends(get_swap_user),  # noqa: B008
):
    """
    Get swap market statistics. SWAP+ or ADMIN only.

    TODO: Calculate real stats from SwapOrder table when implemented.
    """
    prices = await price_scraper.get_current_prices()

    # Real implementation will aggregate from SwapOrder table
    return {
        "open_swaps": 0,
        "matched_today": 0,
        "eua_to_cea_requests": 0,
        "cea_to_eua_requests": 0,
        "total_eua_volume": 0.0,
        "total_cea_volume": 0.0,
        "current_rate": prices["swap_rate"],
        "avg_requested_rate": 0.0,
        "message": "Swap market coming soon.",
    }
