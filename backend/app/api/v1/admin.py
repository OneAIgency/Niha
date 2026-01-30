import asyncio
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.exceptions import handle_database_error
from ...core.security import get_admin_user, hash_password
from ...models.models import (
    ActivityLog,
    AuthenticationAttempt,
    Certificate,
    CertificateStatus,
    CertificateType,
    ContactRequest,
    ContactStatus,
    Entity,
    ExchangeRateSource,
    Jurisdiction,
    KYCStatus,
    MailConfig,
    MailProvider,
    MarketMakerClient,
    ScrapeLibrary,
    ScrapeStatus,
    ScrapingSource,
    SwapRequest,
    SwapStatus,
    User,
    UserRole,
    UserSession,
)
from ...schemas.schemas import (
    ActivityStatsResponse,
    AdminPasswordReset,
    AdminUserFullResponse,
    AdminUserUpdate,
    AuthenticationAttemptResponse,
    ContactRequestUpdate,
    ExchangeRateSourceCreate,
    ExchangeRateSourceUpdate,
    MailConfigUpdate,
    MessageResponse,
    ScrapingSourceCreate,
    ScrapingSourceUpdate,
    UserCreate,
    UserResponse,
    UserRoleUpdate,
    UserSessionResponse,
)
from ...services.email_service import email_service
from .backoffice import backoffice_ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/contact-requests")
async def get_contact_requests(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get all contact requests with optional status filter.
    """
    query = select(ContactRequest).order_by(ContactRequest.created_at.desc())

    if status:
        query = query.where(ContactRequest.status == ContactStatus(status))

    # Get total count
    count_query = select(func.count()).select_from(ContactRequest)
    if status:
        count_query = count_query.where(ContactRequest.status == ContactStatus(status))
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
                "request_type": r.request_type or "join",
                "nda_file_name": r.nda_file_name,
                "submitter_ip": r.submitter_ip,
                "status": r.status.value if r.status else "new",
                "notes": r.notes,
                "created_at": (r.created_at.isoformat() + "Z")
                if r.created_at
                else None,
            }
            for r in requests
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }


@router.put("/contact-requests/{request_id}")
async def update_contact_request(
    request_id: str,
    update: ContactRequestUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
        new_status = ContactStatus(update.status)
        contact.status = new_status
        # When rejecting NDA, also set linked user to REJECTED if one exists (created from this request)
        if new_status == ContactStatus.REJECTED:
            user_result = await db.execute(
                select(User).where(User.email == contact.contact_email)
            )
            linked_user = user_result.scalar_one_or_none()
            if linked_user:
                linked_user.role = UserRole.REJECTED
    if update.notes:
        contact.notes = update.notes
    if update.agent_id:
        contact.agent_id = update.agent_id

    try:
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "updating contact request", logger) from e

    # Broadcast contact request update to backoffice
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "request_updated",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_name": contact.contact_name,
                "position": contact.position,
                "request_type": contact.request_type or "join",
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "status": contact.status.value if contact.status else "new",
                "notes": contact.notes,
                "created_at": (contact.created_at.isoformat() + "Z")
                if contact.created_at
                else None,
            },
        )
    )

    return {"message": "Contact request updated", "success": True}


@router.delete("/contact-requests/{request_id}")
async def delete_contact_request(
    request_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
    asyncio.create_task(
        backoffice_ws_manager.broadcast("request_deleted", {"id": str(request_id)})
    )

    return {"message": "Contact request deleted", "success": True}


@router.post("/users/create-from-request")
async def create_user_from_contact_request(
    request_id: str = Query(..., description="Contact request ID"),  # noqa: B008
    email: str = Query(..., description="User email"),  # noqa: B008
    first_name: str = Query(..., description="First name"),  # noqa: B008
    last_name: str = Query(..., description="Last name"),  # noqa: B008
    mode: str = Query(..., description="Creation mode: 'manual' or 'invitation'"),  # noqa: B008
    password: Optional[str] = Query(  # noqa: B008
        None, description="Password (required for manual mode)"
    ),
    position: Optional[str] = Query(None, description="Position/title"),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create a new user from an approved contact request.
    Supports two modes:
    - 'manual': Admin provides password (required, ≥8 chars), user active immediately.
    - 'invitation': Send email invitation after commit; user sets password via link (MailConfig for expiry).
    Creates Entity (name from contact_request, jurisdiction OTHER, KYC PENDING), User (role KYC), sets contact_request.status = KYC. Broadcasts request_updated and user_created on backoffice WebSocket.
    Admin only. All parameters are Query params.
    Returns: { message, success: true, user: { id, email, first_name, last_name, role, entity_id, creation_method } }.
    Errors: 400 (invalid request_id, duplicate email, password validation), 404 (contact request not found), 400/409/500 from handle_database_error (optional details.hint).
    """
    # Validate request_id as UUID
    try:
        req_uuid = UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    # Get contact request
    result = await db.execute(
        select(ContactRequest).where(ContactRequest.id == req_uuid)
    )
    contact_request = result.scalar_one_or_none()
    if not contact_request:
        raise HTTPException(status_code=404, detail="Contact request not found")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )

    # Load mail config for invitation expiry (and later for sending)
    cfg_result = await db.execute(
        select(MailConfig).order_by(MailConfig.updated_at.desc()).limit(1)
    )
    mail_row = cfg_result.scalar_one_or_none()
    invitation_expiry_days = (
        mail_row.invitation_token_expiry_days
        if mail_row and mail_row.invitation_token_expiry_days is not None
        else 7
    )

    try:
        # Create entity from contact request
        entity = Entity(
            name=contact_request.entity_name,
            jurisdiction=Jurisdiction.OTHER,
            kyc_status=KYCStatus.PENDING,
        )
        db.add(entity)
        await db.flush()

        if mode == "manual":
            # Manual creation with password
            if not password or len(password) < 8:
                raise HTTPException(
                    status_code=400,
                    detail="Password required and must be at least 8 characters",
                )

            user = User(
                email=email.lower(),
                first_name=first_name,
                last_name=last_name,
                password_hash=hash_password(password),
                role=UserRole.KYC,
                entity_id=entity.id,
                position=position,
                must_change_password=False,
                is_active=True,
                creation_method="manual",
                created_by=admin_user.id,
            )
        else:
            # Send invitation
            invitation_token = secrets.token_urlsafe(32)
            user = User(
                email=email.lower(),
                first_name=first_name,
                last_name=last_name,
                role=UserRole.KYC,
                entity_id=entity.id,
                position=position,
                invitation_token=invitation_token,
                invitation_sent_at=datetime.now(timezone.utc),
                invitation_expires_at=(
                    datetime.now(timezone.utc) + timedelta(days=invitation_expiry_days)
                ),
                must_change_password=True,
                is_active=False,  # Activate when password is set
                creation_method="invitation",
                created_by=admin_user.id,
            )

        db.add(user)

        # Update contact request status to KYC (approved, user created)
        contact_request.status = ContactStatus.KYC

        await db.commit()
        await db.refresh(user)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "create user from contact request", logger) from e

    # Send invitation email if applicable
    if mode == "invitation":
        try:
            mail_cfg = None
            if mail_row:
                mail_cfg = {
                    "provider": mail_row.provider.value,
                    "use_env_credentials": mail_row.use_env_credentials,
                    "from_email": mail_row.from_email,
                    "resend_api_key": (
                        mail_row.resend_api_key
                        if not mail_row.use_env_credentials
                        and mail_row.provider == MailProvider.RESEND
                        else None
                    ),
                    "smtp_host": mail_row.smtp_host,
                    "smtp_port": mail_row.smtp_port,
                    "smtp_use_tls": mail_row.smtp_use_tls,
                    "smtp_username": mail_row.smtp_username,
                    "smtp_password": mail_row.smtp_password,
                    "invitation_subject": mail_row.invitation_subject,
                    "invitation_body_html": mail_row.invitation_body_html,
                    "invitation_link_base_url": mail_row.invitation_link_base_url,
                }
            await email_service.send_invitation(
                user.email, user.first_name, user.invitation_token, mail_config=mail_cfg
            )
        except Exception:
            logger.exception(
                "Failed to send invitation email for user %s "
                "(user created, contact request KYC)",
                user.email,
            )

    # Broadcast updates (full payload so realtime hook can replace list item)
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "request_updated",
            {
                "id": str(contact_request.id),
                "entity_name": contact_request.entity_name,
                "contact_email": contact_request.contact_email,
                "contact_name": contact_request.contact_name,
                "position": contact_request.position,
                "request_type": contact_request.request_type or "join",
                "nda_file_name": contact_request.nda_file_name,
                "submitter_ip": contact_request.submitter_ip,
                "status": contact_request.status.value if contact_request.status else "new",
                "notes": contact_request.notes,
                "created_at": (contact_request.created_at.isoformat() + "Z")
                if contact_request.created_at
                else None,
            },
        )
    )
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "user_created",
            {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,  # KYC
            },
        )
    )

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
            "creation_method": mode,
        },
    }


