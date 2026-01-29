# Changelog

All notable changes to the Nihao Carbon Platform are documented in this file.

## [2026-01-29] - PENDING User Access Only to Onboarding (Feature 0009)

### Features
- **PENDING-only onboarding** — Authenticated PENDING users can access only onboarding (`/onboarding`, sub-routes, `/onboarding1`, `/learn-more`) and public routes (`/contact`, `/setup-password`, `/login`). All other protected routes (`/profile`, `/dashboard`, `/funding`, `/cash-market`, `/settings`, `/users`, `/components`, `/design-system`, backoffice) redirect PENDING to `/onboarding`.
- **Single-hop redirect** — When a PENDING user hits `/funding`, they are redirected to `/onboarding` in one hop (ApprovedRoute uses role-based redirect via `getPostLoginRedirect` instead of a fixed redirect).
- **Catch-all for authenticated users** — Unknown paths (`*`) redirect authenticated users to their role home (`getPostLoginRedirect(user)`) instead of `/login`.
- **Design-system route** — `/design-system` is now protected (same as `/components`); PENDING cannot access it.

### Technical
- **Frontend:** AuthGuard extended with optional `blockRoles` and `redirectWhenBlocked`; order of checks: auth → allowedRoles → blockRoles. When `allowedRoles` fails, redirect uses `redirectTo ?? getPostLoginRedirect(user)`. ProtectedRoute, DashboardRoute: block PENDING to `/onboarding`. OnboardingRoute: requireAuth only. ApprovedRoute: no fixed redirectTo so non-APPROVED get role-based redirect. CatchAllRedirect component for catch-all route.
- **Backend:** Deposits client endpoints (`get_wire_instructions`, `announce_deposit`, `get_my_deposits`, `preview_hold_period`) use `get_approved_user` (APPROVED/FUNDED/ADMIN only; PENDING receives 403). Cash market trading endpoints (`place_order`, `get_my_orders`, `cancel_order`, `get_user_balances`, `preview_order`, `execute_market_order`) use `get_funded_user` (FUNDED/ADMIN only).

### Documentation
- **README.md** — User Authentication: PENDING-only onboarding and redirect behaviour.
- **app_truth.md** — §8: PENDING-only onboarding, AuthGuard behaviour, route wrappers, catch-all, backend role enforcement.
- **docs/api/AUTHENTICATION.md** — Route guards and PENDING restrictions; backend role enforcement.
- **docs/WORKFLOW.md** — User roles: PENDING restricted to onboarding.

### Related
- [Plan 0009](features/0009_PLAN.md) – PENDING user access only to onboarding.
- [Review 0009](features/0009_REVIEW.md) – Implementation review and fixes.

---

## [2026-01-29] - Configurable Mail & Auth in Settings (Feature 0008)

### Features
- **Mail and auth settings (admin)** — Mail provider (Resend or SMTP), from address, invitation subject/body, link base URL, and token expiry are configurable in the database. Admin configures them in Platform Settings → Mail & Authentication. When a config row exists, invitation emails (and optionally other emails) use it; otherwise the app falls back to `RESEND_API_KEY` and `FROM_EMAIL` from the environment.
- **Settings API** — `GET /api/v1/admin/settings/mail` returns current mail config or defaults (secrets masked). `PUT /api/v1/admin/settings/mail` creates or updates the single config row. Admin auth required. See [SETTINGS_API.md](api/SETTINGS_API.md).
- **Invitation flow** — Approve & Invite with "Invite user" uses stored config for invitation expiry days, from address, subject, body template (placeholders `{{first_name}}`, `{{setup_url}}`), and setup-password link base URL. Email can be sent via Resend or SMTP depending on provider.

### Technical
- **Backend:** `MailConfig` model and `mail_config` table (migration `2026_01_29_mail_config`); Pydantic `MailConfigUpdate` with URL and port validation; `email_service.send_invitation(..., mail_config=...)` and `_send_via_smtp` for SMTP.
- **Frontend:** Settings page Mail & Auth card (provider, credentials, invitation URL/subject/body, token expiry, verification/auth placeholders); `adminApi.getMailSettings()` / `updateMailSettings()`; design tokens only (navy, amber, emerald). Saved feedback and SMTP-host-empty warning.

### Documentation
- **app_truth.md** — §4 Integrations: mail configurable via Settings (DB) with env fallback; §8 Settings page and Mail & Auth.
- **docs/api/SETTINGS_API.md** — GET/PUT mail settings request/response and validation.

