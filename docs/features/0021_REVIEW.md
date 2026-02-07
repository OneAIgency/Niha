# 0021 – Code Review: CEA and EUA Volumes as Integers Only

## Plan reference

- **Plan:** [0021_PLAN.md](./0021_PLAN.md) – CEA and EUA volumes/quantities/amounts are whole numbers only; no fractional certificates. Applies to backend validation, API request/response, frontend display and inputs; EUR remains decimal.

## Summary

Implementation is **complete**. The codebase was reviewed against the plan in three phases (SSOT + schemas → backend services/endpoints → frontend). All required changes and recommended fixes have been applied. CEA and EUA quantities are validated as integers on the backend, serialized as integers in API responses, and displayed/entered as whole numbers on the frontend.

---

## Plan implementation confirmation

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| app_truth.md integer-only rule | Done | §5 documents CEA/EUA volumes as whole numbers; EUR remains decimal |
| Backend schemas (int + validators) | Done | `_coerce_certificate_quantity`, AddAssetRequest `cea_eua_amount_integer`, Order*/Swap*/PortfolioSummary/EntityAssets etc. use int for CEA/EUA |
| Backoffice add-asset | Done | Validates and stores integer for CEA/EUA; success message shows integer for CEA/EUA, 2 decimals for EUR |
| Backoffice entity assets/transactions | Done | `cea_balance`/`eua_balance` and transaction amounts returned as int via `_amt()` |
| Backoffice update order quantity | Done | Rejects fractional quantity (400); stores `int(round(new_quantity))` |
| Swaps / cash market / marketplace | Done | Request/response quantities and volumes (e.g. volume_24h, total_cea_volume) as int |
| Settlement API | Done | `get_my_pending_settlements` and `get_settlement_details` return `quantity` as int |
| Frontend display | Done | `formatCertificateQuantity` used for CEA/EUA; 0 decimals |
| Frontend inputs & payloads | Done | `decimals={0}` for CEA/EUA; AddAssetModal and others send integer (e.g. `Math.round(amountNum)`) |

---

## Code review and fixes applied

Review was performed in optimal order: Phase 1 (SSOT + schemas) → Phase 2 (backend) → Phase 3 (frontend). The following fixes were implemented.

### 1. Backend – backoffice order update

- **File:** `backend/app/api/v1/backoffice.py`
- **Issue:** Order quantity update accepted fractional values.
- **Fix:** Validate `new_quantity == int(round(new_quantity))`; return 400 with message *"CEA quantity must be a whole number (no fractional certificates)"* if not. Set `order.quantity = Decimal(str(int(round(new_quantity))))`.

### 2. Frontend – SettlementTransactions

- **File:** `frontend/src/components/dashboard/SettlementTransactions.tsx`
- **Issue:** Quantity displayed with `formatQuantity` (up to 2 decimals).
- **Fix:** Use `formatCertificateQuantity(settlement.quantity)` for settlement quantity display; import from `../../utils`.

### 3. Frontend – AddAssetModal

- **File:** `frontend/src/components/backoffice/AddAssetModal.tsx`
- **Issue:** Add-asset request sent raw `amountNum` (float) for all asset types.
- **Fix:** For CEA/EUA send `amount: Math.round(amountNum)`; for EUR send `amount: amountNum`.

### 4. Optional – backoffice add-asset success message

- **File:** `backend/app/api/v1/backoffice.py`
- **Change:** Success message formats amount as integer (e.g. `1,000`) for CEA/EUA and with 2 decimals for EUR.

### 5. Optional – CEA sellers API

- **File:** `backend/app/api/v1/cash_market.py`
- **Change:** `get_cea_sellers` returns `cea_balance` and `cea_sold` as `int(round(...))`.

### 6. Optional – settlement API quantity

- **File:** `backend/app/api/v1/settlement.py`
- **Change:** `get_my_pending_settlements` and `get_settlement_details` return `quantity` as `int(round(float(settlement.quantity)))`.

---

## Key implementation details

### Backend

