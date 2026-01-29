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
- **Start Dev**: `docker-compose up`
- **Rebuild**: `./rebuild.sh` (Stops, cleans, builds, starts)
- **Run Backend Tests**: `docker-compose exec backend pytest`
- **Run Migrations**: `docker-compose exec backend alembic upgrade head` — Current head is a single baseline revision (`2026_01_29_baseline`). Schema is created and kept in sync by app startup (`init_db()` / `Base.metadata.create_all`). New migrations should set `down_revision = "2026_01_29_baseline"`. Old migrations are archived under `backend/alembic/versions/archive/` and are not run.

## 8. Frontend Routing (Backoffice & Role-Based Access)
- **PENDING-only onboarding** — Authenticated users with role PENDING can access only: `/onboarding`, its sub-routes (`/onboarding/market-overview`, `/onboarding/about-nihao`, etc.), `/onboarding1`, `/learn-more`, and public routes (`/contact`, `/setup-password`, `/login`). Any attempt to access `/profile`, `/dashboard`, `/funding`, `/cash-market`, `/settings`, `/users`, `/components`, `/design-system`, or backoffice routes redirects PENDING to `/onboarding`. Post-login redirect for PENDING is `/onboarding` (centralized in `frontend/src/utils/redirect.ts` via `getPostLoginRedirect`).
- **AuthGuard** — Single source of truth for auth redirects (`frontend/src/App.tsx`). Order: authentication → `allowedRoles` → `blockRoles`. Optional `blockRoles` and `redirectWhenBlocked` (default `/onboarding`) block specific roles (e.g. PENDING) and redirect them. When `allowedRoles` is set and user is not in the list, redirect target is `redirectTo ?? getPostLoginRedirect(user)` so non-allowed users (e.g. PENDING on `/funding`) get one-hop redirect to their home.
- **Route wrappers** — `ProtectedRoute` and `DashboardRoute` use AuthGuard with `blockRoles={['PENDING']}` and `redirectWhenBlocked="/onboarding"`. `OnboardingRoute` uses AuthGuard with `requireAuth={true}` only (no blockRoles), so only authenticated users see onboarding. `ApprovedRoute` uses role-based redirect (no fixed `redirectTo`) so PENDING goes to `/onboarding` in one hop. Catch-all route (`path="*"`) uses `CatchAllRedirect`: authenticated users go to `getPostLoginRedirect(user)`, unauthenticated to `/login`.
- **Backoffice routes** (`/backoffice`, `/backoffice/market-makers`, `/backoffice/deposits`, etc.) use the **same** main site `Layout` as the rest of the app (one Header, one Footer). Each backoffice page renders `BackofficeLayout` (Subheader + optional SubSubHeader + content) inside that Layout.
- **Default view**: Visiting `/backoffice` redirects to **Onboarding** → `/backoffice/onboarding/requests`. Onboarding subpages (Contact Requests, KYC Review, Deposits) are at `/backoffice/onboarding/requests`, `/backoffice/onboarding/kyc`, `/backoffice/onboarding/deposits`. Their nav lives in the **SubSubHeader** (left-aligned links; right side: refresh, connection status when on Contact Requests).
- **Error boundary**: Backoffice routes are wrapped in `BackofficeErrorBoundary`, which catches render errors, displays the error message in UI, and logs via `logger.error` (with `componentStack`). Ensures a blank page is never shown on backoffice render failure.
- **Navigation**: The main Header provides site-wide navigation (Dashboard, Backoffice, etc.). BackofficeLayout **Subheader** shows compact nav (icon-only buttons; page name on hover; active page shows icon + label) via `SubheaderNavButton`. **SubSubHeader** nav (e.g. Onboarding subpages) uses distinct button classes (`.subsubheader-nav-btn*`) and count badge (`.subsubheader-nav-badge`) from `frontend/src/styles/design-tokens.css`; see `frontend/docs/DESIGN_SYSTEM.md`.
- **Contact/NDA requests**: POST `/contact/request` and POST `/contact/nda-request` return `ContactRequestResponse` (id, entity_name, contact_email, contact_name, position, request_type, nda_file_name, submitter_ip, status, notes, created_at). WebSocket `new_request` payload matches this shape. The frontend normalizes API and WebSocket contact-request payloads (camelCase) to snake_case at the realtime hook boundary (`useBackofficeRealtime`) so backoffice code can assume snake_case. All DB writes in `backend/app/api/v1/contact.py` use try/except, rollback, and `handle_database_error` from `app/core/exceptions`. Admin update contact request (`PUT /admin/contact-requests/{id}`) uses the same error-handling pattern.
- **Backoffice Contact Requests UI**: The list on `/backoffice/onboarding/requests` displays `entity_name` and `contact_name` per row (fallback "—" when missing). The View (eye) button opens a modal that shows all ContactRequest fields (id, entity_name, contact_name, contact_email, position, request_type, status, nda_file_name, submitter_ip, notes, created_at) with theme tokens; the NDA is presented as a button labeled "Link to attached PDF for verification" that opens the PDF in a new browser tab (frontend calls `adminApi.openNDAInBrowser`; backend `GET /admin/contact-requests/{id}/nda` returns the blob). If the browser blocks the pop-up, the UI shows "Allow pop-ups for this site and try again." View, Approve, Reject, and Delete buttons use safe `aria-label` fallbacks: `entity_name ?? contact_email ?? id ?? 'contact request'` so labels never show "undefined".
- **Settings page**: Platform Settings (e.g. `/backoffice/settings` or equivalent) include **Price Scraping Sources** and **Mail & Authentication**. Mail & Auth (admin-only) configures mail provider (Resend vs SMTP), from address, invitation subject/body/link base URL, token expiry days, and placeholders for verification/auth method. See `docs/api/SETTINGS_API.md` for `GET/PUT /admin/settings/mail`.

