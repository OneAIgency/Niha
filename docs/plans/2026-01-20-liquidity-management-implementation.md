# Liquidity Management and Cash Market Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement programmatic liquidity management with EUR-holding market makers and redesigned cash market UI.

**Architecture:** Three-layer implementation: (1) Database models for MM types and liquidity operations, (2) Backend service layer for liquidity distribution algorithms and API endpoints, (3) Frontend UI for liquidity creation and redesigned order book display.

**Tech Stack:** FastAPI, SQLAlchemy (async), PostgreSQL, React, TypeScript, TailwindCSS, Framer Motion

---

## Phase 1: Database Models and Migrations

### Task 1: Add MarketMakerType Enum

**Files:**
- Modify: `backend/app/models/models.py` (after line 493, after TransactionType)
- Create: `backend/alembic/versions/TIMESTAMP_add_market_maker_type.py`

**Step 1: Add enum to models**

Add after `TransactionType` enum (around line 503):

```python
class MarketMakerType(str, enum.Enum):
    """Types of market maker clients"""
    ASSET_HOLDER = "ASSET_HOLDER"          # Holds CEA/EUA, places SELL orders
    LIQUIDITY_PROVIDER = "LIQUIDITY_PROVIDER"  # Holds EUR, places BUY orders
```

**Step 2: Update MarketMakerClient model**

In `MarketMakerClient` class (around line 193), add new columns after `created_by`:

```python
mm_type = Column(SQLEnum(MarketMakerType), default=MarketMakerType.ASSET_HOLDER, nullable=False)
eur_balance = Column(Numeric(18, 2), default=0, nullable=False)  # For Liquidity Providers
```

**Step 3: Create migration**

Run:
```bash
cd backend
alembic revision --autogenerate -m "Add market maker type and EUR balance"
```

**Step 4: Review and edit migration**

Open generated migration file in `backend/alembic/versions/`, verify it includes:
- CREATE TYPE for `marketmakertype` enum
- ALTER TABLE `market_maker_clients` ADD COLUMN `mm_type`
- ALTER TABLE `market_maker_clients` ADD COLUMN `eur_balance`

**Step 5: Run migration**

```bash
alembic upgrade head
```

Expected: Migration applies successfully, no errors

**Step 6: Commit**

```bash
git add backend/app/models/models.py backend/alembic/versions/
git commit -m "feat: add MarketMakerType enum and EUR balance to MM model

- Add ASSET_HOLDER and LIQUIDITY_PROVIDER types
- Add eur_balance column for EUR-holding MMs
- Database migration for new columns"
```

---

### Task 2: Add LiquidityOperation Model

**Files:**
- Modify: `backend/app/models/models.py` (add after TicketLog model, around line 587)
- Create: `backend/alembic/versions/TIMESTAMP_add_liquidity_operations.py`

**Step 1: Add LiquidityOperation model**

Add after `TicketLog` class:

```python
class LiquidityOperation(Base):
    """Audit trail for liquidity creation operations"""
    __tablename__ = "liquidity_operations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(30), nullable=False, unique=True, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False, index=True)

    # Targets
    target_bid_liquidity_eur = Column(Numeric(18, 2), nullable=False)
    target_ask_liquidity_eur = Column(Numeric(18, 2), nullable=False)

    # Actuals
    actual_bid_liquidity_eur = Column(Numeric(18, 2), nullable=False)
    actual_ask_liquidity_eur = Column(Numeric(18, 2), nullable=False)

    # Execution details
    market_makers_used = Column(JSONB, nullable=False)  # [{mm_id, mm_type, amount}, ...]
    orders_created = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    reference_price = Column(Numeric(18, 4), nullable=False)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
```

**Step 2: Create migration**

```bash
cd backend
alembic revision --autogenerate -m "Add liquidity operations table"
```

**Step 3: Run migration**

```bash
alembic upgrade head
```

Expected: New table `liquidity_operations` created successfully

**Step 4: Commit**

```bash
git add backend/app/models/models.py backend/alembic/versions/
git commit -m "feat: add LiquidityOperation model for audit trail

- Track liquidity creation operations
- Store target vs actual liquidity amounts
- Link to market makers and orders created"
```

---

### Task 3: Update Schemas for New Types

**Files:**
- Modify: `backend/app/schemas/schemas.py`

**Step 1: Add MarketMakerType enum to schemas**

Add after existing enums (around line 785):

```python
class MarketMakerTypeEnum(str, Enum):
    ASSET_HOLDER = "ASSET_HOLDER"
    LIQUIDITY_PROVIDER = "LIQUIDITY_PROVIDER"
```

**Step 2: Update MarketMakerResponse schema**

Find `MarketMakerResponse` schema and add fields:

```python
mm_type: MarketMakerTypeEnum
eur_balance: Optional[Decimal] = None
```

**Step 3: Update MarketMakerCreateRequest schema**

Find `MarketMakerCreateRequest` and add:

```python
mm_type: MarketMakerTypeEnum = MarketMakerTypeEnum.ASSET_HOLDER
initial_eur_balance: Optional[Decimal] = None
```

**Step 4: Add new liquidity schemas**

Add at end of file:

```python
class LiquidityPreviewRequest(BaseModel):
    certificate_type: CertificateTypeEnum
    bid_amount_eur: Decimal
    ask_amount_eur: Decimal

class MarketMakerAllocation(BaseModel):
    mm_id: uuid.UUID
    mm_name: str
    mm_type: MarketMakerTypeEnum
    allocation: Decimal
    orders_count: int

class LiquidityPlan(BaseModel):
    mms: List[MarketMakerAllocation]
    total_amount: Decimal
    price_levels: List[Dict[str, Any]]

class MissingAssets(BaseModel):
    asset_type: str
    required: Decimal
    available: Decimal
    shortfall: Decimal

class LiquidityPreviewResponse(BaseModel):
    can_execute: bool
    certificate_type: str
    bid_plan: LiquidityPlan
    ask_plan: LiquidityPlan
    missing_assets: Optional[MissingAssets] = None
    suggested_actions: List[str]
    total_orders_count: int
    estimated_spread: Decimal

class LiquidityCreateRequest(BaseModel):
    certificate_type: CertificateTypeEnum
    bid_amount_eur: Decimal
    ask_amount_eur: Decimal
    notes: Optional[str] = None

class LiquidityCreateResponse(BaseModel):
    success: bool
    liquidity_operation_id: uuid.UUID
    orders_created: int
    bid_liquidity_eur: Decimal
    ask_liquidity_eur: Decimal
    market_makers_used: List[Dict[str, Any]]

class ProvisionRequest(BaseModel):
    action: str  # 'create_new' or 'fund_existing'
    mm_type: MarketMakerTypeEnum
    amount: Decimal
    mm_ids: Optional[List[uuid.UUID]] = None
    count: Optional[int] = None
```

**Step 5: Commit**

```bash
git add backend/app/schemas/schemas.py
git commit -m "feat: add schemas for liquidity management

- Add MarketMakerTypeEnum
- Add liquidity preview and creation schemas
- Update MM schemas with new fields"
```

---

## Phase 2: Backend Services

### Task 4: Create Liquidity Service - Part 1 (Helper Functions)

