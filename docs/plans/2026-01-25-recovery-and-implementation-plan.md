# Plan Complet de Recuperare și Implementare - Niha Carbon Platform

**Data:** 2026-01-25
**Status:** URGENT - Aplicație Nefuncțională
**Autor:** Analiză Tehnică Completă
**Versiune:** 1.0

---

## 📊 EXECUTIVE SUMMARY

Platforma Niha Carbon este **complet nefuncțională** din cauza a două erori critice în sistemul de settlement:

1. **Backend:** Import error - modele Settlement lipsesc din database models
2. **Frontend:** Export error - funcții și API-uri nu sunt exportate corect

**Impact:** Aplicația nu pornește, utilizatorii nu pot accesa platforma.

**Soluție:** Plan de recuperare în 7 faze cu 16 task-uri prioritizate.

**Timp estimat recuperare critică:** 30-60 minute
**Timp estimat implementare completă:** 16-24 ore lucru

---

## 🔍 ANALIZA PROBLEMELOR

### Eroare Critică #1: Backend Import Error

**Locație:** `backend/app/api/v1/settlement.py:13`

```python
from ...models.models import User, SettlementBatch, SettlementStatusHistory, SettlementStatus, SettlementType
# ImportError: cannot import name 'SettlementBatch' from 'app.models.models'
```

**Cauza:** Modulele `SettlementBatch`, `SettlementStatusHistory`, `SettlementStatus`, `SettlementType` **nu există** în `models.py`.

**Detalii:**
- Documentația settlement există: `docs/architecture/settlement-system.md`
- Planul de implementare există: `docs/features/0001_settlement_external_implementation_PLAN.md`
- API endpoints implementate: `backend/app/api/v1/settlement.py`
- Frontend types definite: `frontend/src/types/index.ts` (SettlementBatch interface)
- Frontend components create: `SettlementDetails.tsx`, `SettlementTransactions.tsx`
- **DAR:** Database models nu au fost niciodată adăugate

**Impact:**
- Backend crash la startup
- Container `niha_backend` în restart loop
- Toate API endpoints indisponibile
- Aplicația complet inaccesibilă

---

### Eroare Critică #2: Frontend Export Errors

**Locație:** `frontend/src/components/dashboard/SettlementDetails.tsx`

```typescript
// Error 1: No matching export for "formatDate"
import { formatCurrency, formatQuantity, formatDate } from '../../utils';
// Error 2: No matching export for "settlementApi"
import { settlementApi } from '../../services/api';
```

**Cauza:**

**Error 1 - `formatDate`:**
- Funcția **EXISTĂ** în `src/utils/index.ts` la linia 54
- Este exportată corect
- Problema pare să fie de timing/build cache

**Error 2 - `settlementApi`:**
- API **EXISTĂ** în `src/services/api.ts` la linia 1374
- Este exportat: `export const settlementApi = { ... }`
- Dar componentele nu pot importa din cauza backend crash

**Impact:**
- Frontend build fail
- Vite dev server arată erori
- Hot module reload (HMR) nu funcționează pentru componentele afectate

---

## 🎯 PLANUL DE RECUPERARE

### FAZA 1: RECUPERARE CRITICĂ (PRIORITATE MAXIMĂ)

**Obiectiv:** Aplicația să pornească fără erori
**Timp estimat:** 30-60 minute
**Criterii de succes:** Backend și frontend pornesc, homepage accesibilă

#### Task 1.1: Add Settlement Models to Backend ⚠️ URGENT
**Responsabil:** Backend Developer
**Fișiere modificate:** `backend/app/models/models.py`
**Descriere:**

Adaugă la sfârșitul fișierului (după clasa `LiquidityOperation`):

```python
class SettlementStatus(str, enum.Enum):
    """Settlement status progression for T+N external settlements"""
    PENDING = "PENDING"                          # T+0: Order confirmed, awaiting T+1
    TRANSFER_INITIATED = "TRANSFER_INITIATED"    # T+1: Transfer started to registry
    IN_TRANSIT = "IN_TRANSIT"                    # T+2: In registry processing
    AT_CUSTODY = "AT_CUSTODY"                    # T+3: Arrived at Nihao custody
    SETTLED = "SETTLED"                          # Final settlement completed
    FAILED = "FAILED"                            # Settlement failed, requires intervention


class SettlementType(str, enum.Enum):
    """Types of settlement operations"""
    CEA_PURCHASE = "CEA_PURCHASE"              # CEA purchase from seller (T+3)
    SWAP_CEA_TO_EUA = "SWAP_CEA_TO_EUA"       # Swap CEA→EUA (CEA T+2, EUA T+5)


class SettlementBatch(Base):
    """
    Settlement batch tracking for external T+N settlements.

    Manages the complete lifecycle of certificate transfers through
    external registries with proper status tracking and audit trail.

    Timeline:
    - CEA Purchase: T+1 to T+3 business days
    - Swap CEA→EUA: CEA T+1 to T+2, EUA T+1 to T+5
    """
    __tablename__ = "settlement_batches"

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_reference = Column(String(50), unique=True, nullable=False, index=True)
    # Example: "SET-2026-001234-CEA", "SET-2026-001235-EUA"

    # Ownership and linkage
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True)
    trade_id = Column(UUID(as_uuid=True), ForeignKey("cash_market_trades.id"), nullable=True, index=True)
    counterparty_id = Column(UUID(as_uuid=True), nullable=True)  # Seller or Market Maker ID

    # Settlement details
    settlement_type = Column(SQLEnum(SettlementType), nullable=False, index=True)
    status = Column(SQLEnum(SettlementStatus), default=SettlementStatus.PENDING, nullable=False, index=True)
    asset_type = Column(SQLEnum(CertificateType), nullable=False)  # CEA or EUA

    # Financial details
    quantity = Column(Numeric(18, 2), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    total_value_eur = Column(Numeric(18, 2), nullable=False)

    # Timeline tracking
    expected_settlement_date = Column(DateTime, nullable=False, index=True)  # T+1, T+3, or T+5
    actual_settlement_date = Column(DateTime, nullable=True)

    # External registry tracking
    registry_reference = Column(String(100), nullable=True)  # Reference from external registry

    # Additional info
    notes = Column(Text, nullable=True)

    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    entity = relationship("Entity", foreign_keys=[entity_id])
    order = relationship("Order", foreign_keys=[order_id])
    trade = relationship("CashMarketTrade", foreign_keys=[trade_id])
    status_history = relationship("SettlementStatusHistory", back_populates="settlement_batch", cascade="all, delete-orphan")


class SettlementStatusHistory(Base):
    """
    Audit trail for all settlement status changes.

    Tracks every status transition with timestamp, notes, and responsible user.
    Provides complete audit trail for regulatory compliance.
    """
    __tablename__ = "settlement_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    settlement_batch_id = Column(UUID(as_uuid=True), ForeignKey("settlement_batches.id"), nullable=False, index=True)
    status = Column(SQLEnum(SettlementStatus), nullable=False)
    notes = Column(Text, nullable=True)  # Reason for status change, admin comments
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Admin who made the change
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    settlement_batch = relationship("SettlementBatch", back_populates="status_history")
    updater = relationship("User", foreign_keys=[updated_by])
```

**Verificare:**
```bash
# Check syntax
python -m py_compile backend/app/models/models.py

# Count lines (should be ~700+)
wc -l backend/app/models/models.py
```

---

#### Task 1.2: Create Alembic Migration
**Responsabil:** Backend Developer
**Comandă:**

