# Settlement API Documentation

**Version:** 1.0  
**Base URL:** `/api/v1/settlement`  
**Authentication:** Bearer Token (Required for all endpoints)

## Overview

The Settlement API provides endpoints for viewing and managing settlement batches. Settlements track the external settlement process for CEA purchases and CEA→EUA swaps, with status updates and progress tracking.

## Authentication

All endpoints require a valid JWT token:

```http
Authorization: Bearer <access_token>
```

## Endpoints

### Get Pending Settlements

Retrieve all pending settlements for the authenticated user's entity.

```http
GET /api/v1/settlement/pending
```

**Query Parameters:**
- `settlement_type` (optional, enum): Filter by settlement type
  - `CEA_PURCHASE` - CEA purchase settlements
  - `SWAP_CEA_TO_EUA` - Swap settlements
- `status_filter` (optional, enum): Filter by status
  - `PENDING`, `TRANSFER_INITIATED`, `IN_TRANSIT`, `AT_CUSTODY`, `SETTLED`, `FAILED`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batch_reference": "SET-2026-000001-CEA",
      "settlement_type": "CEA_PURCHASE",
      "status": "TRANSFER_INITIATED",
      "asset_type": "CEA",
      "quantity": 1082.86,
      "price": 12.96,
      "total_value_eur": 14031.56,
      "expected_settlement_date": "2026-01-28T00:00:00Z",
      "actual_settlement_date": null,
      "progress_percent": 25.0,
      "created_at": "2026-01-25T10:00:00Z",
      "updated_at": "2026-01-26T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not associated with an entity

---

### Get Settlement Details

Get detailed information about a specific settlement batch, including full timeline.

```http
GET /api/v1/settlement/{settlement_batch_id}
```

**Path Parameters:**
- `settlement_batch_id` (UUID, required): The settlement batch ID

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "batch_reference": "SET-2026-000001-CEA",
  "settlement_type": "CEA_PURCHASE",
  "status": "TRANSFER_INITIATED",
  "asset_type": "CEA",
  "quantity": 1082.86,
  "price": 12.96,
  "total_value_eur": 14031.56,
  "expected_settlement_date": "2026-01-28T00:00:00Z",
  "actual_settlement_date": null,
  "registry_reference": null,
  "counterparty_id": "660e8400-e29b-41d4-a716-446655440001",
  "counterparty_type": "MARKET_MAKER",
  "notes": null,
  "progress_percent": 25.0,
  "timeline": [
    {
      "status": "PENDING",
      "notes": "Settlement batch created for CEA purchase",
      "created_at": "2026-01-25T10:00:00Z",
      "updated_by": null
    },
    {
      "status": "TRANSFER_INITIATED",
      "notes": "Status automatically updated based on timeline (T+1)",
      "created_at": "2026-01-26T10:00:00Z",
      "updated_by": null
    }
  ],
  "created_at": "2026-01-25T10:00:00Z",
  "updated_at": "2026-01-26T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view this settlement
- `404 Not Found` - Settlement batch not found

---

### Get Settlement Timeline

Get the complete status history timeline for a settlement batch.

```http
GET /api/v1/settlement/{settlement_batch_id}/timeline
```

**Path Parameters:**
- `settlement_batch_id` (UUID, required): The settlement batch ID

