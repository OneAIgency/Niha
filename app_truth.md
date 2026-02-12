# APP TRUTH - Nihao Carbon Platform

> **Purpose**: This file serves as the Single Source of Truth (SSOT) for the project's configuration, architecture, and business constraints. It should be updated whenever architectural decisions or key parameters change.

## 1. Project Identity
- **Name**: Nihao Carbon Trading Platform
- **Version**: 1.0.0
- **Scope**: Carbon trading platform for EU ETS (EUA) and Chinese carbon allowances (CEA).

## 2. Technology Stack & Versions
| Component | Technology | Version | Key Libraries |
|-----------|------------|---------|---------------|
| **Backend** | Python | 3.11 | FastAPI, SQLAlchemy (Async), Alembic, Pydantic, Ruff |
| **Frontend** | React | 18 | Vite, TypeScript, TailwindCSS, Zustand |
| **Database** | PostgreSQL | 15 | asyncpg |
| **Cache** | Redis | 7 | redis-py |
| **Infra** | Docker | - | Docker Compose |

## 3. Infrastructure & Ports
The application is containerized. Standard development ports are:

| Service | Internal Port | Host Port | Connection URL (Internal) |
|---------|---------------|-----------|---------------------------|
| **Frontend** | 5173 | 5173 | `http://localhost:5173` |
| **Backend** | 8000 | 8000 | `http://backend:8000` |
| **Database** | 5432 | 5433 | `postgresql://niha_user:pass@db:5432/niha_carbon` |
| **Redis** | 6379 | 6379 | `redis://redis:6379` |

**Note**: Host port for PostgreSQL is mapped to `5433` to avoid conflicts with local Postgres instances.

## 4. Configuration (Environment Variables)
Configuration is managed via Pydantic Settings in `backend/app/core/config.py`.

### Critical Variables
| Variable | Default / Dev Value | Description |
|----------|---------------------|-------------|
| `DATABASE_URL` | `postgresql://...@localhost:5432/..` | DB Connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis Connection string |
| `SECRET_KEY` | *(Generated)* | JWT signing key. **CHANGE IN PROD** |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins (comma-separated) |
| `ENVIRONMENT` | `development` | `development` / `production` |

### Integrations
- **Email**: Mail can be configured via **Settings** (admin-only). Stored configuration (mail provider, from address, invitation template, link base URL, token expiry) is in the database; when present, invitation (and optionally other) emails use it. When no stored config or "use env" is set, `RESEND_API_KEY` and `FROM_EMAIL` from env are used (Resend).
- **Price scraping (EUA/CEA)**: Configured per source in **Settings → Price Scraping Sources** (admin-only). Each source has URL, certificate type (EUA/CEA), scrape interval, and library (httpx, etc.). **carboncredits.com**: All sources whose URL contains `carboncredits.com` share a single external API (`fetchcarbonprices.php`). The system makes **one HTTP request per refresh cycle** for that group and updates all carboncredits.com sources (EUA and CEA) from the same CSV response. Scheduler (`price_scraping_scheduler_loop` in `main.py`) and admin **Refresh** use this shared fetch when any of the sources in the group is carboncredits.com. **429 backoff**: When the carboncredits.com API returns HTTP 429 (rate limit), the backend sets a Redis backoff key (`carboncredits_backoff_until`) so no further request is sent until the backoff period ends. Backoff duration is taken from the `Retry-After` header (seconds or HTTP-date), default 5 minutes, capped at 10 minutes. Test and Refresh in Settings show the user-friendly message "Rate limited by source. Please wait a few minutes before retrying." See `docs/ADMIN_SCRAPING.md` for API and behaviour.

## 5. Business Logic Truths
- **Settlement Cycle**: T+3 Business Days for CEA purchases, T+10-14 for EUA swaps.
- **Currencies**:
  - Base: EUR / CNY
  - Conversions: `EUR_TO_USD=1.08`, `CNY_TO_USD=0.14` (Default static values)
- **Market Defaults**:
  - EUA Price: €75.00
  - CEA Price: ¥100.00

### Swap Market Specifications (CEA → EUA)
The swap market allows users with CEA role (or higher) to exchange CEA for EUA.