```bash
# 1. Generate migration file
docker compose exec backend alembic revision -m "add settlement tables for T+N external settlements"

# Migration file created at: backend/alembic/versions/XXXX_add_settlement_tables.py
```

**Editează fișierul generat:**

```python
"""add settlement tables for T+N external settlements

Revision ID: XXXX
Revises: YYYY
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'XXXX'
down_revision = 'YYYY'  # Latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create SettlementStatus enum
    settlement_status_enum = postgresql.ENUM(
        'PENDING', 'TRANSFER_INITIATED', 'IN_TRANSIT', 'AT_CUSTODY', 'SETTLED', 'FAILED',
        name='settlementstatus',
        create_type=True
    )
    settlement_status_enum.create(op.get_bind(), checkfirst=True)

    # Create SettlementType enum
    settlement_type_enum = postgresql.ENUM(
        'CEA_PURCHASE', 'SWAP_CEA_TO_EUA',
        name='settlementtype',
        create_type=True
    )
    settlement_type_enum.create(op.get_bind(), checkfirst=True)

    # Create settlement_batches table
    op.create_table(
        'settlement_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('batch_reference', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('entities.id'), nullable=False, index=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=True, index=True),
        sa.Column('trade_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cash_market_trades.id'), nullable=True, index=True),
        sa.Column('counterparty_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('settlement_type', settlement_type_enum, nullable=False, index=True),
        sa.Column('status', settlement_status_enum, nullable=False, server_default='PENDING', index=True),
        sa.Column('asset_type', postgresql.ENUM('EUA', 'CEA', name='certificatetype', create_type=False), nullable=False),
        sa.Column('quantity', sa.Numeric(18, 2), nullable=False),
        sa.Column('price', sa.Numeric(18, 4), nullable=False),
        sa.Column('total_value_eur', sa.Numeric(18, 2), nullable=False),
        sa.Column('expected_settlement_date', sa.DateTime, nullable=False, index=True),
        sa.Column('actual_settlement_date', sa.DateTime, nullable=True),
        sa.Column('registry_reference', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()'), index=True),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('now()'))
    )

    # Create settlement_status_history table
    op.create_table(
        'settlement_status_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('settlement_batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('settlement_batches.id'), nullable=False, index=True),
        sa.Column('status', settlement_status_enum, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()'), index=True)
    )

    # Create composite index for common queries
    op.create_index(
        'ix_settlement_batches_entity_status',
        'settlement_batches',
        ['entity_id', 'status']
    )
    op.create_index(
        'ix_settlement_batches_status_expected_date',
        'settlement_batches',
        ['status', 'expected_settlement_date']
    )


def downgrade():
    # Drop indexes
    op.drop_index('ix_settlement_batches_status_expected_date', 'settlement_batches')
    op.drop_index('ix_settlement_batches_entity_status', 'settlement_batches')

    # Drop tables
    op.drop_table('settlement_status_history')
    op.drop_table('settlement_batches')

    # Drop enums
    sa.Enum(name='settlementstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='settlementtype').drop(op.get_bind(), checkfirst=True)
```

**Rulează migrația:**

```bash
# 2. Apply migration
docker compose exec backend alembic upgrade head

# Expected output:
# INFO  [alembic.runtime.migration] Running upgrade YYYY -> XXXX, add settlement tables for T+N external settlements

# 3. Verify tables created
docker compose exec db psql -U niha_user -d niha_carbon -c "\dt settlement*"

# Expected output:
#                    List of relations
#  Schema |            Name             | Type  |   Owner
# --------+-----------------------------+-------+-----------
#  public | settlement_batches          | table | niha_user
#  public | settlement_status_history   | table | niha_user
```

---

#### Task 1.3: Restart Services and Verify
**Responsabil:** DevOps / Backend Developer

```bash
# 1. Restart all services
./restart.sh

# Or manually:
docker compose down --remove-orphans
docker compose up -d

# 2. Monitor backend logs (should see no errors)
docker compose logs -f backend

# Expected output (NO ImportError):
# niha_backend  | INFO:     Started server process [1]
# niha_backend  | INFO:     Waiting for application startup.
# niha_backend  | INFO:     Starting Nihao Carbon Trading Platform API...
# niha_backend  | INFO:     Database initialized
# niha_backend  | INFO:     Application startup complete.
# niha_backend  | INFO:     Uvicorn running on http://0.0.0.0:8000

# 3. Check health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","environment":"development"}

# 4. Check settlement endpoint (requires auth)
curl http://localhost:8000/api/v1/settlement/pending

# Expected: 401 Unauthorized (correct - needs token)
# NOT: 500 Internal Server Error (would indicate import still broken)

# 5. Monitor frontend logs
docker compose logs -f frontend

# Should see: VITE ready, no more build errors about SettlementBatch

# 6. Access frontend
open http://localhost:5173

# Should load without errors in browser console
```

**Criterii de Succes Faza 1:**
- ✅ Backend pornește fără ImportError
- ✅ Database migration aplicată cu succes
- ✅ Health endpoint răspunde
- ✅ Frontend se încarcă (chiar dacă settlement UI nu funcționează complet)
- ✅ No crash loops în docker logs

---

### FAZA 2: IMPLEMENTARE SETTLEMENT SERVICE

**Obiectiv:** Business logic completă pentru settlement system
**Timp estimat:** 3-4 ore
**Dependințe:** Faza 1 completă

#### Task 2.1: Create Settlement Service Core
**Responsabil:** Backend Developer
**Fișier NOU:** `backend/app/services/settlement_service.py`

**Conținut complet:**

