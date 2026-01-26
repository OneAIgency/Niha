# Swaps API Documentation

**Version:** 1.0  
**Base URL:** `/api/v1/swaps`  
**Authentication:** Bearer Token (User authentication required for most endpoints)

## Overview

The Swaps API provides endpoints for creating, executing, and managing CEA ↔ EUA swap requests. All swap operations use real database data and include proper validation, transaction handling, and audit trails.

## Authentication

All endpoints (except public stats) require a valid JWT token:

```http
Authorization: Bearer <access_token>
```

To obtain a token:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Endpoints

### Public Endpoints

#### Get Current Swap Rate

```http
GET /swaps/rate
```

Get the current swap rate between EUA and CEA based on real market prices.

**Response:** `200 OK`
```json
{
  "eua_to_cea": 11.2345,
  "cea_to_eua": 0.0890,
  "eua_price_usd": 80.50,
  "cea_price_usd": 7.17,
  "explanation": "1 EUA = 11.23 CEA at current market rates",
  "platform_fee_pct": 0.5,
  "effective_rate": 11.1783,
  "rate_change_24h": 0.85,
  "eua_change_24h": 1.2,
  "cea_change_24h": 0.35
}
```

**Fields:**
- `eua_to_cea`: How many CEA you get for 1 EUA
- `cea_to_eua`: How many EUA you get for 1 CEA
- `rate_change_24h`: 24-hour change in swap rate (%)
- `eua_change_24h`: 24-hour change in EUA price (%)
- `cea_change_24h`: 24-hour change in CEA price (%)
- `platform_fee_pct`: Platform fee percentage (0.5%)
- `effective_rate`: Rate after platform fee

---

#### Calculate Swap Output

```http
GET /swaps/calculator?from_type=CEA&quantity=1000
```

Calculate the output quantity and fees for a swap operation.

**Query Parameters:**
- `from_type` (required): `CEA` or `EUA`
- `quantity` (required): Amount to swap (must be > 0)

**Response:** `200 OK`
```json
{
  "input": {
    "type": "CEA",
    "quantity": 1000,
    "value_usd": 7170.00
  },
  "output": {
    "type": "EUA",
    "quantity": 89.05,
    "value_usd": 7170.00
  },
  "rate": 0.08905,
  "fee_pct": 0.5,
  "fee_usd": 35.85
}
```

---

#### Get Swap Statistics

```http
GET /swaps/stats
```

Get market statistics calculated from real swap requests in the database.

**Response:** `200 OK`
```json
{
  "open_swaps": 15,
  "matched_today": 8,
  "eua_to_cea_requests": 5,
  "cea_to_eua_requests": 10,
  "total_eua_volume": 50000.00,
  "total_cea_volume": 550000.00,
  "current_rate": 11.2345,
  "avg_requested_rate": 11.1500
}
```

**Fields:**
- `open_swaps`: Number of open swap requests
- `matched_today`: Number of swaps matched/completed today
- `eua_to_cea_requests`: Number of EUA→CEA swap requests
- `cea_to_eua_requests`: Number of CEA→EUA swap requests
- `total_eua_volume`: Total EUA volume in open swaps
- `total_cea_volume`: Total CEA volume in open swaps
- `current_rate`: Current market swap rate
- `avg_requested_rate`: Average requested rate for EUA→CEA swaps

---

### Authenticated Endpoints

#### Get Available Swaps

```http
GET /swaps/available
```

Get paginated list of available swap requests from the database.

**Query Parameters:**
- `direction` (optional): `eua_to_cea`, `cea_to_eua`, or `all` (default: `all`)
- `min_quantity` (optional): Minimum quantity filter
- `max_quantity` (optional): Maximum quantity filter
- `page` (optional): Page number (default: 1, min: 1)
- `per_page` (optional): Items per page (default: 20, min: 1, max: 50)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "anonymous_code": "AB-123456",
      "from_type": "CEA",
      "to_type": "EUA",
      "quantity": 1000.00,
      "desired_rate": 0.0890,
      "equivalent_quantity": 89.00,
      "status": "open",
      "created_at": "2026-01-25T10:30:00Z",
      "updated_at": "2026-01-25T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

