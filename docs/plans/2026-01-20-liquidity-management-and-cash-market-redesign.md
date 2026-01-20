# Liquidity Management and Cash Market Redesign

**Date:** 2026-01-20
**Status:** Design Approved
**Author:** Claude with Victor Safta

## Overview

This design document covers three interconnected features that enhance the trading platform's liquidity management capabilities:

1. **Redesigned Cash Market Page** - Full-width order book with sticky order entry for better UX
2. **Create Liquidity Feature** - Backoffice tool to inject market liquidity with automatic MM coordination
3. **Liquidity Provider Market Makers** - New MM type that holds EUR and places BID orders

These features work together to enable administrators to programmatically create market depth by coordinating multiple market makers across both sides of the order book.

## Business Requirements

### 1. Cash Market Page Redesign
- Order book should stretch across the full page width
- Order entry section should be fixed above the order book
- Order entry remains visible when scrolling through order book rows
- Improved visibility of market depth with larger, more prominent order rows

### 2. Create Liquidity Feature
- Admin specifies target liquidity in EUR for both BID and ASK sides
- System automatically distributes orders across available market makers
- If MMs lack sufficient assets, system prompts admin with provisioning options
- Orders placed at tight spreads (within 1-2% of mid-price) across 3 price levels
- Complete audit trail of all liquidity operations

### 3. Liquidity Provider Market Makers
- New class of market makers that hold EUR instead of certificates
- Can only place BUY orders (provide BID liquidity)
- Distinct from traditional asset-holding MMs that provide ASK liquidity
- Both types coordinated automatically during liquidity creation

## Data Model Changes

### 1. New Enum: MarketMakerType

```python
class MarketMakerType(str, enum.Enum):
    ASSET_HOLDER = "ASSET_HOLDER"          # Holds CEA/EUA, places SELL orders
    LIQUIDITY_PROVIDER = "LIQUIDITY_PROVIDER"  # Holds EUR, places BUY orders
```

### 2. MarketMakerClient Table Updates

**New Columns:**
```python
mm_type = Column(SQLEnum(MarketMakerType), default=MarketMakerType.ASSET_HOLDER, nullable=False)
eur_balance = Column(Numeric(18, 2), default=0)  # For Liquidity Providers
```

**Purpose:**
- `mm_type` differentiates between asset-holding and EUR-holding MMs
- `eur_balance` tracks EUR holdings for Liquidity Provider type
- Asset-holding MMs continue using AssetTransaction system for CEA/EUA tracking

### 3. New Table: LiquidityOperation

**Purpose:** Audit trail for liquidity creation operations

```python
class LiquidityOperation(Base):
    __tablename__ = "liquidity_operations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(30), nullable=False, index=True)
    certificate_type = Column(SQLEnum(CertificateType), nullable=False)

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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
```

### 4. AssetTransaction Updates

**No schema changes needed** - existing table already supports:
- `entity_id` for regular entity transactions
- `market_maker_id` for MM transactions
- Will use this for EUR transactions on Liquidity Provider MMs

## Backend Implementation

### 1. New Service: liquidity_service.py

**Location:** `backend/app/services/liquidity_service.py`

**Core Functions:**

```python
async def preview_liquidity_creation(
    db: AsyncSession,
    certificate_type: CertificateType,
    bid_amount_eur: Decimal,
    ask_amount_eur: Decimal
) -> LiquidityPreview:
    """
    Calculate liquidity creation plan without executing.
    Returns what MMs will be used, what orders will be created,
    and whether sufficient assets exist.
    """

async def create_liquidity(
    db: AsyncSession,
    certificate_type: CertificateType,
    bid_amount_eur: Decimal,
    ask_amount_eur: Decimal,
    created_by_id: UUID,
    notes: Optional[str] = None
) -> LiquidityOperation:
    """
    Execute liquidity creation by placing orders across MMs.
    Raises exception if insufficient assets.
    """

async def get_liquidity_providers(
    db: AsyncSession
) -> List[MarketMakerClient]:
    """Get all active EUR-holding MMs with balances"""

async def get_asset_holders(
    db: AsyncSession,
    certificate_type: CertificateType
) -> List[MarketMakerClient]:
    """Get all active asset-holding MMs with certificate balances"""

async def provision_market_makers(
    db: AsyncSession,
    action: str,  # 'create_new' or 'fund_existing'
    mm_type: MarketMakerType,
    amount: Decimal,
    created_by_id: UUID,
    mm_ids: Optional[List[UUID]] = None
) -> Dict:
    """
    Create new MMs or fund existing ones when assets insufficient.
    """
```