```python
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

logger = logging.getLogger(__name__)


class SettlementService:
    """Service for managing settlement operations"""

    @staticmethod
    def calculate_business_days(start_date: datetime, num_days: int) -> datetime:
        """
        Calculate target date N business days from start_date.
        Business days = Monday-Friday, excludes weekends.

        Args:
            start_date: Starting date
            num_days: Number of business days to add

        Returns:
            Target date (datetime)
        """
        current_date = start_date
        days_added = 0

        while days_added < num_days:
            current_date += timedelta(days=1)
            # Skip weekends (Saturday=5, Sunday=6)
            if current_date.weekday() < 5:
                days_added += 1

        return current_date

    @staticmethod
    async def generate_batch_reference(
        db: AsyncSession,
        settlement_type: SettlementType,
        asset_type: CertificateType
    ) -> str:
        """
        Generate unique settlement batch reference.
        Format: SET-YYYY-NNNNNN-TYPE

        Example: SET-2026-000001-CEA, SET-2026-000002-EUA

        Args:
            db: Database session
            settlement_type: Type of settlement
            asset_type: CEA or EUA

        Returns:
            Unique batch reference string
        """
        year = datetime.utcnow().year
        asset_suffix = asset_type.value  # "CEA" or "EUA"

        # Get count of settlements this year for this type
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

        # Generate reference with zero-padded counter
        sequence_num = str(count + 1).zfill(6)
        batch_reference = f"SET-{year}-{sequence_num}-{asset_suffix}"

        # Verify uniqueness (should always be unique with this algorithm)
        existing = await db.execute(
            select(SettlementBatch).where(SettlementBatch.batch_reference == batch_reference)
        )
        if existing.scalar_one_or_none():
            # Fallback: append timestamp if somehow not unique
            timestamp = int(datetime.utcnow().timestamp())
            batch_reference = f"SET-{year}-{sequence_num}-{asset_suffix}-{timestamp}"

        return batch_reference

    @staticmethod
    async def create_cea_purchase_settlement(
        db: AsyncSession,
        entity_id: UUID,
        order_id: UUID,
        trade_id: UUID,
        quantity: Decimal,
        price: Decimal,
        seller_id: UUID,
        created_by: UUID
    ) -> SettlementBatch:
        """
        Create settlement batch for CEA purchase.
        Timeline: T+1 to T+3 business days.

        Args:
            db: Database session
            entity_id: Buyer entity ID
            order_id: Order that triggered settlement
            trade_id: Trade that was executed
            quantity: CEA quantity
            price: Price per CEA
            seller_id: Seller ID (counterparty)
            created_by: User who created (for audit)

        Returns:
            Created SettlementBatch
        """
        try:
            # Calculate expected settlement date (T+3 business days from today)
            today = datetime.utcnow()
            expected_date = SettlementService.calculate_business_days(today, 3)

            # Generate unique batch reference
            batch_reference = await SettlementService.generate_batch_reference(
                db, SettlementType.CEA_PURCHASE, CertificateType.CEA
            )

            # Calculate total value
            total_value_eur = quantity * price

            # Create settlement batch
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
            await db.flush()  # Get settlement.id

            # Create initial status history entry
            status_history = SettlementStatusHistory(
                settlement_batch_id=settlement.id,
                status=SettlementStatus.PENDING,
                notes="Settlement batch created - awaiting T+1",
                updated_by=created_by
            )
            db.add(status_history)

            await db.commit()
            await db.refresh(settlement)

            logger.info(
                f"Created CEA purchase settlement: {batch_reference} "
                f"for entity {entity_id}, quantity {quantity}, expected {expected_date.date()}"
            )

            return settlement

        except Exception as e:
            await db.rollback()
            raise handle_database_error(e, "create CEA purchase settlement", logger)

    @staticmethod
    async def create_swap_settlement(
        db: AsyncSession,
        entity_id: UUID,
        order_id: UUID,
        trade_id: UUID,
        cea_quantity: Decimal,
        eua_quantity: Decimal,
        swap_rate: Decimal,
        market_maker_id: UUID,
        created_by: UUID
    ) -> Dict[str, SettlementBatch]:
        """
        Create TWO settlement batches for swap: CEA outbound + EUA inbound.

        Timeline:
        - CEA outbound: T+1 to T+2 business days
        - EUA inbound: T+1 to T+5 business days

        Args:
            db: Database session
            entity_id: User entity swapping
            order_id: Swap order ID
            trade_id: Swap trade ID
            cea_quantity: CEA being sent
            eua_quantity: EUA being received
            swap_rate: CEA per EUA rate
            market_maker_id: Market maker facilitating swap
            created_by: User who created

        Returns:
            Dict with 'cea_outbound' and 'eua_inbound' settlement batches
        """
        try:
            today = datetime.utcnow()

            # CEA outbound settlement (T+2)
            cea_expected = SettlementService.calculate_business_days(today, 2)
            cea_reference = await SettlementService.generate_batch_reference(
                db, SettlementType.SWAP_CEA_TO_EUA, CertificateType.CEA
            )

            # Get current CEA price for value calculation
            # (In real implementation, fetch from PriceService)
            cea_price = Decimal("15.00")  # EUR per CEA (approximate)
            cea_total_value = cea_quantity * cea_price

            cea_settlement = SettlementBatch(
                batch_reference=cea_reference,
                entity_id=entity_id,
                order_id=order_id,
                trade_id=trade_id,
                counterparty_id=market_maker_id,
                settlement_type=SettlementType.SWAP_CEA_TO_EUA,
                status=SettlementStatus.PENDING,
                asset_type=CertificateType.CEA,
                quantity=cea_quantity,
                price=cea_price,
                total_value_eur=cea_total_value,
                expected_settlement_date=cea_expected,
                notes=f"Swap: Sending {cea_quantity} CEA, rate {swap_rate} CEA/EUA"
            )
            db.add(cea_settlement)
            await db.flush()

            # EUA inbound settlement (T+5)
            eua_expected = SettlementService.calculate_business_days(today, 5)
            eua_reference = await SettlementService.generate_batch_reference(
                db, SettlementType.SWAP_CEA_TO_EUA, CertificateType.EUA
            )

            # Get current EUA price
            eua_price = Decimal("80.00")  # EUR per EUA (approximate)
            eua_total_value = eua_quantity * eua_price

            eua_settlement = SettlementBatch(
                batch_reference=eua_reference,
                entity_id=entity_id,
                order_id=order_id,
                trade_id=trade_id,
                counterparty_id=market_maker_id,
                settlement_type=SettlementType.SWAP_CEA_TO_EUA,
                status=SettlementStatus.PENDING,
                asset_type=CertificateType.EUA,
                quantity=eua_quantity,
                price=eua_price,
                total_value_eur=eua_total_value,
                expected_settlement_date=eua_expected,
                notes=f"Swap: Receiving {eua_quantity} EUA, rate {swap_rate} CEA/EUA"
            )
            db.add(eua_settlement)
            await db.flush()

            # Create status history for both
            for settlement in [cea_settlement, eua_settlement]:
                history = SettlementStatusHistory(
                    settlement_batch_id=settlement.id,
                    status=SettlementStatus.PENDING,
                    notes=f"Swap settlement batch created for {settlement.asset_type.value}",
                    updated_by=created_by
                )
                db.add(history)

            await db.commit()
            await db.refresh(cea_settlement)
            await db.refresh(eua_settlement)

            logger.info(
                f"Created swap settlements: CEA {cea_reference} (T+2), EUA {eua_reference} (T+5)"
            )

            return {
                'cea_outbound': cea_settlement,
                'eua_inbound': eua_settlement
            }

        except Exception as e:
            await db.rollback()
            raise handle_database_error(e, "create swap settlement", logger)

    @staticmethod
    async def update_settlement_status(
        db: AsyncSession,
        settlement_id: UUID,
        new_status: SettlementStatus,
        notes: Optional[str],
        updated_by: UUID
    ) -> SettlementBatch:
        """
        Update settlement status with validation and audit trail.

        Args:
            db: Database session
            settlement_id: Settlement batch ID
            new_status: New status to set
            notes: Optional notes about status change
            updated_by: Admin user making the change

        Returns:
            Updated SettlementBatch
        """
        try:
            # Get settlement
            result = await db.execute(
                select(SettlementBatch).where(SettlementBatch.id == settlement_id)
            )
            settlement = result.scalar_one_or_none()
            if not settlement:
                raise ValueError(f"Settlement {settlement_id} not found")

            old_status = settlement.status

            # Validate status transition (prevent invalid jumps)
            valid_transitions = {
                SettlementStatus.PENDING: [SettlementStatus.TRANSFER_INITIATED, SettlementStatus.FAILED],
                SettlementStatus.TRANSFER_INITIATED: [SettlementStatus.IN_TRANSIT, SettlementStatus.FAILED],
                SettlementStatus.IN_TRANSIT: [SettlementStatus.AT_CUSTODY, SettlementStatus.FAILED],
                SettlementStatus.AT_CUSTODY: [SettlementStatus.SETTLED, SettlementStatus.FAILED],
                SettlementStatus.SETTLED: [],  # Final state
                SettlementStatus.FAILED: [SettlementStatus.PENDING]  # Can retry
            }

            if new_status not in valid_transitions.get(old_status, []):
                raise ValueError(
                    f"Invalid status transition: {old_status} -> {new_status}. "
                    f"Valid transitions from {old_status}: {valid_transitions.get(old_status, [])}"
                )

            # Update status
            settlement.status = new_status
            settlement.updated_at = datetime.utcnow()

            # Create status history entry
            history = SettlementStatusHistory(
                settlement_batch_id=settlement_id,
                status=new_status,
                notes=notes or f"Status changed from {old_status} to {new_status}",
                updated_by=updated_by
            )
            db.add(history)

            # If status is SETTLED, finalize settlement
            if new_status == SettlementStatus.SETTLED:
                await SettlementService.finalize_settlement(db, settlement, updated_by)

            await db.commit()
            await db.refresh(settlement)

            logger.info(
                f"Settlement {settlement.batch_reference}: {old_status} -> {new_status}"
            )

            return settlement

        except Exception as e:
            await db.rollback()
            raise handle_database_error(e, "update settlement status", logger)

    @staticmethod
    async def finalize_settlement(
        db: AsyncSession,
        settlement: SettlementBatch,
        finalized_by: UUID
    ):
        """
        Finalize settlement - update EntityHolding and create AssetTransaction.
        Called when status becomes SETTLED.

        Args:
            db: Database session
            settlement: SettlementBatch to finalize
            finalized_by: User finalizing
        """
        try:
            # Set actual settlement date
            settlement.actual_settlement_date = datetime.utcnow()

            # Determine asset type for EntityHolding
            if settlement.asset_type == CertificateType.CEA:
                asset_type_enum = AssetType.CEA
            elif settlement.asset_type == CertificateType.EUA:
                asset_type_enum = AssetType.EUA
            else:
                raise ValueError(f"Unknown asset type: {settlement.asset_type}")

            # Get or create EntityHolding
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
                # Create new holding
                holding = EntityHolding(
                    entity_id=settlement.entity_id,
                    asset_type=asset_type_enum,
                    quantity=Decimal("0")
                )
                db.add(holding)
                await db.flush()
            else:
                balance_before = holding.quantity

            # Determine transaction type and amount
            if settlement.settlement_type == SettlementType.CEA_PURCHASE:
                # CEA purchase: ADD to holding
                transaction_type = TransactionType.TRADE_CREDIT
                amount = settlement.quantity
                holding.quantity += settlement.quantity

            elif settlement.settlement_type == SettlementType.SWAP_CEA_TO_EUA:
                if settlement.asset_type == CertificateType.CEA:
                    # CEA outbound in swap: DEDUCT from holding
                    transaction_type = TransactionType.TRADE_DEBIT
                    amount = -settlement.quantity
                    holding.quantity -= settlement.quantity
                else:
                    # EUA inbound in swap: ADD to holding
                    transaction_type = TransactionType.TRADE_CREDIT
                    amount = settlement.quantity
                    holding.quantity += settlement.quantity
            else:
                raise ValueError(f"Unknown settlement type: {settlement.settlement_type}")

            # Verify sufficient balance for debits
            if holding.quantity < 0:
                raise ValueError(
                    f"Insufficient {asset_type_enum} balance for settlement {settlement.batch_reference}. "
                    f"Balance would be {holding.quantity}"
                )

            holding.updated_at = datetime.utcnow()

            # Create AssetTransaction for audit trail
            transaction = AssetTransaction(
                entity_id=settlement.entity_id,
                asset_type=asset_type_enum,
                transaction_type=transaction_type,
                amount=amount,
                balance_before=balance_before,
                balance_after=holding.quantity,
                reference=f"Settlement {settlement.batch_reference}",
                notes=f"Settlement finalized: {settlement.settlement_type.value}",
                created_by=finalized_by
            )
            db.add(transaction)

            logger.info(
                f"Finalized settlement {settlement.batch_reference}: "
                f"{asset_type_enum} {balance_before} -> {holding.quantity}"
            )

        except Exception as e:
            raise handle_database_error(e, "finalize settlement", logger)

    @staticmethod
    async def get_pending_settlements(
        db: AsyncSession,
        entity_id: Optional[UUID] = None,
        settlement_type: Optional[SettlementType] = None,
        status_filter: Optional[SettlementStatus] = None
    ) -> List[SettlementBatch]:
        """
        Get pending settlements with optional filters.

        Args:
            db: Database session
            entity_id: Filter by entity (optional)
            settlement_type: Filter by type (optional)
            status_filter: Filter by status (optional)

        Returns:
            List of SettlementBatch objects
        """
        try:
            query = select(SettlementBatch).options(
                selectinload(SettlementBatch.entity),
                selectinload(SettlementBatch.status_history)
            )

            # Build filters
            filters = []
            if entity_id:
                filters.append(SettlementBatch.entity_id == entity_id)
            if settlement_type:
                filters.append(SettlementBatch.settlement_type == settlement_type)
            if status_filter:
                filters.append(SettlementBatch.status == status_filter)
            else:
                # By default, exclude SETTLED and FAILED
                filters.append(
                    SettlementBatch.status.notin_([SettlementStatus.SETTLED, SettlementStatus.FAILED])
                )

            if filters:
                query = query.where(and_(*filters))

            # Order by expected settlement date
            query = query.order_by(SettlementBatch.expected_settlement_date.asc())

            result = await db.execute(query)
            settlements = result.scalars().all()

            return list(settlements)

        except Exception as e:
            raise handle_database_error(e, "get pending settlements", logger)

    @staticmethod
    async def get_settlement_timeline(
        db: AsyncSession,
        settlement_id: UUID
    ) -> Dict[str, Any]:
        """
        Get complete timeline for a settlement with progress calculation.

        Args:
            db: Database session
            settlement_id: Settlement batch ID

        Returns:
            Dict with settlement, status_history, and progress_percentage
        """
        try:
            # Get settlement with history
            result = await db.execute(
                select(SettlementBatch)
                .options(selectinload(SettlementBatch.status_history))
                .where(SettlementBatch.id == settlement_id)
            )
            settlement = result.scalar_one_or_none()
            if not settlement:
                raise ValueError(f"Settlement {settlement_id} not found")

            # Calculate progress percentage
            progress = SettlementService.calculate_settlement_progress(settlement)

            return {
                'settlement': settlement,
                'status_history': sorted(
                    settlement.status_history,
                    key=lambda h: h.created_at
                ),
                'progress_percentage': progress
            }

        except Exception as e:
            raise handle_database_error(e, "get settlement timeline", logger)

    @staticmethod
    def calculate_settlement_progress(settlement: SettlementBatch) -> int:
        """
        Calculate settlement progress as percentage (0-100).

        Args:
            settlement: SettlementBatch

        Returns:
            Progress percentage (0-100)
        """
        status_weights = {
            SettlementStatus.PENDING: 0,
            SettlementStatus.TRANSFER_INITIATED: 25,
            SettlementStatus.IN_TRANSIT: 50,
            SettlementStatus.AT_CUSTODY: 75,
            SettlementStatus.SETTLED: 100,
            SettlementStatus.FAILED: 0
        }

        base_progress = status_weights.get(settlement.status, 0)

        # If not settled, also consider time progress
        if settlement.status != SettlementStatus.SETTLED:
            now = datetime.utcnow()
            created = settlement.created_at
            expected = settlement.expected_settlement_date

            total_duration = (expected - created).total_seconds()
            elapsed = (now - created).total_seconds()

            if total_duration > 0:
                time_progress = min(100, int((elapsed / total_duration) * 100))
                # Average of status-based and time-based progress
                return int((base_progress + time_progress) / 2)

        return base_progress
```

