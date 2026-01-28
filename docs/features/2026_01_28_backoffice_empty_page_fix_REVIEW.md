# Code Review: Backoffice Empty Page Fix

**Scope:** Fix for backoffice blank page (black screen) and runtime error `Cannot read properties of undefined (reading 'toISOString')`.  
**Files changed:** `frontend/src/App.tsx`, `frontend/src/utils/index.ts`  
**Review date:** 2026-01-28

---

## 1. Summary of Implementation Quality

The fix addresses two issues: (1) backoffice routes rendering a blank/black page, and (2) a crash when `formatRelativeTime` was called with an undefined date (e.g. missing `created_at` from API). Implementation is focused and consistent with the codebase: routing change isolates backoffice from the main Layout, the error boundary uses design tokens, and the util is defensive without changing call sites. Quality: **good** for a targeted bugfix.

---

## 2. Implementation Confirmation (No Formal Plan)

There was no attached plan document; the work was a bugfix driven by browser verification and the surfaced error message. The following was implemented:

| Change | Location | Status |
|--------|----------|--------|
| Backoffice routes moved outside main `Layout` | App.tsx | Done – backoffice routes are siblings of `<Route element={<Layout />}>`, not children |
| Error boundary for backoffice routes | App.tsx | Done – `BackofficeErrorBoundary` wraps each backoffice page |
| `formatRelativeTime` handles null/undefined | utils/index.ts | Done – `if (date == null) return '—';` and type extended to `null \| undefined` |

---

## 3. Issues Found

### Critical
- **None.**

### Major
- **None.**

### Minor

1. **App.tsx – Error boundary has no `componentDidCatch`**
   - **Issue:** Only `getDerivedStateFromError` is implemented. Errors are shown in UI but not logged (e.g. to console or monitoring).
   - **Recommendation:** Add `componentDidCatch(error, errorInfo)` and log `error` and `errorInfo.componentStack` for debugging and monitoring.

2. **utils/index.ts – No unit test for `formatRelativeTime` null/undefined**
   - **Issue:** The new guard (`date == null` → `'—'`) is not covered by tests. Other callers (ContactRequestsTab, PendingDepositsTab, AMLDepositsTab, etc.) could still pass undefined if types are widened elsewhere.
   - **Recommendation:** Add tests in `frontend/src/utils/__tests__/` (e.g. `formatRelativeTime.test.ts`) for `formatRelativeTime(null)` and `formatRelativeTime(undefined)` returning `'—'`.

3. **Backoffice UX – No explicit “Back to site” from backoffice**
   - **Issue:** Backoffice routes no longer render the main site Header (Dashboard, Cash Market, Swap Center). Users in backoffice only see BackofficeLayout’s subheader and nav. To return to the rest of the app they must use browser back or type a URL.
   - **Recommendation:** Optional improvement: add a “Back to site” or “Dashboard” link in `BackofficeLayout` (e.g. in the subheader) for clearer navigation. Not blocking for this fix.

---

## 4. Checks Performed

| Criterion | Result |
|-----------|--------|
| Bug correctly fixed (blank page + toISOString) | Yes |
| Obvious bugs introduced | None |
| Data alignment (snake_case / camelCase, nested objects) | N/A (no API contract change) |
| app_truth.md / project specs | Respected (stack, standards unchanged) |
| Over-engineering / file size | No – changes are minimal |
| Syntax / style vs rest of codebase | Matches (class component for error boundary, same route pattern) |
| Error handling and edge cases | formatRelativeTime null/undefined handled; error boundary catches render errors |
| Security / best practices | No issues; error boundary does not expose sensitive data |
| Testing | No new tests; recommendation: add test for formatRelativeTime null/undefined |

---

## 5. UI/UX and Design System

- **Error boundary UI:** Uses Tailwind design tokens only: `bg-navy-950`, `bg-navy-800`, `border-navy-700`, `text-red-400`, `text-navy-300`, `text-white`. No hard-coded hex. Compliant with project design system.
- **formatRelativeTime:** Returns the character `'—'` (em dash) for null/undefined; no UI component change. Callers that already pass optional dates now behave safely.
- **Backoffice layout:** Backoffice pages use only `BackofficeLayout` (no main Layout). No new UI components; existing BackofficeLayout and tokens are used.

---

## 6. Recommendations

1. **Add error logging:** Implement `componentDidCatch` in `BackofficeErrorBoundary` and log `error` and `errorInfo.componentStack` (e.g. via existing `logger` or monitoring).
2. **Add unit test:** Cover `formatRelativeTime(null)` and `formatRelativeTime(undefined)` returning `'—'`.
3. **Optional:** Consider a “Back to site” / “Dashboard” link in BackofficeLayout for users who enter backoffice directly.

---

## 7. Conclusion

The backoffice empty page and `toISOString` crash are addressed with minimal, targeted changes. The implementation is consistent with the codebase and design system. No critical or major issues; minor improvements (logging, test, optional nav link) are recommended but not required for merge.