### Related
- [Plan 0008](features/0008_PLAN.md) – NDA flow, Approve & Invite, configurable Mail/Auth in Settings.
- [Review 0008](features/0008_REVIEW.md) – Implementation review.

---

## [2026-01-29] - NDA Open in Browser & Copy Consistency

### Changed
- **NDA PDF behaviour** — The backoffice NDA action now opens the PDF in a new browser tab instead of triggering a download. Implemented via `adminApi.openNDAInBrowser(requestId, fileName)`: fetches blob with auth, creates object URL, `window.open(url, '_blank', 'noopener')`, revokes URL after 5s.
- **UI copy** — ContactRequestViewModal: button label "Open {filename}", loading "Opening…", `aria-label` "Open NDA {filename}"; icon changed from Download to ExternalLink. Prop and handler renamed: `onDownloadNDA` → `onOpenNDA`, `downloadLoading` → `openNDALoading`; page handler `handleOpenNDA`, loading key `open-{requestId}`.
- **Error handling** — If the browser blocks the pop-up (`window.open` returns null), the API throws `Error('POPUP_BLOCKED')` and the UI shows "Allow pop-ups for this site and try again." Other errors show "Failed to open NDA file."

### Documentation
- **README.md** — Onboarding Contact Requests: "NDA download button" → "NDA open-in-browser button".
- **app_truth.md** — §8 Backoffice Contact Requests UI: NDA button opens PDF in new tab; noted pop-up blocker message and `adminApi.openNDAInBrowser` / GET NDA endpoint.
- **docs/admin/BACKOFFICE_COMPONENTS.md** — ContactRequestsTab and ContactRequestViewModal: props `onOpenNDA`, `openNDALoading`; usage and flow updated; NDA section describes open-in-new-tab and pop-up blocker message.
- **docs/api/BACKOFFICE_API.md** — Contact Requests: added "Get NDA File" subsection (GET `/admin/contact-requests/{request_id}/nda`) with path params, response headers/body, error responses, and frontend example; noted frontend opens in new tab and POPUP_BLOCKED handling.

### Related Documentation
- [Code Review: NDA open in browser](features/2026_01_29_nda_open_in_browser_REVIEW.md).

---

## [2026-01-29] - Contact Request Entity Name Display Fix

### Bugfix
- **Contact request list** — Entity name (and other fields) entered in the contact or NDA form were showing as "—" in the backoffice list. The global axios response interceptor converts API responses to camelCase (`entity_name` → `entityName`), while backoffice types and components expect snake_case. Contact request data is now normalized to snake_case at the realtime hook boundary (`useBackofficeRealtime`) before storing, so the list and modals display `entity_name`, `contact_name`, etc. correctly.

### Improvements
- **Realtime hook** — Fetch and WebSocket handlers pass contact-request payloads through `ensurePlainObject()` before `transformKeysToSnakeCase` so non-plain objects (e.g. class instances) are safely normalized.
- **Tests** — Added unit test in `frontend/src/utils/__tests__/dataTransform.test.ts` that contact-request-shaped camelCase payloads are converted to snake_case by `transformKeysToSnakeCase`.
- **Logging** — WebSocket connection failure in the realtime hook now uses `logger.error` instead of `console.error`.

### Documentation
- **app_truth.md** — §8 Contact/NDA requests: noted that the frontend normalizes API and WebSocket contact-request payloads (camelCase) to snake_case at the realtime hook boundary so backoffice code can assume snake_case.
- **README.md** — Onboarding Contact Requests: added that API/WS payloads are normalized to snake_case in the realtime hook.
- **docs/api/BACKOFFICE_API.md** — Contact requests: added that the frontend normalizes GET and WebSocket payloads to snake_case in the realtime hook.

### Related Documentation
- [Code Review: Contact Entity Name Display](features/2026_01_29_contact_entity_name_display_REVIEW.md).

---

## [2026-01-29] - Contact Requests List & View Modal Completeness (Plan 0007)

### Features
- **Contact Requests list** — Each row displays Entity and Name from the contact request (`entity_name`, `contact_name`); fallback "—" only when the value is missing. View, Approve, Reject, and Delete buttons use safe `aria-label` fallbacks (`entity_name ?? contact_email ?? id ?? 'contact request'`) so labels never show "undefined".
- **ContactRequestViewModal** — Shows all contact request fields (ID, Entity, Name, Email, Position, Request type, Status, NDA file name, Submitter IP, Notes, Submitted) in a theme-consistent layout. NDA is presented as a button labeled "Link to attached PDF for verification" that triggers download (disabled while loading). Uses theme tokens only (navy, Typography).

