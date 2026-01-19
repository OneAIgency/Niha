# Market Makers API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/admin`
**Authentication:** Bearer Token (Admin role required)

## Overview

The Market Makers API allows administrators to create and manage Market Maker clients, handle asset transactions, and place orders on their behalf. All endpoints require admin authentication.

## Authentication

All endpoints require a valid JWT token with `role=ADMIN`:

```http
Authorization: Bearer <access_token>
```

To obtain a token:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@nihaogroup.com",
  "password": "admin123"
}
```

## Endpoints

### Market Makers Management

#### List All Market Makers

```http
GET /admin/market-makers
```

**Query Parameters:**
- None

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "MM-Alpha",
    "description": "Primary liquidity provider",
    "is_active": true,
    "current_balances": {
      "CEA": {
        "available": "10000.00",
        "locked": "1500.00",
        "total": "11500.00"
      },
      "EUA": {
        "available": "5000.00",
        "locked": "0.00",
        "total": "5000.00"
      }
    },
    "total_orders": 15,
    "total_trades": 8,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-19T14:20:00Z"
  }
]
```

---

#### Create Market Maker

```http
POST /admin/market-makers
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "MM-Alpha",
  "email": "mm-alpha@internal.com",
  "description": "Primary liquidity provider for CEA",
  "initial_balances": {
    "CEA": 10000,
    "EUA": 5000
  }
}
```

**Field Descriptions:**
- `name` (required) - Display name for the MM (1-100 chars)
- `email` (required) - Unique email address (valid email format)
- `description` (optional) - Admin notes
- `initial_balances` (optional) - Starting balances per certificate type

**Response:** `200 OK`
```json
{
  "market_maker": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "MM-Alpha",
    "description": "Primary liquidity provider for CEA",
    "is_active": true,
    "current_balances": {
      "CEA": {
        "available": "10000.00",
        "locked": "0.00",
        "total": "10000.00"
      },
      "EUA": {
        "available": "5000.00",
        "locked": "0.00",
        "total": "5000.00"
      }
    },
    "total_orders": 0,
    "total_trades": 0,
    "created_at": "2026-01-19T15:30:00Z",
    "updated_at": "2026-01-19T15:30:00Z"
  },
  "ticket_id": "TKT-2026-001234"
}
```

**Errors:**
- `400` - Email already exists, validation error
- `401` - Unauthorized
- `403` - Not admin

---

#### Update Market Maker

```http
PUT /admin/market-makers/{mm_id}
Content-Type: application/json
```

**Path Parameters:**
- `mm_id` (required) - Market Maker UUID

**Request Body:**
```json
{
  "name": "MM-Alpha-Updated",
  "description": "Updated description",
  "is_active": false
}
```

**Field Descriptions:**
- `name` (optional) - New display name
- `description` (optional) - New description
- `is_active` (optional) - Activate/deactivate MM

**Response:** `200 OK`
```json
{
  "market_maker": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "MM-Alpha-Updated",
    "description": "Updated description",
    "is_active": false,
    "current_balances": { ... },
    "total_orders": 15,
    "total_trades": 8,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-19T15:45:00Z"
  },
  "ticket_id": "TKT-2026-001235"
}
```

**Errors:**
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

#### Delete Market Maker (Soft Delete)

```http
DELETE /admin/market-makers/{mm_id}
```

**Path Parameters:**
- `mm_id` (required) - Market Maker UUID

**Response:** `200 OK`
```json
{
  "success": true,
  "ticket_id": "TKT-2026-001236"
}
```

**Notes:**
- This is a soft delete - sets `is_active = false`
- All historical data preserved
- Cannot place new orders but existing orders remain active
- Can be reactivated by updating `is_active` to `true`

**Errors:**
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

### Asset Transactions

#### Get Market Maker Balances

```http
GET /admin/market-makers/{mm_id}/balances
```

**Path Parameters:**
- `mm_id` (required) - Market Maker UUID

**Response:** `200 OK`
```json
{
  "CEA": {
    "available": "10000.00",
    "locked": "1500.00",
    "total": "11500.00"
  },
  "EUA": {
    "available": "5000.00",
    "locked": "0.00",
    "total": "5000.00"
  }
}
```

**Field Descriptions:**
- `available` - Free assets that can be sold
- `locked` - Assets locked in pending orders
- `total` - Available + Locked (calculated from transaction history)

**Formula:**
```
total = SUM(all transactions.amount)
locked = SUM(unfilled_orders.remaining_quantity)
available = total - locked
```

**Errors:**
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

#### List Transactions

```http
GET /admin/market-makers/{mm_id}/transactions
```

**Path Parameters:**
- `mm_id` (required) - Market Maker UUID