**Files:**
- Create: `backend/app/services/liquidity_service.py`
- Create: `backend/tests/test_liquidity_service.py`

**Step 1: Write test for get_liquidity_providers**

Create test file:

```python
"""Tests for liquidity service"""
import pytest
from decimal import Decimal
from app.services.liquidity_service import LiquidityService
from app.models.models import MarketMakerClient, User, MarketMakerType, UserRole

@pytest.mark.asyncio
async def test_get_liquidity_providers(db_session, test_admin_user):
    """Test fetching EUR-holding market makers"""
    # Create liquidity provider MM
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Test",
        mm_type=MarketMakerType.LIQUIDITY_PROVIDER,
        eur_balance=Decimal("100000"),
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(lp_mm)

    # Create asset holder MM (should not be returned)
    ah_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="AH-Test",
        mm_type=MarketMakerType.ASSET_HOLDER,
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(ah_mm)
    await db_session.commit()

    # Test
    result = await LiquidityService.get_liquidity_providers(db_session)

    assert len(result) == 1
    assert result[0].id == lp_mm.id
    assert result[0].eur_balance == Decimal("100000")
```

**Step 2: Run test to verify it fails**

```bash
cd backend
pytest tests/test_liquidity_service.py::test_get_liquidity_providers -v
```

Expected: FAIL - "ModuleNotFoundError: No module named 'app.services.liquidity_service'"

**Step 3: Create liquidity service file**

Create `backend/app/services/liquidity_service.py`:

```python
"""Liquidity management service"""
import uuid
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import (
    MarketMakerClient, MarketMakerType, Order, OrderSide, OrderStatus,
    CertificateType, AssetTransaction, TransactionType, LiquidityOperation
)
from app.services.ticket_service import TicketService
from app.models.models import TicketStatus
import logging

logger = logging.getLogger(__name__)


class InsufficientAssetsError(Exception):
    """Raised when market makers lack sufficient assets"""
    def __init__(self, asset_type: str, required: Decimal, available: Decimal):
        self.asset_type = asset_type
        self.required = required
        self.available = available
        self.shortfall = required - available
        super().__init__(
            f"Insufficient {asset_type}: need {required}, have {available}, short {self.shortfall}"
        )


class LiquidityService:
    """Service for managing liquidity operations"""

    @staticmethod
    async def get_liquidity_providers(db: AsyncSession) -> List[MarketMakerClient]:
        """Get all active EUR-holding market makers with balances"""
        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.LIQUIDITY_PROVIDER,
                    MarketMakerClient.is_active == True,
                    MarketMakerClient.eur_balance > 0
                )
            )
            .order_by(MarketMakerClient.eur_balance.desc())
        )
        return result.scalars().all()
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_liquidity_service.py::test_get_liquidity_providers -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: add get_liquidity_providers to liquidity service

- Query EUR-holding market makers
- Filter by active status and positive balance
- Add test coverage"
```

---

### Task 5: Create Liquidity Service - Part 2 (Asset Holders)

**Files:**
- Modify: `backend/app/services/liquidity_service.py`
- Modify: `backend/tests/test_liquidity_service.py`

**Step 1: Write test for get_asset_holders**

Add to test file:

```python
@pytest.mark.asyncio
async def test_get_asset_holders(db_session, test_admin_user):
    """Test fetching asset-holding market makers"""
    from app.services.market_maker_service import MarketMakerService

    # Create asset holder MM with CEA
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-CEA",
        email="ah@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("5000")}
    )

    # Test
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)

    assert len(result) >= 1
    found = any(mm.id == ah_mm.id for mm in result)
    assert found
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_liquidity_service.py::test_get_asset_holders -v
```

Expected: FAIL - "AttributeError: get_asset_holders not found"

**Step 3: Add get_asset_holders method**

Add to `LiquidityService` class:

```python
    @staticmethod
    async def get_asset_holders(
        db: AsyncSession,
        certificate_type: CertificateType
    ) -> List[Dict[str, any]]:
        """Get all active asset-holding MMs with certificate balances"""
        from app.services.market_maker_service import MarketMakerService

        result = await db.execute(
            select(MarketMakerClient)
            .where(
                and_(
                    MarketMakerClient.mm_type == MarketMakerType.ASSET_HOLDER,
                    MarketMakerClient.is_active == True
                )
            )
        )
        mms = result.scalars().all()

        # Get balances for each MM
        mm_data = []
        for mm in mms:
            balances = await MarketMakerService.get_balances(db, mm.id)
            available = balances[certificate_type.value]["available"]
            if available > 0:
                mm_data.append({
                    "mm": mm,
                    "available": available
                })

        return mm_data
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_liquidity_service.py::test_get_asset_holders -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: add get_asset_holders to liquidity service

- Query asset-holding market makers
- Calculate available balances per certificate type
- Add test coverage"
```

---

### Task 6: Create Liquidity Service - Part 3 (Price Calculation)

**Files:**
- Modify: `backend/app/services/liquidity_service.py`
- Modify: `backend/tests/test_liquidity_service.py`

**Step 1: Write test for calculate_reference_price**

Add to test file:

```python
@pytest.mark.asyncio
async def test_calculate_reference_price(db_session):
    """Test reference price calculation"""
    # Mock orderbook data - in real test, create orders
    result = await LiquidityService.calculate_reference_price(
        db_session,
        CertificateType.CEA
    )

    assert result > 0
    assert isinstance(result, Decimal)
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_liquidity_service.py::test_calculate_reference_price -v
```

Expected: FAIL - "AttributeError: calculate_reference_price not found"

**Step 3: Add price calculation methods**

Add to `LiquidityService` class:

```python
    # Default prices when no market data available
    DEFAULT_PRICES = {
        CertificateType.CEA: Decimal("14.0"),
        CertificateType.EUA: Decimal("81.0")
    }

    @staticmethod
    async def calculate_reference_price(
        db: AsyncSession,
        certificate_type: CertificateType
    ) -> Decimal:
        """Calculate reference price from current orderbook"""
        from app.services.order_matching import get_real_orderbook

        try:
            orderbook = await get_real_orderbook(db, certificate_type.value)

            # Use mid-price if both sides exist
            if orderbook["best_bid"] and orderbook["best_ask"]:
                return (Decimal(str(orderbook["best_bid"])) +
                       Decimal(str(orderbook["best_ask"]))) / 2

            # Use best bid or ask if only one exists
            if orderbook["best_bid"]:
                return Decimal(str(orderbook["best_bid"]))
            if orderbook["best_ask"]:
                return Decimal(str(orderbook["best_ask"]))

            # Use last price if available
            if orderbook["last_price"]:
                return Decimal(str(orderbook["last_price"]))

        except Exception as e:
            logger.warning(f"Could not get orderbook price: {e}")

        # Fallback to default
        return LiquidityService.DEFAULT_PRICES[certificate_type]

    @staticmethod
    def generate_price_levels(
        reference_price: Decimal,
        side: OrderSide
    ) -> List[Tuple[Decimal, Decimal]]:
        """
        Generate 3 price levels with volume distribution.
        Returns: [(price, percentage), ...]
        """
        if side == OrderSide.BUY:
            # BID levels: 0.2%, 0.4%, 0.5% below mid
            levels = [
                (reference_price * Decimal("0.998"), Decimal("0.5")),  # 50% volume
                (reference_price * Decimal("0.996"), Decimal("0.3")),  # 30% volume
                (reference_price * Decimal("0.995"), Decimal("0.2")),  # 20% volume
            ]
        else:  # SELL
            # ASK levels: 0.2%, 0.4%, 0.5% above mid
            levels = [
                (reference_price * Decimal("1.002"), Decimal("0.5")),  # 50% volume
                (reference_price * Decimal("1.004"), Decimal("0.3")),  # 30% volume
                (reference_price * Decimal("1.005"), Decimal("0.2")),  # 20% volume
            ]

        return levels
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_liquidity_service.py::test_calculate_reference_price -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: add price calculation to liquidity service

- Calculate reference price from orderbook
- Generate tight spread price levels (0.2-0.5%)
- Distribute volume 50/30/20 across levels"
```