### Improvements
- **NDA control** — Replaced `<a href="#">` with `<button type="button">` for the NDA download control for clearer semantics and accessibility; added disabled state while download is in progress.
- **Tests** — Added `ContactRequestViewModal.test.tsx` and `ContactRequestsTab.test.tsx` (18 tests) for list display, fallbacks, View button aria-labels, and modal content.

### Documentation
- **app_truth.md** — §8: Backoffice Contact Requests UI (list fields, View modal, aria-label fallbacks).
- **README.md** — Onboarding Contact Requests description updated (Entity/Name, View modal, NDA button).
- **docs/admin/BACKOFFICE_COMPONENTS.md** — ContactRequestsTab and ContactRequestViewModal sections updated to match implementation.

### Related Documentation
- [Plan 0007](features/0007_PLAN.md) – Contact requests list values and view modal completeness.
- [Code Review 0007](features/0007_REVIEW.md) – Implementation review and fixes.

---

## [2026-01-29] - Contact Request Reference Removal & Alembic Baseline

### Removed
- **Contact request `reference` field** — Removed from backend model (`contact_requests` table), schemas (`ContactRequestCreate`, `ContactRequestResponse`), contact and admin API (create, GET, update, WebSocket payloads), frontend types and Contact form, and backoffice UI (view modal, approve payload). Join/Contact form no longer has a "Referral (Optional)" field.

### Improvements
- **Admin contact request update** — `PUT /admin/contact-requests/{id}` now wraps `db.commit()`/`db.refresh()` in try/except with rollback and `handle_database_error` for consistent error handling.
- **Alembic baseline** — Single revision (`2026_01_29_baseline`) is head; schema is driven by app startup (`init_db()`). Old migrations moved to `backend/alembic/versions/archive/`. New migrations should set `down_revision = "2026_01_29_baseline"`. See `backend/alembic/README` and baseline docstring.
- **Test mocks** — Contact request mock (GET `/admin/contact-requests`) and `MockContactRequest` factory aligned with real API shape (`ContactRequestResponse`) and pagination (`{ data, pagination }`). Backoffice test updated to assert on `body.data` and `body.pagination`.

### Documentation
- **app_truth.md** — Contact/NDA request response shape updated (no `reference`); operational commands note DB/migrations baseline and `down_revision`.
- **docs/REBUILD_INSTRUCTIONS.md** — Database and migrations section updated for single baseline and init_db-driven schema.
- **docs/CURSOR_DEVELOPMENT_GUIDE.md** — Database schema change steps note baseline and `down_revision` for new migrations.
- **docs/api/BACKOFFICE_API.md** — Contact requests response and WebSocket payload documented without `reference`.

### Technical Details
- **Files**: `backend/app/models/models.py`, `backend/app/schemas/schemas.py`, `backend/app/api/v1/contact.py`, `backend/app/api/v1/admin.py`, `backend/alembic/versions/2026_01_29_baseline_current_schema.py`, `backend/alembic/README`, `frontend/src/types/index.ts`, `frontend/src/types/backoffice.ts`, `frontend/src/pages/ContactPage.tsx`, `frontend/src/components/backoffice/ContactRequestViewModal.tsx`, `frontend/src/components/backoffice/ContactRequestsTab.tsx`, `frontend/src/pages/BackofficeOnboardingPage.tsx`, `frontend/src/test/mocks/handlers.ts`, `frontend/src/test/factories.ts`, `frontend/src/services/__tests__/backoffice.test.ts`, `app_truth.md`, `docs/CHANGELOG.md`, `docs/REBUILD_INSTRUCTIONS.md`, `docs/CURSOR_DEVELOPMENT_GUIDE.md`, `docs/api/BACKOFFICE_API.md`.

### Related Documentation
- [Code Review: Contact Reference & Baseline](features/2026_01_29_contact_reference_and_baseline_REVIEW.md).

---

## [2026-01-29] - NDA Form, Backoffice Notification, Badge, Modal (Plan 0006)

