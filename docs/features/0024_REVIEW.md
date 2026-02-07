# 0024 – Admin role simulation (floating window) – Code Review

## Summary of implementation quality

**Update (post-implementation):** The feature has been implemented. State and helper live in `frontend/src/stores/useStore.ts` and `frontend/src/utils/effectiveRole.ts`; AuthGuard and CatchAllRedirect use effective role; `RoleSimulationFloater` is in `frontend/src/components/admin/` and is mounted in App; Header and Dashboard use effective role with backoffice/Settings gated by real ADMIN. Fixes and recommendations applied: (1) DashboardPage `entityBalance` null-safety in the Cash card else branch, (2) RoleSimulationFloater light/dark theme support (design tokens), (3) unit tests for `getEffectiveRole` and redirect role-only object, (4) minimal test for RoleSimulationFloater (visibility when ADMIN, hidden otherwise).

---

*Original review (pre-implementation) below.*

---

## Confirmation: plan not implemented

| Plan item | Expected | Current state |
|-----------|----------|---------------|
| **State** | `simulatedRole: UserRole \| null` in store (optional sessionStorage) | Not present in `frontend/src/stores/useStore.ts` |
| **Helper** | `getEffectiveRole(user, simulatedRole) => UserRole` | Not present in codebase |
| **AuthGuard** | Use effective role for REJECTED, allowedRoles, blockRoles, redirect | `App.tsx` uses `user.role` only; no effective role |
| **CatchAllRedirect** | Redirect using `getPostLoginRedirect` with effective role | Uses `getPostLoginRedirect(user)` with real user |
| **getPostLoginRedirect** | Accept object with role (or virtual user with effective role) | Accepts `User` only; no overload for effective role |
| **Floating window** | `RoleSimulationFloater.tsx` (or similar), only when `user?.role === 'ADMIN'` | No `frontend/src/components/admin/` or RoleSimulation* component |
| **App mount** | Floater as sibling to Routes, conditional on ADMIN | No floater in `App.tsx` |
| **Header** | Show effective role or “ADMIN (simulând: X)” | Uses `user?.role` only |
| **Dashboard** | Use effective role for AML card, funded sections | Uses `user?.role` |
| **Backoffice/Settings** | Keep `user.role === 'ADMIN'` (real role) | N/A until effective role exists |

---

## Issues (by severity)

### Critical

1. **No simulated role state**  
   **File:** `frontend/src/stores/useStore.ts`  
   **Plan:** Add `simulatedRole: UserRole | null` and setter; optional sessionStorage.  
   **Current:** Auth state has no `simulatedRole`; no way to persist or change simulated role.

2. **No effective role helper**  
   **Files:** Plan suggests `frontend/src/utils/` or store.  
   **Current:** No `getEffectiveRole(user, simulatedRole)`; every place still uses `user.role`.

3. **AuthGuard and CatchAllRedirect ignore simulation**  
   **File:** `frontend/src/App.tsx`  
   **Lines:** 109–159 (AuthGuard), 251–260 (CatchAllRedirect).  
   **Current:** Both use `user.role` and `getPostLoginRedirect(user)`. When implemented, they must compute `effectiveRole = getEffectiveRole(user, simulatedRole)` and use it for REJECTED check, allowedRoles, blockRoles, and redirect target; CatchAllRedirect must pass a virtual user with `role: effectiveRole` (or equivalent) to `getPostLoginRedirect`.

4. **No floating UI for role simulation**  
   **Plan:** New component (e.g. `frontend/src/components/admin/RoleSimulationFloater.tsx`), fixed bottom-right, z-index below modals, visible only when `user?.role === 'ADMIN'`, selector for all UserRole values + “Fără simulare”.  
   **Current:** No `admin/` folder under components; no such component; no mount in App.

### Major

5. **getPostLoginRedirect does not accept effective role**  
   **File:** `frontend/src/utils/redirect.ts`  
   **Current:** Signature `getPostLoginRedirect(user: User)`. Plan requires redirects to use effective role (e.g. admin simulating NDA → `/onboarding`). Either extend to accept `{ role: UserRole }` or ensure callers pass a virtual user with `role: effectiveRole`.

6. **Header and Dashboard use real role only**  
   **Files:**  
   - `frontend/src/components/layout/Header.tsx` (e.g. lines 33, 200)  
   - `frontend/src/pages/DashboardPage.tsx` (e.g. lines 220, 280, 321)  
   **Current:** Both use `user?.role`. For “view as role X”, they should use effective role (from `getEffectiveRole`) for display and page logic; backoffice/Settings should keep `user.role === 'ADMIN'`.

### Minor

7. **Backoffice/Settings access rule**  
   **Plan:** Redirects and page content (Dashboard, etc.) = effective role; backoffice routes and Settings = real ADMIN only.  
   **Current:** No implementation yet; when implementing, ensure backoffice and Settings guards use `user.role === 'ADMIN'` so simulation does not hide admin entry points.

8. **UserRole source for selector**  
   **Plan:** All values from `UserRole` in `frontend/src/types/index.ts` (ADMIN, MM, NDA, REJECTED, KYC, APPROVED, FUNDING, AML, CEA, CEA_SETTLE, SWAP, EUA_SETTLE, EUA) plus “Fără simulare”.  
   **Current:** No selector; when building the floater, derive options from the same type/enum and add clear option.

---

## Recommendations

1. **Implement per plan phases**  
   - Phase 1: Add `simulatedRole` to store (+ optional sessionStorage) and implement `getEffectiveRole(user, simulatedRole)` and export it.  
   - Phase 2: In AuthGuard and CatchAllRedirect, compute effective role and use it for all redirect and role checks; ensure `getPostLoginRedirect` is called with effective role (virtual user or extended API).  
   - Phase 3: Add RoleSimulationFloater (design tokens, navy/emerald, no slate/gray), mount in App as sibling to Routes, only when `user?.role === 'ADMIN'`.  
   - Phase 4: Replace `user.role` with effective role in Header and Dashboard (and any other “view as role” UI); keep `user.role === 'ADMIN'` for backoffice and Settings.

2. **Design system**  
   When implementing the floater, follow `docs/commands/interface.md` and `frontend/docs/DESIGN_SYSTEM.md`: use Tailwind tokens (navy-*, emerald-*), classes from `design-tokens.css`, no hard-coded colors; ensure focus/aria and theme (light/dark) support.

3. **Tests**  
   Add unit tests for `getEffectiveRole` and, if needed, redirect tests that verify simulated role drives redirect target; consider a minimal test for the floater (visibility when ADMIN, hidden otherwise).

---

## UI/UX and interface analysis (when implemented)

Until the feature exists, a full UI/UX review cannot be done. When the floater is implemented, the review should verify:

- **Design tokens:** No hex/slate/gray; use `design-tokens.css` and `tailwind.config.js` (navy, emerald, etc.).
- **Theme:** Works with light/dark (class on root).
- **Position/z-index:** Fixed bottom-right, below modals (e.g. below z-50).
- **Accessibility:** Focus management, aria-label on selector, keyboard use.
- **Responsiveness:** Usable on small viewports.
- **States:** Loading/error not required for a simple selector; empty state = “Fără simulare”.

---

## Conclusion

- **Plan implementation:** Implemented (see summary above).  
- **Recommendations applied:** Design system theme support on floater; unit tests for `getEffectiveRole`, redirect role-only, and RoleSimulationFloater visibility; DashboardPage null-safety for `entityBalance?.totalDeposited`.