### 2. Liquidity Creation Algorithm

**Step 1: Calculate Reference Price**
```python
# Get current best bid/ask from real orderbook
orderbook = await get_real_orderbook(db, certificate_type)
if orderbook.best_bid and orderbook.best_ask:
    mid_price = (orderbook.best_bid + orderbook.best_ask) / 2
else:
    # Fallback to last trade or default price
    mid_price = await get_last_trade_price(db, certificate_type) or DEFAULT_PRICES[certificate_type]
```

**Step 2: Distribute BID Liquidity**
```python
# Get all Liquidity Provider MMs
lp_mms = await get_liquidity_providers(db)
total_eur_available = sum(mm.eur_balance for mm in lp_mms)

if total_eur_available < bid_amount_eur:
    raise InsufficientAssetsError(
        asset_type="EUR",
        required=bid_amount_eur,
        available=total_eur_available,
        shortfall=bid_amount_eur - total_eur_available
    )

# Distribute evenly
eur_per_mm = bid_amount_eur / len(lp_mms)
```

**Step 3: Distribute ASK Liquidity**
```python
# Convert EUR to certificate quantity
ask_quantity_needed = ask_amount_eur / mid_price

# Get all Asset Holder MMs
ah_mms = await get_asset_holders(db, certificate_type)
total_certs_available = sum(
    await get_mm_balance(db, mm.id, certificate_type)
    for mm in ah_mms
)

if total_certs_available < ask_quantity_needed:
    raise InsufficientAssetsError(
        asset_type=certificate_type,
        required=ask_quantity_needed,
        available=total_certs_available,
        shortfall=ask_quantity_needed - total_certs_available
    )

# Distribute evenly
quantity_per_mm = ask_quantity_needed / len(ah_mms)
```

**Step 4: Generate Order Prices (Tight Spread)**
```python
# BID levels (0.2% - 0.5% below mid)
bid_prices = [
    mid_price * Decimal("0.998"),  # 0.2% below - 50% of volume
    mid_price * Decimal("0.996"),  # 0.4% below - 30% of volume
    mid_price * Decimal("0.995"),  # 0.5% below - 20% of volume
]

# ASK levels (0.2% - 0.5% above mid)
ask_prices = [
    mid_price * Decimal("1.002"),  # 0.2% above - 50% of volume
    mid_price * Decimal("1.004"),  # 0.4% above - 30% of volume
    mid_price * Decimal("1.005"),  # 0.5% above - 20% of volume
]

# Volume distribution
volume_split = [Decimal("0.5"), Decimal("0.3"), Decimal("0.2")]
```

**Step 5: Create Orders**
```python
for mm in lp_mms:
    for i, price in enumerate(bid_prices):
        quantity = (eur_per_mm * volume_split[i]) / price
        order = Order(
            market_maker_id=mm.id,
            certificate_type=certificate_type,
            side=OrderSide.BUY,
            price=price,
            quantity=quantity,
            status=OrderStatus.OPEN
        )
        db.add(order)
        # Create corresponding AssetTransaction to lock EUR
        # Update mm.eur_balance
```

### 3. New API Router: liquidity.py

**Location:** `backend/app/api/v1/liquidity.py`

**Endpoints:**

```python
@router.post("/preview")
async def preview_liquidity_creation(
    request: LiquidityPreviewRequest,
    current_user: User = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Preview liquidity creation without executing.

    Returns:
    - can_execute: bool
    - bid_plan: {mms: [...], total_eur: ..., orders: [...]}
    - ask_plan: {mms: [...], total_certificates: ..., orders: [...]}
    - missing_assets: {asset_type, shortfall} or null
    - suggested_actions: ['create_lp_mms', 'fund_existing', ...]
    """

@router.post("/create")
async def create_liquidity(
    request: LiquidityCreateRequest,
    current_user: User = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Execute liquidity creation.

    Returns:
    - success: bool
    - liquidity_operation_id: UUID
    - orders_created: int
    - bid_liquidity_eur: Decimal
    - ask_liquidity_eur: Decimal
    - market_makers_used: [{id, name, type, amount}, ...]
    """

@router.get("/operations")
async def get_liquidity_operations(
    certificate_type: Optional[CertificateType] = None,
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db = Depends(get_db)
):
    """List historical liquidity operations"""

@router.post("/provision")
async def provision_market_makers(
    request: ProvisionRequest,
    current_user: User = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Create or fund market makers when preview shows insufficient assets.

    Request:
    - action: 'create_new' | 'fund_existing'
    - mm_type: 'LIQUIDITY_PROVIDER' | 'ASSET_HOLDER'
    - amount: Decimal
    - mm_ids: Optional[List[UUID]] (for fund_existing)
    - count: Optional[int] (for create_new)
    """
```