### Features
- **NDA form data + PDF in DB** – POST `/contact/nda-request` stores entity_name, contact_email, contact_name, position, nda_file_name, nda_file_data (binary), nda_file_mime_type, submitter_ip, request_type="nda", status=NEW. No mock/cache.
- **Backoffice real-time list** – After create, backend broadcasts WebSocket `new_request`; `useBackofficeRealtime` calls `addContactRequest`; Contact Requests list updates without refresh.
- **Badge** – SubSubHeader contact-requests count = `contactRequests.length`; `addContactRequest` deduplicates by id; `.subsubheader-nav-badge` used on requests tab.
- **ContactRequestViewModal** – Shows all form fields: Entitate, Nume, Email, Position, Reference, Request type, Status, Data completării, IP (with Lookup), Notes, NDA document (name + download).

### Improvements
- **Backend: DB error handling** – Contact creation endpoints (`create_contact_request`, `create_nda_request`) wrap db add/commit/refresh in try/except with rollback and `handle_database_error`; module-level logger added in `contact.py`.
- **Backend: ContactRequestResponse** – Schema now includes `submitter_ip` and `notes` so POST responses match GET/WebSocket shape; clients get full fields from POST.
- **Frontend: API types** – `getContactRequests` returns `Promise<PaginatedResponse<ContactRequestResponse>>`; `updateContactRequest` accepts `ContactRequestUpdate` (`status?`, `notes?`); type added in `frontend/src/types/index.ts`.

### Technical Details
- **Files**: `backend/app/api/v1/contact.py`, `backend/app/schemas/schemas.py`, `frontend/src/services/api.ts`, `frontend/src/types/index.ts`.

### Related Documentation
- [Plan 0006](features/0006_PLAN.md) – NDA form, backoffice notification, badge, modal.
- [Code Review 0006](features/0006_REVIEW.md) – Implementation review and fixes.

---

## [2026-01-28] - Card Back, Contact Request List & View Modal

### Features
- **Section/card wrapper (`card_back`)** – Standard wrapper for page sections and card containers. Theme-driven: `--color-card-back-bg`, `--color-card-back-border`, `--radius-card-back` in `design-tokens.css` (light/dark). Use `.card_back` class or `<Card />`. Less rounded corners; background a few steps above layout.
- **Compact list row (`card_contact_request_list`)** – Compact row for lists (e.g. Contact Requests): Entitate, Nume, Data completării + actions. Class in `frontend/src/index.css`; Tailwind navy tokens only.
- **Contact Requests UI** – Contact Requests tab: compact list rows; View (eye) icon opens **ContactRequestViewModal** with full form data, NDA PDF download link, and optional IP Lookup link. Actions: View → Approve & Invite, Reject, Delete (icon).
- **ContactRequestViewModal** – New modal: all form fields, NDA document section with download link, optional `onIpLookup` for "Lookup" next to IP. Escape to close, focus trap (Tab/Shift+Tab), exit animation before close.

### Improvements
- **Accessibility** – View modal: Escape to close, focus on close button on open, focus trap; Reject button uses design-system pattern (secondary + `text-red-500`).
- **onIpLookup** – Passed from ContactRequestsTab to ContactRequestViewModal; "Lookup" link next to IP in modal opens parent's IP lookup flow.

### Documentation
- **app_truth.md** §9 – Section/card wrapper (`.card_back`) and compact list row (`.card_contact_request_list`) added to UI/UX standards.
- **DESIGN_SYSTEM.md** – Cards section already documents `card_back`; added compact list row example for `card_contact_request_list`.
- **docs/admin/BACKOFFICE_COMPONENTS.md** – ContactRequestViewModal section; ContactRequestsTab updated (compact list, View modal, onIpLookup); Contact Requests flow diagram updated.
- **README.md** – Onboarding page description updated: Contact Requests compact list, View modal, NDA link, IP lookup from modal.

### Technical Details
- **Files**: `frontend/src/index.css` (`.card_back`, `.card_contact_request_list`), `frontend/src/components/common/Card.tsx`, `frontend/src/styles/design-tokens.css`, `frontend/src/components/backoffice/ContactRequestsTab.tsx`, `frontend/src/components/backoffice/ContactRequestViewModal.tsx`, `frontend/docs/DESIGN_SYSTEM.md`, `app_truth.md`, `docs/admin/BACKOFFICE_COMPONENTS.md`, `README.md`, `docs/CHANGELOG.md`.

### Related Documentation
- [Code Review: Card Back & Contact Requests](features/2026_01_28_card_back_contact_requests_REVIEW.md).