@router.get("/contact-requests/{request_id}/nda")
async def download_nda_file(
    request_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
            },
        )

    # Fallback to filesystem for legacy records
    if contact.nda_file_path and contact.nda_file_name:
        if os.path.exists(contact.nda_file_path):
            return FileResponse(
                path=contact.nda_file_path,
                filename=contact.nda_file_name,
                media_type="application/pdf",
            )

    raise HTTPException(status_code=404, detail="No NDA file attached to this request")


@router.get("/ip-lookup/{ip_address}")
async def ip_whois_lookup(
    ip_address: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
):
    """
    Perform WHOIS/GeoIP lookup for an IP address.
    Uses ip-api.com (free tier, no API key needed).
    Admin only.
    """
    # Validate IP address format (basic check)
    if not ip_address or ip_address in ["None", "null", ""]:
        raise HTTPException(status_code=400, detail="Invalid IP address")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"http://ip-api.com/json/{ip_address}",
                params={
                    "fields": (
                        "status,message,country,countryCode,region,regionName,"
                        "city,zip,lat,lon,timezone,isp,org,as,query"
                    )
                },
            )
            data = response.json()

        if data.get("status") == "fail":
            raise HTTPException(
                status_code=400, detail=data.get("message", "IP lookup failed")
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
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=504, detail="IP lookup timed out") from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"IP lookup failed: {str(e)}"
        ) from e


