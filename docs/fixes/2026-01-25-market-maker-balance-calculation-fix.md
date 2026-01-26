# Market Maker Balance Calculation Fix

**Date:** 2026-01-25  
**Issue:** Market Makers unable to place sell orders despite sufficient balance  
**Status:** ✅ Fixed

## Problem Summary

Market Makers were unable to place SELL orders even when they had sufficient total balance. The issue was caused by incorrect balance calculation logic that:

1. **Frontend**: Used total balance instead of available balance for validation
2. **Backend**: Included BUY orders in locked balance calculation (BUY orders don't lock certificates)

## Root Cause Analysis

### Frontend Issue
- Component validated against `balances.cea_balance` (total) instead of `balances.cea_available`
- Display showed total balance, making it unclear why orders failed
- Error messages didn't show locked balance context

### Backend Issue
- `get_balances()` calculated locked balance from ALL orders (BUY + SELL)
- Only SELL orders should lock certificates
- BUY orders would lock EUR balance (tracked separately), not certificates

## Solution

### Frontend Changes (`MMOrderPlacementModal.tsx`)

1. **Fixed Validation**
   - Changed to use `cea_available` / `eua_available` instead of `cea_balance` / `eua_balance`
   - Updated TypeScript types to include all balance fields

2. **Enhanced Error Messages**
   - Shows available, requested, total, and locked balances
   - Provides complete context for debugging

3. **Improved Display**
   - Shows available balance prominently
   - Displays locked balance when > 0
   - Clear indication of what can be used

4. **Accessibility Improvements**
   - Added `aria-live="polite"` for screen reader announcements
   - Added `aria-label` to buttons
   - Added `role="alert"` to error container

5. **Additional Validations**
   - Checks for negative balances (edge case protection)
   - Enhanced debug logging with full balance breakdown

### Backend Changes (`market_maker_service.py`)

1. **Fixed Locked Balance Calculation**
   ```python
   # Before: Included all orders
   locked = SUM(all_orders.remaining_quantity)
   
   # After: Only SELL orders
   locked = SUM(SELL_orders.remaining_quantity 
                WHERE status IN (OPEN, PARTIALLY_FILLED))
   ```

2. **Added Documentation**
   - Comprehensive docstrings explaining balance calculation
   - Comments explaining why only SELL orders lock certificates

3. **Import Fix**
   - Added `OrderSide` import for proper filtering

## Balance Calculation Logic

### Formula
```
total = SUM(all asset transactions.amount)
locked = SUM(SELL_orders.remaining_quantity 
             WHERE status IN (OPEN, PARTIALLY_FILLED))
available = total - locked
```

### Key Points
- **Total Balance**: Sum of all deposits minus withdrawals
- **Locked Balance**: Only from active SELL orders (OPEN or PARTIALLY_FILLED)
- **Available Balance**: Total minus locked (what can actually be used)
- **BUY Orders**: Do NOT lock certificates (they would lock EUR, tracked separately)

## Testing

### Unit Tests Created
Created comprehensive test suite: `backend/tests/test_market_maker_balances.py`

**Test Coverage:**
- ✅ Empty balances
- ✅ Balances with deposits
- ✅ Locked balance calculation (SELL vs BUY)
- ✅ Partially filled orders
- ✅ Multiple orders
- ✅ Filled/cancelled orders (shouldn't lock)
- ✅ Balance validation scenarios

### Manual Testing Scenarios
1. ✅ Place sell order with sufficient available balance → Should succeed
2. ✅ Place sell order with insufficient available balance → Should fail with clear error
3. ✅ Place sell order when total is sufficient but available is not → Should fail
4. ✅ Place multiple sell orders rapidly → Should handle correctly
5. ✅ Place sell order, cancel it, place another → Should release locked balance correctly

## Impact

### Before Fix
- ❌ Users couldn't place orders even with sufficient balance
- ❌ Confusing error messages
- ❌ BUY orders incorrectly reduced available balance for SELL orders

### After Fix
- ✅ Correct balance calculation
- ✅ Clear error messages with full context
- ✅ Only SELL orders lock certificates
- ✅ Better user experience with improved UI
- ✅ Comprehensive test coverage

## Files Modified

### Frontend
- `frontend/src/components/backoffice/MMOrderPlacementModal.tsx`
  - Fixed validation logic
  - Enhanced error messages
  - Improved UI display
  - Added accessibility features
  - Updated TypeScript types

### Backend
- `backend/app/services/market_maker_service.py`
  - Fixed locked balance calculation
  - Added comprehensive documentation
  - Added OrderSide import

### Tests
- `backend/tests/test_market_maker_balances.py` (new)
  - 10 comprehensive test cases

### Documentation
- `docs/api/MARKET_MAKERS_API.md`
  - Updated balance calculation formula
  - Clarified SELL vs BUY order behavior

- `docs/admin/MARKET_MAKERS_GUIDE.md`
  - Added balance calculation explanation
  - Updated troubleshooting section
  - Clarified order placement behavior

## Related Documentation

- API Documentation: `/docs/api/MARKET_MAKERS_API.md`
- Admin Guide: `/docs/admin/MARKET_MAKERS_GUIDE.md`
- Code Review: `/docs/features/2026-01-25-market-maker-sell-order-balance-fix_REVIEW.md`

## Notes for Developers

### When Adding New Order Types
- Only SELL orders lock certificates
- BUY orders would lock EUR (tracked separately)
- Always use `available` balance for validation, not `total`

### Balance Calculation Best Practices
- Always calculate: `available = total - locked`
- Locked only includes active SELL orders
- Use `get_balances()` method for consistency
- Validate against `available`, not `total`

### Error Handling
- Show complete balance context in error messages
- Include available, total, and locked amounts
- Provide actionable guidance to users