### 4. Market Maker API Updates

**Location:** `backend/app/api/v1/market_maker.py`

**Modified Endpoints:**

```python
@router.post("/")
async def create_market_maker(
    request: MarketMakerCreateRequest,  # Add mm_type field
    ...
):
    """
    Create market maker with specified type.
    For LIQUIDITY_PROVIDER, can provide initial_eur_balance.
    For ASSET_HOLDER, can provide initial_balances (CEA/EUA).
    """

@router.put("/{mm_id}/fund")
async def fund_market_maker(
    mm_id: UUID,
    request: FundRequest,  # {asset_type, amount}
    ...
):
    """
    Fund market maker with EUR or certificates.
    - LIQUIDITY_PROVIDER: only accepts EUR
    - ASSET_HOLDER: only accepts CEA/EUA
    """

@router.get("/")
async def get_market_makers(
    mm_type: Optional[MarketMakerType] = None,  # Filter by type
    ...
):
    """List market makers with optional type filter"""
```

## Frontend Implementation

### 1. Cash Market Page Redesign

**File:** `frontend/src/pages/CashMarketPage.tsx`

**Layout Changes:**

```tsx
<div className="min-h-screen bg-navy-50 dark:bg-navy-900">
  {/* Header - scrolls normally */}
  <div className="bg-white dark:bg-navy-800 border-b">
    {/* Market stats, toggle, etc */}
  </div>

  <div className="max-w-7xl mx-auto p-6">
    {/* Order Entry - becomes sticky */}
    <div className="sticky top-0 z-10 bg-navy-50 dark:bg-navy-900 pb-4">
      <UserOrderEntryModal
        certificateType={certificateType}
        availableBalance={userBalances.eur_balance}
        bestAskPrice={orderBook?.best_ask}
        onOrderSubmit={handleMarketOrderSubmit}
      />
    </div>

    {/* Order Book - full width, scrollable */}
    <div className="max-h-[600px] overflow-y-auto">
      <ProfessionalOrderBook
        orderBook={orderBook}
        onPriceClick={handlePriceClick}
      />
    </div>

    {/* Market Depth Chart & Recent Trades - below order book */}
    <div className="grid grid-cols-2 gap-6 mt-6">
      <MarketDepthChart ... />
      <RecentTrades ... />
    </div>

    {/* My Orders - bottom */}
    <div className="mt-6">
      <MyOrders ... />
    </div>
  </div>
</div>
```

**Key CSS Changes:**
- Order entry: `position: sticky; top: 0; z-index: 10; background: inherit`
- Order book: `max-height: 600px; overflow-y: auto`
- Remove side-by-side grid for order book and trade panel
- Increase order book row height for better visibility

### 2. Create Liquidity Page

**File:** `frontend/src/pages/CreateLiquidityPage.tsx`

**Component Structure:**

```tsx
export function CreateLiquidityPage() {
  const [certificateType, setCertificateType] = useState<'EUA' | 'CEA'>('EUA');
  const [bidAmountEur, setBidAmountEur] = useState('');
  const [askAmountEur, setAskAmountEur] = useState('');
  const [preview, setPreview] = useState<LiquidityPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePreview = async () => {
    const previewData = await liquidityApi.previewLiquidity({
      certificate_type: certificateType,
      bid_amount_eur: parseFloat(bidAmountEur),
      ask_amount_eur: parseFloat(askAmountEur),
    });
    setPreview(previewData);
    setShowPreviewModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>Create Liquidity</h1>

      {/* Certificate Type Selector */}
      <div className="mb-6">
        <label>Certificate Type</label>
        <ButtonGroup>
          <Button onClick={() => setCertificateType('EUA')}>EUA</Button>
          <Button onClick={() => setCertificateType('CEA')}>CEA</Button>
        </ButtonGroup>
      </div>

      {/* BID Liquidity Input */}
      <div className="mb-4">
        <label>BID Liquidity (EUR)</label>
        <input
          type="number"
          value={bidAmountEur}
          onChange={(e) => setBidAmountEur(e.target.value)}
          placeholder="e.g., 100000"
        />
        <p className="text-sm text-gray-500">
          Amount of EUR to deploy on buy side (using Liquidity Provider MMs)
        </p>
      </div>

      {/* ASK Liquidity Input */}
      <div className="mb-4">
        <label>ASK Liquidity (EUR)</label>
        <input
          type="number"
          value={askAmountEur}
          onChange={(e) => setAskAmountEur(e.target.value)}
          placeholder="e.g., 50000"
        />
        <p className="text-sm text-gray-500">
          EUR value of certificates to deploy on sell side (using Asset Holder MMs)
        </p>
      </div>

      {/* Preview Button */}
      <Button onClick={handlePreview}>
        Preview Liquidity Creation
      </Button>

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

### 3. Liquidity Preview Modal

**File:** `frontend/src/components/backoffice/LiquidityPreviewModal.tsx`

**Component Structure:**

```tsx
interface LiquidityPreviewModalProps {
  preview: LiquidityPreview;
  onClose: () => void;
  onExecute: () => Promise<void>;
}

