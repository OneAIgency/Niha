# 0010 – Code Review: User Status Evolution (NDA → EUA)

**Plan:** `docs/features/0010_PLAN.md`  
**Review date:** 2026-01-29  
**Fixes applied:** 2026-01-29 (all issues and recommendations implemented)

---

## 1. Summary of Implementation Quality

The 0010 feature (full onboarding flow from NDA to EUA) is **implemented and aligned with the plan**. Data model (enums, migrations), security dependencies (`get_approved_user`, `get_funded_user`), NDA approve/reject, KYC approve/reject, funding/AML role transitions, and automated transitions (CEA→CEA_SETTLE, CEA_SETTLE→SWAP, SWAP→EUA_SETTLE, EUA_SETTLE→EUA) are in place. Frontend routing, redirects, role-based nav, and swap restriction (SWAP+) match the plan. All review issues (C1, M1–M3, m1–m3) have been addressed; see **Fixes applied** below.

---

## 2. Plan vs Implementation Checklist

| Plan section | Status | Notes |
|--------------|--------|-------|
| **1.1 Enum unificat** | ✅ | `UserRole` and `ContactStatus` in models/schemas; values match plan. |
| **1.2 Migrație DB** | ✅ | `2026_01_29_user_contact_status_full_flow` extends enums; maps existing data. |
| **2.1 Reject NDA** | ✅ | `PUT /admin/contact-requests/{id}` + `status: REJECTED`; linked user → REJECTED. |
| **2.2 Approve NDA → KYC** | ✅ | Create user with `role=KYC`, contact `status=KYC`; credentials manual/invitation. |
| **3.1 KYC form** | ✅ | Onboarding flow; user stays KYC until backoffice approve/reject. |
| **3.2 Approve / Reject KYC** | ✅ | `approve_user` (KYC→APPROVED), `reject_user` (→REJECTED); entity KYC updated. |
| **4.1 Funding access, announce, →FUNDING** | ✅ | `get_approved_user`; announce_deposit; APPROVED→FUNDING on first announce. |
| **4.2 Confirm transfer → AML** | ✅ | `deposit_service.confirm_deposit`; FUNDING→AML. |
| **5. AML clear → CEA; reject → REJECTED** | ✅ | `clear_deposit` (AML→CEA); `reject_deposit` (FUNDING/AML→REJECTED). |
| **6. CEA access, „tot banii” → CEA_SETTLE** | ✅ | `get_funded_user`; `role_transitions.transition_cea_to_cea_settle_if_eur_zero` on CEA buy. |
| **7. CEA_SETTLE → SWAP** | ✅ | When all CEA_PURCHASE batches SETTLED; in `settlement_service` on status update. |
| **8. SWAP access, 0 CEA → EUA_SETTLE** | ✅ | `transition_swap_to_eua_settle_if_cea_zero` when swap batch SETTLED. |
| **9. EUA_SETTLE → EUA** | ✅ | When all SWAP_CEA_TO_EUA batches SETTLED; same settlement update path. |
| **10. EUA** | ✅ | `get_funded_user` includes EUA; full access. |
| **11. Redirect, AuthGuard, routes** | ✅ | `getPostLoginRedirect`, OnboardingRoute, ApprovedRoute, FundedRoute, DashboardRoute, SwapRoute. |
| **11. Header nav** | ✅ | Funding / Cash Market / Swap / Dashboard by role. |
| **12. Backoffice filters, acțiuni** | ✅ | Contact requests (NDA/REJECTED/KYC); users by role; KYC approve/reject; deposits confirm/clear/reject. |

---

## 3. Issues by Severity

### Critical

