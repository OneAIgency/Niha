from fastapi import APIRouter, Query
from typing import Optional
from enum import Enum

from ...services.simulation import simulation_engine
from ...services.price_scraper import price_scraper

router = APIRouter(prefix="/swaps", tags=["Swaps"])


class SwapDirection(str, Enum):
    EUA_TO_CEA = "eua_to_cea"
    CEA_TO_EUA = "cea_to_eua"
    ALL = "all"


@router.get("/available")
async def get_available_swaps(
    direction: SwapDirection = SwapDirection.ALL,
    min_quantity: Optional[float] = None,
    max_quantity: Optional[float] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50)
):
    """
    Get available swap requests in the marketplace.
    """
    swaps = simulation_engine.generate_swap_requests(count=30)

    # Filter by status (only open swaps)
    swaps = [s for s in swaps if s["status"] == "open"]

    # Filter by direction
    if direction == SwapDirection.EUA_TO_CEA:
        swaps = [s for s in swaps if s["from_type"] == "EUA"]
    elif direction == SwapDirection.CEA_TO_EUA:
        swaps = [s for s in swaps if s["from_type"] == "CEA"]

    # Filter by quantity
    if min_quantity:
        swaps = [s for s in swaps if s["quantity"] >= min_quantity]
    if max_quantity:
        swaps = [s for s in swaps if s["quantity"] <= max_quantity]

    # Pagination
    total = len(swaps)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = swaps[start:end]

    return {
        "data": paginated,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }


@router.get("/rate")
async def get_current_swap_rate():
    """
    Get current swap rate between EUA and CEA.
    Returns how many CEA you get for 1 EUA.
    """
    prices = await price_scraper.get_current_prices()

    eua_usd = prices["eua"]["price_usd"]
    cea_usd = prices["cea"]["price_usd"]

    swap_rate = eua_usd / cea_usd

    return {
        "eua_to_cea": round(swap_rate, 4),
        "cea_to_eua": round(1 / swap_rate, 4),
        "eua_price_usd": eua_usd,
        "cea_price_usd": cea_usd,
        "explanation": f"1 EUA = {swap_rate:.2f} CEA at current market rates",
        "platform_fee_pct": 0.5,  # 0.5% platform fee
        "effective_rate": round(swap_rate * 0.995, 4),
    }


@router.get("/calculator")
async def calculate_swap(
    from_type: str,
    quantity: float = Query(..., gt=0)
):
    """
    Calculate swap output for a given input.
    """
    prices = await price_scraper.get_current_prices()

    eua_usd = prices["eua"]["price_usd"]
    cea_usd = prices["cea"]["price_usd"]

    if from_type.upper() == "EUA":
        base_rate = eua_usd / cea_usd
        output_quantity = quantity * base_rate * 0.995  # After 0.5% fee
        output_type = "CEA"
        input_value = quantity * eua_usd
    else:
        base_rate = cea_usd / eua_usd
        output_quantity = quantity * base_rate * 0.995
        output_type = "EUA"
        input_value = quantity * cea_usd

    return {
        "input": {
            "type": from_type.upper(),
            "quantity": quantity,
            "value_usd": round(input_value, 2)
        },
        "output": {
            "type": output_type,
            "quantity": round(output_quantity, 2),
            "value_usd": round(output_quantity * (eua_usd if output_type == "EUA" else cea_usd), 2)
        },
        "rate": round(output_quantity / quantity, 4),
        "fee_pct": 0.5,
        "fee_usd": round(input_value * 0.005, 2)
    }


@router.get("/stats")
async def get_swap_stats():
    """
    Get swap market statistics.
    """
    swaps = simulation_engine.generate_swap_requests()
    prices = await price_scraper.get_current_prices()

    open_swaps = [s for s in swaps if s["status"] == "open"]
    matched_swaps = [s for s in swaps if s["status"] == "matched"]

    eua_to_cea = [s for s in open_swaps if s["from_type"] == "EUA"]
    cea_to_eua = [s for s in open_swaps if s["from_type"] == "CEA"]

    return {
        "open_swaps": len(open_swaps),
        "matched_today": len(matched_swaps),
        "eua_to_cea_requests": len(eua_to_cea),
        "cea_to_eua_requests": len(cea_to_eua),
        "total_eua_volume": round(sum(s["quantity"] for s in eua_to_cea), 2),
        "total_cea_volume": round(sum(s["quantity"] for s in cea_to_eua), 2),
        "current_rate": prices["swap_rate"],
        "avg_requested_rate": round(
            sum(s["desired_rate"] for s in eua_to_cea) / len(eua_to_cea) if eua_to_cea else 0,
            4
        ),
    }