---

### Task 7: Create Liquidity Service - Part 4 (Preview)

**Files:**
- Modify: `backend/app/services/liquidity_service.py`
- Modify: `backend/tests/test_liquidity_service.py`

**Step 1: Write test for preview_liquidity_creation**

Add to test file:

```python
@pytest.mark.asyncio
async def test_preview_liquidity_creation_sufficient_assets(
    db_session, test_admin_user
):
    """Test preview with sufficient assets"""
    from app.services.market_maker_service import MarketMakerService

    # Create liquidity provider with EUR
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Preview",
        mm_type=MarketMakerType.LIQUIDITY_PROVIDER,
        eur_balance=Decimal("200000"),
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(lp_mm)

    # Create asset holder with CEA
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Preview",
        email="ah-preview@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")}
    )
    await db_session.commit()

    # Test preview
    preview = await LiquidityService.preview_liquidity_creation(
        db=db_session,
        certificate_type=CertificateType.CEA,
        bid_amount_eur=Decimal("100000"),
        ask_amount_eur=Decimal("50000")
    )

    assert preview["can_execute"] is True
    assert len(preview["bid_plan"]["mms"]) >= 1
    assert len(preview["ask_plan"]["mms"]) >= 1
    assert preview["missing_assets"] is None
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_liquidity_service.py::test_preview_liquidity_creation_sufficient_assets -v
```

Expected: FAIL - "AttributeError: preview_liquidity_creation not found"

**Step 3: Add preview_liquidity_creation method**

Add to `LiquidityService` class:

```python
    @staticmethod
    async def preview_liquidity_creation(
        db: AsyncSession,
        certificate_type: CertificateType,
        bid_amount_eur: Decimal,
        ask_amount_eur: Decimal
    ) -> Dict:
        """
        Preview liquidity creation without executing.
        Returns plan showing what will be executed.
        """
        # Calculate reference price
        reference_price = await LiquidityService.calculate_reference_price(
            db, certificate_type
        )

        # Get liquidity providers
        lp_mms = await LiquidityService.get_liquidity_providers(db)
        total_eur_available = sum(mm.eur_balance for mm in lp_mms)

        # Check BID liquidity
        bid_sufficient = total_eur_available >= bid_amount_eur
        missing_assets = None

        if not bid_sufficient:
            missing_assets = {
                "asset_type": "EUR",
                "required": float(bid_amount_eur),
                "available": float(total_eur_available),
                "shortfall": float(bid_amount_eur - total_eur_available)
            }

        # Get asset holders
        ah_data = await LiquidityService.get_asset_holders(db, certificate_type)
        total_certs_available = sum(Decimal(str(ah["available"])) for ah in ah_data)
        ask_quantity_needed = ask_amount_eur / reference_price

        # Check ASK liquidity
        ask_sufficient = total_certs_available >= ask_quantity_needed

        if not ask_sufficient and not missing_assets:
            missing_assets = {
                "asset_type": certificate_type.value,
                "required": float(ask_quantity_needed),
                "available": float(total_certs_available),
                "shortfall": float(ask_quantity_needed - total_certs_available)
            }

        # Build BID plan
        bid_plan = {
            "mms": [],
            "total_amount": float(bid_amount_eur),
            "price_levels": []
        }

        if lp_mms:
            eur_per_mm = bid_amount_eur / len(lp_mms)
            for mm in lp_mms:
                bid_plan["mms"].append({
                    "mm_id": str(mm.id),
                    "mm_name": mm.name,
                    "mm_type": "LIQUIDITY_PROVIDER",
                    "allocation": float(eur_per_mm),
                    "orders_count": 3
                })

            # Price levels
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.BUY)
            for price, pct in levels:
                bid_plan["price_levels"].append({
                    "price": float(price),
                    "percentage": float(pct * 100)
                })

        # Build ASK plan
        ask_plan = {
            "mms": [],
            "total_amount": float(ask_amount_eur),
            "price_levels": []
        }

        if ah_data:
            quantity_per_mm = ask_quantity_needed / len(ah_data)
            for ah in ah_data:
                ask_plan["mms"].append({
                    "mm_id": str(ah["mm"].id),
                    "mm_name": ah["mm"].name,
                    "mm_type": "ASSET_HOLDER",
                    "allocation": float(quantity_per_mm),
                    "orders_count": 3
                })

            # Price levels
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.SELL)
            for price, pct in levels:
                ask_plan["price_levels"].append({
                    "price": float(price),
                    "percentage": float(pct * 100)
                })

        # Suggested actions if insufficient
        suggested_actions = []
        if missing_assets:
            if missing_assets["asset_type"] == "EUR":
                suggested_actions.append("create_liquidity_providers")
                suggested_actions.append("fund_existing_lps")
            else:
                suggested_actions.append("create_asset_holders")
                suggested_actions.append("fund_existing_ahs")

        return {
            "can_execute": bid_sufficient and ask_sufficient,
            "certificate_type": certificate_type.value,
            "bid_plan": bid_plan,
            "ask_plan": ask_plan,
            "missing_assets": missing_assets,
            "suggested_actions": suggested_actions,
            "total_orders_count": len(bid_plan["mms"]) * 3 + len(ask_plan["mms"]) * 3,
            "estimated_spread": 0.5  # 0.5% spread
        }
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_liquidity_service.py::test_preview_liquidity_creation_sufficient_assets -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: add preview_liquidity_creation to service

- Check asset sufficiency for both sides
- Build execution plan with MM allocations
- Calculate price levels and order distribution
- Suggest actions when assets insufficient"
```

---

### Task 8: Create Liquidity Service - Part 5 (Execution)

**Files:**
- Modify: `backend/app/services/liquidity_service.py`
- Modify: `backend/tests/test_liquidity_service.py`

**Step 1: Write test for create_liquidity**

Add to test file:

