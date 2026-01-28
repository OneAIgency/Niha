# Changelog

All notable changes to the Nihao Carbon Platform are documented in this file.

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