## 9. UI/UX & Design System (Interface Standards)
All UI changes must follow the established interface standards. Reference these files when implementing or reviewing frontend code:

| Purpose | File |
|--------|------|
| Design system principles, tokens, theme, component requirements | `docs/commands/interface.md` |
| Full design system doc (colors, typography, spacing, components) | `frontend/docs/DESIGN_SYSTEM.md` |
| CSS variables and utility classes (light/dark) | `frontend/src/styles/design-tokens.css` |
| Tailwind theme (navy, emerald; no slate/gray) | `frontend/tailwind.config.js` |
| Compliance checker (slate/gray, hex/RGB) | `frontend/scripts/check-design-system.js` |
| Dev rules (no hard-coded colors; Tailwind tokens) | `.cursor/rules/niha-core.mdc` |

- **Colors**: Use Tailwind tokens `navy-*`, `emerald-*`, `amber-*` (CEA), `blue-*` (EUA), `red-*` (error/sell). Do not use `slate-*`, `gray-*`, or hard-coded hex/RGB.
- **Components**: Prefer reusable components from `frontend/src/components/common/` (Button, Card, Input, PageHeader, Badge, etc.) and design-token utility classes.
- **Section/card wrapper**: Use `.card_back` class or `<Card />` for page sections and card containers. Params in `design-tokens.css`: `--color-card-back-bg`, `--color-card-back-border`, `--radius-card-back`. See `frontend/docs/DESIGN_SYSTEM.md` § Cards.
- **Compact list rows**: Use `.card_contact_request_list` for compact list rows (e.g. Contact Requests: Entitate, Nume, Data completării + actions). Defined in `frontend/src/index.css`; uses Tailwind navy tokens only.
- **Theme**: Light/dark via class on root; tokens in `design-tokens.css` and Tailwind `dark:` variants.
- **Backoffice nav levels**: Subheader nav uses `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive`. SubSubHeader nav (child-level, e.g. Onboarding subpages) uses `.subsubheader-nav-btn*` and count badge `.subsubheader-nav-badge`; all in `design-tokens.css`.
