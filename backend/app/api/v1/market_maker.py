"""Market Maker Admin API endpoints"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import (
    AssetTransaction,
    CertificateType,
    MarketMakerClient,
    MarketMakerType,
    Order,
    OrderStatus,
    TicketStatus,
    TransactionType,
    User,
)
from ...schemas.schemas import (
    AssetTransactionCreate,
    MarketMakerBalance,
    MarketMakerCreate,
    MarketMakerResponse,
    MarketMakerTransactionResponse,
    MarketMakerUpdate,
)
from ...services.market_maker_service import MarketMakerService
from ...services.ticket_service import TicketService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-makers", tags=["Market Makers"])


@router.get("", response_model=List[MarketMakerResponse])
async def list_market_makers(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    List all Market Maker clients with current balances and stats.
    Admin-only endpoint.
    """
    # Build query
    query = select(MarketMakerClient).order_by(MarketMakerClient.created_at.desc())

    if is_active is not None:
        query = query.where(MarketMakerClient.is_active == is_active)

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    market_makers = result.scalars().all()

    # Enrich with balances and stats
    response = []
    for mm in market_makers:
        # Get balances
        balances = await MarketMakerService.get_balances(db, mm.id)

        # Format balances for response
        formatted_balances = {
            cert_type: MarketMakerBalance(**balance_data)
            for cert_type, balance_data in balances.items()
        }

        # Get order count
        order_count_result = await db.execute(
            select(func.count(Order.id)).where(Order.market_maker_id == mm.id)
        )
        total_orders = order_count_result.scalar() or 0

        # Get filled orders count (as proxy for trades)
        trade_count_result = await db.execute(
            select(func.count(Order.id)).where(
                and_(Order.market_maker_id == mm.id, Order.status == OrderStatus.FILLED)
            )
        )
        total_trades = trade_count_result.scalar() or 0

        response.append(
            MarketMakerResponse(
                id=mm.id,
                user_id=mm.user_id,
                name=mm.name,
                description=mm.description,
                mm_type=mm.mm_type,
                is_active=mm.is_active,
                current_balances=formatted_balances,
                eur_balance=mm.eur_balance,
                total_orders=total_orders,
                total_trades=total_trades,
                created_at=mm.created_at,
                updated_at=mm.updated_at,
            )
        )

    return response


@router.post("", response_model=dict)
async def create_market_maker(
    request: Request,
    data: MarketMakerCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create new Market Maker client.
    Admin-only endpoint.

    Returns: {id, ticket_id, message}
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Convert schema enum to model enum
    mm_type = MarketMakerType(data.mm_type.value)

    # Validate constraints
    if mm_type == MarketMakerType.CASH_BUYER:
        # CASH_BUYER: CEA-CASH market, buys CEA with EUR
        if data.initial_balances:
            raise HTTPException(
                status_code=400,
                detail="CASH_BUYER cannot have certificate balances, only EUR",
            )
        if data.initial_eur_balance is None or data.initial_eur_balance <= 0:
            raise HTTPException(
                status_code=400,
                detail="CASH_BUYER must have positive initial_eur_balance",
            )
    elif mm_type == MarketMakerType.CEA_CASH_SELLER:
        # CEA_CASH_SELLER: CEA-CASH market, sells CEA for EUR
        if data.initial_eur_balance is not None and data.initial_eur_balance > 0:
            raise HTTPException(
                status_code=400, detail="CEA_CASH_SELLER cannot have EUR balance"
            )
        if not data.initial_balances or "CEA" not in data.initial_balances:
            raise HTTPException(
                status_code=400, detail="CEA_CASH_SELLER must have initial CEA balance"
            )
        if data.initial_balances["CEA"] <= 0:
            raise HTTPException(
                status_code=400, detail="CEA_CASH_SELLER must have positive CEA balance"
            )
        invalid_certs = set(data.initial_balances.keys()) - {"CEA"}
        if invalid_certs:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"CEA_CASH_SELLER can only have CEA balance, "
                    f"found: {invalid_certs}"
                ),
            )
        if "EUA" in data.initial_balances:
            raise HTTPException(
                status_code=400,
                detail="CEA_CASH_SELLER operates in CEA-CASH market, cannot have EUA",
            )
    elif mm_type == MarketMakerType.SWAP_MAKER:
        # SWAP_MAKER: SWAP market, facilitates CEA↔EUA conversions
        if data.initial_eur_balance is not None and data.initial_eur_balance > 0:
            raise HTTPException(
                status_code=400,
                detail="SWAP_MAKER operates in SWAP market, cannot have EUR",
            )
        if (
            not data.initial_balances
            or "CEA" not in data.initial_balances
            or "EUA" not in data.initial_balances
        ):
            raise HTTPException(
                status_code=400, detail="SWAP_MAKER must have both CEA and EUA balances"
            )
        if data.initial_balances["CEA"] <= 0 or data.initial_balances["EUA"] <= 0:
            raise HTTPException(
                status_code=400,
                detail="SWAP_MAKER must have positive CEA and EUA balances",
            )
        invalid_certs = set(data.initial_balances.keys()) - {"CEA", "EUA"}
        if invalid_certs:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"SWAP_MAKER can only have CEA and EUA balances, "
                    f"found: {invalid_certs}"
                ),
            )
    else:
        raise HTTPException(
            status_code=500, detail=f"Unknown market maker type: {mm_type}"
        )

    # Create Market Maker
    mm_client, ticket_id = await MarketMakerService.create_market_maker(
        db=db,
        name=data.name,
        email=data.email,
        description=data.description,
        created_by_id=admin_user.id,
        mm_type=mm_type,
        initial_balances=data.initial_balances,
        initial_eur_balance=data.initial_eur_balance,
    )

    logger.info(
        "Admin %s created Market Maker %s (ID: %s)",
        admin_user.email,
        mm_client.name,
        mm_client.id,
    )

    return {
        "id": str(mm_client.id),
        "ticket_id": ticket_id,
        "message": f"Market Maker '{mm_client.name}' created successfully",
    }


