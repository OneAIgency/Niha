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
- **Email**: `RESEND_API_KEY` (Resend)
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
- **Run Migrations**: `docker-compose exec backend alembic upgrade head`

## 8. Frontend Routing (Backoffice)
- **Backoffice routes** (`/backoffice`, `/backoffice/market-makers`, `/backoffice/deposits`, etc.) use the **same** main site `Layout` as the rest of the app (one Header, one Footer). Each backoffice page renders `BackofficeLayout` (Subheader + optional SubSubHeader + content) inside that Layout.
- **Default view**: Visiting `/backoffice` redirects to **Onboarding** → `/backoffice/onboarding/requests`. Onboarding subpages (Contact Requests, KYC Review, Deposits) are at `/backoffice/onboarding/requests`, `/backoffice/onboarding/kyc`, `/backoffice/onboarding/deposits`. Their nav lives in the **SubSubHeader** (left-aligned links; right side: refresh, connection status when on Contact Requests).
- **Error boundary**: Backoffice routes are wrapped in `BackofficeErrorBoundary`, which catches render errors, displays the error message in UI, and logs via `logger.error` (with `componentStack`). Ensures a blank page is never shown on backoffice render failure.
- **Navigation**: The main Header provides site-wide navigation (Dashboard, Backoffice, etc.). BackofficeLayout **Subheader** shows compact nav (icon-only buttons; page name on hover; active page shows icon + label) via `SubheaderNavButton`. **SubSubHeader** nav (e.g. Onboarding subpages) uses distinct button classes (`.subsubheader-nav-btn*`) and count badge (`.subsubheader-nav-badge`) from `frontend/src/styles/design-tokens.css`; see `frontend/docs/DESIGN_SYSTEM.md`.

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
- **Theme**: Light/dark via class on root; tokens in `design-tokens.css` and Tailwind `dark:` variants.
- **Backoffice nav levels**: Subheader nav uses `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive`. SubSubHeader nav (child-level, e.g. Onboarding subpages) uses `.subsubheader-nav-btn*` and count badge `.subsubheader-nav-badge`; all in `design-tokens.css`.
