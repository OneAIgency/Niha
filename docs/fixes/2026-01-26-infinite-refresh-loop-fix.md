# Infinite Refresh Loop Fix

**Date**: 2026-01-26
**Status**: ✅ Implemented with Debug Logging
**Issue**: Infinite page refresh between login and dashboard after authentication

## Files Modified

1. **`frontend/src/App.tsx`** - LoginRoute component
2. **`frontend/src/pages/LoginPage.tsx`** - Login handlers
3. **`frontend/src/pages/SetupPasswordPage.tsx`** - Password setup handler
4. **`frontend/src/stores/useStore.ts`** - Auth store with rehydration logging
5. **`frontend/src/utils/navigationGuard.ts`** - Navigation guard with logging

## Root Cause Analysis

### The Problem

Users experienced an infinite refresh loop between the login page and dashboard after successful authentication. The systematic investigation revealed:

**Race Condition Between:**
1. Zustand persist rehydration (`_hasHydrated` flag timing)
2. React Router navigation state updates
3. `useMemo` recalculation triggering on `_hasHydrated` change
4. Navigation guard timeout (150ms)

### The Sequence That Caused the Loop

```
T=0ms:    User logs in
          → setAuth() updates store
          → isAuthenticated=true, user set
          → _hasHydrated still false (setTimeout pending)

T=0ms:    LoginRoute renders
          → targetPath=null (because !_hasHydrated)
          → Returns children (LoginPage)

T=1ms:    setTimeout callback fires
          → _hasHydrated=true
          → Store update triggers re-render

T=2ms:    LoginRoute re-renders
          → targetPath recalculates (useMemo deps changed)
          → targetPath='/dashboard'
          → location.pathname='/login'
          → setNavigationInProgress()
          → <Navigate to="/dashboard" replace />

T=10ms:   React Router processes navigation
          → URL changes to /dashboard
          → LoginRoute might render again before location updates

T=20ms:   LoginRoute renders on /dashboard
          → If location.pathname still shows '/login' briefly
          → Another navigation triggered!

LOOP continues...
```

### Additional Issue

**SetupPasswordPage** had the same problematic pattern:
- Called `navigate('/onboarding')` directly after `setAuth()`
- Created duplicate navigation (one from code, one from LoginRoute)
- Caused same refresh loop issue

## Solution Implemented

### 1. Removed `useMemo` Dependency

**Before:**
```typescript
const targetPath = useMemo(() => {
  if (_hasHydrated && isAuthenticated && user) {
    return getPostLoginRedirect(user);
  }
  return null;
}, [_hasHydrated, isAuthenticated, user]); // Recalculates when _hasHydrated changes!
```

**After:**
```typescript
// Calculate target only when needed, not on every _hasHydrated change
if (isAuthenticated && user && !hasNavigatedRef.current) {
  const targetPath = getPostLoginRedirect(user);
  // ... navigation logic
}
```

### 2. Added Navigation Tracking with `useRef`

```typescript
const hasNavigatedRef = React.useRef(false);

// Reset when user logs out
React.useEffect(() => {
  if (!isAuthenticated) {
    hasNavigatedRef.current = false;
  }
}, [isAuthenticated]);

// Only navigate once per login session
if (isAuthenticated && user && !hasNavigatedRef.current) {
  // ... calculate and navigate
  hasNavigatedRef.current = true;
}
```

### 3. Fixed SetupPasswordPage

**Removed duplicate navigation:**
```typescript
// Before:
setAuth(user, access_token);
navigate('/onboarding'); // ❌ Duplicate navigation!

// After:
setAuth(user, access_token);
// Navigation will be handled by LoginRoute guard
```

### 4. Added Comprehensive Debug Logging

Added logging at every critical point:

- **LoginRoute**: Every render with full state
- **LoginPage**: Login attempts and auth setting
- **SetupPasswordPage**: Password setup and auth setting
- **AuthStore**: setAuth, logout, rehydration
- **NavigationGuard**: Flag setting and resetting

## How to Test

### 1. Clear Browser Storage

Open DevTools → Application → Storage → Clear All Site Data

### 2. Monitor Console Logs

Open DevTools → Console

Filter by `[LoginRoute]`, `[AuthStore]`, `[LoginPage]`, etc.

### 3. Test Login Flow

```bash
# Test normal login
1. Navigate to /login
2. Enter credentials
3. Click login
4. Watch console output
5. Verify single redirect to dashboard (no loop)
```

### 4. Expected Console Output (Success)