**Query Parameters:**
- `certificate_type` (optional) - Filter by CEA or EUA
- `limit` (optional) - Max results (default: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "ticket_id": "TKT-2026-001237",
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "transaction_type": "DEPOSIT",
    "amount": "10000.00",
    "balance_after": "10000.00",
    "notes": "Initial funding",
    "created_by": "uuid",
    "created_at": "2026-01-15T10:30:00Z"
  },
  {
    "id": "uuid",
    "ticket_id": "TKT-2026-001238",
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "transaction_type": "TRADE_DEBIT",
    "amount": "-1500.00",
    "balance_after": "8500.00",
    "notes": "Locked for order abc-123",
    "created_by": "uuid",
    "created_at": "2026-01-16T14:20:00Z"
  }
]
```

**Transaction Types:**
- `DEPOSIT` - Assets added (amount positive)
- `WITHDRAWAL` - Assets removed (amount negative)
- `TRADE_DEBIT` - Assets locked when order placed (amount negative)
- `TRADE_CREDIT` - Assets released when order cancelled (amount positive)

**Errors:**
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

#### Create Transaction (Deposit/Withdrawal)

```http
POST /admin/market-makers/{mm_id}/transactions
Content-Type: application/json
```

**Path Parameters:**
- `mm_id` (required) - Market Maker UUID

**Request Body:**
```json
{
  "certificate_type": "CEA",
  "transaction_type": "DEPOSIT",
  "amount": 5000,
  "notes": "Additional liquidity funding"
}
```

**Field Descriptions:**
- `certificate_type` (required) - "CEA" or "EUA"
- `transaction_type` (required) - "DEPOSIT" or "WITHDRAWAL"
- `amount` (required) - Positive number (system handles sign based on type)
- `notes` (optional) - Reason for transaction

**Response:** `200 OK`
```json
{
  "transaction": {
    "id": "uuid",
    "ticket_id": "TKT-2026-001239",
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "transaction_type": "DEPOSIT",
    "amount": "5000.00",
    "balance_after": "15000.00",
    "notes": "Additional liquidity funding",
    "created_by": "uuid",
    "created_at": "2026-01-19T16:00:00Z"
  },
  "new_balance": {
    "available": "15000.00",
    "locked": "0.00",
    "total": "15000.00"
  },
  "ticket_id": "TKT-2026-001239"
}
```

**Validation:**
- For WITHDRAWAL: Checks `amount <= available_balance`
- Cannot withdraw locked assets

**Errors:**
- `400` - Insufficient balance, invalid transaction type, MM not active
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

### Market Orders (Admin)

#### Get Order Book

```http
GET /admin/market-orders/orderbook/{certificate_type}
```

**Path Parameters:**
- `certificate_type` (required) - "CEA" or "EUA"

**Response:** `200 OK`
```json
{
  "asks": [
    {
      "price": "25.50",
      "quantity": "1500.00",
      "cumulative": "1500.00"
    },
    {
      "price": "25.75",
      "quantity": "2000.00",
      "cumulative": "3500.00"
    }
  ],
  "bids": [
    {
      "price": "25.00",
      "quantity": "1000.00",
      "cumulative": "1000.00"
    },
    {
      "price": "24.75",
      "quantity": "800.00",
      "cumulative": "1800.00"
    }
  ],
  "spread": "0.50",
  "mid_price": "25.25"
}
```

**Notes:**
- This is a replica of the public cash market order book
- Includes all orders (MM and regular users)
- Asks sorted by price ascending
- Bids sorted by price descending

**Errors:**
- `400` - Invalid certificate type
- `401` - Unauthorized
- `403` - Not admin

---

#### Place Market Maker Order

```http
POST /admin/market-orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "market_maker_id": "uuid",
  "certificate_type": "CEA",
  "side": "SELL",
  "price": 25.50,
  "quantity": 1000
}
```

**Field Descriptions:**
- `market_maker_id` (required) - MM UUID
- `certificate_type` (required) - "CEA" or "EUA"
- `side` (required) - Must be "SELL" (only sell orders allowed for MMs)
- `price` (required) - Price per certificate (positive decimal)
- `quantity` (required) - Number of certificates (positive integer/decimal)

**Response:** `200 OK`
```json
{
  "order": {
    "id": "uuid",
    "entity_id": null,
    "user_id": "uuid",
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "side": "SELL",
    "order_type": "LIMIT",
    "price": "25.50",
    "quantity": "1000.00",
    "filled_quantity": "0.00",
    "status": "PENDING",
    "created_at": "2026-01-19T16:15:00Z",
    "updated_at": "2026-01-19T16:15:00Z"
  },
  "ticket_id": "TKT-2026-001240"
}
```

**What Happens:**
1. Validates MM exists and is active
2. Checks available balance >= quantity
3. Creates order with status=PENDING
4. Creates TRADE_DEBIT transaction (locks assets)
5. Order appears in public cash market
6. Generates audit ticket

**Balance Impact:**
```
Before: Available=10000, Locked=0, Total=10000
After:  Available=9000, Locked=1000, Total=10000
```

**Validation:**
- MM must exist and be active
- Must have sufficient available balance
- Side must be "SELL" (BUY not allowed)
- Price and quantity must be positive

**Errors:**
- `400` - Insufficient balance, MM not active, invalid side, validation error
- `404` - Market Maker not found
- `401` - Unauthorized
- `403` - Not admin

---

#### List Market Maker Orders

```http
GET /admin/market-orders
```

**Query Parameters:**
- `market_maker_id` (optional) - Filter by specific MM
- `status` (optional) - Filter by PENDING, PARTIALLY_FILLED, FILLED, CANCELLED
- `certificate_type` (optional) - Filter by CEA or EUA
- `limit` (optional) - Max results (default: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "entity_id": null,
    "user_id": "uuid",
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "side": "SELL",
    "order_type": "LIMIT",
    "price": "25.50",
    "quantity": "1000.00",
    "filled_quantity": "300.00",
    "status": "PARTIALLY_FILLED",
    "created_at": "2026-01-19T16:15:00Z",
    "updated_at": "2026-01-19T16:30:00Z"
  }
]
```