```python
@pytest.mark.asyncio
async def test_create_liquidity_execution(db_session, test_admin_user):
    """Test actual liquidity creation with order placement"""
    from app.services.market_maker_service import MarketMakerService

    # Setup MMs
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Execute",
        mm_type=MarketMakerType.LIQUIDITY_PROVIDER,
        eur_balance=Decimal("200000"),
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(lp_mm)

    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Execute",
        email="ah-execute@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")}
    )
    await db_session.commit()

    # Execute liquidity creation
    result = await LiquidityService.create_liquidity(
        db=db_session,
        certificate_type=CertificateType.CEA,
        bid_amount_eur=Decimal("50000"),
        ask_amount_eur=Decimal("25000"),
        created_by_id=test_admin_user.id
    )

    assert result.id is not None
    assert len(result.orders_created) == 6  # 3 bid + 3 ask
    assert result.actual_bid_liquidity_eur == Decimal("50000")
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_liquidity_service.py::test_create_liquidity_execution -v
```

Expected: FAIL - "AttributeError: create_liquidity not found"

**Step 3: Add create_liquidity method**

Add to `LiquidityService` class:

```python
    @staticmethod
    async def create_liquidity(
        db: AsyncSession,
        certificate_type: CertificateType,
        bid_amount_eur: Decimal,
        ask_amount_eur: Decimal,
        created_by_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> LiquidityOperation:
        """
        Execute liquidity creation by placing orders across MMs.
        Raises InsufficientAssetsError if assets lacking.
        """
        # First, preview to validate
        preview = await LiquidityService.preview_liquidity_creation(
            db, certificate_type, bid_amount_eur, ask_amount_eur
        )

        if not preview["can_execute"]:
            missing = preview["missing_assets"]
            raise InsufficientAssetsError(
                missing["asset_type"],
                Decimal(str(missing["required"])),
                Decimal(str(missing["available"]))
            )

        # Calculate reference price
        reference_price = await LiquidityService.calculate_reference_price(
            db, certificate_type
        )

        # Get MMs
        lp_mms = await LiquidityService.get_liquidity_providers(db)
        ah_data = await LiquidityService.get_asset_holders(db, certificate_type)

        orders_created = []
        mms_used = []

        # Create BID orders
        if lp_mms:
            eur_per_mm = bid_amount_eur / len(lp_mms)
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.BUY)

            for mm in lp_mms:
                for price, pct in levels:
                    quantity = (eur_per_mm * pct) / price

                    order = Order(
                        market_maker_id=mm.id,
                        certificate_type=certificate_type,
                        side=OrderSide.BUY,
                        price=price.quantize(Decimal("0.0001")),
                        quantity=quantity.quantize(Decimal("0.01")),
                        filled_quantity=Decimal("0"),
                        status=OrderStatus.OPEN
                    )
                    db.add(order)
                    await db.flush()
                    orders_created.append(order.id)

                # Update MM balance (lock EUR)
                mm.eur_balance -= eur_per_mm

                mms_used.append({
                    "mm_id": str(mm.id),
                    "mm_type": "LIQUIDITY_PROVIDER",
                    "amount": float(eur_per_mm)
                })

        # Create ASK orders
        if ah_data:
            ask_quantity_needed = ask_amount_eur / reference_price
            quantity_per_mm = ask_quantity_needed / len(ah_data)
            levels = LiquidityService.generate_price_levels(reference_price, OrderSide.SELL)

            for ah in ah_data:
                mm = ah["mm"]
                for price, pct in levels:
                    quantity = quantity_per_mm * pct

                    order = Order(
                        market_maker_id=mm.id,
                        certificate_type=certificate_type,
                        side=OrderSide.SELL,
                        price=price.quantize(Decimal("0.0001")),
                        quantity=quantity.quantize(Decimal("0.01")),
                        filled_quantity=Decimal("0"),
                        status=OrderStatus.OPEN
                    )
                    db.add(order)
                    await db.flush()
                    orders_created.append(order.id)

                mms_used.append({
                    "mm_id": str(mm.id),
                    "mm_type": "ASSET_HOLDER",
                    "amount": float(quantity_per_mm)
                })

        # Create ticket for audit
        ticket = await TicketService.create_ticket(
            db=db,
            action_type="LIQUIDITY_CREATED",
            entity_type="LiquidityOperation",
            entity_id=None,  # Will update after creating operation
            status=TicketStatus.SUCCESS,
            user_id=created_by_id,
            request_payload={
                "certificate_type": certificate_type.value,
                "bid_amount_eur": str(bid_amount_eur),
                "ask_amount_eur": str(ask_amount_eur)
            },
            after_state={
                "orders_created": len(orders_created),
                "mms_used": len(mms_used)
            },
            tags=["liquidity", "market_making"]
        )

        # Create liquidity operation record
        operation = LiquidityOperation(
            ticket_id=ticket.ticket_id,
            certificate_type=certificate_type,
            target_bid_liquidity_eur=bid_amount_eur,
            target_ask_liquidity_eur=ask_amount_eur,
            actual_bid_liquidity_eur=bid_amount_eur,
            actual_ask_liquidity_eur=ask_amount_eur,
            market_makers_used=mms_used,
            orders_created=orders_created,
            reference_price=reference_price,
            created_by=created_by_id,
            notes=notes
        )
        db.add(operation)
        await db.flush()

        # Update ticket with operation ID
        ticket.entity_id = operation.id

        await db.commit()
        await db.refresh(operation)

        return operation
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_liquidity_service.py::test_create_liquidity_execution -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: add create_liquidity execution to service

- Place orders across all market makers
- Lock assets (EUR for LPs, certificates for AHs)
- Create audit trail with ticket logging
- Return LiquidityOperation record"
```

---

## Phase 3: API Endpoints

### Task 9: Create Liquidity API Router

**Files:**
- Create: `backend/app/api/v1/liquidity.py`
- Modify: `backend/app/api/v1/__init__.py`
- Create: `backend/tests/test_liquidity_api.py`

**Step 1: Write test for preview endpoint**

Create test file:

```python
"""Tests for liquidity API endpoints"""
import pytest
from httpx import AsyncClient
from decimal import Decimal

@pytest.mark.asyncio
async def test_preview_liquidity_endpoint(client: AsyncClient, admin_token):
    """Test liquidity preview endpoint"""
    response = await client.post(
        "/api/v1/liquidity/preview",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "certificate_type": "CEA",
            "bid_amount_eur": 100000,
            "ask_amount_eur": 50000
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "can_execute" in data
    assert "bid_plan" in data
    assert "ask_plan" in data
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_liquidity_api.py::test_preview_liquidity_endpoint -v
```

Expected: FAIL - "404 Not Found"

**Step 3: Create liquidity router**

Create `backend/app/api/v1/liquidity.py`:

