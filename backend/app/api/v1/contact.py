from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid as uuid_module
import aiofiles

from ...core.database import get_db
from ...models.models import ContactRequest, ContactStatus
from ...schemas.schemas import ContactRequestCreate, ContactRequestResponse, MessageResponse
from ...services.email_service import email_service

router = APIRouter(prefix="/contact", tags=["Contact"])

# NDA upload directory
NDA_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'uploads', 'nda')
os.makedirs(NDA_UPLOAD_DIR, exist_ok=True)

# Allowed file types and max size for NDA
ALLOWED_NDA_EXTENSIONS = {'.pdf'}
MAX_NDA_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/request", response_model=ContactRequestResponse)
async def create_contact_request(
    request: ContactRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a contact request to join the platform.
    An agent will follow up with the entity.
    """
    # Create contact request
    contact = ContactRequest(
        entity_name=request.entity_name,
        contact_email=request.contact_email.lower(),
        contact_name=request.contact_name,
        position=request.position,
        reference=request.reference,
        request_type=request.request_type,
        status=ContactStatus.NEW
    )

    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    # Send confirmation email
    await email_service.send_contact_followup(
        request.contact_email,
        request.entity_name
    )

    return contact


@router.post("/nda-request", response_model=ContactRequestResponse)
async def create_nda_request(
    entity_name: str = Form(...),
    contact_email: str = Form(...),
    contact_name: str = Form(...),
    position: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an NDA request with signed NDA document.
    Only PDF files allowed.
    """
    # Validate email format
    if '@' not in contact_email or '.' not in contact_email:
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

    # Generate unique filename
    unique_filename = f"{uuid_module.uuid4()}{file_ext}"
    file_path = os.path.join(NDA_UPLOAD_DIR, unique_filename)

    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    # Create contact request with NDA
    contact = ContactRequest(
        entity_name=entity_name,
        contact_email=contact_email.lower(),
        contact_name=contact_name,
        position=position,
        request_type="nda",
        nda_file_path=file_path,
        nda_file_name=file.filename,
        status=ContactStatus.NEW
    )

    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    # Send confirmation email
    try:
        await email_service.send_contact_followup(
            contact_email,
            entity_name
        )
    except Exception:
        pass  # Don't fail if email fails

    return contact


@router.get("/status/{email}", response_model=ContactRequestResponse)
async def check_contact_status(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check the status of a contact request by email.
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
            detail="No contact request found for this email"
        )

    return contact