**Order Status:**
- `PENDING` - No fills yet
- `PARTIALLY_FILLED` - Some quantity filled
- `FILLED` - Completely matched
- `CANCELLED` - Cancelled by admin

**Errors:**
- `401` - Unauthorized
- `403` - Not admin

---

#### Cancel Market Maker Order

```http
DELETE /admin/market-orders/{order_id}
```

**Path Parameters:**
- `order_id` (required) - Order UUID

**Response:** `200 OK`
```json
{
  "success": true,
  "ticket_id": "TKT-2026-001241"
}
```

**What Happens:**
1. Verifies order belongs to a Market Maker
2. Checks order status (must be PENDING or PARTIALLY_FILLED)
3. Sets order status to CANCELLED
4. Creates TRADE_CREDIT transaction (releases locked assets)
5. Removes from public order book
6. Generates audit ticket

**Balance Impact:**
```
Unfilled Quantity: 700 CEA

Before: Available=9000, Locked=1000, Total=10000
After:  Available=9700, Locked=300, Total=10000
         (300 still locked in other orders)
```

**Validation:**
- Order must exist and belong to MM
- Order status must be PENDING or PARTIALLY_FILLED
- Cannot cancel FILLED or already CANCELLED orders

**Errors:**
- `400` - Cannot cancel order in current status
- `404` - Order not found or not a MM order
- `401` - Unauthorized
- `403` - Not admin

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Validation error, insufficient balance, invalid data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Not admin role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error (check logs) |

---

## Audit Logging

Every successful mutation generates a **Ticket ID** returned in the response. These tickets are viewable in the Logging API and provide complete audit trail.

**Ticket Format:** `TKT-YYYY-NNNNNN`
**Example:** `TKT-2026-001234`

**Action Types Generated:**
- `MM_CREATED` - Market Maker created
- `MM_UPDATED` - MM details updated
- `MM_DELETED` - MM deactivated
- `ASSET_DEPOSIT` - Assets added
- `ASSET_WITHDRAWAL` - Assets removed
- `ASSET_TRADE_DEBIT` - Assets locked
- `ASSET_TRADE_CREDIT` - Assets released
- `MM_ORDER_PLACED` - Order created
- `MM_ORDER_CANCELLED` - Order cancelled
- `MM_TRADE_EXECUTED` - Trade matched (automatic)

See [LOGGING_API.md](./LOGGING_API.md) for audit log retrieval.

---

## Rate Limits

**Current:** No rate limits enforced
**Recommended:** 100 requests/minute per admin user for production

---

## Versioning

**Current Version:** v1
**Base Path:** `/api/v1/admin`

Future versions will use `/api/v2/admin` etc.

---

## Testing

See [E2E Test Plan](../testing/market-makers-e2e-test-plan.md) for comprehensive testing guide.

**Quick Test:**
```bash
# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nihaogroup.com","password":"admin123"}' \
  | jq -r '.access_token')

# Create MM
curl -X POST http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MM-Test",
    "email": "mm-test@test.com",
    "initial_balances": {"CEA": 1000}
  }'
```

---

## Support

**Documentation:**
- Admin Guide: [MARKET_MAKERS_GUIDE.md](../admin/MARKET_MAKERS_GUIDE.md)
- Logging API: [LOGGING_API.md](./LOGGING_API.md)
- System Design: [market-makers-system-design.md](../plans/2026-01-19-market-makers-system-design.md)

**Issues:** Report to platform-support@company.com

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19