export function LiquidityPreviewModal({ preview, onClose, onExecute }) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute();
      onClose();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Liquidity Creation Preview</h2>

      {/* BID Side Summary */}
      <section>
        <h3>BID Side (Buy Orders)</h3>
        <p>{preview.bid_plan.mms.length} Liquidity Provider MMs</p>
        <p>Total EUR: €{preview.bid_plan.total_eur.toLocaleString()}</p>

        <table>
          {preview.bid_plan.mms.map(mm => (
            <tr key={mm.id}>
              <td>{mm.name}</td>
              <td>€{mm.allocation.toLocaleString()}</td>
              <td>{mm.orders_count} orders</td>
            </tr>
          ))}
        </table>
      </section>

      {/* ASK Side Summary */}
      <section>
        <h3>ASK Side (Sell Orders)</h3>
        <p>{preview.ask_plan.mms.length} Asset Holder MMs</p>
        <p>Total Certificates: {preview.ask_plan.total_certificates}</p>

        <table>
          {preview.ask_plan.mms.map(mm => (
            <tr key={mm.id}>
              <td>{mm.name}</td>
              <td>{mm.quantity} {preview.certificate_type}</td>
              <td>{mm.orders_count} orders</td>
            </tr>
          ))}
        </table>
      </section>

      {/* Order Placement Preview */}
      <section>
        <h3>Order Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4>BID Prices</h4>
            {preview.bid_plan.price_levels.map(level => (
              <div key={level.price}>
                ${level.price} - {level.percentage}% of volume
              </div>
            ))}
          </div>
          <div>
            <h4>ASK Prices</h4>
            {preview.ask_plan.price_levels.map(level => (
              <div key={level.price}>
                ${level.price} - {level.percentage}% of volume
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insufficient Assets Warning */}
      {!preview.can_execute && preview.missing_assets && (
        <Alert variant="error">
          <AlertCircle />
          <div>
            <h4>Insufficient Assets</h4>
            <p>
              Missing {preview.missing_assets.shortfall.toLocaleString()} {preview.missing_assets.asset_type}
            </p>
            <div className="flex gap-2 mt-2">
              <Button onClick={handleCreateNewMMs}>
                Create New Market Makers
              </Button>
              <Button onClick={handleFundExisting}>
                Fund Existing Market Makers
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Summary */}
      <section>
        <p>Total Orders: {preview.total_orders_count}</p>
        <p>Estimated Spread: {preview.estimated_spread}%</p>
      </section>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExecute}
          disabled={!preview.can_execute || isExecuting}
        >
          {isExecuting ? 'Executing...' : 'Confirm & Execute'}
        </Button>
      </div>
    </Modal>
  );
}
```

### 4. Market Maker Component Updates

**CreateMarketMakerModal Updates:**
```tsx
// Add MM type selector
<div className="mb-4">
  <label>Market Maker Type</label>
  <select value={mmType} onChange={(e) => setMmType(e.target.value)}>
    <option value="ASSET_HOLDER">Asset Holder (CEA/EUA)</option>
    <option value="LIQUIDITY_PROVIDER">Liquidity Provider (EUR)</option>
  </select>
</div>

{/* Conditional funding fields based on type */}
{mmType === 'LIQUIDITY_PROVIDER' ? (
  <div>
    <label>Initial EUR Balance</label>
    <input type="number" value={eurBalance} onChange={...} />
  </div>
) : (
  <div>
    <label>Initial CEA Balance</label>
    <input type="number" value={ceaBalance} onChange={...} />
    <label>Initial EUA Balance</label>
    <input type="number" value={euaBalance} onChange={...} />
  </div>
)}
```

**MarketMakersList Updates:**
```tsx
// Add type badge
<Badge variant={mm.mm_type === 'LIQUIDITY_PROVIDER' ? 'blue' : 'green'}>
  {mm.mm_type === 'LIQUIDITY_PROVIDER' ? 'LP' : 'AH'}