- **C1. Swaps API has no auth (SWAP+ required per plan)**  
  **Files:** `backend/app/api/v1/swaps.py`  
  **Details:** Endpoints (`/swaps/available`, `/swaps/rate`, `/swaps/my`, etc.) do not use `get_funded_user` or any role check. Plan §8: swap access for `SWAP` (and beyond) and ADMIN only. Frontend restricts `/swap` to SWAP+ via `RoleProtectedRoute`, but the API is open.  
  **Recommendation:** Add a swap-specific dependency allowing only SWAP, EUA_SETTLE, EUA, and ADMIN (plan §8, §11). Do not use `get_funded_user`, which also allows CEA and CEA_SETTLE.

### Major

- **M1. Onboarding API allows any authenticated user**  
  **Files:** `backend/app/api/v1/onboarding.py`  
  **Details:** Endpoints use `get_current_user` only. Plan §3: onboarding (KYC form) for KYC and NDA. Frontend uses `OnboardingRoute` (NDA, KYC), but the API does not enforce it.  
  **Recommendation:** Use a dependency that permits only NDA and KYC (and optionally ADMIN) for onboarding routes, and reject others with 403.

- **M2. Backoffice `confirm_pending_deposit` does not perform FUNDING→AML**  
  **Files:** `backend/app/api/v1/backoffice.py` (`confirm_pending_deposit`, ~lines 615–678)  
  **Details:** This endpoint confirms a pending deposit, updates entity balance, and sends emails, but contains a “Role transitions defined later” placeholder and does not transition FUNDING→AML. The **deposits** router (`POST /deposits/{id}/confirm` → `deposit_service.confirm_deposit`) does implement FUNDING→AML.  
  **Note:** `BackofficeDepositsPage` uses `/api/v1/deposits/` (pending, confirm, clear), i.e. the deposits API and `deposit_service`, so the **UI**-driven confirm flow is correct. The backoffice `PUT /backoffice/deposits/{id}/confirm` path remains inconsistent with the plan if ever used for the same workflow.  
  **Recommendation:** Either (a) implement FUNDING→AML in `confirm_pending_deposit` when confirming a deposit that implies that transition, or (b) clearly treat backoffice deposit confirm as a different flow and document when each is used. Prefer (a) if both paths can confirm the same “client announced” deposits.

- **M3. Redirect tests do not cover 0010 roles**  
  **Files:** `frontend/src/utils/__tests__/redirect.test.ts`  
  **Details:** Tests cover NDA, ADMIN, and `eu@eu.ro` only. No tests for KYC, APPROVED, FUNDING, AML, CEA, CEA_SETTLE, SWAP, EUA_SETTLE, EUA, or REJECTED.  
  **Recommendation:** Add tests for each 0010 role mapping to the expected redirect target per `getPostLoginRedirect` (and plan §11).

### Minor

- **m1. `ContactRequestUpdate.status` is unvalidated**  
  **Files:** `backend/app/schemas/schemas.py` (`ContactRequestUpdate`)  
  **Details:** `status` is `Optional[str]`. Invalid values are only rejected when casting to `ContactStatus` in the handler.  
  **Recommendation:** Validate against `ContactStatus` (e.g. `Literal` or enum) in the schema and return 422 for invalid values.

- **m2. `create_deposit` (backoffice) does not transition roles**  
  **Files:** `backend/app/api/v1/backoffice.py` (`create_deposit`)  
  **Details:** Creating a deposit directly (no client announce) credits the entity but does not change user roles. Plan §4 focuses on announce → confirm → FUNDING→AML; direct create is a different flow.  
  **Recommendation:** Document when to use “create deposit” vs “announce + confirm”. If direct create should also move users along the flow (e.g. APPROVED→AML or similar), add explicit transition logic and document the rule.

- **m3. CEA_SETTLE → SWAP when entity has no CEA_PURCHASE batches**  
  **Files:** `backend/app/services/role_transitions.py` (`transition_cea_settle_to_swap_if_all_cea_settled`)  
  **Details:** If `total == 0` (no CEA_PURCHASE batches for the entity), the function returns without transitioning. In the current flow, CEA_SETTLE is reached only after CEA purchase (which creates a batch), so this is likely unreachable.  
  **Recommendation:** Keep behaviour as-is, but add a short comment or assert that we expect at least one CEA_PURCHASE batch when the entity is in CEA_SETTLE.

