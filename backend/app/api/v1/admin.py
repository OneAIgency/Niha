from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import secrets

from ...core.database import get_db
from ...core.security import get_admin_user, hash_password
from ...models.models import (
    ContactRequest, ContactStatus, Entity, User, Trade, UserRole,
    ActivityLog, UserSession, ScrapingSource, CertificateType,
    Certificate, CertificateStatus, SwapRequest, SwapStatus
)
from ...schemas.schemas import (
    ContactRequestUpdate, MessageResponse, UserResponse, UserCreate,
    UserRoleUpdate, ActivityLogResponse, ActivityStatsResponse,
    ScrapingSourceResponse, ScrapingSourceUpdate, ScrapingSourceCreate
)
from ...services.email_service import email_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/contact-requests")
async def get_contact_requests(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all contact requests with optional status filter.
    """
    query = select(ContactRequest).order_by(ContactRequest.created_at.desc())

    if status:
        query = query.where(ContactRequest.status == status)

    # Get total count
    count_query = select(func.count()).select_from(ContactRequest)
    if status:
        count_query = count_query.where(ContactRequest.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    requests = result.scalars().all()

    return {
        "data": [
            {
                "id": str(r.id),
                "entity_name": r.entity_name,
                "contact_email": r.contact_email,
                "position": r.position,
                "reference": r.reference,
                "status": r.status.value,
                "notes": r.notes,
                "created_at": r.created_at.isoformat(),
            }
            for r in requests
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0
        }
    }


@router.put("/contact-requests/{request_id}")
async def update_contact_request(
    request_id: str,
    update: ContactRequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a contact request status or notes.
    """
    from uuid import UUID

    result = await db.execute(
        select(ContactRequest).where(ContactRequest.id == UUID(request_id))
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")

    if update.status:
        contact.status = ContactStatus(update.status)
    if update.notes:
        contact.notes = update.notes
    if update.agent_id:
        contact.agent_id = update.agent_id

    await db.commit()

    return {"message": "Contact request updated", "success": True}


@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Get admin dashboard statistics.
    """
    # Contact requests by status
    new_contacts = await db.execute(
        select(func.count()).select_from(ContactRequest)
        .where(ContactRequest.status == ContactStatus.NEW)
    )
    new_count = new_contacts.scalar()

    total_contacts = await db.execute(
        select(func.count()).select_from(ContactRequest)
    )
    total_count = total_contacts.scalar()

    # Entities count
    entities_result = await db.execute(select(func.count()).select_from(Entity))
    entities_count = entities_result.scalar()

    # Users count
    users_result = await db.execute(select(func.count()).select_from(User))
    users_count = users_result.scalar()

    return {
        "contact_requests": {
            "new": new_count,
            "total": total_count
        },
        "entities": entities_count,
        "users": users_count,
        "recent_activity": []  # Would include recent trades, logins, etc.
    }


@router.get("/entities")
async def get_entities(
    kyc_status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all registered entities with optional KYC filter.
    """
    query = select(Entity).order_by(Entity.created_at.desc())

    if kyc_status:
        query = query.where(Entity.kyc_status == kyc_status)

    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    entities = result.scalars().all()

    return {
        "data": [
            {
                "id": str(e.id),
                "name": e.name,
                "legal_name": e.legal_name,
                "jurisdiction": e.jurisdiction.value,
                "verified": e.verified,
                "kyc_status": e.kyc_status.value,
                "created_at": e.created_at.isoformat(),
            }
            for e in entities
        ]
    }


@router.put("/entities/{entity_id}/kyc")
async def update_entity_kyc(
    entity_id: str,
    kyc_status: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update entity KYC status.
    Admin only.
    """
    from ...models.models import KYCStatus

    result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    entity.kyc_status = KYCStatus(kyc_status)
    if kyc_status == "approved":
        entity.verified = True
        entity.kyc_approved_at = datetime.utcnow()
        entity.kyc_approved_by = admin_user.id

    await db.commit()

    return {"message": "Entity KYC status updated", "success": True}


# ==================== User Management ====================

@router.get("/users")
async def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users with optional filters.
    Admin only.
    """
    query = select(User).order_by(User.created_at.desc())

    if role:
        query = query.where(User.role == UserRole(role))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )

    # Count total
    count_query = select(func.count()).select_from(User)
    if role:
        count_query = count_query.where(User.role == UserRole(role))
    if search:
        count_query = count_query.where(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    users = result.scalars().all()

    # Get entity names
    user_list = []
    for user in users:
        entity_name = None
        if user.entity_id:
            entity_result = await db.execute(
                select(Entity).where(Entity.id == user.entity_id)
            )
            entity = entity_result.scalar_one_or_none()
            if entity:
                entity_name = entity.name

        user_data = UserResponse.model_validate(user).model_dump()
        user_data['entity_name'] = entity_name
        user_list.append(user_data)

    return {
        "data": user_list,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0
        }
    }


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user with password or send invitation email.
    Admin only.
    If password is provided, user is created with that password.
    If password is not provided, an invitation email is sent.
    """
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    # Create user with or without password
    if user_data.password:
        # Create user with password directly
        user = User(
            email=user_data.email.lower(),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            entity_id=user_data.entity_id,
            position=user_data.position,
            must_change_password=False,  # Password already set by admin
            is_active=True
        )
    else:
        # Generate invitation token for email invite
        invitation_token = secrets.token_urlsafe(32)
        user = User(
            email=user_data.email.lower(),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            entity_id=user_data.entity_id,
            position=user_data.position,
            invitation_token=invitation_token,
            invitation_sent_at=datetime.utcnow(),
            must_change_password=True
        )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send invitation email only if no password was provided
    if not user_data.password:
        try:
            await email_service.send_invitation(
                user.email,
                user.first_name,
                user.invitation_token
            )
        except Exception:
            pass  # Don't fail if email fails

    return UserResponse.model_validate(user)


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user details by ID.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get entity info
    entity_name = None
    if user.entity_id:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity_name = entity.name

    user_data = UserResponse.model_validate(user).model_dump()
    user_data['entity_name'] = entity_name

    return user_data


@router.put("/users/{user_id}/role", response_model=MessageResponse)
async def change_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change a user's role.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot change your own role"
        )

    old_role = user.role.value
    user.role = role_update.role
    await db.commit()

    return MessageResponse(
        message=f"User role changed from {old_role} to {role_update.role.value}"
    )


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def deactivate_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user account.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )

    user.is_active = False
    await db.commit()

    return MessageResponse(message=f"User {user.email} has been deactivated")


# ==================== Activity Logs ====================

@router.get("/activity-logs")
async def get_activity_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get activity logs with optional filters.
    Admin only.
    """
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc())

    if user_id:
        query = query.where(ActivityLog.user_id == UUID(user_id))
    if action:
        query = query.where(ActivityLog.action == action)

    # Count total
    count_query = select(func.count()).select_from(ActivityLog)
    if user_id:
        count_query = count_query.where(ActivityLog.user_id == UUID(user_id))
    if action:
        count_query = count_query.where(ActivityLog.action == action)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    logs = result.scalars().all()

    # Get user info for each log
    logs_with_user = []
    for log in logs:
        user_result = await db.execute(
            select(User).where(User.id == log.user_id)
        )
        user = user_result.scalar_one_or_none()

        log_data = {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "user_email": user.email if user else None,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat()
        }
        logs_with_user.append(log_data)

    return {
        "data": logs_with_user,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0
        }
    }


