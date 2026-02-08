"""
Deposit Service - AML Hold Management

Handles deposit lifecycle (announce → confirm → clear):
1. Client announces wire transfer (POST /deposits/announce); APPROVED→FUNDING.
2. Backoffice confirms receipt (POST /deposits/{id}/confirm); FUNDING→AML, ON_HOLD.
3. AML hold period calculated and applied.
4. Hold expires or admin clears early (POST /deposits/{id}/clear); AML→CEA, credit.
5. Funds credited to entity balance.

Alternative: PUT /backoffice/deposits/{id}/confirm for immediate confirm (no hold),
also FUNDING→AML. Direct create: POST /backoffice/deposits (no announce, no
role transitions). See backoffice docstrings.

Hold Period Rules:
- First deposit: 3 business days
- Subsequent deposits: 1 business day
- Large amounts (>500K EUR): 3 business days
"""

import logging
import secrets
import string
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.models import (
    AMLStatus,
    AssetType,
    Currency,
    Deposit,
    DepositStatus,
    Entity,
    HoldType,
    TicketStatus,
    TransactionType,
    User,
    UserRole,
)
from ..services.balance_utils import update_entity_balance
from ..services.ticket_service import TicketService

logger = logging.getLogger(__name__)

# Configuration
LARGE_AMOUNT_THRESHOLD = Decimal("500000")  # EUR
FIRST_DEPOSIT_HOLD_DAYS = 3
SUBSEQUENT_HOLD_DAYS = 1
LARGE_AMOUNT_HOLD_DAYS = 3


class DepositServiceError(Exception):
    """Base exception for deposit service errors"""

    pass


class DepositNotFoundError(DepositServiceError):
    """Deposit not found"""

    pass


class InvalidDepositStateError(DepositServiceError):
    """Invalid state transition"""

    pass


class InsufficientPermissionError(DepositServiceError):
    """User lacks permission for operation"""

    pass


def calculate_business_days(start_date: datetime, days: int) -> datetime:
    """
    Add business days to a date, skipping weekends.

    Args:
        start_date: Starting datetime
        days: Number of business days to add

    Returns:
        Target datetime after adding business days
    """
    current = start_date
    remaining_days = days

    while remaining_days > 0:
        current += timedelta(days=1)
        # Skip weekends (5=Saturday, 6=Sunday)
        if current.weekday() < 5:
            remaining_days -= 1

    return current


async def get_entity_deposit_count(db: AsyncSession, entity_id: UUID) -> int:
    """Get count of previously cleared deposits for an entity."""
    result = await db.execute(
        select(func.count(Deposit.id)).where(
            and_(
                Deposit.entity_id == entity_id, Deposit.status == DepositStatus.CLEARED
            )
        )
    )
    return result.scalar() or 0


async def calculate_hold_period(
    db: AsyncSession, entity_id: UUID, amount: Decimal
) -> Tuple[HoldType, int]:
    """
    Calculate the AML hold period for a deposit.

    Rules:
    1. First deposit from entity: 3 business days
    2. Large amount (>500K EUR): 3 business days
    3. Subsequent deposits: 1 business day

    Args:
        db: Database session
        entity_id: Entity making the deposit
        amount: Deposit amount in EUR

    Returns:
        Tuple of (HoldType, days_required)
    """
    # Check if this is the first cleared deposit
    cleared_count = await get_entity_deposit_count(db, entity_id)

    if cleared_count == 0:
        return (HoldType.FIRST_DEPOSIT, FIRST_DEPOSIT_HOLD_DAYS)

    # Check if large amount
    if amount >= LARGE_AMOUNT_THRESHOLD:
        return (HoldType.LARGE_AMOUNT, LARGE_AMOUNT_HOLD_DAYS)

    # Default to subsequent deposit rules
    return (HoldType.SUBSEQUENT, SUBSEQUENT_HOLD_DAYS)


