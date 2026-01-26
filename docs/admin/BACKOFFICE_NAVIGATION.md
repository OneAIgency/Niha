# Backoffice Layout & Navigation

**Last updated:** 2026-01-26

## Overview

The backoffice uses a shared layout (`BackofficeLayout`) with a **Subheader** (route-based icon and description, compact nav) and an optional **SubSubHeader** for page-specific content (filters, toggles, actions).

## Routes & Navigation

Navigation links are defined in `BACKOFFICE_NAV` and rendered in the Subheader:

| Route | Label | Description |
|-------|-------|-------------|
| `/backoffice` | (dashboard) | Review access requests, KYC, user activity |
| `/backoffice/market-makers` | Market Makers | Manage MM clients and assets |
| `/backoffice/market-orders` | Market Orders | Place orders for MM clients |
| `/backoffice/order-book` | Order Book | View order book & place MM orders |
| `/backoffice/liquidity` | Liquidity | Create liquidity |
| `/backoffice/logging` | Audit Logging | View audit trail |
| `/users` | Users | Manage platform users |

**Nested routes:** Active state supports nested paths (e.g. `/backoffice/market-makers/123` matches Market Makers). The `isRouteActive` helper checks `pathname === route` or `pathname.startsWith(route + '/')`.

## SubSubHeader

Rendered under the Subheader when `subSubHeaderLeft` and/or `subSubHeader` are passed to `BackofficeLayout`.

- **Left slot (`subSubHeaderLeft`):** Toggles, filters, etc. Aligned left.
- **Right slot (`subSubHeader`):** Action buttons, refresh. Aligned right.
- If both are set, layout uses `justify-between`. If only right content, `justify-end`.

**Example:**

```tsx
<BackofficeLayout
  subSubHeaderLeft={<CEA_EUA_Toggle />}
  subSubHeader={
    <>
      <Button onClick={onCreate}>Create</Button>
      <Button variant="ghost" onClick={onRefresh}>Refresh</Button>
    </>
  }
>
  <PageContent />
</BackofficeLayout>
```

Page-specific UI belongs in SubSubHeader; keep the dashboard Subheader generic (icon, title, description, nav only).

## Route Configuration

Each route has a `RouteConfig`: `icon`, `iconBg`, `iconColor`, `description`. The Subheader shows the current route’s icon and description. Config lives in `ROUTE_CONFIG` in `BackofficeLayout`.

## Components

- **`BackofficeLayout`** – `frontend/src/components/layout/BackofficeLayout.tsx`
- **`SubSubHeader`** – `frontend/src/components/common/SubSubHeader.tsx`
- **`Subheader`** – `frontend/src/components/common/Subheader.tsx`

## See Also

- [PlaceOrder component](../api/PLACE_ORDER_COMPONENT.md) – Used in Market Orders (and Order Book) for BID/ASK placement
- [Market Makers guide](MARKET_MAKERS_GUIDE.md) – MM management and workflows