---

#### Create Swap Request

```http
POST /swaps
Authorization: Bearer <token>
Content-Type: application/json

{
  "from_type": "CEA",
  "to_type": "EUA",
  "quantity": 1000.00,
  "desired_rate": 0.0890
}
```

Create a new swap request. The system validates that the user has sufficient holdings before creating the request.

**Request Body:**
- `from_type` (required): `CEA` or `EUA`
- `to_type` (required): `CEA` or `EUA` (must be different from `from_type`)
- `quantity` (required): Amount to swap (must be > 0)
- `desired_rate` (optional): Desired swap rate. If not provided, uses current market rate.

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "anonymous_code": "AB-123456",
  "from_type": "CEA",
  "to_type": "EUA",
  "quantity": 1000.00,
  "desired_rate": 0.0890,
  "status": "open",
  "created_at": "2026-01-25T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Insufficient balance or invalid input
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Entity not found

**Example Error:**
```json
{
  "detail": "Insufficient balance. Available: 500.00, Required: 1000.00"
}
```

---

#### Execute Swap

```http
POST /swaps/{swap_id}/execute
Authorization: Bearer <token>
```

Execute a swap request. This endpoint:
- Validates the swap request is open and owned by the user
- Checks sufficient holdings
- Updates `EntityHolding` records atomically
- Creates `AssetTransaction` records for audit trail
- Updates swap request status to `COMPLETED`

Uses database row-level locking (`FOR UPDATE`) to prevent concurrent execution and includes transaction rollback on errors.

**Path Parameters:**
- `swap_id` (required): UUID of the swap request to execute

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Swap executed successfully",
  "swap_id": "uuid",
  "swap_reference": "AB-123456",
  "from_quantity": 1000.00,
  "to_quantity": 89.05,
  "rate": 0.0890,
  "from_balance_after": 0.00,
  "to_balance_after": 89.05
}
```

**Error Responses:**
- `400 Bad Request`: Swap not open, insufficient balance, or invalid state
- `403 Forbidden`: User doesn't own this swap request
- `404 Not Found`: Swap request not found
- `500 Internal Server Error`: Transaction failed (automatically rolled back)

**Example Error:**
```json
{
  "detail": "Insufficient CEA balance"
}
```

**Transaction Safety:**
- All database operations are wrapped in a transaction
- Automatic rollback on any error
- Row-level locking prevents concurrent modifications
- Atomic updates ensure data consistency

---

#### Get My Swaps

```http
GET /swaps/my?status=completed
Authorization: Bearer <token>
```

Get swap requests for the authenticated user's entity.

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `matched`, `completed`, `cancelled`)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "anonymous_code": "AB-123456",
      "from_type": "CEA",
      "to_type": "EUA",
      "quantity": 1000.00,
      "desired_rate": 0.0890,
      "equivalent_quantity": 89.00,
      "status": "completed",
      "created_at": "2026-01-25T10:30:00Z",
      "updated_at": "2026-01-25T10:35:00Z"
    }
  ]
}
```

---

#### Get Swap Offers from Market Makers

```http
GET /swaps/offers
```

Get swap offers from active market makers (SWAP_MAKER type). Returns real balances from market maker accounts calculated from current market prices.

**Response:** `200 OK`
```json
{
  "offers": [
    {
      "market_maker_id": "uuid",
      "market_maker_name": "MM-Swap-Alpha",
      "direction": "CEA_TO_EUA",
      "ratio": 11.2345,
      "eua_available": 50000.00,
      "rate": 11.2345
    },
    {
      "market_maker_id": "uuid",
      "market_maker_name": "MM-Swap-Alpha",
      "direction": "EUA_TO_CEA",
      "ratio": 11.2345,
      "cea_available": 100000.00,
      "rate": 11.2345
    }
  ],
  "count": 2
}
```

**Fields:**
- `direction`: `CEA_TO_EUA` or `EUA_TO_CEA`
- `ratio`: Swap ratio - **CEA per EUA** (e.g., 11.2345 means 11.2345 CEA = 1 EUA)
  - For `CEA_TO_EUA`: How many CEA needed to get 1 EUA (lower is better for buyer)
  - For `EUA_TO_CEA`: How many CEA you get for 1 EUA (higher is better for seller)