@router.get("/activity-logs/stats", response_model=ActivityStatsResponse)
async def get_activity_stats(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get activity statistics.
    Admin only.
    """
    # Total users
    total_users_result = await db.execute(select(func.count()).select_from(User))
    total_users = total_users_result.scalar()

    # Users by role
    users_by_role = {}
    for role in UserRole:
        role_count_result = await db.execute(
            select(func.count()).select_from(User).where(User.role == role)
        )
        users_by_role[role.value] = role_count_result.scalar()

    # Active sessions
    active_sessions_result = await db.execute(
        select(func.count()).select_from(UserSession).where(UserSession.is_active == True)
    )
    active_sessions = active_sessions_result.scalar()

    # Logins today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logins_today_result = await db.execute(
        select(func.count()).select_from(ActivityLog)
        .where(ActivityLog.action == "login")
        .where(ActivityLog.created_at >= today_start)
    )
    logins_today = logins_today_result.scalar()

    # Average session duration (from completed sessions)
    avg_duration_result = await db.execute(
        select(func.avg(UserSession.duration_seconds))
        .where(UserSession.duration_seconds.isnot(None))
    )
    avg_duration = avg_duration_result.scalar() or 0

    return ActivityStatsResponse(
        total_users=total_users,
        users_by_role=users_by_role,
        active_sessions=active_sessions,
        logins_today=logins_today,
        avg_session_duration=float(avg_duration)
    )


# ==================== Scraping Sources ====================

@router.get("/scraping-sources")
async def get_scraping_sources(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all scraping source configurations.
    Admin only.
    """
    query = select(ScrapingSource).order_by(ScrapingSource.created_at.desc())
    result = await db.execute(query)
    sources = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "name": s.name,
            "url": s.url,
            "certificate_type": s.certificate_type.value,
            "scrape_library": s.scrape_library.value if s.scrape_library else "httpx",
            "is_active": s.is_active,
            "scrape_interval_minutes": s.scrape_interval_minutes,
            "last_scrape_at": s.last_scrape_at.isoformat() if s.last_scrape_at else None,
            "last_scrape_status": s.last_scrape_status.value if s.last_scrape_status else None,
            "last_price": float(s.last_price) if s.last_price else None,
            "config": s.config,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat()
        }
        for s in sources
    ]