**Teste:**
```bash
# Test import
docker compose exec backend python -c "from app.services.settlement_service import SettlementService; print('OK')"
```

---

#### Task 2.2: Integrate Settlement into Order Matching
**Responsabil:** Backend Developer
**Fișier:** `backend/app/services/order_matching.py`

**Modificări în `execute_market_buy_order()`:**

Găsește secțiunea care face:
```python
# OLD CODE - Remove this:
# Update entity CEA balance immediately
await update_entity_balance(db, buyer_entity_id, AssetType.CEA, filled_quantity)
```

Înlocuiește cu:
```python
# NEW CODE - Create settlement instead of instant credit
from .settlement_service import SettlementService

# Create settlement batch for CEA purchase (T+3)
settlement = await SettlementService.create_cea_purchase_settlement(
    db=db,
    entity_id=buyer_entity_id,
    order_id=order.id,
    trade_id=trade.id,
    quantity=filled_quantity,
    price=price,
    seller_id=sell_order.market_maker_id or sell_order.seller_id,
    created_by=current_user.id if hasattr(current_user, 'id') else None
)

logger.info(
    f"Created settlement {settlement.batch_reference} for order {order.id}, "
    f"quantity {filled_quantity} CEA, expected {settlement.expected_settlement_date.date()}"
)

# Link settlement to trade (optional - if you add field to CashMarketTrade)
# trade.settlement_batch_id = settlement.id
```

