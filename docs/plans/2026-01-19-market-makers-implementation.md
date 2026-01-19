# Market Makers System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement admin-controlled Market Maker clients with transaction-based asset management and comprehensive audit logging with ticket IDs.

**Architecture:** Market Makers are Users with special role. Transaction-based asset tracking (no direct balance editing). Logging middleware intercepts all actions and creates audit tickets. Three new backoffice tabs for MM management, order placement, and audit viewing.

**Tech Stack:** FastAPI, SQLAlchemy (async), PostgreSQL, React, TypeScript, Redis (for ticket ID counter)

---

## Phase 1: Database Models & Migrations

### Task 1: Add MARKET_MAKER role to User enum

**Files:**
- Modify: `backend/app/models/models.py` (UserRole enum)
- Test: Manual verification after migration

**Step 1: Add MARKET_MAKER to UserRole enum**

In `backend/app/models/models.py`, find the UserRole enum and add:

```python
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    APPROVED = "APPROVED"
    FUNDED = "FUNDED"
    MARKET_MAKER = "MARKET_MAKER"  # Add this line
```

**Step 2: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add MARKET_MAKER role to UserRole enum

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create MarketMakerClient model

**Files:**
- Modify: `backend/app/models/models.py` (add new model after User)
- Test: Migration will verify

**Step 1: Add MarketMakerClient model**

Add after the User model in `backend/app/models/models.py`:

```python
class MarketMakerClient(Base):
    """Market Maker client managed by admin"""
    __tablename__ = "market_maker_clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Display name like "MM-Alpha"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="market_maker_client")
    creator = relationship("User", foreign_keys=[created_by])
    transactions = relationship("AssetTransaction", back_populates="market_maker", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="market_maker")
```

**Step 2: Add back_populates to User model**

In User model, add:

```python
market_maker_client = relationship("MarketMakerClient", foreign_keys="[MarketMakerClient.user_id]", back_populates="user", uselist=False)
```

**Step 3: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add MarketMakerClient model

Transaction-based MM management linked to User

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create AssetTransaction model

**Files:**
- Modify: `backend/app/models/models.py`

**Step 1: Add TransactionType enum**

Add before AssetTransaction model:

```python
class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRADE_DEBIT = "TRADE_DEBIT"  # Locks assets when order placed
    TRADE_CREDIT = "TRADE_CREDIT"  # Releases assets when order cancelled/filled
```

**Step 2: Add AssetTransaction model**

```python
class AssetTransaction(Base):
    """Asset transaction history for Market Makers"""
    __tablename__ = "asset_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(30), nullable=False, index=True)  # Links to TicketLog
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=False, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)  # Positive for deposits/credits, negative for debits/withdrawals
    balance_after = Column(Numeric(18, 2), nullable=False)  # Running balance
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    market_maker = relationship("MarketMakerClient", back_populates="transactions")
    creator = relationship("User", foreign_keys=[created_by])
```

**Step 3: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add AssetTransaction model

Transaction-based asset tracking with running balance

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create TicketLog model

**Files:**
- Modify: `backend/app/models/models.py`

**Step 1: Add TicketStatus enum**

```python
class TicketStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
```

**Step 2: Add TicketLog model**

```python
class TicketLog(Base):
    """Comprehensive audit trail for all system actions"""
    __tablename__ = "ticket_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(30), unique=True, nullable=False, index=True)  # TKT-2026-001234
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
    action_type = Column(String(100), nullable=False, index=True)  # ORDER_PLACED, MM_CREATED, etc.
    entity_type = Column(String(50), nullable=False, index=True)  # Order, MarketMaker, User, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(SQLEnum(TicketStatus), nullable=False, index=True)
    request_payload = Column(JSONB, nullable=True)
    response_data = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("user_sessions.id"), nullable=True)
    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    related_ticket_ids = Column(ARRAY(String(30)), nullable=True)
    tags = Column(ARRAY(String(50)), nullable=True, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    market_maker = relationship("MarketMakerClient", foreign_keys=[market_maker_id])
    session = relationship("UserSession", foreign_keys=[session_id])
```

**Step 3: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add TicketLog model for audit trail

Complete audit with payload, state tracking, relations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Modify Order model to include market_maker_id and ticket_id

**Files:**
- Modify: `backend/app/models/models.py` (Order model)

**Step 1: Add columns to Order model**

In Order model, add these columns:

```python
market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
ticket_id = Column(String(30), nullable=True, index=True)  # Link to audit log
```

**Step 2: Add relationship**

```python
market_maker = relationship("MarketMakerClient", back_populates="orders")
```

**Step 3: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add market_maker_id and ticket_id to Order

Tracks MM orders and links to audit

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Modify CashMarketTrade model

**Files:**
- Modify: `backend/app/models/models.py` (CashMarketTrade model)

**Step 1: Add columns**

```python
market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
ticket_id = Column(String(30), nullable=True, index=True)
```

**Step 2: Add relationship**

```python
market_maker = relationship("MarketMakerClient")
```

**Step 3: Commit**

