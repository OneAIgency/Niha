# Backoffice Layout Refactor

**Date**: 2026-01-26  
**Status**: ✅ Complete  
**Version**: 1.0.0

## Overview

The backoffice layout has been refactored to provide a more compact, efficient navigation system with improved UX. The large card-based navigation has been replaced with compact button-based navigation integrated into the Subheader, and a new `SubSubHeader` component has been introduced for page-specific actions and filters.

## Changes Summary

### Navigation System
- **Before**: Large gradient cards (4 cards in a grid) taking significant vertical space
- **After**: Compact navigation buttons integrated into Subheader, saving space and improving navigation efficiency

### New Component: SubSubHeader
- Introduced `SubSubHeader` component for page-specific content (filters, actions, toggles)
- Supports left-aligned content (e.g., CEA/EUA toggle) and right-aligned actions (buttons)
- Automatically shows/hides based on content presence

### Route-Based Configuration
- Dynamic icon and description based on current route
- Active route highlighting with proper nested route support
- Consistent "Backoffice" title across all pages

## Components

### BackofficeLayout

**Location**: `frontend/src/components/layout/BackofficeLayout.tsx`

A shared layout component for all backoffice pages that provides:
- Consistent Subheader with route-based icon and description
- Compact navigation buttons in Subheader
- Optional SubSubHeader for page-specific content
- Standardized content container

**Props**:
```typescript
interface BackofficeLayoutProps {
  children: ReactNode;
  /** Optional left-aligned content in SubSubHeader (e.g. CEA|Swap toggle) */
  subSubHeaderLeft?: ReactNode;
  /** Optional right-aligned content in SubSubHeader (actions, buttons) */
  subSubHeader?: ReactNode;
}
```

**Usage**:
```tsx
<BackofficeLayout
  subSubHeaderLeft={<CEAToggle />}
  subSubHeader={<Button>Action</Button>}
>
  {/* Page content */}
</BackofficeLayout>
```

**Features**:
- Route-based icon and description configuration
- Active route detection with nested route support
- Accessibility: ARIA labels, `aria-current` for active routes
- Responsive design

### SubSubHeader

**Location**: `frontend/src/components/common/SubSubHeader.tsx`

A flexible bar component rendered under the Subheader for page-specific content.

**Props**:
```typescript
interface SubSubHeaderProps {
  /** Left-aligned content (e.g. CEA|Swap toggle) */
  left?: ReactNode;
  /** Right-aligned content (actions, buttons) */
  children?: ReactNode;
  /** Optional additional className for the container */
  className?: string;
}
```

**Usage**:
```tsx
<SubSubHeader left={<Toggle />}>
  <Button onClick={onRefresh}>Refresh</Button>
  <Button onClick={onCreate}>Create</Button>
</SubSubHeader>
```

**Layout Behavior**:
- When `left` is provided: Uses `justify-between` layout
- When only `children` is provided: Right-aligned content
- Automatically hides if both props are null/undefined

## Updated Pages

### BackofficePage
- Removed large navigation cards
- Uses `BackofficeLayout` with no SubSubHeader
- Maintains all existing functionality (tabs, modals, etc.)

### MarketMakersPage
- Uses `BackofficeLayout` with SubSubHeader
- Actions: "Create Market Maker" and "Refresh" buttons
- Maintains all existing functionality

### MarketOrdersPage
- Uses `BackofficeLayout` with SubSubHeader
- **Left side**: CEA/EUA certificate type toggle
- **Right side**: "Place BID", "Place ASK", and "Refresh" buttons
- Improved order placement with unified error handling
- Modal-based order placement with proper state management

### LoggingPage
- Uses `BackofficeLayout` with no SubSubHeader
- Maintains existing tab navigation

### UsersPage
- Uses `BackofficeLayout` with SubSubHeader
- Action: "Create User" button
- Maintains all existing functionality

## Technical Improvements

### Error Handling
- Unified order submission with comprehensive error handling
- Error messages displayed in modals
- Proper error state management

### State Management
- Buttons disabled during submission (prevents duplicate orders)
- Modal state properly managed
- Loading states for async operations

### Accessibility
- ARIA labels on navigation
- `aria-current` for active routes
- Proper modal roles and labels
- Keyboard navigation support

### Design System Compliance
- Uses navy-* color tokens (replaced hardcoded emerald/red)
- Consistent spacing and typography
- Responsive design patterns

## Route Configuration

The layout automatically configures icon and description based on the current route:

| Route | Icon | Description |
|-------|------|-------------|
| `/backoffice` | FileText | Review access requests, KYC documents, and user activity |
| `/backoffice/market-makers` | Bot | Manage MM clients and assets |
| `/backoffice/market-orders` | ShoppingCart | Place orders for MM clients |
| `/backoffice/logging` | Activity | View comprehensive audit trail |
| `/users` | Users | Manage platform users |

## Navigation Structure

The compact navigation includes:
1. **Market Makers** - `/backoffice/market-makers`
2. **Market Orders** - `/backoffice/market-orders`
3. **Audit Logging** - `/backoffice/logging`
4. **Users** - `/users`

Active route is highlighted with `bg-navy-600 text-white`, inactive routes use `text-navy-400` with hover states.

## Migration Notes

### For Developers

When creating new backoffice pages:

1. **Use BackofficeLayout**:
   ```tsx
   import { BackofficeLayout } from '../components/layout';
   
   export function NewBackofficePage() {
     return (
       <BackofficeLayout
         subSubHeaderLeft={/* optional */}
         subSubHeader={/* optional */}
       >
         {/* Page content */}
       </BackofficeLayout>
     );
   }
   ```

2. **Add route configuration** if needed:
   - Add route to `BackofficeRoute` type
   - Add entry to `ROUTE_CONFIG` with icon, colors, and description
   - Add navigation item to `BACKOFFICE_NAV` array

3. **Use SubSubHeader** for page-specific content:
   - Filters, toggles → `subSubHeaderLeft`
   - Action buttons → `subSubHeader`

### Breaking Changes

- **None** - All existing functionality preserved
- Navigation cards removed but functionality maintained
- All pages continue to work as before

## Testing

### Manual Testing Checklist

- [x] Navigation buttons work correctly
- [x] Active route highlighting works
- [x] Nested routes properly detected (e.g., `/backoffice/market-makers/123`)
- [x] SubSubHeader shows/hides correctly
- [x] Order placement modals work (BID and ASK)
- [x] Error handling displays correctly
- [x] Buttons disable during submission
- [x] Order book refreshes after order placement
- [x] Responsive design works on mobile/tablet
- [x] Accessibility features work (keyboard navigation, screen readers)

## Performance

- **Navigation**: Instant (client-side routing)
- **Layout rendering**: No performance impact
- **SubSubHeader**: Conditional rendering (only when content provided)

## Future Enhancements

Potential improvements:
- Breadcrumb navigation for nested routes
- Keyboard shortcuts for navigation
- Navigation history tracking
- Customizable navigation order (admin preference)

## Related Documentation

- [Backoffice API Documentation](../api/BACKOFFICE_API.md)
- [Code Review Notes](./BACKOFFICE_LAYOUT_REFACTOR_REVIEW.md)
- [Component Documentation](../../frontend/src/components/common/SubSubHeader.tsx)

---

**Last Updated**: 2026-01-26  
**Maintained By**: Development Team
