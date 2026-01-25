# Dashboard Balance Auto-Refresh Feature

**Date:** 2026-01-25  
**Status:** ✅ Implemented  
**Related Files:**
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/CashMarketPage.tsx`

---

## Overview

This feature implements automatic balance refresh mechanisms for the dashboard to ensure balance data stays synchronized after trades are executed on the cash market page. The implementation uses a multi-layered approach combining event-based immediate refresh, continuous polling, and navigation-based refresh.

## Problem Statement

Previously, when users executed trades on the cash market page, the dashboard balance would not update automatically. Users had to manually refresh the page or navigate away and back to see updated balances, leading to confusion and poor user experience.

## Solution

A three-layered refresh mechanism ensures balance updates automatically:

1. **Event-Based Immediate Refresh**: Cash market dispatches custom event after successful order execution
2. **Continuous Polling**: Dashboard polls balance every 5 seconds when active
3. **Navigation-Based Refresh**: Balance refreshes when navigating back to dashboard

Additionally, the dashboard now uses the same balance endpoint as the cash market page for data consistency.

---

## Implementation Details

### Event-Based Refresh

**Event Name:** `nihao:balanceUpdated`  
**Event Source:** Cash Market Page (`CashMarketPage.tsx`)

The cash market page dispatches a custom event after successfully executing orders:

```typescript
window.dispatchEvent(new CustomEvent('nihao:balanceUpdated', { 
  detail: { 
    type: 'trade_executed',
    source: 'cash_market'
  } 
}));
```

**Event Dispatch Conditions:**
- Only dispatched after successful order execution (MARKET or LIMIT)
- Only dispatched if data refresh (`fetchData()`) succeeds
- Uses namespaced event name to avoid conflicts with other features

**Event Listener:** Dashboard Page (`DashboardPage.tsx`)

The dashboard listens for this event and immediately refreshes balance:

```typescript
window.addEventListener('nihao:balanceUpdated', handleBalanceUpdate);
```

### Continuous Polling

The dashboard polls balance every 5 seconds when the page is active:

- **Interval:** 5 seconds
- **Condition:** Only polls when `location.pathname === '/dashboard'`
- **Race Condition Prevention:** Uses ref-based flag to prevent overlapping calls
- **Cleanup:** Automatically cleared on unmount or navigation away

### Navigation-Based Refresh

Balance refreshes when navigating back to dashboard from other pages:

- **Trigger:** Location change from non-dashboard to dashboard
- **Tracking:** Uses `useRef` to track previous location
- **Initial Mount:** Does not trigger on initial mount (only on actual navigation)

### Endpoint Unification

**Previous Implementation:**
- Dashboard: `usersApi.getMyEntityAssets()` → `/users/me/entity/assets`
- Cash Market: `cashMarketApi.getUserBalances()` → `/cash-market/user/balances`

**Current Implementation:**
- Dashboard: `cashMarketApi.getUserBalances()` → `/cash-market/user/balances`
- Cash Market: `cashMarketApi.getUserBalances()` → `/cash-market/user/balances`

Both pages now use the same endpoint, ensuring data consistency. This endpoint queries the `EntityHolding` table directly via `get_entity_balance()` function, providing accurate real-time balance.

---

## Technical Details

### TypeScript Types

Custom event type definition:

```typescript
interface BalanceUpdatedEvent extends CustomEvent {
  detail: {
    type: string;
    source?: string;
  };
}
```

### Race Condition Prevention

Uses `useRef` instead of `useState` for refresh flag to avoid dependency issues:

```typescript
const isRefreshingBalanceRef = useRef<boolean>(false);