@router.post("/scraping-sources")
async def create_scraping_source(
    source_data: ScrapingSourceCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new scraping source.
    Admin only.
    """
    from ...models.models import ScrapeLibrary

    source = ScrapingSource(
        name=source_data.name,
        url=source_data.url,
        certificate_type=source_data.certificate_type,
        scrape_library=source_data.scrape_library,
        scrape_interval_minutes=source_data.scrape_interval_minutes,
        config=source_data.config,
        is_active=True
    )

    db.add(source)
    await db.commit()
    await db.refresh(source)

    return {
        "id": str(source.id),
        "name": source.name,
        "url": source.url,
        "certificate_type": source.certificate_type.value,
        "scrape_library": source.scrape_library.value if source.scrape_library else "httpx",
        "is_active": source.is_active,
        "scrape_interval_minutes": source.scrape_interval_minutes,
        "config": source.config,
        "created_at": source.created_at.isoformat()
    }


@router.put("/scraping-sources/{source_id}")
async def update_scraping_source(
    source_id: str,
    update: ScrapingSourceUpdate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a scraping source configuration.
    Admin only.
    """
    result = await db.execute(
        select(ScrapingSource).where(ScrapingSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Scraping source not found")

    if update.name is not None:
        source.name = update.name
    if update.url is not None:
        source.url = update.url
    if update.scrape_library is not None:
        source.scrape_library = update.scrape_library
    if update.is_active is not None:
        source.is_active = update.is_active
    if update.scrape_interval_minutes is not None:
        source.scrape_interval_minutes = update.scrape_interval_minutes
    if update.config is not None:
        source.config = update.config

    await db.commit()

    return {"message": "Scraping source updated", "success": True}


@router.post("/scraping-sources/{source_id}/test")
async def test_scraping_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Test a scraping source by running a single scrape.
    Admin only.
    """
    from ...services.price_scraper import price_scraper

    result = await db.execute(
        select(ScrapingSource).where(ScrapingSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Scraping source not found")

    # Try to scrape
    try:
        price = await price_scraper.scrape_source(source)
        return {
            "success": True,
            "message": "Scrape successful",
            "price": price
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "price": None
        }


@router.post("/scraping-sources/{source_id}/refresh", response_model=MessageResponse)
async def refresh_scraping_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Force refresh prices from a scraping source.
    Admin only.
    """
    from ...services.price_scraper import price_scraper

    result = await db.execute(
        select(ScrapingSource).where(ScrapingSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Scraping source not found")

    try:
        await price_scraper.refresh_source(source, db)
        return MessageResponse(message="Prices refreshed successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh: {str(e)}")


@router.delete("/scraping-sources/{source_id}", response_model=MessageResponse)
async def delete_scraping_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a scraping source.
    Admin only.
    """
    result = await db.execute(
        select(ScrapingSource).where(ScrapingSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Scraping source not found")

    await db.delete(source)
    await db.commit()

    return MessageResponse(message=f"Scraping source '{source.name}' deleted successfully")


# ==================== Market Overview ====================

@router.get("/market-overview")
async def get_market_overview(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get market overview statistics.
    Top 20 CEA sell orders and top 20 swap orders by value.
    Admin only.
    """
    # Top 20 CEA sell orders (available certificates)
    cea_query = (
        select(Certificate)
        .where(Certificate.certificate_type == CertificateType.CEA)
        .where(Certificate.status == CertificateStatus.AVAILABLE)
        .order_by((Certificate.quantity * Certificate.unit_price).desc())
        .limit(20)
    )
    cea_result = await db.execute(cea_query)
    cea_certificates = cea_result.scalars().all()

    # Calculate total CEA value (convert to USD - CEA is in CNY, roughly 0.14 USD/CNY)
    cea_value_cny = sum(
        float(c.quantity) * float(c.unit_price)
        for c in cea_certificates
    )
    cea_value_usd = cea_value_cny * 0.14  # Approximate CNY to USD conversion

    # Top 20 swap orders (open swaps)
    swap_query = (
        select(SwapRequest)
        .where(SwapRequest.status == SwapStatus.OPEN)
        .order_by(SwapRequest.quantity.desc())
        .limit(20)
    )
    swap_result = await db.execute(swap_query)
    swap_requests = swap_result.scalars().all()

    # Calculate swap value - use approximate prices
    # EUA ~€75 (~$80), CEA ~¥100 (~$14)
    swap_value_usd = 0
    for swap in swap_requests:
        if swap.from_type == CertificateType.EUA:
            # EUA to CEA swap - value in EUA
            swap_value_usd += float(swap.quantity) * 80  # ~$80 per EUA
        else:
            # CEA to EUA swap - value in CEA
            swap_value_usd += float(swap.quantity) * 14  # ~$14 per CEA

    return {
        "top_20_cea_value_usd": round(cea_value_usd, 2),
        "top_20_swap_value_usd": round(swap_value_usd, 2)
    }
