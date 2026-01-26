from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, Response
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import secrets
import os
import asyncio

from ...core.database import get_db
from .backoffice import backoffice_ws_manager
from ...core.security import get_admin_user, hash_password
from ...models.models import (
    ContactRequest, ContactStatus, Entity, User, Trade, UserRole,
    ActivityLog, UserSession, ScrapingSource, ScrapeLibrary, CertificateType,
    Certificate, CertificateStatus, SwapRequest, SwapStatus,
    AuthenticationAttempt, Jurisdiction, KYCStatus
)
from ...schemas.schemas import (
    ContactRequestUpdate, MessageResponse, UserResponse, UserCreate,
    UserRoleUpdate, ActivityLogResponse, ActivityStatsResponse,
    ScrapingSourceResponse, ScrapingSourceUpdate, ScrapingSourceCreate,
    AdminUserFullResponse, AdminUserUpdate, AdminPasswordReset,
    AuthenticationAttemptResponse, UserSessionResponse
)
from ...services.email_service import email_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/contact-requests")
async def get_contact_requests(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(get_admin_user),
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
                "contact_name": r.contact_name,
                "position": r.position,
                "reference": r.reference,
                "request_type": r.request_type or "join",
                "nda_file_name": r.nda_file_name,
                "submitter_ip": r.submitter_ip,
                "status": r.status.value if r.status else "new",
                "notes": r.notes,
                "created_at": (r.created_at.isoformat() + "Z") if r.created_at else None,
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
    admin_user: User = Depends(get_admin_user),
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
    await db.refresh(contact)

    # Broadcast contact request update to backoffice
    asyncio.create_task(backoffice_ws_manager.broadcast("request_updated", {
        "id": str(contact.id),
        "entity_name": contact.entity_name,
        "contact_email": contact.contact_email,
        "contact_name": contact.contact_name,
        "position": contact.position,
        "reference": contact.reference,
        "request_type": contact.request_type or "join",
        "nda_file_name": contact.nda_file_name,
        "submitter_ip": contact.submitter_ip,
        "status": contact.status.value if contact.status else "new",
        "notes": contact.notes,
        "created_at": (contact.created_at.isoformat() + "Z") if contact.created_at else None
    }))

    return {"message": "Contact request updated", "success": True}


@router.delete("/contact-requests/{request_id}")
async def delete_contact_request(
    request_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a contact request permanently.
    Admin only.
    """
    result = await db.execute(
        select(ContactRequest).where(ContactRequest.id == UUID(request_id))
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")

    await db.delete(contact)
    await db.commit()

    # Broadcast deletion to backoffice WebSocket
    asyncio.create_task(backoffice_ws_manager.broadcast("request_deleted", {
        "id": str(request_id)
    }))

    return {"message": "Contact request deleted", "success": True}


@router.post("/users/create-from-request")
async def create_user_from_contact_request(
    request_id: str = Query(..., description="Contact request ID"),
    email: str = Query(..., description="User email"),
    first_name: str = Query(..., description="First name"),
    last_name: str = Query(..., description="Last name"),
    mode: str = Query(..., description="Creation mode: 'manual' or 'invitation'"),
    password: Optional[str] = Query(None, description="Password (required for manual mode)"),
    position: Optional[str] = Query(None, description="Position/title"),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user from an approved contact request.
    Supports two modes:
    - 'manual': Admin provides password, user can login immediately
    - 'invitation': Send email invitation, user sets own password
    Admin only.
    """
    from datetime import timedelta

    # Get contact request
    result = await db.execute(
        select(ContactRequest).where(ContactRequest.id == UUID(request_id))
    )
    contact_request = result.scalar_one_or_none()
    if not contact_request:
        raise HTTPException(status_code=404, detail="Contact request not found")

    # Check email uniqueness
    existing = await db.execute(
        select(User).where(User.email == email.lower())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create entity from contact request
    entity = Entity(
        name=contact_request.entity_name,
        jurisdiction=Jurisdiction.OTHER,
        kyc_status=KYCStatus.PENDING
    )
    db.add(entity)
    await db.flush()

    if mode == "manual":
        # Manual creation with password
        if not password or len(password) < 8:
            raise HTTPException(status_code=400, detail="Password required and must be at least 8 characters")

        user = User(
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            password_hash=hash_password(password),
            role=UserRole.PENDING,
            entity_id=entity.id,
            position=position,
            must_change_password=False,
            is_active=True,
            creation_method="manual",
            created_by=admin_user.id
        )
    else:
        # Send invitation
        invitation_token = secrets.token_urlsafe(32)
        user = User(
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.PENDING,
            entity_id=entity.id,
            position=position,
            invitation_token=invitation_token,
            invitation_sent_at=datetime.utcnow(),
            invitation_expires_at=datetime.utcnow() + timedelta(days=7),
            must_change_password=True,
            is_active=False,  # Activate when password is set
            creation_method="invitation",
            created_by=admin_user.id
        )

    db.add(user)

    # Update contact request status
    contact_request.status = ContactStatus.ENROLLED

    await db.commit()
    await db.refresh(user)

    # Send invitation email if applicable
    if mode == "invitation":
        try:
            await email_service.send_invitation(
                user.email,
                user.first_name,
                user.invitation_token
            )
        except Exception as e:
            # Log but don't fail - user is created
            pass

    # Broadcast updates
    asyncio.create_task(backoffice_ws_manager.broadcast("request_updated", {
        "id": str(contact_request.id),
        "status": "enrolled"
    }))
    asyncio.create_task(backoffice_ws_manager.broadcast("user_created", {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value
    }))

    return {
        "message": f"User created successfully via {mode}",
        "success": True,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "entity_id": str(entity.id),
            "creation_method": mode
        }
    }


@router.get("/contact-requests/{request_id}/nda")
async def download_nda_file(
    request_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download NDA file for a contact request.
    Serves PDF from database binary storage.
    Admin only.
    """
    result = await db.execute(
        select(ContactRequest).where(ContactRequest.id == UUID(request_id))
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")

    # Check for binary data in database (new storage method)
    if contact.nda_file_data:
        return Response(
            content=contact.nda_file_data,
            media_type=contact.nda_file_mime_type or "application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{contact.nda_file_name}"'
            }
        )

    # Fallback to filesystem for legacy records
    if contact.nda_file_path and contact.nda_file_name:
        if os.path.exists(contact.nda_file_path):
            return FileResponse(
                path=contact.nda_file_path,
                filename=contact.nda_file_name,
                media_type="application/pdf"
            )

    raise HTTPException(status_code=404, detail="No NDA file attached to this request")


@router.get("/ip-lookup/{ip_address}")
async def ip_whois_lookup(
    ip_address: str,
    admin_user: User = Depends(get_admin_user),
):
    """
    Perform WHOIS/GeoIP lookup for an IP address.
    Uses ip-api.com (free tier, no API key needed).
    Admin only.
    """
    # Validate IP address format (basic check)
    if not ip_address or ip_address in ['None', 'null', '']:
        raise HTTPException(status_code=400, detail="Invalid IP address")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"http://ip-api.com/json/{ip_address}",
                params={
                    "fields": "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query"
                }
            )
            data = response.json()

        if data.get("status") == "fail":
            raise HTTPException(
                status_code=400,
                detail=data.get("message", "IP lookup failed")
            )

        return {
            "ip": data.get("query"),
            "country": data.get("country"),
            "country_code": data.get("countryCode"),
            "region": data.get("regionName"),
            "city": data.get("city"),
            "zip": data.get("zip"),
            "lat": data.get("lat"),
            "lon": data.get("lon"),
            "timezone": data.get("timezone"),
            "isp": data.get("isp"),
            "org": data.get("org"),
            "as": data.get("as"),
        }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="IP lookup timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IP lookup failed: {str(e)}")


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

    # Get entity names and approval timestamps
    user_list = []
    for user in users:
        entity_name = None
        kyc_approved_at = None
        if user.entity_id:
            entity_result = await db.execute(
                select(Entity).where(Entity.id == user.entity_id)
            )
            entity = entity_result.scalar_one_or_none()
            if entity:
                entity_name = entity.name
                kyc_approved_at = entity.kyc_approved_at.isoformat() if entity.kyc_approved_at else None

        user_data = UserResponse.model_validate(user).model_dump()
        user_data['entity_name'] = entity_name
        user_data['kyc_approved_at'] = kyc_approved_at
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


@router.get("/users/{user_id}/full", response_model=AdminUserFullResponse)
async def get_user_full_details(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive user details including auth history and stats.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get entity name
    entity_name = None
    if user.entity_id:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity_name = entity.name

    # Get auth attempts
    auth_query = (
        select(AuthenticationAttempt)
        .where(AuthenticationAttempt.email == user.email)
        .order_by(AuthenticationAttempt.created_at.desc())
        .limit(50)
    )
    auth_result = await db.execute(auth_query)
    auth_attempts = auth_result.scalars().all()

    # Count total logins
    login_count_result = await db.execute(
        select(func.count())
        .select_from(AuthenticationAttempt)
        .where(AuthenticationAttempt.email == user.email)
        .where(AuthenticationAttempt.success == True)
    )
    login_count = login_count_result.scalar() or 0

    # Get last login IP
    last_login_ip = None
    if auth_attempts:
        for attempt in auth_attempts:
            if attempt.success and attempt.ip_address:
                last_login_ip = attempt.ip_address
                break

    # Failed logins in last 24h
    yesterday = datetime.utcnow() - timedelta(hours=24)
    failed_24h_result = await db.execute(
        select(func.count())
        .select_from(AuthenticationAttempt)
        .where(AuthenticationAttempt.email == user.email)
        .where(AuthenticationAttempt.success == False)
        .where(AuthenticationAttempt.created_at >= yesterday)
    )
    failed_login_count_24h = failed_24h_result.scalar() or 0

    # Get sessions
    sessions_query = (
        select(UserSession)
        .where(UserSession.user_id == user.id)
        .order_by(UserSession.started_at.desc())
        .limit(20)
    )
    sessions_result = await db.execute(sessions_query)
    sessions = sessions_result.scalars().all()

    return AdminUserFullResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        position=user.position,
        phone=user.phone,
        role=user.role.value,
        entity_id=user.entity_id,
        is_active=user.is_active,
        must_change_password=user.must_change_password,
        last_login=user.last_login,
        created_at=user.created_at,
        entity_name=entity_name,
        password_set=user.password_hash is not None,
        login_count=login_count,
        last_login_ip=last_login_ip,
        failed_login_count_24h=failed_login_count_24h,
        sessions=[UserSessionResponse.model_validate(s) for s in sessions],
        auth_history=[AuthenticationAttemptResponse.model_validate(a) for a in auth_attempts]
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_full(
    user_id: str,
    update: AdminUserUpdate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update any user field.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check email uniqueness if changing email
    if update.email and update.email.lower() != user.email:
        existing = await db.execute(
            select(User).where(User.email == update.email.lower())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already in use by another user"
            )
        user.email = update.email.lower()

    if update.first_name is not None:
        user.first_name = update.first_name
    if update.last_name is not None:
        user.last_name = update.last_name
    if update.position is not None:
        user.position = update.position
    if update.phone is not None:
        user.phone = update.phone
    if update.role is not None:
        if user.id == admin_user.id:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        user.role = update.role
    if update.is_active is not None:
        if user.id == admin_user.id and not update.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        user.is_active = update.is_active
    if update.entity_id is not None:
        # Verify entity exists
        entity_result = await db.execute(
            select(Entity).where(Entity.id == update.entity_id)
        )
        if not entity_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Entity not found")
        user.entity_id = update.entity_id

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/reset-password", response_model=MessageResponse)
async def admin_reset_password(
    user_id: str,
    reset: AdminPasswordReset,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset a user's password.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(reset.new_password)
    user.must_change_password = reset.force_change

    await db.commit()

    return MessageResponse(
        message=f"Password reset for {user.email}. Force change on login: {reset.force_change}"
    )


@router.get("/users/{user_id}/auth-history")
async def get_user_auth_history(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get authentication history for a specific user.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count total
    count_query = (
        select(func.count())
        .select_from(AuthenticationAttempt)
        .where(AuthenticationAttempt.email == user.email)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated auth attempts
    offset = (page - 1) * per_page
    auth_query = (
        select(AuthenticationAttempt)
        .where(AuthenticationAttempt.email == user.email)
        .order_by(AuthenticationAttempt.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    auth_result = await db.execute(auth_query)
    auth_attempts = auth_result.scalars().all()

    return {
        "data": [
            {
                "id": str(a.id),
                "user_id": str(a.user_id) if a.user_id else None,
                "email": a.email,
                "success": a.success,
                "method": a.method.value,
                "ip_address": a.ip_address,
                "user_agent": a.user_agent,
                "failure_reason": a.failure_reason,
                "created_at": a.created_at.isoformat()
            }
            for a in auth_attempts
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0
        }
    }


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
# CRUD + test/refresh for price-scraping sources (EUA/CEA). Consumed by Settings UI.
# See docs/api/ADMIN_SCRAPING_API.md for request/response examples.

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
            "scrape_library": s.scrape_library.value if s.scrape_library else ScrapeLibrary.HTTPX.value,
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
        "scrape_library": source.scrape_library.value if source.scrape_library else ScrapeLibrary.HTTPX.value,
        "is_active": source.is_active,
        "scrape_interval_minutes": source.scrape_interval_minutes,
        "last_scrape_at": source.last_scrape_at.isoformat() if source.last_scrape_at else None,
        "last_scrape_status": source.last_scrape_status.value if source.last_scrape_status else None,
        "last_price": float(source.last_price) if source.last_price else None,
        "config": source.config,
        "created_at": source.created_at.isoformat(),
        "updated_at": source.updated_at.isoformat()
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


def _scraping_error_status(e: Exception) -> tuple[int, str]:
    """Map scraping exceptions to (status_code, detail). Log full details server-side."""
    msg = str(e).strip()
    if not msg or len(msg) > 200:
        msg = "Scraping failed. Check URL, selectors, and network."
    lower = msg.lower()
    if "timeout" in lower or "timed out" in lower:
        return (504, msg)
    if "connection" in lower or "connect" in lower or "connection refused" in lower:
        return (502, msg)
    return (500, msg)


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

    try:
        price = await price_scraper.scrape_source(source)
        return {
            "success": True,
            "message": "Scrape successful",
            "price": price
        }
    except Exception as e:
        logger.exception("Scraping source test failed: source_id=%s, source=%s", source_id, source.name)
        status, detail = _scraping_error_status(e)
        return {
            "success": False,
            "message": detail,
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
        logger.exception("Scraping source refresh failed: source_id=%s, source=%s", source_id, source.name)
        status, detail = _scraping_error_status(e)
        raise HTTPException(status_code=status, detail=detail)


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
