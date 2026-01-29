# Backoffice Components Architecture

**Last Updated:** 2026-01-26  
**Version:** 1.1.0

## Overview

The Backoffice Dashboard (`BackofficePage`) has been refactored into modular, reusable components for better maintainability and code organization. This document describes the component architecture, usage, and type definitions.

## Component Structure

### Main Page Component

**`BackofficePage`** (`frontend/src/pages/BackofficePage.tsx`)
- Main container component for the backoffice dashboard
- Manages tab navigation and shared state
- Coordinates data fetching and WebSocket connections
- Delegates rendering to specialized tab components

**Tabs:**
- **Contact Requests** - Managed by `ContactRequestsTab`
- **KYC Review** - Inline implementation with `KYCReviewPanel`
- **Deposits** - Managed by `PendingDepositsTab`
- **User Details** - Inline implementation with search functionality

### Settings Page

**`SettingsPage`** (`frontend/src/pages/SettingsPage.tsx`) — Route: `/settings` (linked from main Header). Platform Settings for admin: **Price Scraping Sources** (EUA/CEA price feeds) and **Mail & Authentication**. Mail & Auth section configures mail provider (Resend or SMTP), from address, invitation subject/body/link base URL, token expiry, and placeholders for verification/auth method. Uses `adminApi.getMailSettings()` and `adminApi.updateMailSettings()`; see [SETTINGS_API.md](../api/SETTINGS_API.md) for `GET/PUT /admin/settings/mail`. UI uses Card/card_back and design tokens only (navy, emerald, amber).

### Extracted Components

#### `ContactRequestsTab`

**Location:** `frontend/src/components/backoffice/ContactRequestsTab.tsx`

**Purpose:** Displays and manages contact requests (join requests and NDA submissions) with real-time WebSocket updates. Contact request data is supplied by `useBackofficeRealtime`, which normalizes API and WebSocket payloads (camelCase) to snake_case so the tab receives `entity_name`, `contact_name`, etc.

**Features:**
- Compact list rows (`.card_contact_request_list`): Entity, Name, Submitted + badge; each row shows `entity_name` and `contact_name` (fallback "—" when missing). View icon opens full-details modal. View, Approve, Reject, and Delete buttons use safe `aria-label` fallbacks (`entity_name ?? contact_email ?? id ?? 'contact request'`) so labels never show "undefined".
- **ContactRequestViewModal**: all contact request fields, NDA open button (opens PDF in new tab), optional IP Lookup; Escape to close, focus trap, exit animation
- Approval/rejection workflows (Approve & Invite, Reject)
- NDA file open in new tab (from View modal)
- IP address lookup (triggered from View modal when `onIpLookup` is passed)
- Delete confirmation modal

**Props:**
```typescript
interface ContactRequestsTabProps {
  contactRequests: ContactRequest[];
  loading: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  onRefresh: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onOpenNDA: (requestId: string) => Promise<void>;
  onIpLookup: (ip: string) => void;
  actionLoading: string | null;
}
```

**Usage:**
```tsx
<ContactRequestsTab
  contactRequests={requests}
  loading={isLoading}
  connectionStatus={wsStatus}
  onRefresh={handleRefresh}
  onApprove={handleApprove}
  onReject={handleReject}
  onDelete={handleDelete}
  onOpenNDA={handleOpenNDA}
  onIpLookup={handleIpLookup}
  actionLoading={actionLoading}
/>
```

`onIpLookup` is used by the View modal: when the user opens a request's details, a "Lookup" link next to the IP field calls `onIpLookup(ip)` and opens the parent's IP lookup modal.

#### `ContactRequestViewModal`

**Location:** `frontend/src/components/backoffice/ContactRequestViewModal.tsx`

**Purpose:** Shows all contact request form data in an overlay modal and provides a button to open the attached NDA PDF in a new browser tab. Used when the user clicks the View (eye) icon on a contact request row.

**Features:**
- All fields in order: ID, Entity, Name, Email, Position, Request type, Status, NDA file name, Submitter IP, Notes, Submitted (theme tokens only; empty optional fields show "—" or are omitted via DataRow)
- NDA section: label "Link to attached PDF for verification" and a button that opens the PDF in a new tab (when `nda_file_name` is present); button disabled while `openNDALoading` is true; label "Open {filename}", loading "Opening…"
- Optional IP Lookup: when `onIpLookup` is passed and `submitter_ip` exists, a "Lookup" link opens the parent's IP lookup flow
- Accessibility: Escape to close, focus moved to close button on open, Tab/Shift+Tab trapped inside modal; NDA button `aria-label` "Open NDA {filename}"
- Exit animation before close