```bash
git add backend/app/models/models.py
git commit -m "feat: add market_maker_id and ticket_id to CashMarketTrade

Tracks MM involvement in trades

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Create Alembic migration

**Files:**
- Create: `backend/alembic/versions/XXXX_add_market_makers.py`

**Step 1: Generate migration**

```bash
cd backend
alembic revision --autogenerate -m "add market makers and audit logging"
```

**Step 2: Review generated migration**

Check the generated file in `backend/alembic/versions/` and ensure it includes:
- New tables: market_maker_clients, asset_transactions, ticket_logs
- Modified tables: users (MARKET_MAKER enum), orders (new columns), cash_market_trades (new columns)

**Step 3: Run migration**

```bash
alembic upgrade head
```

Expected: Migration successful, all tables created

**Step 4: Commit**

```bash
git add backend/alembic/versions/*
git commit -m "feat: add database migration for market makers

Creates MM tables, modifies orders/trades

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Backend Services

### Task 8: Create TicketService

**Files:**
- Create: `backend/app/services/ticket_service.py`
- Test: Manual verification (will test via API later)

**Step 1: Create ticket_service.py**

```python
"""Ticket generation and audit logging service"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import TicketLog, TicketStatus
from app.core.security import RedisManager
import logging

logger = logging.getLogger(__name__)


class TicketService:
    """Service for generating ticket IDs and managing audit logs"""

    @staticmethod
    async def generate_ticket_id() -> str:
        """
        Generate unique ticket ID: TKT-YYYY-NNNNNN
        Uses Redis counter for atomic increment
        """
        year = datetime.utcnow().year
        redis = RedisManager.get_redis()

        # Atomic increment counter for this year
        counter_key = f"ticket_counter:{year}"
        counter = await redis.incr(counter_key)

        # Set expiry on first creation (end of next year)
        if counter == 1:
            await redis.expire(counter_key, 60 * 60 * 24 * 400)  # ~13 months

        ticket_id = f"TKT-{year}-{counter:06d}"
        return ticket_id

    @staticmethod
    async def create_ticket(
        db: AsyncSession,
        action_type: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID],
        status: TicketStatus,
        user_id: Optional[uuid.UUID] = None,
        market_maker_id: Optional[uuid.UUID] = None,
        request_payload: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[uuid.UUID] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        related_ticket_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> TicketLog:
        """Create audit ticket"""
        ticket_id = await TicketService.generate_ticket_id()

        ticket = TicketLog(
            ticket_id=ticket_id,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            market_maker_id=market_maker_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status,
            request_payload=request_payload,
            response_data=response_data,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            before_state=before_state,
            after_state=after_state,
            related_ticket_ids=related_ticket_ids or [],
            tags=tags or [],
        )

        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)

        logger.info(f"Created ticket {ticket_id} for {action_type} on {entity_type}")
        return ticket

    @staticmethod
    async def get_entity_state(
        db: AsyncSession,
        entity_type: str,
        entity_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """Get current state of entity for before/after tracking"""
        # Import here to avoid circular imports
        from app.models.models import Order, User, MarketMakerClient, AssetTransaction

        model_map = {
            "Order": Order,
            "User": User,
            "MarketMaker": MarketMakerClient,
            "AssetTransaction": AssetTransaction,
        }

        model = model_map.get(entity_type)
        if not model:
            return None

        result = await db.execute(select(model).where(model.id == entity_id))
        entity = result.scalar_one_or_none()

        if not entity:
            return None

        # Convert to dict, excluding relationships
        state = {}
        for column in model.__table__.columns:
            value = getattr(entity, column.name)
            # Convert non-serializable types
            if isinstance(value, uuid.UUID):
                state[column.name] = str(value)
            elif isinstance(value, datetime):
                state[column.name] = value.isoformat()
            else:
                state[column.name] = value

        return state
```

**Step 2: Commit**

```bash
git add backend/app/services/ticket_service.py
git commit -m "feat: add TicketService for audit logging

Generates unique ticket IDs, creates audit entries

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Create MarketMakerService

**Files:**
- Create: `backend/app/services/market_maker_service.py`

**Step 1: Create market_maker_service.py**

```python
"""Market Maker management service"""
import uuid
from decimal import Decimal
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.models import (
    MarketMakerClient, User, UserRole, AssetTransaction,
    TransactionType, CertificateType, TicketStatus, Order, OrderStatus
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
        initial_balances: Optional[Dict[str, Decimal]] = None,
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
            request_payload={"name": name, "email": email, "description": description},
            after_state={"id": str(mm_client.id), "name": name, "is_active": True},
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
                        Order.status.in_([OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED]),
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
```

**Step 2: Commit**

```bash
git add backend/app/services/market_maker_service.py
git commit -m "feat: add MarketMakerService

Create MM, manage transactions, calculate balances

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: API Schemas

### Task 10: Create Pydantic schemas for Market Makers

**Files:**
- Modify: `backend/app/schemas/schemas.py`

**Step 1: Add MarketMaker schemas**

Add to `backend/app/schemas/schemas.py`:

```python
# Market Maker Schemas
class MarketMakerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    description: Optional[str] = None
    initial_balances: Optional[Dict[str, Decimal]] = None  # {CEA: 10000, EUA: 5000}


class MarketMakerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MarketMakerBalance(BaseModel):
    available: Decimal
    locked: Decimal
    total: Decimal


class MarketMakerResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    is_active: bool
    current_balances: Dict[str, MarketMakerBalance]  # {CEA: {...}, EUA: {...}}
    total_orders: int = 0
    total_trades: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Asset Transaction Schemas
class AssetTransactionCreate(BaseModel):
    certificate_type: str  # CEA, EUA
    transaction_type: str  # DEPOSIT, WITHDRAWAL
    amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class AssetTransactionResponse(BaseModel):
    id: UUID
    ticket_id: str
    market_maker_id: UUID
    certificate_type: str
    transaction_type: str
    amount: Decimal
    balance_after: Decimal
    notes: Optional[str]
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Market Order (Admin) Schemas
class MarketOrderCreate(BaseModel):
    market_maker_id: UUID
    certificate_type: str  # CEA, EUA
    side: str = Field(..., pattern="^SELL$")  # Only SELL allowed
    order_type: str = "LIMIT"
    price: Decimal = Field(..., gt=0)
    quantity: Decimal = Field(..., gt=0)


# Ticket Log Schemas
class TicketLogResponse(BaseModel):
    id: UUID
    ticket_id: str
    timestamp: datetime
    user_id: Optional[UUID]
    market_maker_id: Optional[UUID]
    action_type: str
    entity_type: str
    entity_id: Optional[UUID]
    status: str
    request_payload: Optional[Dict[str, Any]]
    response_data: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    before_state: Optional[Dict[str, Any]]
    after_state: Optional[Dict[str, Any]]
    related_ticket_ids: List[str]
    tags: List[str]

    class Config:
        from_attributes = True


class TicketLogStats(BaseModel):
    total_actions: int
    success_count: int
    failed_count: int
    by_action_type: Dict[str, int]
    by_user: List[Dict[str, Any]]
    actions_over_time: List[Dict[str, Any]]
```

**Step 2: Commit**

```bash
git add backend/app/schemas/schemas.py
git commit -m "feat: add Pydantic schemas for Market Makers

MM, transactions, orders, tickets

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: API Endpoints

### Task 11: Create Market Makers API endpoints

**Files:**
- Create: `backend/app/api/v1/market_maker.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/app/main.py`

**Step 1: Create market_maker.py**

```python
"""Market Maker management endpoints (Admin only)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.models import (
    User, MarketMakerClient, AssetTransaction, Order, CashMarketTrade
)
from app.schemas.schemas import (
    MarketMakerCreate, MarketMakerUpdate, MarketMakerResponse,
    AssetTransactionCreate, AssetTransactionResponse,
    MessageResponse, MarketMakerBalance
)
from app.services.market_maker_service import MarketMakerService
from app.services.ticket_service import TicketService, TicketStatus
from app.models.models import CertificateType, TransactionType

router = APIRouter(prefix="/market-makers", tags=["Market Makers (Admin)"])


@router.get("", response_model=List[MarketMakerResponse])
async def list_market_makers(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all market makers with balances and stats"""
    result = await db.execute(select(MarketMakerClient))
    mm_clients = result.scalars().all()

    responses = []
    for mm in mm_clients:
        # Get balances
        balances = await MarketMakerService.get_balances(db, mm.id)
        balance_objs = {
            cert_type: MarketMakerBalance(**balance_data)
            for cert_type, balance_data in balances.items()
        }

        # Get order count
        order_result = await db.execute(
            select(func.count(Order.id)).where(Order.market_maker_id == mm.id)
        )
        total_orders = order_result.scalar() or 0

        # Get trade count
        trade_result = await db.execute(
            select(func.count(CashMarketTrade.id)).where(CashMarketTrade.market_maker_id == mm.id)
        )
        total_trades = trade_result.scalar() or 0

        responses.append(MarketMakerResponse(
            id=mm.id,
            user_id=mm.user_id,
            name=mm.name,
            description=mm.description,
            is_active=mm.is_active,
            current_balances=balance_objs,
            total_orders=total_orders,
            total_trades=total_trades,
            created_at=mm.created_at,
            updated_at=mm.updated_at,
        ))

    return responses


@router.post("", response_model=dict)
async def create_market_maker(
    data: MarketMakerCreate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new market maker"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    mm_client, ticket_id = await MarketMakerService.create_market_maker(
        db=db,
        name=data.name,
        email=data.email,
        description=data.description,
        created_by_id=current_user.id,
        initial_balances=data.initial_balances,
    )

    # Get full response
    balances = await MarketMakerService.get_balances(db, mm_client.id)
    balance_objs = {
        cert_type: MarketMakerBalance(**balance_data)
        for cert_type, balance_data in balances.items()
    }

    return {
        "market_maker": MarketMakerResponse(
            id=mm_client.id,
            user_id=mm_client.user_id,
            name=mm_client.name,
            description=mm_client.description,
            is_active=mm_client.is_active,
            current_balances=balance_objs,
            total_orders=0,
            total_trades=0,
            created_at=mm_client.created_at,
            updated_at=mm_client.updated_at,
        ),
        "ticket_id": ticket_id
    }


@router.put("/{mm_id}", response_model=dict)
async def update_market_maker(
    mm_id: UUID,
    data: MarketMakerUpdate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update market maker details"""
    result = await db.execute(select(MarketMakerClient).where(MarketMakerClient.id == mm_id))
    mm = result.scalar_one_or_none()
    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    # Get before state
    before_state = await TicketService.get_entity_state(db, "MarketMaker", mm_id)

    # Update fields
    if data.name is not None:
        mm.name = data.name
    if data.description is not None:
        mm.description = data.description
    if data.is_active is not None:
        mm.is_active = data.is_active

    await db.flush()

    # Get after state
    after_state = await TicketService.get_entity_state(db, "MarketMaker", mm_id)

    # Create ticket
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_UPDATED",
        entity_type="MarketMaker",
        entity_id=mm_id,
        status=TicketStatus.SUCCESS,
        user_id=current_user.id,
        market_maker_id=mm_id,
        request_payload=data.dict(exclude_unset=True),
        before_state=before_state,
        after_state=after_state,
        tags=["market_maker", "update"],
    )

    await db.commit()
    await db.refresh(mm)

    # Get full response
    balances = await MarketMakerService.get_balances(db, mm.id)
    balance_objs = {
        cert_type: MarketMakerBalance(**balance_data)
        for cert_type, balance_data in balances.items()
    }

    order_result = await db.execute(
        select(func.count(Order.id)).where(Order.market_maker_id == mm.id)
    )
    total_orders = order_result.scalar() or 0

    trade_result = await db.execute(
        select(func.count(CashMarketTrade.id)).where(CashMarketTrade.market_maker_id == mm.id)
    )
    total_trades = trade_result.scalar() or 0

    return {
        "market_maker": MarketMakerResponse(
            id=mm.id,
            user_id=mm.user_id,
            name=mm.name,
            description=mm.description,
            is_active=mm.is_active,
            current_balances=balance_objs,
            total_orders=total_orders,
            total_trades=total_trades,
            created_at=mm.created_at,
            updated_at=mm.updated_at,
        ),
        "ticket_id": ticket.ticket_id
    }


@router.delete("/{mm_id}", response_model=dict)
async def delete_market_maker(
    mm_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete market maker (set is_active = False)"""
    result = await db.execute(select(MarketMakerClient).where(MarketMakerClient.id == mm_id))
    mm = result.scalar_one_or_none()
    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    before_state = await TicketService.get_entity_state(db, "MarketMaker", mm_id)

    mm.is_active = False
    await db.flush()

    after_state = await TicketService.get_entity_state(db, "MarketMaker", mm_id)

    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_DELETED",
        entity_type="MarketMaker",
        entity_id=mm_id,
        status=TicketStatus.SUCCESS,
        user_id=current_user.id,
        market_maker_id=mm_id,
        before_state=before_state,
        after_state=after_state,
        tags=["market_maker", "deletion"],
    )

    await db.commit()

    return {"success": True, "ticket_id": ticket.ticket_id}


@router.get("/{mm_id}/transactions", response_model=List[AssetTransactionResponse])
async def list_transactions(
    mm_id: UUID,
    certificate_type: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List transaction history for market maker"""
    query = select(AssetTransaction).where(AssetTransaction.market_maker_id == mm_id)

    if certificate_type:
        query = query.where(AssetTransaction.certificate_type == CertificateType(certificate_type))

    query = query.order_by(AssetTransaction.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return [
        AssetTransactionResponse(
            id=tx.id,
            ticket_id=tx.ticket_id,
            market_maker_id=tx.market_maker_id,
            certificate_type=tx.certificate_type.value,
            transaction_type=tx.transaction_type.value,
            amount=tx.amount,
            balance_after=tx.balance_after,
            notes=tx.notes,
            created_by=tx.created_by,
            created_at=tx.created_at,
        )
        for tx in transactions
    ]


@router.post("/{mm_id}/transactions", response_model=dict)
async def create_transaction(
    mm_id: UUID,
    data: AssetTransactionCreate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create asset transaction (deposit/withdrawal)"""
    # Verify MM exists
    result = await db.execute(select(MarketMakerClient).where(MarketMakerClient.id == mm_id))
    mm = result.scalar_one_or_none()
    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")
    if not mm.is_active:
        raise HTTPException(status_code=400, detail="Market Maker is not active")

    # Validate transaction type
    if data.transaction_type not in ["DEPOSIT", "WITHDRAWAL"]:
        raise HTTPException(status_code=400, detail="Only DEPOSIT and WITHDRAWAL allowed")

    # For withdrawals, check sufficient balance
    if data.transaction_type == "WITHDRAWAL":
        balances = await MarketMakerService.get_balances(db, mm_id)
        available = balances[data.certificate_type]["available"]
        if available < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient available balance")

    # Create transaction (negative amount for withdrawal)
    amount = data.amount if data.transaction_type == "DEPOSIT" else -data.amount

    transaction, ticket_id = await MarketMakerService.create_transaction(
        db=db,
        market_maker_id=mm_id,
        certificate_type=CertificateType(data.certificate_type),
        transaction_type=TransactionType(data.transaction_type),
        amount=amount,
        notes=data.notes,
        created_by_id=current_user.id,
    )

    # Get new balance
    balances = await MarketMakerService.get_balances(db, mm_id)

    return {
        "transaction": AssetTransactionResponse(
            id=transaction.id,
            ticket_id=transaction.ticket_id,
            market_maker_id=transaction.market_maker_id,
            certificate_type=transaction.certificate_type.value,
            transaction_type=transaction.transaction_type.value,
            amount=transaction.amount,
            balance_after=transaction.balance_after,
            notes=transaction.notes,
            created_by=transaction.created_by,
            created_at=transaction.created_at,
        ),
        "new_balance": balances[data.certificate_type],
        "ticket_id": ticket_id
    }


@router.get("/{mm_id}/balances", response_model=Dict[str, MarketMakerBalance])
async def get_balances(
    mm_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current balances for market maker"""
    result = await db.execute(select(MarketMakerClient).where(MarketMakerClient.id == mm_id))
    mm = result.scalar_one_or_none()
    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")

    balances = await MarketMakerService.get_balances(db, mm_id)

    return {
        cert_type: MarketMakerBalance(**balance_data)
        for cert_type, balance_data in balances.items()
    }
```

**Step 2: Register router in __init__.py**

In `backend/app/api/v1/__init__.py`, add:

```python
from . import market_maker
```

**Step 3: Include router in main.py**

In `backend/app/main.py`, add to the router includes:

```python
app.include_router(market_maker.router, prefix="/api/v1/admin")
```

**Step 4: Commit**

```bash
git add backend/app/api/v1/market_maker.py backend/app/api/v1/__init__.py backend/app/main.py
git commit -m "feat: add Market Maker API endpoints

CRUD, transactions, balances with audit logging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: Market Orders API (Admin placing orders on behalf of MM)

### Task 12: Create Market Orders API endpoints

**Files:**
- Create: `backend/app/api/v1/admin_market_orders.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/app/main.py`

**Step 1: Create admin_market_orders.py**

```python
"""Admin Market Orders - Place orders on behalf of Market Makers"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.models import (
    User, MarketMakerClient, Order, OrderSide, OrderType, OrderStatus,
    CertificateType, TransactionType, TicketStatus
)
from app.schemas.schemas import (
    MarketOrderCreate, OrderResponse, MessageResponse, OrderBookResponse
)
from app.services.market_maker_service import MarketMakerService
from app.services.ticket_service import TicketService

router = APIRouter(prefix="/market-orders", tags=["Market Orders (Admin)"])


@router.get("/orderbook", response_model=OrderBookResponse)
async def get_orderbook_replica(
    certificate_type: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order book (replica of public cash market)"""
    # Import here to avoid circular import
    from app.api.v1.cash_market import get_order_book

    # Reuse existing order book logic
    return await get_order_book(certificate_type, db)


@router.post("", response_model=dict)
async def place_market_maker_order(
    data: MarketOrderCreate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin places sell order on behalf of Market Maker"""
    # Validate MM exists and is active
    result = await db.execute(
        select(MarketMakerClient).where(MarketMakerClient.id == data.market_maker_id)
    )
    mm = result.scalar_one_or_none()
    if not mm:
        raise HTTPException(status_code=404, detail="Market Maker not found")
    if not mm.is_active:
        raise HTTPException(status_code=400, detail="Market Maker is not active")

    # Validate certificate type
    try:
        cert_type = CertificateType(data.certificate_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid certificate type")

    # Validate side is SELL only
    if data.side != "SELL":
        raise HTTPException(status_code=400, detail="Only SELL orders allowed for Market Makers")

    # Check sufficient balance
    has_balance = await MarketMakerService.validate_sufficient_balance(
        db=db,
        market_maker_id=mm.id,
        certificate_type=cert_type,
        required_amount=data.quantity,
    )
    if not has_balance:
        raise HTTPException(status_code=400, detail="Insufficient available balance")

    # Create order
    order = Order(
        entity_id=mm.user.entity_id if mm.user.entity_id else None,
        user_id=mm.user_id,
        market_maker_id=mm.id,
        certificate_type=cert_type,
        side=OrderSide.SELL,
        order_type=OrderType.LIMIT,
        price=data.price,
        quantity=data.quantity,
        filled_quantity=Decimal("0"),
        status=OrderStatus.PENDING,
    )
    db.add(order)
    await db.flush()

    # Lock assets via TRADE_DEBIT transaction
    transaction, tx_ticket_id = await MarketMakerService.create_transaction(
        db=db,
        market_maker_id=mm.id,
        certificate_type=cert_type,
        transaction_type=TransactionType.TRADE_DEBIT,
        amount=-data.quantity,  # Negative = debit
        notes=f"Locked for order {order.id}",
        created_by_id=current_user.id,
    )

    # Create audit ticket for order placement
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_ORDER_PLACED",
        entity_type="Order",
        entity_id=order.id,
        status=TicketStatus.SUCCESS,
        user_id=current_user.id,
        market_maker_id=mm.id,
        request_payload={
            "market_maker_id": str(mm.id),
            "certificate_type": data.certificate_type,
            "price": str(data.price),
            "quantity": str(data.quantity),
        },
        after_state={
            "order_id": str(order.id),
            "status": order.status.value,
        },
        related_ticket_ids=[tx_ticket_id],
        tags=["market_maker", "order", "placement"],
    )

    # Link ticket to order
    order.ticket_id = ticket.ticket_id
    await db.commit()
    await db.refresh(order)

    return {
        "order": OrderResponse(
            id=order.id,
            entity_id=order.entity_id,
            user_id=order.user_id,
            market_maker_id=order.market_maker_id,
            certificate_type=order.certificate_type.value,
            side=order.side.value,
            order_type=order.order_type.value,
            price=order.price,
            quantity=order.quantity,
            filled_quantity=order.filled_quantity,
            status=order.status.value,
            created_at=order.created_at,
            updated_at=order.updated_at,
        ),
        "ticket_id": ticket.ticket_id
    }


@router.get("", response_model=List[OrderResponse])
async def list_market_maker_orders(
    market_maker_id: UUID = None,
    status: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all Market Maker orders"""
    query = select(Order).where(Order.market_maker_id.isnot(None))

    if market_maker_id:
        query = query.where(Order.market_maker_id == market_maker_id)

    if status:
        query = query.where(Order.status == OrderStatus(status))

    query = query.order_by(Order.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        OrderResponse(
            id=order.id,
            entity_id=order.entity_id,
            user_id=order.user_id,
            market_maker_id=order.market_maker_id,
            certificate_type=order.certificate_type.value,
            side=order.side.value,
            order_type=order.order_type.value,
            price=order.price,
            quantity=order.quantity,
            filled_quantity=order.filled_quantity,
            status=order.status.value,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )
        for order in orders
    ]


@router.delete("/{order_id}", response_model=dict)
async def cancel_market_maker_order(
    order_id: UUID,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel Market Maker order and release locked assets"""
    result = await db.execute(
        select(Order).where(
            and_(
                Order.id == order_id,
                Order.market_maker_id.isnot(None)
            )
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Market Maker order not found")

    if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")

    # Get before state
    before_state = await TicketService.get_entity_state(db, "Order", order_id)

    # Cancel order
    unfilled_quantity = order.quantity - order.filled_quantity
    order.status = OrderStatus.CANCELLED

    await db.flush()

    # Release locked assets via TRADE_CREDIT
    transaction, tx_ticket_id = await MarketMakerService.create_transaction(
        db=db,
        market_maker_id=order.market_maker_id,
        certificate_type=order.certificate_type,
        transaction_type=TransactionType.TRADE_CREDIT,
        amount=unfilled_quantity,  # Positive = credit
        notes=f"Released from cancelled order {order.id}",
        created_by_id=current_user.id,
    )

    # Get after state
    after_state = await TicketService.get_entity_state(db, "Order", order_id)

    # Create audit ticket
    ticket = await TicketService.create_ticket(
        db=db,
        action_type="MM_ORDER_CANCELLED",
        entity_type="Order",
        entity_id=order_id,
        status=TicketStatus.SUCCESS,
        user_id=current_user.id,
        market_maker_id=order.market_maker_id,
        before_state=before_state,
        after_state=after_state,
        related_ticket_ids=[tx_ticket_id],
        tags=["market_maker", "order", "cancellation"],
    )

    await db.commit()

    return {"success": True, "ticket_id": ticket.ticket_id}
```

**Step 2: Register router**

```bash
# In __init__.py
from . import admin_market_orders

# In main.py
app.include_router(admin_market_orders.router, prefix="/api/v1/admin")
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/admin_market_orders.py backend/app/api/v1/__init__.py backend/app/main.py
git commit -m "feat: add admin Market Orders API

Place/cancel orders on behalf of MM with asset locking

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 6: Logging API Endpoints

### Task 13: Create Logging API endpoints

**Files:**
- Create: `backend/app/api/v1/logging.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/app/main.py`

**Step 1: Create logging.py**

```python
"""Audit logging endpoints (Admin only)"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.models import User, TicketLog, TicketStatus
from app.schemas.schemas import TicketLogResponse, TicketLogStats

router = APIRouter(prefix="/logging", tags=["Audit Logging (Admin)"])


@router.get("/tickets", response_model=dict)
async def list_tickets(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    action_type: Optional[List[str]] = Query(None),
    user_id: Optional[UUID] = None,
    market_maker_id: Optional[UUID] = None,
    status: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    search: Optional[str] = None,  # Search in ticket_id or tags
    tags: Optional[List[str]] = Query(None),
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List audit tickets with filtering"""
    query = select(TicketLog)

    # Apply filters
    conditions = []

    if date_from:
        conditions.append(TicketLog.timestamp >= date_from)
    if date_to:
        conditions.append(TicketLog.timestamp <= date_to)
    if action_type:
        conditions.append(TicketLog.action_type.in_(action_type))
    if user_id:
        conditions.append(TicketLog.user_id == user_id)
    if market_maker_id:
        conditions.append(TicketLog.market_maker_id == market_maker_id)
    if status:
        conditions.append(TicketLog.status == TicketStatus(status))
    if entity_type:
        conditions.append(TicketLog.entity_type == entity_type)
    if entity_id:
        conditions.append(TicketLog.entity_id == entity_id)
    if search:
        conditions.append(
            or_(
                TicketLog.ticket_id.ilike(f"%{search}%"),
                TicketLog.tags.any(search)
            )
        )
    if tags:
        for tag in tags:
            conditions.append(TicketLog.tags.any(tag))

    if conditions:
        query = query.where(and_(*conditions))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.order_by(TicketLog.timestamp.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return {
        "total": total,
        "tickets": [
            TicketLogResponse(
                id=ticket.id,
                ticket_id=ticket.ticket_id,
                timestamp=ticket.timestamp,
                user_id=ticket.user_id,
                market_maker_id=ticket.market_maker_id,
                action_type=ticket.action_type,
                entity_type=ticket.entity_type,
                entity_id=ticket.entity_id,
                status=ticket.status.value,
                request_payload=ticket.request_payload,
                response_data=ticket.response_data,
                ip_address=ticket.ip_address,
                user_agent=ticket.user_agent,
                before_state=ticket.before_state,
                after_state=ticket.after_state,
                related_ticket_ids=ticket.related_ticket_ids or [],
                tags=ticket.tags or [],
            )
            for ticket in tickets
        ]
    }


@router.get("/tickets/{ticket_id}", response_model=TicketLogResponse)
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full ticket details"""
    result = await db.execute(select(TicketLog).where(TicketLog.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return TicketLogResponse(
        id=ticket.id,
        ticket_id=ticket.ticket_id,
        timestamp=ticket.timestamp,
        user_id=ticket.user_id,
        market_maker_id=ticket.market_maker_id,
        action_type=ticket.action_type,
        entity_type=ticket.entity_type,
        entity_id=ticket.entity_id,
        status=ticket.status.value,
        request_payload=ticket.request_payload,
        response_data=ticket.response_data,
        ip_address=ticket.ip_address,
        user_agent=ticket.user_agent,
        before_state=ticket.before_state,
        after_state=ticket.after_state,
        related_ticket_ids=ticket.related_ticket_ids or [],
        tags=ticket.tags or [],
    )


@router.get("/stats", response_model=TicketLogStats)
async def get_logging_stats(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics"""
    query_base = select(TicketLog)

    conditions = []
    if date_from:
        conditions.append(TicketLog.timestamp >= date_from)
    if date_to:
        conditions.append(TicketLog.timestamp <= date_to)

    if conditions:
        query_base = query_base.where(and_(*conditions))

    # Total actions
    total_result = await db.execute(select(func.count()).select_from(query_base.subquery()))
    total_actions = total_result.scalar()

    # Success/failed counts
    success_result = await db.execute(
        select(func.count())
        .select_from(query_base.where(TicketLog.status == TicketStatus.SUCCESS).subquery())
    )
    success_count = success_result.scalar()
    failed_count = total_actions - success_count

    # By action type
    action_type_result = await db.execute(
        select(TicketLog.action_type, func.count())
        .select_from(query_base.subquery())
        .group_by(TicketLog.action_type)
    )
    by_action_type = {row[0]: row[1] for row in action_type_result.all()}

    # By user
    user_result = await db.execute(
        select(TicketLog.user_id, User.email, func.count())
        .join(User, TicketLog.user_id == User.id, isouter=True)
        .where(TicketLog.user_id.isnot(None))
        .group_by(TicketLog.user_id, User.email)
        .order_by(func.count().desc())
        .limit(10)
    )
    by_user = [
        {"user_id": str(row[0]), "email": row[1], "count": row[2]}
        for row in user_result.all()
    ]

    # Actions over time (daily aggregation)
    # Simplified - just return empty for now, can enhance later
    actions_over_time = []

    return TicketLogStats(
        total_actions=total_actions,
        success_count=success_count,
        failed_count=failed_count,
        by_action_type=by_action_type,
        by_user=by_user,
        actions_over_time=actions_over_time,
    )


@router.get("/market-maker-actions", response_model=dict)
async def list_market_maker_actions(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List actions involving Market Makers (pre-filtered)"""
    query = select(TicketLog).where(TicketLog.market_maker_id.isnot(None))

    # Get total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated
    query = query.order_by(TicketLog.timestamp.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return {
        "total": total,
        "tickets": [
            TicketLogResponse(
                id=ticket.id,
                ticket_id=ticket.ticket_id,
                timestamp=ticket.timestamp,
                user_id=ticket.user_id,
                market_maker_id=ticket.market_maker_id,
                action_type=ticket.action_type,
                entity_type=ticket.entity_type,
                entity_id=ticket.entity_id,
                status=ticket.status.value,
                request_payload=ticket.request_payload,
                response_data=ticket.response_data,
                ip_address=ticket.ip_address,
                user_agent=ticket.user_agent,
                before_state=ticket.before_state,
                after_state=ticket.after_state,
                related_ticket_ids=ticket.related_ticket_ids or [],
                tags=ticket.tags or [],
            )
            for ticket in tickets
        ]
    }


@router.get("/failed-actions", response_model=dict)
async def list_failed_actions(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List failed actions (pre-filtered)"""
    query = select(TicketLog).where(TicketLog.status == TicketStatus.FAILED)

    # Get total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated
    query = query.order_by(TicketLog.timestamp.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return {
        "total": total,
        "tickets": [
            TicketLogResponse(
                id=ticket.id,
                ticket_id=ticket.ticket_id,
                timestamp=ticket.timestamp,
                user_id=ticket.user_id,
                market_maker_id=ticket.market_maker_id,
                action_type=ticket.action_type,
                entity_type=ticket.entity_type,
                entity_id=ticket.entity_id,
                status=ticket.status.value,
                request_payload=ticket.request_payload,
                response_data=ticket.response_data,
                ip_address=ticket.ip_address,
                user_agent=ticket.user_agent,
                before_state=ticket.before_state,
                after_state=ticket.after_state,
                related_ticket_ids=ticket.related_ticket_ids or [],
                tags=ticket.tags or [],
            )
            for ticket in tickets
        ]
    }
```

**Step 2: Register router**

```bash
# __init__.py and main.py
from . import logging
app.include_router(logging.router, prefix="/api/v1/admin")
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/logging.py backend/app/api/v1/__init__.py backend/app/main.py
git commit -m "feat: add Logging/Audit API endpoints

List tickets, stats, MM actions, failed actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 7: Frontend Implementation

**Note:** Frontend tasks are grouped by component. Each React component should be in its own file with proper TypeScript types.

### Task 14: Create Market Makers tab frontend

**Files:**
- Create: `frontend/src/pages/MarketMakersPage.tsx`
- Create: `frontend/src/components/backoffice/MarketMakersList.tsx`
- Create: `frontend/src/components/backoffice/CreateMarketMakerModal.tsx`
- Create: `frontend/src/components/backoffice/EditMarketMakerModal.tsx`
- Create: `frontend/src/components/backoffice/MarketMakerTransactions.tsx`
- Modify: `frontend/src/App.tsx` (add route)

**Implementation guidance:**
- Use existing patterns from BackofficePage.tsx
- Reuse DataTable component for lists
- Follow existing modal patterns
- Add proper TypeScript types
- Use React Query for API calls

**Step 1: Add API functions**

In `frontend/src/services/api.ts`:

```typescript
// Market Makers
export const getMarketMakers = () => api.get('/admin/market-makers');
export const createMarketMaker = (data: any) => api.post('/admin/market-makers', data);
export const updateMarketMaker = (id: string, data: any) => api.put(`/admin/market-makers/${id}`, data);
export const deleteMarketMaker = (id: string) => api.delete(`/admin/market-makers/${id}`);
export const getMarketMakerTransactions = (id: string, params?: any) =>
  api.get(`/admin/market-makers/${id}/transactions`, { params });
export const createTransaction = (id: string, data: any) =>
  api.post(`/admin/market-makers/${id}/transactions`, data);
export const getMarketMakerBalances = (id: string) =>
  api.get(`/admin/market-makers/${id}/balances`);
```

**Step 2: Create MarketMakersPage.tsx**

Follow the structure from existing pages, include:
- MarketMakersList component
- Create button → CreateMarketMakerModal
- Click row → EditMarketMakerModal + MarketMakerTransactions

**Step 3: Add route in App.tsx**

```typescript
<Route path="/backoffice/market-makers" element={
  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
    <MarketMakersPage />
  </ProtectedRoute>
} />
```

**Step 4: Commit**

```bash
git add frontend/src/pages/MarketMakersPage.tsx frontend/src/components/backoffice/* frontend/src/services/api.ts frontend/src/App.tsx
git commit -m "feat: add Market Makers frontend tab

List, create, edit MM, manage transactions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 15: Create Market Orders tab frontend

**Files:**
- Create: `frontend/src/pages/MarketOrdersPage.tsx`
- Create: `frontend/src/components/backoffice/OrderBookReplica.tsx`
- Create: `frontend/src/components/backoffice/MarketMakerOrderForm.tsx`
- Create: `frontend/src/components/backoffice/MarketMakerOrdersList.tsx`

**Implementation guidance:**
- Reuse existing OrderBook component from CashMarketPage
- Create standalone order entry form (not modal)
- List MM orders below the form

**Step 1: Add API functions**

```typescript
// Market Orders
export const getAdminOrderBook = (certificateType: string) =>
  api.get('/admin/market-orders/orderbook', { params: { certificate_type: certificateType } });
export const placeMarketMakerOrder = (data: any) =>
  api.post('/admin/market-orders', data);
export const getMarketMakerOrders = (params?: any) =>
  api.get('/admin/market-orders', { params });
export const cancelMarketMakerOrder = (orderId: string) =>
  api.delete(`/admin/market-orders/${orderId}`);
```

**Step 2: Create MarketOrdersPage.tsx**

Layout:
- Left: OrderBookReplica (reuse from CashMarketPage)
- Right: MarketMakerOrderForm + MarketMakerOrdersList

**Step 3: Add route**

```typescript
<Route path="/backoffice/market-orders" element={
  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
    <MarketOrdersPage />
  </ProtectedRoute>
} />
```

**Step 4: Commit**

```bash
git add frontend/src/pages/MarketOrdersPage.tsx frontend/src/components/backoffice/* frontend/src/services/api.ts frontend/src/App.tsx
git commit -m "feat: add Market Orders frontend tab

Admin order placement for MM with replica order book

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Create Logging tab frontend

**Files:**
- Create: `frontend/src/pages/LoggingPage.tsx`
- Create: `frontend/src/components/backoffice/LoggingOverview.tsx`
- Create: `frontend/src/components/backoffice/AllTicketsTab.tsx`
- Create: `frontend/src/components/backoffice/MarketMakerActionsTab.tsx`
- Create: `frontend/src/components/backoffice/FailedActionsTab.tsx`
- Create: `frontend/src/components/backoffice/SearchTicketsTab.tsx`
- Create: `frontend/src/components/backoffice/TicketDetailModal.tsx`

**Implementation guidance:**
- Use Tabs component (from existing patterns)
- Overview tab: metrics cards + charts
- Other tabs: filterable tables
- Click row → TicketDetailModal

**Step 1: Add API functions**

```typescript
// Logging
export const getTickets = (params?: any) =>
  api.get('/admin/logging/tickets', { params });
export const getTicket = (ticketId: string) =>
  api.get(`/admin/logging/tickets/${ticketId}`);
export const getLoggingStats = (params?: any) =>
  api.get('/admin/logging/stats', { params });
export const getMarketMakerActions = (params?: any) =>
  api.get('/admin/logging/market-maker-actions', { params });
export const getFailedActions = (params?: any) =>
  api.get('/admin/logging/failed-actions', { params });
```

**Step 2: Create LoggingPage.tsx with sub-tabs**

5 tabs:
1. Overview (stats + charts)
2. All Tickets (filterable table)
3. MM Actions (pre-filtered)
4. Failed Actions (pre-filtered, red highlighting)
5. Search (advanced search form)

**Step 3: Add route**

```typescript
<Route path="/backoffice/logging" element={
  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
    <LoggingPage />
  </ProtectedRoute>
} />
```

**Step 4: Commit**

```bash
git add frontend/src/pages/LoggingPage.tsx frontend/src/components/backoffice/* frontend/src/services/api.ts frontend/src/App.tsx
git commit -m "feat: add Logging/Audit frontend tab

Multi-view audit trail with filtering and stats

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 17: Add navigation links in Backoffice

**Files:**
- Modify: `frontend/src/pages/BackofficePage.tsx` (or navigation component)

**Step 1: Add tabs/links**

Add 3 new tabs to Backoffice navigation:
- Market Makers
- Market Orders
- Logging

**Step 2: Commit**

```bash
git add frontend/src/pages/BackofficePage.tsx
git commit -m "feat: add navigation links for MM features

Market Makers, Market Orders, Logging tabs

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 8: Integration & Testing

### Task 18: Test complete flow end-to-end

**Steps:**

1. **Start app**: `docker-compose up -d`
2. **Run migration**: Verify tables created
3. **Test Market Makers API**:
   - Create MM
   - Add assets (deposit)
   - View balances
   - Update MM
   - Soft delete
4. **Test Market Orders API**:
   - Place order (should lock assets)
   - View in cash market
   - Cancel order (should release assets)
5. **Test Logging API**:
   - View all tickets
   - Filter by action type
   - View MM actions
   - View failed actions
   - Get stats
6. **Test Frontend**:
   - Navigate to Market Makers tab
   - Create MM via UI
   - Add assets via UI
   - Navigate to Market Orders tab
   - Place order via UI
   - Verify appears in cash market
   - Navigate to Logging tab
   - View ticket history
   - Verify ticket IDs match

**Expected results:**
- All API endpoints return 200
- Tickets created for every action
- Assets properly locked/released
- Orders appear in public cash market
- Frontend displays all data correctly

**Commit test results:**

```bash
git add docs/testing/market-makers-e2e-test-results.md
git commit -m "test: end-to-end Market Makers system test

All flows verified, tickets generated correctly

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 9: Documentation

### Task 19: Create admin user guide

**Files:**
- Create: `docs/admin/MARKET_MAKERS_GUIDE.md`

**Content:**
- How to create Market Makers
- How to manage assets
- How to place orders
- How to view audit logs
- Troubleshooting common issues

**Commit:**

```bash
git add docs/admin/MARKET_MAKERS_GUIDE.md
git commit -m "docs: add Market Makers admin guide

Complete guide for MM management and audit logs

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 20: Update API documentation

**Files:**
- Update: `docs/api/AUTHENTICATION.md` (add MARKET_MAKER role)
- Create: `docs/api/MARKET_MAKERS_API.md`
- Create: `docs/api/LOGGING_API.md`

**Content:**
- Complete API reference
- Request/response examples
- Error codes
- Authentication requirements

**Commit:**

```bash
git add docs/api/*
git commit -m "docs: add API documentation for Market Makers

Complete endpoint reference with examples

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

Before considering implementation complete:

- [ ] All database migrations run successfully
- [ ] All API endpoints return correct responses
- [ ] Ticket IDs generated uniquely and sequentially
- [ ] Assets properly locked when orders placed
- [ ] Assets properly released when orders cancelled/filled
- [ ] MM orders appear in public cash market
- [ ] Matching engine processes MM orders normally
- [ ] All actions logged with tickets
- [ ] Frontend displays MM list correctly
- [ ] Frontend allows asset transactions
- [ ] Frontend allows order placement
- [ ] Frontend displays audit logs with filtering
- [ ] Navigation works between all 3 tabs
- [ ] Admin permissions enforced
- [ ] Market Makers cannot login to UI
- [ ] No performance degradation from logging
- [ ] Documentation complete and accurate

---

## Next Steps After Implementation

1. **Use superpowers:finishing-a-development-branch** to complete work
2. **Create PR** with comprehensive description
3. **Request code review**
4. **Merge to main** after approval
5. **Deploy to staging** for UAT
6. **Monitor performance** (especially logging overhead)
7. **Gather admin feedback** on UI usability

---

**Plan complete. Ready for execution with superpowers:executing-plans or superpowers:subagent-driven-development.**
