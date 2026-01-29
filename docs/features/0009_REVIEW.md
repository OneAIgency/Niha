# Code Review: 0009 – PENDING user access only to onboarding

## Summary of implementation quality

The feature is **correctly implemented** and matches the plan. Changes are limited to `frontend/src/App.tsx`: `AuthGuard` was extended with `blockRoles` and `redirectWhenBlocked`, and `ProtectedRoute`, `DashboardRoute`, and `OnboardingRoute` were updated accordingly. No UI or design-system changes were introduced; routing guards only. Code is consistent with existing patterns and stays within a single decision point (AuthGuard) for redirects.

---

## Plan implementation confirmation

| Plan item | Status | Notes |
|-----------|--------|--------|
| AuthGuard: optional `blockRoles?: UserRole[]` and `redirectWhenBlocked?: string` (default `/onboarding`) | Done | Implemented; order is auth → allowedRoles → blockRoles. |
| AuthGuard: after requireAuth and allowedRoles, if blockRoles present and user.role in blockRoles → redirect to redirectWhenBlocked | Done | Lines 127–130. |
| ProtectedRoute: AuthGuard with `blockRoles={['PENDING']}`, `redirectWhenBlocked="/onboarding"` | Done | Lines 152–158. |
| DashboardRoute: same blockRoles and redirect | Done | Lines 230–236. |
| OnboardingRoute: replace “allow all” with AuthGuard `requireAuth={true}`, no blockRoles | Done | Lines 192–198. |
| redirect.ts: no changes | N/A | Correct; `getPostLoginRedirect` already sends PENDING to `/onboarding`. |
| Backend onboarding API: no changes | N/A | Correct; onboarding uses `get_current_user` without role restriction. |

**Verdict:** Plan is fully implemented.

---

## Issues found

### Critical

None.

### Major

None.

### Minor

1. **Double redirect when PENDING hits `/funding`**  
   - **Where:** `ApprovedRoute` uses `RoleProtectedRoute` with `allowedRoles={['APPROVED']}` and `redirectTo="/dashboard"`. For PENDING, AuthGuard redirects to `redirectTo` (i.e. `/dashboard`), then `DashboardRoute` redirects again to `/onboarding`.  
   - **Impact:** PENDING still ends on `/onboarding`; only an extra redirect hop.  
   - **Recommendation (optional):** Use role-based redirect for ApprovedRoute (e.g. pass a function or use `getPostLoginRedirect(user)` as redirect target) so non-APPROVED users, including PENDING, go to the correct destination in one hop. Not required for correctness.

2. **`/design-system` is public**  
   - **Where:** `App.tsx` line ~413: `<Route path="/design-system" element={<DesignSystemPage />} />` has no guard.  
   - **Impact:** PENDING can open `/design-system`. Plan listed blocked routes as `/profile`, `/dashboard`, `/funding`, `/cash-market`, `/settings`, `/users`, `/components`, backoffice; `/design-system` was not mentioned.  
   - **Recommendation:** If PENDING should not see design-system, wrap the route with the same guard as `/components` (e.g. ProtectedRoute with blockRoles). Otherwise document that `/design-system` is intentionally public (e.g. reference doc).

3. **Catch-all sends authenticated users to `/login`**  
   - **Where:** `App.tsx` catch-all: `<Route path="*" element={<Navigate to="/login" replace />} />`.  
   - **Impact:** Authenticated PENDING (or any role) hitting an unknown path (e.g. typo) are sent to `/login` instead of their home (e.g. `/onboarding` for PENDING).  
   - **Recommendation (optional):** Consider a small wrapper that, when the user is authenticated, redirects to `getPostLoginRedirect(user)` instead of `/login`. Out of scope for 0009 but improves UX.

---

## Recommendations

### Code and consistency

- **Single decision point:** Redirect logic for PENDING lives only in AuthGuard (and existing FundedRoute PENDING check); no extra logic in LoginPage or layout. Good.
- **Backend (optional):** Sensitive endpoints (e.g. deposits list, cash_market place_order) use `get_current_user` but do not explicitly reject PENDING. Frontend now prevents PENDING from reaching those pages, so the UI no longer calls those APIs for PENDING. For defense-in-depth, consider adding role checks (e.g. require APPROVED/FUNDED/ADMIN) on such endpoints. Plan marked this as optional.

### Testing

- **Gap:** There are no tests that assert PENDING is blocked from `/profile`, `/dashboard`, `/components` and redirected to `/onboarding`, or that onboarding routes require auth and allow PENDING.
- **Recommendation:** Add unit tests (e.g. with a mocked auth store and `MemoryRouter`) or integration tests that:
  - As PENDING: access to `/onboarding`, `/onboarding/market-overview`, `/learn-more` succeeds; access to `/profile`, `/dashboard`, `/components` redirects to `/onboarding`.
  - Unauthenticated: access to `/onboarding` redirects to `/login`.
  - Optionally: PENDING accessing `/funding` ends at `/onboarding` (one or two redirects).

---

## Error handling and edge cases

- **Hydration:** AuthGuard waits for `_hasHydrated` before deciding; no redirect loop from transient state.  
- **Order of checks:** Authentication → allowedRoles → blockRoles is correct and documented.  
- **Onboarding + requireAuth:** Unauthenticated users hitting any onboarding URL are correctly sent to `/login` with `state={{ from: location }}`.  
- **Setup-password:** Remains outside AuthGuard (public), matching the post-invitation password flow.  
- **Backoffice:** Still protected by AdminRoute; PENDING does not have ADMIN, so no change in access.

No security or best-practice violations identified; no over-engineering; style matches the rest of the codebase.

---

## UI/UX and interface analysis

This feature is **routing-only**. It does not add or change UI components, layout, or visual design.

- **Design system / Tailwind:** No new UI; no hard-coded colors, spacing, or typography.  
- **app_truth.md:** §8 (Frontend Routing) and §9 (UI/UX & Design System) do not require updates for 0009; plan stated “doar restricții de rutare.”  
- **Interface standards:** No new components; nothing to check against `docs/commands/interface.md` or design-token usage beyond the existing route wrappers.

No UI/UX or design-system issues.

---

## File and line references

| Topic | File | Lines |
|-------|------|--------|
| AuthGuard props and blockRoles logic | `frontend/src/App.tsx` | 90–104, 127–130 |
| ProtectedRoute | `frontend/src/App.tsx` | 152–158 |
| DashboardRoute | `frontend/src/App.tsx` | 230–236 |
| OnboardingRoute | `frontend/src/App.tsx` | 192–198 |
| ApprovedRoute (double-redirect note) | `frontend/src/App.tsx` | 199–205 |
| Design-system route (public) | `frontend/src/App.tsx` | ~413 |
| Catch-all redirect | `frontend/src/App.tsx` | ~424 |

---

## Conclusion

Implementation is **complete and correct**. PENDING users can access only onboarding (and public routes such as `/contact`, `/setup-password`); all other protected routes redirect them to `/onboarding`. The only follow-ups are optional: single-hop redirect from `/funding` for PENDING, clarifying or guarding `/design-system`, and adding tests and/or backend role checks for defense-in-depth.
