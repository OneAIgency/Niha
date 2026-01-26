# Token Storage Consistency Fix

**Date**: 2026-01-26  
**Status**: ✅ Implemented  
**Files Modified**: 
- `frontend/src/services/api.ts`
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/stores/useStore.ts`
- `frontend/src/constants/auth.ts` (new file)

## Problem

A critical bug caused a rapid refresh loop between the login page and dashboard after successful authentication. The root cause was a **mismatch between where the authentication token was stored and where it was retrieved**:

- **Token Storage**: `sessionStorage` with key `'auth_token'` (in `useStore.ts`)
- **Token Retrieval**: `localStorage` with key `'token'` (in `api.ts` interceptor)

### Impact

This inconsistency caused the following sequence:

1. User successfully logs in
2. Token is saved correctly in `sessionStorage` with key `'auth_token'`
3. API requests are made, but interceptor looks for token in `localStorage` with key `'token'`
4. Token is not found → API requests fail with 401/403 errors
5. Error interceptor redirects user to `/login`
6. Login page detects authenticated user (token exists in store) and redirects back to dashboard
7. **Result**: Infinite redirect loop causing rapid page refreshes

### Symptoms

- Rapid refresh/flash between login and dashboard pages
- Users unable to access dashboard after login
- API requests failing immediately after authentication
- Console errors showing 401/403 authentication failures

## Solution

Fixed the token storage/retrieval inconsistency by:

1. **Updated API Interceptor**: Changed from `localStorage.getItem('token')` to `getToken()` which correctly reads from `sessionStorage`
2. **Updated ProfilePage**: Changed to retrieve token from `useAuthStore()` instead of `localStorage`
3. **Centralized Token Key**: Created shared constant `TOKEN_KEY` in `constants/auth.ts` to ensure consistency
4. **Code Cleanup**: Removed unused `setToken()` function

## Implementation Details

### Code Changes

**1. Created Centralized Token Constant** (`frontend/src/constants/auth.ts`)
```typescript
/**
 * Storage key for authentication token in sessionStorage.
 * 
 * Note: Using sessionStorage instead of localStorage for better security.
 * TODO: Migrate to httpOnly cookies for production.
 */
export const TOKEN_KEY = 'auth_token';
```

**2. Updated API Interceptor** (`frontend/src/services/api.ts`)
```typescript
// Before:
const token = localStorage.getItem('token');

// After:
import { TOKEN_KEY } from '../constants/auth';
const token = getToken(); // Uses sessionStorage.getItem(TOKEN_KEY)
```

**3. Updated Auth Store** (`frontend/src/stores/useStore.ts`)
```typescript
// Before:
sessionStorage.setItem('auth_token', token);
sessionStorage.removeItem('auth_token');

// After:
import { TOKEN_KEY } from '../constants/auth';
sessionStorage.setItem(TOKEN_KEY, token);
sessionStorage.removeItem(TOKEN_KEY);
```

**4. Updated ProfilePage** (`frontend/src/pages/ProfilePage.tsx`)
```typescript
// Before:
const token = localStorage.getItem('token');