- `eua_available`: Available EUA balance from market maker (for CEA_TO_EUA offers)
- `cea_available`: Available CEA balance from market maker (for EUA_TO_CEA offers)
- `rate`: Same as `ratio` (for backward compatibility)

**Calculation:**
- Ratio is calculated from current market prices: `ratio = eua_price_eur / cea_price_eur`
- Only includes offers where market maker has available balance > 0
- Prices are validated (must be positive numbers) before calculation
- Returns empty array if prices are invalid

**Note:** Offers are sorted by best ratio (lowest for CEA_TO_EUA, highest for EUA_TO_CEA).

**Error Handling:**
- Returns empty offers array if prices are invalid or market makers have no available balance
- Logs warnings for invalid price scenarios
- Frontend should handle empty offers gracefully

---

## Data Models

### SwapRequest

```typescript
interface SwapRequest {
  id: string;                    // UUID
  anonymous_code: string;         // Format: "AB-123456"
  from_type: "CEA" | "EUA";      // Source certificate type
  to_type: "CEA" | "EUA";        // Target certificate type
  quantity: number;               // Amount to swap
  desired_rate?: number;          // Desired swap rate (optional)
  equivalent_quantity?: number;   // Calculated output quantity
  status: "open" | "matched" | "completed" | "cancelled";
  created_at: string;            // ISO 8601 timestamp
  updated_at?: string;            // ISO 8601 timestamp
}
```

### SwapStatus Enum

- `open`: Swap request is active and available for execution
- `matched`: Swap has been matched but not yet completed
- `completed`: Swap has been successfully executed
- `cancelled`: Swap request has been cancelled

---

## Business Logic

### Swap Rate Calculation

The swap rate is calculated from current market prices:

```
swap_rate = eua_price_eur / cea_price_eur
```

After applying platform fee (0.5%):
```
effective_rate = swap_rate * 0.995
```

### Swap Execution Flow

1. **Validation:**
   - Verify swap request exists and is `OPEN`
   - Verify user owns the swap request
   - Verify user has sufficient holdings

2. **Locking:**
   - Acquire row-level locks on swap request and holdings
   - Prevents concurrent modifications

3. **Calculation:**
   - Calculate output quantity: `to_quantity = from_quantity * rate * 0.995`
   - Apply 0.5% platform fee

4. **Execution:**
   - Debit `from_type` asset from `EntityHolding`
   - Credit `to_type` asset to `EntityHolding`
   - Create `AssetTransaction` records for audit trail
   - Update swap request status to `COMPLETED`

5. **Commit:**
   - Commit transaction atomically
   - Rollback on any error

### Holdings Validation

Before creating or executing a swap:
- System checks `EntityHolding` table for available balance
- Validates `quantity <= available_balance`
- Returns clear error message if insufficient balance

### Anonymous Codes

- Format: `{2 letters}-{6 digits}` (e.g., "AB-123456")
- Generated using `generate_anonymous_code()`
- Ensured unique via database check
- Used for privacy in swap listings

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or business rule violation
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error (transaction rolled back)

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Security Considerations

1. **Authentication:** All endpoints (except public stats) require valid JWT token
2. **Authorization:** Users can only execute their own swap requests
3. **Input Validation:** All quantities must be > 0, types must be valid enum values
4. **Balance Validation:** Holdings checked before swap creation/execution
5. **Concurrent Execution:** Row-level locking prevents double-spending
6. **Transaction Safety:** Automatic rollback on errors ensures data consistency
7. **SQL Injection Protection:** Uses SQLAlchemy ORM with parameterized queries

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting to prevent:
- Swap spam
- Rapid-fire swap creation
- API abuse

Recommended limits:
- 10 swap creations per minute per user
- 5 swap executions per minute per user

---

## Audit Trail

All swap operations create `AssetTransaction` records:

- **Transaction Type:** `TRADE_SELL` for from_asset, `TRADE_BUY` for to_asset
- **Reference:** `SWAP-{anonymous_code}`
- **Notes:** Description of swap operation
- **Balance Tracking:** Records balance before and after transaction