**CRITICAL: Ratio Definition**
- `Order.price` in SWAP market = **CEA/EUA ratio** (NOT EUR price!)
- The ratio represents: **how many EUA you receive per 1 CEA**
- Formula: `ratio = CEA_price_EUR / EUA_price_EUR`
- Example: If CEA = €9.85 and EUA = €83.72, then ratio = 9.85 / 83.72 = **0.1177**
- This means: **1 CEA → 0.1177 EUA** (user gives 1 CEA, receives 0.1177 EUA)
- Inverse: **1 EUA = 8.50 CEA** (1 / 0.1177 ≈ 8.50)

**Order Book Interpretation**
| Field | Meaning |
|-------|---------|
| `Order.price` | Ratio CEA/EUA (e.g., 0.1177) — EUA output per 1 CEA input |
| `Order.quantity` | EUA available at this ratio |
| `Order.filled_quantity` | EUA already swapped |
| CEA needed | `Order.quantity / Order.price` |

**Example Calculation**
- User has 1,000,000 CEA
- Best ratio available: 0.1177 CEA/EUA
- User receives: 1,000,000 × 0.1177 = **117,700 EUA** (before fees)
- Platform fee: 0.5%
- Net EUA: 117,700 × 0.995 = **117,112 EUA**

**API Endpoints**
- `GET /api/v1/swaps/rate` — Returns `eua_to_cea` (e.g., 8.50) and `cea_to_eua` (e.g., 0.1177)
- `GET /api/v1/swaps/orderbook` — Returns asks (EUA offers) with ratio and quantity
- `POST /api/v1/swaps` — Create swap request
- `POST /api/v1/swaps/{id}/execute` — Execute swap against orderbook

**CEA and EUA volumes (integer only)**  
CEA and EUA are certificates traded in whole units only; there are no fractional certificates. **CEA and EUA volumes/quantities/amounts are whole numbers only; no fractional certificates.** All API request fields and response fields representing CEA or EUA quantity/volume/amount must be integers; UI must accept and display only whole numbers for CEA/EUA. EUR amounts (e.g. balance_amount, deposit amount, order value in EUR) remain decimal where applicable; only certificate quantities (CEA count, EUA count) and certificate amounts in add-asset/transactions for CEA/EUA are integer.

**EUR balance display (single source of truth)**  
The EUR balance shown to users (Dashboard Cash (EUR), Backoffice User Assets, Cash Market balances) must be consistent everywhere. It is computed as: **EntityHolding (EUR)** when present and > 0; otherwise **Entity.balance_amount** as fallback. The helper `get_entity_eur_balance` in `backend/app/services/balance_utils.py` implements this (optional args `entity` and `eur_holding_quantity` avoid extra queries when the caller already has them). Both endpoints below use it so all users see the same EUR values from the database.

- **`GET /api/v1/cash-market/user/balances`** (FUNDED or ADMIN): Returns current user's asset balances. Response: `{ "entity_id": "<uuid>", "eur_balance": <float>, "cea_balance": <int>, "eua_balance": <int> }`. Used by Dashboard and Cash Market page.
- **`GET /api/v1/backoffice/entities/{entity_id}/assets`** (Admin): Returns entity's asset balances and recent_transactions (last 50 add-asset ops). Response: `eur_balance`, `cea_balance`, `eua_balance` (CEA/EUA as int) plus `recent_transactions[]`. Used by Backoffice User Detail → Assets tab.

## 6. Development Standards
- **Linter**: `ruff` (run with `ruff check .`)
- **Formatter**: `ruff format`
- **Testing**: `pytest` (Backend), `vitest` (Frontend)
- **Dependency Mgmt**:
  - Backend: `requirements.txt`
  - Frontend: `package.json`

## 7. Operational Commands
- **Start Dev**: `docker compose up` (v2; project: `niha_platform`)
- **Rebuild**: `./rebuild.sh` (Stops, cleans, builds, starts)
- **Restart**: `./restart.sh` (Restart only, no clean build)
- **Run Backend Tests**: `docker compose exec backend pytest`
- **Run Migrations**: `docker compose exec backend alembic upgrade head` — Current head is `2026_02_10_server_defaults`. Schema is also created at app startup via `init_db()` / `Base.metadata.create_all`; migrations alter schema over time. New migrations should set `down_revision = "2026_02_10_positive_checks"` (or current head). Old migrations are archived under `backend/alembic/versions/archive/` and are not run.