// After:
const { user, token, setAuth } = useAuthStore();
// Token is now retrieved from store, which uses sessionStorage
```

**5. Removed Unused Function** (`frontend/src/services/api.ts`)
- Removed `setToken()` function as token is set via `setAuth()` in store

### Key Functions

**`getToken()`** (in `api.ts`)
- Reads token from `sessionStorage` using `TOKEN_KEY` constant
- Returns `null` if token doesn't exist or on error
- Handles storage access errors gracefully

**`removeToken()`** (in `api.ts`)
- Removes token from `sessionStorage` using `TOKEN_KEY` constant
- Called on logout and authentication errors
- Handles errors gracefully

**`setAuth(user, token)`** (in `useStore.ts`)
- Sets token in both Zustand store and `sessionStorage`
- Uses `TOKEN_KEY` constant for consistency
- Updates `isAuthenticated` flag

**`logout()`** (in `useStore.ts`)
- Removes token from both Zustand store and `sessionStorage`
- Uses `TOKEN_KEY` constant for consistency
- Resets authentication state

### Token Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Token Storage                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Storage Location: sessionStorage                      │
│  Key: 'auth_token' (TOKEN_KEY constant)                │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  useStore.ts │         │   api.ts     │            │
│  │              │         │              │            │
│  │  setAuth()   │────────▶│  getToken()  │            │
│  │  logout()    │         │  removeToken()│            │
│  └──────────────┘         └──────────────┘            │
│         │                        │                     │
│         └────────┬─────────────────┘                   │
│                  │                                     │
│                  ▼                                     │
│         sessionStorage.getItem(TOKEN_KEY)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Benefits

1. **Eliminates Refresh Loop**: Token is now consistently stored and retrieved from the same location
2. **Consistent Storage**: All token operations use `sessionStorage` with the same key
3. **Centralized Configuration**: `TOKEN_KEY` constant ensures single source of truth
4. **Maintainability**: Changes to token key only need to be made in one place
5. **Type Safety**: Shared constant prevents typos and inconsistencies
6. **Code Quality**: Removed dead code (`setToken()` function)
7. **Security**: Maintains use of `sessionStorage` (better than `localStorage` for XSS protection)

## Security Considerations

### Current Implementation

- ✅ Uses `sessionStorage` instead of `localStorage` (better XSS protection)
- ✅ Token cleared on logout
- ✅ Token removed on authentication errors (401/403)
- ✅ Graceful error handling for storage access failures

### Future Improvements

- **TODO**: Migrate to httpOnly cookies for production
  - Requires backend changes
  - Eliminates XSS vulnerability completely
  - More secure for production environments

## Testing

### Manual Testing Checklist

**Login Flow:**
- ✅ Test successful login redirects to correct page
- ✅ Verify no refresh loop occurs
- ✅ Confirm API requests include Authorization header
- ✅ Test with different user roles (PENDING, APPROVED, FUNDED, ADMIN)

**Token Persistence:**
- ✅ Verify token persists across page refreshes (sessionStorage)
- ✅ Confirm token is cleared on logout
- ✅ Test token expiration handling (401 errors)
- ✅ Verify token is removed on authentication failures

**Profile Update:**
- ✅ Test profile update with valid token
- ✅ Verify auth store updates correctly
- ✅ Test edge case: profile update without token

**Error Handling:**
- ✅ Test behavior when sessionStorage is unavailable
- ✅ Verify graceful degradation on storage errors
- ✅ Test 401/403 error handling and redirect

### Automated Testing Recommendations

- Unit tests for `getToken()` function
- Unit tests for `removeToken()` function
- Integration tests for login flow
- Tests for API interceptor token injection
- Tests for error handling (missing/invalid tokens)
- Tests for token storage consistency

## Related Documentation

- [Authentication API](../api/AUTHENTICATION.md) - Backend authentication endpoints and frontend flow
- [Login Navigation Optimization](./login-navigation-optimization.md) - Related navigation fixes
- [Code Review](../features/2026-01-26-token-storage-fix_REVIEW.md) - Detailed code review
- [Token Constants](../../frontend/src/constants/auth.ts) - Centralized token configuration

## Troubleshooting

### Issue: Token Not Found After Login

**Symptoms:**
- User successfully logs in but API requests fail
- 401/403 errors in console
- User redirected back to login

**Diagnosis:**
1. Check browser DevTools → Application → Session Storage
2. Verify token exists with key `'auth_token'`
3. Check if token is being read correctly in API interceptor

**Solution:**
- Verify `TOKEN_KEY` constant is imported correctly
- Check that `getToken()` is being called in API interceptor
- Ensure `sessionStorage` is available (not in private/incognito mode with restrictions)

### Issue: Token Persists After Logout

**Symptoms:**
- User logs out but token still exists
- User can still make authenticated requests

**Diagnosis:**
1. Check if `logout()` is being called
2. Verify `removeToken()` is working
3. Check sessionStorage after logout

**Solution:**
- Verify `logout()` function is called on logout action
- Check that `TOKEN_KEY` constant matches in both store and API
- Clear sessionStorage manually if needed: `sessionStorage.removeItem('auth_token')`

### Issue: Refresh Loop Still Occurs

**Symptoms:**
- Rapid refresh between login and dashboard
- Infinite redirect loop

**Diagnosis:**
1. Check if token is being stored correctly
2. Verify API interceptor is reading from correct location
3. Check for other navigation issues (see [Login Navigation Optimization](./login-navigation-optimization.md))

**Solution:**
- Verify both `useStore.ts` and `api.ts` use `TOKEN_KEY` constant
- Check that `getToken()` returns the token correctly
- Verify no other code is using `localStorage.getItem('token')`

### Issue: API Requests Fail After Page Refresh

**Symptoms:**
- User refreshes page and API requests fail
- Token seems to be lost

**Diagnosis:**
1. Check if token persists in sessionStorage after refresh
2. Verify Zustand persist middleware is working
3. Check if token is being restored from storage

**Solution:**
- Verify Zustand persist configuration
- Check that `setAuth()` is called on app initialization if token exists
- Ensure sessionStorage is not being cleared by browser settings

---

**Last Updated**: 2026-01-26  
**Version**: 1.0.0