```python
"""Liquidity management API endpoints"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import User, CertificateType
from app.schemas.schemas import (
    LiquidityPreviewRequest,
    LiquidityPreviewResponse,
    LiquidityCreateRequest,
    LiquidityCreateResponse,
    ProvisionRequest
)
from app.services.liquidity_service import LiquidityService, InsufficientAssetsError

router = APIRouter(prefix="/liquidity", tags=["Liquidity"])


@router.post("/preview", response_model=LiquidityPreviewResponse)
async def preview_liquidity_creation(
    request: LiquidityPreviewRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Preview liquidity creation without executing.
    Shows what MMs will be used and whether assets are sufficient.
    """
    preview = await LiquidityService.preview_liquidity_creation(
        db=db,
        certificate_type=CertificateType(request.certificate_type.value),
        bid_amount_eur=request.bid_amount_eur,
        ask_amount_eur=request.ask_amount_eur
    )

    return LiquidityPreviewResponse(**preview)


@router.post("/create", response_model=LiquidityCreateResponse)
async def create_liquidity(
    request: LiquidityCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute liquidity creation by placing orders across market makers.
    Raises 400 if insufficient assets.
    """
    try:
        operation = await LiquidityService.create_liquidity(
            db=db,
            certificate_type=CertificateType(request.certificate_type.value),
            bid_amount_eur=request.bid_amount_eur,
            ask_amount_eur=request.ask_amount_eur,
            created_by_id=current_user.id,
            notes=request.notes
        )

        return LiquidityCreateResponse(
            success=True,
            liquidity_operation_id=operation.id,
            orders_created=len(operation.orders_created),
            bid_liquidity_eur=operation.actual_bid_liquidity_eur,
            ask_liquidity_eur=operation.actual_ask_liquidity_eur,
            market_makers_used=operation.market_makers_used
        )

    except InsufficientAssetsError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "insufficient_assets",
                "asset_type": e.asset_type,
                "required": float(e.required),
                "available": float(e.available),
                "shortfall": float(e.shortfall)
            }
        )
```

**Step 4: Register router in app**

Modify `backend/app/api/v1/__init__.py`, add:

```python
from .liquidity import router as liquidity_router

# In the router registration section:
app.include_router(liquidity_router, prefix="/api/v1")
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/test_liquidity_api.py::test_preview_liquidity_endpoint -v
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/api/v1/liquidity.py backend/app/api/v1/__init__.py backend/tests/test_liquidity_api.py
git commit -m "feat: add liquidity management API endpoints

- POST /liquidity/preview for dry-run
- POST /liquidity/create for execution
- Admin-only access with proper error handling"
```

---

### Task 10: Update Market Maker API

**Files:**
- Modify: `backend/app/api/v1/market_maker.py`
- Modify: `backend/app/services/market_maker_service.py`

**Step 1: Update create_market_maker to support mm_type**

In `market_maker.py`, modify the create endpoint:

```python
@router.post("/", response_model=MarketMakerResponse)
async def create_market_maker(
    name: str,
    email: str,
    description: Optional[str] = None,
    mm_type: MarketMakerTypeEnum = MarketMakerTypeEnum.ASSET_HOLDER,
    initial_eur_balance: Optional[Decimal] = None,
    initial_balances: Optional[Dict[str, Decimal]] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create market maker client.
    For LIQUIDITY_PROVIDER: provide initial_eur_balance
    For ASSET_HOLDER: provide initial_balances (CEA/EUA)
    """
    from app.models.models import MarketMakerType

    mm_type_enum = MarketMakerType(mm_type.value)

    # Validate inputs
    if mm_type_enum == MarketMakerType.LIQUIDITY_PROVIDER:
        if initial_balances:
            raise HTTPException(400, "LIQUIDITY_PROVIDER cannot have certificate balances")
    else:  # ASSET_HOLDER
        if initial_eur_balance:
            raise HTTPException(400, "ASSET_HOLDER cannot have EUR balance")

    # Create MM
    mm_client, ticket_id = await MarketMakerService.create_market_maker(
        db=db,
        name=name,
        email=email,
        description=description,
        created_by_id=current_user.id,
        initial_balances=initial_balances,
        mm_type=mm_type_enum,
        initial_eur_balance=initial_eur_balance
    )

    return MarketMakerResponse(
        id=mm_client.id,
        name=mm_client.name,
        description=mm_client.description,
        mm_type=MarketMakerTypeEnum(mm_client.mm_type.value),
        eur_balance=mm_client.eur_balance,
        is_active=mm_client.is_active,
        created_at=mm_client.created_at
    )
```

**Step 2: Update MarketMakerService.create_market_maker**

In `market_maker_service.py`, modify the signature and implementation:

```python
@staticmethod
async def create_market_maker(
    db: AsyncSession,
    name: str,
    email: str,
    description: Optional[str],
    created_by_id: uuid.UUID,
    initial_balances: Optional[Dict[str, Decimal]] = None,
    mm_type: MarketMakerType = MarketMakerType.ASSET_HOLDER,
    initial_eur_balance: Optional[Decimal] = None,
) -> tuple[MarketMakerClient, str]:
    """
    Create Market Maker client with associated User.
    Support both ASSET_HOLDER and LIQUIDITY_PROVIDER types.
    """
    # Create user with MARKET_MAKER role
    user = User(
        email=email,
        password_hash=hash_password(str(uuid.uuid4())),
        first_name=name,
        last_name="Market Maker",
        role=UserRole.MARKET_MAKER,
        is_active=True,
        must_change_password=False,
    )
    db.add(user)
    await db.flush()

    # Create MarketMakerClient with type
    mm_client = MarketMakerClient(
        user_id=user.id,
        name=name,
        description=description,
        mm_type=mm_type,
        eur_balance=initial_eur_balance or Decimal("0"),
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
        request_payload={
            "name": name,
            "email": email,
            "description": description,
            "mm_type": mm_type.value
        },
        after_state={
            "id": str(mm_client.id),
            "name": name,
            "mm_type": mm_type.value,
            "is_active": True
        },
        tags=["market_maker", "creation"],
    )

    # Create initial balance transactions
    if mm_type == MarketMakerType.LIQUIDITY_PROVIDER and initial_eur_balance:
        # For LP, just set the EUR balance (already set above)
        pass
    elif mm_type == MarketMakerType.ASSET_HOLDER and initial_balances:
        # For AH, create certificate transactions
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
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/market_maker.py backend/app/services/market_maker_service.py
git commit -m "feat: update MM API to support LIQUIDITY_PROVIDER type

- Add mm_type parameter to creation
- Support initial_eur_balance for LPs
- Validate type-specific funding"
```

---

## Phase 4: Frontend - Liquidity Creation UI

### Task 11: Create Liquidity API Client

**Files:**
- Modify: `frontend/src/services/api.ts`
- Create: `frontend/src/types/liquidity.ts`

**Step 1: Add liquidity types**

Create `frontend/src/types/liquidity.ts`:

```typescript
export interface MarketMakerAllocation {
  mm_id: string;
  mm_name: string;
  mm_type: 'LIQUIDITY_PROVIDER' | 'ASSET_HOLDER';
  allocation: number;
  orders_count: number;
}

export interface LiquidityPlan {
  mms: MarketMakerAllocation[];
  total_amount: number;
  price_levels: Array<{
    price: number;
    percentage: number;
  }>;
}

export interface MissingAssets {
  asset_type: string;
  required: number;
  available: number;
  shortfall: number;
}

export interface LiquidityPreview {
  can_execute: boolean;
  certificate_type: string;
  bid_plan: LiquidityPlan;
  ask_plan: LiquidityPlan;
  missing_assets?: MissingAssets;
  suggested_actions: string[];
  total_orders_count: number;
  estimated_spread: number;
}

export interface LiquidityCreateResult {
  success: boolean;
  liquidity_operation_id: string;
  orders_created: number;
  bid_liquidity_eur: number;
  ask_liquidity_eur: number;
  market_makers_used: Array<{
    mm_id: string;
    mm_type: string;
    amount: number;
  }>;
}
```

