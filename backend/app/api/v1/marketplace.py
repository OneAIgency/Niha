"""
Marketplace API - Real data from database

NOTE: Only CEA marketplace exists. No EUA market (EUA only via swap).
"""

from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_

from ...core.database import get_db
from ...models.models import Order, Seller, OrderStatus, CertificateType, OrderSide
from ...services.price_scraper import price_scraper

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
    sort_by: SortBy = SortBy.PRICE_ASC,
    min_quantity: Optional[float] = None,
    max_quantity: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    db=Depends(get_db),  # noqa: B008
):
    """
    Get CEA marketplace listings with filtering and sorting.
    Returns REAL sell orders from registered sellers and market makers.
    """
    # Build query for real sell orders
    query = select(Order, Seller).join(
        Seller, Order.seller_id == Seller.id, isouter=True
    ).where(
        and_(
            Order.certificate_type == CertificateType.CEA,
            Order.side == OrderSide.SELL,
            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
        )
    )

    # Apply filters
    if min_quantity:
        query = query.where(Order.quantity >= min_quantity)
    if max_quantity:
        query = query.where(Order.quantity <= max_quantity)
    if min_price:
        query = query.where(Order.price >= min_price)
    if max_price:
        query = query.where(Order.price <= max_price)

    # Apply sorting
    if sort_by == SortBy.PRICE_ASC:
        query = query.order_by(Order.price.asc())
    elif sort_by == SortBy.PRICE_DESC:
        query = query.order_by(Order.price.desc())
    elif sort_by == SortBy.QUANTITY_ASC:
        query = query.order_by(Order.quantity.asc())
    elif sort_by == SortBy.QUANTITY_DESC:
        query = query.order_by(Order.quantity.desc())
    elif sort_by == SortBy.DATE_ASC:
        query = query.order_by(Order.created_at.asc())
    else:  # DATE_DESC
        query = query.order_by(Order.created_at.desc())

    result = await db.execute(query)
    orders = result.all()

    # Convert to marketplace format
    listings = []
    for order, seller in orders:
        remaining_qty = float(order.quantity) - float(order.filled_quantity)
        if remaining_qty <= 0:
            continue

        listings.append({
            "id": str(order.id),
            "anonymous_code": seller.client_code if seller else "MM",
            "certificate_type": "CEA",
            "quantity": remaining_qty,
            "unit_price": float(order.price),
            "total_value": round(remaining_qty * float(order.price), 2),
            "status": "available",
            "created_at": order.created_at.isoformat(),
            "seller_type": "seller" if seller else "market_maker",
        })

    # Pagination
    total = len(listings)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = listings[start:end]

    return {
        "data": paginated,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
        },
    }


@router.get("/stats")
async def get_marketplace_stats(db=Depends(get_db)):  # noqa: B008
    """
    Get overall marketplace statistics from REAL data.
    """
    # Get CEA orders
    result = await db.execute(
        select(Order).where(
            and_(
                Order.certificate_type == CertificateType.CEA,
                Order.side == OrderSide.SELL,
                Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            )
        )
    )
    cea_orders = result.scalars().all()

    total_cea_volume = sum(
        float(o.quantity) - float(o.filled_quantity) for o in cea_orders
    )
    total_cea_value = sum(
        (float(o.quantity) - float(o.filled_quantity)) * float(o.price)
        for o in cea_orders
    )

    prices = await price_scraper.get_current_prices()

    return {
        "cea_listings": len(cea_orders),
        "eua_listings": 0,  # No EUA market
        "active_swaps": 0,  # Swap market coming soon
        "total_cea_volume": round(total_cea_volume, 2),
        "total_eua_volume": 0.0,
        "total_market_value_eur": round(total_cea_value, 2),
        "avg_cea_price": round(
            sum(float(o.price) for o in cea_orders) / len(cea_orders), 4
        ) if cea_orders else 0.0,
        "current_prices": prices,
    }


@router.get("/listing/{order_id}")
async def get_listing_details(order_id: str, db=Depends(get_db)):  # noqa: B008
    """
    Get details of a specific listing by order ID.
    """
    try:
        from uuid import UUID
        order_uuid = UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    result = await db.execute(
        select(Order, Seller)
        .join(Seller, Order.seller_id == Seller.id, isouter=True)
        .where(Order.id == order_uuid)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")

    order, seller = row
    remaining_qty = float(order.quantity) - float(order.filled_quantity)

    return {
        "id": str(order.id),
        "anonymous_code": seller.client_code if seller else "MM",
        "certificate_type": order.certificate_type.value,
        "quantity": remaining_qty,
        "unit_price": float(order.price),
        "total_value": round(remaining_qty * float(order.price), 2),
        "status": order.status.value,
        "created_at": order.created_at.isoformat(),
        "seller_type": "seller" if seller else "market_maker",
    }