**Props:**
```typescript
interface ContactRequestViewModalProps {
  request: ContactRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNDA: (requestId: string) => Promise<void>;
  onIpLookup?: (ip: string) => void;
  openNDALoading?: boolean;
}
```

**Usage:** Rendered by `ContactRequestsTab` when the user clicks View on a request. Parent passes `onOpenNDA` and `onIpLookup` (e.g. from `BackofficeOnboardingPage`). If the browser blocks the pop-up, the parent should show "Allow pop-ups for this site and try again."

#### `PendingDepositsTab`

**Location:** `frontend/src/components/backoffice/PendingDepositsTab.tsx`

**Purpose:** Manages pending deposit requests with confirmation/rejection functionality.

**Features:**
- List of pending deposits with details
- Deposit confirmation modal with amount/currency input
- Form validation with error feedback
- Rejection workflow
- Loading and empty states

**Props:**
```typescript
interface PendingDepositsTabProps {
  pendingDeposits: PendingDeposit[];
  loading: boolean;
  onConfirm: (depositId: string, amount: number, currency: string, notes?: string) => Promise<void>;
  onReject: (depositId: string) => Promise<void>;
  actionLoading: string | null;
}
```

**Usage:**
```tsx
<PendingDepositsTab
  pendingDeposits={deposits}
  loading={isLoading}
  onConfirm={handleConfirmDeposit}
  onReject={handleRejectDeposit}
  actionLoading={actionLoading}
/>
```

**Validation:**
- Amount must be a valid number > 0
- Currency selection required
- Real-time error feedback
- Accessible error messages with ARIA attributes

#### `DocumentViewerModal`

**Location:** `frontend/src/components/backoffice/DocumentViewerModal.tsx`

**Purpose:** Displays document previews (images, PDFs) or download prompts for unsupported file types.

**Features:**
- Image preview (JPEG, PNG, GIF, WebP, BMP)
- PDF preview via iframe
- Loading states
- Error handling with retry
- Download functionality
- Unsupported file type handling

**Props:**
```typescript
interface DocumentViewerModalProps {
  document: DocumentViewerState | null;
  documentContentUrl: string | null;
  documentError: string | null;
  documentLoading?: boolean;
  onClose: () => void;
  onDownload: () => void;
  onRetry?: () => void;
}
```

**Usage:**
```tsx
<DocumentViewerModal
  document={documentState}
  documentContentUrl={contentUrl}
  documentError={error}
  documentLoading={loading}
  onClose={handleClose}
  onDownload={handleDownload}
  onRetry={handleRetry}
/>
```

**Supported File Types:**
- **Images:** JPEG, PNG, GIF, WebP, BMP
- **Documents:** PDF
- **Other:** Download prompt shown

## Type Definitions

All backoffice-related types are defined in `frontend/src/types/backoffice.ts` and re-exported from `frontend/src/types/index.ts`.

### Core Types

#### `ContactRequest`
```typescript
interface ContactRequest {
  id: string;
  entity_name: string;
  contact_email: string;
  contact_name?: string;
  position: string;
  reference?: string;
  request_type: 'join' | 'nda';
  nda_file_name?: string;
  submitter_ip?: string;
  status: string;
  notes?: string;
  created_at: string;
}
```

#### `PendingDeposit`
```typescript
interface PendingDeposit {
  id: string;
  entity_id: string;
  entity_name: string;
  user_email: string;
  reported_amount: number | null;
  reported_currency: string | null;
  wire_reference: string | null;
  bank_reference: string | null;
  status: string;
  reported_at: string | null;
  notes: string | null;
  created_at: string;
}
```

#### `DocumentViewerState`
```typescript
interface DocumentViewerState {
  id: string;
  fileName: string;
  type: string;
  mimeType?: string;
}
```

### API Response Types

#### `PendingUserResponse`
Response format from `backofficeApi.getPendingUsers()`

#### `PendingDepositResponse`
Response format from `backofficeApi.getPendingDeposits()`

#### `UserTradeResponse`
Response format from `backofficeApi.getUserTrades()`

**Note:** These response types are mapped to internal types (`KYCUser`, `PendingDeposit`, `UserTrade`) for use in components.

## Data Flow

### Contact Requests Flow