---

## [2026-01-28] - Backoffice UI Compliance & Onboarding Restructure (Plan 0005)

### Features
- **Single Header** – Backoffice uses the same main site Layout (one Header, one Footer); no separate backoffice header.
- **Subheader nav** – Icon-only buttons; page name on hover; active page shows icon + label via `SubheaderNavButton`. Standardized classes: `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive` in `design-tokens.css`.
- **Onboarding default** – Visiting `/backoffice` redirects to Onboarding → `/backoffice/onboarding/requests`. Contact Requests, KYC Review, and Deposits are subpages under Onboarding with route-based content.
- **SubSubHeader nav** – Onboarding subpage links (Contact Requests, KYC, Deposits) in SubSubHeader with **distinct button design** (child-level): `.subsubheader-nav-btn*` (smaller, rounded-lg). **Count badge** (pending/new items): `.subsubheader-nav-badge` (red background, high visibility). All standardized in `design-tokens.css` and documented in DESIGN_SYSTEM.md.
- **Current-page highlighting** – Subheader and SubSubHeader nav both highlight the active route using the same logic (route-based active state).

### Removed
- **BackofficePage** – Removed; content moved to `BackofficeOnboardingPage`. Unused lazy import and export removed; type comments in `types/backoffice.ts` updated to reference `BackofficeOnboardingPage`.

### Technical Details
- **Files**: `BackofficeLayout.tsx`, `BackofficeOnboardingPage.tsx`, `SubheaderNavButton.tsx`, `Subheader.tsx`, `SubSubHeader.tsx`, `design-tokens.css`, `DESIGN_SYSTEM.md`, `App.tsx`, `pages/index.ts`, `app_truth.md`, `docs/admin/BACKOFFICE_NAVIGATION.md`, `README.md`.
- **Routes**: `/backoffice` → `/backoffice/onboarding` → `/backoffice/onboarding/requests`; `/backoffice/onboarding/requests`, `/kyc`, `/deposits` render `BackofficeOnboardingPage`.

### Related Documentation
- [Plan 0005](features/0005_backoffice_ui_compliance_PLAN.md) – Backoffice UI compliance plan.
- [Code Review 0005](features/0005_REVIEW.md) – Full scope review and fixes.
- [Backoffice navigation](admin/BACKOFFICE_NAVIGATION.md) – Routes and layout.

---

## [2026-01-28] - Backoffice Empty Page Fix

### Bug Fixes
- **Backoffice blank page** – Backoffice routes (`/backoffice`, `/backoffice/*`) now render outside the main site Layout so content is no longer hidden by layout/flex issues.
- **Runtime crash** – `formatRelativeTime` no longer throws when given `null` or `undefined` (e.g. missing `created_at` from API); returns `'—'` instead.

### Improvements
- **Error boundary** – Backoffice routes wrapped in `BackofficeErrorBoundary`; render errors are shown in UI and logged via `logger.error` (with `componentStack`).
- **Navigation** – "Back to site" link in BackofficeLayout Subheader links to `/dashboard`.

### Technical Details
- **Files modified**: `frontend/src/App.tsx` (BackofficeErrorBoundary with `componentDidCatch`, backoffice routes moved out of Layout), `frontend/src/utils/index.ts` (`formatRelativeTime` null/undefined guard), `frontend/src/components/layout/BackofficeLayout.tsx` ("Back to site" link).
- **New file**: `frontend/src/utils/__tests__/formatRelativeTime.test.ts` (null/undefined and valid date tests).

### Related Documentation
- [Code Review: Backoffice Empty Page Fix](features/2026_01_28_backoffice_empty_page_fix_REVIEW.md).

---

## [2026-01-28] - Browser & Console Verification / Build Fixes (0004)

### Bug Fixes
- **Frontend build** – Resolved TypeScript build failures (unused imports, invalid Button variants, optional deposit fields).
- **AMLDepositsTab** – Removed unused `TrendingUp` import; Reject button uses valid `variant="secondary"` with design-system token `text-red-500` (Error/Sell).
- **UserDetailModal** – Deposit amount display: show "—" when `amount` is null/undefined instead of "€0.00" to avoid masking missing data.
- **BackofficeAssetsPage** – Removed unused imports: `Wallet`, `TrendingUp`, `DollarSign`, `Badge`.
- **BackofficeDepositsPage** – "Clear Funds" button uses `variant="primary"` (Button has no `success` variant).

