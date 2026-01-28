import os
import uuid
from datetime import datetime

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import (
    DocumentStatus,
    DocumentType,
    Entity,
    KYCDocument,
    User,
)
from ...schemas.schemas import (
    KYCDocumentResponse,
    MessageResponse,
    OnboardingStatusResponse,
)
from .backoffice import backoffice_ws_manager

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

# Required document types for complete KYC
# GHG_PERMIT is optional (only for EU ETS installation operators)
REQUIRED_DOCUMENTS = [
    # Company Documents
    DocumentType.REGISTRATION,
    DocumentType.TAX_CERTIFICATE,
    DocumentType.ARTICLES,
    DocumentType.FINANCIAL_STATEMENTS,
    # Representative Documents
    DocumentType.ID,
    DocumentType.PROOF_AUTHORITY,
    DocumentType.CONTACT_INFO,
]

# Allowed file types and max size
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_upload_path():
    """Get or create upload directory"""
    upload_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "uploads", "kyc"
    )
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get current user's onboarding/KYC status.
    """
    # Get user's documents
    query = select(KYCDocument).where(KYCDocument.user_id == current_user.id)
    result = await db.execute(query)
    documents = result.scalars().all()

    # Check which required documents are uploaded and approved
    uploaded_types = {doc.document_type for doc in documents}
    approved_types = {
        doc.document_type for doc in documents if doc.status == DocumentStatus.APPROVED
    }
    rejected_docs = [doc for doc in documents if doc.status == DocumentStatus.REJECTED]

    documents_uploaded = len(uploaded_types)
    documents_required = len(REQUIRED_DOCUMENTS)

    # Determine status
    if rejected_docs:
        status = "rejected"
    elif uploaded_types >= set(REQUIRED_DOCUMENTS):
        # All docs uploaded
        if approved_types >= set(REQUIRED_DOCUMENTS):
            status = "approved"
        else:
            status = "submitted"
    else:
        status = "pending"

    # Can submit if all required docs are uploaded and none are rejected
    can_submit = uploaded_types >= set(REQUIRED_DOCUMENTS) and not rejected_docs

    return OnboardingStatusResponse(
        documents_uploaded=documents_uploaded,
        documents_required=documents_required,
        documents=[KYCDocumentResponse.model_validate(doc) for doc in documents],
        can_submit=can_submit,
        status=status,
    )


@router.post("/documents", response_model=KYCDocumentResponse)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a KYC document.
    """
    # Validate document type
    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {[d.value for d in DocumentType]}",
        )

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Check if document of this type already exists
    existing_query = select(KYCDocument).where(
        KYCDocument.user_id == current_user.id, KYCDocument.document_type == doc_type
    )
    existing_result = await db.execute(existing_query)
    existing_doc = existing_result.scalar_one_or_none()

    # If exists and not rejected, don't allow replacement
    if existing_doc and existing_doc.status != DocumentStatus.REJECTED:
        raise HTTPException(
            status_code=400,
            detail=f"Document of type {doc_type.value} already uploaded. Delete it first to upload a new one.",
        )

    # Generate unique filename
    unique_filename = f"{current_user.id}_{doc_type.value}_{uuid.uuid4().hex}{file_ext}"
    upload_path = get_upload_path()
    file_path = os.path.join(upload_path, unique_filename)

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Delete existing rejected document if exists
    if existing_doc:
        # Delete old file
        if os.path.exists(existing_doc.file_path):
            os.remove(existing_doc.file_path)
        await db.delete(existing_doc)

    # Create document record
    document = KYCDocument(
        user_id=current_user.id,
        entity_id=current_user.entity_id,
        document_type=doc_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        status=DocumentStatus.PENDING,
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Broadcast KYC document upload event to backoffice
    await backoffice_ws_manager.broadcast(
        "kyc_document_uploaded",
        {
            "document_id": str(document.id),
            "user_id": str(document.user_id),
            "user_email": current_user.email,
            "document_type": document.document_type.value,
            "file_name": document.file_name,
            "status": document.status.value,
            "created_at": document.created_at.isoformat()
            if document.created_at
            else None,
        },
    )

    return KYCDocumentResponse.model_validate(document)


@router.get("/documents")
async def get_my_documents(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get current user's uploaded KYC documents.
    """
    query = (
        select(KYCDocument)
        .where(KYCDocument.user_id == current_user.id)
        .order_by(KYCDocument.created_at.desc())
    )

    result = await db.execute(query)
    documents = result.scalars().all()

    return [KYCDocumentResponse.model_validate(doc) for doc in documents]


@router.delete("/documents/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a KYC document. Only allowed for pending or rejected documents.
    """
    result = await db.execute(
        select(KYCDocument).where(
            KYCDocument.id == uuid.UUID(document_id),
            KYCDocument.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status == DocumentStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Cannot delete approved documents")

    # Store document info before deletion for broadcasting
    doc_info = {
        "document_id": str(document.id),
        "user_id": str(document.user_id),
        "document_type": document.document_type.value,
    }

    # Delete file from filesystem
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    await db.delete(document)
    await db.commit()

    # Broadcast KYC document deletion event to backoffice
    await backoffice_ws_manager.broadcast("kyc_document_deleted", doc_info)

    return MessageResponse(message="Document deleted successfully")


@router.post("/submit", response_model=MessageResponse)
async def submit_for_review(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Submit KYC documents for review.
    All required documents must be uploaded.
    """
    # Get user's documents
    query = select(KYCDocument).where(KYCDocument.user_id == current_user.id)
    result = await db.execute(query)
    documents = result.scalars().all()

    uploaded_types = {doc.document_type for doc in documents}
    rejected_docs = [doc for doc in documents if doc.status == DocumentStatus.REJECTED]

    # Check if all required documents are uploaded
    missing_docs = set(REQUIRED_DOCUMENTS) - uploaded_types
    if missing_docs:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required documents: {[d.value for d in missing_docs]}",
        )

    # Check for rejected documents
    if rejected_docs:
        raise HTTPException(
            status_code=400,
            detail="Please re-upload rejected documents before submitting",
        )

    # Update entity KYC submission timestamp if exists
    if current_user.entity_id:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == current_user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity.kyc_submitted_at = datetime.utcnow()

    await db.commit()

    return MessageResponse(
        message="KYC documents submitted for review. You will be notified once reviewed."
    )