@router.get("/{market_maker_id}", response_model=MarketMakerResponse)
async def get_market_maker(
    market_maker_id: UUID,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get Market Maker details by ID.
    Admin-only endpoint.
    """
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    # Get balances
    balances = await MarketMakerService.get_balances(db, mm.id)

    # Format balances
    formatted_balances = {
        cert_type: MarketMakerBalance(**balance_data)
        for cert_type, balance_data in balances.items()
    }

    # Get order count
    order_count_result = await db.execute(
        select(func.count(Order.id)).where(Order.market_maker_id == mm.id)
    )
    total_orders = order_count_result.scalar() or 0

    # Get filled orders count
    trade_count_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(Order.market_maker_id == mm.id, Order.status == OrderStatus.FILLED)
        )
    )
    total_trades = trade_count_result.scalar() or 0

    return MarketMakerResponse(
        id=mm.id,
        user_id=mm.user_id,
        name=mm.name,
        description=mm.description,
        is_active=mm.is_active,
        current_balances=formatted_balances,
        total_orders=total_orders,
        total_trades=total_trades,
        created_at=mm.created_at,
        updated_at=mm.updated_at,
    )


@router.put("/{market_maker_id}", response_model=dict)
async def update_market_maker(
    market_maker_id: UUID,
    data: MarketMakerUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Update Market Maker details.
    Admin-only endpoint.

    Returns: {ticket_id, message}
    """
    # Get existing MM
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    # Capture before state
    before_state = await TicketService.get_entity_state(db, "MarketMaker", mm.id)

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(mm, field, value)

    await db.commit()
    await db.refresh(mm)

    # Capture after state
    after_state = await TicketService.get_entity_state(db, "MarketMaker", mm.id)

    # Create audit ticket
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_UPDATED",
        entity_type="MarketMaker",
        entity_id=mm.id,
        status=TicketStatus.SUCCESS,
        user_id=admin_user.id,
        market_maker_id=mm.id,
        request_payload=update_data,
        before_state=before_state,
        after_state=after_state,
        tags=["market_maker", "update"],
    )

    logger.info(
        f"Admin {admin_user.email} updated Market Maker {mm.name} (ID: {mm.id})"
    )

    return {
        "ticket_id": ticket.ticket_id,
        "message": f"Market Maker '{mm.name}' updated successfully",
    }


