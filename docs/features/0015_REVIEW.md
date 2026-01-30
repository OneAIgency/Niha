# 0015 – User role MM (Market Maker) – Code Review

**Scope:** Add user role **MM** (Market Maker). MM users are created and managed only by admin; no contact requests or approvals. Admin creates them via Create User and can edit role/fields via Edit User.

**Reviewed:** Backend models, schemas, admin API (create_user, update_user_full), migration; frontend types, roleBadge, CreateUserModal, EditUserModal, UserDetailModal, UsersPage, Header, redirect, ProfilePage, tests; docs/ROLE_TRANSITIONS.md; alignment with app_truth.md and route/API access. **Post-review:** MM display (avatar blue, role badge fallback), database migration applied and verified.

---

## 1. Summary of implementation quality

The feature is **partially correct**. Creation and admin management of MM users are implemented correctly (backend enum, schema, migration, create/update logic; frontend Create User with MM option, Edit User with editable role for MM, list filter, badges). **Critical gaps:** frontend route guards and backend API role dependencies do **not** include MM, so MM users cannot access Dashboard, Funding, Cash Market, or Swap pages and would receive 403 on related API calls.

**Strengths:**

- **Backend:** Clean addition of `MM` to `UserRole` in models and schemas; migration adds value to PostgreSQL `userrole` enum idempotently; `update_user_full` correctly allows role update only when new role is MM or current role is MM (admin-only management).
- **Frontend:** `UserRole` type and all UI touchpoints (Create User dropdown, Edit User role dropdown for MM, list filter, badges in UserDetailModal, UsersPage, ProfilePage, roleBadge) include MM; design tokens used (navy, no hard-coded colors).
- **Documentation:** ROLE_TRANSITIONS.md and AdminUserUpdate type updated; redirect and Header give MM same nav/redirect as EUA/ADMIN (dashboard).

---

## 2. Issues found

### Critical (all fixed in this review pass)

1. **Frontend route guards do not allow MM** — **FIXED**
   - **Files:** `frontend/src/App.tsx`.
   - **Issue:** `DashboardRoute`, `ApprovedRoute`, `FundedRoute`, and swap route did not include `'MM'` in `allowedRoles`.
   - **Fix applied:** Added `'MM'` to `DashboardRoute`, `ApprovedRoute`, `FundedRoute`, and the CeaSwapMarketPage `RoleProtectedRoute`.

2. **Backend API role dependencies do not include MM** — **FIXED**
   - **Files:** `backend/app/core/security.py`.
   - **Issue:** `get_approved_user`, `get_funded_user`, and `get_swap_user` did not include `UserRole.MM`.
   - **Fix applied:** Added `UserRole.MM` to `funding_access_roles`, `funded_roles`, and `swap_roles`.

### Major

**None.**

### Minor (all fixed)

1. **app_truth.md migration head** — **FIXED**
   - **File:** `app_truth.md` §7 (Operational Commands).
   - **Issue:** Migration chain and “current head” mentioned `2026_01_30_user_role`.
   - **Fix applied:** Current head set to `2026_01_30_add_mm`; chain and “new migrations should set” text updated. §8 route wrappers and Role-protected APIs updated to mention MM.

2. **createUser API payload** — **FIXED**
   - **File:** `frontend/src/services/api.ts` – `adminApi.createUser` type; `frontend/src/pages/UsersPage.tsx` – `handleCreateUser`.
   - **Issue:** Payload type did not include `position`; Create User form did not send it.
   - **Fix applied:** Added `position?: string` to createUser type in api.ts; UsersPage now passes `position` when creating a user (when `newUser.position?.trim()` is non-empty).

---

## 3. Plan compliance

| Requirement | Status |
|-------------|--------|
| New user role MM (Market Maker) | ✅ Implemented (models, schemas, migration) |
| Created and managed only by admin | ✅ Create via POST /admin/users with role=MM; update via PUT /admin/users/{id} when current or new role is MM |
| No contact requests / no approvals | ✅ MM not in ContactStatus; creation path is admin Create User only |
| Admin can create MM users | ✅ CreateUserModal includes MM option; backend create_user accepts role=MM |
| Admin can edit MM users (including role) | ✅ EditUserModal shows role dropdown for MM; update_user_full allows role update for MM |
| Frontend list/filter/badges for MM | ✅ UsersPage filter, roleBadge, UserDetailModal, ProfilePage |
| MM routing and API access | ✅ Fixed: route guards and backend security roles now include MM |

---

## 4. Data and alignment

- **Backend ↔ Frontend:** User role is returned as `role` (snake_case in API; frontend may receive camelCase depending on interceptor). Existing user list and detail flows already consume `role`; MM is a new enum value and is handled wherever `UserRole` is used. No new snake_case/camelCase mismatch introduced.
- **AdminUserUpdate:** `role` added to frontend type and sent only when editing MM users (current or new role MM); backend expects optional `role` and applies it under the same condition. Aligned.

