"""Referral invitation service.

Handles token generation, validation, rate limiting, and invitation lifecycle.
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    InvitationStatus,
    ReferralInvitation,
    User,
)

logger = logging.getLogger(__name__)

INVITATION_EXPIRY_DAYS = 7
MAX_INVITATIONS_PER_DAY = 10


def _generate_invitation_token() -> tuple[str, str]:
    """Generate a secure invitation token and its hash.

    Returns (raw_token, sha256_hash).
    """
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


async def check_invite_rate_limit(
    db: AsyncSession, introducer_id: UUID
) -> int:
    """Return count of invitations sent today. Raises nothing -- caller checks."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0, tzinfo=None
    )
    result = await db.execute(
        select(func.count(ReferralInvitation.id))
        .where(ReferralInvitation.introducer_user_id == introducer_id)
        .where(ReferralInvitation.created_at >= today_start)
    )
    return result.scalar_one()


async def create_invitation(
    db: AsyncSession,
    introducer: User,
    invited_email: str,
    invited_first_name: str | None = None,
    personal_note: str | None = None,
) -> tuple[ReferralInvitation, str]:
    """Create a referral invitation.

    Returns (invitation, raw_token) -- raw_token is used in the email link.
    Raises ValueError with descriptive message on validation failure.
    """
    email_lower = invited_email.strip().lower()

    # Self-referral check
    if email_lower == introducer.email.lower():
        raise ValueError("You cannot invite yourself")

    # Already registered check
    existing_user = await db.execute(
        select(User).where(func.lower(User.email) == email_lower).limit(1)
    )
    if existing_user.scalar_one_or_none():
        raise ValueError("This email already has an account on the platform")

    # Duplicate invitation check (same introducer + same email)
    existing_invite = await db.execute(
        select(ReferralInvitation)
        .where(ReferralInvitation.introducer_user_id == introducer.id)
        .where(func.lower(ReferralInvitation.invited_email) == email_lower)
        .limit(1)
    )
    if existing_invite.scalar_one_or_none():
        raise ValueError("You have already sent an invitation to this email")

    # Rate limit check
    today_count = await check_invite_rate_limit(db, introducer.id)
    if today_count >= MAX_INVITATIONS_PER_DAY:
        raise ValueError(
            f"Daily invitation limit reached ({MAX_INVITATIONS_PER_DAY}/day)"
        )

    # Create invitation
    raw_token, token_hash = _generate_invitation_token()
    invitation = ReferralInvitation(
        introducer_user_id=introducer.id,
        invited_email=email_lower,
        invited_first_name=invited_first_name,
        personal_note=personal_note,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
        + timedelta(days=INVITATION_EXPIRY_DAYS),
    )
    db.add(invitation)
    await db.flush()

    logger.info(
        "Invitation created: introducer=%s -> %s", introducer.id, email_lower
    )
    return invitation, raw_token


async def validate_invitation_token(
    db: AsyncSession, token: str
) -> ReferralInvitation | None:
    """Validate an invitation token. Returns the invitation if valid, None otherwise."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    result = await db.execute(
        select(ReferralInvitation)
        .where(ReferralInvitation.token_hash == token_hash)
        .where(
            ReferralInvitation.status.in_(
                [
                    InvitationStatus.PENDING,
                    InvitationStatus.CLICKED,
                ]
            )
        )
        .limit(1)
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return None

    # Check expiry
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if invitation.expires_at < now:
        invitation.status = InvitationStatus.EXPIRED
        return None

    # Mark as clicked if first time
    if invitation.status == InvitationStatus.PENDING:
        invitation.status = InvitationStatus.CLICKED
        invitation.clicked_at = now

    return invitation


async def mark_invitation_registered(
    db: AsyncSession,
    invited_email: str,
    registered_user_id: UUID,
) -> None:
    """Update invitation status when the invited user completes registration."""
    email_lower = invited_email.strip().lower()
    result = await db.execute(
        select(ReferralInvitation)
        .where(func.lower(ReferralInvitation.invited_email) == email_lower)
        .where(
            ReferralInvitation.status.in_(
                [
                    InvitationStatus.PENDING,
                    InvitationStatus.CLICKED,
                ]
            )
        )
    )
    for inv in result.scalars().all():
        inv.status = InvitationStatus.REGISTERED
        inv.registered_at = datetime.now(timezone.utc).replace(tzinfo=None)
        inv.registered_user_id = registered_user_id