## 8. Frontend Routing (Backoffice & Role-Based Access)
- **NDA/KYC onboarding** — Authenticated users with role **NDA** or **KYC** can access only: `/onboarding`, its sub-routes (`/onboarding/market-overview`, `/onboarding/about-nihao`, etc.), `/onboarding1`, `/learn-more`, and public routes (`/contact`, `/setup-password`, `/login`). Any attempt to access `/profile`, `/dashboard`, `/funding`, `/cash-market`, `/settings`, `/users`, `/components`, `/design-system`, or backoffice routes redirects them to `/onboarding`. Post-login redirect for NDA/KYC is `/onboarding` (centralized in `frontend/src/utils/redirect.ts` via `getPostLoginRedirect`). **REJECTED** users redirect to `/login`. There is no `PENDING` role; onboarding flow is NDA → KYC → … → EUA (see `frontend/src/types/index.ts` `UserRole`).
- **AuthGuard** — Single source of truth for auth redirects (`frontend/src/App.tsx`). Order: authentication → `allowedRoles` → `blockRoles`. Optional `blockRoles` and `redirectWhenBlocked` (default `/onboarding`) block specific roles (e.g. NDA) and redirect them. When `allowedRoles` is set and user is not in the list, redirect target is `redirectTo ?? getPostLoginRedirect(user)` so non-allowed users get one-hop redirect to their home.
- **Route wrappers** — `ProtectedRoute` uses AuthGuard with `blockRoles={['NDA']}` and `redirectWhenBlocked="/onboarding"`. `DashboardRoute` uses AuthGuard with `allowedRoles={['AML', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']}` (no blockRoles). For **AML** users, the dashboard Cash (EUR) summary card displays "UNDER AML APPROVAL" in the secondary line and uses an amber background at 50% opacity (`bg-amber-500/50`, `dark:bg-amber-400/50`) to indicate pending approval. The dashboard also shows a full-page blur overlay and AML review modal; any click (including on the modal) dismisses the modal, but the blur persists until the user's role updates (e.g. via WebSocket when admin clears the deposit). `OnboardingRoute` uses `allowedRoles={['NDA', 'KYC']}` so only NDA and KYC (and ADMIN via other routes) can access onboarding. `ApprovedRoute` (e.g. funding) uses `allowedRoles={['APPROVED', 'FUNDING', 'CEA', 'CEA_SETTLE', 'SWAP', 'EUA_SETTLE', 'EUA', 'ADMIN', 'MM']}` (AML excluded; AML sees dashboard, not funding); `FundedRoute` (cash market) and swap route include MM. Non-allowed users redirect via `getPostLoginRedirect(user)` (e.g. NDA → `/onboarding`). Catch-all route (`path="*"`) uses `CatchAllRedirect`: authenticated users go to `getPostLoginRedirect(user)`, unauthenticated to `/login`.
- **CEA Cash order confirmation** — On `/cash-market` (CashMarketProPage), after a successful market BUY the frontend shows a confirmation modal (volume CEA, weighted average price, order ticket from order_id); refetches user (GET /users/me) and updates auth store so role reflects CEA→CEA_SETTLE when EUR reaches zero; single CTA "Inapoi la Dashboard" closes the modal and navigates to /dashboard. Cash market access is then restricted by existing role rules: Header shows CEA Cash link only for CEA/MM (`canCashMarket`); FundedRoute allows only CEA/ADMIN/MM, redirecting others (e.g. CEA_SETTLE) to /swap.
- **Admin role simulation** — For **ADMIN** users only: a **floating control** (bottom-right, `frontend/src/components/admin/RoleSimulationFloater.tsx`) allows simulating any platform role for testing. Simulation is **frontend-only** (API requests and token remain the real admin; no backend role change). **Effective role**: `getEffectiveRole(user, simulatedRole)` in `frontend/src/utils/effectiveRole.ts` returns `simulatedRole` when `user.role === 'ADMIN'` and `simulatedRole != null`, otherwise `user.role`. AuthGuard and CatchAllRedirect use this effective role for REJECTED check, `allowedRoles`, `blockRoles`, and redirect target (via `getPostLoginRedirect({ ...user, role: effectiveRole })`). `getPostLoginRedirect` accepts a full User or a `{ role: UserRole }` object (`frontend/src/utils/redirect.ts`). **Where effective role applies**: redirects, Dashboard content (e.g. AML card, funded sections), Header role display (effective role; when simulating, dropdown shows "ADMIN (simulând: X)"). **Where real role applies**: Backoffice and Settings are protected by `AdminRoute` (allowedRoles `['ADMIN']`); the Header shows the Backoffice menu item when `user.role === 'ADMIN'` (real admin). Simulated role is stored in auth store (`simulatedRole`, `setSimulatedRole`) and persisted in sessionStorage for the session.
- **Backoffice routes** (`/backoffice`, `/backoffice/market-makers`, `/backoffice/deposits`, etc.) use the **same** main site `Layout` as the rest of the app (one Header, one Footer). Each backoffice page renders `BackofficeLayout` (Subheader + optional SubSubHeader + content) inside that Layout.
- **Default view**: Visiting `/backoffice` redirects to **Onboarding** → `/backoffice/onboarding/requests`. Onboarding subpages (Contact Requests, KYC Review, Deposits) are at `/backoffice/onboarding/requests`, `/backoffice/onboarding/kyc`, `/backoffice/onboarding/deposits`. Their nav lives in the **SubSubHeader** (left-aligned links; right side: refresh, connection status when on Contact Requests).
- **Error boundary**: Backoffice routes are wrapped in `BackofficeErrorBoundary`, which catches render errors, displays the error message in UI, and logs via `logger.error` (with `componentStack`). Ensures a blank page is never shown on backoffice render failure.
- **Navigation**: The main Header provides site-wide navigation (Dashboard, Backoffice, etc.). BackofficeLayout **Subheader** shows compact nav (icon-only buttons; page name on hover; active page shows icon + label) via `SubheaderNavButton`. **SubSubHeader** nav (e.g. Onboarding subpages) uses distinct button classes (`.subsubheader-nav-btn*`) and count badge (`.subsubheader-nav-badge`) from `frontend/src/styles/design-tokens.css`; see `frontend/docs/DESIGN_SYSTEM.md`.
- **Contact/NDA requests**: POST `/contact/request` and POST `/contact/nda-request` return `ContactRequestResponse` (id, entity_name, contact_email, contact_name, position, nda_file_name, submitter_ip, user_role, notes, created_at). user_role is the role in the flow (NDA, KYC, REJECTED). WebSocket `new_request` payload matches this shape. The frontend normalizes API and WebSocket contact-request payloads (camelCase) to snake_case at the realtime hook boundary (`useBackofficeRealtime`) so backoffice code can assume snake_case. All DB writes in `backend/app/api/v1/contact.py` use try/except, rollback, and `handle_database_error` from `app/core/exceptions`. Admin update contact request (`PUT /api/v1/admin/contact-requests/{request_id}`) uses the same error-handling pattern.
- **Backoffice Contact Requests UI**: The list on `/backoffice/onboarding/requests` shows **only pending** contact requests (user_role NDA or `new`). Requests that become KYC (after Approve & Create User) or REJECTED disappear from the list immediately (realtime via WebSocket `request_updated` or on refresh). Pending is defined by allowlist in `frontend/src/utils/contactRequest.ts` (`PENDING_CONTACT_REQUEST_ROLES`, `isPendingContactRequest`). The list displays `entity_name` and `contact_name` per row (fallback "—" when missing). Badge shows user_role: NDA, KYC, REJECTED. The View (eye) button opens a modal that shows all ContactRequest fields (id, entity_name, contact_name, contact_email, position, user_role, nda_file_name, submitter_ip, notes, created_at) with theme tokens; the NDA is presented as a button labeled "Link to attached PDF for verification" that opens the PDF in a new browser tab (frontend calls `adminApi.openNDAInBrowser`; backend `GET /api/v1/admin/contact-requests/{request_id}/nda` returns the blob). If the browser blocks the pop-up, the UI shows "Allow pop-ups for this site and try again." View, Approve, Reject, and Delete buttons use safe `aria-label` fallbacks: `entity_name ?? contact_email ?? id ?? 'contact request'` so labels never show "undefined".
- **Approve & Create User**: Approve is shown only for contact requests with user_role NDA or new. It opens the "Approve & Create User" modal (`ApproveInviteModal`). Admin chooses **manual** (password ≥8, user active immediately) or **invitation** (email sent, user sets password via link). Form is prefilled from the contact request (email, name split into first/last, position). Submit calls `POST /api/v1/admin/users/create-from-request` with Query params: `request_id`, `email`, `first_name`, `last_name`, `mode` (`manual`|`invitation`), optional `password`, `position`. Backend: creates Entity (name from contact_request.entity_name, jurisdiction OTHER, KYC PENDING); creates User (role KYC, linked to entity; manual: active, password set; invitation: inactive, invitation token and email after commit, MailConfig for expiry—send failure is logged, no rollback); sets contact_request.user_role = KYC; commits. WebSocket broadcast: `request_updated` (full contact request payload with user_role KYC), `user_created` (id, email, first_name, last_name, role). Errors: 400 invalid request_id or duplicate email or password validation; 404 contact request not found; 400/409/500 from `handle_database_error` with optional `details.hint`. Frontend displays message and hint (truncated ~150 chars) from standardized API error shape (`message`, `data.detail`, 422 `detail[0].msg`, or `detail.error` + `details.hint`).
- **Settings page**: Platform Settings at **`/settings`** (admin-only) include **Price Scraping Sources** and **Mail & Authentication**. Mail & Auth configures mail provider (Resend vs SMTP), from address, invitation subject/body/link base URL, token expiry days, and placeholders for verification/auth method. Backend: `GET/PUT /api/v1/admin/settings/mail`.
- **MM (Market Maker) user role** — Admin-only: no contact request or approval flow. Admin creates MM users via **Backoffice → Users → Create User** (select role **MM (Market Maker)**); admin can edit MM users (including role) via **Edit User**. MM has the same route and API access as EUA/ADMIN (Dashboard, Funding, Cash Market, Swap). In the Users list and user modals (Edit User, User Detail), MM is displayed with a blue avatar and info badge (distinct from NDA amber); role is taken from the API and never defaulted to NDA. Backend: **`POST /api/v1/admin/users`** accepts `role` (e.g. `MM`), optional `position`, optional `entity_id`, and password or invitation. Example body: `{ "email": "mm@example.com", "first_name": "MM", "last_name": "User", "role": "MM", "password": "SecurePass1!" }`. **`PUT /api/v1/admin/users/{id}`** allows `role` update only when current or new role is MM (see `docs/ROLE_TRANSITIONS.md`).
- **Add Asset (entity balance adjustment)** — From **Backoffice → Users → User Detail**, admin can open the **Add Asset** modal to **deposit** or **withdraw** EUR, CEA, or EUA for the user's entity. One amount field; two actions: **Deposit** (adds to balance) and **Withdraw** (subtracts). Withdraw is validated so amount ≤ current balance (client- and server-side); backend returns 400 with detail `"Insufficient balance"` otherwise. **`POST /api/v1/backoffice/entities/{entity_id}/add-asset`** (Admin). Request body: `asset_type` (EUR|CEA|EUA), `amount` (positive number), `operation` (optional, `"deposit"`|`"withdraw"`, default `"deposit"`), optional `reference`, `notes`. Response: `{ "message": "..." }`. Example: `POST /api/v1/backoffice/entities/{entity_id}/add-asset` with `{ "asset_type": "EUR", "amount": 1000, "operation": "withdraw", "notes": "Adjustment" }` → `{ "message": "Withdrawal successful" }`. Creates `AssetTransaction` with `transaction_type` DEPOSIT or WITHDRAWAL and updates `EntityHolding.quantity`; for EUR also updates `Entity.balance_amount` (and `total_deposited` on deposit only). Each add-asset operation creates a **ticket** for audit: `action_type` = `ENTITY_ASSET_DEPOSIT` or `ENTITY_ASSET_WITHDRAWAL`, `entity_type` = `AssetTransaction`, `tags` = `["entity_asset", "deposit"]` or `["entity_asset", "withdrawal"]`. Tickets appear in **`/backoffice/logging`** (All Tickets, searchable by `action_type` or tag `entity_asset`).
- **Deposit & Withdrawal History** — In **User Detail** (Assets tab), the **Deposit History** section shows a unified list of (1) wire deposits (`GET /api/v1/backoffice/deposits?entity_id=...`) and (2) add-asset transactions (`recent_transactions` from `GET /api/v1/backoffice/entities/{entity_id}/assets`). List is sorted by `created_at` descending and capped at 50 items. Wire deposits display status and wire reference; add-asset transactions display DEPOSIT or WITHDRAWAL with distinct icon (DollarSign vs Minus) and badge (success/red per design system). Frontend uses `buildDepositAndWithdrawalHistory` (`frontend/src/utils/depositHistory.ts`).
- **Role-protected APIs** — Backend enforces role checks via dependencies. **Onboarding** (`/api/v1/onboarding/*`): `get_onboarding_user` — NDA, KYC, or ADMIN only. **Swap** (`/api/v1/swaps/*`): `get_swap_user` — SWAP, EUA_SETTLE, EUA, ADMIN, or MM. **Funding / deposits** (`/api/v1/deposits/*` client endpoints): `get_approved_user` (APPROVED and beyond, or ADMIN, or MM). **Cash market, dashboard, etc.**: `get_funded_user` (CEA and beyond, or ADMIN, or MM). See `backend/app/core/security.py`.
- **Deposit flows** — (1) **Announce → confirm → clear**: Client `POST /api/v1/deposits/announce` (APPROVED→FUNDING); admin confirms (FUNDING→AML, AML hold); admin clears (AML→CEA, funds credited). Use `POST /api/v1/deposits/{id}/confirm` and `.../clear`, or `PUT /backoffice/deposits/{id}/confirm` for immediate confirm (also FUNDING→AML). (2) **Direct create**: Admin `POST /backoffice/deposits` when wire received without prior announce; no role transitions. See `deposit_service` and backoffice docstrings.
- **Client state rule (MANDATORY)** — The state of a client is derived **only** from: (1) **`User.role`** for logged-in users (deposits, users list, profile, redirects); (2) **`ContactRequest.user_role`** for contact/NDA requests (NDA, KYC, REJECTED). **Do not use `request_type` or `status`** (or any other field) as the source for user/request state; the `request_type` column has been removed and contact request state is in `user_role` only. Everywhere a client appears (deposits, backoffice, contact requests, user modals), display and logic must use **only** `user_role` / `user.role` or `request.user_role` as appropriate.
- **Client WebSocket** — Authenticated users (especially AML) can receive realtime events when their role changes on the backend. Endpoint: **WS /api/v1/client/ws** with query param `token=<jwt>`. When admin clears a deposit (AML→CEA), the backend broadcasts `role_updated` to affected user IDs; the frontend hook **`useClientRealtime`** (mounted in Layout) refetches **GET /users/me** and updates the auth store with `setAuth(user, token)`. **User.role** remains SSOT; the WebSocket only notifies the client to refetch and refresh the UI.
- **Role / status transitions** — Platforma folosește DOAR regulile din `docs/ROLE_TRANSITIONS.md` (tabel De la → La). Starea contact request se citește/actualizează prin `user_role`. User role se schimbă doar prin create-from-request, approve_user, reject_user, announce_deposit, confirm_deposit, clear_deposit, reject_deposit și `role_transitions`. APPROVED→FUNDING doar la primul announce_deposit reușit (nu există „fund user” manual).
- **Client status (user_role)** — Deposit UIs (Onboarding Deposits tab, AML tab, Backoffice Deposits page) show **client status** from a single source: **`user_role`** (reporting user’s role). When the client announces a transfer, the backend sets `user.role = FUNDING`; the API returns `user_role` and UIs display it consistently in cards and tables. Both the deposits API (`deposit_to_response`) and **`GET /api/v1/backoffice/deposits`** include `user_role` (optional when no reporting user; backoffice falls back to first entity user). The backoffice list uses `selectinload` and a single batch query for fallback users to avoid N+1. Frontend uses **`ClientStatusBadge`** (`frontend/src/components/common/ClientStatusBadge.tsx`) and **`clientStatusVariant`** (`frontend/src/utils/roleBadge.ts`); consumers support both `user_role` and `userRole` (camelCase) from the API. See `frontend/docs/DESIGN_SYSTEM.md` § Badges → Client status badge.
- **Backoffice deposits API** — **`GET /api/v1/backoffice/deposits`** (Admin). Query: `status` (optional, e.g. `pending`|`on_hold`), `entity_id` (optional UUID). Response: list of `{ id, entity_id, entity_name, user_email, user_role, reported_amount, reported_currency, amount, currency, wire_reference, bank_reference, status, reported_at, confirmed_at, confirmed_by, notes, created_at }`. `user_role` is the reporting user’s role (or first entity user when no `user_id`); omitted if none.

