# Backoffice Layout & Navigation

**Last updated:** 2026-01-28

## Overview

The backoffice uses the **same main site Layout** as the rest of the app (one Header, one Footer). Each backoffice page renders `BackofficeLayout` (Subheader + optional SubSubHeader + content) inside that Layout. The main Header provides site-wide navigation (Dashboard, Backoffice, etc.). Visiting `/backoffice` redirects to **Onboarding** → `/backoffice/onboarding/requests`. An error boundary wraps all backoffice routes so render errors are displayed and logged instead of showing a blank page.

## Routes & Navigation

### Subheader (main backoffice nav)

The Subheader shows compact nav via `SubheaderNavButton`: **icon-only** by default; **page name on hover**; **active page** shows icon + label. Classes: `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive` (see `frontend/src/styles/design-tokens.css` and `frontend/docs/DESIGN_SYSTEM.md`).

| Route / Link | Label | Description |
|--------------|-------|-------------|
| `/backoffice/onboarding` | Onboarding | Default; redirects to `/backoffice/onboarding/requests` |
| `/backoffice/market-makers` | Market Makers | Manage MM clients and assets |
| `/backoffice/market-orders` | Market Orders | Place orders for MM clients |
| `/backoffice/liquidity` | Liquidity | Create liquidity |
| `/backoffice/deposits` | Deposits | AML/deposits management (backoffice deposits page) |
| `/backoffice/logging` | Audit Logging | View audit trail |
| `/users` | Users | Manage platform users |

**Active state:** `isRouteActive(pathname, route)` matches exact path or nested paths (e.g. `/backoffice/market-makers/123` matches Market Makers).

### Onboarding subpages (SubSubHeader nav)

When on **Onboarding**, the **SubSubHeader** shows subpage links (left) and actions (right: refresh, connection status on Contact Requests). Subpages use **distinct button classes** (child-level under Subheader): `.subsubheader-nav-btn`, `.subsubheader-nav-btn-active`, `.subsubheader-nav-btn-inactive`. Pending counts use `.subsubheader-nav-badge` (red background, high visibility). See `design-tokens.css` and DESIGN_SYSTEM.md.

| Route | Label | Content |
|-------|-------|---------|
| `/backoffice/onboarding/requests` | Contact Requests | Contact requests tab (real-time) |
| `/backoffice/onboarding/kyc` | KYC Review | KYC document review |
| `/backoffice/onboarding/deposits` | Deposits | Pending deposits (confirm/reject) |

Redirects: `/backoffice` → `/backoffice/onboarding` → `/backoffice/onboarding/requests`.

## SubSubHeader (generic)

Rendered under the Subheader when `subSubHeaderLeft` and/or `subSubHeader` are passed to `BackofficeLayout`.

- **Left slot (`subSubHeaderLeft`):** Toggles, filters, or subpage nav (e.g. Onboarding: Contact Requests, KYC, Deposits). Aligned left.
- **Right slot (`subSubHeader`):** Action buttons, refresh, connection status. Aligned right.
- If both are set, layout uses `justify-between`. If only right content, `justify-end`.
- Bar uses `flex items-center min-h-[3rem]`; tokens `bg-navy-900/80`, `border-navy-700`.

**Example (Onboarding):**

```tsx
<BackofficeLayout
  subSubHeaderLeft={<OnboardingSubpageNav />}
  subSubHeader={<RefreshButton />}
>
  <ContactRequestsTab | KYCReviewTab | PendingDepositsTab />
</BackofficeLayout>
```

Page-specific UI belongs in SubSubHeader; keep the Subheader generic (icon, title, description, main nav only).

## Route Configuration

Each route has a `RouteConfig`: `icon`, `iconBg`, `iconColor`, `description`. The Subheader shows the current route’s icon and description. Config lives in `ROUTE_CONFIG` in `BackofficeLayout`. Onboarding subroutes (`/backoffice/onboarding/requests`, `kyc`, `deposits`) share the same config (UserPlus icon, emerald, “Contact requests, KYC review, and deposits”).

## Components

### Layout Components

- **`BackofficeLayout`** – `frontend/src/components/layout/BackofficeLayout.tsx`
- **`Subheader`** – `frontend/src/components/common/Subheader.tsx`
- **`SubheaderNavButton`** – `frontend/src/components/common/SubheaderNavButton.tsx` (Subheader nav links)
- **`SubSubHeader`** – `frontend/src/components/common/SubSubHeader.tsx`

### Onboarding

- **`BackofficeOnboardingPage`** – `frontend/src/pages/BackofficeOnboardingPage.tsx` (Contact Requests, KYC, Deposits; SubSubHeader nav and content)
- **`ContactRequestsTab`**, **`KYCReviewTab`**, **`PendingDepositsTab`** – in `frontend/src/components/backoffice/`
- **`DocumentViewerModal`**, **`IPLookupModal`** – used by Onboarding

See [Backoffice Components Architecture](BACKOFFICE_COMPONENTS.md) for detailed component documentation.

## Error Boundary

Backoffice routes are wrapped in `BackofficeErrorBoundary` (in `App.tsx`). On render error it shows the error message in UI and logs via `logger.error` with `componentStack`. This prevents a blank page when a backoffice component throws.

## See Also

- [Backoffice Components Architecture](BACKOFFICE_COMPONENTS.md) – Component structure and usage
- [PlaceOrder component](../api/PLACE_ORDER_COMPONENT.md) – Used in Market Orders for BID/ASK placement
- [Market Makers guide](MARKET_MAKERS_GUIDE.md) – MM management and workflows
- [Design system](../../frontend/docs/DESIGN_SYSTEM.md) – Subheader / SubSubHeader nav token classes and states