**Response:** `200 OK`
```json
{
  "settlement_batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "batch_reference": "SET-2026-000001-CEA",
  "current_status": "TRANSFER_INITIATED",
  "expected_settlement_date": "2026-01-28T00:00:00Z",
  "progress_percent": 25.0,
  "timeline": [
    {
      "status": "PENDING",
      "notes": "Settlement batch created for CEA purchase",
      "created_at": "2026-01-25T10:00:00Z",
      "updated_by": null
    },
    {
      "status": "TRANSFER_INITIATED",
      "notes": "Status automatically updated based on timeline (T+1)",
      "created_at": "2026-01-26T10:00:00Z",
      "updated_by": null
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view this settlement
- `404 Not Found` - Settlement batch not found

---

## Data Models

### SettlementBatch

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique settlement batch identifier |
| `batch_reference` | String | Human-readable reference (e.g., "SET-2026-000001-CEA") |
| `settlement_type` | Enum | `CEA_PURCHASE` or `SWAP_CEA_TO_EUA` |
| `status` | Enum | Current settlement status |
| `asset_type` | Enum | `CEA` or `EUA` |
| `quantity` | Decimal | Asset quantity being settled |
| `price` | Decimal | Price per unit in EUR |
| `total_value_eur` | Decimal | Total value in EUR |
| `expected_settlement_date` | DateTime | Expected completion date (business days) |
| `actual_settlement_date` | DateTime? | Actual completion date (null until settled) |
| `registry_reference` | String? | External registry reference |
| `counterparty_id` | UUID? | Counterparty entity ID |
| `counterparty_type` | String? | `SELLER` or `MARKET_MAKER` |
| `progress_percent` | Float | Settlement progress (0-100) |

### SettlementStatus

| Status | Description | Progress % |
|--------|-------------|------------|
| `PENDING` | Order confirmed, waiting for T+1 | 0% |
| `TRANSFER_INITIATED` | Transfer started (T+1) | 25% |
| `IN_TRANSIT` | In registry processing (T+2) | 50% |
| `AT_CUSTODY` | At custody, ready to finalize | 75% |
| `SETTLED` | Settlement completed | 100% |
| `FAILED` | Settlement failed | 0% |

### SettlementType

- `CEA_PURCHASE` - CEA purchase settlement (T+3 business days)
- `SWAP_CEA_TO_EUA` - Swap settlement (CEA: T+2, EUA: T+5 business days)

---

## Business Rules

### Settlement Timelines

**CEA Purchase:**
- T+0: Order executed, settlement created (PENDING)
- T+1: Transfer initiated (TRANSFER_INITIATED)
- T+2: In transit (IN_TRANSIT)
- T+3: At custody → Settled (AT_CUSTODY → SETTLED)

**Swap CEA Outbound:**
- T+0: Swap executed, CEA deducted (PENDING)
- T+1: Transfer initiated (TRANSFER_INITIATED)
- T+2: At counterparty → Settled (AT_CUSTODY → SETTLED)

**Swap EUA Inbound:**
- T+0: Swap executed (PENDING)
- T+2: Transfer initiated (TRANSFER_INITIATED)
- T+3: At custody (AT_CUSTODY)
- T+5: Delivered → Settled (SETTLED)

**Note:** All timelines use business days (weekends excluded).

### Status Transitions

Status transitions are validated. Only these transitions are allowed:

- `PENDING` → `TRANSFER_INITIATED` or `FAILED`
- `TRANSFER_INITIATED` → `IN_TRANSIT` or `FAILED`
- `IN_TRANSIT` → `AT_CUSTODY` or `FAILED`
- `AT_CUSTODY` → `SETTLED` or `FAILED`
- `SETTLED` → (terminal state)
- `FAILED` → (terminal state)

Invalid transitions will return a `400 Bad Request` error.

### Batch Reference Format

Batch references follow the format: `SET-{YEAR}-{COUNTER:06d}-{ASSET_TYPE}`

Example: `SET-2026-000001-CEA`

The counter is database-driven to ensure uniqueness.

---

## Progress Calculation

Progress is calculated based on:
1. **Status-based progress** (base):
   - PENDING: 0%
   - TRANSFER_INITIATED: 25%
   - IN_TRANSIT: 50%
   - AT_CUSTODY: 75%
   - SETTLED: 100%
   - FAILED: 0%

2. **Time-based progress** (additional, max 25%):
   - Calculated as: `(elapsed_days / total_days) * 25%`
   - Only applies if not SETTLED or FAILED
   - Capped at 95% for overdue settlements

---

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "detail": "Not authorized to view this settlement"
}
```

**404 Not Found**
```json
{
  "detail": "Settlement batch {id} not found"
}
```

**400 Bad Request** (Invalid status transition)
```json
{
  "detail": "Invalid status transition: PENDING -> SETTLED. Valid transitions from PENDING: ['TRANSFER_INITIATED', 'FAILED']"
}
```

---

## Examples

### Get All Pending CEA Purchases

```bash
curl -X GET "https://api.example.com/api/v1/settlement/pending?settlement_type=CEA_PURCHASE" \
  -H "Authorization: Bearer <token>"
```

### Get Settlement Details

```bash
curl -X GET "https://api.example.com/api/v1/settlement/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

### Get Settlement Timeline

```bash
curl -X GET "https://api.example.com/api/v1/settlement/550e8400-e29b-41d4-a716-446655440000/timeline" \
  -H "Authorization: Bearer <token>"
```

---

## Background Processing

Settlements are automatically processed by a background job that runs hourly:

1. Queries all non-settled settlements
2. Calculates expected status based on business days elapsed
3. Updates status if needed
4. Sends email notifications
5. Finalizes settlements when status becomes SETTLED

Users don't need to manually trigger status updates - they happen automatically.

---

## Email Notifications

Users receive email notifications at key stages:

1. **Confirmation Email** (T+0): Settlement created
2. **Status Update Emails**: Each status change
3. **Completion Email**: When settlement is finalized

All emails are sent asynchronously and failures don't affect settlement processing.
