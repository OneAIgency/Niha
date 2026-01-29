"""
Withdrawal Service

Handles all withdrawal operations including:
- Requesting withdrawals (EUR, CEA, EUA)
- Balance validation
- Admin approval workflow
- Completion and rejection
"""

import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    AssetType,
    Entity,
    TransactionType,
    User,
    Withdrawal,
    WithdrawalStatus,
)
from .balance_utils import get_entity_balance, update_entity_balance

logger = logging.getLogger(__name__)


def generate_withdrawal_reference() -> str:
    """Generate unique internal reference for withdrawal"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"WD-{timestamp}-{unique_id}"


async def request_withdrawal(
    db: AsyncSession,
    entity_id: UUID,
    user_id: UUID,
    asset_type: AssetType,
    amount: Decimal,
    destination_bank: Optional[str] = None,
    destination_iban: Optional[str] = None,
    destination_swift: Optional[str] = None,
    destination_account_holder: Optional[str] = None,
    destination_registry: Optional[str] = None,
    destination_account_id: Optional[str] = None,
    client_notes: Optional[str] = None,
) -> dict:
    """
    Create a withdrawal request.

    Validates that:
    - Entity has sufficient balance
    - Required destination info is provided based on asset type

    Returns:
        Dict with withdrawal details or error
    """
    # Validate entity exists
    result = await db.execute(select(Entity).where(Entity.id == entity_id))
    entity = result.scalar_one_or_none()
    if not entity:
        return {"success": False, "error": "Entity not found"}

    # Check balance
    current_balance = await get_entity_balance(db, entity_id, asset_type)
    if current_balance < amount:
        return {
            "success": False,
            "error": (
                f"Insufficient balance. Available: {current_balance} "
                f"{asset_type.value}"
            ),
            "available_balance": str(current_balance),
        }

    # Validate destination based on asset type
    if asset_type == AssetType.EUR:
        if not destination_iban:
            return {"success": False, "error": "IBAN is required for EUR withdrawals"}
    else:
        # CEA or EUA - need registry info
        if not destination_registry or not destination_account_id:
            return {
                "success": False,
                "error": (
                    f"Registry and account ID required for "
                    f"{asset_type.value} transfers"
                ),
            }

    # Generate internal reference
    internal_reference = generate_withdrawal_reference()

    # Create withdrawal record
    withdrawal = Withdrawal(
        entity_id=entity_id,
        user_id=user_id,
        asset_type=asset_type,
        amount=amount,
        status=WithdrawalStatus.PENDING,
        destination_bank=destination_bank,
        destination_iban=destination_iban,
        destination_swift=destination_swift,
        destination_account_holder=destination_account_holder,
        destination_registry=destination_registry,
        destination_account_id=destination_account_id,
        internal_reference=internal_reference,
        client_notes=client_notes,
        requested_at=datetime.utcnow(),
    )
    db.add(withdrawal)

    # Debit balance immediately (reserve funds)
    await update_entity_balance(
        db=db,
        entity_id=entity_id,
        asset_type=asset_type,
        amount=-amount,  # Negative for debit
        transaction_type=TransactionType.WITHDRAWAL,
        created_by=user_id,
        reference=internal_reference,
        notes="Withdrawal request - pending approval",
    )

    await db.flush()

    logger.info(
        f"Withdrawal requested: {internal_reference} - {amount} {asset_type.value} "
        f"for entity {entity_id}"
    )

    return {
        "success": True,
        "withdrawal_id": str(withdrawal.id),
        "internal_reference": internal_reference,
        "amount": str(amount),
        "asset_type": asset_type.value,
        "status": WithdrawalStatus.PENDING.value,
    }


async def get_pending_withdrawals(db: AsyncSession) -> list[dict]:
    """Get all pending withdrawals for admin review"""
    result = await db.execute(
        select(Withdrawal)
        .where(Withdrawal.status == WithdrawalStatus.PENDING)
        .order_by(Withdrawal.requested_at.asc())
    )
    withdrawals = result.scalars().all()

    withdrawal_list = []
    for w in withdrawals:
        # Get entity name
        entity_result = await db.execute(
            select(Entity).where(Entity.id == w.entity_id)
        )
        entity = entity_result.scalar_one_or_none()

        # Get user info
        user_result = await db.execute(select(User).where(User.id == w.user_id))
        user = user_result.scalar_one_or_none()

        withdrawal_list.append(
            {
                "id": str(w.id),
                "entity_id": str(w.entity_id),
                "entity_name": entity.name if entity else "Unknown",
                "user_id": str(w.user_id) if w.user_id else None,
                "user_email": user.email if user else None,
                "asset_type": w.asset_type.value,
                "amount": str(w.amount),
                "status": w.status.value,
                "internal_reference": w.internal_reference,
                "destination_bank": w.destination_bank,
                "destination_iban": w.destination_iban,
                "destination_swift": w.destination_swift,
                "destination_account_holder": w.destination_account_holder,
                "destination_registry": w.destination_registry,
                "destination_account_id": w.destination_account_id,
                "client_notes": w.client_notes,
                "requested_at": w.requested_at.isoformat() if w.requested_at else None,
            }
        )

    return withdrawal_list


async def get_processing_withdrawals(db: AsyncSession) -> list[dict]:
    """Get all withdrawals currently being processed"""
    result = await db.execute(
        select(Withdrawal)
        .where(Withdrawal.status == WithdrawalStatus.PROCESSING)
        .order_by(Withdrawal.processed_at.asc())
    )
    withdrawals = result.scalars().all()

    withdrawal_list = []
    for w in withdrawals:
        entity_result = await db.execute(
            select(Entity).where(Entity.id == w.entity_id)
        )
        entity = entity_result.scalar_one_or_none()

        withdrawal_list.append(
            {
                "id": str(w.id),
                "entity_id": str(w.entity_id),
                "entity_name": entity.name if entity else "Unknown",
                "asset_type": w.asset_type.value,
                "amount": str(w.amount),
                "status": w.status.value,
                "internal_reference": w.internal_reference,
                "destination_iban": w.destination_iban,
                "destination_registry": w.destination_registry,
                "destination_account_id": w.destination_account_id,
                "processed_at": w.processed_at.isoformat() if w.processed_at else None,
                "admin_notes": w.admin_notes,
            }
        )

    return withdrawal_list


async def approve_withdrawal(
    db: AsyncSession,
    withdrawal_id: UUID,
    admin_id: UUID,
    admin_notes: Optional[str] = None,
) -> dict:
    """
    Approve a pending withdrawal and move to processing status.
    """
    result = await db.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id)
    )
    withdrawal = result.scalar_one_or_none()

    if not withdrawal:
        return {"success": False, "error": "Withdrawal not found"}

    if withdrawal.status != WithdrawalStatus.PENDING:
        return {
            "success": False,
            "error": f"Cannot approve withdrawal in {withdrawal.status.value} status",
        }

    # Update status
    withdrawal.status = WithdrawalStatus.PROCESSING
    withdrawal.processed_at = datetime.utcnow()
    withdrawal.processed_by = admin_id
    withdrawal.admin_notes = admin_notes
    withdrawal.updated_at = datetime.utcnow()

    await db.flush()

    logger.info(
        f"Withdrawal approved: {withdrawal.internal_reference} by admin {admin_id}"
    )

    return {
        "success": True,
        "withdrawal_id": str(withdrawal.id),
        "status": WithdrawalStatus.PROCESSING.value,
    }


async def complete_withdrawal(
    db: AsyncSession,
    withdrawal_id: UUID,
    admin_id: UUID,
    wire_reference: Optional[str] = None,
    admin_notes: Optional[str] = None,
) -> dict:
    """
    Complete a withdrawal (mark as transferred/completed).
    """
    result = await db.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id)
    )
    withdrawal = result.scalar_one_or_none()

    if not withdrawal:
        return {"success": False, "error": "Withdrawal not found"}

    if withdrawal.status != WithdrawalStatus.PROCESSING:
        return {
            "success": False,
            "error": f"Cannot complete withdrawal in {withdrawal.status.value} status",
        }

    # Update status
    withdrawal.status = WithdrawalStatus.COMPLETED
    withdrawal.completed_at = datetime.utcnow()
    withdrawal.completed_by = admin_id
    withdrawal.wire_reference = wire_reference
    if admin_notes:
        withdrawal.admin_notes = (
            f"{withdrawal.admin_notes}\n{admin_notes}"
            if withdrawal.admin_notes
            else admin_notes
        )
    withdrawal.updated_at = datetime.utcnow()

    await db.flush()

    logger.info(
        f"Withdrawal completed: {withdrawal.internal_reference} - "
        f"Wire ref: {wire_reference}"
    )

    return {
        "success": True,
        "withdrawal_id": str(withdrawal.id),
        "status": WithdrawalStatus.COMPLETED.value,
        "wire_reference": wire_reference,
    }


async def reject_withdrawal(
    db: AsyncSession,
    withdrawal_id: UUID,
    admin_id: UUID,
    rejection_reason: str,
    admin_notes: Optional[str] = None,
) -> dict:
    """
    Reject a withdrawal request and refund the reserved balance.
    """
    result = await db.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id)
    )
    withdrawal = result.scalar_one_or_none()

    if not withdrawal:
        return {"success": False, "error": "Withdrawal not found"}

    if withdrawal.status not in [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING]:
        return {
            "success": False,
            "error": f"Cannot reject withdrawal in {withdrawal.status.value} status",
        }

    # Refund the reserved balance
    await update_entity_balance(
        db=db,
        entity_id=withdrawal.entity_id,
        asset_type=withdrawal.asset_type,
        amount=withdrawal.amount,  # Positive for credit (refund)
        transaction_type=TransactionType.ADJUSTMENT,
        created_by=admin_id,
        reference=withdrawal.internal_reference,
        notes=f"Withdrawal rejected - funds returned. Reason: {rejection_reason}",
    )

    # Update status
    withdrawal.status = WithdrawalStatus.REJECTED
    withdrawal.rejected_at = datetime.utcnow()
    withdrawal.rejected_by = admin_id
    withdrawal.rejection_reason = rejection_reason
    if admin_notes:
        withdrawal.admin_notes = (
            f"{withdrawal.admin_notes}\n{admin_notes}"
            if withdrawal.admin_notes
            else admin_notes
        )
    withdrawal.updated_at = datetime.utcnow()

    await db.flush()

    logger.info(
        f"Withdrawal rejected: {withdrawal.internal_reference} - "
        f"Reason: {rejection_reason}"
    )

    return {
        "success": True,
        "withdrawal_id": str(withdrawal.id),
        "status": WithdrawalStatus.REJECTED.value,
        "refunded_amount": str(withdrawal.amount),
        "refunded_asset": withdrawal.asset_type.value,
    }


async def get_entity_withdrawals(
    db: AsyncSession,
    entity_id: UUID,
    limit: int = 50,
) -> list[dict]:
    """Get withdrawal history for an entity"""
    result = await db.execute(
        select(Withdrawal)
        .where(Withdrawal.entity_id == entity_id)
        .order_by(Withdrawal.requested_at.desc())
        .limit(limit)
    )
    withdrawals = result.scalars().all()

    return [
        {
            "id": str(w.id),
            "asset_type": w.asset_type.value,
            "amount": str(w.amount),
            "status": w.status.value,
            "internal_reference": w.internal_reference,
            "wire_reference": w.wire_reference,
            "destination_iban": w.destination_iban,
            "destination_registry": w.destination_registry,
            "rejection_reason": w.rejection_reason,
            "requested_at": w.requested_at.isoformat() if w.requested_at else None,
            "processed_at": w.processed_at.isoformat() if w.processed_at else None,
            "completed_at": w.completed_at.isoformat() if w.completed_at else None,
            "rejected_at": w.rejected_at.isoformat() if w.rejected_at else None,
        }
        for w in withdrawals
    ]


async def get_withdrawal_stats(db: AsyncSession) -> dict:
    """Get withdrawal statistics for admin dashboard"""
    # Count by status
    pending_result = await db.execute(
        select(Withdrawal).where(Withdrawal.status == WithdrawalStatus.PENDING)
    )
    pending_count = len(pending_result.scalars().all())

    processing_result = await db.execute(
        select(Withdrawal).where(Withdrawal.status == WithdrawalStatus.PROCESSING)
    )
    processing_count = len(processing_result.scalars().all())

    completed_result = await db.execute(
        select(Withdrawal).where(Withdrawal.status == WithdrawalStatus.COMPLETED)
    )
    completed_count = len(completed_result.scalars().all())

    rejected_result = await db.execute(
        select(Withdrawal).where(Withdrawal.status == WithdrawalStatus.REJECTED)
    )
    rejected_count = len(rejected_result.scalars().all())

    return {
        "pending": pending_count,
        "processing": processing_count,
        "completed": completed_count,
        "rejected": rejected_count,
        "total": pending_count + processing_count + completed_count + rejected_count,
    }
