"""
Settlement Processor - Background Job for Automatic Status Updates

Runs periodically to advance settlement statuses based on timeline.
"""
import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import AsyncSessionLocal
from ..models.models import (
    SettlementBatch,
    SettlementStatus,
    User
)
from .settlement_service import SettlementService

logger = logging.getLogger(__name__)


class SettlementProcessor:
    """Automatic settlement status processor"""

    @staticmethod
    async def process_pending_settlements():
        """Main processor - auto-advance settlements based on expected dates"""
        async with AsyncSessionLocal() as db:
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
                    if await SettlementProcessor._should_advance_status(settlement):
                        next_status = SettlementProcessor._get_next_status(settlement)
                        if next_status:
                            system_user_id = await SettlementProcessor._get_system_user_id(db)

                            await SettlementService.update_settlement_status(
                                db=db,
                                settlement_id=settlement.id,
                                new_status=next_status,
                                notes=f"Automatic status update by settlement processor",
                                updated_by=system_user_id
                            )

                            # TODO: Send email notification
                            # await send_settlement_status_email(settlement, next_status)

                            processed_count += 1
                            logger.info(
                                f"Advanced settlement {settlement.batch_reference} to {next_status}"
                            )

                logger.info(f"Settlement processing complete. Advanced {processed_count} settlements.")

            except Exception as e:
                logger.error(f"Error in settlement processor: {e}", exc_info=True)

    @staticmethod
    def _should_advance_status(settlement: SettlementBatch) -> bool:
        """Check if settlement should advance to next status"""
        now = datetime.utcnow()
        created = settlement.created_at

        # Calculate business days elapsed
        days_elapsed = 0
        current = created
        while current < now:
            current += timedelta(days=1)
            if current.weekday() < 5:  # Monday-Friday
                days_elapsed += 1

        # Status advancement timeline
        if settlement.status == SettlementStatus.PENDING and days_elapsed >= 1:
            return True  # T+1: PENDING -> TRANSFER_INITIATED
        elif settlement.status == SettlementStatus.TRANSFER_INITIATED and days_elapsed >= 2:
            return True  # T+2: TRANSFER_INITIATED -> IN_TRANSIT
        elif settlement.status == SettlementStatus.IN_TRANSIT:
            if settlement.settlement_type.value == "CEA_PURCHASE" and days_elapsed >= 3:
                return True  # T+3: IN_TRANSIT -> AT_CUSTODY (CEA)
            elif settlement.settlement_type.value == "SWAP_CEA_TO_EUA":
                if settlement.asset_type.value == "CEA" and days_elapsed >= 2:
                    return True  # T+2: CEA swap out
                elif settlement.asset_type.value == "EUA" and days_elapsed >= 3:
                    return True  # T+3-T+5: EUA swap in
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
                    for settlement in overdue:
                        days_overdue = (now - settlement.expected_settlement_date).days
                        logger.warning(
                            f"Settlement {settlement.batch_reference} is {days_overdue} days overdue. "
                            f"Status: {settlement.status}"
                        )
                        # TODO: Send admin alert email

            except Exception as e:
                logger.error(f"Error checking overdue settlements: {e}", exc_info=True)