- **Schemas:** `backend/app/schemas/schemas.py` – `_coerce_certificate_quantity` / `_coerce_certificate_quantity_optional`; int types and validators on OrderCreate, OrderResponse, AddAssetRequest (model_validator for CEA/EUA), PortfolioSummary, Swap*, EntityAssetsResponse (returned as int from API), etc.
- **Backoffice:** add-asset rounds CEA/EUA to int before DB write; entity assets and transactions use `_amt(v, asset_type)` to return int for CEA/EUA.
- **Cash market / swaps / marketplace:** Order and trade quantities, volume_24h, total_cea_volume / total_eua_volume serialized as int.
- **Settlement:** Settlement batch quantity in list and detail responses is int.

### Frontend

- **Utils:** `frontend/src/utils/index.ts` – `formatCertificateQuantity(value)` with `maximumFractionDigits: 0` and `Math.round(value)`.
- **Display:** CEA/EUA quantities use `formatCertificateQuantity` in BalanceCards, OrderBookRow, PlaceOrder, EditOrderModal, TransactionForm, SettlementDetails, PendingSettlements, SettlementTransactions, MarketMaker* components, etc.
- **Inputs:** CEA/EUA amount/quantity inputs use `decimals={0}`; payloads use `Math.round` or `Math.floor` where applicable (TransactionForm, ProfilePage, CreateLiquidityPage, AddAssetModal).
- **api.ts:** Comment documents that CEA/EUA quantity and volume fields are whole numbers only.

### Source of truth

- **app_truth.md** §5 – *"CEA and EUA volumes (integer only)"*: whole numbers only; API and UI must use integers for CEA/EUA; EUR remains decimal.

---

## Files changed (summary)

| Area | Files |
| ---- | ----- |
| SSOT | `app_truth.md` (integer rule in §5) |
| Backend schemas | `backend/app/schemas/schemas.py` |
| Backend API | `backend/app/api/v1/backoffice.py`, `cash_market.py`, `settlement.py`, `swaps.py`, `marketplace.py`, `market_maker.py`, `users.py` |
| Backend services | `backend/app/services/order_matching.py` (orderbook/volume_24h as int) |
| Frontend utils | `frontend/src/utils/index.ts` (`formatCertificateQuantity`) |
| Frontend components | `SettlementTransactions.tsx`, `AddAssetModal.tsx`, plus BalanceCards, PlaceOrder, EditOrderModal, TransactionForm, OrderBookRow, MarketMakersList, etc. |
| Frontend pages | `CreateLiquidityPage.tsx`, `ProfilePage.tsx` (integer payloads/decimals) |
| Frontend API | `frontend/src/services/api.ts` (comments) |

---

## Tests (plan §9)

- **Backend** (`tests/test_backoffice_add_asset_ticket.py`):  
  - `test_add_asset_cea_fractional_amount_rejected`: POST add-asset with `asset_type: "CEA"`, `amount: 100.5` returns 422; response detail contains "whole" or "integer".  
  - `test_add_asset_eua_fractional_amount_rejected`: POST add-asset with `asset_type: "EUA"`, `amount: 50.25` returns 422; same assertion.
- **Frontend** (`frontend/src/utils/__tests__/formatCertificateQuantity.test.ts`):  
  - formatCertificateQuantity formats integers with no decimal part; rounds fractions and never outputs a decimal point; null/undefined/NaN become `"0"`.

---

## Verification (tests run)

- **Backend** (`docker compose exec backend pytest tests/test_backoffice_add_asset_ticket.py -v`): all 4 tests passed, including `test_add_asset_cea_fractional_amount_rejected` and `test_add_asset_eua_fractional_amount_rejected`.
- **Frontend** (`cd frontend && npm test -- formatCertificateQuantity --run`): 5 tests in `formatCertificateQuantity.test.ts` passed.
- **Action items**: Backoffice order update (whole-number validation + 400), SettlementTransactions (`formatCertificateQuantity(settlement.quantity)`), AddAssetModal (CEA/EUA `Math.round(amountNum)`) confirmed in code.

---

## Conclusion

0021 is fully implemented: CEA and EUA volumes are treated as integers across validation, storage, API, and UI. All code review findings were addressed; optional improvements (success message formatting, get_cea_sellers, settlement quantity in API) are in place. Plan §9 test recommendations are implemented. No open gaps remain against the plan.
