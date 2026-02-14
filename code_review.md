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

---

# Code Review: All above (0032, 0031/0030 fixes, documentation)

Review of: **0032** (Introducer page, INTRODUCER role), **0031** (Settings/Scraping fixes), **0030** (Auto Trade UI fix), and **documentation** (app_truth, README, DESIGN_SYSTEM, ADMIN_SCRAPING, interface, API). References: `docs/features/0032_PLAN.md`, `docs/features/0032_REVIEW.md`, `docs/features/0031_REVIEW.md`, `docs/features/0030_REVIEW.md`, `docs/commands/write_docs.md`.

---

## 1. 0032 – Introducer

### 1.1 Backend ✅

- **UserRole.INTRODUCER**, **request_flow** on ContactRequest, migration `2026_02_13_introducer_role_and_request_flow` (enum + column).
- **POST /contact/introducer-nda-request**: Form fields + PDF; creates ContactRequest with `request_flow='introducer'`; broadcast + email.
- **create-from-request**: Query param `target_role` (KYC | INTRODUCER); when INTRODUCER, user without Entity.
- **get_introducer_user** dependency; **GET /admin/contact-requests** with `request_flow` filter; responses include `request_flow`.

### 1.2 Frontend ✅

- **UserRole 'INTRODUCER'**, **USER_ROLES**, **getPostLoginRedirect** → `/introducer/dashboard`, **roleBadge** (INTRODUCER → info).
- **IntroducerPage**: ENTER + NDA; NDA → `contactApi.submitIntroducerNDARequest`; redirect when already INTRODUCER to `/introducer/dashboard`.
- **IntroducerDashboardPage**: Minimal content; design tokens.
- **App.tsx**: Routes `/introducer`, `/introducer/dashboard` (RoleProtectedRoute INTRODUCER|ADMIN); CatchAllRedirect uses getPostLoginRedirect (INTRODUCER → dashboard).

### 1.3 Backoffice ✅

- **BackofficeOnboardingPage**: Tab Introducer; `introducerRequests` filtered by `request_flow === 'introducer'`; **ApproveInviteModal** sends `target_role: 'INTRODUCER'` when `requestFlow === 'introducer'`.

### 1.4 Docs ✅

- **ROLE_TRANSITIONS.md**, **app_truth.md** §8: INTRODUCER flow, request_flow, target_role documented.

**Verdict**: 0032 implementation and docs aligned with plan.

---

## 2. 0031 – Fixes (Settings / Scraping)

### 2.1 Certificate Type in edit modal ✅

- **SettingsPage.tsx**: Certificate Type block removed from the **Edit** Scraping Source modal (field not sent by update API; avoids UX mismatch).

### 2.2 ActionsDropdown Escape ✅

- **SettingsPage.tsx** `ActionsDropdown`: `keydown` listener for `Escape` added; closes dropdown; cleanup on unmount.

### 2.2 ScrapingSourceResponse / source.name / optimistic exchange ✅

- Schema already has `last_price_eur`, `last_exchange_rate`; Price Scraping table already shows `source.name`; **handleSaveEditExchange** already unsets other primaries for same currency pair (verified in 0031_REVIEW “Fixes applied”).

**Verdict**: 0031 recommendations applied; 0031_REVIEW.md status and “Fixes applied” section updated.

---

## 3. 0030 – Fix (Auto Trade UI)

### 3.1 GET single market settings ✅

- **get_market_settings** uses `_build_market_settings_response()`, which includes `avg_spread` and `tick_size` (no missing fields).

### 3.2 SettingsInput dark variants ✅

- **AutoTradePage.tsx** `SettingsInput`: `bg-white dark:bg-navy-900`, `border-navy-300 dark:border-navy-700`, `text-navy-900 dark:text-white`, `focus:border-emerald-500/50 dark:focus:border-emerald-500/50` for light/dark.

### 3.3 Executor / save ✅

- Executor: `tick = max(raw_tick, Decimal("0.0001"))` guard present. **handleSaveSettings** uses `Promise.all` for parallel save.

**Verdict**: 0030 C1, M1, M3 addressed; 0030_REVIEW.md “Fixes applied” section added.

---

## 4. Documentation (write_docs)

### 4.1 app_truth.md ✅

- **§4**: Price scraping: name, **is_primary** (one per certificate type).
- **§7**: Migrations: head via `alembic current`; no hardcoded head.
- **§8**: INTRODUCER: **POST /api/v1/contact/introducer-nda-request** and `target_role=INTRODUCER` for create-from-request.

### 4.2 README.md ✅

- Introducer role: `/introducer`, INTRODUCER dashboard, Backoffice Introducer tab.
- Onboarding subpages: Contact Requests, **Introducer**, KYC Review, Deposits; Introducer tab and `target_role=INTRODUCER` described.

