"""Market Maker management service"""
import uuid
from decimal import Decimal
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.models import (
    MarketMakerClient, User, UserRole, AssetTransaction,
    TransactionType, CertificateType, TicketStatus, Order, OrderStatus,
    MarketMakerType
)
from app.core.security import hash_password
from app.services.ticket_service import TicketService
import logging

logger = logging.getLogger(__name__)


class MarketMakerService:
    """Service for managing Market Maker clients"""

    @staticmethod
    async def create_market_maker(
        db: AsyncSession,
        name: str,
        email: str,
        description: Optional[str],
        created_by_id: uuid.UUID,
        mm_type: MarketMakerType = MarketMakerType.ASSET_HOLDER,
        initial_balances: Optional[Dict[str, Decimal]] = None,
        initial_eur_balance: Optional[Decimal] = None,
    ) -> tuple[MarketMakerClient, str]:
        """
        Create Market Maker client with associated User
        Returns: (MarketMakerClient, ticket_id)
        """
        # Create user with MARKET_MAKER role
        user = User(
            email=email,
            password_hash=hash_password(str(uuid.uuid4())),  # Random password
            first_name=name,
            last_name="Market Maker",
            role=UserRole.MARKET_MAKER,
            is_active=True,
            must_change_password=False,
        )
        db.add(user)
        await db.flush()

        # Create MarketMakerClient
        mm_client = MarketMakerClient(
            user_id=user.id,
            name=name,
            description=description,
            is_active=True,
            created_by=created_by_id,
            mm_type=mm_type,
            eur_balance=initial_eur_balance if initial_eur_balance else Decimal("0"),
        )
        db.add(mm_client)
        await db.flush()

        # Create audit ticket
        ticket = await TicketService.create_ticket(
            db=db,
            action_type="MM_CREATED",
            entity_type="MarketMaker",
            entity_id=mm_client.id,
            status=TicketStatus.SUCCESS,
            user_id=created_by_id,
            market_maker_id=mm_client.id,
            request_payload={
                "name": name,
                "email": email,
                "description": description,
                "mm_type": mm_type.value,
                "initial_eur_balance": str(initial_eur_balance) if initial_eur_balance else None,
            },
            after_state={
                "id": str(mm_client.id),
                "name": name,
                "is_active": True,
                "mm_type": mm_type.value,
                "eur_balance": str(mm_client.eur_balance),
            },
            tags=["market_maker", "creation"],
        )

        # Create initial balance transactions if provided
        if initial_balances:
            for cert_type_str, amount in initial_balances.items():
                cert_type = CertificateType(cert_type_str)
                await MarketMakerService.create_transaction(
                    db=db,
                    market_maker_id=mm_client.id,
                    certificate_type=cert_type,
                    transaction_type=TransactionType.DEPOSIT,
                    amount=amount,
                    notes="Initial funding",
                    created_by_id=created_by_id,
                    parent_ticket_id=ticket.ticket_id,
                )

        await db.commit()
        await db.refresh(mm_client)

        return mm_client, ticket.ticket_id

    @staticmethod
    async def create_transaction(
        db: AsyncSession,
        market_maker_id: uuid.UUID,
        certificate_type: CertificateType,
        transaction_type: TransactionType,
        amount: Decimal,
        notes: Optional[str],
        created_by_id: uuid.UUID,
        parent_ticket_id: Optional[str] = None,
    ) -> tuple[AssetTransaction, str]:
        """
        Create asset transaction and calculate new balance
        Returns: (AssetTransaction, ticket_id)
        """
        # Calculate new balance from transaction history
        result = await db.execute(
            select(func.coalesce(func.sum(AssetTransaction.amount), 0))
            .where(
                and_(
                    AssetTransaction.market_maker_id == market_maker_id,
                    AssetTransaction.certificate_type == certificate_type,
                )
            )
        )
        current_balance = result.scalar() or Decimal("0")
        new_balance = current_balance + amount

        # Create ticket first
        ticket = await TicketService.create_ticket(
            db=db,
            action_type=f"ASSET_{transaction_type.value}",
            entity_type="AssetTransaction",
            entity_id=None,  # Will set after creating transaction
            status=TicketStatus.SUCCESS,
            user_id=created_by_id,
            market_maker_id=market_maker_id,
            request_payload={
                "certificate_type": certificate_type.value,
                "transaction_type": transaction_type.value,
                "amount": str(amount),
            },
            after_state={
                "balance_after": str(new_balance),
                "previous_balance": str(current_balance),
            },
            related_ticket_ids=[parent_ticket_id] if parent_ticket_id else [],
            tags=["asset_transaction", transaction_type.value.lower()],
        )

        # Create transaction
        transaction = AssetTransaction(
            ticket_id=ticket.ticket_id,
            market_maker_id=market_maker_id,
            certificate_type=certificate_type,
            transaction_type=transaction_type,
            amount=amount,
            balance_after=new_balance,
            notes=notes,
            created_by=created_by_id,
        )
        db.add(transaction)
        await db.flush()

        # Update ticket with transaction ID
        ticket.entity_id = transaction.id
        await db.commit()
        await db.refresh(transaction)

        return transaction, ticket.ticket_id

    @staticmethod
    async def get_balances(
        db: AsyncSession,
        market_maker_id: uuid.UUID,
    ) -> Dict[str, Dict[str, Decimal]]:
        """
        Get current balances (available, locked, total) for all certificate types
        Returns: {CEA: {available: 5000, locked: 1500, total: 6500}, ...}
        """
        balances = {}

        for cert_type in CertificateType:
            # Total balance from transactions
            result = await db.execute(
                select(func.coalesce(func.sum(AssetTransaction.amount), 0))
                .where(
                    and_(
                        AssetTransaction.market_maker_id == market_maker_id,
                        AssetTransaction.certificate_type == cert_type,
                    )
                )
            )
            total = result.scalar() or Decimal("0")

            # Locked in active orders
            result = await db.execute(
                select(func.coalesce(func.sum(Order.quantity - Order.filled_quantity), 0))
                .where(
                    and_(
                        Order.market_maker_id == market_maker_id,
                        Order.certificate_type == cert_type,
                        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
                    )
                )
            )
            locked = result.scalar() or Decimal("0")

            available = total - locked

            balances[cert_type.value] = {
                "available": available,
                "locked": locked,
                "total": total,
            }

        return balances

    @staticmethod
    async def validate_sufficient_balance(
        db: AsyncSession,
        market_maker_id: uuid.UUID,
        certificate_type: CertificateType,
        required_amount: Decimal,
    ) -> bool:
        """Check if MM has sufficient available balance"""
        balances = await MarketMakerService.get_balances(db, market_maker_id)
        available = balances[certificate_type.value]["available"]
        return available >= required_amount