**Step 2: Add liquidity API methods**

In `frontend/src/services/api.ts`, add:

```typescript
// Liquidity API
export const liquidityApi = {
  previewLiquidity: async (params: {
    certificate_type: string;
    bid_amount_eur: number;
    ask_amount_eur: number;
  }): Promise<LiquidityPreview> => {
    const response = await apiClient.post('/liquidity/preview', params);
    return response.data;
  },

  createLiquidity: async (params: {
    certificate_type: string;
    bid_amount_eur: number;
    ask_amount_eur: number;
    notes?: string;
  }): Promise<LiquidityCreateResult> => {
    const response = await apiClient.post('/liquidity/create', params);
    return response.data;
  },
};
```

**Step 3: Update MarketMaker types**

In `frontend/src/types/index.ts`, add:

```typescript
export type MarketMakerType = 'ASSET_HOLDER' | 'LIQUIDITY_PROVIDER';

export interface MarketMaker {
  id: string;
  name: string;
  description?: string;
  mm_type: MarketMakerType;
  eur_balance?: number;
  is_active: boolean;
  created_at: string;
}
```

**Step 4: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/types/liquidity.ts frontend/src/types/index.ts
git commit -m "feat: add liquidity API client and types

- Add liquidity preview and creation methods
- Add type definitions for plans and allocations
- Update MM types with new enum"
```

---

### Task 12: Create Liquidity Preview Modal Component

**Files:**
- Create: `frontend/src/components/backoffice/LiquidityPreviewModal.tsx`

**Step 1: Create modal component**

```typescript
import { useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LiquidityPreview } from '../../types/liquidity';
import { Button, Card, Badge } from '../common';

interface LiquidityPreviewModalProps {
  preview: LiquidityPreview;
  onClose: () => void;
  onExecute: () => Promise<void>;
  onProvision?: (action: 'create' | 'fund') => void;
}