---

## 5. Error handling and edge cases

- **Backend:** update_user_full uses existing pattern (no new try/except beyond existing commit/rollback). Role update is gated by (new role MM or current role MM); no arbitrary role change for other users. Validation of `entity_id` when present is unchanged.
- **Frontend:** Edit User only sends `role` when `editingUser.role === 'MM' || editForm.role === 'MM'`, so non-MM users are unchanged. No new error boundaries or loading states required for this feature.

---

## 6. Security and best practices

- **Admin-only:** Creation and role/field updates for MM remain behind admin endpoints (`get_admin_user`). No new public or weakly protected paths.
- **Role escalation:** Only admin can set or change role to/from MM; normal users cannot self-assign MM. Consistent with “managed strictly by admin.”

---

## 7. Testing

- **Unit tests:** redirect.test.ts includes MM → `/dashboard`; roleBadge.test.ts includes MM → `info`; redirect.test.ts “MM (Market Maker) full access” block includes an explicit contract (`ROLES_WITH_DASHBOARD_ACCESS` contains MM) and asserts MM is not sent to onboarding/login. Appropriate for the new role.
- **Coverage:** Frontend redirect tests document and assert that MM has dashboard access (contract aligned with App.tsx DashboardRoute and backend security). Backend has no dedicated test suite in-repo; MM is included in security role sets in code and can be verified manually or via API.

---

## 8. UI/UX and design system

- **Tokens:** All touched UI uses Tailwind tokens (navy, border, focus ring, blue for MM avatar). No hard-coded hex/slate/gray in the MM-specific changes.
- **Components:** Reuses existing Input, Badge, select, Card patterns. EditUserModal role dropdown for MM uses the same select styling as CreateUserModal. **MM avatar:** UsersPage, EditUserModal, and UserDetailModal use blue gradient (`from-blue-500 to-blue-600`) for MM so Market Makers are visually distinct from NDA (amber); ADMIN remains purple.
- **Accessibility:** Role dropdowns use native `<select>` with label; no new ARIA or keyboard issues observed.
- **Theme:** No new theme logic; existing light/dark and token usage apply.

---

## 9. Recommendations

1. ~~**Fix Critical 1 and 2**~~ — **Done:** MM added to route guards (App.tsx) and to backend security role sets (security.py).
2. ~~**Update app_truth.md**~~ — **Done:** §7 current head set to `2026_01_30_add_mm`; §8 route wrappers and Role-protected APIs updated to include MM.
3. ~~**Add position to createUser**~~ — **Done:** `position?: string` added to createUser type in api.ts; UsersPage passes position when creating a user.
4. ~~**Optional test for MM access**~~ — **Done:** Added describe block “MM (Market Maker) full access” in redirect.test.ts: contract constant `ROLES_WITH_DASHBOARD_ACCESS` includes MM; MM has same post-login destination as EUA/ADMIN (dashboard); MM is not sent to onboarding or login.

---

## 10. Post-review fixes (MM display and database)

1. **MM display so “market maker” is always marked MM, not NDA**
   - **UsersPage:** Role badge uses `(user.role ?? (user as Record<string, unknown>).role as string)?.toUpperCase() ?? '—'` so the value from the API is shown and we never default to NDA when role is missing; avatar for MM uses blue gradient (distinct from NDA amber).
   - **EditUserModal, UserDetailModal:** Avatar for `user.role === 'MM'` uses blue gradient so MM is visually distinct from NDA.
   - **Files:** `frontend/src/pages/UsersPage.tsx`, `frontend/src/components/users/EditUserModal.tsx`, `frontend/src/components/users/UserDetailModal.tsx`.

2. **Database migration applied**
   - Migration `2026_01_30_add_mm` (Add UserRole MM) was run: `alembic upgrade head`. PostgreSQL enum `userrole` now includes value `MM` (verified via `pg_enum`). New or updated users with role MM are stored and returned correctly by the API.

---

## 11. Conclusion

The MM role is correctly added at the data and admin-management layer (backend + frontend create/edit, list, badges). **Critical issues have been fixed:** route guards and backend security dependencies include MM. **Minor issues and recommendations have been implemented:** app_truth.md §7 migration head and §8 route/API docs updated; createUser type and Create User flow include optional position; redirect tests extended for MM full access. **Post-review:** MM display is consistent (blue avatar, role from API with fallback, no NDA default); migration has been applied and the `userrole` enum in the database includes MM. The feature is complete and aligned with the stated intent (MM “full access” like EUA/ADMIN; MM always shown as MM, not NDA) and with app_truth.md §8 (role-based access and redirects).
