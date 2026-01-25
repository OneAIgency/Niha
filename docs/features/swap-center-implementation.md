# Swap Center Implementation

**Date:** 2026-01-25  
**Status:** ✅ Fully Implemented with Real Data

## Overview

The Swap Center enables users to exchange CEA (China Emission Allowances) for EUA (EU Allowances) and vice versa. The system uses real database data, proper transaction handling, and comprehensive audit trails.

## Features

### ✅ Implemented Features

1. **Real-Time Swap Rate Display**
   - Current market rate calculated from real prices
   - 24-hour rate change from price history
   - Platform fee calculation (0.5%)

2. **Swap Request Creation**
   - Create swap requests with quantity and optional desired rate
   - Automatic rate calculation if not specified
   - Holdings validation before creation
   - Unique anonymous code generation

3. **Swap Execution**
   - Atomic transaction execution
   - Row-level locking prevents concurrent modifications
   - Automatic rollback on errors
   - Real-time balance updates

4. **Market Maker Integration**
   - Real balance retrieval from market makers
   - Swap offers sorted by best ratio
   - Available quantities from actual holdings

5. **User Dashboard**
   - View own swap requests
   - Filter by status (open, matched, completed, cancelled)
   - Recent swaps history
   - Real-time balance display

6. **Error Handling**
   - User-friendly error notifications
   - Clear validation messages
   - Transaction safety with rollback

## Technical Implementation

### Backend Architecture

**Database Models:**
- `SwapRequest`: Stores swap requests with status tracking
- `EntityHolding`: Tracks user balances (CEA, EUA, EUR)
- `AssetTransaction`: Audit trail for all swap operations

**Key Endpoints:**
- `GET /swaps/available` - List open swaps with pagination
- `GET /swaps/stats` - Market statistics from database
- `POST /swaps` - Create swap request
- `POST /swaps/{id}/execute` - Execute swap with transaction safety
- `GET /swaps/my` - User's swap requests
- `GET /swaps/offers` - Market maker offers

**Transaction Safety:**
- All swap executions use database transactions
- Row-level locking (`FOR UPDATE`) prevents race conditions
- Automatic rollback on any error
- Atomic balance updates

### Frontend Architecture

**Components:**
- `CeaSwapMarketPage.tsx` - Main swap interface
- Real-time data fetching every 10 seconds
- Error notifications with auto-dismiss
- Loading states and user feedback

**API Integration:**
- `swapsApi.getRate()` - Current swap rate
- `swapsApi.getStats()` - Market statistics
- `swapsApi.createSwapRequest()` - Create swap
- `swapsApi.executeSwap()` - Execute swap
- `swapsApi.getMySwaps()` - User swaps
- `swapsApi.getSwapOffers()` - Market maker offers
- `usersApi.getMyHoldings()` - User balances

## Data Flow

### Swap Creation Flow

```
User → Frontend → POST /swaps
                  ↓
              Validate Holdings
                  ↓
              Create SwapRequest (status: OPEN)
                  ↓
              Return SwapRequest
```

### Swap Execution Flow

```
User → Frontend → POST /swaps/{id}/execute
                  ↓
              Lock SwapRequest (FOR UPDATE)
                  ↓
              Lock Holdings (FOR UPDATE)
                  ↓
              Validate Balance
                  ↓
              Update Holdings
                  ↓
              Create AssetTransactions
                  ↓
              Update SwapRequest (status: COMPLETED)
                  ↓
              Commit Transaction
                  ↓
              Return Success
```

## Security Features

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only execute their own swaps
3. **Validation:** Holdings checked before operations
4. **Concurrency:** Row-level locking prevents double-spending
5. **Audit Trail:** All operations logged in AssetTransaction

## Price Integration

The swap rate is calculated from real market prices:

1. **Price Sources (priority order):**
   - Web scraping (carboncredits.com API)
   - Redis cache (10-minute TTL)
   - price_history database (latest records)
   - Hardcoded fallback prices

2. **Currency Conversion:**
   - All conversions use `currency_service`
   - Supports USD→EUR, CNY→EUR conversions
   - Real-time exchange rates with caching

3. **24h Change Calculation:**
   - Compares current price with price 24h ago
   - Calculated from price_history records
   - Falls back to simulated change if history unavailable

## Error Handling

### Backend Errors

- `400 Bad Request`: Invalid input or insufficient balance
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User doesn't own swap request
- `404 Not Found`: Swap request not found
- `500 Internal Server Error`: Transaction error (rolled back)

### Frontend Errors

- Toast notifications for API errors
- Inline error messages in dialogs
- Auto-dismiss after 5 seconds
- Clear error messages from backend

## Performance Considerations

1. **Database Queries:**
   - Efficient pagination with LIMIT/OFFSET
   - Indexed queries on status and entity_id
   - Aggregated statistics queries

2. **Caching:**
   - Price data cached in Redis (10 minutes)
   - Frontend polls every 10 seconds
   - Reduces database load

3. **Concurrency:**
   - Row-level locking prevents race conditions
   - Transaction isolation ensures consistency
   - Minimal lock duration

## Testing Recommendations

### Unit Tests
- Swap creation with insufficient balance
- Swap execution with invalid swap ID
- Swap execution with non-owned swap
- Market maker balance retrieval
- Price scraper fallback logic

### Integration Tests
- Complete swap flow (create → execute → verify)
- Concurrent swap execution (should be serialized)
- Transaction rollback on error
- Pagination accuracy

### E2E Tests
- User creates swap request
- User executes swap
- Balance updates correctly
- Recent swaps appear in history

## Future Enhancements

1. **Rate Limiting:** Prevent swap spam
2. **Matching Engine:** Automatic swap matching
3. **Notifications:** Email/SMS on swap completion
4. **Analytics:** Swap volume and rate trends
5. **Settlement:** Integration with external registries

## Related Documentation

- [Swaps API Documentation](../api/SWAPS_API.md) - Complete API reference
- [Operational Workflow](../08_Operational_Workflow_Live_Trading.md) - Business workflow
- [Market Model](../architecture/market-model.md) - Market architecture
