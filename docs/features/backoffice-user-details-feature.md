# Backoffice User Details Feature

**Last Updated:** 2026-01-25  
**Status:** ✅ Production Ready

## Overview

The Backoffice User Details feature allows administrators to search for users by email and view comprehensive user information including profile details, session history, and trading activity. This feature is part of the backoffice administration interface.

## Location

- **Frontend Component:** `frontend/src/pages/BackofficePage.tsx`
- **API Endpoints:** `/api/v1/backoffice/users/{user_id}/sessions`, `/api/v1/backoffice/users/{user_id}/trades`
- **Utility Functions:** `frontend/src/utils/index.ts` (`formatUserName`, `getUserInitials`)

## Features

### User Search

Admins can search for users by:
- Email address
- First name
- Last name

The search uses the admin API endpoint `/api/v1/admin/users` with a search parameter.

**Error Handling:**
- Error messages are displayed directly in the User Details section when searches fail
- Supports multiple error formats (API errors, network errors, validation errors)
- Errors are automatically cleared when switching tabs or on successful search
- Type-safe error handling with proper error message extraction

### User Details Display

When a user is found, the following information is displayed:

1. **User Profile:**
   - Full name (with fallback for missing names)
   - Email address
   - Entity name (if associated)
   - User ID
   - Role badge

2. **Session History:**
   - IP addresses
   - Session start/end times
   - Active session indicator
   - User agent information

3. **Trading History:**
   - Trade type (buy/sell/swap)
   - Certificate type (CEA/EUA)
   - Quantity and value
   - Trade status
   - Timestamps

## Implementation Details

### Utility Functions

Two utility functions were created for consistent user name handling:

#### `formatUserName(firstName, lastName, fallback?)`

Formats user full name with proper null/undefined handling.

```typescript
formatUserName('John', 'Doe') // 'John Doe'
formatUserName('John', null) // 'John'
formatUserName(null, null) // 'No name provided'
```

#### `getUserInitials(firstName, lastName, email?)`

Generates user initials for avatar display.

```typescript
getUserInitials('John', 'Doe') // 'JD'
getUserInitials('John', null, 'john@example.com') // 'Jj'
getUserInitials(null, null, null) // 'U'
```

### Data Handling

The feature properly handles:
- ✅ Null/undefined user fields (first_name, last_name, role)
- ✅ Missing email addresses
- ✅ Users without associated entities
- ✅ Users with no sessions or trades
- ✅ Empty search results

### Accessibility

All user details sections include:
- ARIA labels for screen readers
- Semantic HTML structure
- Role attributes for status messages
- Keyboard navigation support

## API Integration

### Endpoints Used

1. **Search Users:**
   ```http
   GET /api/v1/admin/users?search={query}
   ```

2. **Get User Sessions:**
   ```http
   GET /api/v1/backoffice/users/{user_id}/sessions
   ```

3. **Get User Trades:**
   ```http
   GET /api/v1/backoffice/users/{user_id}/trades
   ```

See [BACKOFFICE_API.md](../api/BACKOFFICE_API.md) for detailed API documentation.

## Usage

### For Administrators

1. Navigate to Backoffice page (`/backoffice`)
2. Click on "User Details" tab
3. Enter user email (or name) in search field
4. Press Enter or click "Search"
5. View user details, sessions, and trades

### Error Handling

The feature includes comprehensive error handling with user-friendly error messages:

- **No user found:** Displays error message "No user found with that email" in the User Details section
- **API errors:** Extracts and displays specific error messages from API responses
- **Network errors:** Shows connection error messages with retry guidance
- **Authentication failures:** Displays appropriate access denied messages
- **Missing data:** Shows appropriate fallback messages (e.g., "No name provided", "No sessions found")

**Error Display Features:**
- Errors are shown directly in the User Details section below the search input
- Error messages are dismissible with a close button
- Errors automatically clear when switching tabs or on successful search
- Errors persist while user is typing (cleared on blur if field is empty)
- Type-safe error extraction handles multiple API error formats
- Full accessibility support with ARIA labels and keyboard navigation

## Testing

Comprehensive test suite available in `frontend/src/utils/__tests__/userUtils.test.ts`.

To run tests:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm test
```

## Related Documentation

- [Backoffice API Documentation](../api/BACKOFFICE_API.md)
- [Admin API Documentation](../api/MARKET_MAKERS_API.md)
- [Frontend README](../../frontend/README.md)

## Recent Updates (2026-01-25)

- ✅ Fixed null/undefined field handling
- ✅ Added utility functions for name formatting
- ✅ Improved accessibility with ARIA labels
- ✅ Enhanced error handling with comprehensive error display
- ✅ Fixed type safety issues (changed `any` to `unknown`)
- ✅ Added tab-specific error clearing
- ✅ Improved error message extraction (handles multiple API formats)
- ✅ Better error clearing behavior (contextual, not aggressive)
- ✅ Created comprehensive test suite
- ✅ Updated ProfilePage for consistency

### Error Display Fix (2026-01-25)

Fixed critical issue where error messages were not displayed when user searches failed. The fix includes:

1. **Error Display Component**: Added error message display directly in User Details section
2. **Tab-Specific Error Management**: Errors are cleared when switching away from details tab
3. **Robust Error Extraction**: Handles multiple API error response formats
4. **Type-Safe Error Handling**: Uses `unknown` type with proper type guards
5. **Improved UX**: Contextual error clearing that preserves error context while typing

See [Error Display Fix Documentation](../fixes/2026-01-25-backoffice-user-details-error-display-fix.md) for detailed information.

## Future Enhancements

- Copy-to-clipboard functionality for user ID
- Export user details to PDF/CSV
- Advanced filtering options
- User activity timeline visualization