**Verificare:**
- CEA nu se adaugă instant la EntityHolding
- EUR se deduce instant (funds locked)
- Settlement batch creat cu status PENDING
- Expected date = T+3 business days

---

### FAZA 3: BACKGROUND PROCESSING

**Obiectiv:** Automated status updates for settlements
**Timp estimat:** 2 ore

#### Task 3.1: Create Settlement Processor
**Responsabil:** Backend Developer
**Fișier NOU:** `backend/app/services/settlement_processor.py`

```python
"""
Settlement Processor - Background Job for Automatic Status Updates

Runs periodically to advance settlement statuses based on timeline.
"""
import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db_session
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
        """
        Main processor - auto-advance settlements based on expected dates.
        Runs every hour.
        """
        async with get_db_session() as db:
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
                            # Use system user for automated updates (or admin user)
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
                                f"Advanced settlement {settlement.batch_reference} "
                                f"to {next_status}"
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
            # Immediately advance to SETTLED after AT_CUSTODY
            return True

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
            select(User).where(User.email == "admin@nihao.com").limit(1)
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
        async with get_db_session() as db:
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
                    logger.warning(
                        f"Found {len(overdue)} overdue settlements requiring attention"
                    )
                    for settlement in overdue:
                        days_overdue = (now - settlement.expected_settlement_date).days
                        logger.warning(
                            f"Settlement {settlement.batch_reference} is {days_overdue} days overdue. "
                            f"Status: {settlement.status}, Expected: {settlement.expected_settlement_date.date()}"
                        )
                        # TODO: Send admin alert email

            except Exception as e:
                logger.error(f"Error checking overdue settlements: {e}", exc_info=True)
```

---

#### Task 3.2: Integrate Processor into FastAPI Lifespan
**Responsabil:** Backend Developer
**Fișier:** `backend/app/main.py`

Modifică `lifespan()` function:

```python
import asyncio
from contextlib import asynccontextmanager

# Add import
from .services.settlement_processor import SettlementProcessor

# Global task reference
_background_tasks = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Nihao Carbon Trading Platform API...")
    await init_db()
    logger.info("Database initialized")

    # Start settlement processor background task
    async def settlement_processor_loop():
        """Run settlement processor every hour"""
        while True:
            try:
                await SettlementProcessor.process_pending_settlements()
                await SettlementProcessor.check_overdue_settlements()
            except Exception as e:
                logger.error(f"Settlement processor error: {e}", exc_info=True)

            # Wait 1 hour
            await asyncio.sleep(3600)

    # Start background task
    processor_task = asyncio.create_task(settlement_processor_loop())
    _background_tasks.append(processor_task)
    logger.info("Settlement processor started (running every 1 hour)")

    yield

    # Shutdown
    logger.info("Shutting down...")

    # Cancel background tasks
    for task in _background_tasks:
        task.cancel()
    await asyncio.gather(*_background_tasks, return_exceptions=True)
    logger.info("Background tasks cancelled")

    await RedisManager.close()
```

**Teste:**
```bash
# Restart backend
docker compose restart backend

# Check logs - should see "Settlement processor started"
docker compose logs backend | grep -i settlement
```

---

### FAZA 4: FRONTEND INTEGRATION

**Obiectiv:** Complete settlement UI
**Timp estimat:** 2-3 ore

---

### FAZA 4: FRONTEND INTEGRATION & UX

**Obiectiv:** Complete settlement UI and user experience
**Timp estimat:** 2-3 ore
**Dependințe:** Faza 1, 2, 3 complete

#### Task 4.1: Fix Frontend Export Issues
**Responsabil:** Frontend Developer
**Fișier:** `frontend/src/services/api.ts`

**Verificare actuală:**
```typescript
// Line 1374 - settlementApi exists but may need re-export
export const settlementApi = {
  getPendingSettlements: async (): Promise<{ data: SettlementBatch[]; count: number }> => {
    const { data } = await api.get<{ data: SettlementBatch[]; count: number }>('/settlement/pending');
    return data;
  },
};

// ADD at end of file if missing:
export default api;
```

**Verificare `utils/index.ts`:**
```typescript
// Line 54-63 - formatDate exists and is exported
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

// Verify it's exported (should already be)
```

**Test:**
```bash
cd frontend
npm run build

# Should complete without errors
# Check for "formatDate" or "settlementApi" errors
```

---

#### Task 4.2: Enhance SettlementDetails Component
**Responsabil:** Frontend Developer
**Fișier:** `frontend/src/components/dashboard/SettlementDetails.tsx`

**Add Timeline Visualization:**

