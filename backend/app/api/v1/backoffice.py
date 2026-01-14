from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
import asyncio
import json

# Constants for deposit validation
MAX_DEPOSIT_AMOUNT = Decimal('100000000')  # 100 million max per deposit

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import (
    User, Entity, KYCDocument, UserSession, Trade, UserRole,
    DocumentStatus, KYCStatus, Deposit, DepositStatus, Currency,
    EntityHolding, AssetTransaction, AssetType, TransactionType
)
from ...schemas.schemas import (
    MessageResponse,
    KYCDocumentResponse,
    KYCDocumentReview,
    UserSessionResponse,
    UserApprovalRequest,
    DepositCreate,
    DepositConfirm,
    DepositResponse,
    DepositWithEntityResponse,
    EntityBalanceResponse,
    Currency as SchemaCurrency,
    AddAssetRequest,
    EntityAssetsResponse,
    AssetTransactionResponse,
    AssetTypeEnum
)
from ...services.email_service import email_service

router = APIRouter(prefix="/backoffice", tags=["Backoffice"])


# ============== WebSocket Connection Manager ==============

class BackofficeConnectionManager:
    """Manage WebSocket connections for backoffice realtime updates"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, data: dict):
        """Broadcast an event to all connected clients"""
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


# Global connection manager instance
backoffice_ws_manager = BackofficeConnectionManager()


@router.websocket("/ws")
async def backoffice_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time backoffice updates.
    Sends heartbeat every 30 seconds to keep connection alive.
    Events are pushed when contact requests or other backoffice data changes.
    """
    await backoffice_ws_manager.connect(websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to backoffice realtime updates",
            "timestamp": datetime.utcnow().isoformat()
        })

        # Keep connection alive with heartbeat
        while True:
            await asyncio.sleep(30)
            try:
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception:
                break

    except WebSocketDisconnect:
        backoffice_ws_manager.disconnect(websocket)
    except Exception:
        backoffice_ws_manager.disconnect(websocket)


@router.get("/pending-users")
async def get_pending_users(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get users awaiting approval (pending status with submitted KYC).
    Admin only.
    """
    # Get pending users who have submitted KYC
    query = (
        select(User)
        .where(User.role == UserRole.PENDING)
        .where(User.is_active == True)
        .order_by(User.created_at.desc())
    )

    result = await db.execute(query)
    users = result.scalars().all()

    pending_list = []
    for user in users:
        # Count documents
        doc_count_query = select(func.count()).select_from(KYCDocument).where(
            KYCDocument.user_id == user.id
        )
        doc_result = await db.execute(doc_count_query)
        doc_count = doc_result.scalar()

        # Get entity name if exists
        entity_name = None
        if user.entity_id:
            entity_result = await db.execute(
                select(Entity).where(Entity.id == user.entity_id)
            )
            entity = entity_result.scalar_one_or_none()
            if entity:
                entity_name = entity.name

        pending_list.append({
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "entity_name": entity_name,
            "documents_count": doc_count,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })

    return pending_list


@router.put("/users/{user_id}/approve", response_model=MessageResponse)
async def approve_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a pending user. Changes role from PENDING to APPROVED.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != UserRole.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"User is not pending approval (current role: {user.role.value})"
        )

    # Update user role
    user.role = UserRole.APPROVED

    # Update entity KYC status if exists
    if user.entity_id:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity.kyc_status = KYCStatus.APPROVED
            entity.kyc_approved_at = datetime.utcnow()
            entity.kyc_approved_by = admin_user.id
            entity.verified = True

    await db.commit()

    # Send approval email
    try:
        await email_service.send_account_approved(user.email, user.first_name)
    except Exception:
        pass  # Don't fail if email fails

    return MessageResponse(message=f"User {user.email} has been approved")


@router.put("/users/{user_id}/reject", response_model=MessageResponse)
async def reject_user(
    user_id: str,
    rejection: UserApprovalRequest,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a pending user.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update entity KYC status if exists
    if user.entity_id:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == user.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity.kyc_status = KYCStatus.REJECTED

    # Deactivate user account
    user.is_active = False

    await db.commit()

    return MessageResponse(message=f"User {user.email} has been rejected")


@router.put("/users/{user_id}/fund", response_model=MessageResponse)
async def fund_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a user as funded. Changes role from APPROVED to FUNDED.
    Admin only.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role not in [UserRole.APPROVED, UserRole.PENDING]:
        raise HTTPException(
            status_code=400,
            detail=f"User cannot be funded (current role: {user.role.value})"
        )

    user.role = UserRole.FUNDED
    await db.commit()

    # Send funding confirmation email
    try:
        await email_service.send_account_funded(user.email, user.first_name)
    except Exception:
        pass

    return MessageResponse(message=f"User {user.email} has been marked as funded")


@router.get("/kyc-documents")
async def get_all_kyc_documents(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all KYC documents, optionally filtered by user or status.
    Admin only.
    """
    query = select(KYCDocument).order_by(KYCDocument.created_at.desc())

    if user_id:
        query = query.where(KYCDocument.user_id == UUID(user_id))

    if status:
        try:
            doc_status = DocumentStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Valid values: {[s.value for s in DocumentStatus]}"
            )
        query = query.where(KYCDocument.status == doc_status)

    result = await db.execute(query)
    documents = result.scalars().all()

    docs_with_user = []
    for doc in documents:
        # Get user info
        user_result = await db.execute(
            select(User).where(User.id == doc.user_id)
        )
        user = user_result.scalar_one_or_none()

        docs_with_user.append({
            "id": str(doc.id),
            "user_id": str(doc.user_id),
            "user_email": user.email if user else None,
            "user_name": f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None,
            "entity_id": str(doc.entity_id) if doc.entity_id else None,
            "document_type": doc.document_type.value,
            "file_name": doc.file_name,
            "mime_type": doc.mime_type,
            "status": doc.status.value,
            "reviewed_at": doc.reviewed_at.isoformat() if doc.reviewed_at else None,
            "notes": doc.notes,
            "created_at": doc.created_at.isoformat()
        })

    return docs_with_user


