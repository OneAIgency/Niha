from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...models.models import ContactRequest, ContactStatus
from ...schemas.schemas import ContactRequestCreate, ContactRequestResponse, MessageResponse
from ...services.email_service import email_service

router = APIRouter(prefix="/contact", tags=["Contact"])


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
        position=request.position,
        reference=request.reference,
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
