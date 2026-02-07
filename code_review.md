# Code Review: 0021 – CEA and EUA Volumes as Integers Only

**Full documentation (plan, review, fixes):** [docs/features/0021_REVIEW.md](docs/features/0021_REVIEW.md)

Review performed against `docs/features/0021_PLAN.md`. Order: Phase 1 (SSOT + schemas) → Phase 2 (backend services/endpoints) → Phase 3 (frontend).

---

## Phase 1 – Data Layer and SSOT

### 1.1 app_truth.md ✅

- **§5** contains the integer-only rule under "CEA and EUA volumes (integer only)": whole numbers only, no fractional certificates; API request/response and UI must use integers for CEA/EUA; EUR remains decimal.
- **Verdict**: Done.

### 1.2 Backend schemas (`backend/app/schemas/schemas.py`) ✅

- **Helpers**: `_coerce_certificate_quantity` and `_coerce_certificate_quantity_optional` enforce positive integer; used across CEA/EUA quantity fields.
- **Certificate / Trade / Swap (legacy)**: `CertificateCreate.quantity`, `CertificateResponse.quantity`, `MarketplaceListing.quantity`, `TradeCreate.quantity`, `TradeResponse.quantity`, `SwapCreate.quantity`, `SwapResponse.quantity` — all `int` with validators.
- **PortfolioSummary**: `total_eua: int`, `total_cea: int`.
- **CEA Cash Market**: `OrderCreate.quantity` (int + validator), `OrderResponse` (quantity, filled_quantity, remaining_quantity int), `OrderBookLevel`, `OrderFill`, `OrderPreviewRequest/Response`, `MarketOrderRequest`, `LimitOrderRequest`, `OrderExecutionResponse` (total_quantity, certificate_balance int), `MarketDepthPoint.cumulative_quantity`, `CashMarketTradeResponse.quantity`, `MarketStatsResponse.volume_24h` (int).
- **AddAssetRequest**: `amount: float` with `model_validator cea_eua_amount_integer` rejecting non-integer when asset_type is CEA or EUA.
- **EntityHoldingResponse / AssetTransactionResponse**: `quantity` / `amount` / `balance_before` / `balance_after` typed as `float`; API layer passes int for CEA/EUA via `_amt()` in backoffice. Plan allows “validator or serializer”; current approach is acceptable.
- **EntityAssetsResponse**: `cea_balance`, `eua_balance` float with comment “Integer in API response”; backoffice returns `int(round(...))`.
- **Market Maker**: `MarketMakerResponse.cea_balance` / `eua_balance` (Decimal); API in market_maker.py returns int for CEA/EUA. `MarketMakerTransactionResponse.amount` / `balance_after` documented as integer for CEA/EUA.
- **Swap**: `CreateSwapRequest.quantity: int`, `CreateSwapOfferRequest.eua_quantity: int`.
- **Auto-trade**: `fixed_quantity`, `min_quantity`, `max_quantity` have validators that reject non-whole numbers.
- **Verdict**: Done.

---

## Phase 2 – Backend Services and Endpoints

### 2.1 Backoffice – add-asset ✅

- **backoffice.py** `add_asset_to_entity`: For CEA/EUA, uses `amount_abs = Decimal(str(int(round(raw_amount))))`, validates positive, writes integer to holding; success message shows integer for CEA/EUA and 2 decimals for EUR.
- **Verdict**: Done.

### 2.2 Backoffice – entity assets / transactions ✅

- **EntityAssetsResponse**: `cea_balance` / `eua_balance` returned as `int(round(float(...)))`.
- **recent_transactions**: `_amt(t.amount, t.asset_type)` etc. return `int(round(float(v)))` for CEA/EUA.
- **Verdict**: Done.

### 2.3 Backoffice – update order (quantity) ✅

- **backoffice.py** (order update): Validates quantity is whole number (400 if fractional); sets `order.quantity = Decimal(str(int(round(new_quantity))))`.
- **Verdict**: Done.

### 2.4 Swaps ✅

- **CreateSwapRequest**: `quantity: int`. **CreateSwapOfferRequest**: `eua_quantity: int`.
- **get_swap_stats**: Returns `total_eua_volume: 0`, `total_cea_volume: 0` (int).
- **create_swap_offer**, orderbook levels: `eua_quantity` and quantities serialized as int.
- **Verdict**: Done.

### 2.5 Cash market ✅

- **place_order**: OrderResponse built with `quantity` / `filled_quantity` / `remaining_quantity` as `int(round(float(...)))`.
- **get_recent_trades**: `CashMarketTradeResponse.quantity` = `int(round(float(t.quantity)))`.
- **get_market_stats**: `volume_24h=int(round(volume_24h))` when trades_24h else 0.
- **orderbook (order_matching.get_real_orderbook)**: bid/ask `quantity` and `cumulative_quantity` set to `int(round(...))`.
- **OrderExecutionResponse**: `certificate_balance=int(round(float(result.certificate_balance)))`.
- **Verdict**: Done.

### 2.6 Marketplace ✅