// In fetchBalance()
if (isRefreshingBalanceRef.current) {
  return false; // Prevent overlapping calls
}
isRefreshingBalanceRef.current = true;
// ... fetch logic ...
finally {
  isRefreshingBalanceRef.current = false;
}
```

### Error Handling

- `fetchBalance()` returns `Promise<boolean>` to indicate success/failure
- Event dispatch only occurs if data refresh succeeds
- Errors are logged but don't prevent event dispatch if refresh succeeds
- Failed refresh attempts don't dispatch events to maintain data consistency

---

## API Endpoints

### GET `/cash-market/user/balances`

**Description:** Get current user's asset balances (EUR, CEA, EUA)

**Response:**
```json
{
  "entity_id": "uuid",
  "eur_balance": 1000000.00,
  "cea_balance": 1068902.00,
  "eua_balance": 0.00
}
```

**Backend Implementation:**
- Queries `EntityHolding` table directly
- Uses `get_entity_balance()` function from `order_matching` service
- Provides real-time balance data

---

## User Experience

### Before
1. User executes trade on cash market page
2. Navigates to dashboard
3. Balance still shows old amount
4. User must manually refresh page

### After
1. User executes trade on cash market page
2. Balance updates automatically via event (immediate)
3. Navigates to dashboard
4. Balance already shows updated amount
5. Balance continues to update every 5 seconds (streaming-like)

---

## Performance Considerations

### Polling Frequency
- **5 seconds**: Reasonable balance between real-time updates and server load
- Only polls when dashboard is active (saves resources)
- Event-based refresh reduces need for frequent polling

### Network Optimization
- Prevents overlapping API calls using ref-based flag
- Parallel API calls in `fetchBalance()` for balance and entity data
- Failed entity balance fetch doesn't block balance update

### Memory Management
- All event listeners properly cleaned up on unmount
- Polling intervals cleared on navigation away
- No memory leaks from event listeners or intervals

---

## Testing Recommendations

### Unit Tests
- Test `fetchBalance()` with mocked API responses
- Test event listener registration and cleanup
- Test polling interval setup and cleanup
- Test navigation-based refresh logic
- Test race condition prevention (overlapping calls)

### Integration Tests
- Test balance updates after order execution
- Test multiple rapid order executions (event handling)
- Test navigation between pages (refresh trigger)
- Test polling behavior when dashboard is active/inactive
- Test error scenarios (API failures, network issues)

### E2E Tests
- Test complete flow: execute order → verify dashboard balance updates
- Test balance consistency between cash market and dashboard
- Test error scenarios (API failures, network issues)
- Test multiple tabs/windows (event propagation)

---

## Troubleshooting

### Balance Not Updating

**Symptoms:** Dashboard balance doesn't update after trade execution

**Possible Causes:**
1. Event not being dispatched (check cash market console for errors)
2. Event listener not registered (check dashboard mount)
3. API endpoint failure (check network tab)
4. Polling disabled (check if on dashboard page)

**Debug Steps:**
1. Check browser console for errors
2. Verify event is dispatched: `window.addEventListener('nihao:balanceUpdated', (e) => console.log('Event received', e))`
3. Check network tab for `/cash-market/user/balances` requests
4. Verify polling is active (should see requests every 5 seconds)

### Overlapping API Calls

**Symptoms:** Multiple simultaneous balance fetch requests

**Cause:** Race condition in polling or event handling

**Solution:** Already prevented using `isRefreshingBalanceRef` flag. If still occurring, check:
1. Ref is being set correctly
2. Multiple event listeners registered
3. Polling interval not cleared properly

### Stale Balance Data

**Symptoms:** Balance shows incorrect amount

**Possible Causes:**
1. Using wrong endpoint (should use `/cash-market/user/balances`)
2. Cached API response
3. Backend data inconsistency

**Solution:**
1. Verify dashboard uses `cashMarketApi.getUserBalances()`
2. Clear browser cache
3. Check backend `EntityHolding` table directly

---

## Future Enhancements

### Potential Improvements
1. **WebSocket Support**: Replace polling with WebSocket for real-time updates
2. **Event Filtering**: Use event detail to filter which components refresh
3. **Debouncing**: Add debouncing for rapid event sequences
4. **Retry Logic**: Add exponential backoff for failed refresh attempts
5. **Metrics**: Add performance metrics for refresh frequency and success rate

### Event Extensions
The event payload structure allows for future extensions:

```typescript
{
  type: 'trade_executed' | 'deposit' | 'withdrawal' | 'swap',
  source: 'cash_market' | 'swap_market' | 'admin',
  amount?: number,
  currency?: string
}
```

---

## Related Documentation

- [Dashboard Swap Transaction Styling](./2026-01-25-dashboard-swap-styling-and-modal-improvements_REVIEW.md)
- [Cash Market Page Implementation](./2026-01-25-cash-market-full-page-fixed-layout_REVIEW.md)
- [Code Review](./2026-01-25-dashboard-balance-auto-refresh_REVIEW.md)

---

## Changelog

### 2026-01-25
- Initial implementation
- Event-based refresh mechanism
- Continuous polling (5-second interval)
- Navigation-based refresh
- Endpoint unification
- Race condition prevention
- TypeScript type safety improvements
- Error handling enhancements
