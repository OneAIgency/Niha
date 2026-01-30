import secrets
import string
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import (
    get_current_user,
    hash_password,
    validate_password_strength,
    verify_password,
)
from ...models.models import (
    ActivityLog,
    Currency,
    Deposit,
    DepositStatus,
    Entity,
    User,
    UserRole,
    UserSession,
)
from ...services import deposit_service
from ...schemas.schemas import (
    ActivityLogResponse,
    MessageResponse,
    PasswordChange,
    UserDepositReport,
    UserProfileUpdate,
    UserResponse,
    UserSessionResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):  # noqa: B008
    """
    Get current user's profile information.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Update current user's profile information.

    Note: Frontend restricts this endpoint to admin users only.
    All authenticated users can call this endpoint, but the UI only
    shows edit controls for users with ADMIN role.

    Updates only the fields provided in the request body.
    Email address cannot be changed via this endpoint.
    """
    # Get fresh user instance from this session
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    if update.first_name is not None:
        user.first_name = update.first_name
    if update.last_name is not None:
        user.last_name = update.last_name
    if update.phone is not None:
        user.phone = update.phone
    if update.position is not None:
        user.position = update.position

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.put("/me/password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Change current user's password.

    Password must meet strength requirements:
    - Minimum 8 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one number (0-9)
    - At least one special character: !@#$%^&*()_+-=[]{}|;:,.<>?

    If the user has an existing password, the current password must be verified.
    """
    # Get fresh user instance from this session
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password if user has one
    if user.password_hash:
        if not verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Validate new password strength
    is_valid, message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    # Hash and save new password
    user.password_hash = hash_password(password_data.new_password)
    user.must_change_password = False

    await db.commit()

    return MessageResponse(message="Password changed successfully")


@router.get("/me/activity")
async def get_my_activity(
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get current user's activity log.
    """
    # Count total
    count_query = (
        select(func.count())
        .select_from(ActivityLog)
        .where(ActivityLog.user_id == current_user.id)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated activities
    query = (
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )

    result = await db.execute(query)
    activities = result.scalars().all()

    return {
        "data": [ActivityLogResponse.model_validate(a) for a in activities],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }


@router.get("/me/sessions")
async def get_my_sessions(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get current user's session history.
    """
    # Get recent sessions (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    query = (
        select(UserSession)
        .where(UserSession.user_id == current_user.id)
        .where(UserSession.started_at >= thirty_days_ago)
        .order_by(UserSession.started_at.desc())
        .limit(50)
    )

    result = await db.execute(query)
    sessions = result.scalars().all()

    return [UserSessionResponse.model_validate(s) for s in sessions]


@router.get("/me/entity")
async def get_my_entity(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get current user's associated entity information.

    Returns entity details if the user has an associated entity (entity_id is set).
    Returns null if the user has no associated entity.

    Entity information includes:
    - Entity name and legal name
    - Jurisdiction (EU, CN, HK, OTHER)
    - Verification status
    - KYC status (pending, approved, rejected)
    """
    if not current_user.entity_id:
        return None

    result = await db.execute(select(Entity).where(Entity.id == current_user.entity_id))
    entity = result.scalar_one_or_none()

    if not entity:
        return None

    return {
        "id": str(entity.id),
        "name": entity.name,
        "legal_name": entity.legal_name,
        "jurisdiction": entity.jurisdiction.value,
        "registration_number": entity.registration_number,
        "verified": entity.verified,
        "kyc_status": entity.kyc_status.value,
        "created_at": entity.created_at.isoformat(),
    }


# ==================== Deposit Reporting (APPROVED Users) ====================


@router.post("/me/deposits/report", response_model=MessageResponse)
async def report_deposit(
    deposit_data: UserDepositReport,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Report a wire transfer deposit (APPROVED or ADMIN users).
    Creates a pending deposit that backoffice will confirm when funds arrive.
    Also transitions APPROVED users to FUNDING role.
    """
    # APPROVED and ADMIN can report deposits; others must complete KYC first
    if current_user.role not in (UserRole.APPROVED, UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only APPROVED users can report deposits. "
                "Complete KYC verification first."
            ),
        )

    if not current_user.entity_id:
        raise HTTPException(
            status_code=400,
            detail="User must be associated with an entity to report deposits",
        )

    # Use deposit_service which handles role transition APPROVED → FUNDING
    deposit = await deposit_service.announce_deposit(
        db=db,
        entity_id=current_user.entity_id,
        user_id=current_user.id,
        reported_amount=Decimal(str(deposit_data.amount)),
        reported_currency=Currency(deposit_data.currency.value),
        source_bank=None,
        source_iban=None,
        source_swift=None,
        client_notes=deposit_data.wire_reference,
    )

    await db.commit()

    return MessageResponse(
        message=(
            f"Deposit of {deposit_data.amount} {deposit_data.currency.value} "
            f"reported. Reference: {deposit.bank_reference}. Awaiting confirmation."
        )
    )


@router.get("/me/deposits")
async def get_my_deposits(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get current user's entity deposits.
    """
    if not current_user.entity_id:
        return []

    query = (
        select(Deposit)
        .where(Deposit.entity_id == current_user.entity_id)
        .order_by(Deposit.created_at.desc())
    )

    result = await db.execute(query)
    deposits = result.scalars().all()

    return [
        {
            "id": str(d.id),
            "entity_id": str(d.entity_id),
            "reported_amount": float(d.reported_amount) if d.reported_amount else None,
            "reported_currency": d.reported_currency.value
            if d.reported_currency
            else None,
            "amount": float(d.amount) if d.amount else None,
            "currency": d.currency.value if d.currency else None,
            "wire_reference": d.wire_reference,
            "bank_reference": d.bank_reference,
            "status": d.status.value,
            "reported_at": d.reported_at.isoformat() + "Z" if d.reported_at else None,
            "confirmed_at": d.confirmed_at.isoformat() + "Z"
            if d.confirmed_at
            else None,
            "notes": d.notes,
            "created_at": d.created_at.isoformat() + "Z",
        }
        for d in deposits
    ]


@router.get("/me/entity/balance")
async def get_my_entity_balance(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get current user's entity balance.
    """
    if not current_user.entity_id:
        raise HTTPException(
            status_code=400, detail="User not associated with an entity"
        )

    result = await db.execute(select(Entity).where(Entity.id == current_user.entity_id))
    entity = result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Count confirmed deposits
    deposit_count_result = await db.execute(
        select(func.count())
        .select_from(Deposit)
        .where(
            Deposit.entity_id == entity.id, Deposit.status == DepositStatus.CONFIRMED
        )
    )
    deposit_count = deposit_count_result.scalar()

    return {
        "entity_id": str(entity.id),
        "entity_name": entity.name,
        "balance_amount": float(entity.balance_amount) if entity.balance_amount else 0,
        "balance_currency": entity.balance_currency.value
        if entity.balance_currency
        else None,
        "total_deposited": float(entity.total_deposited)
        if entity.total_deposited
        else 0,
        "deposit_count": deposit_count,
    }


@router.get("/me/entity/assets")
async def get_my_entity_assets(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Get current user's entity asset holdings (EUR, CEA, EUA).
    """
    from ...models.models import AssetType, EntityHolding

    if not current_user.entity_id:
        raise HTTPException(
            status_code=400, detail="User not associated with an entity"
        )

    result = await db.execute(select(Entity).where(Entity.id == current_user.entity_id))
    entity = result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Get holdings from EntityHolding table
    holdings_result = await db.execute(
        select(EntityHolding).where(EntityHolding.entity_id == entity.id)
    )
    holdings = holdings_result.scalars().all()

    # Build response with all asset types
    eur_balance = 0.0
    cea_balance = 0.0
    eua_balance = 0.0

    for holding in holdings:
        if holding.asset_type == AssetType.EUR:
            eur_balance = float(holding.quantity)
        elif holding.asset_type == AssetType.CEA:
            cea_balance = float(holding.quantity)
        elif holding.asset_type == AssetType.EUA:
            eua_balance = float(holding.quantity)

    # Also check Entity.balance_amount for backward compatibility
    if eur_balance == 0 and entity.balance_amount:
        eur_balance = float(entity.balance_amount)

    return {
        "entity_id": str(entity.id),
        "entity_name": entity.name,
        "eur_balance": eur_balance,
        "cea_balance": cea_balance,
        "eua_balance": eua_balance,
    }


@router.get("/me/funding-instructions")
async def get_funding_instructions(current_user: User = Depends(get_current_user)):  # noqa: B008
    """
    Get wire transfer instructions for funding.
    """
    return {
        "bank_name": "Nihao Group International Bank",
        "account_name": "Nihao Carbon Trading Ltd",
        "iban": "LU12 3456 7890 1234 5678",
        "swift_bic": "NIHALU2X",
        "reference_instructions": (
            "Please include your entity name and the reference number "
            "provided after reporting your deposit."
        ),
        "supported_currencies": ["EUR", "USD", "CNY", "HKD"],
        "processing_time": "1-3 business days after funds arrive",
    }