```typescript
import { Check, Clock, AlertCircle, Loader } from 'lucide-react';

interface TimelineStep {
  status: SettlementStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SettlementDetails: React.FC<Props> = ({ settlement, onClose }) => {
  const timelineSteps: TimelineStep[] = [
    {
      status: 'PENDING',
      label: 'Pending',
      icon: <Clock className="h-5 w-5" />,
      color: 'amber'
    },
    {
      status: 'TRANSFER_INITIATED',
      label: 'Transfer Initiated',
      icon: <Loader className="h-5 w-5" />,
      color: 'blue'
    },
    {
      status: 'IN_TRANSIT',
      label: 'In Transit',
      icon: <Loader className="h-5 w-5" />,
      color: 'blue'
    },
    {
      status: 'AT_CUSTODY',
      label: 'At Custody',
      icon: <Check className="h-5 w-5" />,
      color: 'emerald'
    },
    {
      status: 'SETTLED',
      label: 'Settled',
      icon: <Check className="h-5 w-5" />,
      color: 'emerald'
    }
  ];

  const currentStepIndex = timelineSteps.findIndex(
    step => step.status === settlement.status
  );

  const progress = calculateProgress(settlement);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
              Settlement Details
            </h2>
            <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
              {settlement.batch_reference}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-navy-600 dark:text-navy-400 transition-colors hover:bg-navy-100 dark:hover:bg-navy-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy-900 dark:text-white">
              Progress
            </span>
            <span className="text-navy-600 dark:text-navy-400">
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-navy-100 dark:bg-navy-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-navy-900 dark:text-white">
            Settlement Timeline
          </h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-navy-200 dark:bg-navy-700" />
            <div
              className="absolute left-6 top-0 w-0.5 bg-emerald-500 transition-all duration-500"
              style={{ height: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
            />

            {/* Steps */}
            <div className="space-y-4">
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const historyEntry = settlement.status_history?.find(
                  h => h.status === step.status
                );

                return (
                  <div key={step.status} className="relative flex items-start gap-4 pl-2">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-400 dark:text-navy-500'
                      } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                    >
                      {step.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-semibold ${
                            isCompleted
                              ? 'text-navy-900 dark:text-white'
                              : 'text-navy-500 dark:text-navy-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        {historyEntry && (
                          <span className="text-sm text-navy-600 dark:text-navy-400">
                            {formatDate(historyEntry.created_at)}
                          </span>
                        )}
                      </div>
                      {historyEntry?.notes && (
                        <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
                          {historyEntry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settlement Info */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 p-6">
          <div>
            <p className="text-sm text-navy-600 dark:text-navy-400">Asset Type</p>
            <p className="mt-1 font-semibold text-navy-900 dark:text-white">
              <CertificateBadge type={settlement.asset_type} />
            </p>
          </div>
          <div>
            <p className="text-sm text-navy-600 dark:text-navy-400">Quantity</p>
            <p className="mt-1 font-mono text-lg font-bold text-navy-900 dark:text-white">
              {formatQuantity(settlement.quantity)} {settlement.asset_type}
            </p>
          </div>
          <div>
            <p className="text-sm text-navy-600 dark:text-navy-400">Total Value</p>
            <p className="mt-1 font-mono text-lg font-bold text-navy-900 dark:text-white">
              {formatCurrency(settlement.total_value_eur)}
            </p>
          </div>
          <div>
            <p className="text-sm text-navy-600 dark:text-navy-400">Expected Settlement</p>
            <p className="mt-1 font-semibold text-navy-900 dark:text-white">
              {formatDate(settlement.expected_settlement_date)}
            </p>
          </div>
          {settlement.actual_settlement_date && (
            <div>
              <p className="text-sm text-navy-600 dark:text-navy-400">Actual Settlement</p>
              <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                {formatDate(settlement.actual_settlement_date)}
              </p>
            </div>
          )}
          {settlement.registry_reference && (
            <div>
              <p className="text-sm text-navy-600 dark:text-navy-400">Registry Reference</p>
              <p className="mt-1 font-mono text-sm font-medium text-navy-900 dark:text-white">
                {settlement.registry_reference}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function calculateProgress(settlement: SettlementBatch): number {
  const statusWeights = {
    PENDING: 0,
    TRANSFER_INITIATED: 25,
    IN_TRANSIT: 50,
    AT_CUSTODY: 75,
    SETTLED: 100,
    FAILED: 0
  };
  return statusWeights[settlement.status] || 0;
}
```

---

#### Task 4.3: Update Dashboard with Settlement Section
**Responsabil:** Frontend Developer
**Fișier:** `frontend/src/pages/DashboardPage.tsx`

**Add Pending Settlements Section:**

```typescript
import { SettlementTransactions } from '../components/dashboard/SettlementTransactions';
import { settlementApi } from '../services/api';

const DashboardPage: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);

  // Fetch settlements
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const { data } = await settlementApi.getPendingSettlements();
        setSettlements(data);
      } catch (error) {
        console.error('Failed to fetch settlements:', error);
      } finally {
        setLoadingSettlements(false);
      }
    };

    fetchSettlements();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSettlements, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPendingValue = settlements.reduce(
    (sum, s) => sum + Number(s.total_value_eur), 0
  );

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-900">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back to your carbon trading platform"
      />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Balance Cards */}
        <BalanceCards />

        {/* Pending Settlements Section */}
        {settlements.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                  Pending Settlements
                </h2>
                <p className="text-sm text-navy-600 dark:text-navy-400">
                  {settlements.length} settlement{settlements.length !== 1 ? 's' : ''} in progress
                  • Total value: {formatCurrency(totalPendingValue)}
                </p>
              </div>
              <div className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-4 py-2">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  <Clock className="mr-2 inline h-4 w-4" />
                  {settlements.length} Pending
                </span>
              </div>
            </div>

            <SettlementTransactions settlements={settlements} />
          </div>
        )}

        {/* Rest of dashboard... */}
      </div>
    </div>
  );
};
```

---

### FAZA 5: TESTING & QUALITY ASSURANCE

**Obiectiv:** Comprehensive testing and validation
**Timp estimat:** 3-4 ore
**Criterii de succes:** All tests pass, no regressions

#### Task 5.1: Backend Unit Tests
**Responsabil:** Backend Developer / QA
**Fișier NOU:** `backend/tests/test_settlement_service.py`

```python
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4

from app.services.settlement_service import SettlementService
from app.models.models import (
    SettlementBatch,
    SettlementStatus,
    SettlementType,
    CertificateType
)


@pytest.mark.asyncio
async def test_create_cea_purchase_settlement(test_db, test_user, test_entity):
    """Test creating CEA purchase settlement"""
    settlement = await SettlementService.create_cea_purchase_settlement(
        db=test_db,
        entity_id=test_entity.id,
        order_id=uuid4(),
        trade_id=uuid4(),
        quantity=Decimal("100.00"),
        price=Decimal("15.50"),
        seller_id=uuid4(),
        created_by=test_user.id
    )

    assert settlement.settlement_type == SettlementType.CEA_PURCHASE
    assert settlement.status == SettlementStatus.PENDING
    assert settlement.asset_type == CertificateType.CEA
    assert settlement.quantity == Decimal("100.00")
    assert settlement.price == Decimal("15.50")
    assert settlement.total_value_eur == Decimal("1550.00")
    assert settlement.batch_reference.startswith("SET-2026-")
    assert len(settlement.status_history) == 1


@pytest.mark.asyncio
async def test_calculate_business_days():
    """Test business days calculation (excludes weekends)"""
    # Monday
    start = datetime(2026, 1, 26, 12, 0, 0)  # Monday

    # T+3 from Monday = Thursday (Mon+1=Tue, Tue+1=Wed, Wed+1=Thu)
    result = SettlementService.calculate_business_days(start, 3)
    assert result.weekday() == 3  # Thursday

    # T+5 from Monday = Monday next week (skip Sat/Sun)
    result = SettlementService.calculate_business_days(start, 5)
    assert result.weekday() == 0  # Monday
    assert (result - start).days == 7  # 7 calendar days


@pytest.mark.asyncio
async def test_update_settlement_status_validation(test_db, test_settlement, test_user):
    """Test status transition validation"""
    # Valid transition: PENDING -> TRANSFER_INITIATED
    updated = await SettlementService.update_settlement_status(
        db=test_db,
        settlement_id=test_settlement.id,
        new_status=SettlementStatus.TRANSFER_INITIATED,
        notes="Test transition",
        updated_by=test_user.id
    )
    assert updated.status == SettlementStatus.TRANSFER_INITIATED

    # Invalid transition: TRANSFER_INITIATED -> SETTLED (must go through IN_TRANSIT, AT_CUSTODY)
    with pytest.raises(ValueError, match="Invalid status transition"):
        await SettlementService.update_settlement_status(
            db=test_db,
            settlement_id=test_settlement.id,
            new_status=SettlementStatus.SETTLED,
            notes="Invalid jump",
            updated_by=test_user.id
        )


@pytest.mark.asyncio
async def test_finalize_settlement_updates_holding(test_db, test_settlement, test_entity, test_user):
    """Test settlement finalization updates EntityHolding"""
    # Set settlement to SETTLED
    await SettlementService.update_settlement_status(
        db=test_db,
        settlement_id=test_settlement.id,
        new_status=SettlementStatus.SETTLED,
        notes="Test finalization",
        updated_by=test_user.id
    )

    # Verify EntityHolding updated
    from app.models.models import EntityHolding, AssetType
    from sqlalchemy import select

    result = await test_db.execute(
        select(EntityHolding).where(
            EntityHolding.entity_id == test_entity.id,
            EntityHolding.asset_type == AssetType.CEA
        )
    )
    holding = result.scalar_one()

    assert holding.quantity == test_settlement.quantity
```