### Code Quality
- **Button variants** – Only `primary | secondary | outline | ghost` are supported; destructive actions use `secondary` + `className` with `text-red-500` (see design system).
- **Type safety** – `formatCurrency` callers pass `number`; for missing amount, UI shows "—" or N/A instead of `formatCurrency(0)`.
- **Tests** – Added `frontend/src/utils/__tests__/formatCurrency.test.ts` (zero, positive/negative, EUR default, custom currency).

### Technical Details
- **Files modified**: `AMLDepositsTab.tsx`, `UserDetailModal.tsx`, `BackofficeAssetsPage.tsx`, `BackofficeDepositsPage.tsx`.
- **New file**: `frontend/src/utils/__tests__/formatCurrency.test.ts`.
- **Verification**: `npm run build` and `npm run test` pass.

### Related Documentation
- [Browser & Console Verification Report](features/0004_browser_console_verification_report.md) – Plan and identified errors.
- [Code Review 0004](features/0004_REVIEW.md) – Review and post-review fixes.

---

## [2026-01-27] - Authentication Import Fix

### Bug Fixes
- **Critical Fix** - Fixed backend startup failure caused by incorrect import in `withdrawals.py`
  - Replaced non-existent `require_admin` import with correct `get_admin_user` function
  - Backend now starts successfully, authentication endpoints working
  - All API endpoints functional after fix

### Code Quality
- **Naming Consistency** - Updated admin endpoints in `withdrawals.py` to use `admin_user` parameter name
  - Matches naming convention used across all other API files
  - Improved code consistency and maintainability
  - 6 admin endpoints updated for consistency

### Technical Details
- **File Modified**: `backend/app/api/v1/withdrawals.py`
- **Import Fix**: Changed from `require_admin` to `get_admin_user`
- **Parameter Updates**: All admin endpoints now use `admin_user` instead of `current_user`
- **Impact**: Resolved complete backend service outage

### Related Documentation
- [Authentication Import Fix](../docs/fixes/2026-01-27-authentication-import-fix.md) - Detailed fix documentation
- [Code Review](../docs/features/2026-01-27-authentication-import-fix_REVIEW.md) - Code review notes

---

## [2026-01-26] - Profile Page API Integration & Admin-Only Editing

### Features
- **Profile Management** - Complete API integration for profile viewing and editing
- **Admin-Only Editing** - Profile editing restricted to admin users (UI-level enforcement)
- **Password Management** - Full API integration for password changes with strength validation
- **Entity Information** - Real-time entity data fetching from API (replaces mock data)
- **Error Handling** - Comprehensive error states with user-friendly messages
- **Success Feedback** - Success messages with auto-dismiss for profile updates and password changes
- **Loading States** - Skeleton loaders during data fetching for better UX

### API Integration
- **Profile Updates** - `PUT /api/v1/users/me` - Update user profile (admin only in UI)
- **Password Changes** - `PUT /api/v1/users/me/password` - Change password with validation
- **Entity Data** - `GET /api/v1/users/me/entity` - Fetch associated entity information
- **Profile Data** - `GET /api/v1/users/me` - Fetch fresh profile data on mount

### Security
- **Password Validation** - Frontend and backend validation matching exactly
- **Special Characters** - Password validation uses exact character set: `!@#$%^&*()_+-=[]{}|;:,.<>?`
- **Access Control** - Profile editing UI only visible to admin users
- **Error Handling** - Separate handling for validation errors vs API errors

### UI/UX Improvements
- **Error Display** - Dismissible error banners with clear messaging
- **Success Messages** - Auto-dismissing success feedback (3 seconds)
- **Loading Indicators** - Skeleton loaders during initial data fetch
- **Accessibility** - ARIA labels added to password visibility toggle buttons
- **Dark Mode** - Full support for error and success message components

### Code Quality
- **Code Comments** - Added JSDoc-style comments to key functions
- **Error Handling** - Comprehensive try-catch blocks with proper error messages
- **State Management** - Proper cleanup of success messages and form state
- **Type Safety** - Full TypeScript typing throughout

### Documentation
- **Users API Documentation** - New comprehensive API documentation (`docs/api/USERS_API.md`)
- **README Updates** - Added profile management to feature list
- **Code Comments** - Enhanced documentation in ProfilePage component and backend endpoints