## 9. UI/UX & Design System (Interface Standards)
All UI changes must follow the established interface standards. Reference these files when implementing or reviewing frontend code:

| Purpose | File |
|--------|------|
| Design system principles, tokens, theme, component requirements | `docs/commands/interface.md` |
| Full design system doc (colors, typography, spacing, components) | `frontend/docs/DESIGN_SYSTEM.md` |
| CSS variables and utility classes (light/dark) | `frontend/src/styles/design-tokens.css` |
| Tailwind theme (navy, emerald; no slate/gray) | `frontend/tailwind.config.js` |
| Dev rules (no hard-coded colors; Tailwind tokens) | `.cursor/rules/niha-core.mdc` |

- **Colors**: Use Tailwind tokens `navy-*`, `emerald-*`, `amber-*` (CEA), `blue-*` (EUA), `red-*` (error/sell). Do not use `slate-*`, `gray-*`, or hard-coded hex/RGB.
- **Components**: Prefer reusable components from `frontend/src/components/common/` (Button, Card, Input, PageHeader, Badge, **ClientStatusBadge**, etc.) and design-token utility classes. Use **ClientStatusBadge** (or `clientStatusVariant` from `utils/roleBadge`) for deposit/client role display in cards and tables; it uses design tokens only.
- **Section/card wrapper**: Use `.card_back` class or `<Card />` for page sections and card containers. Params in `design-tokens.css`: `--color-card-back-bg`, `--color-card-back-border`, `--radius-card-back`. See `frontend/docs/DESIGN_SYSTEM.md` § Cards.
- **Compact list rows**: Use `.card_contact_request_list` for compact list rows (e.g. Contact Requests: Entitate, Nume, Data completării + actions). Defined in `frontend/src/index.css`; uses Tailwind navy tokens only.
- **Theme**: Light/dark via class on root; tokens in `design-tokens.css` and Tailwind `dark:` variants.
- **Backoffice nav levels**: Subheader nav uses `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive`. SubSubHeader nav (child-level, e.g. Onboarding subpages) uses `.subsubheader-nav-btn*` and count badge `.subsubheader-nav-badge`; all in `design-tokens.css`.
- **Admin role simulation floater**: `RoleSimulationFloater` (`frontend/src/components/admin/RoleSimulationFloater.tsx`) is visible only when `user?.role === 'ADMIN'`. Fixed bottom-right (`bottom-4 right-4`), `z-40` (below modals). Uses design tokens only (navy, emerald for focus); supports light/dark via `dark:` variants. Label "Simulare rol (test)", select with all UserRole values plus "Fără simulare". `aria-label` on group and select for accessibility.