**Run tests:**
```bash
docker compose exec backend pytest tests/test_settlement_service.py -v
```

---

#### Task 5.2: End-to-End Settlement Flow Test
**Responsabil:** QA Engineer
**Document:** `docs/testing/settlement-e2e-test-plan.md`

**Test Scenario: Complete CEA Purchase Settlement**

1. **Setup:**
   - Admin creates Market Maker with 1000 CEA balance
   - MM places SELL order: 100 CEA @ €15.00
   - User has €2000 EUR balance

2. **Execution (T+0):**
   - User places BUY order: 100 CEA @ €15.00
   - Order matches and executes
   - Verify:
     - ✅ EUR deducted: €2000 → €1500
     - ✅ CEA NOT added (still 0)
     - ✅ Settlement batch created with PENDING status
     - ✅ Batch reference format: SET-2026-XXXXXX-CEA
     - ✅ Expected date = T+3 business days
     - ✅ Confirmation email sent (check logs)

3. **T+1 Processing:**
   - Run processor: `SettlementProcessor.process_pending_settlements()`
   - Verify:
     - ✅ Status: PENDING → TRANSFER_INITIATED
     - ✅ Status history entry created
     - ✅ Email notification sent

4. **T+2 Processing:**
   - Run processor again
   - Verify:
     - ✅ Status: TRANSFER_INITIATED → IN_TRANSIT

5. **T+3 Processing:**
   - Run processor
   - Verify:
     - ✅ Status: IN_TRANSIT → AT_CUSTODY → SETTLED
     - ✅ CEA added to EntityHolding: 0 → 100
     - ✅ AssetTransaction created (audit trail)
     - ✅ actual_settlement_date set
     - ✅ Completion email sent

6. **Final Verification:**
   - ✅ User balance: EUR €1500, CEA 100
   - ✅ Settlement status = SETTLED
   - ✅ All status history entries present
   - ✅ No errors in logs

**Test Scenario: Swap CEA→EUA Settlement**

(Similar structure, testing 2 settlement batches: CEA T+2, EUA T+5)

---

### FAZA 6: DOCUMENTATION & DEPLOYMENT

**Obiectiv:** Complete documentation and production readiness
**Timp estimat:** 2 ore

#### Task 6.1: Update API Documentation
**Responsabil:** Tech Writer / Backend Developer
**Fișier:** `docs/api/SETTLEMENT_API.md`

```markdown
# Settlement API Documentation

## Overview

The Settlement API manages external T+N settlement processes for CEA purchases
and CEA↔EUA swaps through external registries.

**Base URL:** `/api/v1/settlement`

**Authentication:** Required (Bearer token)

---

## Endpoints

### GET /settlement/pending

Get pending settlements for the authenticated user's entity.

**Auth:** Required
**Role:** Any authenticated user

**Query Parameters:**
- `settlement_type` (optional): Filter by CEA_PURCHASE or SWAP_CEA_TO_EUA
- `status_filter` (optional): Filter by status (PENDING, TRANSFER_INITIATED, etc.)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "batch_reference": "SET-2026-000123-CEA",
      "settlement_type": "CEA_PURCHASE",
      "status": "IN_TRANSIT",
      "asset_type": "CEA",
      "quantity": 100.00,
      "price": 15.50,
      "total_value_eur": 1550.00,
      "expected_settlement_date": "2026-01-28T00:00:00Z",
      "actual_settlement_date": null,
      "created_at": "2026-01-25T10:00:00Z",
      "status_history": [
        {
          "status": "PENDING",
          "notes": "Settlement created",
          "created_at": "2026-01-25T10:00:00Z"
        },
        {
          "status": "TRANSFER_INITIATED",
          "notes": "Automatic status update",
          "created_at": "2026-01-26T01:00:00Z"
        }
      ]
    }
  ],
  "count": 1
}
```

### GET /settlement/{id}

Get details for a specific settlement batch.

**Auth:** Required
**Role:** User must own the settlement or be admin

**Response:** Single settlement object (same structure as above)

### GET /settlement/{id}/timeline

Get complete timeline with progress calculation.

**Response:**
```json
{
  "settlement": { /* settlement object */ },
  "status_history": [ /* all status changes */ ],
  "progress_percentage": 50
}
```

### PUT /settlement/{id}/status (Admin only)

Manually update settlement status.

**Auth:** Required
**Role:** ADMIN

**Body:**
```json
{
  "new_status": "SETTLED",
  "notes": "Manual settlement due to registry confirmation"
}
```

---

## Settlement Types

### CEA_PURCHASE
Timeline: T+1 to T+3 business days

Status progression:
1. PENDING (T+0)
2. TRANSFER_INITIATED (T+1)
3. IN_TRANSIT (T+2)
4. AT_CUSTODY (T+3)
5. SETTLED (T+3)

### SWAP_CEA_TO_EUA
Creates 2 settlement batches:
- CEA outbound: T+1 to T+2
- EUA inbound: T+1 to T+5

---

## Settlement Status

| Status | Description |
|--------|-------------|
| PENDING | Settlement created, awaiting T+1 |
| TRANSFER_INITIATED | Transfer started to registry |
| IN_TRANSIT | Processing by external registry |
| AT_CUSTODY | Arrived at Nihao custody |
| SETTLED | Final settlement complete, assets credited |
| FAILED | Settlement failed, requires intervention |

---

## Business Days Calculation

All timeline dates use **business days** (Monday-Friday), excluding weekends.

Example:
- Order on Friday T+0
- Transfer starts Monday T+1
- In transit Tuesday T+2
- At custody Wednesday T+3
- Settled Wednesday T+3

---

## Error Codes

| Code | Description |
|------|-------------|
| 404 | Settlement not found |
| 403 | Not authorized to view this settlement |
| 400 | Invalid status transition |
| 500 | Internal server error |
```

---

#### Task 6.2: Create Deployment Checklist
**Fișier:** `docs/DEPLOYMENT_CHECKLIST_SETTLEMENT.md`

```markdown
# Settlement System Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] All settlement code reviewed and approved
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling comprehensive
- [ ] Logging appropriate (not too verbose)
- [ ] Security review passed

### Testing
- [ ] All unit tests passing (pytest)
- [ ] Integration tests passing
- [ ] E2E settlement flow tested
- [ ] Frontend UI tested on Chrome, Firefox, Safari
- [ ] Mobile responsive testing done
- [ ] Performance testing (processor handles 1000+ settlements)

### Database
- [ ] Alembic migration tested on staging
- [ ] Migration rollback tested
- [ ] Database backup created
- [ ] Indexes optimized for performance

### Documentation
- [ ] API documentation complete
- [ ] User guide written
- [ ] Admin guide written
- [ ] Runbook for troubleshooting

---

## Deployment Steps

### 1. Database Migration (15 min)