```
[LoginPage] Attempting password login for: user@example.com
[LoginPage] Login successful, setting auth for user: {...}
[LoginPage] Auth set, navigation will be handled by LoginRoute guard
[AuthStore] setAuth called: {...}
[AuthStore] Token stored in sessionStorage
[AuthStore] Auth state updated, isAuthenticated=true

[LoginRoute] Render state: {
  _hasHydrated: false,
  isAuthenticated: true,
  userEmail: 'user@example.com',
  currentPath: '/login',
  hasNavigated: false,
  navInProgress: false
}
[LoginRoute] Waiting for rehydration, showing children

[AuthStore] Rehydration complete, state: {...}
[AuthStore] Setting _hasHydrated=true

[LoginRoute] Render state: {
  _hasHydrated: true,
  isAuthenticated: true,
  userEmail: 'user@example.com',
  currentPath: '/login',
  hasNavigated: false,
  navInProgress: false
}
[LoginRoute] Authenticated user, checking navigation: {
  targetPath: '/dashboard',
  currentPath: '/login',
  shouldNavigate: true,
  navInProgress: false
}
[LoginRoute] 🔄 Performing navigation to: /dashboard
[NavigationGuard] Setting navigation in progress

[LoginRoute] Render state: {
  _hasHydrated: true,
  isAuthenticated: true,
  userEmail: 'user@example.com',
  currentPath: '/dashboard',
  hasNavigated: true,
  navInProgress: true
}
[LoginRoute] ✓ Already on target path, no navigation needed
[LoginRoute] Showing children (no navigation)
```

### 5. Test Different User Roles

```bash
# PENDING user → /onboarding
# APPROVED user → /funding
# FUNDED user → /dashboard
# ADMIN user → /dashboard
```

### 6. Test Magic Link Flow

```bash
1. Request magic link via email
2. Click link with token
3. Verify single redirect (no loop)
```

### 7. Test Password Setup Flow

```bash
1. Use invitation link with token
2. Set password
3. Verify single redirect to correct page
```

## Debugging Tips

### Issue: Still seeing refresh loop

**Check console logs for:**
1. `hasNavigated` flag - should become `true` and stay `true`
2. `navInProgress` flag - should reset after 150ms
3. Multiple `🔄 Performing navigation` messages (indicates loop)
4. `currentPath` vs `targetPath` mismatch

**Possible causes:**
- Browser cache - clear all site data
- Multiple tabs open - close all tabs and retest
- React Strict Mode causing double renders (dev only)

### Issue: Navigation not happening

**Check console logs for:**
1. `_hasHydrated` - should become `true`
2. `isAuthenticated` - should be `true`
3. `user` - should exist
4. Token in sessionStorage (DevTools → Application → Session Storage)

### Issue: Redirecting to wrong page

**Check:**
1. User role in console logs
2. `getPostLoginRedirect()` logic in `utils/redirect.ts`
3. Special cases (e.g., `eu@eu.ro` user)

## Removing Debug Logging (After Fix is Verified)

Once the fix is confirmed working, remove debug logging:

### Files to Clean Up

1. **App.tsx** - Remove debug `useEffect` (lines ~85-95)
2. **LoginPage.tsx** - Remove or reduce to `logger.debug` only on errors
3. **SetupPasswordPage.tsx** - Same as LoginPage
4. **useStore.ts** - Keep minimal logging or remove
5. **navigationGuard.ts** - Keep minimal logging or remove

### Recommended Approach

Keep only error logging and critical state changes:
```typescript
// Keep:
logger.error('[Component] Error:', error);
logger.warn('[Component] Unexpected state:', state);

// Remove:
logger.debug('[Component] Render state:', ...); // Too verbose
```

## Benefits

1. **Eliminates Infinite Loop**: Single navigation per login session
2. **Race Condition Prevention**: `useRef` tracks navigation state
3. **No useMemo Recalculation**: Removes dependency on `_hasHydrated`
4. **Comprehensive Debugging**: Full visibility into authentication flow
5. **Consistent Pattern**: All auth flows use same navigation logic
6. **Better User Experience**: No visual flash or rapid refreshes

## Related Documentation

- [Login Navigation Optimization](./login-navigation-optimization.md) - Previous fix attempt
- [Token Storage Fix](./token-storage-consistency-fix.md) - Related token issues
- [Systematic Debugging Skill](../../.claude/plugins/cache/claude-plugins-official/superpowers/4.1.1/skills/systematic-debugging) - Debugging methodology used

## Future Improvements

1. **Migration to React Router v6.4+ Data APIs**
   - Use `loader` functions for auth checks
   - Cleaner separation of concerns
   - Better SSR support

2. **HTTP-Only Cookies**
   - Replace sessionStorage with httpOnly cookies
   - Eliminates XSS token theft vulnerability
   - Requires backend changes

3. **Automated E2E Tests**
   - Test login flow with Playwright/Cypress
   - Verify no refresh loops
   - Test all user role redirects

---

**Last Updated**: 2026-01-26
**Version**: 1.0.0
**Debugging Status**: Active (remove logs after verification)
