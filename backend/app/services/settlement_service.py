"""
Settlement Service - Business Logic for T+N External Settlements

Handles creation, tracking, and finalization of settlement batches
for CEA purchases and CEA→EUA swaps through external registries.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.models import (
    SettlementBatch,
    SettlementStatusHistory,
    SettlementStatus,
    SettlementType,
    CertificateType,
    Entity,
    Order,
    CashMarketTrade,
    EntityHolding,
    AssetTransaction,
    AssetType,
    TransactionType,
    User
)
from ..core.exceptions import handle_database_error
from .email_service import email_service

logger = logging.getLogger(__name__)


class SettlementService:
    """Service for managing settlement operations"""

    @staticmethod
    def calculate_business_days(start_date: datetime, num_days: int) -> datetime:
        """
        Calculate target date N business days from start_date.
        Business days = Monday-Friday, excludes weekends.
        """
        current_date = start_date
        days_added = 0

        while days_added < num_days:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5:  # Skip weekends
                days_added += 1

        return current_date

    @staticmethod
    async def generate_batch_reference(
        db: AsyncSession,
        settlement_type: SettlementType,
        asset_type: CertificateType
    ) -> str:
        """Generate unique settlement batch reference: SET-YYYY-NNNNNN-TYPE"""
        year = datetime.utcnow().year
        asset_suffix = asset_type.value

        result = await db.execute(
            select(SettlementBatch)
            .where(
                and_(
                    SettlementBatch.batch_reference.like(f"SET-{year}-%"),
                    SettlementBatch.asset_type == asset_type
                )
            )
        )
        count = len(result.scalars().all())
        sequence_num = str(count + 1).zfill(6)
        return f"SET-{year}-{sequence_num}-{asset_suffix}"

    @staticmethod
    async def create_cea_purchase_settlement(
        db: AsyncSession,
        entity_id: UUID,
        order_id: UUID,
        trade_id: UUID,
        quantity: Decimal,
        price: Decimal,
        seller_id: Optional[UUID],
        created_by: Optional[UUID]
    ) -> SettlementBatch:
        """Create settlement batch for CEA purchase (T+3)"""
        try:
            today = datetime.utcnow()
            expected_date = SettlementService.calculate_business_days(today, 3)
            batch_reference = await SettlementService.generate_batch_reference(
                db, SettlementType.CEA_PURCHASE, CertificateType.CEA
            )
            total_value_eur = quantity * price

            settlement = SettlementBatch(
                batch_reference=batch_reference,
                entity_id=entity_id,
                order_id=order_id,
                trade_id=trade_id,
                counterparty_id=seller_id,
                settlement_type=SettlementType.CEA_PURCHASE,
                status=SettlementStatus.PENDING,
                asset_type=CertificateType.CEA,
                quantity=quantity,
                price=price,
                total_value_eur=total_value_eur,
                expected_settlement_date=expected_date
            )

            db.add(settlement)
            await db.flush()

            status_history = SettlementStatusHistory(
                settlement_batch_id=settlement.id,
                status=SettlementStatus.PENDING,
                notes="Settlement batch created - awaiting T+1",
                updated_by=created_by
            )
            db.add(status_history)
            await db.commit()
            await db.refresh(settlement)

            logger.info(f"Created CEA settlement: {batch_reference} for entity {entity_id}")

            # Send confirmation email
            try:
                # Get entity and user information for email
                entity_result = await db.execute(
                    select(Entity).where(Entity.id == entity_id)
                )
                entity = entity_result.scalar_one_or_none()

                if entity and created_by:
                    user_result = await db.execute(
                        select(User).where(User.id == created_by)
                    )
                    user = user_result.scalar_one_or_none()

                    if user and user.email:
                        await email_service.send_settlement_created(
                            to_email=user.email,
                            first_name=user.first_name or entity.legal_name,
                            batch_reference=batch_reference,
                            certificate_type="CEA",
                            quantity=float(quantity),
                            expected_date=expected_date.strftime("%Y-%m-%d")
                        )
                        logger.info(f"Settlement confirmation email sent to {user.email}")
            except Exception as email_error:
                logger.error(f"Failed to send settlement confirmation email: {email_error}")
                # Don't fail the settlement creation if email fails

            return settlement

        except Exception as e:
            await db.rollback()
            raise handle_database_error(e, "create CEA purchase settlement", logger)

    @staticmethod
    async def update_settlement_status(
        db: AsyncSession,
        settlement_id: UUID,
        new_status: SettlementStatus,
        notes: Optional[str],
        updated_by: Optional[UUID]
    ) -> SettlementBatch:
        """Update settlement status with validation"""
        try:
            result = await db.execute(
                select(SettlementBatch).where(SettlementBatch.id == settlement_id)
            )
            settlement = result.scalar_one_or_none()
            if not settlement:
                raise ValueError(f"Settlement {settlement_id} not found")

            old_status = settlement.status

            # Validate transitions
            valid_transitions = {
                SettlementStatus.PENDING: [SettlementStatus.TRANSFER_INITIATED, SettlementStatus.FAILED],
                SettlementStatus.TRANSFER_INITIATED: [SettlementStatus.IN_TRANSIT, SettlementStatus.FAILED],
                SettlementStatus.IN_TRANSIT: [SettlementStatus.AT_CUSTODY, SettlementStatus.FAILED],
                SettlementStatus.AT_CUSTODY: [SettlementStatus.SETTLED, SettlementStatus.FAILED],
                SettlementStatus.SETTLED: [],
                SettlementStatus.FAILED: [SettlementStatus.PENDING]
            }

            if new_status not in valid_transitions.get(old_status, []):
                raise ValueError(f"Invalid transition: {old_status} -> {new_status}")

            settlement.status = new_status
            settlement.updated_at = datetime.utcnow()

            history = SettlementStatusHistory(
                settlement_batch_id=settlement_id,
                status=new_status,
                notes=notes or f"Status changed from {old_status} to {new_status}",
                updated_by=updated_by
            )
            db.add(history)

            if new_status == SettlementStatus.SETTLED:
                await SettlementService.finalize_settlement(db, settlement, updated_by)

            await db.commit()
            await db.refresh(settlement)

            logger.info(f"Settlement {settlement.batch_reference}: {old_status} -> {new_status}")

            # Send status update email
            try:
                # Get entity and user information
                entity_result = await db.execute(
                    select(Entity).where(Entity.id == settlement.entity_id)
                )
                entity = entity_result.scalar_one_or_none()

                if entity:
                    # Get primary user for this entity
                    user_result = await db.execute(
                        select(User).where(User.entity_id == entity.id).limit(1)
                    )
                    user = user_result.scalar_one_or_none()

                    if user and user.email:
                        # Send completion email for SETTLED status, update email for others
                        if new_status == SettlementStatus.SETTLED:
                            # Get new balance after settlement
                            asset_type_enum = AssetType.CEA if settlement.asset_type == CertificateType.CEA else AssetType.EUA
                            holding_result = await db.execute(
                                select(EntityHolding).where(
                                    and_(
                                        EntityHolding.entity_id == settlement.entity_id,
                                        EntityHolding.asset_type == asset_type_enum
                                    )
                                )
                            )
                            holding = holding_result.scalar_one_or_none()
                            new_balance = float(holding.quantity) if holding else 0.0

                            await email_service.send_settlement_completed(
                                to_email=user.email,
                                first_name=user.first_name or entity.legal_name,
                                batch_reference=settlement.batch_reference,
                                certificate_type=settlement.asset_type.value,
                                quantity=float(settlement.quantity),
                                new_balance=new_balance
                            )
                        elif new_status == SettlementStatus.FAILED:
                            await email_service.send_settlement_failed(
                                to_email=user.email,
                                first_name=user.first_name or entity.legal_name,
                                batch_reference=settlement.batch_reference,
                                certificate_type=settlement.asset_type.value,
                                quantity=float(settlement.quantity),
                                reason=notes
                            )
                        else:
                            await email_service.send_settlement_status_update(
                                to_email=user.email,
                                first_name=user.first_name or entity.legal_name,
                                batch_reference=settlement.batch_reference,
                                old_status=old_status.value,
                                new_status=new_status.value,
                                certificate_type=settlement.asset_type.value,
                                quantity=float(settlement.quantity)
                            )
                        logger.info(f"Settlement status email sent to {user.email}")
            except Exception as email_error:
                logger.error(f"Failed to send settlement status email: {email_error}")
                # Don't fail the status update if email fails

            return settlement

        except Exception as e:
            await db.rollback()
            raise handle_database_error(e, "update settlement status", logger)

    @staticmethod
    async def finalize_settlement(
        db: AsyncSession,
        settlement: SettlementBatch,
        finalized_by: Optional[UUID]
    ):
        """Finalize settlement - update EntityHolding"""
        try:
            settlement.actual_settlement_date = datetime.utcnow()

            asset_type_enum = AssetType.CEA if settlement.asset_type == CertificateType.CEA else AssetType.EUA

            result = await db.execute(
                select(EntityHolding).where(
                    and_(
                        EntityHolding.entity_id == settlement.entity_id,
                        EntityHolding.asset_type == asset_type_enum
                    )
                )
            )
            holding = result.scalar_one_or_none()

            balance_before = Decimal("0")
            if not holding:
                holding = EntityHolding(
                    entity_id=settlement.entity_id,
                    asset_type=asset_type_enum,
                    quantity=Decimal("0")
                )
                db.add(holding)
                await db.flush()
            else:
                balance_before = holding.quantity

            holding.quantity += settlement.quantity
            holding.updated_at = datetime.utcnow()

            transaction = AssetTransaction(
                entity_id=settlement.entity_id,
                asset_type=asset_type_enum,
                transaction_type=TransactionType.TRADE_CREDIT,
                amount=settlement.quantity,
                balance_before=balance_before,
                balance_after=holding.quantity,
                reference=f"Settlement {settlement.batch_reference}",
                notes=f"Settlement finalized: {settlement.settlement_type.value}",
                created_by=finalized_by
            )
            db.add(transaction)

            logger.info(f"Finalized settlement {settlement.batch_reference}")

        except Exception as e:
            raise handle_database_error(e, "finalize settlement", logger)

    @staticmethod
    async def get_pending_settlements(
        db: AsyncSession,
        entity_id: Optional[UUID] = None,
        settlement_type: Optional[SettlementType] = None,
        status_filter: Optional[SettlementStatus] = None
    ) -> List[SettlementBatch]:
        """Get pending settlements with filters"""
        try:
            query = select(SettlementBatch).options(
                selectinload(SettlementBatch.entity),
                selectinload(SettlementBatch.status_history)
            )

            filters = []
            if entity_id:
                filters.append(SettlementBatch.entity_id == entity_id)
            if settlement_type:
                filters.append(SettlementBatch.settlement_type == settlement_type)
            if status_filter:
                filters.append(SettlementBatch.status == status_filter)
            else:
                filters.append(
                    SettlementBatch.status.notin_([SettlementStatus.SETTLED, SettlementStatus.FAILED])
                )

            if filters:
                query = query.where(and_(*filters))

            query = query.order_by(SettlementBatch.expected_settlement_date.asc())
            result = await db.execute(query)
            return list(result.scalars().all())

        except Exception as e:
            raise handle_database_error(e, "get pending settlements", logger)

    @staticmethod
    def calculate_settlement_progress(settlement: SettlementBatch) -> int:
        """Calculate progress percentage (0-100)"""
        status_weights = {
            SettlementStatus.PENDING: 0,
            SettlementStatus.TRANSFER_INITIATED: 25,
            SettlementStatus.IN_TRANSIT: 50,
            SettlementStatus.AT_CUSTODY: 75,
            SettlementStatus.SETTLED: 100,
            SettlementStatus.FAILED: 0
        }
        return status_weights.get(settlement.status, 0)

    @staticmethod
    async def get_settlement_timeline(
        db: AsyncSession,
        settlement_id: UUID
    ) -> tuple[SettlementBatch, List[SettlementStatusHistory]]:
        """Get settlement with full status history"""
        try:
            result = await db.execute(
                select(SettlementBatch)
                .options(selectinload(SettlementBatch.status_history))
                .where(SettlementBatch.id == settlement_id)
            )
            settlement = result.scalar_one_or_none()

            if not settlement:
                raise ValueError(f"Settlement {settlement_id} not found")

            # Get status history ordered by timestamp
            history_result = await db.execute(
                select(SettlementStatusHistory)
                .where(SettlementStatusHistory.settlement_batch_id == settlement_id)
                .order_by(SettlementStatusHistory.created_at.asc())
            )
            history = list(history_result.scalars().all())

            return settlement, history

        except Exception as e:
            raise handle_database_error(e, "get settlement timeline", logger)


# Module-level wrapper functions for API compatibility
async def get_pending_settlements(
    db: AsyncSession,
    entity_id: Optional[UUID] = None,
    settlement_type: Optional[SettlementType] = None,
    status: Optional[SettlementStatus] = None
) -> List[SettlementBatch]:
    """Wrapper for SettlementService.get_pending_settlements()"""
    return await SettlementService.get_pending_settlements(
        db=db,
        entity_id=entity_id,
        settlement_type=settlement_type,
        status_filter=status
    )


async def get_settlement_timeline(
    db: AsyncSession,
    settlement_id: UUID
) -> tuple[SettlementBatch, List[SettlementStatusHistory]]:
    """Wrapper for SettlementService.get_settlement_timeline()"""
    return await SettlementService.get_settlement_timeline(db, settlement_id)


def calculate_settlement_progress(settlement: SettlementBatch) -> int:
    """Wrapper for SettlementService.calculate_settlement_progress()"""
    return SettlementService.calculate_settlement_progress(settlement)