</Badge>

// Show appropriate balance
{mm.mm_type === 'LIQUIDITY_PROVIDER' ? (
  <div>EUR: €{mm.eur_balance.toLocaleString()}</div>
) : (
  <div>
    <div>CEA: {mm.cea_balance}</div>
    <div>EUA: {mm.eua_balance}</div>
  </div>
)}
```

## Implementation Sequence

### Phase 1: Database & Models (Backend)
1. Create migration for `MarketMakerType` enum
2. Add `mm_type` and `eur_balance` columns to `market_maker_clients` table
3. Create `liquidity_operations` table
4. Update `MarketMakerClient` model with new fields
5. Create `LiquidityOperation` model

### Phase 2: Liquidity Service (Backend)
1. Create `liquidity_service.py` with core functions
2. Implement liquidity preview logic
3. Implement liquidity creation logic
4. Implement provisioning logic
5. Add comprehensive error handling and validation

### Phase 3: API Layer (Backend)
1. Create `liquidity.py` router with all endpoints
2. Update `market_maker.py` endpoints for new MM types
3. Add request/response schemas
4. Add admin-only security requirements

### Phase 4: Frontend Components
1. Update `CreateMarketMakerModal` with type selector
2. Update `MarketMakersList` to show type and EUR balance
3. Create `LiquidityPreviewModal` component
4. Create `CreateLiquidityPage` component
5. Add routes and navigation

### Phase 5: Cash Market Page Redesign
1. Restructure `CashMarketPage` layout
2. Make order entry sticky
3. Make order book full-width and scrollable
4. Adjust responsive breakpoints
5. Test scrolling behavior

### Phase 6: Integration & Testing
1. Test liquidity creation with different scenarios
2. Test insufficient assets handling
3. Test MM provisioning flows
4. Test order placement and matching
5. Verify audit trails and ticket logs

## Error Handling

### Insufficient Assets
```python
class InsufficientAssetsError(Exception):
    def __init__(self, asset_type, required, available, shortfall):
        self.asset_type = asset_type
        self.required = required
        self.available = available
        self.shortfall = shortfall
```

Frontend should catch this and display the provisioning modal with clear actions.

### Invalid MM Type
Validate that Liquidity Provider MMs have EUR and Asset Holder MMs have certificates before attempting liquidity creation.

### Order Placement Failures
Wrap order creation in a transaction. If any order fails, roll back entire operation and return detailed error.

## Security Considerations

1. **Admin-Only Access:** All liquidity endpoints require admin role
2. **Audit Trail:** Every liquidity operation creates TicketLog entries
3. **Asset Verification:** Double-check MM balances before locking assets
4. **Transaction Safety:** Use database transactions for atomic operations
5. **Rate Limiting:** Prevent abuse of liquidity creation endpoint

## Testing Strategy

### Unit Tests
- Liquidity distribution algorithms
- Price level calculations
- Asset sufficiency checks
- MM type filtering

### Integration Tests
- End-to-end liquidity creation
- Provisioning flows
- Order matching with liquidity orders
- Audit trail verification

### UI Tests
- Sticky order entry behavior
- Modal interactions
- Form validations
- Error state displays

## Success Metrics

1. **Liquidity Creation Time:** < 5 seconds for typical operation
2. **Order Distribution:** Evenly spread across MMs (±5%)
3. **Price Accuracy:** Orders placed within 0.1% of target prices
4. **Audit Completeness:** 100% of operations logged
5. **UI Responsiveness:** Sticky elements perform smoothly at 60fps

## Future Enhancements

1. **Dynamic Price Distribution:** Adjust spread based on market volatility
2. **MM Performance Tracking:** Track which MMs provide best liquidity
3. **Scheduled Liquidity:** Automated liquidity injection at specific times
4. **Liquidity Withdrawal:** Bulk cancel/modify liquidity orders
5. **Multi-Certificate Support:** Create liquidity for multiple certificates at once

## Conclusion

This design provides a comprehensive solution for programmatic liquidity management while maintaining clean separation between EUR-holding and asset-holding market makers. The redesigned cash market page improves user experience, and the new backoffice tools give administrators powerful control over market depth.

The implementation follows the existing patterns in the codebase (ticket logging, market maker service, order matching) while introducing new capabilities that scale with the platform's growth.