async def announce_deposit(
    db: AsyncSession,
    entity_id: UUID,
    user_id: UUID,
    reported_amount: Decimal,
    reported_currency: Currency,
    source_bank: Optional[str] = None,
    source_iban: Optional[str] = None,
    source_swift: Optional[str] = None,
    client_notes: Optional[str] = None,
) -> Deposit:
    """
    Client announces a wire transfer deposit.

    Creates a deposit record in PENDING status awaiting backoffice confirmation.

    Args:
        db: Database session
        entity_id: Entity making the deposit
        user_id: User announcing the deposit
        reported_amount: Amount claimed by client
        reported_currency: Currency of the deposit
        source_bank: Name of sending bank
        source_iban: IBAN of source account
        source_swift: SWIFT/BIC code
        client_notes: Optional notes from client

    Returns:
        Created Deposit record
    """
    # Generate bank reference
    chars = string.ascii_uppercase + string.digits
    bank_ref = f"DEP-{''.join(secrets.choice(chars) for _ in range(8))}"

    deposit = Deposit(
        entity_id=entity_id,
        user_id=user_id,
        reported_amount=reported_amount,
        reported_currency=reported_currency,
        source_bank=source_bank,
        source_iban=source_iban,
        source_swift=source_swift,
        client_notes=client_notes,
        bank_reference=bank_ref,
        status=DepositStatus.PENDING,
        aml_status=AMLStatus.PENDING.value,
        reported_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )

    db.add(deposit)
    await db.flush()

    # Create audit ticket for deposit announcement
    # Note: TicketStatus.SUCCESS means the announcement action succeeded, not that the deposit is cleared
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="DEPOSIT_ANNOUNCED",
        entity_type="Deposit",
        entity_id=deposit.id,
        status=TicketStatus.SUCCESS,
        user_id=user_id,
        request_payload={
            "reported_amount": str(reported_amount),
            "reported_currency": reported_currency.value,
            "source_bank": source_bank,
            "source_iban": source_iban,
            "client_notes": client_notes,
        },
        response_data={
            "deposit_id": str(deposit.id),
            "bank_reference": bank_ref,
        },
        tags=["deposit", "announced", "pending"],
    )
    deposit.ticket_id = ticket.ticket_id
    await db.flush()

    # Transition: first successful announce for this entity → APPROVED users become FUNDING
    users_result = await db.execute(
        select(User).where(
            User.entity_id == entity_id,
            User.role == UserRole.APPROVED,
        )
    )
    for u in users_result.scalars().all():
        u.role = UserRole.FUNDING
    await db.flush()

    logger.info(
        f"Deposit announced: {deposit.id} - Entity {entity_id} - "
        f"{reported_amount} {reported_currency.value} - Ticket {ticket.ticket_id}"
    )

    return deposit


async def confirm_deposit(
    db: AsyncSession,
    deposit_id: UUID,
    admin_id: UUID,
    actual_amount: Decimal,
    actual_currency: Currency,
    wire_reference: Optional[str] = None,
    bank_reference: Optional[str] = None,
    admin_notes: Optional[str] = None,
) -> Deposit:
    """
    Backoffice confirms receipt of wire transfer.

    Calculates hold period and transitions to ON_HOLD status.

    Args:
        db: Database session
        deposit_id: Deposit to confirm
        admin_id: Admin user confirming
        actual_amount: Actual amount received
        actual_currency: Actual currency received
        wire_reference: Bank wire reference number
        bank_reference: Internal bank reference
        admin_notes: Notes from admin

    Returns:
        Updated Deposit record

    Raises:
        DepositNotFoundError: If deposit doesn't exist
        InvalidDepositStateError: If deposit not in PENDING status
    """
    # Get deposit with entity
    result = await db.execute(select(Deposit).where(Deposit.id == deposit_id))
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise DepositNotFoundError(f"Deposit {deposit_id} not found")

    if deposit.status != DepositStatus.PENDING:
        raise InvalidDepositStateError(
            f"Cannot confirm deposit in {deposit.status.value} status"
        )

    # Calculate hold period
    hold_type, hold_days = await calculate_hold_period(
        db, deposit.entity_id, actual_amount
    )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    hold_expires_at = calculate_business_days(now, hold_days)

    # Update deposit
    deposit.amount = actual_amount
    deposit.currency = actual_currency
    deposit.wire_reference = wire_reference
    deposit.bank_reference = bank_reference
    deposit.status = DepositStatus.ON_HOLD
    deposit.hold_type = hold_type.value
    deposit.hold_days_required = hold_days
    deposit.hold_expires_at = hold_expires_at
    deposit.aml_status = AMLStatus.ON_HOLD.value
    deposit.confirmed_at = now
    deposit.confirmed_by = admin_id
    if admin_notes:
        deposit.admin_notes = admin_notes

    # Transition: FUNDING → AML when backoffice confirms wire
    users_result = await db.execute(
        select(User).where(
            User.entity_id == deposit.entity_id,
            User.role == UserRole.FUNDING,
        )
    )
    for u in users_result.scalars().all():
        u.role = UserRole.AML
    await db.flush()

    logger.info(
        f"Deposit confirmed: {deposit.id} - {actual_amount} {actual_currency.value} - "
        f"Hold: {hold_type.value} ({hold_days} days) - Expires: {hold_expires_at}"
    )

    return deposit


