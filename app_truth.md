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
- **Scraping**: Updates every 300s (5 mins)

## 5. Business Logic Truths
- **Settlement Cycle**: T+3 Business Days for CEA purchases.
- **Currencies**:
  - Base: EUR / CNY
  - Conversions: `EUR_TO_USD=1.08`, `CNY_TO_USD=0.14` (Default static values)
- **Market Defaults**:
  - EUA Price: €75.00
  - CEA Price: ¥100.00

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
- **Run Migrations**: `docker compose exec backend alembic upgrade head` — Current head is `2026_01_29_full_flow` (chain: `2026_01_29_baseline` → `mail_config` → `onboarding` → `simplify` → `nda_only` → `full_flow`). Schema is also created at app startup via `init_db()` / `Base.metadata.create_all`; migrations alter schema over time. New migrations should set `down_revision = "2026_01_29_full_flow"` (or current head). Old migrations are archived under `backend/alembic/versions/archive/` and are not run.

## 8. Frontend Routing (Backoffice & Role-Based Access)
- **NDA/KYC onboarding** — Authenticated users with role **NDA** or **KYC** can access only: `/onboarding`, its sub-routes (`/onboarding/market-overview`, `/onboarding/about-nihao`, etc.), `/onboarding1`, `/learn-more`, and public routes (`/contact`, `/setup-password`, `/login`). Any attempt to access `/profile`, `/dashboard`, `/funding`, `/cash-market`, `/settings`, `/users`, `/components`, `/design-system`, or backoffice routes redirects them to `/onboarding`. Post-login redirect for NDA/KYC is `/onboarding` (centralized in `frontend/src/utils/redirect.ts` via `getPostLoginRedirect`). **REJECTED** users redirect to `/login`. There is no `PENDING` role; onboarding flow is NDA → KYC → … → EUA (see `frontend/src/types/index.ts` `UserRole`).
- **AuthGuard** — Single source of truth for auth redirects (`frontend/src/App.tsx`). Order: authentication → `allowedRoles` → `blockRoles`. Optional `blockRoles` and `redirectWhenBlocked` (default `/onboarding`) block specific roles (e.g. NDA) and redirect them. When `allowedRoles` is set and user is not in the list, redirect target is `redirectTo ?? getPostLoginRedirect(user)` so non-allowed users get one-hop redirect to their home.
- **Route wrappers** — `ProtectedRoute` uses AuthGuard with `blockRoles={['NDA']}` and `redirectWhenBlocked="/onboarding"`. `DashboardRoute` uses AuthGuard with `allowedRoles={['EUA', 'ADMIN']}` (no blockRoles). `OnboardingRoute` uses `allowedRoles={['NDA', 'KYC']}` so only NDA and KYC (and ADMIN via other routes) can access onboarding. `ApprovedRoute` (e.g. funding) uses `allowedRoles={['APPROVED', 'FUNDING', 'AML', 'ADMIN']}`; non-allowed users redirect via `getPostLoginRedirect(user)` (e.g. NDA → `/onboarding`). Catch-all route (`path="*"`) uses `CatchAllRedirect`: authenticated users go to `getPostLoginRedirect(user)`, unauthenticated to `/login`.
- **Backoffice routes** (`/backoffice`, `/backoffice/market-makers`, `/backoffice/deposits`, etc.) use the **same** main site `Layout` as the rest of the app (one Header, one Footer). Each backoffice page renders `BackofficeLayout` (Subheader + optional SubSubHeader + content) inside that Layout.
- **Default view**: Visiting `/backoffice` redirects to **Onboarding** → `/backoffice/onboarding/requests`. Onboarding subpages (Contact Requests, KYC Review, Deposits) are at `/backoffice/onboarding/requests`, `/backoffice/onboarding/kyc`, `/backoffice/onboarding/deposits`. Their nav lives in the **SubSubHeader** (left-aligned links; right side: refresh, connection status when on Contact Requests).
- **Error boundary**: Backoffice routes are wrapped in `BackofficeErrorBoundary`, which catches render errors, displays the error message in UI, and logs via `logger.error` (with `componentStack`). Ensures a blank page is never shown on backoffice render failure.
- **Navigation**: The main Header provides site-wide navigation (Dashboard, Backoffice, etc.). BackofficeLayout **Subheader** shows compact nav (icon-only buttons; page name on hover; active page shows icon + label) via `SubheaderNavButton`. **SubSubHeader** nav (e.g. Onboarding subpages) uses distinct button classes (`.subsubheader-nav-btn*`) and count badge (`.subsubheader-nav-badge`) from `frontend/src/styles/design-tokens.css`; see `frontend/docs/DESIGN_SYSTEM.md`.
- **Contact/NDA requests**: POST `/contact/request` and POST `/contact/nda-request` return `ContactRequestResponse` (id, entity_name, contact_email, contact_name, position, request_type, nda_file_name, submitter_ip, status, notes, created_at). WebSocket `new_request` payload matches this shape. The frontend normalizes API and WebSocket contact-request payloads (camelCase) to snake_case at the realtime hook boundary (`useBackofficeRealtime`) so backoffice code can assume snake_case. All DB writes in `backend/app/api/v1/contact.py` use try/except, rollback, and `handle_database_error` from `app/core/exceptions`. Admin update contact request (`PUT /api/v1/admin/contact-requests/{request_id}`) uses the same error-handling pattern.
- **Backoffice Contact Requests UI**: The list on `/backoffice/onboarding/requests` displays `entity_name` and `contact_name` per row (fallback "—" when missing). The View (eye) button opens a modal that shows all ContactRequest fields (id, entity_name, contact_name, contact_email, position, request_type, status, nda_file_name, submitter_ip, notes, created_at) with theme tokens; the NDA is presented as a button labeled "Link to attached PDF for verification" that opens the PDF in a new browser tab (frontend calls `adminApi.openNDAInBrowser`; backend `GET /api/v1/admin/contact-requests/{request_id}/nda` returns the blob). If the browser blocks the pop-up, the UI shows "Allow pop-ups for this site and try again." View, Approve, Reject, and Delete buttons use safe `aria-label` fallbacks: `entity_name ?? contact_email ?? id ?? 'contact request'` so labels never show "undefined".
- **Approve & Create User**: Approve is shown only for contact requests with status NDA or new. It opens the "Approve & Create User" modal (`ApproveInviteModal`). Admin chooses **manual** (password ≥8, user active immediately) or **invitation** (email sent, user sets password via link). Form is prefilled from the contact request (email, name split into first/last, position). Submit calls `POST /api/v1/admin/users/create-from-request` with Query params: `request_id`, `email`, `first_name`, `last_name`, `mode` (`manual`|`invitation`), optional `password`, `position`. Backend: creates Entity (name from contact_request.entity_name, jurisdiction OTHER, KYC PENDING); creates User (role KYC, linked to entity; manual: active, password set; invitation: inactive, invitation token and email after commit, MailConfig for expiry—send failure is logged, no rollback); sets contact_request.status = KYC; commits. WebSocket broadcast: `request_updated` (full contact request payload with status KYC), `user_created` (id, email, first_name, last_name, role). Errors: 400 invalid request_id or duplicate email or password validation; 404 contact request not found; 400/409/500 from `handle_database_error` with optional `details.hint`. Frontend displays message and hint (truncated ~150 chars) from standardized API error shape (`message`, `data.detail`, 422 `detail[0].msg`, or `detail.error` + `details.hint`).
- **Settings page**: Platform Settings at **`/settings`** (admin-only) include **Price Scraping Sources** and **Mail & Authentication**. Mail & Auth configures mail provider (Resend vs SMTP), from address, invitation subject/body/link base URL, token expiry days, and placeholders for verification/auth method. Backend: `GET/PUT /api/v1/admin/settings/mail`.
- **Role-protected APIs** — Backend enforces role checks via dependencies. **Onboarding** (`/api/v1/onboarding/*`): `get_onboarding_user` — NDA, KYC, or ADMIN only. **Swap** (`/api/v1/swaps/*`): `get_swap_user` — SWAP, EUA_SETTLE, EUA, or ADMIN only. **Funding / deposits** (`/api/v1/deposits/*` client endpoints): `get_approved_user` (APPROVED and beyond, or ADMIN). **Cash market, dashboard, etc.**: `get_funded_user` (CEA and beyond, or ADMIN). See `backend/app/core/security.py`.
- **Deposit flows** — (1) **Announce → confirm → clear**: Client `POST /api/v1/deposits/announce` (APPROVED→FUNDING); admin confirms (FUNDING→AML, AML hold); admin clears (AML→CEA, funds credited). Use `POST /api/v1/deposits/{id}/confirm` and `.../clear`, or `PUT /backoffice/deposits/{id}/confirm` for immediate confirm (also FUNDING→AML). (2) **Direct create**: Admin `POST /backoffice/deposits` when wire received without prior announce; no role transitions. See `deposit_service` and backoffice docstrings.
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