- **marketplace.py** `get_marketplace_overview`: `total_cea_volume=int(round(total_cea_volume))`, `total_eua_volume=0`.
- **Verdict**: Done.

### 2.7 Services ✅

- **order_matching.py**: volume_24h and orderbook quantities returned as int; `certificate_balance` passed as Decimal from `get_entity_balance`; cash_market converts to int in `OrderExecutionResponse`.
- **balance_utils**: Callers (e.g. add_asset) pass integer amount for CEA/EUA; no change needed.
- **settlement_service**: Uses Decimal for quantity; persistence unchanged. **settlement.py** API: `get_my_pending_settlements` and `get_settlement_details` return `quantity` as `int(round(...))` for CEA/EUA.

### 2.8 Admin / other ✅

- **users.py** entity balances: `cea_balance` / `eua_balance` returned as `int(round(float(holding.quantity)))`.
- **cash_market.py** get_cea_sellers: returns `cea_balance` and `cea_sold` as `int(round(...))` for CEA consistency.

---

## Phase 3 – Frontend

### 3.1 Utils and display ✅

- **utils/index.ts**: `formatCertificateQuantity` exists; uses `maximumFractionDigits: 0` and `Math.round(value)`.
- **formatQuantity**: `maximumFractionDigits: 2`; used where decimals are allowed; CEA/EUA surfaces use `formatCertificateQuantity`.
- **BalanceCards, MarketMakersList, MarketMakerDetailsTab, MarketMakerTransactionsTab, MarketMakerTransactionsSection**: Use `formatCertificateQuantity` for CEA/EUA.
- **EditOrderModal, TransactionForm, PlaceOrder, MMOrderPlacementModal, IndividualOrdersTable, OrderBookRow, UserDetailsTab, PendingSettlements, SettlementDetails**: Use `formatCertificateQuantity` for quantities/balances.
- **CashMarketProPage**: Local `formatQuantity = (qty) => Math.round(qty).toLocaleString()` — 0 decimals. OK.
- **Verdict**: Done.

### 3.2 SettlementTransactions ✅

- **SettlementTransactions.tsx**: Uses `formatCertificateQuantity(settlement.quantity)` for quantity display.
- **Verdict**: Done.

### 3.3 Inputs (decimals / step) ✅

- **TransactionForm**: `decimals={0}` for amount; submits `Math.floor(amountNum)` for CEA/EUA.
- **EditOrderModal**: `decimals={0}` for quantity.
- **PlaceOrder, MMOrderPlacementModal, TradePanel, CreateLiquidityPage, MarketMakerAutoTradeTab, CreateMarketMakerModal, PlaceMarketOrderSection, UserOrdersSection**: CEA/EUA quantity inputs use `decimals={0}`.
- **ProfilePage**: `decimals={creditAssetType === 'EUR' ? 2 : 0}`; sends `Math.floor(amount)` for CEA/EUA.
- **Verdict**: Done.

### 3.4 API payloads ✅

- **AddAssetModal.tsx**: For CEA/EUA sends `amount: Math.round(amountNum)` in add-asset request.
- **Verdict**: Done.

### 3.5 Other frontend ✅

- **CreateLiquidityPage**: `eua_quantity: Math.round(euaQuantity)`; inputs use `decimals={0}`.
- **api.ts**: Comment at ~1524 documents “CEA/EUA: quantity and volume fields are whole numbers only”; types use `number` with comments where relevant.
- **Verdict**: Done.

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| app_truth.md | ✅ | Integer-only rule in §5 |
| Backend schemas | ✅ | CEA/EUA quantities int + validators |
| Backoffice add-asset | ✅ | Integer amount for CEA/EUA |
| Backoffice assets/transactions | ✅ | Balances and transaction amounts int for CEA/EUA |
| Backoffice update order quantity | ✅ | Validate and store quantity as integer |
| Swaps / cash market / marketplace | ✅ | Request/response quantities int |
| Frontend display | ✅ | formatCertificateQuantity used for CEA/EUA |
| SettlementTransactions | ✅ | Use formatCertificateQuantity for quantity |
| AddAssetModal | ✅ | Send integer amount for CEA/EUA |

---

## Action Items (3) — IMPLEMENTED

1. **Backend – backoffice order update** ✅  
   File: `backend/app/api/v1/backoffice.py` (order update block).  
   Validate that `update["quantity"]` is a whole number for CEA cash market orders; reject with 400 if not; set `order.quantity = Decimal(str(int(round(new_quantity))))`.

2. **Frontend – SettlementTransactions** ✅  
   File: `frontend/src/components/dashboard/SettlementTransactions.tsx`.  
   Replaced `formatQuantity(settlement.quantity)` with `formatCertificateQuantity(settlement.quantity)` for the quantity display.

3. **Frontend – AddAssetModal** ✅  
   File: `frontend/src/components/backoffice/AddAssetModal.tsx`.  
   When `selectedAsset` is `'CEA'` or `'EUA'`, send `amount: Math.round(amountNum)` in the `backofficeApi.addAsset` request body.
