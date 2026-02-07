# 0020 – Code Review: Withdrawals in Deposit History, Ticketing și Vizibilitate în Logging

## Summary of implementation quality

Implementation matches the plan: withdrawals and add-asset deposits appear in Deposit History, add-asset operations create tickets, and those tickets are visible on the logging page. Code is consistent with existing patterns, and data flow (snake_case → camelCase via axios) is correctly handled. A few minor improvements and one optional backend alignment are recommended.

---

## Plan implementation confirmation

| Requirement | Status | Notes |
|-------------|--------|--------|
| Withdrawals appear in Deposit History | Done | Unified list from wire deposits + `recentTransactions`, sorted by date; withdrawals rendered with distinct icon/badge |
| Add-asset operations recorded in ticketing | Done | `TicketService.create_ticket` called in `add_asset_to_entity` with `ENTITY_ASSET_DEPOSIT` / `ENTITY_ASSET_WITHDRAWAL`, tags, `after_state` |
| Visible in /backoffice/logging | Done | No page changes needed; new tickets show in All Tickets and are searchable by `action_type` or tags |

---

## Issues found

### Critical

None.

### Major

None.

### Minor

1. **Backend: asset transaction limit vs plan (20 vs 50)**  
   - **Where:** `backend/app/api/v1/backoffice.py` – `get_entity_assets` uses `.limit(20)` for recent transactions.  
   - **Plan:** “Limitare la N itemi (ex. 50)”.  
   - **Impact:** Merged history is capped at 50 on the frontend, but asset transactions are limited to 20. For entities with many add-asset operations, the last 30 asset tx are never shown.  
   - **Recommendation:** Consider increasing the limit to 50 (or a shared constant) so the unified list can show up to 50 asset tx when combined with wire deposits.

2. **Frontend: local `formatCurrency` shadows utils**  
   - **Where:** `frontend/src/components/users/UserDetailModal.tsx` – local `formatCurrency(amount, currency)` (lines 90–93) shadows the import from `../../utils` (line 23).  
   - **Impact:** Deposit History uses the local implementation (symbol + `toLocaleString`) instead of the shared `utils.formatCurrency` (Intl.NumberFormat).  
   - **Recommendation:** Remove the local helper and use `formatCurrency` from `../../utils` for consistency and design-system alignment. The utils version already supports currency and optional locale.

3. **Wire deposit `createdAt` format**  
   - **Where:** Backend returns `created_at` as ISO string with `+ "Z"`; frontend uses `formatRelativeTime(item.createdAt)`.  
   - **Status:** Correct. No change needed; noted for completeness.

---

## Data alignment

- **Backend → Frontend:** API responses use snake_case; axios response interceptor converts to camelCase. `recent_transactions` → `recentTransactions`, `created_at` → `createdAt`, `transaction_type` → `transactionType`, `asset_type` → `assetType`. Frontend uses camelCase consistently; no mismatch found.
- **Wire deposits:** `getDeposits({ entity_id })` returns the list from `get_all_deposits`; keys are transformed to camelCase. Mapping in `loadDeposits` (e.g. `d.createdAt`, `d.wireReference`, `d.notes`) matches.
- **Asset transactions:** Withdrawal amounts are stored as negative in the backend; frontend uses `isWithdrawal ? -Math.abs(item.amount) : item.amount` and `Math.abs(item.amount)` for display, so display is correct regardless of sign.

---

## app_truth.md and backend behaviour

- Add-asset (deposit/withdraw) and ticketing are consistent with the described behaviour.  
- Admin-only access via `get_admin_user` is used for `add_asset_to_entity` and related endpoints.  
- No conflicts with §8 (Add Asset, deposits) or other referenced sections.

---

## Error handling and edge cases

- **loadDeposits:** Validates `entityId` (empty/invalid), handles missing or invalid `assetsResponse`, normalizes errors (403, 404, network), and clears state on failure.  
- **DepositsTab:** Handles no entity, `depositsError`, and loading; empty history shows an explicit empty state.  
- **Backend add_asset_to_entity:** Entity existence, sufficient balance for withdrawals, and commit/rollback behaviour are in line with existing patterns.

---

## Security and practices

- Add-asset and entity endpoints are admin-only.  
- Ticket stores `user_id` (admin) and `entity_id` (AssetTransaction); no sensitive data in `after_state` beyond operation summary.  
- No obvious over-engineering; new state and props are scoped to the feature.

---

## Testing

- No new unit or integration tests were found for:
  - Unified deposit/withdrawal list construction and sorting in `loadDeposits`.
  - Ticket creation in `add_asset_to_entity` (e.g. correct `action_type`, tags, `after_state`).
- **Recommendation:** Add tests for:
  1. Frontend: building and sorting `depositAndWithdrawalHistory` (wire + asset, date desc, cap 50).  
  2. Backend: one test that after a successful add-asset (deposit and withdrawal) a ticket exists with the expected `action_type`, `entity_type`, and tags.

---

## UI/UX and design system

### Compliance with interface.md and design system

- **Tokens:** Deposit History uses Tailwind tokens: `navy-*`, `emerald-*`, `red-*`, `amber-*` for text, backgrounds, and icons. No hard-coded hex or `slate-*`/`gray-*` in the changed sections.
- **Theme:** Uses `dark:` variants (e.g. `text-navy-900 dark:text-white`, `bg-navy-50 dark:bg-navy-700/50`), so light/dark is supported.
- **Badges:** Wire status uses `Badge variant={success|danger|warning}`; asset tx use `variant={isWithdrawal ? 'danger' : 'success'}`. Aligned with design system and trading semantics (red = withdrawal/sell).
- **Icons:** DollarSign for deposits, Minus for withdrawals, with appropriate colors; consistent with “Red = sell/negative” in DESIGN_SYSTEM.md.
- **Empty and loading:** Loading spinner and “No deposits or withdrawals recorded” with icon are present; error state shows message and Retry.

### Recommendations

- Prefer the shared `formatCurrency` from `utils` in this modal (see Minor issue #2) so all currency formatting stays consistent and uses the same token/format rules.  
- No further design-system or accessibility issues identified for this feature.

---

## Recommendations summary

1. **Optional:** In `get_entity_assets`, increase recent-transactions limit from 20 to 50 (or a constant) to align with the plan and frontend cap.  
   → **Done:** Limit increased to 50 via `RECENT_ASSET_TRANSACTIONS_LIMIT` in `backoffice.py`.
2. **Recommended:** In `UserDetailModal`, remove the local `formatCurrency` and use the one from `../../utils` for Deposit History.  
   → **Done:** Local helper removed; modal uses `formatCurrency` from `../../utils`.
3. **Recommended:** Add tests for the unified history logic and for add-asset ticket creation as above.  
   → **Done:** `frontend/src/utils/depositHistory.ts` + `frontend/src/utils/__tests__/depositHistory.test.ts` (merge/sort/cap); `backend/tests/test_backoffice_add_asset_ticket.py` (deposit and withdrawal ticket creation).

---

## Conclusion

The feature is correctly implemented and ready for production from a functional and design-system perspective. The items above are minor or optional and can be addressed in a follow-up if desired.