async def clear_deposit(
    db: AsyncSession,
    deposit_id: UUID,
    admin_id: UUID,
    admin_notes: Optional[str] = None,
    force_clear: bool = False,
) -> Tuple[Deposit, List[UUID]]:
    """
    Clear deposit and credit funds to entity balance.

    Can be called:
    - Manually by admin before hold expires (force_clear=True)
    - Automatically when hold period expires

    Args:
        db: Database session
        deposit_id: Deposit to clear
        admin_id: Admin user clearing (for audit)
        admin_notes: Optional notes
        force_clear: Allow clearing before hold expires

    Returns:
        Tuple of (updated Deposit record, list of user IDs upgraded AML→CEA).

    Raises:
        DepositNotFoundError: If deposit doesn't exist
        InvalidDepositStateError: If deposit not in ON_HOLD status
    """
    result = await db.execute(select(Deposit).where(Deposit.id == deposit_id))
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise DepositNotFoundError(f"Deposit {deposit_id} not found")

    if deposit.status != DepositStatus.ON_HOLD:
        raise InvalidDepositStateError(
            f"Cannot clear deposit in {deposit.status.value} status"
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Check if hold has expired (unless force clearing)
    if not force_clear and deposit.hold_expires_at and deposit.hold_expires_at > now:
        raise InvalidDepositStateError(
            f"Hold period not expired. Expires at {deposit.hold_expires_at}. "
            "Use force_clear=True to override."
        )

    # Update deposit status
    deposit.status = DepositStatus.CLEARED
    deposit.aml_status = AMLStatus.CLEARED.value
    deposit.cleared_at = now
    deposit.cleared_by_admin_id = admin_id
    if admin_notes:
        deposit.admin_notes = (deposit.admin_notes or "") + f"\n[Cleared] {admin_notes}"

    # Transition: AML → CEA when deposit is cleared
    users_result = await db.execute(
        select(User).where(
            User.entity_id == deposit.entity_id,
            User.role == UserRole.AML,
        )
    )
    users_to_upgrade = users_result.scalars().all()
    upgraded_user_ids = [u.id for u in users_to_upgrade]
    for u in users_to_upgrade:
        u.role = UserRole.CEA
    await db.flush()

    # Credit funds to entity balance
    if deposit.amount and deposit.currency == Currency.EUR:
        await update_entity_balance(
            db=db,
            entity_id=deposit.entity_id,
            asset_type=AssetType.EUR,
            amount=deposit.amount,
            transaction_type=TransactionType.DEPOSIT,
            created_by=admin_id,
            reference=f"deposit:{deposit.id}",
            notes=f"Deposit cleared - Wire ref: {deposit.wire_reference or 'N/A'}",
        )

        # Update entity total deposited
        entity_result = await db.execute(
            select(Entity).where(Entity.id == deposit.entity_id)
        )
        entity = entity_result.scalar_one_or_none()
        if entity:
            entity.total_deposited = (
                entity.total_deposited or Decimal("0")
            ) + deposit.amount
            entity.balance_amount = (
                entity.balance_amount or Decimal("0")
            ) + deposit.amount
            entity.balance_currency = Currency.EUR

    await db.flush()

    currency_val = deposit.currency.value if deposit.currency else "N/A"
    logger.info(
        "Deposit cleared: %s - %s %s - Entity %s - %s user(s) AML→CEA",
        deposit.id,
        deposit.amount,
        currency_val,
        deposit.entity_id,
        len(upgraded_user_ids),
    )

    return deposit, upgraded_user_ids


async def reject_deposit(
    db: AsyncSession,
    deposit_id: UUID,
    admin_id: UUID,
    rejection_reason: str,
    admin_notes: Optional[str] = None,
) -> Deposit:
    """
    Reject a deposit for AML or other reasons.

    Args:
        db: Database session
        deposit_id: Deposit to reject
        admin_id: Admin user rejecting
        rejection_reason: Reason for rejection (from RejectionReason enum)
        admin_notes: Additional notes

    Returns:
        Updated Deposit record

    Raises:
        DepositNotFoundError: If deposit doesn't exist
        InvalidDepositStateError: If deposit already cleared/rejected
    """
    result = await db.execute(select(Deposit).where(Deposit.id == deposit_id))
    deposit = result.scalar_one_or_none()

    if not deposit:
        raise DepositNotFoundError(f"Deposit {deposit_id} not found")

    if deposit.status in (DepositStatus.CLEARED, DepositStatus.REJECTED):
        raise InvalidDepositStateError(
            f"Cannot reject deposit in {deposit.status.value} status"
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    deposit.status = DepositStatus.REJECTED
    deposit.aml_status = AMLStatus.REJECTED.value
    deposit.rejected_at = now
    deposit.rejected_by_admin_id = admin_id
    deposit.rejection_reason = rejection_reason
    if admin_notes:
        deposit.admin_notes = (
            deposit.admin_notes or ""
        ) + f"\n[Rejected] {admin_notes}"

    # Transition: entity users in FUNDING or AML → REJECTED
    users_result = await db.execute(
        select(User).where(
            User.entity_id == deposit.entity_id,
            User.role.in_([UserRole.FUNDING, UserRole.AML]),
        )
    )
    for u in users_result.scalars().all():
        u.role = UserRole.REJECTED
    await db.flush()

    logger.info(
        f"Deposit rejected: {deposit.id} - Reason: {rejection_reason} - "
        f"Entity {deposit.entity_id}"
    )

    return deposit


async def get_deposit_by_id(db: AsyncSession, deposit_id: UUID) -> Optional[Deposit]:
    """Get a deposit by ID with related entity and user."""
    result = await db.execute(
        select(Deposit)
        .options(
            selectinload(Deposit.entity),
            selectinload(Deposit.user),
            selectinload(Deposit.confirmed_by_user),
            selectinload(Deposit.cleared_by_admin),
            selectinload(Deposit.rejected_by_admin),
        )
        .where(Deposit.id == deposit_id)
    )
    return result.scalar_one_or_none()


async def get_entity_deposits(
    db: AsyncSession,
    entity_id: UUID,
    status: Optional[DepositStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Deposit]:
    """Get deposits for an entity with optional status filter."""
    query = select(Deposit).where(Deposit.entity_id == entity_id)

    if status:
        query = query.where(Deposit.status == status)

    query = query.order_by(Deposit.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_pending_deposits(
    db: AsyncSession, limit: int = 100, offset: int = 0
) -> List[Deposit]:
    """Get all pending deposits awaiting confirmation."""
    query = (
        select(Deposit)
        .options(selectinload(Deposit.entity), selectinload(Deposit.user))
        .where(Deposit.status == DepositStatus.PENDING)
        .order_by(Deposit.reported_at.asc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_on_hold_deposits(
    db: AsyncSession, include_expired: bool = False, limit: int = 100, offset: int = 0
) -> List[Deposit]:
    """Get deposits currently on hold."""
    query = (
        select(Deposit)
        .options(
            selectinload(Deposit.entity),
            selectinload(Deposit.user),
            selectinload(Deposit.confirmed_by_user),
            selectinload(Deposit.cleared_by_admin),
            selectinload(Deposit.rejected_by_admin),
        )
        .where(Deposit.status == DepositStatus.ON_HOLD)
    )

    if not include_expired:
        # Only show holds that haven't expired yet
        query = query.where(
            or_(
                Deposit.hold_expires_at.is_(None),
                Deposit.hold_expires_at > datetime.now(timezone.utc).replace(tzinfo=None),
            )
        )

    query = query.order_by(Deposit.hold_expires_at.asc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_expired_holds(db: AsyncSession) -> List[Deposit]:
    """Get deposits where hold period has expired but not yet cleared."""
    # Use naive UTC for TIMESTAMP WITHOUT TIME ZONE (asyncpg)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    query = (
        select(Deposit)
        .options(selectinload(Deposit.entity))
        .where(
            and_(
                Deposit.status == DepositStatus.ON_HOLD,
                Deposit.hold_expires_at.isnot(None),
                Deposit.hold_expires_at <= now,
            )
        )
        .order_by(Deposit.hold_expires_at.asc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def process_expired_holds(db: AsyncSession, system_admin_id: UUID) -> int:
    """
    Auto-clear deposits where hold period has expired.

    Should be called periodically (e.g., every hour) by a background task.

    Args:
        db: Database session
        system_admin_id: Admin ID to use for audit trail

    Returns:
        Number of deposits auto-cleared
    """
    expired = await get_expired_holds(db)
    cleared_count = 0

    for deposit in expired:
        try:
            await clear_deposit(
                db=db,
                deposit_id=deposit.id,
                admin_id=system_admin_id,
                admin_notes="Auto-cleared after hold period expiration",
                force_clear=False,
            )
            cleared_count += 1  # (deposit, upgraded_count) returned; we count cleared deposits
        except Exception as e:
            logger.error(f"Failed to auto-clear deposit {deposit.id}: {e}")

    if cleared_count > 0:
        logger.info(f"Auto-cleared {cleared_count} deposits with expired holds")

    return cleared_count


async def get_deposit_statistics(
    db: AsyncSession, entity_id: Optional[UUID] = None
) -> dict:
    """
    Get deposit statistics for dashboard.

    Args:
        db: Database session
        entity_id: Optional filter by entity

    Returns:
        Dictionary with counts and totals
    """
    base_query = select(Deposit)
    if entity_id:
        base_query = base_query.where(Deposit.entity_id == entity_id)

    # Get counts by status
    pending_result = await db.execute(
        base_query.where(Deposit.status == DepositStatus.PENDING)
    )
    pending_count = len(list(pending_result.scalars().all()))

    on_hold_result = await db.execute(
        base_query.where(Deposit.status == DepositStatus.ON_HOLD)
    )
    on_hold = list(on_hold_result.scalars().all())
    on_hold_count = len(on_hold)
    on_hold_total = sum(d.amount or Decimal("0") for d in on_hold)

    cleared_result = await db.execute(
        base_query.where(Deposit.status == DepositStatus.CLEARED)
    )
    cleared = list(cleared_result.scalars().all())
    cleared_count = len(cleared)
    cleared_total = sum(d.amount or Decimal("0") for d in cleared)

    rejected_result = await db.execute(
        base_query.where(Deposit.status == DepositStatus.REJECTED)
    )
    rejected_count = len(list(rejected_result.scalars().all()))

    # Expired holds waiting for processing
    expired = await get_expired_holds(db)

    return {
        "pending_count": pending_count,
        "on_hold_count": on_hold_count,
        "on_hold_total": float(on_hold_total),
        "cleared_count": cleared_count,
        "cleared_total": float(cleared_total),
        "rejected_count": rejected_count,
        "expired_holds_count": len(expired) if not entity_id else 0,
    }
