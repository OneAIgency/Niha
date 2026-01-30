import asyncio
import logging
import os

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
from ...models.models import ContactRequest, ContactStatus
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


def get_client_ip(request: Request) -> str:
    """Get client IP, checking for proxy headers."""
    # Check X-Forwarded-For first (for proxies/load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    # Fall back to direct client IP
    return request.client.host if request.client else None


@router.post("/request", response_model=ContactRequestResponse)
async def create_contact_request(
    request: ContactRequestCreate, db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Submit a contact request to join the platform.
    An agent will follow up with the entity.
    """
    # Create contact request (user_role = NDA = first step in onboarding flow)
    contact = ContactRequest(
        entity_name=request.entity_name,
        contact_email=request.contact_email.lower(),
        contact_name=request.contact_name,
        position=request.position,
        user_role=ContactStatus.NDA,
    )

    try:
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
    except Exception as e:
        await db.rollback()
        raise handle_database_error(e, "creating contact request", logger) from e

    # Broadcast new contact request to backoffice
    # (same shape as get_contact_requests / request_updated)
    asyncio.create_task(
        backoffice_ws_manager.broadcast(
            "new_request",
            {
                "id": str(contact.id),
                "entity_name": contact.entity_name,
                "contact_email": contact.contact_email,
                "contact_name": contact.contact_name,
                "position": contact.position,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "new",
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
    contact_name: str = Form(...),  # noqa: B008
    position: str = Form(...),  # noqa: B008
    file: UploadFile = File(...),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Submit an NDA request with signed NDA document.
    Only PDF files allowed. Stores PDF binary in database.
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

    # Create contact request with NDA - store PDF binary in database (user_role = NDA)
    contact = ContactRequest(
        entity_name=entity_name,
        contact_email=contact_email.lower(),
        contact_name=contact_name,
        position=position,
        nda_file_name=file.filename,
        nda_file_data=content,  # Store binary in database
        nda_file_mime_type="application/pdf",
        submitter_ip=submitter_ip,
        user_role=ContactStatus.NDA,
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
                "position": contact.position,
                "nda_file_name": contact.nda_file_name,
                "submitter_ip": contact.submitter_ip,
                "user_role": contact.user_role.value if contact.user_role else "new",
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