Example transaction:
```json
{
  "entity_id": "uuid",
  "asset_type": "CEA",
  "transaction_type": "TRADE_SELL",
  "amount": -1000.00,
  "balance_before": 1000.00,
  "balance_after": 0.00,
  "reference": "SWAP-AB-123456",
  "notes": "Swap CEA to EUA",
  "created_by": "user_uuid",
  "created_at": "2026-01-25T10:35:00Z"
}
```

---

## Examples

### Complete Swap Flow

```bash
# 1. Get current swap rate
curl -X GET "http://localhost:8000/api/v1/swaps/rate"

# 2. Calculate swap output
curl -X GET "http://localhost:8000/api/v1/swaps/calculator?from_type=CEA&quantity=1000"

# 3. Create swap request
curl -X POST "http://localhost:8000/api/v1/swaps" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_type": "CEA",
    "to_type": "EUA",
    "quantity": 1000.00,
    "desired_rate": 0.0890
  }'

# 4. Execute swap
curl -X POST "http://localhost:8000/api/v1/swaps/{swap_id}/execute" \
  -H "Authorization: Bearer <token>"

# 5. Check my swaps
curl -X GET "http://localhost:8000/api/v1/swaps/my" \
  -H "Authorization: Bearer <token>"
```

### Get Available Swaps with Filters

```bash
curl -X GET "http://localhost:8000/api/v1/swaps/available?direction=cea_to_eua&min_quantity=500&page=1&per_page=20"
```

### Get Swap Offers

```bash
curl -X GET "http://localhost:8000/api/v1/swaps/offers"
```

---

## Troubleshooting

### "Insufficient balance" Error

**Problem:** Cannot create/execute swap due to insufficient holdings.

**Solution:**
- Check current balance via `GET /users/me/entity/assets`
- Ensure you have enough of the `from_type` asset
- Note: Holdings are checked at execution time, not creation time

### "Swap request is not open" Error

**Problem:** Trying to execute a swap that's already completed or cancelled.

**Solution:**
- Check swap status via `GET /swaps/my`
- Only `open` swaps can be executed
- Create a new swap request if needed

### "You can only execute your own swap requests" Error

**Problem:** Trying to execute someone else's swap request.

**Solution:**
- Use `GET /swaps/my` to see your own swaps
- Use `GET /swaps/available` to see all available swaps (for matching, not execution)

### Transaction Rollback

**Problem:** Swap execution fails and transaction is rolled back.

**Causes:**
- Database connection error
- Constraint violation
- Concurrent modification detected

**Solution:**
- Retry the operation
- Check error message for specific cause
- All changes are automatically rolled back - no partial state

---

## Related Documentation

- [Market Makers API](./MARKET_MAKERS_API.md) - Market maker management
- [Authentication API](./AUTHENTICATION.md) - User authentication
- [Operational Workflow](../08_Operational_Workflow_Live_Trading.md) - Complete swap workflow

---

## Changelog

### Version 1.1 (2026-01-25)

- ✅ Fixed ratio calculation for CEA_TO_EUA offers (now correctly shows CEA per EUA)
- ✅ Added price validation to prevent invalid calculations
- ✅ Enhanced error handling with user-facing error messages
- ✅ Improved TypeScript type safety (added SwapStats and SwapRate interfaces)
- ✅ Added input validation for calculator (NaN, negative, and large number checks)
- ✅ Enhanced accessibility with ARIA labels and keyboard navigation
- ✅ Fixed memory leak prevention using useCallback for data fetching
- ✅ Improved error state management in frontend components

### Version 1.0 (2026-01-25)

- ✅ Replaced all mock/simulation data with real database queries
- ✅ Implemented `POST /swaps` for creating swap requests
- ✅ Implemented `POST /swaps/{id}/execute` for executing swaps
- ✅ Implemented `GET /swaps/my` for user's swap requests
- ✅ Implemented `GET /swaps/offers` for market maker offers
- ✅ Added transaction rollback and row-level locking
- ✅ Added real 24h rate change calculation from price history
- ✅ Improved currency conversion using currency service
- ✅ Added user-facing error notifications in frontend
- ✅ Enhanced price scraper to use price_history as fallback
