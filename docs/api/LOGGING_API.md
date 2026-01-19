# Audit Logging API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/admin/logging`
**Authentication:** Bearer Token (Admin role required)

## Overview

The Logging API provides comprehensive audit trail access for all system actions. Every mutation in the Market Makers system generates a unique **Ticket ID** that can be queried, filtered, and analyzed through these endpoints.

## Authentication

All endpoints require a valid JWT token with `role=ADMIN`:

```http
Authorization: Bearer <access_token>
```

## Ticket Structure

**Ticket ID Format:** `TKT-YYYY-NNNNNN`
**Example:** `TKT-2026-001234`

**Components:**
- `TKT` - Ticket prefix
- `YYYY` - Year (resets annually)
- `NNNNNN` - Sequential 6-digit number (zero-padded)

## Endpoints

### List Tickets (with Filtering)

```http
GET /admin/logging/tickets
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | ISO DateTime | Start of time range |
| `date_to` | ISO DateTime | End of time range |
| `action_type` | Array[String] | Filter by action types |
| `user_id` | UUID | Filter by user who performed action |
| `market_maker_id` | UUID | Filter by MM involved |
| `status` | String | SUCCESS or FAILED |
| `entity_type` | String | Filter by entity (Order, MarketMaker, etc.) |
| `entity_id` | UUID | Filter by specific entity instance |
| `search` | String | Search ticket_id or tags |
| `tags` | Array[String] | Filter by tags |
| `limit` | Integer | Max results (default: 100, max: 1000) |
| `offset` | Integer | Pagination offset (default: 0) |

**Example Request:**
```http
GET /admin/logging/tickets?action_type=MM_CREATED&action_type=MM_UPDATED&status=SUCCESS&limit=50
```

**Response:** `200 OK`
```json
{
  "total": 234,
  "tickets": [
    {
      "id": "uuid",
      "ticket_id": "TKT-2026-001234",
      "timestamp": "2026-01-19T16:30:00Z",
      "user_id": "uuid",
      "market_maker_id": "uuid",
      "action_type": "MM_CREATED",
      "entity_type": "MarketMaker",
      "entity_id": "uuid",
      "status": "SUCCESS",
      "request_payload": {
        "name": "MM-Alpha",
        "email": "mm-alpha@internal.com",
        "description": "Primary liquidity provider"
      },
      "response_data": {
        "id": "uuid",
        "name": "MM-Alpha"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "before_state": null,
      "after_state": {
        "id": "uuid",
        "name": "MM-Alpha",
        "is_active": true
      },
      "related_ticket_ids": [],
      "tags": ["market_maker", "creation"]
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Not admin

---

### Get Single Ticket

```http
GET /admin/logging/tickets/{ticket_id}
```

**Path Parameters:**
- `ticket_id` (required) - Ticket ID (e.g., TKT-2026-001234)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "ticket_id": "TKT-2026-001234",
  "timestamp": "2026-01-19T16:30:00Z",
  "user_id": "uuid",
  "market_maker_id": "uuid",
  "action_type": "MM_ORDER_PLACED",
  "entity_type": "Order",
  "entity_id": "uuid",
  "status": "SUCCESS",
  "request_payload": {
    "market_maker_id": "uuid",
    "certificate_type": "CEA",
    "price": 25.50,
    "quantity": 1000
  },
  "response_data": {
    "order_id": "uuid",
    "status": "PENDING"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "before_state": null,
  "after_state": {
    "order_id": "uuid",
    "status": "PENDING"
  },
  "related_ticket_ids": ["TKT-2026-001235"],
  "tags": ["market_maker", "order", "placement"]
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Internal database ID |
| `ticket_id` | String | Public ticket identifier |
| `timestamp` | DateTime | When action occurred |
| `user_id` | UUID | Who performed action (null if system) |
| `market_maker_id` | UUID | MM involved (null if not MM action) |
| `action_type` | String | What was done |
| `entity_type` | String | What was affected |
| `entity_id` | UUID | Specific instance affected |
| `status` | Enum | SUCCESS or FAILED |
| `request_payload` | JSON | Complete request data sent |
| `response_data` | JSON | Complete response returned |
| `ip_address` | String | IP address of requester |
| `user_agent` | String | Browser/client info |
| `before_state` | JSON | Entity state before (updates/deletes) |
| `after_state` | JSON | Entity state after (creates/updates) |
| `related_ticket_ids` | Array | Linked ticket IDs |
| `tags` | Array | Categorization tags |

**Errors:**
- `404` - Ticket not found
- `401` - Unauthorized
- `403` - Not admin

---

### Get Logging Statistics

```http
GET /admin/logging/stats
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | ISO DateTime | Start of analysis period (optional) |
| `date_to` | ISO DateTime | End of analysis period (optional) |

**Response:** `200 OK`
```json
{
  "total_actions": 1523,
  "success_count": 1498,
  "failed_count": 25,
  "by_action_type": {
    "MM_ORDER_PLACED": 342,
    "MM_TRADE_EXECUTED": 198,
    "ASSET_DEPOSIT": 89,
    "MM_CREATED": 15,
    "MM_ORDER_CANCELLED": 56
  },
  "by_user": [
    {
      "user_id": "uuid",
      "email": "admin@nihaogroup.com",
      "count": 856
    },
    {
      "user_id": "uuid",
      "email": "admin2@nihaogroup.com",
      "count": 324
    }
  ],
  "actions_over_time": []
}
```

**Use Cases:**
- Dashboard overview
- Compliance reporting
- Activity monitoring
- Performance analysis

**Errors:**
- `401` - Unauthorized
- `403` - Not admin

---

### List Market Maker Actions

```http
GET /admin/logging/market-maker-actions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | Integer | Max results (default: 100) |
| `offset` | Integer | Pagination offset (default: 0) |

**Pre-Filtered:** `market_maker_id IS NOT NULL`

**Response:** Same structure as List Tickets endpoint

```json
{
  "total": 145,
  "tickets": [
    {
      "id": "uuid",
      "ticket_id": "TKT-2026-001240",
      "timestamp": "2026-01-19T17:00:00Z",
      "user_id": "uuid",
      "market_maker_id": "uuid",
      "action_type": "MM_ORDER_PLACED",
      "entity_type": "Order",
      "entity_id": "uuid",
      "status": "SUCCESS",
      ...
    }
  ]
}
```

**Action Types Included:**
- `MM_CREATED`
- `MM_UPDATED`
- `MM_DELETED`
- `ASSET_DEPOSIT`
- `ASSET_WITHDRAWAL`
- `ASSET_TRADE_DEBIT`
- `ASSET_TRADE_CREDIT`
- `MM_ORDER_PLACED`
- `MM_ORDER_CANCELLED`
- `MM_TRADE_EXECUTED`

**Errors:**
- `401` - Unauthorized
- `403` - Not admin

---

### List Failed Actions

```http
GET /admin/logging/failed-actions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | Integer | Max results (default: 100) |
| `offset` | Integer | Pagination offset (default: 0) |

**Pre-Filtered:** `status = FAILED`

**Response:** Same structure as List Tickets endpoint

```json
{
  "total": 25,
  "tickets": [
    {
      "id": "uuid",
      "ticket_id": "TKT-2026-001245",
      "timestamp": "2026-01-19T17:15:00Z",
      "user_id": "uuid",
      "market_maker_id": "uuid",
      "action_type": "MM_ORDER_PLACED",
      "entity_type": "Order",
      "entity_id": null,
      "status": "FAILED",
      "request_payload": {
        "market_maker_id": "uuid",
        "quantity": 99999
      },
      "response_data": {
        "detail": "Insufficient available balance"
      },
      ...
    }
  ]
}
```

**Use Cases:**
- Error monitoring
- Security monitoring (repeated failures)
- Debugging
- User support

**Common Failure Reasons:**
- Insufficient balance
- Invalid input data
- Inactive MM
- Unauthorized access attempts
- System errors

**Errors:**
- `401` - Unauthorized
- `403` - Not admin

---

## Action Types Reference

### Market Maker Actions

| Action Type | Description | Entity Type |
|-------------|-------------|-------------|
| `MM_CREATED` | Market Maker created | MarketMaker |
| `MM_UPDATED` | MM details updated | MarketMaker |
| `MM_DELETED` | MM deactivated (soft delete) | MarketMaker |

### Asset Transaction Actions

| Action Type | Description | Entity Type |
|-------------|-------------|-------------|
| `ASSET_DEPOSIT` | Assets added to MM | AssetTransaction |
| `ASSET_WITHDRAWAL` | Assets removed from MM | AssetTransaction |
| `ASSET_TRADE_DEBIT` | Assets locked for order | AssetTransaction |
| `ASSET_TRADE_CREDIT` | Assets released from order | AssetTransaction |

### Order Actions

| Action Type | Description | Entity Type |
|-------------|-------------|-------------|
| `MM_ORDER_PLACED` | Order created | Order |
| `MM_ORDER_CANCELLED` | Order cancelled | Order |
| `MM_TRADE_EXECUTED` | Order matched with buyer | Trade |

### User Actions (Regular Platform)

| Action Type | Description | Entity Type |
|-------------|-------------|-------------|
| `USER_LOGIN` | User logged in | User |
| `USER_LOGOUT` | User logged out | User |
| `USER_LOGIN_FAILED` | Login attempt failed | User |
| `USER_CREATED` | New user registered | User |
| `USER_UPDATED` | User profile updated | User |
| `ORDER_PLACED` | Regular user order | Order |
| `ORDER_CANCELLED` | Regular user cancellation | Order |
| `TRADE_EXECUTED` | Regular trade | Trade |

---

## Tag Reference

Tags are used for categorization and searching. Common tags:

| Tag | Used For |
|-----|----------|
| `market_maker` | All MM-related actions |
| `creation` | Entity creation actions |
| `update` | Entity update actions |
| `deletion` | Entity deletion actions |
| `asset_transaction` | All asset movements |
| `deposit` | Asset deposits |
| `withdrawal` | Asset withdrawals |
| `order` | Order-related actions |
| `placement` | Order placements |
| `cancellation` | Order cancellations |
| `trade` | Trade executions |

---

## Advanced Filtering Examples

### Find all failed order placements in last 24 hours
```http
GET /admin/logging/tickets?action_type=MM_ORDER_PLACED&status=FAILED&date_from=2026-01-18T17:00:00Z
```

### Find all actions by specific admin
```http
GET /admin/logging/tickets?user_id=<admin_uuid>&limit=100
```

### Find all transactions for specific MM
```http
GET /admin/logging/tickets?market_maker_id=<mm_uuid>&tags=asset_transaction
```

### Search by ticket ID
```http
GET /admin/logging/tickets?search=TKT-2026-001234
```

### Find all deposits in date range
```http
GET /admin/logging/tickets?action_type=ASSET_DEPOSIT&date_from=2026-01-01T00:00:00Z&date_to=2026-01-31T23:59:59Z
```

---

## Related Tickets

Tickets are linked through `related_ticket_ids` to show action chains:

**Example Flow:**
```
1. TKT-2026-001234: MM_ORDER_PLACED
   ↓ (related)
2. TKT-2026-001235: ASSET_TRADE_DEBIT (locks assets)
   ↓ (related)
3. TKT-2026-001236: MM_TRADE_EXECUTED (order matched)
```

**Use Case:** Trace complete lifecycle of an order from placement to execution.

---

## Pagination

For large result sets, use `limit` and `offset`:

```http
# First page (50 results)
GET /admin/logging/tickets?limit=50&offset=0

# Second page (next 50)
GET /admin/logging/tickets?limit=50&offset=50

# Third page
GET /admin/logging/tickets?limit=50&offset=100
```

**Response includes `total` count:**
```json
{
  "total": 234,
  "tickets": [ ... ]
}
```

**Calculate pages:** `total_pages = ceil(total / limit)`

---

## Performance Considerations

**Indexes:** All filter fields are indexed for fast queries:
- `timestamp`
- `action_type`
- `entity_type`
- `status`
- `user_id`
- `market_maker_id`
- `entity_id`
- `tags` (GIN index for array search)

**Recommendations:**
- Use date ranges when querying large datasets
- Limit results to reasonable amounts (100-1000)
- Use specific filters rather than broad searches
- Cache statistics results (updated every 5 minutes)

**Query Performance:**
- Filtered queries: <100ms
- Full table scan: ~500ms (avoid)
- Statistics aggregation: ~200ms

---

## Export & Archival

**Current:** No export endpoint (coming in v2)

**Workaround:** Query with pagination and save locally:
```bash
#!/bin/bash
TOKEN="your_token"
PAGE=0
LIMIT=1000

while true; do
  RESPONSE=$(curl -s "http://localhost:8000/api/v1/admin/logging/tickets?limit=$LIMIT&offset=$((PAGE*LIMIT))" \
    -H "Authorization: Bearer $TOKEN")

  TICKETS=$(echo $RESPONSE | jq '.tickets | length')

  if [ $TICKETS -eq 0 ]; then
    break
  fi

  echo $RESPONSE > "tickets_page_$PAGE.json"
  PAGE=$((PAGE+1))
done
```

---

## Retention Policy

**Current:** Indefinite retention (never deleted)

**Future Considerations:**
- Cold storage after 1 year
- Archival to S3 after 2 years
- Compliance requirements may mandate 7-10 year retention

---

## Compliance & Regulations

**Audit Trail Requirements:**

✅ **Immutable** - Tickets cannot be modified or deleted
✅ **Comprehensive** - Every mutation logged
✅ **Traceable** - Unique IDs with related ticket linking
✅ **Timestamped** - Precise action timestamps
✅ **Attributed** - User ID captured
✅ **Detailed** - Before/after state snapshots

**Use for:**
- SOC 2 compliance
- GDPR audit trails
- Financial regulations
- Internal audits
- Security investigations

---

## Monitoring & Alerts

**Recommended Alerts:**

1. **High Failure Rate**
   - Trigger: `failed_count / total_actions > 0.05` (5%)
   - Action: Investigate system issues

2. **Unusual Activity**
   - Trigger: `actions_in_hour > avg_hourly * 3`
   - Action: Security review

3. **Failed Admin Actions**
   - Trigger: Any failed action by admin
   - Action: Immediate notification

4. **No Activity**
   - Trigger: No tickets created in 24 hours
   - Action: Check system health

---

## Error Responses

All errors follow standard format:

```json
{
  "detail": "Error message"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not admin) |
| 404 | Ticket not found |
| 500 | Internal server error |

---

## Testing

**Quick Test:**
```bash
# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nihaogroup.com","password":"admin123"}' \
  | jq -r '.access_token')

# Get recent tickets
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.tickets[] | {ticket_id, action_type, timestamp}'

# Get statistics
curl -X GET "http://localhost:8000/api/v1/admin/logging/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{total: .total_actions, success_rate: (.success_count / .total_actions * 100)}'
```

---

## Support

**Documentation:**
- Admin Guide: [MARKET_MAKERS_GUIDE.md](../admin/MARKET_MAKERS_GUIDE.md)
- Market Makers API: [MARKET_MAKERS_API.md](./MARKET_MAKERS_API.md)
- Test Plan: [market-makers-e2e-test-plan.md](../testing/market-makers-e2e-test-plan.md)

**Issues:** Report to platform-support@company.com

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19
