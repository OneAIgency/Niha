# Market Maker Market Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the market maker system from a certificate-based model (CEA/EUA) to a market-based model with two distinct markets: CEA-CASH market and SWAP (CEA-EUA) market. Change market maker types from ASSET_HOLDER/LIQUIDITY_PROVIDER to CEA_CASH_SELLER, CASH_BUYER, and SWAP_MAKER.

**Architecture:** The platform currently treats CEA and EUA as separate but equivalent certificates. The new architecture recognizes two fundamentally different markets: (1) CEA-CASH market where customers buy CEA certificates with EUR cash, and (2) SWAP market where customers exchange CEA certificates for EUA certificates. Market makers are specialized by market, not by asset type.

**Tech Stack:** React, TypeScript, FastAPI, SQLAlchemy, PostgreSQL

---

## Business Rules (THE LAW)

These rules are fundamental and immutable:

### Two Markets, Not Two Certificates

**Old Model (WRONG):**
- Platform treats CEA and EUA as equivalent tradable assets
- Market makers hold "certificates" (CEA or EUA)
- Orders can be for CEA OR EUA

**New Model (CORRECT):**
- **CEA-CASH Market:** Customers buy CEA certificates with EUR cash
  - Market makers on this market: CEA_CASH_SELLER (has CEA, sells for EUR) and CASH_BUYER (has EUR, buys CEA)
  - Order book shows CEA/EUR prices
  - Trading mechanism: cash market with limit/market orders

- **SWAP Market (CEA-EUA):** Customers exchange CEA for EUA at fixed rates
  - Market makers on this market: SWAP_MAKER (facilitates CEA↔EUA conversions)
  - No price discovery - uses fixed conversion rates
  - Trading mechanism: swap requests matching

### Market Maker Types

**Old Types (to be removed):**
- `LIQUIDITY_PROVIDER` - holds EUR, places BUY orders
- `ASSET_HOLDER` - holds CEA/EUA, places SELL orders

**New Types (to be implemented):**
1. **CEA_CASH_SELLER**
   - Market: CEA-CASH
   - Holds: CEA certificates
   - Action: Places SELL orders (selling CEA for EUR)
   - Example: Company that produces CEA certificates

2. **CASH_BUYER**
   - Market: CEA-CASH
   - Holds: EUR cash
   - Action: Places BUY orders (buying CEA with EUR)
   - Example: Investment fund providing liquidity

3. **SWAP_MAKER**
   - Market: SWAP (CEA-EUA)
   - Holds: Both CEA and EUA inventory
   - Action: Facilitates CEA↔EUA swaps at configured rates
   - Example: Liquidity provider for certificate conversions

### Critical Implementation Rule

**EVERYWHERE in code, documentation, UI, and database:**
- Replace "CEA and EUA" language with "CEA-CASH market and SWAP market" language
- Replace certificate type selection with market selection
- Replace balance displays (EUR/CEA/EUA) with market-specific displays
- Update order management to be market-specific

---

## Current State Analysis

### Database Schema

**Current MarketMakerType enum (backend/app/models/models.py:131-134):**
```python
class MarketMakerType(str, enum.Enum):
    ASSET_HOLDER = "ASSET_HOLDER"          # Holds CEA/EUA, places SELL orders
    LIQUIDITY_PROVIDER = "LIQUIDITY_PROVIDER"  # Holds EUR, places BUY orders
```

**Market Maker Client table (backend/app/models/models.py:200-213):**
- `mm_type`: Column using MarketMakerType enum
- `eur_balance`: For LIQUIDITY_PROVIDER only
- CEA/EUA balances: Stored in AssetTransaction table

**Order table (backend/app/models/models.py:384-407):**
- `certificate_type`: Column(SQLEnum(CertificateType)) - CEA or EUA
- `side`: Column(SQLEnum(OrderSide)) - BUY or SELL
- No market field - assumes all orders are in the same market

### Backend Services

**LiquidityService (backend/app/services/liquidity_service.py):**
- Lines 52-55: Queries LIQUIDITY_PROVIDER market makers
- Lines 76-79: Queries ASSET_HOLDER market makers
- Lines 264, 290: Returns mm_type in responses
- Lines 478, 484: Includes mm_type in market_makers_used metadata

**MarketMakerService (backend/app/services/market_maker_service.py:23-32):**
- Creates market makers with mm_type parameter
- Validates business rules based on mm_type (lines 128-144 in API)

### Frontend Components

**CreateMarketMakerModal (frontend/src/components/backoffice/CreateMarketMakerModal.tsx):**
- Lines 225-226: Type selector with LIQUIDITY_PROVIDER/ASSET_HOLDER
- Lines 237-238: Dropdown options "Asset Holder (Holds CEA/EUA)" and "Liquidity Provider (Holds EUR)"
- Lines 241-243: Help text explaining types
- Lines 86-107: Business rule validation

**MarketMakersList (frontend/src/components/backoffice/MarketMakersList.tsx):**
- Lines 49-89: CEA Balance and EUA Balance columns
- Lines 106-120: EUR Balance column (only for LIQUIDITY_PROVIDER)
- Lines 172-198: Portfolio summary with CEA Value, EUA Value, Direct EUR

**TypeScript Types (frontend/src/types/index.ts:455-474):**
```typescript
export type MarketMakerType = 'LIQUIDITY_PROVIDER' | 'ASSET_HOLDER';
```