```bash
# Backup production database
docker compose exec db pg_dump -U niha_user niha_carbon > backup_pre_settlement_$(date +%Y%m%d).sql

# Run migration
docker compose exec backend alembic upgrade head

# Verify tables created
docker compose exec db psql -U niha_user -d niha_carbon -c "\dt settlement*"
```

### 2. Deploy Backend (10 min)

```bash
# Pull latest code
git pull origin main

# Rebuild backend
docker compose build backend

# Deploy
docker compose up -d backend

# Monitor logs
docker compose logs -f backend

# Verify health
curl http://localhost:8000/health
```

### 3. Deploy Frontend (10 min)

```bash
# Build frontend
docker compose build frontend

# Deploy
docker compose up -d frontend

# Verify
open http://localhost:5173
```

### 4. Start Settlement Processor (5 min)

- Processor starts automatically with backend
- Verify in logs: "Settlement processor started"
- Check first run processes settlements correctly

---

## Post-Deployment Verification

### Functional Tests (30 min)

#### Test 1: Create Settlement
1. Login as user
2. Place CEA buy order
3. Verify settlement created
4. Check Dashboard shows pending settlement
5. Check email notification sent

#### Test 2: Status Progression
1. Wait for processor run (or trigger manually)
2. Verify status advances
3. Check status history updated
4. Verify email sent

#### Test 3: Settlement Completion
1. Advance to SETTLED status (manually for testing)
2. Verify CEA added to EntityHolding
3. Verify AssetTransaction created
4. Check completion email

#### Test 4: Admin Interface
1. Login as admin
2. View all settlements
3. Manually update status
4. Add registry reference
5. Verify audit trail

### Monitoring (24 hours)

- [ ] Settlement processor runs every hour
- [ ] No errors in backend logs
- [ ] Email notifications sent correctly
- [ ] Database performance acceptable
- [ ] Frontend loads without errors
- [ ] No user complaints

---

## Rollback Procedure

If critical issues discovered:

### Quick Rollback (if processor causing issues)

```bash
# Stop processor
# Edit main.py, comment out processor_task creation
# Restart backend
docker compose restart backend
```

### Full Rollback (if major issues)

```bash
# 1. Stop services
docker compose down

# 2. Restore code
git checkout <previous-commit>

# 3. Rollback database
docker compose exec backend alembic downgrade -1

# 4. Restart
docker compose up -d

# 5. Verify old system works
curl http://localhost:8000/health
```

---

## Success Criteria

Settlement system is considered successfully deployed when:

- ✅ Backend starts without errors
- ✅ Frontend loads without errors
- ✅ Settlements created on order execution
- ✅ Processor advances statuses correctly
- ✅ EntityHolding updated when SETTLED
- ✅ Email notifications sent
- ✅ Admin can manage settlements
- ✅ No performance degradation
- ✅ Database queries performant
- ✅ No regressions in existing features

---

## Support Contacts

- **Backend Issues:** [Backend Team]
- **Frontend Issues:** [Frontend Team]
- **Database Issues:** [DBA]
- **Email Issues:** [DevOps]
- **On-call:** [Rotation Schedule]
```

---

### FAZA 7: PRODUCTION MONITORING & OPTIMIZATION

**Obiectiv:** Ensure smooth production operation
**Timp estimat:** Ongoing

#### Task 7.1: Settlement Monitoring Dashboard
**Responsabil:** DevOps / Backend Developer

**Metrics to Track:**
1. Settlement creation rate (per hour/day)
2. Average settlement time (expected vs actual)
3. Settlement success rate (SETTLED / total)
4. Failed settlements count
5. Overdue settlements alert
6. Processor execution time
7. Email delivery rate

**Implementation:** Use existing TicketLog system or add dedicated monitoring.

---

#### Task 7.2: Performance Optimization
**Responsabil:** Backend Developer

**Optimize:**
1. Database queries (use indexes)
2. Batch processing (process multiple settlements in single transaction)
3. Email sending (async queue, batch emails)
4. Frontend polling (WebSocket for real-time updates instead of polling)

---

## TIMELINE ESTIMAT TOTAL

| Fază | Descriere | Timp | Cumulativ |
|------|-----------|------|-----------|
| 1 | Recuperare Critică | 30-60 min | 1 oră |
| 2 | Settlement Service | 3-4 ore | 5 ore |
| 3 | Background Processing | 2 ore | 7 ore |
| 4 | Frontend Integration | 2-3 ore | 10 ore |
| 5 | Testing & QA | 3-4 ore | 14 ore |
| 6 | Documentation | 2 ore | 16 ore |
| 7 | Production Monitoring | Ongoing | - |

**Total timp implementare:** 16-18 ore lucru
**Recuperare critică (aplicație funcțională):** 1 oră

---

## PRIORITĂȚI

### P0 - URGENT (Faza 1)
**Timp:** 30-60 minute
**Obiectiv:** Aplicația pornește

1. Add Settlement models to models.py
2. Create Alembic migration
3. Run migration
4. Restart services
5. Verify no errors

### P1 - HIGH (Faza 2-3)
**Timp:** 5-6 ore
**Obiectiv:** Settlement system functional

1. Implement SettlementService
2. Integrate into order matching
3. Create background processor
4. Test basic flow

### P2 - MEDIUM (Faza 4-5)
**Timp:** 5-7 ore
**Obiectiv:** Complete UX and testing

1. Frontend integration
2. Enhanced UI
3. Comprehensive testing
4. Bug fixes

### P3 - NORMAL (Faza 6-7)
**Timp:** 2+ ore
**Obiectiv:** Production readiness

1. Documentation
2. Deployment preparation
3. Monitoring setup

---

## RISCURI ȘI MITIGĂRI

| Risc | Probabilitate | Impact | Mitigare |
|------|---------------|--------|----------|
| Migration fail | LOW | HIGH | Test on staging first, have rollback ready |
| Data loss | LOW | CRITICAL | Backup before migration, verify backup restorable |
| Performance issues | MEDIUM | MEDIUM | Test with large dataset, optimize queries |
| Email delivery fail | MEDIUM | LOW | Use reliable service (Resend), fallback to logs |
| User confusion | HIGH | MEDIUM | Clear UI, documentation, training |
| Background processor crash | MEDIUM | MEDIUM | Error handling, logging, restart mechanism |

---

## CRITERII DE SUCCES

### Aplicație Funcțională (Faza 1)
- ✅ Backend pornește fără erori
- ✅ Frontend se încarcă
- ✅ Users pot login
- ✅ Dashboard accesibil
- ✅ No regressions în features existente

### Settlement System Complete (Faza 2-6)
- ✅ Settlements se creează la order execution
- ✅ Status se actualizează automat (T+1, T+2, T+3)
- ✅ EntityHolding se actualizează la SETTLED
- ✅ Email notifications funcționează
- ✅ Admin poate manage settlements
- ✅ Frontend afișează pending settlements
- ✅ Timeline visualization funcționează
- ✅ All tests pass

### Production Ready (Faza 7)
- ✅ Monitoring în loc
- ✅ Alerts configurate
- ✅ Documentation completă
- ✅ Team trained
- ✅ Rollback plan testat

---

## NEXT STEPS

1. **Urgent (Acum):** Fix critical errors (Faza 1) - 1 oră
2. **Astăzi:** Complete Settlement Service (Faza 2) - 4 ore
3. **Mâine:** Background processing + Frontend (Faza 3-4) - 5 ore
4. **Săptămâna asta:** Testing + Documentation (Faza 5-6) - 6 ore
5. **Săptămâna viitoare:** Deploy to production (Faza 7)

---

**Document end** | Version 1.0 | 2026-01-25