from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional

from ...core.database import get_db
from ...core.security import (
    get_current_user,
    hash_password,
    verify_password,
    validate_password_strength
)
from ...models.models import User, Entity, ActivityLog, UserSession
from ...schemas.schemas import (
    UserResponse,
    UserProfileUpdate,
    PasswordChange,
    MessageResponse,
    ActivityLogResponse,
    UserSessionResponse
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile information.
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change current user's password.
    Password must meet strength requirements.
    """
    # Get fresh user instance from this session
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password if user has one
    if user.password_hash:
        if not verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )

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
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's activity log.
    """
    # Count total
    count_query = select(func.count()).select_from(ActivityLog).where(
        ActivityLog.user_id == current_user.id
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
        "data": [
            ActivityLogResponse.model_validate(a) for a in activities
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0
        }
    }


@router.get("/me/sessions")
async def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's associated entity information.
    """
    if not current_user.entity_id:
        return None

    result = await db.execute(
        select(Entity).where(Entity.id == current_user.entity_id)
    )
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
        "created_at": entity.created_at.isoformat()
    }