export function LiquidityPreviewModal({
  preview,
  onClose,
  onExecute,
  onProvision,
}: LiquidityPreviewModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute();
      onClose();
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-navy-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-navy-200 dark:border-navy-700">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
              Liquidity Creation Preview
            </h2>
            <p className="text-sm text-navy-600 dark:text-navy-400 mt-1">
              Review the execution plan before creating orders
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Execution Status */}
            {preview.can_execute ? (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-900 dark:text-emerald-300 font-medium">
                  Ready to execute - All assets available
                </span>
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-300">
                      Insufficient Assets
                    </h3>
                    {preview.missing_assets && (
                      <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                        Missing {preview.missing_assets.shortfall.toLocaleString()}{' '}
                        {preview.missing_assets.asset_type}
                      </p>
                    )}
                    {onProvision && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onProvision('create')}
                        >
                          Create New Market Makers
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onProvision('fund')}
                        >
                          Fund Existing Market Makers
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BID Side Plan */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  BID Side (Buy Orders)
                </h3>
                <Badge variant="success">
                  {preview.bid_plan.mms.length} Liquidity Providers
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Total EUR:</span>
                  <span className="font-semibold text-navy-900 dark:text-white">
                    €{preview.bid_plan.total_amount.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-navy-200 dark:border-navy-700 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-navy-600 dark:text-navy-400">
                        <th className="pb-2">Market Maker</th>
                        <th className="pb-2 text-right">Allocation</th>
                        <th className="pb-2 text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                      {preview.bid_plan.mms.map((mm) => (
                        <tr key={mm.mm_id}>
                          <td className="py-2 text-navy-900 dark:text-white font-medium">
                            {mm.mm_name}
                          </td>
                          <td className="py-2 text-right text-navy-700 dark:text-navy-300">
                            €{mm.allocation.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-navy-600 dark:text-navy-400">
                            {mm.orders_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-navy-200 dark:border-navy-700 pt-3">
                  <h4 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Price Levels
                  </h4>
                  {preview.bid_plan.price_levels.map((level, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-navy-600 dark:text-navy-400">
                        ${level.price.toFixed(4)}
                      </span>
                      <span className="text-navy-700 dark:text-navy-300 font-medium">
                        {level.percentage}% of volume
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ASK Side Plan */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  ASK Side (Sell Orders)
                </h3>
                <Badge variant="error">
                  {preview.ask_plan.mms.length} Asset Holders
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-600 dark:text-navy-400">Total Value:</span>
                  <span className="font-semibold text-navy-900 dark:text-white">
                    €{preview.ask_plan.total_amount.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-navy-200 dark:border-navy-700 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-navy-600 dark:text-navy-400">
                        <th className="pb-2">Market Maker</th>
                        <th className="pb-2 text-right">Quantity</th>
                        <th className="pb-2 text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                      {preview.ask_plan.mms.map((mm) => (
                        <tr key={mm.mm_id}>
                          <td className="py-2 text-navy-900 dark:text-white font-medium">
                            {mm.mm_name}
                          </td>
                          <td className="py-2 text-right text-navy-700 dark:text-navy-300">
                            {mm.allocation.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-navy-600 dark:text-navy-400">
                            {mm.orders_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-navy-200 dark:border-navy-700 pt-3">
                  <h4 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Price Levels
                  </h4>
                  {preview.ask_plan.price_levels.map((level, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-navy-600 dark:text-navy-400">
                        ${level.price.toFixed(4)}
                      </span>
                      <span className="text-navy-700 dark:text-navy-300 font-medium">
                        {level.percentage}% of volume
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card className="bg-navy-50 dark:bg-navy-900/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-navy-600 dark:text-navy-400">Total Orders:</span>
                  <p className="text-xl font-bold text-navy-900 dark:text-white">
                    {preview.total_orders_count}
                  </p>
                </div>
                <div>
                  <span className="text-navy-600 dark:text-navy-400">Est. Spread:</span>
                  <p className="text-xl font-bold text-navy-900 dark:text-white">
                    {preview.estimated_spread}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-navy-200 dark:border-navy-700 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecute}
              disabled={!preview.can_execute || isExecuting}
              className="flex-1"
            >
              {isExecuting ? 'Executing...' : 'Confirm & Execute'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/backoffice/LiquidityPreviewModal.tsx
git commit -m "feat: add LiquidityPreviewModal component

- Display BID and ASK execution plans
- Show MM allocations and price levels
- Handle insufficient assets with provisioning actions
- Execution confirmation with loading state"
```

---

### Task 13: Create Liquidity Creation Page

**Files:**
- Create: `frontend/src/pages/CreateLiquidityPage.tsx`
- Modify: `frontend/src/App.tsx` (add route)

**Step 1: Create page component**

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Layers, AlertCircle } from 'lucide-react';
import { Button, Card } from '../components/common';
import { LiquidityPreviewModal } from '../components/backoffice/LiquidityPreviewModal';
import { liquidityApi } from '../services/api';
import type { LiquidityPreview } from '../types/liquidity';

type CertificateType = 'EUA' | 'CEA';

export function CreateLiquidityPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('EUA');
  const [bidAmountEur, setBidAmountEur] = useState('');
  const [askAmountEur, setAskAmountEur] = useState('');
  const [preview, setPreview] = useState<LiquidityPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const previewData = await liquidityApi.previewLiquidity({
        certificate_type: certificateType,
        bid_amount_eur: parseFloat(bidAmountEur),
        ask_amount_eur: parseFloat(askAmountEur),
      });

      setPreview(previewData);
      setShowPreviewModal(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to preview liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      const result = await liquidityApi.createLiquidity({
        certificate_type: certificateType,
        bid_amount_eur: parseFloat(bidAmountEur),
        ask_amount_eur: parseFloat(askAmountEur),
      });

      console.log('Liquidity created:', result);
      // Success - could show toast notification
      setBidAmountEur('');
      setAskAmountEur('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create liquidity');
      throw err; // Re-throw so modal can handle it
    }
  };

  const isFormValid = () => {
    const bid = parseFloat(bidAmountEur);
    const ask = parseFloat(askAmountEur);
    return !isNaN(bid) && bid > 0 && !isNaN(ask) && ask > 0;
  };

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-900 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
              Create Liquidity
            </h1>
          </div>
          <p className="text-navy-600 dark:text-navy-400">
            Inject market depth by automatically distributing orders across market makers
          </p>
        </div>

        <Card>
          {/* Certificate Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Certificate Type
            </label>
            <div className="flex gap-2">
              {(['EUA', 'CEA'] as CertificateType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setCertificateType(type)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    certificateType === type
                      ? type === 'EUA'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-amber-500 text-white shadow-lg'
                      : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400 hover:bg-navy-200 dark:hover:bg-navy-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* BID Liquidity Input */}
          <div className="mb-6">
            <label
              htmlFor="bid-amount"
              className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2"
            >
              BID Liquidity (EUR)
            </label>
            <input
              id="bid-amount"
              type="number"
              value={bidAmountEur}
              onChange={(e) => setBidAmountEur(e.target.value)}
              placeholder="e.g., 100000"
              className="w-full px-4 py-3 rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
              Amount of EUR to deploy on buy side using Liquidity Provider market makers
            </p>
          </div>

          {/* ASK Liquidity Input */}
          <div className="mb-6">
            <label
              htmlFor="ask-amount"
              className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2"
            >
              ASK Liquidity (EUR)
            </label>
            <input
              id="ask-amount"
              type="number"
              value={askAmountEur}
              onChange={(e) => setAskAmountEur(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full px-4 py-3 rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
              EUR value of certificates to deploy on sell side using Asset Holder market makers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Button */}
          <Button
            variant="primary"
            onClick={handlePreview}
            disabled={!isFormValid() || isLoading}
            className="w-full"
            icon={<TrendingUp />}
          >
            {isLoading ? 'Loading Preview...' : 'Preview Liquidity Creation'}
          </Button>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            How It Works
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• Orders placed across 3 price levels with tight spreads (0.2-0.5%)</li>
            <li>• BID liquidity distributed among EUR-holding Liquidity Provider MMs</li>
            <li>• ASK liquidity distributed among certificate-holding Asset Holder MMs</li>
            <li>• Volume distributed 50/30/20 across price levels for depth</li>
          </ul>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && preview && (
        <LiquidityPreviewModal
          preview={preview}
          onClose={() => setShowPreviewModal(false)}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
}
```

**Step 2: Add route to App.tsx**

In your router configuration, add:

```typescript
import { CreateLiquidityPage } from './pages/CreateLiquidityPage';

// In your routes:
<Route path="/backoffice/liquidity/create" element={<CreateLiquidityPage />} />
```

**Step 3: Commit**

```bash
git add frontend/src/pages/CreateLiquidityPage.tsx frontend/src/App.tsx
git commit -m "feat: add Create Liquidity page

- Form for BID/ASK liquidity amounts
- Certificate type selector
- Preview before execution
- Integration with liquidity API"
```

---

## Phase 5: Frontend - Cash Market Page Redesign

### Task 14: Redesign Cash Market Page Layout

**Files:**
- Modify: `frontend/src/pages/CashMarketPage.tsx`
- Modify: `frontend/src/components/cash-market/ProfessionalOrderBook.tsx`

**Step 1: Update CashMarketPage layout**

Modify the layout structure in `CashMarketPage.tsx`:

```tsx
// Replace the main grid section with this new layout:

return (
  <div className="min-h-screen bg-navy-50 dark:bg-navy-900">
    {/* Header - scrolls normally */}
    <div className="bg-white dark:bg-navy-800 border-b border-navy-200 dark:border-navy-700 px-6 py-4">
      {/* Keep existing header content */}
      <div className="max-w-7xl mx-auto">
        {/* Market selector, stats, etc. - no changes */}
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto p-6">
      {isLoading && !orderBook ? (
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Entry Section - Becomes Sticky */}
          {userBalances && (
            <div className="sticky top-0 z-10 bg-navy-50 dark:bg-navy-900 pb-4">
              <UserOrderEntryModal
                certificateType={certificateType}
                availableBalance={userBalances.eur_balance}
                bestAskPrice={orderBook?.best_ask || null}
                onOrderSubmit={handleMarketOrderSubmit}
              />
            </div>
          )}

          {/* Order Book - Full Width, Scrollable */}
          <div className="w-full">
            <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden">
              {orderBook && (
                <div className="max-h-[600px] overflow-y-auto">
                  <ProfessionalOrderBook
                    orderBook={{
                      bids: orderBook.bids,
                      asks: orderBook.asks,
                      spread: orderBook.spread,
                      best_bid: orderBook.best_bid,
                      best_ask: orderBook.best_ask,
                    }}
                    onPriceClick={handlePriceClick}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Market Depth and Recent Trades - Below Order Book */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <MarketDepthChart
                bids={marketDepth?.bids || []}
                asks={marketDepth?.asks || []}
                midPrice={orderBook?.last_price ?? undefined}
              />
            </div>
            <div className="h-[400px]">
              <RecentTrades trades={recentTrades} />
            </div>
          </div>

          {/* My Orders - Bottom */}
          <div className="w-full">
            <MyOrders
              orders={myOrders}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
```

**Step 2: Update ProfessionalOrderBook for better scrolling**

In `ProfessionalOrderBook.tsx`, ensure proper table layout:

```tsx
// Update the container to be scrollable
<div className="w-full">
  <table className="w-full">
    <thead className="sticky top-0 bg-navy-50 dark:bg-navy-900 z-5">
      {/* Keep existing header */}
    </thead>
    <tbody>
      {/* Keep existing body content */}
    </tbody>
  </table>
</div>
```

**Step 3: Test scrolling behavior**

Run the app and verify:
- Order entry stays visible when scrolling order book
- Order book scrolls independently
- Layout is responsive

```bash
cd frontend
npm run dev
```

**Step 4: Commit**

```bash
git add frontend/src/pages/CashMarketPage.tsx frontend/src/components/cash-market/ProfessionalOrderBook.tsx
git commit -m "feat: redesign cash market page with sticky order entry

- Make order entry sticky above order book
- Order book full-width and scrollable (600px max height)
- Move depth chart and trades below order book
- Improved layout for better UX"
```

---

## Phase 6: Integration and Testing

### Task 15: End-to-End Integration Test

**Files:**
- Create: `backend/tests/integration/test_liquidity_flow.py`

**Step 1: Write integration test**

```python
"""End-to-end integration test for liquidity creation flow"""
import pytest
from decimal import Decimal
from httpx import AsyncClient
from app.models.models import MarketMakerType, CertificateType

@pytest.mark.asyncio
async def test_complete_liquidity_creation_flow(
    client: AsyncClient,
    admin_token,
    db_session,
    test_admin_user
):
    """Test complete flow: create MMs -> preview -> execute -> verify orders"""

    # Step 1: Create Liquidity Provider MM
    lp_response = await client.post(
        "/api/v1/market-makers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "LP-Integration-Test",
            "email": "lp-int@test.com",
            "mm_type": "LIQUIDITY_PROVIDER",
            "initial_eur_balance": 200000
        }
    )
    assert lp_response.status_code == 200
    lp_data = lp_response.json()
    assert lp_data["mm_type"] == "LIQUIDITY_PROVIDER"
    assert lp_data["eur_balance"] == 200000

    # Step 2: Create Asset Holder MM
    ah_response = await client.post(
        "/api/v1/market-makers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "AH-Integration-Test",
            "email": "ah-int@test.com",
            "mm_type": "ASSET_HOLDER",
            "initial_balances": {"CEA": 10000}
        }
    )
    assert ah_response.status_code == 200

    # Step 3: Preview liquidity creation
    preview_response = await client.post(
        "/api/v1/liquidity/preview",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "certificate_type": "CEA",
            "bid_amount_eur": 100000,
            "ask_amount_eur": 50000
        }
    )
    assert preview_response.status_code == 200
    preview = preview_response.json()
    assert preview["can_execute"] is True
    assert len(preview["bid_plan"]["mms"]) >= 1
    assert len(preview["ask_plan"]["mms"]) >= 1

    # Step 4: Execute liquidity creation
    create_response = await client.post(
        "/api/v1/liquidity/create",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "certificate_type": "CEA",
            "bid_amount_eur": 100000,
            "ask_amount_eur": 50000,
            "notes": "Integration test execution"
        }
    )
    assert create_response.status_code == 200
    result = create_response.json()
    assert result["success"] is True
    assert result["orders_created"] == 6  # 3 bid + 3 ask
    assert result["bid_liquidity_eur"] == 100000

    # Step 5: Verify orders exist in database
    from app.models.models import Order, OrderSide
    from sqlalchemy import select

    bid_orders = await db_session.execute(
        select(Order).where(
            Order.certificate_type == CertificateType.CEA,
            Order.side == OrderSide.BUY,
            Order.id.in_(result["market_makers_used"])
        )
    )
    assert len(bid_orders.scalars().all()) == 3

    # Step 6: Verify MM balances updated
    lp_check = await client.get(
        f"/api/v1/market-makers/{lp_data['id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    lp_updated = lp_check.json()
    # EUR should be locked, balance reduced
    assert lp_updated["eur_balance"] < 200000
```

**Step 2: Run integration test**

```bash
pytest backend/tests/integration/test_liquidity_flow.py -v
```

Expected: PASS (all steps complete successfully)

**Step 3: Commit**

```bash
git add backend/tests/integration/test_liquidity_flow.py
git commit -m "test: add end-to-end liquidity creation integration test

- Test full flow from MM creation to order placement
- Verify preview, execution, and database state
- Validate balance updates and order creation"
```

---

### Task 16: Update Documentation

**Files:**
- Create: `docs/liquidity-management-guide.md`

**Step 1: Create user guide**

```markdown
# Liquidity Management Guide

## Overview

The Liquidity Management system allows administrators to programmatically inject market depth by coordinating orders across multiple market makers.

## Market Maker Types

### Liquidity Provider (LP)
- Holds EUR
- Places BUY orders (provides BID liquidity)
- Funded with EUR balance

### Asset Holder (AH)
- Holds certificates (CEA/EUA)
- Places SELL orders (provides ASK liquidity)
- Funded with certificate balances

## Creating Liquidity

### 1. Navigate to Create Liquidity Page

In the backoffice, click "Create Liquidity" in the navigation.

### 2. Configure Liquidity

- **Certificate Type**: Select EUA or CEA
- **BID Liquidity (EUR)**: Amount of EUR to deploy on buy side
- **ASK Liquidity (EUR)**: EUR value of certificates to deploy on sell side

### 3. Preview Execution

Click "Preview Liquidity Creation" to see:
- Which market makers will be used
- Order distribution across price levels
- Whether sufficient assets exist

### 4. Handle Insufficient Assets

If preview shows insufficient assets:
- **Create New Market Makers**: Generate new MMs with required assets
- **Fund Existing Market Makers**: Add assets to current MMs

### 5. Execute

Click "Confirm & Execute" to place all orders.

## Order Distribution

Orders are placed across 3 price levels:
- **Level 1**: 0.2% from mid-price (50% of volume)
- **Level 2**: 0.4% from mid-price (30% of volume)
- **Level 3**: 0.5% from mid-price (20% of volume)

This creates tight spreads with concentrated depth near best prices.

## Best Practices

1. **Balance Both Sides**: Match BID and ASK liquidity for balanced market
2. **Monitor Asset Levels**: Ensure MMs have sufficient reserves
3. **Adjust by Market**: Use different amounts for EUA vs CEA
4. **Check Preview**: Always preview before executing
5. **Track Operations**: Review liquidity operation history regularly

## API Reference

### Preview Liquidity
```
POST /api/v1/liquidity/preview
Authorization: Bearer <admin_token>

{
  "certificate_type": "CEA",
  "bid_amount_eur": 100000,
  "ask_amount_eur": 50000
}
```

### Create Liquidity
```
POST /api/v1/liquidity/create
Authorization: Bearer <admin_token>

{
  "certificate_type": "CEA",
  "bid_amount_eur": 100000,
  "ask_amount_eur": 50000,
  "notes": "Optional notes"
}
```
```

**Step 2: Commit**

```bash
git add docs/liquidity-management-guide.md
git commit -m "docs: add liquidity management user guide

- Explain LP vs AH market maker types
- Document liquidity creation workflow
- Include API reference and best practices"
```

---

## Summary

This implementation plan provides a complete, step-by-step guide to implementing liquidity management with EUR-holding market makers and redesigned cash market UI. Each task follows TDD principles with clear tests, implementation, and commits.

**Total Implementation Time Estimate**: 6-8 hours for experienced developer

**Key Features Delivered**:
1. ✅ Database models for MM types and liquidity operations
2. ✅ Backend service with liquidity distribution algorithm
3. ✅ API endpoints for preview and execution
4. ✅ Frontend UI for liquidity creation with preview modal
5. ✅ Redesigned cash market page with sticky order entry
6. ✅ Comprehensive testing and documentation

**Next Steps After Implementation**:
- Deploy database migrations to production
- Test with real market data
- Monitor liquidity operation performance
- Gather user feedback on UI/UX
- Consider additional features (scheduled liquidity, withdrawal, etc.)