```
BackofficeOnboardingPage (or parent)
  ├─ useBackofficeRealtime() → WebSocket connection
  ├─ contactRequests state → mapped from WebSocket data
  ├─ handleOpenNDA, handleIpLookup, etc.
  └─ ContactRequestsTab
      ├─ Displays compact list rows (card_contact_request_list): Entitate, Nume, Data + actions
      ├─ View icon → ContactRequestViewModal (full form data, NDA link, optional IP Lookup)
      ├─ Approve & Invite → ApproveInviteModal
      ├─ Reject / Delete → ConfirmationModal
      └─ onIpLookup passed to ContactRequestViewModal for IP Lookup from modal
```

### Deposits Flow

```
BackofficePage
  ├─ loadData() → fetches pending deposits
  ├─ pendingDeposits state
  └─ PendingDepositsTab
      ├─ Displays deposits
      ├─ Opens confirmation modal
      ├─ Validates form input
      └─ Calls onConfirm/onReject handlers
```

### Document Viewer Flow

```
BackofficePage
  ├─ handleOpenDocumentViewer() → sets document state
  ├─ loadDocumentContent() → fetches blob
  ├─ documentContentUrl state
  └─ DocumentViewerModal
      ├─ Renders preview based on mime type
      ├─ Handles loading/error states
      └─ Provides download/retry actions
```

## Best Practices

### Component Usage

1. **State Management:**
   - Each component manages its own local UI state
   - Parent component (`BackofficePage`) manages shared data state
   - Use callbacks for parent-child communication

2. **Error Handling:**
   - All async operations wrapped in try-catch
   - Errors logged using `logger` utility
   - User-friendly error messages displayed

3. **Type Safety:**
   - Always use TypeScript interfaces (no `any` types)
   - Import types from `types/backoffice.ts`
   - Map API responses to internal types

4. **Accessibility:**
   - All interactive elements have ARIA labels
   - Form validation errors associated with inputs
   - Keyboard navigation supported

5. **Loading States:**
   - Skeleton screens for list loading
   - Loading indicators for actions
   - Disabled states during operations

### Adding New Components

When extracting new components from `BackofficePage`:

1. **Create component file** in `frontend/src/components/backoffice/`
2. **Define props interface** with clear types
3. **Add JSDoc comments** with usage examples
4. **Export from** `frontend/src/components/backoffice/index.ts`
5. **Update BackofficePage** to use new component
6. **Add types** to `types/backoffice.ts` if needed

**Example:**
```typescript
/**
 * New Component
 * 
 * Description of what the component does.
 * 
 * @component
 * @example
 * ```tsx
 * <NewComponent
 *   data={data}
 *   onAction={handleAction}
 * />
 * ```
 */
export function NewComponent({ data, onAction }: NewComponentProps) {
  // Implementation
}
```

## Migration Notes

### Before Refactoring

- All tab content was inline in `BackofficePage.tsx` (~1400 lines)
- Duplicate interface definitions across files
- Mixed concerns (data fetching + UI rendering)
- Hard to test individual features

### After Refactoring

- Modular components (~300 lines each)
- Shared type definitions
- Clear separation of concerns
- Easier to test and maintain

### Breaking Changes

**None** - The refactoring maintains the same API and functionality. All existing code continues to work.

## Troubleshooting

### Component Not Rendering

**Issue:** Component doesn't appear in UI

**Solutions:**
1. Check component is exported from `components/backoffice/index.ts`
2. Verify import path in `BackofficePage.tsx`
3. Check props are passed correctly
4. Verify component returns JSX (not `null`)

### Type Errors

**Issue:** TypeScript errors in components

**Solutions:**
1. Import types from `types/backoffice.ts`
2. Ensure API response types match expected format
3. Check type mappings in `BackofficePage.tsx`
4. Verify all required props are provided

### Validation Not Working

**Issue:** Form validation errors not showing

**Solutions:**
1. Check `validationError` state is set
2. Verify error message is displayed in UI
3. Ensure `aria-invalid` and `aria-describedby` are set
4. Check error clearing on input change

## Related Documentation

- [Backoffice Navigation](BACKOFFICE_NAVIGATION.md) - Layout and routing
- [Backoffice API](../api/BACKOFFICE_API.md) - API endpoints
- [Code Quality Standards](../CODE_QUALITY_STANDARDS.md) - Coding standards

## See Also

- `frontend/src/types/backoffice.ts` - Type definitions
- `frontend/src/components/backoffice/` - Component implementations
- `frontend/src/pages/BackofficePage.tsx` - Main page component
