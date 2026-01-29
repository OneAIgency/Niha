# 0013 – Client status (user_role) unification – Code Review

**Scope:** Unify “client status” display across deposit UIs: single source of truth `user_role` (reporting user’s role); show FUNDING when client has submitted a transfer. Fix mismatch where card showed PENDING and table showed APPROVED.

**Reviewed:** Backend `deposit_to_response`, `GET /backoffice/deposits`, frontend `PendingDepositsTab`, `AMLDepositsTab`, `BackofficeDepositsPage`, types, and design-system compliance.

---

## 1. Summary of implementation quality

The feature is **correctly implemented**. Client status now uses `user_role` from the API everywhere (cards and table). When a user announces a deposit, the backend sets `user.role = FUNDING`; that value is returned as `user_role` and displayed consistently. The previous split (PENDING vs APPROVED from different sources) is removed.

**Strengths:**

- **Single source of truth:** `user_role` is added to both deposits API (`deposit_to_response`) and backoffice `GET /deposits`, and all UIs read it.
- **Backend:** Minimal, focused changes; `user_role` derived from `deposit.user` (or backoffice fallback to first entity user) and included in responses.
- **Frontend:** Same `user_role` used in PendingDepositsTab cards, AMLDepositsTab pending cards, and BackofficeDepositsPage “Client” column; variant logic (FUNDING→warning, APPROVED/AML→info) aligned.
- **Design system:** Uses Badge variants and navy token classes only; no hard-coded colors.

---

## 2. Issues found

### Critical

**None.** (A data-alignment risk with camelCase was addressed during review; see below.)

### Major

**None.**

### Minor

1. **`clientStatusVariant` duplicated** — **FIXED**  
   - **Files:** `frontend/src/components/backoffice/PendingDepositsTab.tsx`, `frontend/src/components/backoffice/AMLDepositsTab.tsx`.  
   - **Issue:** Same logic existed in both components; `BackofficeDepositsPage` inlined a variant check.  
   - **Fix:** Extracted `clientStatusVariant` to `frontend/src/utils/roleBadge.ts` and added `ClientStatusBadge` in `frontend/src/components/common/ClientStatusBadge.tsx`. All three consumers now use `ClientStatusBadge` (or the util).

2. **`GET /backoffice/deposits` N+1 pattern** — **FIXED**  
   - **File:** `backend/app/api/v1/backoffice.py`, `get_all_deposits`.  
   - **Issue:** Loop over deposits with 2–3 queries per item (entity, reporting user, optional fallback user).  
   - **Fix:** Use `selectinload(Deposit.entity)` and `selectinload(Deposit.user)` on the main query. Batch-fetch “first user per entity” for deposits without `user_id` via a single `User` query and build `fallback_user_by_entity`; use it in the loop. Eliminates N+1.

### Data alignment (fixed during review)

3. **camelCase vs snake_case for `user_role`**  
   - **Context:** Axios response interceptor converts API keys to camelCase (`user_role` → `userRole`).  
   - **Issue:** `BackofficeDepositsPage` and `AMLDepositsTab` only read `user_role`; they would see `undefined` when the API returns camelCase.  
   - **Fix applied:**  
     - BackofficeDepositsPage: `clientRole = d.user_role ?? d.userRole` in the table map; local `Deposit` interface includes `userRole`.  
     - AMLDepositsTab: `deposit.user_role ?? deposit.userRole` for badge; `Deposit` type includes `userRole`.  
     - BackofficeOnboardingPage already mapped `user_role ?? userRole` into `PendingDeposit`; no change.  
   - **Recommendation:** Keep supporting both `user_role` and `userRole` wherever deposit data is consumed, or normalize at an API-client layer so UI consistently uses one shape.

---

## 3. Plan compliance

| Requirement | Status |
|-------------|--------|
| Client status from single source (`user_role`) | Met |
| Card and table show same value | Met |
| FUNDING when client has submitted transfer | Met (backend sets role on announce; API returns it) |
| No PENDING/APPROVED mismatch from different sources | Met |

The reported behaviour is **fully addressed**.

---

## 4. Error handling and edge cases

- **Missing user / direct-created deposit:** `user_role` is optional; UI shows `—` when absent. Backend leaves it `None` when there is no reporting user (and no fallback). Behaviour is correct.
- **Deposits API:** Reuses existing `deposit_to_response` and loading; no new failure modes. `User.role` is an enum; `.value` is used safely.
- **Backoffice `get_all_deposits`:** Same optional `user_role` handling; fallback to first entity user when no `dep.user_id`.

---

## 5. Security and practices

- Deposit and backoffice endpoints remain admin- or permission-protected as before. No new auth changes.
- No new secrets or PII; `user_role` is non-sensitive.

---

## 6. UI/UX and design system compliance

**Reference files:** `docs/commands/interface.md`, `app_truth.md` §9, `frontend/docs/DESIGN_SYSTEM.md`, `design-tokens.css`, `tailwind.config.js`, `.cursor/rules/niha-core.mdc`.

- **Tokens:** Badge uses `default`, `warning`, `info` variants. Layout uses `navy-*`, `text-navy-*`, etc. No `slate-*`/`gray-*`, no hex/RGB.
- **Theme:** Existing `dark:` usage and tokens unchanged; light/dark behaviour preserved.
- **Components:** Reuses `Badge`, `Card`, `Button`; structure consistent with existing backoffice deposit UIs.
- **Accessibility:** Badges are presentational; no new focusable elements. Table and cards keep prior structure; no regressions identified.
- **Loading / empty:** Unchanged; skeletons and empty states still apply.

**Verdict:** Implementation aligns with the design system and interface rules.

---

## 7. Recommendations

1. ~~Extract `clientStatusVariant` (and optionally a small `ClientStatusBadge` wrapper) for reuse.~~ **Done.**
2. ~~Refactor `get_all_deposits` to avoid N+1 queries (e.g. `selectinload` + single query).~~ **Done.**
3. Consider normalizing deposit API response shape (snake_case vs camelCase) in one place so consumers do not need to handle both `user_role` and `userRole`.

---

## 8. Testing

- **Backend:** No new tests added (no pytest test infra in repo). `deposit_to_response` and backoffice deposits could be covered by unit tests for `user_role` presence and fallbacks.
- **Frontend:** Added `frontend/src/utils/__tests__/roleBadge.test.ts` (clientStatusVariant) and `frontend/src/components/__tests__/ClientStatusBadge.test.tsx` (renders role, "—" when missing, variant styling, className). Both pass.

---

## 9. Files touched

| Area | Files |
|------|--------|
| Backend | `app/api/v1/deposits.py`, `app/api/v1/backoffice.py` |
| Frontend | `utils/roleBadge.ts`, `utils/index.ts`, `components/common/ClientStatusBadge.tsx`, `components/common/index.ts`, `components/backoffice/PendingDepositsTab.tsx`, `components/backoffice/AMLDepositsTab.tsx`, `pages/BackofficeDepositsPage.tsx`, `pages/BackofficeOnboardingPage.tsx`, `types/index.ts`, `types/backoffice.ts` |
| Tests | `utils/__tests__/roleBadge.test.ts`, `components/__tests__/ClientStatusBadge.test.tsx` |
