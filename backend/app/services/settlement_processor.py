"""
Settlement Processor - Background Job for Automatic Status Updates

Runs periodically to advance settlement statuses based on timeline.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import AsyncSessionLocal
from ..models.models import (
    SettlementBatch,
    SettlementStatus,
    User,
    Entity
)
from .settlement_service import SettlementService
from .email_service import email_service

logger = logging.getLogger(__name__)


class SettlementProcessor:
    """Automatic settlement status processor"""

    @staticmethod
    async def process_pending_settlements(db: Optional[AsyncSession] = None):
        """Main processor - auto-advance settlements based on expected dates"""
        # Use provided session (for testing) or create new one (for production)
        if db is not None:
            await SettlementProcessor._process_with_session(db)
        else:
            async with AsyncSessionLocal() as session:
                await SettlementProcessor._process_with_session(session)

    @staticmethod
    async def _process_with_session(db: AsyncSession):
        """Internal method that does the actual processing"""
        try:
            logger.info("Starting settlement batch processing...")

            # Get all non-final settlements
            result = await db.execute(
                select(SettlementBatch).where(
                    SettlementBatch.status.notin_([
                        SettlementStatus.SETTLED,
                        SettlementStatus.FAILED
                    ])
                )
            )
            settlements = result.scalars().all()

            processed_count = 0
            for settlement in settlements:
                if SettlementProcessor._should_advance_status(settlement):
                    next_status = SettlementProcessor._get_next_status(settlement)
                    if next_status:
                        system_user_id = await SettlementProcessor._get_system_user_id(db)

                        old_status = settlement.status

                        await SettlementService.update_settlement_status(
                            db=db,
                            settlement_id=settlement.id,
                            new_status=next_status,
                            notes=f"Automatic status update by settlement processor",
                            updated_by=system_user_id
                        )

                        # Send email notification to entity users
                        entity_result = await db.execute(
                            select(Entity).where(Entity.id == settlement.entity_id)
                        )
                        entity = entity_result.scalar_one_or_none()
                        if entity:
                            user_result = await db.execute(
                                select(User).where(User.entity_id == entity.id)
                            )
                            entity_users = user_result.scalars().all()

                            for user in entity_users:
                                if user.email:
                                    try:
                                        await email_service.send_settlement_status_update(
                                            to_email=user.email,
                                            first_name=user.first_name,
                                            batch_reference=settlement.batch_reference,
                                            old_status=old_status.value,
                                            new_status=next_status.value,
                                            certificate_type=settlement.asset_type.value,
                                            quantity=float(settlement.quantity)
                                        )
                                        logger.info(
                                            f"Settlement status email sent to {user.email} for {settlement.batch_reference}"
                                        )
                                    except Exception as email_error:
                                        logger.error(
                                            f"Failed to send settlement status email to {user.email}: {email_error}"
                                        )

                        processed_count += 1
                        logger.info(
                            f"Advanced settlement {settlement.batch_reference} to {next_status}"
                        )

            logger.info(f"Settlement processing complete. Advanced {processed_count} settlements.")

        except Exception as e:
            logger.error(f"Error in settlement processor: {e}", exc_info=True)

    @staticmethod
    def _should_advance_status(settlement: SettlementBatch) -> bool:
        """Check if settlement should advance to next status based on expected timeline"""
        now = datetime.utcnow()

        # Terminal statuses should never advance
        if settlement.status in [SettlementStatus.SETTLED, SettlementStatus.FAILED]:
            return False

        # Calculate how far we are in the settlement timeline
        # For CEA (T+3): expected_settlement_date is 3 business days from creation
        # Calculate business days from creation to expected date
        if settlement.settlement_type.value == "CEA_PURCHASE":
            total_days_for_settlement = 3  # T+3
        elif settlement.settlement_type.value == "SWAP_CEA_TO_EUA":
            if settlement.asset_type.value == "CEA":
                total_days_for_settlement = 2  # T+2 for CEA swaps
            else:
                total_days_for_settlement = 3  # T+3-T+5 for EUA swaps
        else:
            total_days_for_settlement = 3  # Default T+3

        # Calculate business days elapsed from creation
        created = settlement.created_at
        days_elapsed = 0
        current_date = created.date()
        now_date = now.date()

        # Count business days between created date and now date
        while current_date < now_date:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5:  # Monday-Friday
                days_elapsed += 1

        # Also check if expected date has passed (failsafe)
        expected_date_passed = (
            settlement.expected_settlement_date and
            now >= settlement.expected_settlement_date
        )

        # Status advancement timeline
        if settlement.status == SettlementStatus.PENDING:
            # Advance if 1+ business day elapsed OR expected date passed
            return days_elapsed >= 1 or expected_date_passed
        elif settlement.status == SettlementStatus.TRANSFER_INITIATED:
            # Advance if 2+ business days elapsed OR expected date passed
            return days_elapsed >= 2 or expected_date_passed
        elif settlement.status == SettlementStatus.IN_TRANSIT:
            # Advance if timeline complete OR expected date passed
            if settlement.settlement_type.value == "CEA_PURCHASE":
                return days_elapsed >= 3 or expected_date_passed
            elif settlement.settlement_type.value == "SWAP_CEA_TO_EUA":
                if settlement.asset_type.value == "CEA":
                    return days_elapsed >= 2 or expected_date_passed
                elif settlement.asset_type.value == "EUA":
                    return days_elapsed >= 3 or expected_date_passed
        elif settlement.status == SettlementStatus.AT_CUSTODY:
            return True  # Immediately advance to SETTLED

        return False

    @staticmethod
    def _get_next_status(settlement: SettlementBatch) -> SettlementStatus:
        """Get next status in progression"""
        status_progression = {
            SettlementStatus.PENDING: SettlementStatus.TRANSFER_INITIATED,
            SettlementStatus.TRANSFER_INITIATED: SettlementStatus.IN_TRANSIT,
            SettlementStatus.IN_TRANSIT: SettlementStatus.AT_CUSTODY,
            SettlementStatus.AT_CUSTODY: SettlementStatus.SETTLED
        }
        return status_progression.get(settlement.status)

    @staticmethod
    async def _get_system_user_id(db: AsyncSession):
        """Get system/admin user for automated actions"""
        result = await db.execute(
            select(User).where(User.email == "admin@nihaogroup.com").limit(1)
        )
        admin = result.scalar_one_or_none()
        if admin:
            return admin.id

        # Fallback: get any admin user
        result = await db.execute(
            select(User).where(User.role == "ADMIN").limit(1)
        )
        admin = result.scalar_one_or_none()
        return admin.id if admin else None

    @staticmethod
    async def check_overdue_settlements():
        """Alert on settlements past expected date but not settled"""
        async with AsyncSessionLocal() as db:
            try:
                now = datetime.utcnow()

                result = await db.execute(
                    select(SettlementBatch).where(
                        and_(
                            SettlementBatch.status != SettlementStatus.SETTLED,
                            SettlementBatch.expected_settlement_date < now
                        )
                    )
                )
                overdue = result.scalars().all()

                if overdue:
                    logger.warning(f"Found {len(overdue)} overdue settlements")

                    # Get admin users for alerts
                    admin_result = await db.execute(
                        select(User).where(User.role == "ADMIN")
                    )
                    admin_users = admin_result.scalars().all()

                    for settlement in overdue:
                        days_overdue = (now - settlement.expected_settlement_date).days
                        logger.warning(
                            f"Settlement {settlement.batch_reference} is {days_overdue} days overdue. "
                            f"Status: {settlement.status}"
                        )

                        # Get entity information
                        entity_result = await db.execute(
                            select(Entity).where(Entity.id == settlement.entity_id)
                        )
                        entity = entity_result.scalar_one_or_none()
                        entity_name = entity.legal_name if entity else "Unknown Entity"

                        # Send admin alert emails
                        for admin in admin_users:
                            if admin.email:
                                try:
                                    await email_service.send_admin_overdue_settlement_alert(
                                        to_email=admin.email,
                                        batch_reference=settlement.batch_reference,
                                        entity_name=entity_name,
                                        certificate_type=settlement.asset_type.value,
                                        quantity=float(settlement.quantity),
                                        expected_date=settlement.expected_settlement_date.strftime("%Y-%m-%d"),
                                        days_overdue=days_overdue,
                                        current_status=settlement.status.value
                                    )
                                    logger.info(f"Overdue settlement alert sent to admin {admin.email}")
                                except Exception as email_error:
                                    logger.error(f"Failed to send overdue alert to {admin.email}: {email_error}")

            except Exception as e:
                logger.error(f"Error checking overdue settlements: {e}", exc_info=True)