---

## Implementation Plan

### Phase 1: Database Schema Changes

#### Task 1.1: Create New MarketMakerType Enum

**Files:**
- Create: `backend/alembic/versions/YYYY_MM_DD_market_based_restructure.py`
- Modify: `backend/app/models/models.py:131-135`

**Step 1: Write migration to update enum**

```python
"""Market-based market maker restructure

Revision ID: <generated>
Revises: <previous>
Create Date: 2026-01-21

Changes MarketMakerType enum from certificate-based (ASSET_HOLDER, LIQUIDITY_PROVIDER)
to market-based (CEA_CASH_SELLER, CASH_BUYER, SWAP_MAKER).
"""

def upgrade() -> None:
    # Update existing LIQUIDITY_PROVIDER to CASH_BUYER
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'CASH_BUYER'
        WHERE mm_type = 'LIQUIDITY_PROVIDER';
    """)

    # Update existing ASSET_HOLDER to CEA_CASH_SELLER (assume they sell CEA for cash)
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'CEA_CASH_SELLER'
        WHERE mm_type = 'ASSET_HOLDER';
    """)

    # Drop old enum and create new one
    op.execute("""
        ALTER TYPE marketmakertype RENAME TO marketmakertype_old;

        CREATE TYPE marketmakertype AS ENUM (
            'CEA_CASH_SELLER',
            'CASH_BUYER',
            'SWAP_MAKER'
        );

        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE marketmakertype
        USING mm_type::text::marketmakertype;

        DROP TYPE marketmakertype_old;
    """)


def downgrade() -> None:
    # Reverse mapping
    op.execute("""
        UPDATE market_maker_clients
        SET mm_type = 'LIQUIDITY_PROVIDER'
        WHERE mm_type = 'CASH_BUYER';

        UPDATE market_maker_clients
        SET mm_type = 'ASSET_HOLDER'
        WHERE mm_type IN ('CEA_CASH_SELLER', 'SWAP_MAKER');
    """)

    # Restore old enum
    op.execute("""
        ALTER TYPE marketmakertype RENAME TO marketmakertype_new;

        CREATE TYPE marketmakertype AS ENUM (
            'ASSET_HOLDER',
            'LIQUIDITY_PROVIDER'
        );

        ALTER TABLE market_maker_clients
        ALTER COLUMN mm_type TYPE marketmakertype
        USING mm_type::text::marketmakertype;

        DROP TYPE marketmakertype_new;
    """)
```

**Step 2: Update Python enum**

File: `backend/app/models/models.py:131-135`

```python
class MarketMakerType(str, enum.Enum):
    """Types of market maker clients - organized by market"""
    CEA_CASH_SELLER = "CEA_CASH_SELLER"    # CEA-CASH market: Holds CEA, places SELL orders
    CASH_BUYER = "CASH_BUYER"              # CEA-CASH market: Holds EUR, places BUY orders
    SWAP_MAKER = "SWAP_MAKER"              # SWAP market: Facilitates CEA↔EUA swaps
```

**Step 3: Run migration**

Run: `cd backend && alembic upgrade head`
Expected: Migration completes, all existing market makers migrated to new types

**Step 4: Verify migration**

Run:
```bash
psql $DATABASE_URL -c "SELECT mm_type, COUNT(*) FROM market_maker_clients GROUP BY mm_type;"
```
Expected: Only new types (CEA_CASH_SELLER, CASH_BUYER, SWAP_MAKER) appear

**Step 5: Commit**

```bash
git add backend/alembic/versions/*.py backend/app/models/models.py
git commit -m "feat: Migrate MarketMakerType enum to market-based model

Changes:
- LIQUIDITY_PROVIDER → CASH_BUYER
- ASSET_HOLDER → CEA_CASH_SELLER
- Added SWAP_MAKER type

This aligns market makers with the two-market model:
CEA-CASH market and SWAP (CEA-EUA) market.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Task 1.2: Add Market Field to Orders

**Files:**
- Create: `backend/alembic/versions/YYYY_MM_DD_add_market_to_orders.py`
- Modify: `backend/app/models/models.py:384-407`

**Step 1: Write migration**

```python
"""Add market field to orders

Revision ID: <generated>
Revises: <previous>
Create Date: 2026-01-21

Adds 'market' field to orders table to distinguish CEA_CASH orders from SWAP orders.
Backfills existing orders based on certificate_type.
"""

def upgrade() -> None:
    # Create market enum
    op.execute("""
        CREATE TYPE markettype AS ENUM ('CEA_CASH', 'SWAP');
    """)

    # Add market column
    op.add_column('orders',
        sa.Column('market', sa.Enum('CEA_CASH', 'SWAP', name='markettype'), nullable=True)
    )

    # Backfill: All existing orders are CEA_CASH market (cash trading)
    # SWAP market will be implemented separately
    op.execute("""
        UPDATE orders SET market = 'CEA_CASH';
    """)

    # Make NOT NULL after backfill
    op.alter_column('orders', 'market', nullable=False)

    # Add index
    op.create_index('idx_orders_market', 'orders', ['market'])


def downgrade() -> None:
    op.drop_index('idx_orders_market')
    op.drop_column('orders', 'market')
    op.execute("DROP TYPE markettype;")