@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Get admin dashboard statistics.
    """
    # Contact requests by status
    new_contacts = await db.execute(
        select(func.count())
        .select_from(ContactRequest)
        .where(ContactRequest.status == ContactStatus.NDA)
    )
    new_count = new_contacts.scalar()

    total_contacts = await db.execute(select(func.count()).select_from(ContactRequest))
    total_count = total_contacts.scalar()

    # Entities count
    entities_result = await db.execute(select(func.count()).select_from(Entity))
    entities_count = entities_result.scalar()

    # Users count
    users_result = await db.execute(select(func.count()).select_from(User))
    users_count = users_result.scalar()

    return {
        "contact_requests": {"new": new_count, "total": total_count},
        "entities": entities_count,
        "users": users_count,
        "recent_activity": [],  # Would include recent trades, logins, etc.
    }


@router.get("/entities")
async def get_entities(
    kyc_status: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Update entity KYC status.
    Admin only.
    """
    from ...models.models import KYCStatus

    result = await db.execute(select(Entity).where(Entity.id == UUID(entity_id)))
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
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(20, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get users with optional filters.
    Admin only. By default returns only active users. Use role=DISABLED to list
    deactivated users (soft-deleted; kept for ticketing, transactions, etc.).
    Excludes Market Maker users (they have their own management page).
    """
    # Subquery to find user IDs that are Market Makers
    mm_user_ids = select(MarketMakerClient.user_id).where(
        MarketMakerClient.user_id.isnot(None)
    ).scalar_subquery()

    if role == "DISABLED":
        query = select(User).where(
            User.is_active.is_(False),
            User.id.notin_(mm_user_ids)
        ).order_by(User.created_at.desc())
        count_query = select(func.count()).select_from(User).where(
            User.is_active.is_(False),
            User.id.notin_(mm_user_ids)
        )
    else:
        query = select(User).where(
            User.is_active.is_(True),
            User.id.notin_(mm_user_ids)
        ).order_by(User.created_at.desc())
        count_query = select(func.count()).select_from(User).where(
            User.is_active.is_(True),
            User.id.notin_(mm_user_ids)
        )
        if role:
            query = query.where(User.role == UserRole(role))
            count_query = count_query.where(User.role == UserRole(role))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_term))
            | (User.first_name.ilike(search_term))
            | (User.last_name.ilike(search_term))
        )
        count_query = count_query.where(
            (User.email.ilike(search_term))
            | (User.first_name.ilike(search_term))
            | (User.last_name.ilike(search_term))
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
                kyc_approved_at = (
                    entity.kyc_approved_at.isoformat()
                    if entity.kyc_approved_at
                    else None
                )

        user_data = UserResponse.model_validate(user).model_dump()
        user_data["entity_name"] = entity_name
        user_data["kyc_approved_at"] = kyc_approved_at
        user_list.append(user_data)

    return {
        "data": user_list,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
            status_code=400, detail="User with this email already exists"
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
            is_active=True,
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
            must_change_password=True,
        )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send invitation email only if no password was provided
    if not user_data.password:
        try:
            await email_service.send_invitation(
                user.email, user.first_name, user.invitation_token
            )
        except Exception:
            pass  # Don't fail if email fails

    return UserResponse.model_validate(user)


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get user details by ID.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
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
    user_data["entity_name"] = entity_name

    return user_data


@router.put("/users/{user_id}/role", response_model=MessageResponse)
async def change_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Change a user's role.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    old_role = user.role.value
    user.role = role_update.role
    await db.commit()

    return MessageResponse(
        message=f"User role changed from {old_role} to {role_update.role.value}"
    )


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def deactivate_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Deactivate a user account.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=400, detail="Cannot deactivate your own account"
        )

    user.is_active = False
    await db.commit()

    return MessageResponse(message=f"User {user.email} has been deactivated")


@router.get("/users/{user_id}/full", response_model=AdminUserFullResponse)
async def get_user_full_details(
    user_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get comprehensive user details including auth history and stats.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
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
        .where(AuthenticationAttempt.success.is_(True))
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
        .where(AuthenticationAttempt.success.is_(False))
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
        auth_history=[
            AuthenticationAttemptResponse.model_validate(a) for a in auth_attempts
        ],
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_full(
    user_id: str,
    update: AdminUserUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Update any user field.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
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
                status_code=400, detail="Email already in use by another user"
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
            raise HTTPException(
                status_code=400, detail="Cannot deactivate your own account"
            )
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
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Reset a user's password.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(reset.new_password)
    user.must_change_password = reset.force_change

    await db.commit()

    return MessageResponse(
        message=(
            f"Password reset for {user.email}. "
            f"Force change on login: {reset.force_change}"
        )
    )


@router.get("/users/{user_id}/auth-history")
async def get_user_auth_history(
    user_id: str,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(50, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get authentication history for a specific user.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
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
                "created_at": a.created_at.isoformat(),
            }
            for a in auth_attempts
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }


# ==================== Activity Logs ====================


@router.get("/activity-logs")
async def get_activity_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),  # noqa: B008
    per_page: int = Query(50, ge=1, le=100),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
        user_result = await db.execute(select(User).where(User.id == log.user_id))
        user = user_result.scalar_one_or_none()

        log_data = {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "user_email": user.email if user else None,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        logs_with_user.append(log_data)

    return {
        "data": logs_with_user,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }


@router.get("/activity-logs/stats", response_model=ActivityStatsResponse)
async def get_activity_stats(
    admin_user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)  # noqa: B008
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
        select(func.count())
        .select_from(UserSession)
        .where(UserSession.is_active.is_(True))
    )
    active_sessions = active_sessions_result.scalar()

    # Logins today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logins_today_result = await db.execute(
        select(func.count())
        .select_from(ActivityLog)
        .where(ActivityLog.action == "login")
        .where(ActivityLog.created_at >= today_start)
    )
    logins_today = logins_today_result.scalar()

    # Average session duration (from completed sessions)
    avg_duration_result = await db.execute(
        select(func.avg(UserSession.duration_seconds)).where(
            UserSession.duration_seconds.isnot(None)
        )
    )
    avg_duration = avg_duration_result.scalar() or 0

    return ActivityStatsResponse(
        total_users=total_users,
        users_by_role=users_by_role,
        active_sessions=active_sessions,
        logins_today=logins_today,
        avg_session_duration=float(avg_duration),
    )


# ==================== Scraping Sources ====================
# CRUD + test/refresh for price-scraping sources (EUA/CEA). Consumed by Settings UI.
# See docs/api/ADMIN_SCRAPING_API.md for request/response examples.


@router.get("/scraping-sources")
async def get_scraping_sources(
    admin_user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)  # noqa: B008
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
            "scrape_library": s.scrape_library.value
            if s.scrape_library
            else ScrapeLibrary.HTTPX.value,
            "is_active": s.is_active,
            "scrape_interval_minutes": s.scrape_interval_minutes,
            "last_scrape_at": (s.last_scrape_at.isoformat() + "Z")
            if s.last_scrape_at
            else None,
            "last_scrape_status": s.last_scrape_status.value
            if s.last_scrape_status
            else None,
            "last_price": float(s.last_price) if s.last_price else None,
            "last_price_eur": float(s.last_price_eur) if s.last_price_eur else None,
            "last_exchange_rate": float(s.last_exchange_rate)
            if s.last_exchange_rate
            else None,
            "config": s.config,
            "created_at": s.created_at.isoformat() + "Z",
            "updated_at": s.updated_at.isoformat() + "Z",
        }
        for s in sources
    ]


@router.post("/scraping-sources")
async def create_scraping_source(
    source_data: ScrapingSourceCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
        is_active=True,
    )

    db.add(source)
    await db.commit()
    await db.refresh(source)

    return {
        "id": str(source.id),
        "name": source.name,
        "url": source.url,
        "certificate_type": source.certificate_type.value,
        "scrape_library": source.scrape_library.value
        if source.scrape_library
        else ScrapeLibrary.HTTPX.value,
        "is_active": source.is_active,
        "scrape_interval_minutes": source.scrape_interval_minutes,
        "last_scrape_at": source.last_scrape_at.isoformat()
        if source.last_scrape_at
        else None,
        "last_scrape_status": source.last_scrape_status.value
        if source.last_scrape_status
        else None,
        "last_price": float(source.last_price) if source.last_price else None,
        "last_price_eur": float(source.last_price_eur)
        if source.last_price_eur
        else None,
        "last_exchange_rate": float(source.last_exchange_rate)
        if source.last_exchange_rate
        else None,
        "config": source.config,
        "created_at": source.created_at.isoformat(),
        "updated_at": source.updated_at.isoformat(),
    }


@router.put("/scraping-sources/{source_id}")
async def update_scraping_source(
    source_id: str,
    update: ScrapingSourceUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
    """Map scraping exceptions to (status_code, detail)."""
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
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
        return {"success": True, "message": "Scrape successful", "price": price}
    except Exception as e:
        logger.exception(
            "Scraping source test failed: source_id=%s, source=%s",
            source_id,
            source.name,
        )
        status, detail = _scraping_error_status(e)
        return {"success": False, "message": detail, "price": None}


@router.post("/scraping-sources/{source_id}/refresh", response_model=MessageResponse)
async def refresh_scraping_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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
        logger.exception(
            "Scraping source refresh failed: source_id=%s, source=%s",
            source_id,
            source.name,
        )
        status, detail = _scraping_error_status(e)
        raise HTTPException(status_code=status, detail=detail) from e


@router.delete("/scraping-sources/{source_id}", response_model=MessageResponse)
async def delete_scraping_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
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

    return MessageResponse(
        message=f"Scraping source '{source.name}' deleted successfully"
    )


# ==================== Exchange Rate Sources ====================


@router.get("/exchange-rate-sources")
async def get_exchange_rate_sources(
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get all exchange rate source configurations.
    Admin only.
    """
    query = select(ExchangeRateSource).order_by(ExchangeRateSource.created_at.desc())
    result = await db.execute(query)
    sources = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "name": s.name,
            "from_currency": s.from_currency,
            "to_currency": s.to_currency,
            "url": s.url,
            "scrape_library": s.scrape_library.value
            if s.scrape_library
            else ScrapeLibrary.HTTPX.value,
            "is_active": s.is_active,
            "is_primary": s.is_primary,
            "scrape_interval_minutes": s.scrape_interval_minutes,
            "last_rate": float(s.last_rate) if s.last_rate else None,
            "last_scraped_at": (s.last_scraped_at.isoformat() + "Z")
            if s.last_scraped_at
            else None,
            "last_scrape_status": s.last_scrape_status.value
            if s.last_scrape_status
            else None,
            "config": s.config,
            "created_at": s.created_at.isoformat() + "Z",
            "updated_at": s.updated_at.isoformat() + "Z",
        }
        for s in sources
    ]


