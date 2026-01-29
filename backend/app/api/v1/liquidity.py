"""Liquidity Management API endpoints"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import User
from ...schemas.schemas import (
    LiquidityCreateRequest,
    LiquidityCreateResponse,
    LiquidityPreviewRequest,
    LiquidityPreviewResponse,
)
from ...services.liquidity_service import InsufficientAssetsError, LiquidityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/liquidity", tags=["Liquidity"])


@router.post("/preview", response_model=LiquidityPreviewResponse)
async def preview_liquidity_creation(
    data: LiquidityPreviewRequest,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Preview liquidity creation without executing.
    Returns allocation plan and validates sufficient assets.
    Admin-only endpoint.
    """
    try:
        preview = await LiquidityService.preview_liquidity_creation(
            db=db,
            certificate_type=data.certificate_type,
            bid_amount_eur=data.bid_amount_eur,
            ask_amount_eur=data.ask_amount_eur,
        )

        logger.info(
            "Admin %s previewed liquidity creation for %s: "
            "BID=%s EUR, ASK=%s EUR",
            admin_user.email,
            data.certificate_type.value,
            data.bid_amount_eur,
            data.ask_amount_eur,
        )

        return preview

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error previewing liquidity creation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/create", response_model=LiquidityCreateResponse)
async def create_liquidity(
    data: LiquidityCreateRequest,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Execute liquidity creation by placing orders across market makers.
    Creates BID orders for liquidity providers and ASK orders for asset holders.
    Admin-only endpoint.

    Raises:
        400: If insufficient assets available
        500: If operation fails
    """
    try:
        # Execute liquidity creation
        operation = await LiquidityService.create_liquidity(
            db=db,
            certificate_type=data.certificate_type,
            bid_amount_eur=data.bid_amount_eur,
            ask_amount_eur=data.ask_amount_eur,
            created_by_id=admin_user.id,
            notes=data.notes,
        )

        # Commit the transaction
        await db.commit()
        await db.refresh(operation)

        logger.info(
            "Admin %s created liquidity for %s: "
            "BID=%s EUR, ASK=%s EUR, Operation ID=%s",
            admin_user.email,
            data.certificate_type.value,
            data.bid_amount_eur,
            data.ask_amount_eur,
            operation.id,
        )

        return LiquidityCreateResponse(
            success=True,
            liquidity_operation_id=operation.id,
            orders_created=len(operation.orders_created),
            bid_liquidity_eur=operation.actual_bid_liquidity_eur,
            ask_liquidity_eur=operation.actual_ask_liquidity_eur,
            market_makers_used=operation.market_makers_used,
        )

    except InsufficientAssetsError as e:
        # Rollback on insufficient assets
        await db.rollback()
        logger.warning(
            f"Insufficient assets for liquidity creation: {e.asset_type}, "
            f"required={e.required}, available={e.available}"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "insufficient_assets",
                "asset_type": e.asset_type,
                "required": float(e.required),
                "available": float(e.available),
                "shortfall": float(e.shortfall),
            },
        ) from e

    except ValueError as e:
        # Rollback on validation errors
        await db.rollback()
        logger.warning(f"Validation error in liquidity creation: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e

    except Exception as e:
        # Rollback on any other error
        await db.rollback()
        logger.error(f"Error creating liquidity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e