@router.put("/kyc-documents/{document_id}/review", response_model=MessageResponse)
async def review_kyc_document(
    document_id: str,
    review: KYCDocumentReview,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Review (approve/reject) a KYC document.
    Admin only.
    """
    result = await db.execute(
        select(KYCDocument).where(KYCDocument.id == UUID(document_id))
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.status = review.status
    document.reviewed_at = datetime.utcnow()
    document.reviewed_by = admin_user.id
    if review.notes:
        document.notes = review.notes

    await db.commit()

    # Broadcast KYC document review event
    await backoffice_ws_manager.broadcast("kyc_document_reviewed", {
        "document_id": str(document.id),
        "user_id": str(document.user_id),
        "document_type": document.document_type.value,
        "status": document.status.value,
        "notes": document.notes,
        "reviewed_at": document.reviewed_at.isoformat() if document.reviewed_at else None
    })

    return MessageResponse(
        message=f"Document has been {review.status.value}"
    )


@router.get("/kyc-documents/{document_id}/content")
async def get_document_content(
    document_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get KYC document content for preview/download.
    Returns file with appropriate Content-Type for inline viewing.
    Admin only.
    """
    result = await db.execute(
        select(KYCDocument).where(KYCDocument.id == UUID(document_id))
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")

    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type or 'application/octet-stream',
        headers={
            "Content-Disposition": f'inline; filename="{document.file_name}"'
        }
    )


@router.get("/users/{user_id}/sessions")
async def get_user_sessions(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a user's session history.
    Admin only.
    """
    query = (
        select(UserSession)
        .where(UserSession.user_id == UUID(user_id))
        .order_by(UserSession.started_at.desc())
        .limit(100)
    )

    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "duration_seconds": s.duration_seconds,
            "is_active": s.is_active
        }
        for s in sessions
    ]


@router.get("/users/{user_id}/trades")
async def get_user_trades(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a user's trading history.
    Admin only.
    """
    # Get user's entity
    user_result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = user_result.scalar_one_or_none()

    if not user or not user.entity_id:
        return []

    # Get trades where user's entity is buyer or seller
    query = (
        select(Trade)
        .where(
            (Trade.buyer_entity_id == user.entity_id) |
            (Trade.seller_entity_id == user.entity_id)
        )
        .order_by(Trade.created_at.desc())
        .limit(100)
    )

    result = await db.execute(query)
    trades = result.scalars().all()

    return [
        {
            "id": str(t.id),
            "trade_type": t.trade_type.value,
            "certificate_type": t.certificate_type.value,
            "quantity": float(t.quantity),
            "price_per_unit": float(t.price_per_unit),
            "total_value": float(t.total_value),
            "status": t.status.value,
            "is_buyer": str(t.buyer_entity_id) == str(user.entity_id),
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None
        }
        for t in trades
    ]


# ============== DEPOSIT MANAGEMENT ==============

@router.get("/deposits")
async def get_all_deposits(
    status: Optional[str] = None,
    entity_id: Optional[str] = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all deposits, optionally filtered by status or entity.
    Admin only.
    """
    query = select(Deposit).order_by(Deposit.created_at.desc())

    if status:
        try:
            dep_status = DepositStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Valid values: {[s.value for s in DepositStatus]}"
            )
        query = query.where(Deposit.status == dep_status)

    if entity_id:
        query = query.where(Deposit.entity_id == UUID(entity_id))

    result = await db.execute(query)
    deposits = result.scalars().all()

    deposits_with_entity = []
    for dep in deposits:
        # Get entity info
        entity_result = await db.execute(
            select(Entity).where(Entity.id == dep.entity_id)
        )
        entity = entity_result.scalar_one_or_none()

        # Get primary user email for entity
        user_email = None
        if entity:
            user_result = await db.execute(
                select(User).where(User.entity_id == entity.id).limit(1)
            )
            user = user_result.scalar_one_or_none()
            user_email = user.email if user else None

        deposits_with_entity.append({
            "id": str(dep.id),
            "entity_id": str(dep.entity_id),
            "entity_name": entity.name if entity else None,
            "user_email": user_email,
            "reported_amount": float(dep.reported_amount) if dep.reported_amount else None,
            "reported_currency": dep.reported_currency.value if dep.reported_currency else None,
            "amount": float(dep.amount) if dep.amount else None,
            "currency": dep.currency.value if dep.currency else None,
            "wire_reference": dep.wire_reference,
            "bank_reference": dep.bank_reference,
            "status": dep.status.value,
            "reported_at": (dep.reported_at.isoformat() + "Z") if dep.reported_at else None,
            "confirmed_at": (dep.confirmed_at.isoformat() + "Z") if dep.confirmed_at else None,
            "confirmed_by": str(dep.confirmed_by) if dep.confirmed_by else None,
            "notes": dep.notes,
            "created_at": dep.created_at.isoformat() + "Z"
        })

    return deposits_with_entity


@router.post("/deposits", response_model=MessageResponse)
async def create_deposit(
    deposit_data: DepositCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create and confirm a deposit for an entity.
    This is used when backoffice receives a wire transfer.
    Admin only.
    """
    # Validate deposit amount
    deposit_amount = Decimal(str(deposit_data.amount))
    if deposit_amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    if deposit_amount > MAX_DEPOSIT_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Deposit amount exceeds maximum allowed ({MAX_DEPOSIT_AMOUNT:,.2f})"
        )

    # Verify entity exists with row lock to prevent race conditions
    entity_result = await db.execute(
        select(Entity)
        .where(Entity.id == deposit_data.entity_id)
        .with_for_update()
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Validate currency - cannot mix currencies in the same entity balance
    deposit_currency = Currency(deposit_data.currency.value)
    if entity.balance_currency and entity.balance_currency != deposit_currency:
        if entity.balance_amount and entity.balance_amount > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Currency mismatch: entity has existing balance in {entity.balance_currency.value}, "
                       f"cannot add {deposit_currency.value}. Please use the same currency or zero the balance first."
            )

    # Generate bank reference using cryptographically secure random
    import secrets
    import string
    bank_ref = f"DEP-{''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))}"

    # Create deposit record
    deposit = Deposit(
        entity_id=deposit_data.entity_id,
        amount=deposit_amount,
        currency=deposit_currency,
        wire_reference=deposit_data.wire_reference,
        bank_reference=bank_ref,
        status=DepositStatus.CONFIRMED,
        confirmed_at=datetime.utcnow(),
        confirmed_by=admin_user.id,
        notes=deposit_data.notes
    )
    db.add(deposit)

    # Update entity balance atomically using the locked row
    entity.balance_amount = (entity.balance_amount or Decimal('0')) + deposit_amount
    entity.balance_currency = deposit_currency
    entity.total_deposited = (entity.total_deposited or Decimal('0')) + deposit_amount

    # Find users for this entity and upgrade to FUNDED if APPROVED
    users_result = await db.execute(
        select(User).where(User.entity_id == entity.id)
    )
    users = users_result.scalars().all()

    for user in users:
        if user.role == UserRole.APPROVED:
            user.role = UserRole.FUNDED

    await db.commit()

    # Send notification email to entity users
    for user in users:
        try:
            await email_service.send_account_funded(user.email, user.first_name)
        except Exception:
            pass

    return MessageResponse(
        message=f"Deposit of {deposit_data.amount} {deposit_data.currency.value} confirmed for {entity.name}. Users upgraded to FUNDED."
    )


@router.get("/deposits/{deposit_id}")
async def get_deposit(
    deposit_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific deposit's details.
    Admin only.
    """
    result = await db.execute(
        select(Deposit).where(Deposit.id == UUID(deposit_id))
    )
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    # Get entity info
    entity_result = await db.execute(
        select(Entity).where(Entity.id == deposit.entity_id)
    )
    entity = entity_result.scalar_one_or_none()

    return {
        "id": str(deposit.id),
        "entity_id": str(deposit.entity_id),
        "entity_name": entity.name if entity else None,
        "reported_amount": float(deposit.reported_amount) if deposit.reported_amount else None,
        "reported_currency": deposit.reported_currency.value if deposit.reported_currency else None,
        "amount": float(deposit.amount) if deposit.amount else None,
        "currency": deposit.currency.value if deposit.currency else None,
        "wire_reference": deposit.wire_reference,
        "bank_reference": deposit.bank_reference,
        "status": deposit.status.value,
        "reported_at": (deposit.reported_at.isoformat() + "Z") if deposit.reported_at else None,
        "confirmed_at": (deposit.confirmed_at.isoformat() + "Z") if deposit.confirmed_at else None,
        "confirmed_by": str(deposit.confirmed_by) if deposit.confirmed_by else None,
        "notes": deposit.notes,
        "created_at": deposit.created_at.isoformat() + "Z"
    }


@router.put("/deposits/{deposit_id}/confirm", response_model=MessageResponse)
async def confirm_pending_deposit(
    deposit_id: str,
    confirmation: DepositConfirm,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm a pending deposit with actual received amount.
    Updates entity balance and upgrades users to FUNDED status.
    Admin only.
    """
    # Get deposit with row lock
    result = await db.execute(
        select(Deposit)
        .where(Deposit.id == UUID(deposit_id))
        .with_for_update()
    )
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    if deposit.status != DepositStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Deposit is not pending (current status: {deposit.status.value})"
        )

    # Get entity with row lock
    entity_result = await db.execute(
        select(Entity)
        .where(Entity.id == deposit.entity_id)
        .with_for_update()
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Validate and set confirmed amount
    confirmed_amount = Decimal(str(confirmation.amount))
    if confirmed_amount <= 0:
        raise HTTPException(status_code=400, detail="Confirmed amount must be positive")
    if confirmed_amount > MAX_DEPOSIT_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Amount exceeds maximum allowed ({MAX_DEPOSIT_AMOUNT:,.2f})"
        )

    confirmed_currency = Currency(confirmation.currency.value)

    # Update deposit with confirmed values
    deposit.amount = confirmed_amount
    deposit.currency = confirmed_currency
    deposit.status = DepositStatus.CONFIRMED
    deposit.confirmed_at = datetime.utcnow()
    deposit.confirmed_by = admin_user.id
    if confirmation.notes:
        deposit.notes = confirmation.notes

    # Update entity balance
    entity.balance_amount = (entity.balance_amount or Decimal('0')) + confirmed_amount
    entity.balance_currency = confirmed_currency
    entity.total_deposited = (entity.total_deposited or Decimal('0')) + confirmed_amount

    # Upgrade users from APPROVED to FUNDED
    users_result = await db.execute(
        select(User).where(User.entity_id == entity.id)
    )
    users = users_result.scalars().all()

    upgraded_count = 0
    for user in users:
        if user.role == UserRole.APPROVED:
            user.role = UserRole.FUNDED
            upgraded_count += 1

    await db.commit()

    # Send notification emails
    for user in users:
        try:
            await email_service.send_account_funded(user.email, user.first_name)
        except Exception:
            pass

    # Broadcast WebSocket event
    await backoffice_ws_manager.broadcast("deposit_confirmed", {
        "deposit_id": str(deposit.id),
        "entity_id": str(entity.id),
        "entity_name": entity.name,
        "amount": float(confirmed_amount),
        "currency": confirmed_currency.value
    })

    return MessageResponse(
        message=f"Deposit confirmed: {confirmed_amount} {confirmed_currency.value} for {entity.name}. {upgraded_count} user(s) upgraded to FUNDED."
    )


@router.put("/deposits/{deposit_id}/reject", response_model=MessageResponse)
async def reject_pending_deposit(
    deposit_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a pending deposit.
    Admin only.
    """
    result = await db.execute(
        select(Deposit).where(Deposit.id == UUID(deposit_id))
    )
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    if deposit.status != DepositStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Deposit is not pending (current status: {deposit.status.value})"
        )

    deposit.status = DepositStatus.REJECTED
    await db.commit()

    return MessageResponse(message="Deposit rejected")


@router.get("/entities/{entity_id}/balance")
async def get_entity_balance(
    entity_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get an entity's balance and deposit history.
    Admin only.
    """
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Count deposits
    deposit_count_result = await db.execute(
        select(func.count()).select_from(Deposit).where(
            Deposit.entity_id == entity.id,
            Deposit.status == DepositStatus.CONFIRMED
        )
    )
    deposit_count = deposit_count_result.scalar()

    return {
        "entity_id": str(entity.id),
        "entity_name": entity.name,
        "balance_amount": float(entity.balance_amount or 0),
        "balance_currency": entity.balance_currency.value if entity.balance_currency else None,
        "total_deposited": float(entity.total_deposited or 0),
        "deposit_count": deposit_count
    }


@router.get("/users/{user_id}/deposits")
async def get_user_deposits(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all deposits for a user's entity.
    Admin only.
    """
    # Get user's entity
    user_result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = user_result.scalar_one_or_none()

    if not user or not user.entity_id:
        return []

    # Get deposits for entity
    query = (
        select(Deposit)
        .where(Deposit.entity_id == user.entity_id)
        .order_by(Deposit.created_at.desc())
    )

    result = await db.execute(query)
    deposits = result.scalars().all()

    return [
        {
            "id": str(d.id),
            "entity_id": str(d.entity_id),
            "amount": float(d.amount),
            "currency": d.currency.value,
            "wire_reference": d.wire_reference,
            "bank_reference": d.bank_reference,
            "status": d.status.value,
            "confirmed_at": d.confirmed_at.isoformat() if d.confirmed_at else None,
            "created_at": d.created_at.isoformat()
        }
        for d in deposits
    ]


# ============== Asset Management Endpoints ==============

@router.post("/entities/{entity_id}/add-asset", response_model=MessageResponse)
async def add_asset_to_entity(
    entity_id: str,
    asset_request: AddAssetRequest,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add EUR, CEA, or EUA to an entity's account.
    Creates audit trail and updates holdings.
    Admin only.
    """
    # Validate entity exists
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Map schema enum to model enum
    asset_type_map = {
        AssetTypeEnum.EUR: AssetType.EUR,
        AssetTypeEnum.CEA: AssetType.CEA,
        AssetTypeEnum.EUA: AssetType.EUA,
    }
    model_asset_type = asset_type_map[asset_request.asset_type]

    # Get or create EntityHolding record
    holding_result = await db.execute(
        select(EntityHolding).where(
            EntityHolding.entity_id == UUID(entity_id),
            EntityHolding.asset_type == model_asset_type
        )
    )
    holding = holding_result.scalar_one_or_none()

    if not holding:
        holding = EntityHolding(
            entity_id=UUID(entity_id),
            asset_type=model_asset_type,
            quantity=Decimal('0')
        )
        db.add(holding)
        await db.flush()  # Get the holding ID

    # Calculate new balance
    balance_before = Decimal(str(holding.quantity))
    amount_to_add = Decimal(str(asset_request.amount))
    balance_after = balance_before + amount_to_add

    # Update holding
    holding.quantity = balance_after
    holding.updated_at = datetime.utcnow()

    # Create audit transaction
    transaction = AssetTransaction(
        entity_id=UUID(entity_id),
        asset_type=model_asset_type,
        transaction_type=TransactionType.DEPOSIT,
        amount=amount_to_add,
        balance_before=balance_before,
        balance_after=balance_after,
        reference=asset_request.reference,
        notes=asset_request.notes,
        created_by=admin_user.id
    )
    db.add(transaction)

    # If adding EUR, also update Entity.balance_amount for compatibility
    if model_asset_type == AssetType.EUR:
        entity.balance_amount = balance_after
        entity.balance_currency = Currency.EUR
        entity.total_deposited = (entity.total_deposited or Decimal('0')) + amount_to_add

    # Upgrade user(s) to FUNDED if they have any balance now
    if balance_after > 0:
        users_result = await db.execute(
            select(User).where(
                User.entity_id == UUID(entity_id),
                User.role.in_([UserRole.APPROVED, UserRole.PENDING])
            )
        )
        users = users_result.scalars().all()
        for user in users:
            if user.role in [UserRole.APPROVED, UserRole.PENDING]:
                user.role = UserRole.FUNDED

    await db.commit()

    asset_label = {
        AssetType.EUR: "EUR",
        AssetType.CEA: "CEA certificates",
        AssetType.EUA: "EUA certificates"
    }[model_asset_type]

    return MessageResponse(
        message=f"Successfully added {asset_request.amount:,.2f} {asset_label} to {entity.name}"
    )


@router.get("/entities/{entity_id}/assets", response_model=EntityAssetsResponse)
async def get_entity_assets(
    entity_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all asset balances for an entity (EUR, CEA, EUA).
    Admin only.
    """
    # Validate entity exists
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Get all holdings
    holdings_result = await db.execute(
        select(EntityHolding).where(EntityHolding.entity_id == UUID(entity_id))
    )
    holdings = holdings_result.scalars().all()

    # Build balance map
    balances = {
        AssetType.EUR: Decimal('0'),
        AssetType.CEA: Decimal('0'),
        AssetType.EUA: Decimal('0'),
    }
    for h in holdings:
        balances[h.asset_type] = h.quantity

    # If EUR holding doesn't exist but entity has balance_amount, use that
    if balances[AssetType.EUR] == 0 and entity.balance_amount:
        balances[AssetType.EUR] = entity.balance_amount

    # Get recent transactions
    transactions_result = await db.execute(
        select(AssetTransaction)
        .where(AssetTransaction.entity_id == UUID(entity_id))
        .order_by(AssetTransaction.created_at.desc())
        .limit(20)
    )
    transactions = transactions_result.scalars().all()

    return EntityAssetsResponse(
        entity_id=UUID(entity_id),
        entity_name=entity.name,
        eur_balance=float(balances[AssetType.EUR]),
        cea_balance=float(balances[AssetType.CEA]),
        eua_balance=float(balances[AssetType.EUA]),
        recent_transactions=[
            AssetTransactionResponse(
                id=t.id,
                entity_id=t.entity_id,
                asset_type=t.asset_type.value,
                transaction_type=t.transaction_type.value,
                amount=float(t.amount),
                balance_before=float(t.balance_before),
                balance_after=float(t.balance_after),
                reference=t.reference,
                notes=t.notes,
                created_by=t.created_by,
                created_at=t.created_at
            )
            for t in transactions
        ]
    )


@router.get("/entities/{entity_id}/transactions")
async def get_entity_transactions(
    entity_id: str,
    asset_type: Optional[AssetTypeEnum] = None,
    limit: int = Query(50, le=100),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get transaction history for an entity.
    Admin only.
    """
    # Validate entity exists
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Build query
    query = select(AssetTransaction).where(AssetTransaction.entity_id == UUID(entity_id))

    if asset_type:
        asset_type_map = {
            AssetTypeEnum.EUR: AssetType.EUR,
            AssetTypeEnum.CEA: AssetType.CEA,
            AssetTypeEnum.EUA: AssetType.EUA,
        }
        query = query.where(AssetTransaction.asset_type == asset_type_map[asset_type])

    query = query.order_by(AssetTransaction.created_at.desc()).limit(limit)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return [
        {
            "id": str(t.id),
            "entity_id": str(t.entity_id),
            "asset_type": t.asset_type.value,
            "transaction_type": t.transaction_type.value,
            "amount": float(t.amount),
            "balance_before": float(t.balance_before),
            "balance_after": float(t.balance_after),
            "reference": t.reference,
            "notes": t.notes,
            "created_by": str(t.created_by),
            "created_at": t.created_at.isoformat()
        }
        for t in transactions
    ]


# =============================================================================
# Asset Balance Update (Admin Edit Assets)
# =============================================================================

class UpdateAssetRequest(BaseModel):
    """Request to update an entity's asset balance"""
    new_balance: float = Field(..., ge=0, description="New balance value (must be >= 0)")
    notes: Optional[str] = Field(None, max_length=500, description="Admin notes for audit")
    reference: Optional[str] = Field(None, max_length=100, description="Reference for tracking")


@router.put("/entities/{entity_id}/assets/{asset_type}")
async def update_asset_balance(
    entity_id: str,
    asset_type: AssetTypeEnum,
    request: UpdateAssetRequest,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an entity's asset balance to a specific value.
    Creates an audit trail transaction.
    Admin only.
    """
    # Validate entity exists
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Map schema enum to model enum
    asset_type_map = {
        AssetTypeEnum.EUR: AssetType.EUR,
        AssetTypeEnum.CEA: AssetType.CEA,
        AssetTypeEnum.EUA: AssetType.EUA,
    }
    model_asset_type = asset_type_map[asset_type]

    # Get or create holding
    holding_result = await db.execute(
        select(EntityHolding).where(
            EntityHolding.entity_id == UUID(entity_id),
            EntityHolding.asset_type == model_asset_type
        )
    )
    holding = holding_result.scalar_one_or_none()

    balance_before = Decimal('0')
    if holding:
        balance_before = holding.quantity
    else:
        # Create new holding
        holding = EntityHolding(
            entity_id=UUID(entity_id),
            asset_type=model_asset_type,
            quantity=Decimal('0')
        )
        db.add(holding)

    new_balance = Decimal(str(request.new_balance))
    delta = new_balance - balance_before

    # Update the holding
    holding.quantity = new_balance
    holding.updated_at = datetime.utcnow()

    # Create audit transaction
    transaction = AssetTransaction(
        entity_id=UUID(entity_id),
        asset_type=model_asset_type,
        transaction_type=TransactionType.ADJUSTMENT,
        amount=abs(delta),
        balance_before=balance_before,
        balance_after=new_balance,
        reference=request.reference,
        notes=request.notes or f"Admin adjustment by {admin_user.email}",
        created_by=admin_user.id
    )
    db.add(transaction)

    # If EUR, also update Entity.balance_amount for backward compatibility
    if model_asset_type == AssetType.EUR:
        entity.balance_amount = new_balance

    await db.commit()

    asset_labels = {'EUR': 'EUR', 'CEA': 'CEA', 'EUA': 'EUA'}
    asset_label = asset_labels.get(asset_type.value, asset_type.value)
    direction = "increased" if delta > 0 else "decreased" if delta < 0 else "unchanged"

    return MessageResponse(
        message=f"Successfully updated {entity.name}'s {asset_label} balance from {float(balance_before):,.2f} to {float(new_balance):,.2f} ({direction} by {abs(float(delta)):,.2f})"
    )


# =============================================================================
# Entity Orders Management (Admin)
# =============================================================================

@router.get("/entities/{entity_id}/orders")
async def get_entity_orders(
    entity_id: str,
    status: Optional[str] = Query(None, description="Filter by status: OPEN, PARTIALLY_FILLED, FILLED, CANCELLED"),
    certificate_type: Optional[str] = Query(None, description="Filter by certificate type: EUA, CEA"),
    limit: int = Query(50, le=200),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all orders for an entity.
    Admin only.
    """
    from ...models.models import Order, OrderStatus as ModelOrderStatus, CertificateType as ModelCertificateType

    # Validate entity exists
    entity_result = await db.execute(
        select(Entity).where(Entity.id == UUID(entity_id))
    )
    entity = entity_result.scalar_one_or_none()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Build query
    query = select(Order).where(Order.entity_id == UUID(entity_id))

    if status:
        try:
            status_enum = ModelOrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if certificate_type:
        try:
            cert_type_enum = ModelCertificateType(certificate_type)
            query = query.where(Order.certificate_type == cert_type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid certificate_type: {certificate_type}")

    query = query.order_by(Order.created_at.desc()).limit(limit)

    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        {
            "id": str(o.id),
            "entity_id": str(o.entity_id) if o.entity_id else None,
            "certificate_type": o.certificate_type.value,
            "side": o.side.value,
            "price": float(o.price),
            "quantity": float(o.quantity),
            "filled_quantity": float(o.filled_quantity),
            "remaining_quantity": float(o.quantity - o.filled_quantity),
            "status": o.status.value,
            "created_at": o.created_at.isoformat(),
            "updated_at": o.updated_at.isoformat() if o.updated_at else None,
        }
        for o in orders
    ]


@router.delete("/orders/{order_id}")
async def admin_cancel_order(
    order_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel any order (admin only).
    Only OPEN or PARTIALLY_FILLED orders can be cancelled.
    """
    from ...models.models import Order, OrderStatus as ModelOrderStatus

    # Get the order
    result = await db.execute(
        select(Order).where(Order.id == UUID(order_id))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order can be cancelled
    if order.status not in [ModelOrderStatus.OPEN, ModelOrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status {order.status.value}"
        )

    # Cancel the order
    order.status = ModelOrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()

    await db.commit()

    return MessageResponse(
        message=f"Order {order_id} cancelled successfully"
    )


@router.put("/orders/{order_id}")
async def admin_update_order(
    order_id: str,
    update: dict,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an order's price or quantity (admin only).
    Only OPEN orders can be updated.
    Quantity can only be reduced, not increased.
    """
    from ...models.models import Order, OrderStatus as ModelOrderStatus

    # Get the order
    result = await db.execute(
        select(Order).where(Order.id == UUID(order_id))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order can be updated
    if order.status != ModelOrderStatus.OPEN:
        raise HTTPException(
            status_code=400,
            detail=f"Can only update OPEN orders. Current status: {order.status.value}"
        )

    # Update price if provided
    if 'price' in update and update['price'] is not None:
        new_price = float(update['price'])
        if new_price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")
        order.price = Decimal(str(new_price))

    # Update quantity if provided
    if 'quantity' in update and update['quantity'] is not None:
        new_quantity = float(update['quantity'])
        if new_quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        if new_quantity < float(order.filled_quantity):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce quantity below filled amount ({float(order.filled_quantity)})"
            )
        order.quantity = Decimal(str(new_quantity))

    order.updated_at = datetime.utcnow()

    await db.commit()

    return {
        "id": str(order.id),
        "entity_id": str(order.entity_id) if order.entity_id else None,
        "certificate_type": order.certificate_type.value,
        "side": order.side.value,
        "price": float(order.price),
        "quantity": float(order.quantity),
        "filled_quantity": float(order.filled_quantity),
        "remaining_quantity": float(order.quantity - order.filled_quantity),
        "status": order.status.value,
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "message": "Order updated successfully"
    }