```

**Step 2: Update Order model**

File: `backend/app/models/models.py:384-407`

```python
class MarketType(str, enum.Enum):
    """Trading markets"""
    CEA_CASH = "CEA_CASH"  # Cash market: Buy/sell CEA with EUR
    SWAP = "SWAP"          # Swap market: Exchange CEA↔EUA

class Order(Base):
    """Cash market orders for trading"""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market = Column(SQLEnum(MarketType), nullable=False)  # NEW: Which market
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=True, index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True, index=True)
    market_maker_id = Column(UUID(as_uuid=True), ForeignKey("market_maker_clients.id"), nullable=True, index=True)
    ticket_id = Column(String(30), nullable=True, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)  # Still needed for SWAP
    side = Column(SQLEnum(OrderSide), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    filled_quantity = Column(Numeric(18, 2), default=0)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Step 3: Run migration and test**

Run: `cd backend && alembic upgrade head && pytest tests/test_liquidity_service.py -v`
Expected: Migration succeeds, all orders have market='CEA_CASH', tests pass

**Step 4: Commit**

```bash
git add backend/alembic/versions/*.py backend/app/models/models.py
git commit -m "feat: Add market field to orders table

All orders now specify which market they belong to:
- CEA_CASH: Buy/sell CEA certificates with EUR
- SWAP: Exchange CEA↔EUA certificates

Existing orders backfilled as CEA_CASH market.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Phase 2: Backend Service Updates

#### Task 2.1: Update LiquidityService

**Files:**
- Modify: `backend/app/services/liquidity_service.py`

**Step 1: Write test for new behavior**

File: `backend/tests/test_liquidity_service.py`

```python
async def test_get_cash_buyers_only():
    """CASH_BUYER market makers should be selected for CEA-CASH liquidity"""
    # Create CASH_BUYER MM
    cash_buyer = MarketMakerClient(
        user_id=test_admin_user.id,
        name="Cash-Buyer-Test",
        mm_type=MarketMakerType.CASH_BUYER,
        eur_balance=Decimal("100000"),
        is_active=True,
        created_by=test_admin_user.id
    )
    db.add(cash_buyer)

    # Create SWAP_MAKER MM (should NOT be selected)
    swap_maker = MarketMakerClient(
        user_id=test_admin_user.id,
        name="Swap-Maker-Test",
        mm_type=MarketMakerType.SWAP_MAKER,
        is_active=True,
        created_by=test_admin_user.id
    )
    db.add(swap_maker)
    await db.flush()

    # Query for CEA-CASH market liquidity
    plan = await LiquidityService.plan_liquidity_operations(
        db=db,
        market=MarketType.CEA_CASH,
        target_spread_pct=2.0
    )

    # Only CASH_BUYER should be in bid plan
    assert len(plan["bid"]["mms"]) == 1
    assert plan["bid"]["mms"][0]["mm_type"] == "CASH_BUYER"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_liquidity_service.py::test_get_cash_buyers_only -v`
Expected: FAIL - LiquidityService still uses old LIQUIDITY_PROVIDER type

**Step 3: Update LiquidityService queries**

File: `backend/app/services/liquidity_service.py:49-55`

```python
# OLD:
result = await db.execute(
    select(MarketMakerClient)
    .where(
        and_(
            MarketMakerClient.mm_type == MarketMakerType.LIQUIDITY_PROVIDER,
            MarketMakerClient.is_active == True,
            MarketMakerClient.eur_balance > 0
        )
    )
)

# NEW:
result = await db.execute(
    select(MarketMakerClient)
    .where(
        and_(
            MarketMakerClient.mm_type == MarketMakerType.CASH_BUYER,
            MarketMakerClient.is_active == True,
            MarketMakerClient.eur_balance > 0
        )
    )
)
```

File: `backend/app/services/liquidity_service.py:73-79`

```python
# OLD:
result = await db.execute(
    select(MarketMakerClient)
    .where(
        and_(
            MarketMakerClient.mm_type == MarketMakerType.ASSET_HOLDER,
            MarketMakerClient.is_active == True
        )
    )
)

# NEW:
result = await db.execute(
    select(MarketMakerClient)
    .where(
        and_(
            MarketMakerClient.mm_type == MarketMakerType.CEA_CASH_SELLER,
            MarketMakerClient.is_active == True
        )
    )
)
```

**Step 4: Update mm_type in responses**

File: `backend/app/services/liquidity_service.py:264, 290, 478, 484`

Replace hardcoded strings with actual mm_type value:
```python
# Lines 264, 290 - in plan responses
"mm_type": mm.mm_type.value,  # Will be "CASH_BUYER" or "CEA_CASH_SELLER"

# Lines 478, 484 - in market_makers_used
"mm_type": mm.mm_type.value,
```

**Step 5: Run test to verify it passes**

Run: `pytest tests/test_liquidity_service.py::test_get_cash_buyers_only -v`
Expected: PASS

**Step 6: Run all tests**

Run: `pytest tests/test_liquidity_service.py -v`
Expected: All tests pass

**Step 7: Commit**

```bash
git add backend/app/services/liquidity_service.py backend/tests/test_liquidity_service.py
git commit -m "feat: Update LiquidityService for market-based model

Changes:
- Query CASH_BUYER instead of LIQUIDITY_PROVIDER
- Query CEA_CASH_SELLER instead of ASSET_HOLDER
- Return actual mm_type values in responses

All tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Task 2.2: Update MarketMakerService Validation

**Files:**
- Modify: `backend/app/api/v1/market_maker.py:128-144`
- Modify: `backend/app/services/market_maker_service.py:29`

**Step 1: Write test for new validation**

File: `backend/tests/test_market_maker_validation.py` (create new)

```python
import pytest
from app.models.models import MarketMakerType
from app.api.v1.market_maker import create_market_maker
from decimal import Decimal


async def test_cash_buyer_requires_eur():
    """CASH_BUYER must have EUR balance"""
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            data={
                "name": "Test",
                "email": "test@example.com",
                "mm_type": MarketMakerType.CASH_BUYER,
                "initial_balances": {"CEA": Decimal("1000")}  # WRONG: has CEA
            }
        )
    assert "CASH_BUYER must have positive initial_eur_balance" in str(exc.value.detail)


async def test_cea_cash_seller_requires_cea():
    """CEA_CASH_SELLER must have CEA balance"""
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            data={
                "name": "Test",
                "email": "test@example.com",
                "mm_type": MarketMakerType.CEA_CASH_SELLER,
                "initial_eur_balance": Decimal("10000")  # WRONG: has EUR
            }
        )
    assert "CEA_CASH_SELLER must have initial CEA balance" in str(exc.value.detail)


async def test_swap_maker_requires_both():
    """SWAP_MAKER must have both CEA and EUA"""
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            data={
                "name": "Test",
                "email": "test@example.com",
                "mm_type": MarketMakerType.SWAP_MAKER,
                "initial_balances": {"CEA": Decimal("1000")}  # WRONG: missing EUA
            }
        )
    assert "SWAP_MAKER must have both CEA and EUA balances" in str(exc.value.detail)
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_market_maker_validation.py -v`
Expected: FAIL - validation not implemented

**Step 3: Update validation logic**

File: `backend/app/api/v1/market_maker.py:128-144`

```python
# OLD validation (delete)
if mm_type == MarketMakerType.LIQUIDITY_PROVIDER:
    if data.initial_balances:
        raise HTTPException(400, "LIQUIDITY_PROVIDER cannot have certificate balances")
    if data.initial_eur_balance is None or data.initial_eur_balance <= 0:
        raise HTTPException(400, "LIQUIDITY_PROVIDER must have positive initial_eur_balance")
elif mm_type == MarketMakerType.ASSET_HOLDER:
    if data.initial_eur_balance is not None and data.initial_eur_balance > 0:
        raise HTTPException(400, "ASSET_HOLDER cannot have EUR balance")

# NEW validation
if mm_type == MarketMakerType.CASH_BUYER:
    # CASH_BUYER: CEA-CASH market, buys CEA with EUR
    if data.initial_balances:
        raise HTTPException(400, "CASH_BUYER cannot have certificate balances, only EUR")
    if data.initial_eur_balance is None or data.initial_eur_balance <= 0:
        raise HTTPException(400, "CASH_BUYER must have positive initial_eur_balance")

elif mm_type == MarketMakerType.CEA_CASH_SELLER:
    # CEA_CASH_SELLER: CEA-CASH market, sells CEA for EUR
    if data.initial_eur_balance is not None and data.initial_eur_balance > 0:
        raise HTTPException(400, "CEA_CASH_SELLER cannot have EUR balance")
    if not data.initial_balances or "CEA" not in data.initial_balances:
        raise HTTPException(400, "CEA_CASH_SELLER must have initial CEA balance")
    if "EUA" in data.initial_balances:
        raise HTTPException(400, "CEA_CASH_SELLER operates in CEA-CASH market, cannot have EUA")

elif mm_type == MarketMakerType.SWAP_MAKER:
    # SWAP_MAKER: SWAP market, facilitates CEA↔EUA conversions
    if data.initial_eur_balance is not None and data.initial_eur_balance > 0:
        raise HTTPException(400, "SWAP_MAKER operates in SWAP market, cannot have EUR")
    if not data.initial_balances or "CEA" not in data.initial_balances or "EUA" not in data.initial_balances:
        raise HTTPException(400, "SWAP_MAKER must have both CEA and EUA balances")
```

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_market_maker_validation.py -v`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/market_maker.py backend/tests/test_market_maker_validation.py
git commit -m "feat: Update market maker validation for market-based model

New validation rules:
- CASH_BUYER: Must have EUR only (CEA-CASH market buyer)
- CEA_CASH_SELLER: Must have CEA only (CEA-CASH market seller)
- SWAP_MAKER: Must have both CEA and EUA (SWAP market facilitator)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Phase 3: Frontend Type Updates

#### Task 3.1: Update TypeScript Types

**Files:**
- Modify: `frontend/src/types/index.ts:455-474`

**Step 1: Write updated types**

File: `frontend/src/types/index.ts:455-474`

```typescript
// =============================================================================
// Market Types
// =============================================================================

export type MarketType = 'CEA_CASH' | 'SWAP';

export interface Market {
  type: MarketType;
  name: string;
  description: string;
}

export const MARKETS: Record<MarketType, Market> = {
  CEA_CASH: {
    type: 'CEA_CASH',
    name: 'CEA-CASH Market',
    description: 'Buy and sell CEA certificates with EUR cash'
  },
  SWAP: {
    type: 'SWAP',
    name: 'SWAP Market',
    description: 'Exchange CEA certificates for EUA certificates'
  }
};

// =============================================================================
// Market Maker Types
// =============================================================================

export type MarketMakerType = 'CEA_CASH_SELLER' | 'CASH_BUYER' | 'SWAP_MAKER';

export interface MarketMaker {
  id: string;
  name: string;
  description?: string;
  mm_type: MarketMakerType;
  market: MarketType;  // NEW: Which market this MM operates in
  is_active: boolean;

  // Balances
  eur_balance: number;
  cea_balance: number;
  eua_balance: number;

  // Metadata
  total_orders: number;
  created_at: string;
  ticket_id?: string;
}

export interface MarketMakerTypeInfo {
  value: MarketMakerType;
  market: MarketType;
  name: string;
  description: string;
  balanceLabel: string;
  color: string;
}

export const MARKET_MAKER_TYPES: Record<MarketMakerType, MarketMakerTypeInfo> = {
  CEA_CASH_SELLER: {
    value: 'CEA_CASH_SELLER',
    market: 'CEA_CASH',
    name: 'CEA-CASH Seller',
    description: 'Holds CEA certificates, sells them for EUR on the CEA-CASH market',
    balanceLabel: 'CEA Balance',
    color: 'amber'
  },
  CASH_BUYER: {
    value: 'CASH_BUYER',
    market: 'CEA_CASH',
    name: 'CASH Buyer',
    description: 'Holds EUR cash, buys CEA certificates on the CEA-CASH market',
    balanceLabel: 'EUR Balance',
    color: 'emerald'
  },
  SWAP_MAKER: {
    value: 'SWAP_MAKER',
    market: 'SWAP',
    name: 'SWAP Maker',
    description: 'Facilitates CEA↔EUA swaps on the SWAP market',
    balanceLabel: 'CEA/EUA Inventory',
    color: 'blue'
  }
};
```

**Step 2: Run TypeScript compilation**

Run: `cd frontend && npm run build`
Expected: Type errors in components that reference old types

**Step 3: Fix compilation errors noted**

Document all files with type errors for next tasks

**Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: Update TypeScript types for market-based model

New types:
- MarketType: CEA_CASH | SWAP
- MarketMakerType: CEA_CASH_SELLER | CASH_BUYER | SWAP_MAKER
- MARKET_MAKER_TYPES: Metadata for each type

Breaking change: Components will need updates.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Task 3.2: Update CreateMarketMakerModal

**Files:**
- Modify: `frontend/src/components/backoffice/CreateMarketMakerModal.tsx`

**Step 1: Write test for new UI**

File: `frontend/src/components/backoffice/__tests__/CreateMarketMakerModal.test.tsx` (create)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateMarketMakerModal } from '../CreateMarketMakerModal';

test('shows market selection instead of type selection', () => {
  render(<CreateMarketMakerModal isOpen={true} onClose={() => {}} />);

  // Should have "Market" dropdown, not "Market Maker Type"
  expect(screen.getByLabelText(/Market/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Market Maker Type/i)).not.toBeInTheDocument();
});

test('CEA-CASH market shows both seller and buyer options', () => {
  render(<CreateMarketMakerModal isOpen={true} onClose={() => {}} />);

  // Select CEA-CASH market
  const marketSelect = screen.getByLabelText(/Market/i);
  fireEvent.change(marketSelect, { target: { value: 'CEA_CASH' } });

  // Should show type selector with CEA_CASH_SELLER and CASH_BUYER
  const typeSelect = screen.getByLabelText(/Role/i);
  expect(typeSelect).toContainElement(screen.getByText(/CEA-CASH Seller/i));
  expect(typeSelect).toContainElement(screen.getByText(/CASH Buyer/i));
});

test('SWAP market only shows SWAP_MAKER option', () => {
  render(<CreateMarketMakerModal isOpen={true} onClose={() => {}} />);

  // Select SWAP market
  const marketSelect = screen.getByLabelText(/Market/i);
  fireEvent.change(marketSelect, { target: { value: 'SWAP' } });

  // Should show type selector with only SWAP_MAKER
  const typeSelect = screen.getByLabelText(/Role/i);
  expect(typeSelect).toContainElement(screen.getByText(/SWAP Maker/i));
  expect(typeSelect).not.toContainElement(screen.getByText(/Seller/i));
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- CreateMarketMakerModal`
Expected: FAIL - component still uses old structure

**Step 3: Rewrite component with market-first UI**

File: `frontend/src/components/backoffice/CreateMarketMakerModal.tsx`

Key changes:
1. Replace type selector with market selector (lines 217-245)
2. Add market-specific type selector
3. Update validation to use new types
4. Update balance input conditional rendering

```typescript
// State (lines 15-28)
const [market, setMarket] = useState<MarketType>('CEA_CASH');
const [mmType, setMmType] = useState<MarketMakerType>('CASH_BUYER');
// ... rest of state

// Market selector (NEW - replaces type selector)
<div>
  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
    Market *
  </label>
  <select
    value={market}
    onChange={(e) => {
      const newMarket = e.target.value as MarketType;
      setMarket(newMarket);
      // Auto-select first available type for market
      if (newMarket === 'CEA_CASH') {
        setMmType('CASH_BUYER');
      } else {
        setMmType('SWAP_MAKER');
      }
      // Clear all balances
      setEurBalance('');
      setCeaBalance('');
      setEuaBalance('');
    }}
    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
  >
    <option value="CEA_CASH">CEA-CASH Market (Trade CEA with EUR)</option>
    <option value="SWAP">SWAP Market (Exchange CEA↔EUA)</option>
  </select>
</div>

// Market-specific role selector (NEW)
<div>
  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
    Market Maker Role *
  </label>
  <select
    value={mmType}
    onChange={(e) => {
      const newType = e.target.value as MarketMakerType;
      setMmType(newType);
      // Clear balances
      setEurBalance('');
      setCeaBalance('');
      setEuaBalance('');
    }}
    className="w-full px-3 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
  >
    {market === 'CEA_CASH' ? (
      <>
        <option value="CASH_BUYER">CASH Buyer (Buys CEA with EUR)</option>
        <option value="CEA_CASH_SELLER">CEA-CASH Seller (Sells CEA for EUR)</option>
      </>
    ) : (
      <option value="SWAP_MAKER">SWAP Maker (Facilitates CEA↔EUA swaps)</option>
    )}
  </select>
  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
    {MARKET_MAKER_TYPES[mmType].description}
  </p>
</div>

// Balance inputs (conditional on mmType)
{mmType === 'CASH_BUYER' && (
  // EUR balance input
)}

{mmType === 'CEA_CASH_SELLER' && (
  // CEA balance input only
)}

{mmType === 'SWAP_MAKER' && (
  // Both CEA and EUA balance inputs
)}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- CreateMarketMakerModal`
Expected: All tests PASS

**Step 5: Manual verification**

1. Run dev server: `npm run dev`
2. Navigate to backoffice Market Makers page
3. Click "Create Market Maker"
4. Verify UI shows market selector
5. Verify market selection changes available roles
6. Verify balance inputs change based on role

**Step 6: Commit**

```bash
git add frontend/src/components/backoffice/CreateMarketMakerModal.tsx frontend/src/components/backoffice/__tests__/CreateMarketMakerModal.test.tsx
git commit -m "feat: Redesign CreateMarketMakerModal for market-based model

Changes:
- Market selection (CEA-CASH or SWAP) comes first
- Role selection is market-specific
- Balance inputs adapt to selected role
- Clear, market-oriented language throughout

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Task 3.3: Update MarketMakersList

**Files:**
- Modify: `frontend/src/components/backoffice/MarketMakersList.tsx`

**Step 1: Redesign columns for market-based view**

Key changes:
1. Remove separate CEA/EUA columns
2. Add Market column (lines 16-28)
3. Consolidate balance display by role (lines 49-89)
4. Update portfolio summary to be market-based

File: `frontend/src/components/backoffice/MarketMakersList.tsx`

```typescript
const columns: Column<MarketMaker>[] = [
  {
    key: 'name',
    header: 'Name',
    width: '20%',
    // ... existing render
  },
  {
    key: 'market',
    header: 'Market',
    width: '15%',
    align: 'center',
    render: (_, row) => {
      const marketInfo = MARKETS[row.market];
      const color = row.market === 'CEA_CASH' ? 'purple' : 'blue';
      return (
        <Badge variant={color}>
          {marketInfo.name}
        </Badge>
      );
    },
  },
  {
    key: 'mm_type',
    header: 'Role',
    width: '15%',
    align: 'center',
    render: (value) => {
      const info = MARKET_MAKER_TYPES[value];
      return (
        <Badge variant={info.color}>
          {info.name}
        </Badge>
      );
    },
  },
  {
    key: 'balance',
    header: 'Balance',
    width: '15%',
    align: 'right',
    render: (_, row) => {
      const info = MARKET_MAKER_TYPES[row.mm_type];

      if (row.mm_type === 'CASH_BUYER') {
        return (
          <div className="flex items-center justify-end font-mono font-bold text-emerald-600">
            {formatCurrency(row.eur_balance, 'EUR')}
          </div>
        );
      } else if (row.mm_type === 'CEA_CASH_SELLER') {
        return (
          <div className="flex items-center justify-end gap-2">
            <Leaf className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-navy-900 dark:text-white">
              {formatQuantity(row.cea_balance)} CEA
            </span>
          </div>
        );
      } else { // SWAP_MAKER
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-end gap-2">
              <Leaf className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono">{formatQuantity(row.cea_balance)} CEA</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Wind className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-mono">{formatQuantity(row.eua_balance)} EUA</span>
            </div>
          </div>
        );
      }
    },
  },
  // ... status, total orders, description columns
];

