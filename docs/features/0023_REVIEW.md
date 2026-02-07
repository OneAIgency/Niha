# 0023 – Code Review: AML Users Cash (EUR) Card “UNDER AML APPROVAL” and Yellow Background

## Plan reference

- **Plan:** [0023_PLAN.md](./0023_PLAN.md) – For users with role AML, Cash (EUR) card shows “UNDER AML APPROVAL” in the secondary line and a yellow/amber background at 50% opacity.

## Summary

Implementation is **complete** and correct. The changes are minimal, focused, and aligned with the plan. The Cash (EUR) card in `DashboardPage.tsx` correctly applies conditional styling and copy when `user?.role === 'AML'`. Design tokens are used (amber-500); no hard-coded colors. No new API or backend changes; existing `entityBalance`, `portfolio`, and `useAuthStore().user.role` are used.

---

## Plan implementation confirmation

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| Card wrapper: yellow/amber 50% opacity when AML | Done | `bg-amber-500/50 dark:bg-amber-400/50` on Cash (EUR) card wrapper (line 686) |
| Secondary line: “UNDER AML APPROVAL” visible | Done | Shown in same `div.text-xs.text-navy-500.mt-2...` (lines 708–720) |
| Optional “Total deposited: €X” in same block | Done | “Total deposited: €X · UNDER AML APPROVAL” when `totalDeposited > 0`; “UNDER AML APPROVAL” only when no deposit |
| User source: `user?.role === 'AML'` | Done | `isAmlUser = user?.role === 'AML'` (line 220) |
| No new API/backend | N/A | Uses existing entityBalance, portfolio, auth store |
| No changes to other cards or frozen files | Done | Only Cash (EUR) card modified |

---

## Code review findings

### Critical

- None.

### Major

- None.

### Minor (fixed)

1. ~~**No unit test for AML card state**~~ — The plan does not require new tests; `docs/commands/code_review.md` recommends proper testing coverage. Consider adding a snapshot or shallow render test for the Cash (EUR) card when `user.role === 'AML'` to lock in the “UNDER AML APPROVAL” text and `bg-amber-500/50` class. Low priority given the small, conditional UI change.

2. **Dark mode contrast** — The plan does not specify dark mode. `bg-amber-500/50` overlays the existing card background. The design system uses `amber-400` for dark mode in some contexts (e.g. CEA text). If contrast issues appear in dark mode, consider `bg-amber-400/50` or a dark-mode-specific token. No change needed unless QA finds readability issues.

---

## Implementation details verified

### 1. DashboardPage.tsx (lines 220, 681–724)

- **isAmlUser** (line 220): `const isAmlUser = user?.role === 'AML';` ✓
- **Card wrapper** (line 686): `className={...${isAmlUser ? 'bg-amber-500/50 dark:bg-amber-400/50' : ''}}` ✓
- **Secondary line condition** (line 708): `(isAmlUser || (entityBalance?.totalDeposited && entityBalance.totalDeposited > 0))` — shows line for AML (even without deposits) or when totalDeposited > 0 ✓
- **AML secondary content** (lines 710–717): When AML, shows “Total deposited: €X · ” (if `totalDeposited > 0`) then “UNDER AML APPROVAL” ✓
- **Non-AML secondary content** (lines 718–719): “Total deposited: {formatCurrency(...)}” ✓

### 2. Data alignment

- `user.role` from `useAuthStore()`; API normalizes to camelCase ✓
- `entityBalance` and `portfolio` from existing fetches ✓
- No snake_case/camelCase issues ✓

### 3. app_truth.md

- AML is a valid role; DashboardRoute allows AML ✓
- User role is SSOT ✓

---

## UI/UX and design system

### Design token usage

- **Background:** `bg-amber-500/50` — Tailwind amber palette; design system uses amber for CEA and SETTLING states ✓
- **Text:** `text-navy-500` for secondary line; `text-white` for main value ✓
- No hard-coded hex/RGB; no `slate-*` or `gray-*` ✓

### Interface compliance (`docs/commands/interface.md`)

- Uses design tokens ✓
- No new form inputs; no focus ring changes ✓
- Component is presentational; no new interactive elements requiring ARIA ✓
- Responsive: card layout unchanged ✓
- Loading/error/empty: `loadingBalance` shows Skeleton; AML logic applies after load ✓

### Design system integration (`frontend/docs/DESIGN_SYSTEM.md`)

- Amber is used for CEA and warning/attention states ✓
- Card uses existing `dashboard-summary-card` pattern ✓

---

## Security and error handling

- No new API calls; no new data exposure ✓
- Role check uses `user?.role`; null-safe ✓
- Edge case: AML with no `entityBalance` — secondary line still shows “UNDER AML APPROVAL” ✓

---

## Recommendations (implemented)

1. ~~**Add a test for the AML card state**~~ — Done. `frontend/src/pages/__tests__/DashboardPage.test.tsx` added with 3 tests.
2. ~~**Dark mode contrast**~~ — Done. `dark:bg-amber-400/50` added for dark mode when AML.
3. No `app_truth.md` update required; AML role and dashboard access are already documented.

---

## Conclusion

The 0023 plan is fully implemented. All review recommendations have been applied. The Cash (EUR) card shows “UNDER AML APPROVAL” and a yellow/amber background (with dark mode variant) when `user?.role === 'AML'`, using design tokens and existing data. Unit tests cover the AML card state.