### Technical Details
- **Frontend**: `frontend/src/pages/ProfilePage.tsx` - Complete rewrite with API integration
- **Backend**: `backend/app/api/v1/users.py` - Enhanced endpoint documentation
- **API Service**: `frontend/src/services/api.ts` - Added `getMyEntity()` method

---

## [2026-01-26] - Backoffice Navigation, Order Book / Liquidity, Market Orders Fixes

### Backoffice Navigation & Routes
- **Order Book & Liquidity** - New backoffice routes: `/backoffice/order-book`, `/backoffice/liquidity` with dedicated icons and descriptions
- **BACKOFFICE_NAV** - Now includes Order Book and Liquidity; navigation supports nested routes (e.g. `/backoffice/market-makers/123`)
- **Route configuration** - `ROUTE_CONFIG` extended for order-book and liquidity pages; see `docs/admin/BACKOFFICE_NAVIGATION.md`

### Market Orders Page
- **Order-book price click** - Bid row (BUY) → ASK modal with prefilled price; ask row (SELL) → BID modal with prefilled price
- **Single-path submit** - `onSubmit` performs API call only; `onSuccess` handles refresh and modal close; PlaceOrder handles errors
- **Modals a11y** - `role="dialog"`, `aria-modal`, `aria-labelledby` on dialog panel; Escape to close; focus trap (Tab wrap); `aria-label` on close buttons
- **CEA/EUA toggle** - Moved to `subSubHeaderLeft`; unified `navy-600` active style

### UI/UX Improvements
- **Subheader Navigation Buttons** - Compact navigation in backoffice subheader (Market Makers, Market Orders, Order Book, Liquidity, Audit Logging, Users)
- **Route-Based Icons & Descriptions** - Dynamic subheader content based on current route with appropriate icons and descriptions
- **Nested Route Support** - Navigation buttons correctly highlight for nested routes (e.g., `/backoffice/market-makers/123`)
- **Accessibility Enhancements** - Added ARIA labels, `aria-current` for active routes, and semantic `<nav>` element

### Design System Compliance
- **Subheader Component Migration** - Fixed `Subheader` component to use `navy-*` design tokens instead of `slate-*`
  - Background: `bg-slate-900` → `bg-navy-800`
  - Border: `border-slate-800` → `border-navy-700`
  - Text: `text-slate-400` → `text-navy-400`
- **Consistent Color Usage** - All backoffice components now use design system tokens throughout

### Components
- **BackofficeLayout** - Enhanced with type-safe route configuration
  - Added `BackofficeRoute` type for route safety
  - Added `RouteConfig` interface for route configuration
  - Improved route matching with `isRouteActive()` helper function supporting nested routes
  - Better conditional rendering logic for SubSubHeader
  - Renamed `DASHBOARD_NAV` to `BACKOFFICE_NAV` for clarity
  - Added comprehensive JSDoc documentation
- **Subheader** - Design token migration completed
  - All `slate-*` colors replaced with `navy-*` tokens
  - Updated example in JSDoc to reflect design system usage

### Technical Improvements
- **Type Safety** - Added TypeScript types for routes (`BackofficeRoute`) and route configuration (`RouteConfig`)
- **Route Matching** - Improved route matching logic to support nested routes (e.g., detail pages)
- **Code Quality** - Enhanced code comments and documentation throughout

### Documentation
- Added `docs/admin/BACKOFFICE_NAVIGATION.md` for layout, routes, and SubSubHeader usage
- Updated `docs/api/PLACE_ORDER_COMPONENT.md` with single-path submit, price-click behavior, and integration examples
- README Admin Backoffice: Order Book, Liquidity, SubSubHeader left/right

---

## [2026-01-26] - Backoffice Layout Refactor

### UI/UX Improvements
- **Compact Navigation** - Replaced large card-based navigation with compact button-based navigation in Subheader
- **Navigation Reorganization** - Moved Users button from Header dropdown to BackofficeLayout navigation bar for better discoverability and consistency
- **SubSubHeader Component** - New component for page-specific content (filters, actions, toggles)
- **Route-Based Configuration** - Dynamic icons and descriptions based on current route
- **Improved Space Efficiency** - Navigation takes less vertical space, improving content visibility

### Components
- **BackofficeLayout** - New shared layout component for all backoffice pages
  - Route-based icon and description configuration
  - Active route highlighting with nested route support
  - Optional SubSubHeader for page-specific content
  - Full accessibility support (ARIA labels, keyboard navigation)
  - Unified navigation including Users page access
  - Renamed `DASHBOARD_NAV` to `BACKOFFICE_NAV` for better code clarity
