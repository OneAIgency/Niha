import asyncio
import logging
import os
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.exceptions import handle_database_error
from ...core.security import RedisManager, get_current_user
from ...models.models import ContactRequest, ContactStatus, User, UserRole
from ...schemas.schemas import (
    ContactRequestCreate,
    ContactRequestResponse,
)
from ...services.email_service import email_service
from .backoffice import backoffice_ws_manager

router = APIRouter(prefix="/contact", tags=["Contact"])
logger = logging.getLogger(__name__)

# Allowed file types and max size for NDA
ALLOWED_NDA_EXTENSIONS = {".pdf"}
MAX_NDA_SIZE = 10 * 1024 * 1024  # 10MB

# Rate limit constants for code validation
_CODE_RATE_LIMIT = 5
_CODE_RATE_WINDOW = 600  # 10 minutes


def get_client_ip(request: Request) -> str:
    """Get client IP, checking for proxy headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _check_rate_limit(ip: str) -> None:
    """Check code validation rate limit using Redis. Raises 429 if exceeded."""
    key = f"code_validation:{ip}"
    try:
        r = await RedisManager.get_redis()
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, _CODE_RATE_WINDOW)
        if count > _CODE_RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception:
        # Redis unavailable — allow the request (fail open)
        logger.warning("Redis unavailable for rate limiting, allowing request")


@router.post("/validate-code")
async def validate_code(
    request: Request,
    code: str = Form(...),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Validate a referral code without consuming it. Rate-limited: 5 per IP per 10 min."""
    from ...services.referral_codes import validate_referral_code

    ip = get_client_ip(request)
    await _check_rate_limit(ip)

    result = await validate_referral_code(db, code.strip())
    if result is None:
        return {"valid": False}
    return {"valid": True, "type": result["type"]}


@router.post("/request", response_model=ContactRequestResponse)
async def create_contact_request(
    request: ContactRequestCreate, db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Submit a contact request to join the platform.
    An agent will follow up with the entity.
    """
    # Create contact request (user_role = NDA = first step in onboarding flow, request_flow = buyer)
    contact = ContactRequest(
        entity_name=request.entity_name,
        contact_email=request.contact_email.lower(),
        contact_name=request.contact_name,
        contact_first_name=request.contact_first_name,
        contact_last_name=request.contact_last_name,
        position=request.position,
        user_role=ContactStatus.NDA,
        request_flow="buyer",
    )

    try:
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating contact request", logger) from e

    # Broadcast new contact request to backoffice
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "new_request",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_name": contact.contact_name,
                "contact_first_name": contact.contact_first_name,
                "contact_last_name": contact.contact_last_name,
                "position": contact.position,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "new",
                "request_flow": getattr(contact, "request_flow", "buyer"),
                "notes": contact.notes,
                "created_at": (contact.created_at.isoformat() + "Z")
                if contact.created_at
                else None,
            },
        )
    )

    # Send confirmation email
    await email_service.send_contact_followup(
        request.contact_email, request.entity_name
    )

    return contact


@router.post("/nda-request", response_model=ContactRequestResponse)
async def create_nda_request(
    request: Request,
    entity_name: str = Form(...),  # noqa: B008
    contact_email: str = Form(...),  # noqa: B008
    contact_first_name: str = Form(...),  # noqa: B008
    contact_last_name: str = Form(...),  # noqa: B008
    position: str = Form(...),  # noqa: B008
    file: UploadFile = File(...),  # noqa: B008
    referral_code: Optional[str] = Form(None),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Submit an NDA request with signed NDA document.
    Only PDF files allowed. Stores PDF binary in database.
    Optional referral_code for buyer path from introducer code.
    """
    # Capture submitter IP address
    submitter_ip = get_client_ip(request)

    # Validate email format
    if "@" not in contact_email or "." not in contact_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_NDA_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_NDA_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Consume referral code if provided (buyer path from introducer code)
    referred_by_user_id = None
    if referral_code:
        from ...services.referral_codes import consume_referral_code

        referred_by_user_id = await consume_referral_code(db, referral_code.strip())

    # Create contact request with NDA - store PDF binary in database (user_role = NDA, request_flow = buyer)
    contact = ContactRequest(
        entity_name=entity_name,
        contact_email=contact_email.lower(),
        contact_first_name=contact_first_name,
        contact_last_name=contact_last_name,
        position=position,
        nda_file_name=file.filename,
        nda_file_data=content,  # Store binary in database
        nda_file_mime_type="application/pdf",
        submitter_ip=submitter_ip,
        user_role=ContactStatus.NDA,
        request_flow="buyer",
        referred_by_user_id=referred_by_user_id,
        referral_code_used=referral_code.strip() if referral_code and referred_by_user_id else None,
    )

    try:
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating NDA contact request", logger) from e

    # Broadcast new NDA request to backoffice
    # (same shape as get_contact_requests / request_updated)
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "new_request",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_name": contact.contact_name,
                "contact_first_name": contact.contact_first_name,
                "contact_last_name": contact.contact_last_name,
                "position": contact.position,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "new",
                "request_flow": contact.request_flow,
                "notes": contact.notes,
                "created_at": (contact.created_at.isoformat() + "Z")
                if contact.created_at
                else None,
            },
        )
    )

    # Send confirmation email
    try:
        await email_service.send_contact_followup(contact_email, entity_name)
    except Exception:
        pass  # Don't fail if email fails

    return contact


