# Code Review: Feature 0039 + Dashboard + Add Asset Analysis

Review of all changes from this session.

---

## 1. Feature 0039: Resizable panels (Cash Market Pro)

### Plan vs Implementation

| Plan item | Status |
|-----------|--------|
| react-resizable-panels dependency | ✅ |
| useLayoutStorage hook | ✅ |
| ResizablePanelGroup component | ✅ |
| CashMarketProPage integration | ✅ |
| Row 1: Order Book \| Chart \| Order Form | ✅ |
| Row 2: Activity \| News \| Impact | ✅ |
| Mobile (<768px): static grid | ✅ |
| localStorage keys niha_layout_* | ✅ |
| Default sizes Row1 [41.67, 33.33, 25], Row2 [33.33, 33.33, 33.34] | ✅ |
| DESIGN_SYSTEM.md update | ✅ |
| app_truth.md update | ✅ |
| **Vertical resize** (extension) | ✅ Added outer vertical ResizablePanelGroup |

### Files Reviewed

| File | Purpose |
|------|---------|
| `frontend/src/components/common/ResizablePanelGroup.tsx` | Wrapper for react-resizable-panels |
| `frontend/src/hooks/useLayoutStorage.ts` | localStorage persistence |
| `frontend/src/hooks/useMediaQuery.ts` | md breakpoint check |
| `frontend/src/pages/CashMarketProPage.tsx` | Integration |

### Issues

#### Critical
- None

#### Major
- ~~**ResizablePanelGroup — defaultSizes fallback**~~: Fixed with `defaultSizes[i] ?? fallbackSize`.

#### Minor
- **useLayoutStorage — createLayoutStorage on every render**: Called inside ResizablePanelGroup; storage object is recreated each render. Consider `useMemo` with storageKey dependency.
- **Tailwind `data-[separator]:*`**: Library may not set `data-separator`; classes may be cosmetic only.
- **useMediaQuery hydration**: Initial `matches` may be false on SSR/hydration; brief mobile→desktop flash on load.

### UI/UX and Design System

- **Colors**: navy-700, navy-600 for handles — compliant (no slate/gray).
- **Cursors**: col-resize / row-resize per orientation.
- **Min size**: 15% horizontal panels, 20% vertical row ratio.
- **Accessibility**: Library provides `role="separator"` and `aria-orientation`.
- **Responsive**: Resizable only on md+ (768px); mobile uses static grid.

---

## 2. Dashboard: Removed Price Alerts and Exchange Rate

### Summary

Price Alerts and EUR/CNY Exchange Rate panels were removed from DashboardPage.

### Changes

| File | Change |
|------|--------|
| `frontend/src/pages/DashboardPage.tsx` | Removed PriceAlerts, ExchangeRateCard imports and usage |

### Issues

#### Critical
- None

#### Major
- **Orphaned components**: `PriceAlerts.tsx` and `ExchangeRateCard.tsx` remain in `frontend/src/components/dashboard/` but are no longer used. Either delete them or reintroduce them; otherwise they add dead code.

#### Minor
- **Documentation**: If these panels are intentionally removed long-term, app_truth.md and DESIGN_SYSTEM.md should be updated to match (if they reference these panels).

---

## 3. Add Asset Modal (Analysis — No Code Changes)

### Context

User showed a screenshot with:
- Current balance: €1,300.00
- Amount entered: 1,300,000
- Warning: "Insufficient balance to withdraw this amount"
- Withdraw button correctly disabled

### Findings

1. **Logic**: Correct. Validation, preview, and Withdraw disable behave as expected.
2. **UX gap**: No "Max" button to fill the full balance. WithdrawalRequestModal has one; AddAssetModal does not.
3. **Recommendation**: Add a "Max" button next to the Amount field that sets the value to the current balance, to reduce input errors and align with WithdrawalRequestModal.

---

## 4. Recommendations Summary

1. **Feature 0039**: Consider memoizing `createLayoutStorage(storageKey)` in ResizablePanelGroup.
2. **Dashboard**: Remove `PriceAlerts.tsx` and `ExchangeRateCard.tsx` if they are permanently retired, or document why they remain.
3. **Add Asset Modal**: Add a "Max" button for the Amount field (same pattern as WithdrawalRequestModal).

---

## 5. Confirmation

- Feature 0039 was implemented per plan (with vertical resize extension).
- Dashboard removal of Price Alerts and Exchange Rate was straightforward.
- Add Asset Modal was analyzed only; no code changes were made.