- **SubSubHeader** - New flexible action bar component
  - Supports left-aligned content (filters, toggles)
  - Supports right-aligned content (action buttons)
  - Automatic show/hide based on content
- **Header** - Removed Users menu item from admin dropdown (now accessible via backoffice navigation)

### Market Orders Page
- **Unified Order Submission** - Single handler for both BID and ASK orders with comprehensive error handling
- **Modal-Based Order Placement** - Improved UX with dedicated modals for BID and ASK orders
- **Error Handling** - User-friendly error messages displayed in modals
- **State Management** - Buttons disabled during submission to prevent duplicate orders
- **Order Book Refresh** - Automatic refresh after successful order placement
- **Responsive Design** - Order book height adapts to screen size

### Design System Compliance
- **Color Tokens** - Replaced hardcoded colors (emerald-500, red-500) with navy-* design system tokens
- **Consistent Styling** - All components follow design system standards
- **Dark Mode Support** - Full dark mode compatibility

### Accessibility
- **ARIA Labels** - Navigation buttons have proper ARIA labels (`aria-label` on container and links)
- **Active Route Indication** - `aria-current="page"` for active routes
- **Navigation Semantics** - Proper `<nav>` element with `aria-label="Backoffice navigation"`
- **Modal Accessibility** - Proper roles, labels, and keyboard navigation
- **Screen Reader Support** - Icons marked with `aria-hidden="true"` for decorative icons

### Documentation
- Added [Backoffice Layout Refactor](features/2026-01-26-backoffice-layout-refactor.md) documentation
- Updated README with backoffice features section
- Added inline code comments and JSDoc documentation

### Technical Improvements
- **Type Safety** - Extracted `MarketOrder` type for better type safety
- **Error Handling** - Comprehensive try-catch blocks with user feedback
- **State Management** - Improved modal and submission state handling
- **Code Organization** - Better separation of concerns

---

## [2026-01-25] - Comprehensive Code Review Fixes

### Security
- **CORS Configuration** - Fixed production CORS to use configured origins instead of allowing all origins
- **Database Connection Pooling** - Replaced NullPool with QueuePool for better performance and connection reuse

### Error Handling
- **Standardized Error Responses** - Created `backend/app/core/exceptions.py` with consistent error format
- **Database Error Handling** - All database operations now have try/except with rollback
- **WebSocket Error Handling** - Improved error logging and connection cleanup

### Design System
- **Hard-coded Colors Removed** - Refactored all reusable components to use design tokens
- **Theme Support** - All refactored components properly support light/dark mode switching
- **Components Refactored**: OnboardingLayout, KycUploadModal, LivePriceDisplay

### Features
- **Profile Management** - Implemented API calls for profile update and password change
- **TODO Completion** - Documented remaining TODOs in order_service.py

### Documentation
- Added [Error Handling Architecture](architecture/error-handling.md)
- Added [Database Configuration](architecture/database-configuration.md)
- Added [API Error Handling](api/ERROR_HANDLING.md)
- Added [CORS Configuration](configuration/CORS.md)
- Added [Development Guide](DEVELOPMENT.md)
- Updated Design System documentation with color refactoring details

### Settings & Admin Scraping
- **Settings error feedback** - Inline error banner with dismiss; all scraping-source actions surface API errors via `getApiErrorMessage`
- **Price Scraping Card** - Added `data-testid="price-scraping-sources-card"` and `data-component="PriceScrapingSources"` for E2E and DOM tools
- **Admin Scraping API** - Create response returns full shape (`last_scrape_at`, `last_scrape_status`, `last_price`, `updated_at`); ScrapeLibrary fallback `HTTPX`; test/refresh log exceptions and return user-oriented messages
- **Admin Scraping API docs** - Added [Admin Scraping API](api/ADMIN_SCRAPING_API.md) with request/response examples

### Technical Improvements
- Extracted magic numbers to constants (WebSocket heartbeat interval)
- Improved code organization and consistency
- Enhanced logging throughout application
- CORS `allow_methods` and `allow_headers` restricted to `GET, POST, PUT, DELETE, OPTIONS` and `Content-Type, Authorization`; [CORS](configuration/CORS.md) doc updated to match

---

## Previous Changes

See individual feature documentation in `docs/features/` and `docs/fixes/` for detailed change logs.