@router.delete("/{market_maker_id}", response_model=dict)
async def delete_market_maker(
    market_maker_id: UUID,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Soft delete Market Maker (set is_active = False).
    Admin-only endpoint.

    Returns: {ticket_id, message}
    """
    # Get existing MM
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    if not mm.is_active:
        raise HTTPException(status_code=400, detail="Market Maker already inactive")

    # Check for open orders
    open_orders_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.market_maker_id == mm.id,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED]),
            )
        )
    )
    open_orders_count = open_orders_result.scalar() or 0

    if open_orders_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot deactivate Market Maker with {open_orders_count} "
                f"open orders. Cancel orders first."
            ),
        )

    # Capture before state
    before_state = await TicketService.get_entity_state(db, "MarketMaker", mm.id)

    # Soft delete
    mm.is_active = False

    # Also deactivate associated user
    result = await db.execute(select(User).where(User.id == mm.user_id))
    user = result.scalar_one_or_none()
    if user:
        user.is_active = False

    await db.commit()
    await db.refresh(mm)

    # Capture after state
    after_state = await TicketService.get_entity_state(db, "MarketMaker", mm.id)

    # Create audit ticket
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_DELETED",
        entity_type="MarketMaker",
        entity_id=mm.id,
        status=TicketStatus.SUCCESS,
        user_id=admin_user.id,
        market_maker_id=mm.id,
        before_state=before_state,
        after_state=after_state,
        tags=["market_maker", "deletion"],
    )

    logger.info(
        f"Admin {admin_user.email} deactivated Market Maker {mm.name} (ID: {mm.id})"
    )

    return {
        "ticket_id": ticket.ticket_id,
        "message": f"Market Maker '{mm.name}' deactivated successfully",
    }


@router.get("/{market_maker_id}/balances", response_model=dict)
async def get_market_maker_balances(
    market_maker_id: UUID,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get current balances for Market Maker.
    Admin-only endpoint.

    Returns: {CEA: {available, locked, total}, EUA: {...}}
    """
    # Verify MM exists
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    # Get balances
    balances = await MarketMakerService.get_balances(db, market_maker_id)

    # Format for response
    formatted_balances = {
        cert_type: MarketMakerBalance(**balance_data).model_dump()
        for cert_type, balance_data in balances.items()
    }

    return formatted_balances


@router.get(
    "/{market_maker_id}/transactions",
    response_model=List[MarketMakerTransactionResponse],
)
async def list_market_maker_transactions(
    market_maker_id: UUID,
    certificate_type: Optional[str] = None,
    transaction_type: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(50, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    List all transactions for a Market Maker.
    Admin-only endpoint.
    """
    # Verify MM exists
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    # Build query
    query = (
        select(AssetTransaction)
        .where(AssetTransaction.market_maker_id == market_maker_id)
        .order_by(AssetTransaction.created_at.desc())
    )

    if certificate_type:
        try:
            cert_type_enum = CertificateType(certificate_type)
            query = query.where(AssetTransaction.certificate_type == cert_type_enum)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid certificate_type: {certificate_type}"
            ) from e

    if transaction_type:
        try:
            trans_type_enum = TransactionType(transaction_type)
            query = query.where(AssetTransaction.transaction_type == trans_type_enum)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid transaction_type: {transaction_type}"
            ) from e

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return [
        MarketMakerTransactionResponse(
            id=t.id,
            ticket_id=t.ticket_id,
            market_maker_id=t.market_maker_id,
            certificate_type=t.certificate_type.value,
            transaction_type=t.transaction_type.value,
            amount=t.amount,
            balance_after=t.balance_after,
            notes=t.notes,
            created_by=t.created_by,
            created_at=t.created_at,
        )
        for t in transactions
    ]


@router.post("/{market_maker_id}/transactions", response_model=dict)
async def create_market_maker_transaction(
    market_maker_id: UUID,
    data: AssetTransactionCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create asset transaction (deposit/withdrawal) for Market Maker.
    Admin-only endpoint.

    For withdrawals, validates sufficient available balance.

    Returns: {transaction_id, ticket_id, balance_after, message}
    """
    # Verify MM exists and is active
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == market_maker_id)
    )
    mm = result.scalar_one_or_none()

    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    if not mm.is_active:
        raise HTTPException(status_code=400, detail="Market Maker is inactive")

    # Validate certificate type
    try:
        cert_type = CertificateType(data.certificate_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid certificate_type: {data.certificate_type}"
        ) from e

    # Validate transaction type
    try:
        trans_type = TransactionType(data.transaction_type)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid transaction_type: {data.transaction_type}"
        ) from e

    # Calculate amount (negative for withdrawals)
    amount = data.amount if trans_type == TransactionType.DEPOSIT else -data.amount

    # For withdrawals, validate sufficient balance
    if trans_type == TransactionType.WITHDRAWAL:
        has_sufficient = await MarketMakerService.validate_sufficient_balance(
            db=db,
            market_maker_id=market_maker_id,
            certificate_type=cert_type,
            required_amount=data.amount,
        )

        if not has_sufficient:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient available balance for "
                    f"{cert_type.value} withdrawal"
                ),
            )

    # Create transaction
    transaction, ticket_id = await MarketMakerService.create_transaction(
        db=db,
        market_maker_id=market_maker_id,
        certificate_type=cert_type,
        transaction_type=trans_type,
        amount=amount,
        notes=data.notes,
        created_by_id=admin_user.id,
    )

    logger.info(
        f"Admin {admin_user.email} created {trans_type.value} transaction "
        f"for Market Maker {mm.name}: {data.amount} {cert_type.value}"
    )

    return {
        "transaction_id": str(transaction.id),
        "ticket_id": ticket_id,
        "balance_after": float(transaction.balance_after),
        "message": (
            f"{trans_type.value.title()} of {data.amount} {cert_type.value} "
            f"completed successfully"
        ),
    }
