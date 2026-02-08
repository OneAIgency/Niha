import asyncio
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.exceptions import handle_database_error
from ...core.security import get_admin_user, get_current_user, hash_password
from ...models.models import (
    ActivityLog,
    AuthenticationAttempt,
    AutoTradeMarketSettings,
    AutoTradeRule,
    AutoTradeSettings,
    CashMarketTrade,
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
    MarketMakerType,
    MarketType,
    Order,
    OrderSide,
    OrderStatus,
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
    AutoTradeMarketSettingsResponse,
    AutoTradeMarketSettingsUpdate,
    AutoTradeSettingsResponse,
    AutoTradeSettingsUpdate,
    ContactRequestUpdate,
    ExchangeRateSourceCreate,
    ExchangeRateSourceUpdate,
    LiquidityStatusResponse,
    MailConfigUpdate,
    MarketMakerSummary,
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
        query = query.where(ContactRequest.user_role == ContactStatus(status))

    # Get total count
    count_query = select(func.count()).select_from(ContactRequest)
    if status:
        count_query = count_query.where(ContactRequest.user_role == ContactStatus(status))
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
                "nda_file_name": r.nda_file_name,
                "submitter_ip": r.submitter_ip,
                "user_role": r.user_role.value if r.user_role else "NDA",
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
        contact.user_role = new_status
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
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "NDA",
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
                # Use naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
                invitation_sent_at=datetime.now(timezone.utc).replace(tzinfo=None),
                invitation_expires_at=(
                    datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=invitation_expiry_days)
                ),
                must_change_password=True,
                is_active=False,  # Activate when password is set
                creation_method="invitation",
                created_by=admin_user.id,
            )

        db.add(user)

        # Update contact request user_role to KYC (approved, user created)
        contact_request.user_role = ContactStatus.KYC

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
                "nda_file_name": contact_request.nda_file_name,
                "submitter_ip": contact_request.submitter_ip,
                "user_role": contact_request.user_role.value if contact_request.user_role else "NDA",
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
    # Contact requests by user_role
    new_contacts = await db.execute(
        select(func.count())
        .select_from(ContactRequest)
        .where(ContactRequest.user_role == ContactStatus.NDA)
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
        # Use naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
        entity.kyc_approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
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

    Note: For roles that require an entity (APPROVED and higher), an entity
    will be auto-created if entity_id is not provided.
    """
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )

    # Roles that need an entity to report deposits
    ROLES_REQUIRING_ENTITY = {
        UserRole.APPROVED, UserRole.FUNDING, UserRole.AML,
        UserRole.CEA, UserRole.CEA_SETTLE, UserRole.SWAP,
        UserRole.EUA_SETTLE, UserRole.EUA, UserRole.MM,
    }

    entity_id = user_data.entity_id

    # Auto-create entity for roles that require it
    if user_data.role in ROLES_REQUIRING_ENTITY and not entity_id:
        entity = Entity(
            name=f"{user_data.first_name} {user_data.last_name}",
            jurisdiction=Jurisdiction.OTHER,
            kyc_status=KYCStatus.APPROVED if user_data.role == UserRole.APPROVED else KYCStatus.PENDING,
        )
        db.add(entity)
        await db.flush()
        entity_id = entity.id

    # Create user with or without password
    if user_data.password:
        # Create user with password directly
        user = User(
            email=user_data.email.lower(),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            entity_id=entity_id,
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
            entity_id=entity_id,
            position=user_data.position,
            invitation_token=invitation_token,
            # Use naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
            invitation_sent_at=datetime.now(timezone.utc).replace(tzinfo=None),
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

    # Failed logins in last 24h - use naive UTC for DB query
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
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


@router.post("/users/{user_id}/create-entity", response_model=MessageResponse)
async def create_entity_for_user(
    user_id: str,
    entity_name: Optional[str] = Query(None, description="Entity name (defaults to user's full name)"),  # noqa: B008
    admin_user: User = Depends(get_admin_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Create and link an entity for a user who doesn't have one.
    This is useful for users created directly without going through contact request flow.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.entity_id:
        # Already has entity
        entity_result = await db.execute(
            select(Entity).where(Entity.id == user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        return MessageResponse(
            message=f"User already has entity: {entity.name if entity else 'unknown'}"
        )

    # Create new entity
    name = entity_name or f"{user.first_name} {user.last_name}"
    entity = Entity(
        name=name,
        jurisdiction=Jurisdiction.OTHER,
        kyc_status=KYCStatus.APPROVED,  # If user is APPROVED, entity should be too
    )
    db.add(entity)
    await db.flush()

    user.entity_id = entity.id
    await db.commit()

    return MessageResponse(message=f"Created entity '{name}' and linked to user")


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

    # Logins today - use naive UTC for DB query
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
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
    """Map scraping exceptions to (status_code, detail) with safe error messages."""
    err_str = str(e).lower().strip()
    # Rate limiting - return 429 with user-friendly message
    if "429" in err_str or "rate limit" in err_str or "too many requests" in err_str:
        return (429, "Rate limited by source. Please wait a few minutes before retrying.")
    if "timeout" in err_str or "timed out" in err_str:
        return (504, "Request timed out. Please try again later.")
    if "connection" in err_str or "connect" in err_str or "connection refused" in err_str:
        return (502, "Connection error. Check if the source is accessible.")
    return (500, "Scraping failed. Check URL, selectors, and network.")


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
        detail = "Request timed out" if status_code == 408 else "Exchange rate refresh failed"
        raise HTTPException(status_code=status_code, detail=detail) from e


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


# ============================================================================
# Auto Trade Settings Endpoints (Global Liquidity Limits)
# ============================================================================


@router.get("/auto-trade-settings", response_model=list[AutoTradeSettingsResponse])
async def get_auto_trade_settings(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Get all auto trade settings (one per certificate type)."""
    result = await db.execute(select(AutoTradeSettings))
    settings = result.scalars().all()
    return list(settings)


@router.get(
    "/auto-trade-settings/{certificate_type}",
    response_model=AutoTradeSettingsResponse,
)
async def get_auto_trade_settings_by_type(
    certificate_type: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Get auto trade settings for a specific certificate type."""
    cert_type = certificate_type.upper()
    if cert_type not in ("CEA", "EUA"):
        raise HTTPException(status_code=400, detail="Invalid certificate type. Must be CEA or EUA.")

    result = await db.execute(
        select(AutoTradeSettings).where(AutoTradeSettings.certificate_type == cert_type)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(status_code=404, detail=f"Settings not found for {cert_type}")

    return settings


@router.put(
    "/auto-trade-settings/{certificate_type}",
    response_model=AutoTradeSettingsResponse,
)
async def update_auto_trade_settings(
    certificate_type: str,
    updates: AutoTradeSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Update auto trade settings for a certificate type."""
    cert_type = certificate_type.upper()
    if cert_type not in ("CEA", "EUA"):
        raise HTTPException(status_code=400, detail="Invalid certificate type. Must be CEA or EUA.")

    result = await db.execute(
        select(AutoTradeSettings).where(AutoTradeSettings.certificate_type == cert_type)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(status_code=404, detail=f"Settings not found for {cert_type}")

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    settings.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    try:
        await db.commit()
        await db.refresh(settings)
        return settings
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "updating auto trade settings")


@router.get(
    "/auto-trade-settings/{certificate_type}/liquidity",
    response_model=LiquidityStatusResponse,
)
async def get_liquidity_status(
    certificate_type: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Get current liquidity status for a certificate type."""
    cert_type = certificate_type.upper()
    if cert_type not in ("CEA", "EUA"):
        raise HTTPException(status_code=400, detail="Invalid certificate type. Must be CEA or EUA.")

    # Get settings
    result = await db.execute(
        select(AutoTradeSettings).where(AutoTradeSettings.certificate_type == cert_type)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(status_code=404, detail=f"Settings not found for {cert_type}")

    # Map string to enum
    cert_type_enum = CertificateType.CEA if cert_type == "CEA" else CertificateType.EUA

    # Calculate current ASK liquidity (SELL orders)
    ask_result = await db.execute(
        select(func.sum(Order.price * (Order.quantity - Order.filled_quantity)))
        .where(
            Order.certificate_type == cert_type_enum,
            Order.side == OrderSide.SELL,
            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            Order.market_maker_id.isnot(None),  # Only MM orders
        )
    )
    ask_liquidity = ask_result.scalar() or 0

    # Calculate current BID liquidity (BUY orders)
    bid_result = await db.execute(
        select(func.sum(Order.price * (Order.quantity - Order.filled_quantity)))
        .where(
            Order.certificate_type == cert_type_enum,
            Order.side == OrderSide.BUY,
            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            Order.market_maker_id.isnot(None),  # Only MM orders
        )
    )
    bid_liquidity = bid_result.scalar() or 0

    # Calculate percentages
    ask_percentage = None
    bid_percentage = None

    if settings.target_ask_liquidity and settings.target_ask_liquidity > 0:
        ask_percentage = (ask_liquidity / settings.target_ask_liquidity) * 100

    if settings.target_bid_liquidity and settings.target_bid_liquidity > 0:
        bid_percentage = (bid_liquidity / settings.target_bid_liquidity) * 100

    return LiquidityStatusResponse(
        certificate_type=cert_type,
        ask_liquidity=ask_liquidity,
        bid_liquidity=bid_liquidity,
        target_ask_liquidity=settings.target_ask_liquidity,
        target_bid_liquidity=settings.target_bid_liquidity,
        ask_percentage=ask_percentage,
        bid_percentage=bid_percentage,
        liquidity_limit_enabled=settings.liquidity_limit_enabled,
    )


# ============================================================================
# Auto Trade Market Settings Endpoints (Per-market-side settings)
# ============================================================================

# Mapping from market_key to market maker types
MARKET_KEY_TO_MM_TYPES = {
    "CEA_BID": [MarketMakerType.CEA_BUYER],
    "CEA_ASK": [MarketMakerType.CEA_SELLER],
    "EUA_SWAP": [MarketMakerType.EUA_OFFER],
}


async def _check_is_online(db: AsyncSession, market_key: str) -> bool:
    """Check if any auto-trade rules for this market are actively running.

    A market is considered "online" if:
    - Settings are enabled AND
    - At least one enabled rule exists with recent execution activity
    """
    mm_types = MARKET_KEY_TO_MM_TYPES.get(market_key, [])
    if not mm_types:
        return False

    # Get market makers for this market
    mm_result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.mm_type.in_(mm_types))
    )
    market_makers = list(mm_result.scalars().all())
    if not market_makers:
        return False

    # Check if any enabled rules exist with recent activity
    mm_ids = [mm.id for mm in market_makers]
    rules_result = await db.execute(
        select(AutoTradeRule).where(
            AutoTradeRule.market_maker_id.in_(mm_ids),
            AutoTradeRule.enabled == True,  # noqa: E712
        )
    )
    enabled_rules = list(rules_result.scalars().all())

    if not enabled_rules:
        return False

    # Check if any rule has been executed recently (within 2x its interval)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for rule in enabled_rules:
        if rule.last_executed_at:
            interval = rule.interval_seconds or 60
            max_gap = timedelta(seconds=interval * 2)
            if (now - rule.last_executed_at) < max_gap:
                return True

    return False


@router.get("/auto-trade-market-settings", response_model=list[AutoTradeMarketSettingsResponse])
async def get_all_market_settings(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Get all per-market-side auto trade settings with associated market makers."""
    result = await db.execute(select(AutoTradeMarketSettings))
    all_settings = list(result.scalars().all())

    responses = []
    for settings in all_settings:
        # Get associated market makers based on market_key
        mm_types = MARKET_KEY_TO_MM_TYPES.get(settings.market_key, [])
        mm_result = await db.execute(
            select(MarketMakerClient).where(MarketMakerClient.mm_type.in_(mm_types))
        )
        market_makers = list(mm_result.scalars().all())

        # Calculate current liquidity
        current_liquidity = await _calculate_market_liquidity(db, settings.market_key)
        liquidity_percentage = None
        if settings.target_liquidity and settings.target_liquidity > 0:
            from decimal import Decimal
            liquidity_percentage = (current_liquidity / settings.target_liquidity) * Decimal("100")

        # Check if auto-trader is actively running
        is_online = settings.enabled and await _check_is_online(db, settings.market_key)

        responses.append(AutoTradeMarketSettingsResponse(
            id=settings.id,
            market_key=settings.market_key,
            enabled=settings.enabled,
            target_liquidity=settings.target_liquidity,
            price_deviation_pct=settings.price_deviation_pct,
            avg_order_count=settings.avg_order_count,
            min_order_volume_eur=settings.min_order_volume_eur,
            volume_variety=settings.volume_variety,
            avg_order_count_variation_pct=settings.avg_order_count_variation_pct,
            max_orders_per_price_level=settings.max_orders_per_price_level,
            max_orders_per_level_variation_pct=settings.max_orders_per_level_variation_pct,
            min_order_value_variation_pct=settings.min_order_value_variation_pct,
            interval_seconds=settings.interval_seconds,
            order_interval_variation_pct=settings.order_interval_variation_pct,
            max_order_volume_eur=settings.max_order_volume_eur,
            max_liquidity_threshold=settings.max_liquidity_threshold,
            internal_trade_interval=settings.internal_trade_interval,
            internal_trade_volume_min=settings.internal_trade_volume_min,
            internal_trade_volume_max=settings.internal_trade_volume_max,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
            market_makers=[MarketMakerSummary(id=mm.id, name=mm.name, is_active=mm.is_active) for mm in market_makers],
            current_liquidity=current_liquidity,
            liquidity_percentage=liquidity_percentage,
            is_online=is_online,
        ))

    return responses


@router.post("/auto-trade-market-settings/refresh-cea")
async def refresh_cea_market(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Refresh CEA Cash market: cancel all MM orders, fetch scraped price,
    and recreate BID + ASK orders from the auto-trade market settings.

    Rules:
    - best_bid = scraped CEA price (rounded to 0.1)
    - best_ask = best_bid + 0.1
    - BID orders placed from best_bid downward (each -0.1 EUR)
    - ASK orders placed from best_ask upward (each +0.1 EUR)
    - Contiguous price levels (no gaps > 0.1)
    - Respects avg_order_count, max_orders_per_price_level, min/max order volume
    """
    import random
    from sqlalchemy import and_
    from app.services.price_scraper import price_scraper

    try:
        # 1. Cancel all OPEN/PARTIALLY_FILLED CEA_CASH MM orders
        cancel_result = await db.execute(
            select(Order).where(
                and_(
                    Order.market == MarketType.CEA_CASH,
                    Order.market_maker_id.isnot(None),
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
        )
        orders_to_cancel = list(cancel_result.scalars().all())
        orders_cancelled = len(orders_to_cancel)

        for order in orders_to_cancel:
            order.status = OrderStatus.CANCELLED
            order.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        await db.flush()

        # 2. Fetch scraped CEA price
        prices = await price_scraper.get_current_prices()
        cea_price_raw = Decimal(str(prices["cea"]["price"]))
        # Round to nearest 0.1
        cea_price = (cea_price_raw / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")

        # Mean-reversion price deviation:
        # - Read last deviation from Redis; decay it 60% + add small noise
        # - Large deviations die quickly: +18% → ~+7% → ~+3% → ~+1%
        # - Fresh start (no history): standard gauss(0, 0.07)
        from app.core.security import RedisManager
        DECAY_FACTOR = 0.4       # keep 40% of previous deviation
        NOISE_SIGMA = 0.03       # small random noise on each refresh
        MAX_DEVIATION = 0.20     # hard cap ±20%
        REDIS_KEY = "cea:last_deviation"

        try:
            r = await RedisManager.get_redis()
            last_raw = await r.get(REDIS_KEY)
            if last_raw is not None:
                last_dev = float(last_raw)
                # Decay toward zero + fresh noise
                deviation_pct = last_dev * DECAY_FACTOR + random.gauss(0, NOISE_SIGMA)
            else:
                # First call or expired — fresh deviation
                deviation_pct = random.gauss(0, 0.07)
            deviation_pct = max(-MAX_DEVIATION, min(MAX_DEVIATION, deviation_pct))
            # Store for next call (TTL 1h — resets if nobody refreshes for a while)
            await r.set(REDIS_KEY, str(round(deviation_pct, 6)), ex=3600)
        except Exception:
            # Redis unavailable — fallback to stateless gauss
            deviation_pct = max(-MAX_DEVIATION, min(MAX_DEVIATION, random.gauss(0, 0.07)))

        mid_price = cea_price * (1 + Decimal(str(round(deviation_pct, 4))))
        mid_price = (mid_price / Decimal("0.1")).quantize(Decimal("1")) * Decimal("0.1")

        best_bid = mid_price
        best_ask = mid_price + Decimal("0.1")

        # 3. Load market settings for CEA_BID and CEA_ASK
        bid_settings_result = await db.execute(
            select(AutoTradeMarketSettings).where(AutoTradeMarketSettings.market_key == "CEA_BID")
        )
        bid_settings = bid_settings_result.scalar_one_or_none()

        ask_settings_result = await db.execute(
            select(AutoTradeMarketSettings).where(AutoTradeMarketSettings.market_key == "CEA_ASK")
        )
        ask_settings = ask_settings_result.scalar_one_or_none()

        if not bid_settings or not ask_settings:
            raise HTTPException(status_code=404, detail="CEA_BID or CEA_ASK settings not found")

        # 4. Get active market makers
        buyer_result = await db.execute(
            select(MarketMakerClient).where(
                and_(
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.mm_type == MarketMakerType.CEA_BUYER,
                )
            )
        )
        buyers = list(buyer_result.scalars().all())

        seller_result = await db.execute(
            select(MarketMakerClient).where(
                and_(
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.mm_type == MarketMakerType.CEA_SELLER,
                )
            )
        )
        sellers = list(seller_result.scalars().all())

        if not buyers or not sellers:
            raise HTTPException(status_code=400, detail="No active CEA_BUYER or CEA_SELLER market makers")

        bid_orders_created = 0
        ask_orders_created = 0
        price_step = Decimal("0.1")

        MAX_ORDERS_PER_LEVEL = 3  # hard cap per price level

        # Helper: random volume uniformly between min_eur and max_eur
        def random_volume_eur(min_eur, max_eur):
            """Random EUR value between min and max. Gives true diversity."""
            lo = float(min_eur) if min_eur else 1.0
            hi = float(max_eur) if max_eur else lo * 10
            if hi <= lo:
                hi = lo * 2
            return Decimal(str(round(random.uniform(lo, hi), 2)))

        # 5. Create BID orders (from best_bid downward)
        bid_min_vol = bid_settings.min_order_volume_eur
        bid_max_vol = bid_settings.max_order_volume_eur
        bid_target = bid_settings.target_liquidity or Decimal("50000000")
        bid_max_orders = int(bid_settings.avg_order_count or 200) * 2  # safety cap

        current_price = best_bid
        orders_at_level = 0
        max_at_this_level = random.randint(1, MAX_ORDERS_PER_LEVEL)
        buyer_idx = 0
        bid_liquidity_eur = Decimal("0")

        for _ in range(bid_max_orders):
            if current_price <= Decimal("0.1") or bid_liquidity_eur >= bid_target:
                break

            if orders_at_level >= max_at_this_level:
                current_price -= price_step
                current_price = current_price.quantize(Decimal("0.1"))
                orders_at_level = 0
                max_at_this_level = random.randint(1, MAX_ORDERS_PER_LEVEL)
                if current_price <= Decimal("0"):
                    break

            # Cap max volume by remaining budget
            remaining = bid_target - bid_liquidity_eur
            effective_max = min(bid_max_vol, remaining) if bid_max_vol else remaining
            if effective_max < bid_min_vol:
                break  # Can't even fit one min-size order

            order_value_eur = random_volume_eur(bid_min_vol, effective_max)
            quantity = (order_value_eur / current_price).quantize(Decimal("1"))
            if quantity < 1:
                quantity = Decimal("1")

            mm = buyers[buyer_idx % len(buyers)]
            buyer_idx += 1

            order = Order(
                market=MarketType.CEA_CASH,
                market_maker_id=mm.id,
                certificate_type=CertificateType.CEA,
                side=OrderSide.BUY,
                price=current_price,
                quantity=quantity,
                filled_quantity=Decimal("0"),
                status=OrderStatus.OPEN,
            )
            db.add(order)
            bid_orders_created += 1
            orders_at_level += 1
            bid_liquidity_eur += current_price * quantity

        # 6. Create ASK orders (from best_ask upward)
        ask_min_vol = ask_settings.min_order_volume_eur
        ask_max_vol = ask_settings.max_order_volume_eur
        ask_target = ask_settings.target_liquidity or Decimal("90000000")
        ask_max_orders = int(ask_settings.avg_order_count or 200) * 2  # safety cap

        current_price = best_ask
        orders_at_level = 0
        max_at_this_level = random.randint(1, MAX_ORDERS_PER_LEVEL)
        seller_idx = 0
        ask_liquidity_eur = Decimal("0")

        for _ in range(ask_max_orders):
            if ask_liquidity_eur >= ask_target:
                break

            if orders_at_level >= max_at_this_level:
                current_price += price_step
                current_price = current_price.quantize(Decimal("0.1"))
                orders_at_level = 0
                max_at_this_level = random.randint(1, MAX_ORDERS_PER_LEVEL)

            # Cap max volume by remaining budget
            remaining = ask_target - ask_liquidity_eur
            effective_max = min(ask_max_vol, remaining) if ask_max_vol else remaining
            if effective_max < ask_min_vol:
                break

            order_value_eur = random_volume_eur(ask_min_vol, effective_max)
            quantity = (order_value_eur / current_price).quantize(Decimal("1"))
            if quantity < 1:
                quantity = Decimal("1")

            mm = sellers[seller_idx % len(sellers)]
            seller_idx += 1

            order = Order(
                market=MarketType.CEA_CASH,
                market_maker_id=mm.id,
                certificate_type=CertificateType.CEA,
                side=OrderSide.SELL,
                price=current_price,
                quantity=quantity,
                filled_quantity=Decimal("0"),
                status=OrderStatus.OPEN,
            )
            db.add(order)
            ask_orders_created += 1
            orders_at_level += 1
            ask_liquidity_eur += current_price * quantity

        await db.commit()

        return {
            "success": True,
            "orders_cancelled": orders_cancelled,
            "cea_price_eur": str(cea_price),
            "new_best_bid": str(best_bid),
            "mid_price_eur": str(mid_price),
            "price_deviation_pct": str(round(deviation_pct * 100, 1)),
            "new_best_bid": str(best_bid),
            "new_best_ask": str(best_ask),
            "bid_orders_created": bid_orders_created,
            "ask_orders_created": ask_orders_created,
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Error refreshing CEA market: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh CEA market: {str(e)}")


@router.post("/auto-trade-market-settings/place-random-order")
async def place_random_order(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Place a single random MM order in the CEA cash market.
    Randomly picks: BUY or SELL, limit or market-like, price near best bid/ask.
    Used by the frontend on a 10-180s timer to simulate organic activity.
    """
    import random
    from sqlalchemy import and_
    from app.services.limit_order_matching import LimitOrderMatcher

    try:
        # Pick a random side
        side = random.choice([OrderSide.BUY, OrderSide.SELL])

        # Get the right MM type for this side
        mm_type = MarketMakerType.CEA_BUYER if side == OrderSide.BUY else MarketMakerType.CEA_SELLER
        mm_result = await db.execute(
            select(MarketMakerClient).where(
                and_(
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.mm_type == mm_type,
                )
            )
        )
        mms = list(mm_result.scalars().all())
        if not mms:
            raise HTTPException(status_code=400, detail=f"No active {mm_type.value} market makers")
        mm = random.choice(mms)

        # Get current best bid/ask
        best_bid_result = await db.execute(
            select(func.max(Order.price)).where(
                and_(
                    Order.market == MarketType.CEA_CASH,
                    Order.certificate_type == CertificateType.CEA,
                    Order.side == OrderSide.BUY,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
        )
        best_bid = best_bid_result.scalar()

        best_ask_result = await db.execute(
            select(func.min(Order.price)).where(
                and_(
                    Order.market == MarketType.CEA_CASH,
                    Order.certificate_type == CertificateType.CEA,
                    Order.side == OrderSide.SELL,
                    Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                )
            )
        )
        best_ask = best_ask_result.scalar()

        if not best_bid or not best_ask:
            raise HTTPException(status_code=400, detail="No orderbook — run Refresh CEA first")

        price_step = Decimal("0.1")

        # Decide: limit order (80%) or market-crossing order (20%)
        is_market_like = random.random() < 0.10

        if side == OrderSide.BUY:
            if is_market_like:
                # Market-like: buy at best_ask (will match immediately)
                price = best_ask
            else:
                # Limit: place at or slightly below best_bid (0 to -3 ticks)
                offset = random.randint(0, 3)
                price = best_bid - price_step * offset
        else:
            if is_market_like:
                # Market-like: sell at best_bid (will match immediately)
                price = best_bid
            else:
                # Limit: place at or slightly above best_ask (0 to +3 ticks)
                offset = random.randint(0, 3)
                price = best_ask + price_step * offset

        price = max(price, price_step)  # floor at 0.1
        price = price.quantize(Decimal("0.1"))

        # Random volume: 10K - 500K EUR equivalent
        volume_eur = Decimal(str(round(random.uniform(200_000, 5_000_000), 2)))
        quantity = (volume_eur / price).quantize(Decimal("1"))
        if quantity < 1:
            quantity = Decimal("1")

        order = Order(
            market=MarketType.CEA_CASH,
            market_maker_id=mm.id,
            certificate_type=CertificateType.CEA,
            side=side,
            price=price,
            quantity=quantity,
            filled_quantity=Decimal("0"),
            status=OrderStatus.OPEN,
        )
        db.add(order)
        await db.flush()

        # Try to match if it crosses the spread
        trades_matched = 0
        if is_market_like:
            result = await LimitOrderMatcher.match_incoming_order(
                db=db,
                incoming_order=order,
                user_id=current_user.id,
            )
            trades_matched = result.trades_created if result else 0

        await db.commit()

        return {
            "success": True,
            "side": side.value,
            "price": str(price),
            "quantity": str(quantity),
            "volume_eur": str(volume_eur),
            "is_market_like": is_market_like,
            "trades_matched": trades_matched,
            "market_maker": mm.name,
            "status": order.status.value,
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Error placing random order: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to place random order: {str(e)}")


@router.get("/auto-trade-market-settings/mm-activity")
async def get_mm_activity(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """
    Get recent MM orders and trades for the activity feed.
    Returns orders and trades merged chronologically, newest first.
    """
    from sqlalchemy import and_, literal

    # Recent MM orders (all statuses)
    orders_result = await db.execute(
        select(Order)
        .where(
            and_(
                Order.market_maker_id.isnot(None),
                Order.market == MarketType.CEA_CASH,
            )
        )
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = list(orders_result.scalars().all())

    # Recent trades
    trades_result = await db.execute(
        select(CashMarketTrade)
        .where(CashMarketTrade.certificate_type == CertificateType.CEA)
        .order_by(CashMarketTrade.executed_at.desc())
        .limit(limit)
    )
    trades = list(trades_result.scalars().all())

    # Build unified activity list
    activity = []

    for o in orders:
        activity.append({
            "type": "order",
            "id": str(o.id),
            "side": o.side.value,
            "price": str(o.price),
            "quantity": str(o.quantity),
            "filled_quantity": str(o.filled_quantity or 0),
            "status": o.status.value,
            "timestamp": o.created_at.isoformat() if o.created_at else None,
        })

    for t in trades:
        activity.append({
            "type": "trade",
            "id": str(t.id),
            "price": str(t.price),
            "quantity": str(t.quantity),
            "timestamp": t.executed_at.isoformat() if t.executed_at else None,
        })

    # Sort by timestamp descending
    activity.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    return activity[:limit]


@router.get("/auto-trade-market-settings/{market_key}", response_model=AutoTradeMarketSettingsResponse)
async def get_market_settings(
    market_key: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Get auto trade settings for a specific market side."""
    market_key_upper = market_key.upper()
    if market_key_upper not in MARKET_KEY_TO_MM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid market_key. Must be one of: {list(MARKET_KEY_TO_MM_TYPES.keys())}"
        )

    result = await db.execute(
        select(AutoTradeMarketSettings).where(AutoTradeMarketSettings.market_key == market_key_upper)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(status_code=404, detail=f"Settings for {market_key_upper} not found")

    # Get associated market makers
    mm_types = MARKET_KEY_TO_MM_TYPES.get(market_key_upper, [])
    mm_result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.mm_type.in_(mm_types))
    )
    market_makers = list(mm_result.scalars().all())

    # Calculate current liquidity
    current_liquidity = await _calculate_market_liquidity(db, market_key_upper)
    liquidity_percentage = None
    if settings.target_liquidity and settings.target_liquidity > 0:
        from decimal import Decimal
        liquidity_percentage = (current_liquidity / settings.target_liquidity) * Decimal("100")

    # Check if auto-trader is actively running
    is_online = settings.enabled and await _check_is_online(db, market_key_upper)

    return AutoTradeMarketSettingsResponse(
        id=settings.id,
        market_key=settings.market_key,
        enabled=settings.enabled,
        target_liquidity=settings.target_liquidity,
        price_deviation_pct=settings.price_deviation_pct,
        avg_order_count=settings.avg_order_count,
        min_order_volume_eur=settings.min_order_volume_eur,
        volume_variety=settings.volume_variety,
        avg_order_count_variation_pct=settings.avg_order_count_variation_pct,
        max_orders_per_price_level=settings.max_orders_per_price_level,
        max_orders_per_level_variation_pct=settings.max_orders_per_level_variation_pct,
        min_order_value_variation_pct=settings.min_order_value_variation_pct,
        interval_seconds=settings.interval_seconds,
        order_interval_variation_pct=settings.order_interval_variation_pct,
        max_order_volume_eur=settings.max_order_volume_eur,
        max_liquidity_threshold=settings.max_liquidity_threshold,
        internal_trade_interval=settings.internal_trade_interval,
        internal_trade_volume_min=settings.internal_trade_volume_min,
        internal_trade_volume_max=settings.internal_trade_volume_max,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
        market_makers=[MarketMakerSummary(id=mm.id, name=mm.name, is_active=mm.is_active) for mm in market_makers],
        current_liquidity=current_liquidity,
        liquidity_percentage=liquidity_percentage,
        is_online=is_online,
    )


@router.put("/auto-trade-market-settings/{market_key}", response_model=AutoTradeMarketSettingsResponse)
async def update_market_settings(
    market_key: str,
    updates: AutoTradeMarketSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Update auto trade settings for a specific market side."""
    market_key_upper = market_key.upper()
    if market_key_upper not in MARKET_KEY_TO_MM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid market_key. Must be one of: {list(MARKET_KEY_TO_MM_TYPES.keys())}"
        )

    try:
        result = await db.execute(
            select(AutoTradeMarketSettings).where(AutoTradeMarketSettings.market_key == market_key_upper)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            raise HTTPException(status_code=404, detail=f"Settings for {market_key_upper} not found")

        # Update fields
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)

        settings.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        # Get associated market makers
        mm_types = MARKET_KEY_TO_MM_TYPES.get(market_key_upper, [])
        mm_result = await db.execute(
            select(MarketMakerClient).where(MarketMakerClient.mm_type.in_(mm_types))
        )
        market_makers = list(mm_result.scalars().all())

        # Create/update auto-trade rules for each market maker
        await _sync_auto_trade_rules(db, settings, market_makers, market_key_upper)

        await db.commit()
        await db.refresh(settings)

        # Calculate current liquidity
        current_liquidity = await _calculate_market_liquidity(db, market_key_upper)
        liquidity_percentage = None
        if settings.target_liquidity and settings.target_liquidity > 0:
            from decimal import Decimal
            liquidity_percentage = (current_liquidity / settings.target_liquidity) * Decimal("100")

        # Check if auto-trader is actively running
        is_online = settings.enabled and await _check_is_online(db, market_key_upper)

        return AutoTradeMarketSettingsResponse(
            id=settings.id,
            market_key=settings.market_key,
            enabled=settings.enabled,
            target_liquidity=settings.target_liquidity,
            price_deviation_pct=settings.price_deviation_pct,
            avg_order_count=settings.avg_order_count,
            min_order_volume_eur=settings.min_order_volume_eur,
            volume_variety=settings.volume_variety,
            avg_order_count_variation_pct=settings.avg_order_count_variation_pct,
            max_orders_per_price_level=settings.max_orders_per_price_level,
            max_orders_per_level_variation_pct=settings.max_orders_per_level_variation_pct,
            min_order_value_variation_pct=settings.min_order_value_variation_pct,
            interval_seconds=settings.interval_seconds,
            order_interval_variation_pct=settings.order_interval_variation_pct,
            max_order_volume_eur=settings.max_order_volume_eur,
            max_liquidity_threshold=settings.max_liquidity_threshold,
            internal_trade_interval=settings.internal_trade_interval,
            internal_trade_volume_min=settings.internal_trade_volume_min,
            internal_trade_volume_max=settings.internal_trade_volume_max,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
            market_makers=[MarketMakerSummary(id=mm.id, name=mm.name, is_active=mm.is_active) for mm in market_makers],
            current_liquidity=current_liquidity,
            liquidity_percentage=liquidity_percentage,
            is_online=is_online,
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "updating market settings")


async def _calculate_market_liquidity(db: AsyncSession, market_key: str) -> "Decimal":
    """Calculate current liquidity for a market side."""
    from decimal import Decimal

    # Map market_key to certificate_type and side
    if market_key == "CEA_BID":
        cert_type = CertificateType.CEA
        side = OrderSide.BUY
    elif market_key == "CEA_ASK":
        cert_type = CertificateType.CEA
        side = OrderSide.SELL
    elif market_key == "EUA_SWAP":
        cert_type = CertificateType.EUA
        side = OrderSide.SELL  # Swap offers are on ASK side
    else:
        return Decimal("0")

    # Calculate: SUM(price * remaining_quantity) for open MM orders
    result = await db.execute(
        select(func.sum(Order.price * (Order.quantity - Order.filled_quantity)))
        .where(
            Order.certificate_type == cert_type,
            Order.side == side,
            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
            Order.market_maker_id.isnot(None),
        )
    )
    return Decimal(str(result.scalar() or 0))


async def _sync_auto_trade_rules(
    db: AsyncSession,
    settings: AutoTradeMarketSettings,
    market_makers: list,
    market_key: str
) -> None:
    """Create or update auto-trade rules for each market maker based on market settings.

    Each market maker gets one rule that mirrors the market settings.
    Rules are created if they don't exist, or updated if they do.
    """
    from app.models.models import AutoTradeRule, AutoTradePriceMode, AutoTradeQuantityMode

    # Determine order side based on market key
    if market_key == "CEA_BID":
        side = OrderSide.BUY
        rule_name_prefix = "Liquidity Engine BID"
    elif market_key == "CEA_ASK":
        side = OrderSide.SELL
        rule_name_prefix = "Liquidity Engine ASK"
    elif market_key == "EUA_SWAP":
        side = OrderSide.SELL  # Swap offers are sells
        rule_name_prefix = "Liquidity Engine SWAP"
    else:
        return

    for mm in market_makers:
        # Check if rule already exists for this market maker and side
        rule_result = await db.execute(
            select(AutoTradeRule).where(
                AutoTradeRule.market_maker_id == mm.id,
                AutoTradeRule.side == side,
                AutoTradeRule.name.like("Liquidity Engine%")
            )
        )
        rule = rule_result.scalar_one_or_none()

        # Calculate min quantity based on target liquidity and avg_order_count
        min_quantity = None
        if settings.target_liquidity and settings.avg_order_count:
            from decimal import Decimal
            # Each order should be roughly target / avg_order_count EUR value
            # Assuming price ~70 EUR/CEA for quantity calculation
            avg_order_value = settings.target_liquidity / Decimal(str(settings.avg_order_count))
            min_quantity = max(Decimal("1"), avg_order_value / Decimal("70"))

        if rule:
            # Update existing rule
            rule.enabled = settings.enabled
            rule.interval_seconds = settings.interval_seconds
            rule.price_mode = AutoTradePriceMode.RANDOM_SPREAD
            rule.spread_min = settings.price_deviation_pct or Decimal("0.01")
            rule.spread_max = (settings.price_deviation_pct or Decimal("0.01")) * Decimal("3")
            rule.max_price_deviation = settings.price_deviation_pct
            rule.quantity_mode = AutoTradeQuantityMode.RANDOM_RANGE
            rule.min_quantity = min_quantity or Decimal("1")
            rule.max_quantity = (min_quantity or Decimal("1")) * Decimal(str(1 + (settings.volume_variety or 0.5)))
            rule.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            # Schedule next execution if enabled
            if settings.enabled and not rule.next_execution_at:
                rule.next_execution_at = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            # Create new rule
            rule = AutoTradeRule(
                market_maker_id=mm.id,
                name=f"{rule_name_prefix} - {mm.name}",
                enabled=settings.enabled,
                side=side,
                order_type="LIMIT",
                price_mode=AutoTradePriceMode.RANDOM_SPREAD,
                spread_min=settings.price_deviation_pct or Decimal("0.01"),
                spread_max=(settings.price_deviation_pct or Decimal("0.01")) * Decimal("3"),
                max_price_deviation=settings.price_deviation_pct,
                quantity_mode=AutoTradeQuantityMode.RANDOM_RANGE,
                min_quantity=min_quantity or Decimal("1"),
                max_quantity=(min_quantity or Decimal("1")) * Decimal(str(1 + (settings.volume_variety or 0.5))),
                interval_mode="fixed",
                interval_seconds=settings.interval_seconds,
                next_execution_at=datetime.now(timezone.utc).replace(tzinfo=None) if settings.enabled else None,
            )
            db.add(rule)


# ============================================================================
# ADMIN TESTING TOOLS
# ============================================================================

class AdminRoleUpdateRequest(BaseModel):
    """Request to change admin's own role for testing"""
    role: str


class AdminCreditRequest(BaseModel):
    """Request to credit assets to admin's own entity"""
    asset_type: str  # EUR, CEA, EUA
    amount: Decimal = Field(..., gt=0)


class EntityBalancesResponse(BaseModel):
    """Response with entity balances"""
    eur: Decimal
    cea: Decimal
    eua: Decimal


@router.put("/me/role", response_model=UserResponse)
async def update_my_role(
    request: AdminRoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update admin's own role for testing purposes.

    This allows admins to test the platform from different user perspectives
    by temporarily changing their role.

    Note: Uses get_current_user instead of get_admin_user to allow
    restoring ADMIN role even when currently in a different role.
    Only the original admin user (by email) can use this endpoint.
    """
    logger = logging.getLogger(__name__)
    logger.info(f"update_my_role called with role={request.role} by {current_user.email}")

    # Security: Only allow the designated admin email to use this endpoint
    ADMIN_EMAILS = ["admin@nihaogroup.com"]  # Add more as needed
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Only designated admin users can change their role for testing"
        )

    try:
        # Validate role
        role_upper = request.role.upper()
        valid_roles = [r.value for r in UserRole]
        if role_upper not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Must be one of: {valid_roles}"
            )

        # Re-fetch user in current session to avoid detached instance error
        result = await db.execute(select(User).where(User.id == current_user.id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update role
        user.role = UserRole(role_upper)
        user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(user)

        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            position=user.position,
            role=user.role.value,
            entity_id=user.entity_id,
            is_active=user.is_active,
            must_change_password=user.must_change_password,
            last_login=user.last_login,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating admin role: {e}")
        await db.rollback()
        raise handle_database_error(e, "updating admin role") from e


@router.post("/me/credit", response_model=EntityBalancesResponse)
async def credit_my_entity(
    request: AdminCreditRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Credit assets to admin's own entity for testing purposes.

    This allows admins to quickly add EUR, CEA, or EUA to their entity
    for testing trading functionality.
    """
    from app.models.models import AssetType, EntityHolding, AssetTransaction, TransactionType
    from app.services.balance_utils import update_entity_balance, get_entity_balance

    try:
        # Check admin has an entity
        if not current_user.entity_id:
            raise HTTPException(
                status_code=400,
                detail="Admin user does not have an associated entity. Create one first."
            )

        # Validate asset type
        asset_type_upper = request.asset_type.upper()
        try:
            asset_type = AssetType(asset_type_upper)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid asset type. Must be one of: EUR, CEA, EUA"
            )

        # Credit the entity using ADJUSTMENT type (for admin credits)
        new_balance = await update_entity_balance(
            db=db,
            entity_id=current_user.entity_id,
            asset_type=asset_type,
            amount=request.amount,
            transaction_type=TransactionType.ADJUSTMENT,
            created_by=current_user.id,
            notes=f"Admin testing credit: {request.amount} {asset_type_upper}",
        )

        await db.commit()

        # Get all balances
        eur_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUR)
        cea_balance = await get_entity_balance(db, current_user.entity_id, AssetType.CEA)
        eua_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUA)

        return EntityBalancesResponse(
            eur=eur_balance,
            cea=cea_balance,
            eua=eua_balance,
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "crediting admin entity") from e


@router.get("/me/balances", response_model=EntityBalancesResponse)
async def get_my_balances(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Get admin's entity balances."""
    from app.models.models import AssetType
    from app.services.balance_utils import get_entity_balance

    try:
        if not current_user.entity_id:
            raise HTTPException(
                status_code=400,
                detail="Admin user does not have an associated entity."
            )

        eur_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUR)
        cea_balance = await get_entity_balance(db, current_user.entity_id, AssetType.CEA)
        eua_balance = await get_entity_balance(db, current_user.entity_id, AssetType.EUA)

        return EntityBalancesResponse(
            eur=eur_balance,
            cea=cea_balance,
            eua=eua_balance,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise handle_database_error(e, "getting admin balances") from e