@router.post("/introducer-nda-request", response_model=ContactRequestResponse)
async def create_introducer_nda_request(
    request: Request,
    entity_name: str = Form(...),  # noqa: B008
    contact_email: str = Form(...),  # noqa: B008
    contact_first_name: str = Form(...),  # noqa: B008
    contact_last_name: str = Form(...),  # noqa: B008
    position: str = Form(...),  # noqa: B008
    file: UploadFile = File(...),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Submit an NDA request for the Introducer flow.
    Same payload as nda-request; creates ContactRequest with request_flow='introducer'.
    """
    submitter_ip = get_client_ip(request)

    if "@" not in contact_email or "." not in contact_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_NDA_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await file.read()
    if len(content) > MAX_NDA_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    contact = ContactRequest(
        entity_name=entity_name,
        contact_email=contact_email.lower(),
        contact_first_name=contact_first_name,
        contact_last_name=contact_last_name,
        position=position,
        nda_file_name=file.filename,
        nda_file_data=content,
        nda_file_mime_type="application/pdf",
        submitter_ip=submitter_ip,
        user_role=ContactStatus.NDA,
        request_flow="introducer",
    )

    try:
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating Introducer NDA contact request", logger) from e

    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "new_request",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_name": contact.contact_name,
                "contact_first_name": contact.contact_first_name,
                "contact_last_name": contact.contact_last_name,
                "position": contact.position,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "new",
                "request_flow": contact.request_flow,
                "notes": contact.notes,
                "created_at": (contact.created_at.isoformat() + "Z")
                if contact.created_at
                else None,
            },
        )
    )

    try:
        await email_service.send_contact_followup(contact_email, entity_name)
    except Exception:
        pass

    return contact


@router.post("/introducer-request")
async def create_introducer_request(
    request: Request,
    contact_email: str = Form(...),  # noqa: B008
    contact_first_name: str = Form(...),  # noqa: B008
    contact_last_name: str = Form(...),  # noqa: B008
    entity_name: str = Form(""),  # noqa: B008
    referral_code: str = Form(...),  # noqa: B008
    file: Optional[UploadFile] = File(None),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Submit introducer application. Requires valid PREINTRODUCER referral code. NDA optional."""
    from ...services.referral_codes import consume_referral_code, validate_referral_code

    submitter_ip = get_client_ip(request)

    if "@" not in contact_email or "." not in contact_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    code_info = await validate_referral_code(db, referral_code.strip())
    if not code_info or code_info["type"] != "preintroducer":
        raise HTTPException(status_code=400, detail="Invalid or expired referral code")

    nda_file_name = None
    nda_file_data = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_NDA_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        content = await file.read()
        if len(content) > MAX_NDA_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        nda_file_name = file.filename
        nda_file_data = content

    referred_by_user_id = await consume_referral_code(db, referral_code.strip())

    if not referred_by_user_id:
        raise HTTPException(status_code=400, detail="Referral code has already been used")

    contact = ContactRequest(
        entity_name=entity_name or f"{contact_first_name} {contact_last_name}",
        contact_email=contact_email.lower(),
        contact_first_name=contact_first_name,
        contact_last_name=contact_last_name,
        position="Introducer Applicant",
        nda_file_name=nda_file_name,
        nda_file_data=nda_file_data,
        nda_file_mime_type="application/pdf" if nda_file_data else None,
        submitter_ip=submitter_ip,
        user_role=ContactStatus.NDA,
        request_flow="introducer",
        referred_by_user_id=referred_by_user_id,
        referral_code_used=referral_code.strip(),
    )

    try:
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating introducer request", logger) from e

    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "new_request",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_first_name": contact.contact_first_name,
                "contact_last_name": contact.contact_last_name,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value,
                "request_flow": contact.request_flow,
                "referred_by_user_id": str(contact.referred_by_user_id) if contact.referred_by_user_id else None,
                "created_at": (contact.created_at.isoformat() + "Z") if contact.created_at else None,
            },
        )
    )

    try:
        await email_service.send_contact_followup(contact_email, entity_name or "Introducer")
    except Exception:
        pass

    return contact


@router.post("/introducer/upload-nda")
async def upload_introducer_nda(
    file: UploadFile = File(...),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Authenticated: INTRODUCER with nda_signed=false uploads their signed NDA."""
    if current_user.role != UserRole.INTRODUCER:
        raise HTTPException(status_code=403, detail="Only INTRODUCER users can upload NDA")
    if current_user.nda_signed:
        raise HTTPException(status_code=400, detail="NDA already signed")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_NDA_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await file.read()
    if len(content) > MAX_NDA_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Store NDA file on user record
    current_user.nda_file_data = content
    current_user.nda_file_name = file.filename
    await db.commit()

    # Notify backoffice
    asyncio.create_task(
        backoffice_ws_manager.broadcast("introducer_nda_uploaded", {
            "user_id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "file_name": file.filename,
        })
    )

    return {"message": "NDA uploaded successfully. Awaiting admin review.", "success": True}


@router.get("/status/{email}", response_model=ContactRequestResponse)
async def check_contact_status(email: str, db: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Check the user_role of a contact request by email.
    """
    from sqlalchemy import select

    result = await db.execute(
        select(ContactRequest)
        .where(ContactRequest.contact_email == email.lower())
        .order_by(ContactRequest.created_at.desc())
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No contact request found for this email",
        )

    return contact