- **m4. Duplicate `UserRole` / `ContactStatus` in schemas**  
  **Files:** `backend/app/schemas/schemas.py`  
  **Details:** Pydantic enums mirror model enums. Acceptable for API boundaries, but changes must be kept in sync.  
  **Recommendation:** Consider deriving schema enums from model enums (or a shared source) to avoid drift.

---

## 4. Data and Integration Checks

- **Snake_case / camelCase:** API uses snake_case; frontend types use camelCase where appropriate. No mismatches identified.
- **Error handling:** Deposit service uses `DepositNotFoundError` / `InvalidDepositStateError`; handlers map to 404/400. Admin/backoffice use `handle_database_error` and `create_error_response` patterns where applied.
- **Transaction boundaries:** Deposit confirm/clear/reject and role transitions run within the same DB session; commit/rollback usage is consistent.

---

## 5. Security and Best Practices

- **Role checks:** `get_admin_user`, `get_approved_user`, `get_funded_user`, `get_swap_user`, `get_onboarding_user` used correctly. Swaps API protected via `get_swap_user` (C1 fixed).
- **Reject NDA:** Linked user set to REJECTED when contact is rejected; behaviour is correct.
- **Passwords:** Create-from-request uses `hash_password`; invitation flow consistent with existing patterns.

---

## 6. UI/UX and Design System

- **Reference files:** `app_truth.md` (project root), `frontend/docs/DESIGN_SYSTEM.md`, `docs/commands/interface.md`, `frontend/src/styles/design-tokens.css`, `frontend/tailwind.config.js`, and `.cursor/rules/niha-core.mdc`.
- **Tokens:** Header, redirect, and route-guard logic use Tailwind tokens (e.g. `navy-*`, `emerald-*`). No hard-coded hex/RGB or `slate-*`/`gray-*` in inspected 0010-related UI.
- **Theme:** `darkMode: 'class'` and design tokens support light/dark. Header and layout respect theme.
- **Accessibility:** Nav and buttons use semantic structure; access to modals (e.g. ContactRequestsTab) is consistent with existing patterns. No dedicated 0010-specific a11y review was performed.
- **Loading / error / empty:** Contact requests, users, and deposits tabs handle loading and empty states; error handling aligns with existing backoffice UX.

---

## 7. Recommendations

1. ~~**Fix C1:** Add role-based protection (SWAP+ or equivalent) to swap API endpoints.~~ ✅ **Done:** `get_swap_user` added; all swap routes use it.
2. ~~**Fix M1:** Restrict onboarding API to NDA and KYC (and optionally ADMIN).~~ ✅ **Done:** `get_onboarding_user`; all onboarding routes use it.
3. ~~**Fix M2:** Implement FUNDING→AML in backoffice `confirm_pending_deposit`.~~ ✅ **Done:** Transition added; docstrings updated.
4. ~~**Fix M3:** Extend redirect tests to all 0010 roles.~~ ✅ **Done:** Tests for all roles; `src/test/setup.ts` added so vitest runs.
5. ~~**m1:** Schema validation for contact status.~~ ✅ **Done:** `ContactRequestUpdate` validates `status` ∈ {NDA, REJECTED, KYC}.
6. ~~**m2:** Document create vs announce+confirm deposits.~~ ✅ **Done:** Docstrings in `create_deposit`, `confirm_pending_deposit`, and `deposit_service`.
7. ~~**m3:** Comment for CEA_SETTLE batch assumption.~~ ✅ **Done:** Comment in `role_transitions`.

---

## 8. Conclusion

The 0010 implementation is **complete** and matches the plan. All review issues have been fixed. Swap API is protected (SWAP+), onboarding API restricted (NDA/KYC/ADMIN), backoffice confirm performs FUNDING→AML, redirect tests cover all 0010 roles, and the minor items (schema validation, deposit flow docs, CEA_SETTLE comment) are in place.
