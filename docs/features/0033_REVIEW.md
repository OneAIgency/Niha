# Code Review: 0033 – Ticker & ACTIVITY: colors, single source, WebSocket, hover timestamp, spacing

**Plan:** [docs/features/0033_PLAN.md](0033_PLAN.md)

Review performed against the plan. Order: Backend → Frontend → Summary.

---

## 1. Backend

### 1.1 cash_market.py – get_recent_trades ✅

- **joinedload**: `buy_order` and `sell_order` loaded (lines 161–164).
- **Side = aggressor**: `_aggressor_side(t)` returns `"BUY"` if `buy_order.created_at >= sell_order.created_at`, else `"SELL"` (lines 168–171).
- **Response**: `CashMarketTradeResponse` includes real `side` field (line 179).
- **Verdict**: Done.

### 1.2 cash_market.py – place_order (limit) ✅

- After `db.commit()`, broadcasts `orderbook_updated` (lines 326–328).
- For each match in `matching_result.matches`, broadcasts `trade_executed` (lines 330–341) with:
  - `id`, `certificate_type`, `price`, `quantity`, `side`, `executed_at`
- **side**: Uses `new_order.side.value` (incoming order = aggressor) — correct.
- **executed_at**: From `m.executed_at`; serialized with `isoformat()` when available.
- **Verdict**: Done.

### 1.3 limit_order_matching.py ✅

- **MatchResult**: Has `executed_at: datetime` (line 47).
- **matches.append**: Passes `executed_at=exec_at` (lines 228–235).
- **Verdict**: Done.

---

## 2. Frontend

### 2.1 CashMarketProPage.tsx – Ticker ✅

- **RecentTradesTicker**: Uses `trade.side` when `'BUY'` or `'SELL'` (lines 210–211); fallback on price vs mid when side not set.
- **Colors**: Emerald for BUY, red for SELL (lines 256–258, 261–262).
- **Verdict**: Done.

### 2.2 CashMarketProPage.tsx – ACTIVITY ✅

- **RecentTradesActivity**: New component (lines 283–369).
- **Display**: BUY/SELL badge, quantity @ price, total EUR (green/red), relative time.
- **Hover**: `title={formatFullTimestamp(trade.executedAt)}` (line 363).
- **formatFullTimestamp**: Returns full UTC timestamp (e.g. “Feb 14, 2026, 1:22:08 AM UTC”).
- **Spacing**: `flex flex-col gap-2` (line 330).
- **Verdict**: Done.

### 2.3 Layout ✅

- Ticker: `lg:col-span-8` (line 417).
- ACTIVITY: `lg:col-span-4` (line 422).
- Both use `recentTrades` from `useCashMarket` (lines 418, 423).
- **Verdict**: Done.

### 2.4 useCashMarket.ts ✅

- **nihao:tradeExecuted** listener (lines 106–117): prepends trade to `recentTrades`, keeps max 20.
- Same state drives both Ticker and ACTIVITY.
- **Verdict**: Done.

### 2.5 useClientRealtime.ts ✅

- **trade_executed** handler (lines 76–89): normalizes payload and dispatches `nihao:tradeExecuted`.
- Payload fields: `id`, `certificateType`, `price`, `quantity`, `side`, `executedAt`.
- Uses `d.side === 'SELL' ? 'SELL' : 'BUY'` with fallback to BUY.
- **Verdict**: Done.

### 2.6 api.ts ✅

- **ClientWebSocketMessage.type**: Includes `'trade_executed'` (line 437).
- **data**: Optional `id`, `price`, `quantity`, `side`, `executedAt` (lines 446–449).
- **Verdict**: Done.

---

## 3. Rules compliance

- **Colors**: Emerald for BUY, red for SELL; no slate/gray. ✅
- **Frozen files**: No changes to `app_truth.md` §10 list. ✅

---

## 4. Summary

| Area | Status | Notes |
|------|--------|-------|
| Backend get_recent_trades | ✅ | joinedload, side = aggressor, real side in response |
| Backend place_order | ✅ | trade_executed broadcast per match |
| limit_order_matching | ✅ | MatchResult.executed_at, passed to matches |
| Ticker | ✅ | trade.side + fallback, emerald/red |
| ACTIVITY | ✅ | RecentTradesActivity, hover full timestamp, gap-2 |
| Layout | ✅ | lg:col-span-8 / lg:col-span-4, shared recentTrades |
| useCashMarket | ✅ | nihao:tradeExecuted prepend, cap 20 |
| useClientRealtime | ✅ | trade_executed → nihao:tradeExecuted |
| api.ts | ✅ | ClientWebSocketMessage trade_executed type + data fields |

---

## 5. Action items

None. Implementation matches the plan.