### 4.3 frontend/docs/DESIGN_SYSTEM.md ✅

- **Admin config inputs (SettingsInput)**: Light/dark, formatting, recommended hint; reference AutoTradePage.
- **ActionsDropdown**: Ellipsis menu, click-outside + Escape; reference SettingsPage.

### 4.4 docs/ADMIN_SCRAPING.md ✅

- Overview: **is_primary**; example list response includes `is_primary`. **Create source** and **Update source** examples (JSON body, including `is_primary`).

### 4.5 docs/commands/interface.md ✅

- Settings pages: **ActionsDropdown** for table row actions (click-outside + Escape); reference DESIGN_SYSTEM.

### 4.6 docs/API.md ✅

- **New file**: Contact & Introducer (POST /contact/request, nda-request, **introducer-nda-request** with form + example response). Admin: **GET /admin/contact-requests** (request_flow, pagination), **POST /admin/users/create-from-request** (target_role, example for INTRODUCER, errors). References to ADMIN_SCRAPING and app_truth.

**Verdict**: Documentation matches implementation; style and structure consistent; no new docs in `docs/features/` (per write_docs rules).

---

## 5. Summary (all above)

| Area | Status | Notes |
|------|--------|------|
| 0032 Backend | ✅ | INTRODUCER, request_flow, introducer-nda-request, create-from-request target_role, get_introducer_user |
| 0032 Frontend | ✅ | IntroducerPage, IntroducerDashboardPage, routes, redirect, roleBadge, redirect when already INTRODUCER |
| 0032 Backoffice | ✅ | Tab Introducer, ApproveInviteModal target_role |
| 0032 Docs | ✅ | ROLE_TRANSITIONS, app_truth §8 |
| 0031 Fixes | ✅ | Certificate Type removed from edit modal; Escape on ActionsDropdown; 0031_REVIEW updated |
| 0030 Fixes | ✅ | SettingsInput dark variants; 0030_REVIEW “Fixes applied”; C1/I2/M3 already in place |
| app_truth | ✅ | Scraping is_primary, migrations head, introducer endpoint |
| README | ✅ | Introducer feature, Onboarding subpages |
| DESIGN_SYSTEM | ✅ | SettingsInput pattern, ActionsDropdown |
| ADMIN_SCRAPING | ✅ | is_primary, create/update examples |
| interface.md | ✅ | ActionsDropdown pattern |
| docs/API.md | ✅ | Contact, Introducer, Admin contact-requests & create-from-request with examples |

---

## 6. Action items (all above)

None open. All planned changes, review recommendations, and documentation updates have been implemented and verified.

---

# Code Review: 0033 – Ticker & ACTIVITY (colors, single source, WebSocket, hover timestamp, spacing)

Review of: **0033** (Ticker & ACTIVITY on Cash Market Pro). Reference: [docs/features/0033_PLAN.md](docs/features/0033_PLAN.md), [docs/features/0033_REVIEW.md](docs/features/0033_REVIEW.md).

---

## 1. Backend ✅

- **get_recent_trades**: joinedload `buy_order` / `sell_order`; side = aggressor (BUY if buy_order.created_at >= sell_order.created_at); response includes real `side`.
- **place_order (limit)**: after commit, broadcasts `orderbook_updated` and `trade_executed` per match (id, certificate_type, price, quantity, side, executed_at).
- **limit_order_matching.py**: `MatchResult.executed_at`; passed to matches.

**Verdict**: Done.

---

## 2. Frontend ✅

- **Ticker**: Uses `trade.side` when available; fallback on price vs mid; emerald for BUY, red for SELL.
- **RecentTradesActivity**: BUY/SELL badge, quantity @ price, total EUR, relative time; hover `title={formatFullTimestamp(trade.executedAt)}`; `gap-2` spacing.
- **Layout**: ticker lg:col-span-8, ACTIVITY lg:col-span-4; shared `recentTrades`.
- **useCashMarket**: `nihao:tradeExecuted` listener prepends trade, cap 20.
- **useClientRealtime**: `trade_executed` → `nihao:tradeExecuted` with normalized payload.
- **api.ts**: `ClientWebSocketMessage` type includes `trade_executed`; data: id, price, quantity, side, executedAt.

**Verdict**: Done.

---

## 3. Summary (0033)

| Area | Status |
|------|--------|
| Backend get_recent_trades / place_order | ✅ |
| limit_order_matching MatchResult.executed_at | ✅ |
| Ticker / ACTIVITY / Layout | ✅ |
| useCashMarket / useClientRealtime / api.ts | ✅ |

**Action items**: None. Implementation matches plan.
