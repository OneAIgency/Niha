# Backoffice Subheader Navigation

**Date:** 2026-01-26  
**Status:** ✅ Implemented  
**Components:** `BackofficeLayout`, `Subheader`, `SubSubHeader`

## Overview

The backoffice subheader navigation feature adds compact navigation buttons directly in the subheader, providing quick access to all backoffice subpages. The subheader dynamically displays route-specific icons and descriptions, maintaining consistency across all backoffice pages.

## Features

### Navigation Buttons

Four navigation buttons are displayed in the subheader:
- **Market Makers** (`/backoffice/market-makers`) - Bot icon, purple theme
- **Market Orders** (`/backoffice/market-orders`) - ShoppingCart icon, emerald theme
- **Audit Logging** (`/backoffice/logging`) - Activity icon, orange theme
- **Users** (`/users`) - Users icon, blue theme

### Route-Based Configuration

Each route has a dedicated configuration with:
- **Icon** - Lucide React icon component
- **Icon Background** - Color-coded background (e.g., `bg-purple-500/20`)
- **Icon Color** - Matching text color (e.g., `text-purple-500`)
- **Description** - Contextual description for the page

### Active State

Navigation buttons automatically highlight the active route:
- **Active:** `bg-navy-600 text-white`
- **Inactive:** `text-navy-400 hover:bg-navy-700 hover:text-navy-300`
- Supports nested routes (e.g., `/backoffice/market-makers/123` highlights Market Makers)

## Implementation

### BackofficeLayout Component

```tsx
<BackofficeLayout
  subSubHeaderLeft={<CEAToggle />}
  subSubHeader={<Button>Refresh</Button>}
>
  <PageContent />
</BackofficeLayout>
```

**Props:**
- `children` - Main page content
- `subSubHeaderLeft` - Optional left-aligned content (filters, toggles)
- `subSubHeader` - Optional right-aligned content (action buttons)

### Route Configuration

Routes are defined with type safety:

```tsx
type BackofficeRoute = 
  | '/backoffice' 
  | '/backoffice/market-makers' 
  | '/backoffice/market-orders' 
  | '/backoffice/logging' 
  | '/users';

const ROUTE_CONFIG: Record<BackofficeRoute, RouteConfig> = {
  '/backoffice/market-makers': {
    icon: Bot,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
    description: 'Manage MM clients and assets',
  },
  // ... other routes
};
```

### Route Matching

The `isRouteActive()` helper function supports both exact and nested route matching:

```tsx
function isRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  // Check if pathname is a nested route
  return pathname.startsWith(route + '/');
}
```

## Design System Compliance

All components use design system tokens:
- **Colors:** `navy-*` tokens (no `slate-*` or hardcoded colors)
- **Spacing:** Tailwind utility classes
- **Typography:** Consistent text sizes and weights
- **Themes:** Full support for light/dark mode

### Subheader Component Migration

The `Subheader` component was migrated from `slate-*` to `navy-*` tokens:
- `bg-slate-900` → `bg-navy-800`
- `border-slate-800` → `border-navy-700`
- `text-slate-400` → `text-navy-400`

## Accessibility

- **ARIA Labels:** Navigation container has `aria-label="Backoffice navigation"`
- **Active Route:** Links use `aria-current="page"` when active
- **Icon Accessibility:** Icons marked with `aria-hidden="true"` (text labels provide context)
- **Semantic HTML:** Uses `<nav>` element for navigation structure
- **Keyboard Navigation:** Full keyboard support via React Router `<Link>` components

## Usage Examples

### Basic Usage

```tsx
export function MarketMakersPage() {
  return (
    <BackofficeLayout>
      <MarketMakersList />
    </BackofficeLayout>
  );
}
```

### With SubSubHeader Actions

```tsx
export function MarketOrdersPage() {
  const [certificateType, setCertificateType] = useState<CertificateType>('CEA');
  
  return (
    <BackofficeLayout
      subSubHeader={
        <>
          <CEAToggle value={certificateType} onChange={setCertificateType} />
          <Button onClick={handleRefresh}>Refresh</Button>
        </>
      }
    >
      <OrderBook certificateType={certificateType} />
    </BackofficeLayout>
  );
}
```

### With Left and Right Content

```tsx
<BackofficeLayout
  subSubHeaderLeft={<FilterDropdown />}
  subSubHeader={
    <>
      <Button variant="ghost">Export</Button>
      <Button variant="primary">Create</Button>
    </>
  }
>
  <Content />
</BackofficeLayout>
```

## Route Configuration

### Adding a New Route

1. Add route to `BackofficeRoute` type:
```tsx
type BackofficeRoute = 
  | '/backoffice'
  | '/backoffice/new-page'  // Add here
  | // ... existing routes
```

2. Add route configuration:
```tsx
const ROUTE_CONFIG: Record<BackofficeRoute, RouteConfig> = {
  '/backoffice/new-page': {
    icon: NewIcon,
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-500',
    description: 'Description of new page',
  },
  // ... existing configs
};
```

3. Add navigation button:
```tsx
const BACKOFFICE_NAV = [
  // ... existing items
  { to: '/backoffice/new-page', label: 'New Page', icon: NewIcon },
] as const;
```

## Troubleshooting

### Navigation Button Not Highlighting

- **Check route matching:** Ensure `isRouteActive()` correctly matches your route
- **Verify route config:** Route must exist in `ROUTE_CONFIG`
- **Check pathname:** Use browser dev tools to verify `pathname` matches expected route

### SubSubHeader Not Showing

- **Check props:** At least one of `subSubHeaderLeft` or `subSubHeader` must be provided
- **Verify rendering:** Ensure props are not `null` or `undefined`

### Design Token Issues

- **Linting errors:** Run `npm run lint` to find any remaining `slate-*` colors
- **Migration guide:** See `docs/DESIGN_TOKENS_MIGRATION.md` for color mappings

## Related Documentation

- [Code Review](./2026-01-26-backoffice-subheader-navigation-buttons_REVIEW.md)
- [Development Guide](../DEVELOPMENT.md) - Design system compliance
- [Design Tokens Migration](../DESIGN_TOKENS_MIGRATION.md) - Color token reference