// Portfolio summary (replace lines 164-221)
{marketMakers.length > 0 && prices && (
  <Card className="mt-4">
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">
        Portfolio Summary by Market
      </h3>

      {/* CEA-CASH Market */}
      <div>
        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
          CEA-CASH Market
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-navy-500">Buyer Liquidity (EUR)</div>
            <div className="text-lg font-bold font-mono text-emerald-600">
              {formatCurrency(
                marketMakers
                  .filter(mm => mm.mm_type === 'CASH_BUYER')
                  .reduce((sum, mm) => sum + mm.eur_balance, 0),
                'EUR'
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-navy-500">Seller Inventory (CEA)</div>
            <div className="text-lg font-bold font-mono text-amber-600">
              {formatQuantity(
                marketMakers
                  .filter(mm => mm.mm_type === 'CEA_CASH_SELLER')
                  .reduce((sum, mm) => sum + mm.cea_balance, 0)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-navy-500">Total Value</div>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white">
              {formatCurrency(
                marketMakers
                  .filter(mm => mm.market === 'CEA_CASH')
                  .reduce((sum, mm) => {
                    if (mm.mm_type === 'CASH_BUYER') return sum + mm.eur_balance;
                    return sum + (mm.cea_balance * prices.cea.price);
                  }, 0),
                'EUR'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SWAP Market */}
      <div>
        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
          SWAP Market
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-navy-500">CEA Inventory</div>
            <div className="text-lg font-bold font-mono text-amber-600">
              {formatQuantity(
                marketMakers
                  .filter(mm => mm.mm_type === 'SWAP_MAKER')
                  .reduce((sum, mm) => sum + mm.cea_balance, 0)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-navy-500">EUA Inventory</div>
            <div className="text-lg font-bold font-mono text-blue-600">
              {formatQuantity(
                marketMakers
                  .filter(mm => mm.mm_type === 'SWAP_MAKER')
                  .reduce((sum, mm) => sum + mm.eua_balance, 0)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-navy-500">Total Value</div>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white">
              {formatCurrency(
                marketMakers
                  .filter(mm => mm.mm_type === 'SWAP_MAKER')
                  .reduce((sum, mm) =>
                    sum + (mm.cea_balance * prices.cea.price) + (mm.eua_balance * prices.eua.price)
                  , 0),
                'EUR'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
)}
```

**Step 2: Test compilation**

Run: `cd frontend && npm run build`
Expected: TypeScript compilation succeeds

**Step 3: Manual verification**

Run dev server and verify:
1. Market column shows "CEA-CASH Market" or "SWAP Market" badges
2. Role column shows appropriate role name
3. Balance column adapts to role (EUR for CASH_BUYER, CEA for CEA_CASH_SELLER, both for SWAP_MAKER)
4. Portfolio summary groups by market

**Step 4: Commit**

```bash
git add frontend/src/components/backoffice/MarketMakersList.tsx
git commit -m "feat: Redesign MarketMakersList for market-based view

Changes:
- Added Market column showing CEA-CASH or SWAP
- Role column shows market-specific role name
- Balance column adapts to role type
- Portfolio summary grouped by market

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Phase 4: Documentation Updates

#### Task 4.1: Update Implementation Plan

**Files:**
- Modify: `frontend/docs/plans/2026-01-21-live-order-book.md`

**Step 1: Update terminology**

Find and replace throughout document:
- "customer orders and market maker orders" → "CEA-CASH market orders"
- References to EUA orders → Note that EUA is only in SWAP market

**Step 2: Add market context**

Add section explaining two-market model at the top

**Step 3: Commit**

```bash
git add frontend/docs/plans/2026-01-21-live-order-book.md
git commit -m "docs: Update order book plan for market-based model

Clarifies that order book is for CEA-CASH market specifically.
SWAP market uses different mechanism (swap requests).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Task 4.2: Create Market Architecture Document

**Files:**
- Create: `docs/architecture/market-model.md`

**Step 1: Write architecture document**

```markdown
# Market Architecture

## Overview

The Niha Carbon platform operates two distinct markets:

1. **CEA-CASH Market**: Cash trading of CEA certificates
2. **SWAP Market**: Exchange of CEA certificates for EUA certificates

This document describes the architecture, business rules, and implementation details of both markets.

## The Two Markets

### CEA-CASH Market

**Purpose:** Allow customers to buy CEA certificates with EUR cash.

**Participants:**
- **Customers (Buyers):** Entities that want to purchase CEA certificates
- **CEA-CASH Sellers:** Market makers that hold CEA certificates and sell them
- **CASH Buyers:** Market makers that provide liquidity by buying CEA certificates

**Trading Mechanism:**
- Order book with bids (buy orders) and asks (sell orders)
- Price discovery through matching buy and sell orders
- Support for market orders and limit orders
- Real-time order matching engine

**Key Characteristics:**
- Certificate type: CEA only
- Settlement currency: EUR
- Order types: Market, Limit
- Execution: Immediate or resting in order book

### SWAP Market

**Purpose:** Allow customers to exchange CEA certificates for EUA certificates at fixed conversion rates.

**Participants:**
- **Customers:** Entities that want to convert between CEA and EUA
- **SWAP Makers:** Market makers that facilitate conversions with inventory of both certificates

**Trading Mechanism:**
- Swap request system (not an order book)
- Fixed conversion rates (no price discovery)
- Batch matching of swap requests
- Settlement requires both certificates

**Key Characteristics:**
- Certificate types: CEA ↔ EUA
- No cash involved
- Conversion rates: Fixed by platform or dynamic based on supply/demand
- Execution: Batch processing

## Market Maker Types

### CEA_CASH_SELLER

**Market:** CEA-CASH

**Role:** Sells CEA certificates for EUR cash

**Inventory:**
- Holds: CEA certificates
- Receives: EUR cash when orders execute

**Order Behavior:**
- Places SELL orders in the CEA-CASH order book
- Prices CEA certificates in EUR
- Competes with other sellers on price

**Example:** A company that produces CEA certificates and wants to sell them for cash.

### CASH_BUYER

**Market:** CEA-CASH

**Role:** Buys CEA certificates with EUR cash

**Inventory:**
- Holds: EUR cash
- Receives: CEA certificates when orders execute

**Order Behavior:**
- Places BUY orders in the CEA-CASH order book
- Bids on CEA certificates in EUR
- Provides liquidity to the market

**Example:** An investment fund that provides liquidity by purchasing CEA certificates.

### SWAP_MAKER

**Market:** SWAP (CEA-EUA)

**Role:** Facilitates conversions between CEA and EUA

**Inventory:**
- Holds: Both CEA and EUA certificates
- Exchanges: Converts customer requests at configured rates

**Behavior:**
- Maintains inventory of both certificate types
- Accepts swap requests from customers
- Executes swaps at fixed or dynamic rates
- Rebalances inventory periodically

**Example:** A liquidity provider that enables customers to convert between certificate types.

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    market markettype NOT NULL,  -- 'CEA_CASH' or 'SWAP'
    entity_id UUID REFERENCES entities(id),
    market_maker_id UUID REFERENCES market_maker_clients(id),
    certificate_type certificatetype NOT NULL,  -- 'CEA' or 'EUA'
    side orderside NOT NULL,  -- 'BUY' or 'SELL'
    price NUMERIC(18, 4) NOT NULL,
    quantity NUMERIC(18, 2) NOT NULL,
    filled_quantity NUMERIC(18, 2) DEFAULT 0,
    status orderstatus DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- If `market = 'CEA_CASH'`, then `certificate_type` must be `'CEA'`
- If `market = 'SWAP'`, orders are not used (swap requests are)

### Market Maker Clients Table

```sql
CREATE TABLE market_maker_clients (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mm_type marketmakertype NOT NULL,  -- 'CEA_CASH_SELLER', 'CASH_BUYER', 'SWAP_MAKER'
    eur_balance NUMERIC(18, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- If `mm_type = 'CASH_BUYER'`, then `eur_balance > 0` and no certificate holdings
- If `mm_type = 'CEA_CASH_SELLER'`, then CEA certificate holdings > 0 and `eur_balance = 0`
- If `mm_type = 'SWAP_MAKER'`, then both CEA and EUA certificate holdings > 0

## API Endpoints

### CEA-CASH Market

```
GET  /api/v1/cash-market/orderbook/cea     # Get CEA-CASH order book
POST /api/v1/cash-market/orders             # Place order in CEA-CASH market
GET  /api/v1/cash-market/orders/my          # Get my orders
POST /api/v1/cash-market/orders/cancel      # Cancel order
```

### SWAP Market

```
GET  /api/v1/swap/rates                     # Get current conversion rates
POST /api/v1/swap/requests                  # Submit swap request
GET  /api/v1/swap/requests/my               # Get my swap requests
POST /api/v1/swap/requests/cancel           # Cancel swap request
```

### Market Makers (Admin)

```
GET    /api/v1/admin/market-makers          # List all market makers
POST   /api/v1/admin/market-makers          # Create new market maker
GET    /api/v1/admin/market-makers/{id}     # Get market maker details
PATCH  /api/v1/admin/market-makers/{id}     # Update market maker
DELETE /api/v1/admin/market-makers/{id}     # Delete market maker
```

## User Interface

### Backoffice

**Market Makers Page:**
- Filter by market (CEA-CASH or SWAP)
- Show market-specific roles and balances
- Portfolio summary grouped by market

**Create Market Maker:**
1. Select market first
2. Choose role within that market
3. Provide appropriate balances for role

### Customer Portal

**CEA-CASH Market Page:**
- Order book showing bids and asks
- Place buy/sell orders for CEA
- View my orders and trade history

**SWAP Market Page:**
- Current conversion rates
- Submit swap requests
- View swap request status

## Testing Strategy

### Unit Tests

- Market maker validation (balance requirements per type)
- Order validation (market/certificate type consistency)
- Swap request validation

### Integration Tests

- CEA-CASH order matching
- SWAP request processing
- Market maker order placement

### E2E Tests

- Create market maker → place orders → match → settle
- Submit swap request → match → execute
- Portfolio value calculations by market

## Migration Path

See `docs/plans/2026-01-21-market-maker-market-restructure.md` for detailed migration steps from old certificate-based model to new market-based model.
```

**Step 2: Commit**

```bash
git add docs/architecture/market-model.md
git commit -m "docs: Add comprehensive market architecture document

Describes the two-market model (CEA-CASH and SWAP),
market maker types, database schema, API design,
and UI organization.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan restructures the entire platform around two distinct markets:

**Key Changes:**
1. Database: New MarketMakerType enum, market field on orders
2. Backend: Updated services, validation for market-based rules
3. Frontend: Market-first UI, role-specific displays
4. Documentation: Clear explanation of two-market architecture

**Migration Strategy:**
- Backwards compatible: Existing data migrated to new types
- Incremental: Can be implemented phase by phase
- Tested: Each phase has tests before moving to next

**Testing Checkpoints:**
- After each task, run relevant tests
- Before moving to next phase, verify all tests pass
- Manual verification in dev environment

**Expected Duration:** 2-3 days of focused implementation