## 10. Frozen Files (Do Not Refactor)

The following files are **locked** and should NOT be refactored, restructured, or have their inline styles converted to Tailwind classes. They work as intended and any changes risk breaking their carefully crafted layouts.

| File | Reason |
|------|--------|
| `frontend/src/pages/onboarding/EuaHoldersPage.tsx` | Complex marketing layout, frozen |
| `frontend/src/pages/onboarding/EuEntitiesPage.tsx` | Complex marketing layout, frozen |
| `frontend/src/pages/onboarding/CeaHoldersPage.tsx` | Complex marketing layout, frozen |
| `frontend/src/pages/onboarding/AboutNihaoPage.tsx` | Complex marketing layout, frozen |
| `frontend/src/pages/onboarding/MarketOverviewPage.tsx` | Complex marketing layout, frozen |
| `frontend/src/pages/onboarding/OnboardingIndexPage.tsx` | Onboarding entry, frozen |
| `frontend/src/pages/LoginPage.tsx` | Login page, frozen |
| `frontend/src/pages/LoginPageAnimations.tsx` | Login animations, frozen |
| `frontend/src/pages/Onboarding1Page.tsx` | Legacy onboarding, frozen |

**Rules for frozen files:**
- Bug fixes are allowed
- Security fixes are allowed
- Do NOT refactor inline styles to Tailwind
- Do NOT split into smaller components
- Do NOT change file structure
- Functionality changes require explicit user approval
