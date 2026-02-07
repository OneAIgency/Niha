# 0022 – Code Review: AML Users Header Shows DASHBOARD Instead of FUNDING

## Plan reference

- **Plan:** [0022_PLAN.md](./0022_PLAN.md) – For users with role AML, header nav shows DASHBOARD instead of FUNDING; post-login redirect sends AML users to /dashboard.

## Summary

Implementation is **complete** and correct. The changes are minimal, focused, and aligned with the plan. All four modified files implement the intended behavior. One documentation update is recommended (`app_truth.md`). Redirect tests pass (19/19).

---

## Plan implementation confirmation

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| Header nav: AML sees DASHBOARD, not FUNDING | Done | `canDashboard` includes `'AML'`; `canFunding` excludes `'AML'` in `Header.tsx` |
| Post-login redirect: AML → /dashboard | Done | `redirect.ts` handles AML before APPROVED/FUNDING check |
| Dashboard route: allow AML | Done | `DashboardRoute` `allowedRoles` includes `'AML'` in `App.tsx` |
| ApprovedRoute: AML no access to /funding | Done | `ApprovedRoute` `allowedRoles` does NOT include `'AML'` |
| Tests: redirect.test.ts | Done | `it('sends AML users to /dashboard', ...)` added and passes |

---

## Code review findings

### Critical

- None.

### Major (fixed)

- ~~**app_truth.md §8 out of date**~~ — Fixed. `app_truth.md` §8 now documents `DashboardRoute` with `['AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']` and `ApprovedRoute` with `['APPROVED', 'FUNDING', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']` (AML excluded).

### Minor (fixed)

- ~~**redirect.test.ts – makeUser uses snake_case**~~ — Fixed. `makeUser` now uses camelCase (`firstName`, `lastName`, `entityId`) to match the `User` interface.

---

## Implementation details verified

### 1. Header.tsx (lines 81–83)

- `canDashboard = ['AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'MM']` ✓
- `canFunding = ['APPROVED', 'FUNDING', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'MM']` — AML excluded ✓
- Links built from these flags; AML sees Dashboard, not Funding ✓

### 2. redirect.ts (lines 30–34)

- AML handled before APPROVED/FUNDING: `if (user.role === 'AML') return '/dashboard';` ✓
- Order of checks matches role flow ✓

### 3. App.tsx

- **DashboardRoute** (line 246): `allowedRoles={['AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']}` ✓
- **ApprovedRoute** (line 222): `allowedRoles={['APPROVED', 'FUNDING', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']}` — AML excluded ✓

### 4. redirect.test.ts

- AML test: `expect(getPostLoginRedirect(makeUser({ role: 'AML' }))).toBe('/dashboard')` ✓
- All 19 redirect tests pass ✓

---

## Data alignment

- `user.role` is the only field used for redirect logic; no snake_case vs camelCase issues in this flow.
- Auth store and API normalization (snake_case → camelCase) supply `user` in the expected shape for `getPostLoginRedirect`.

---

## Security and error handling

- Role checks remain in place; no new exposure.
- Edge cases (REJECTED, NDA, KYC, etc.) unchanged and correctly handled.

---

## UI/UX and design system

This feature does not introduce new UI components. It adjusts:

- Header link visibility (role-based flags)
- Post-login redirect target
- Route access for AML

`Header.tsx` continues to use design tokens (`navy-*`, `emerald-*`, etc.) and existing patterns. No design system changes required.

---

## Test coverage

- `redirect.test.ts`: AML redirect covered.
- Redirect tests: 19/19 pass.
- Other failing tests in the suite (e.g. `sanitize.test.ts`) are unrelated to this feature.

---

## Recommendations (implemented)

1. ~~**Update app_truth.md §8**~~ — Done. `app_truth.md` §8 now reflects current `DashboardRoute` and `ApprovedRoute` `allowedRoles`.
2. ~~**Align `makeUser` in `redirect.test.ts` with the `User` type**~~ — Done. `makeUser` now uses camelCase (`firstName`, `lastName`, `entityId`) to match the `User` interface.

---

## Conclusion

The 0022 plan is fully implemented. All review findings have been addressed.