@router.post("/exchange-rate-sources")
async def create_exchange_rate_source(
    source_data: ExchangeRateSourceCreate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create a new exchange rate source.
    Admin only.
    """
    from sqlalchemy import update

    # If marking as primary, unset other primary sources for same pair
    if source_data.is_primary:
        await db.execute(
            update(ExchangeRateSource)
            .where(
                ExchangeRateSource.from_currency == source_data.from_currency.upper(),
                ExchangeRateSource.to_currency == source_data.to_currency.upper(),
            )
            .values(is_primary=False)
        )

    source = ExchangeRateSource(
        name=source_data.name,
        from_currency=source_data.from_currency.upper(),
        to_currency=source_data.to_currency.upper(),
        url=source_data.url,
        scrape_library=source_data.scrape_library,
        scrape_interval_minutes=source_data.scrape_interval_minutes,
        is_primary=source_data.is_primary,
        config=source_data.config,
        is_active=True,
    )

    db.add(source)
    await db.commit()
    await db.refresh(source)

    return {
        "id": str(source.id),
        "name": source.name,
        "from_currency": source.from_currency,
        "to_currency": source.to_currency,
        "url": source.url,
        "scrape_library": source.scrape_library.value,
        "is_active": source.is_active,
        "is_primary": source.is_primary,
        "scrape_interval_minutes": source.scrape_interval_minutes,
        "last_rate": None,
        "last_scraped_at": None,
        "last_scrape_status": None,
        "config": source.config,
        "created_at": source.created_at.isoformat() + "Z",
        "updated_at": source.updated_at.isoformat() + "Z",
    }


@router.put("/exchange-rate-sources/{source_id}")
async def update_exchange_rate_source(
    source_id: str,
    update_data: ExchangeRateSourceUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Update an exchange rate source configuration."""
    from sqlalchemy import update

    result = await db.execute(
        select(ExchangeRateSource).where(ExchangeRateSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Exchange rate source not found")

    # If marking as primary, unset other primary sources
    if update_data.is_primary:
        await db.execute(
            update(ExchangeRateSource)
            .where(
                ExchangeRateSource.from_currency == source.from_currency,
                ExchangeRateSource.to_currency == source.to_currency,
                ExchangeRateSource.id != source.id,
            )
            .values(is_primary=False)
        )

    if update_data.name is not None:
        source.name = update_data.name
    if update_data.url is not None:
        source.url = update_data.url
    if update_data.scrape_library is not None:
        source.scrape_library = update_data.scrape_library
    if update_data.is_active is not None:
        source.is_active = update_data.is_active
    if update_data.is_primary is not None:
        source.is_primary = update_data.is_primary
    if update_data.scrape_interval_minutes is not None:
        source.scrape_interval_minutes = update_data.scrape_interval_minutes
    if update_data.config is not None:
        source.config = update_data.config

    await db.commit()
    return MessageResponse(message="Exchange rate source updated successfully")


@router.post("/exchange-rate-sources/{source_id}/test")
async def test_exchange_rate_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Test an exchange rate source by fetching current rate."""
    from ...services.price_scraper import price_scraper

    result = await db.execute(
        select(ExchangeRateSource).where(ExchangeRateSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Exchange rate source not found")

    try:
        rate = await price_scraper.scrape_exchange_rate(source)
        return {"success": True, "message": "Rate fetched successfully", "rate": rate}
    except Exception as e:
        logger.exception("Exchange rate source test failed")
        return {"success": False, "message": str(e), "rate": None}


@router.post("/exchange-rate-sources/{source_id}/refresh")
async def refresh_exchange_rate_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Force refresh exchange rate from a source."""
    from ...services.price_scraper import price_scraper

    result = await db.execute(
        select(ExchangeRateSource).where(ExchangeRateSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Exchange rate source not found")

    try:
        await price_scraper.refresh_exchange_rate_source(source, db)
        return MessageResponse(message="Exchange rate refreshed successfully")
    except Exception as e:
        logger.exception("Exchange rate refresh failed")
        status_code = 408 if "timeout" in str(e).lower() else 500
        raise HTTPException(status_code=status_code, detail=str(e)) from e


@router.delete("/exchange-rate-sources/{source_id}")
async def delete_exchange_rate_source(
    source_id: str,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Delete an exchange rate source."""
    result = await db.execute(
        select(ExchangeRateSource).where(ExchangeRateSource.id == UUID(source_id))
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Exchange rate source not found")

    await db.delete(source)
    await db.commit()

    return MessageResponse(
        message=f"Exchange rate source '{source.name}' deleted successfully"
    )


# ==================== Mail & Auth Settings ====================


@router.get("/settings/mail")
async def get_mail_settings(
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Get mail (and invitation) configuration. Single row; returns defaults/empty if none.
    Admin only. API key and SMTP password are never returned (masked).
    """
    result = await db.execute(
        select(MailConfig).order_by(MailConfig.updated_at.desc()).limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        return {
            "id": None,
            "provider": "resend",
            "use_env_credentials": True,
            "from_email": "",
            "resend_api_key": None,
            "smtp_host": None,
            "smtp_port": None,
            "smtp_use_tls": True,
            "smtp_username": None,
            "smtp_password": None,
            "invitation_subject": None,
            "invitation_body_html": None,
            "invitation_link_base_url": None,
            "invitation_token_expiry_days": 7,
            "verification_method": None,
            "auth_method": None,
            "created_at": None,
            "updated_at": None,
        }
    return {
        "id": str(row.id),
        "provider": row.provider.value,
        "use_env_credentials": row.use_env_credentials,
        "from_email": row.from_email,
        "resend_api_key": "********" if row.resend_api_key else None,
        "smtp_host": row.smtp_host,
        "smtp_port": row.smtp_port,
        "smtp_use_tls": row.smtp_use_tls,
        "smtp_username": row.smtp_username,
        "smtp_password": "********" if row.smtp_password else None,
        "invitation_subject": row.invitation_subject,
        "invitation_body_html": row.invitation_body_html,
        "invitation_link_base_url": row.invitation_link_base_url,
        "invitation_token_expiry_days": row.invitation_token_expiry_days or 7,
        "verification_method": row.verification_method,
        "auth_method": row.auth_method,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.put("/settings/mail")
async def update_mail_settings(
    update: MailConfigUpdate,
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create or update mail configuration (single row). Admin only.
    """
    try:
        result = await db.execute(
            select(MailConfig).order_by(MailConfig.updated_at.desc()).limit(1)
        )
        row = result.scalar_one_or_none()

        if not row:
            row = MailConfig(
                provider=MailProvider.RESEND,
                use_env_credentials=True,
                from_email="",
            )
            db.add(row)
            await db.flush()

        if update.provider is not None:
            row.provider = MailProvider(update.provider.value)
        if update.use_env_credentials is not None:
            row.use_env_credentials = update.use_env_credentials
        if update.from_email is not None:
            row.from_email = update.from_email
        if update.resend_api_key is not None and update.resend_api_key != "********":
            row.resend_api_key = update.resend_api_key
        if update.smtp_host is not None:
            row.smtp_host = update.smtp_host
        if update.smtp_port is not None:
            row.smtp_port = update.smtp_port
        if update.smtp_use_tls is not None:
            row.smtp_use_tls = update.smtp_use_tls
        if update.smtp_username is not None:
            row.smtp_username = update.smtp_username
        if update.smtp_password is not None and update.smtp_password != "********":
            row.smtp_password = update.smtp_password
        if update.invitation_subject is not None:
            row.invitation_subject = update.invitation_subject
        if update.invitation_body_html is not None:
            row.invitation_body_html = update.invitation_body_html
        if update.invitation_link_base_url is not None:
            # Pydantic MailConfigUpdate already strips trailing slash and validates URL
            row.invitation_link_base_url = update.invitation_link_base_url
        if update.invitation_token_expiry_days is not None:
            row.invitation_token_expiry_days = update.invitation_token_expiry_days
        if update.verification_method is not None:
            row.verification_method = update.verification_method
        if update.auth_method is not None:
            row.auth_method = update.auth_method

        await db.commit()
        await db.refresh(row)
        return {"message": "Mail settings updated", "success": True}
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "update mail settings", logger) from e


# ==================== Market Overview ====================


@router.get("/market-overview")
async def get_market_overview(
    admin_user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)  # noqa: B008
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
        float(c.quantity) * float(c.unit_price) for c in cea_certificates
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
        "top_20_swap_value_usd": round(swap_value_usd, 2),
    }
