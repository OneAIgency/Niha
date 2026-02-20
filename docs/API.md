# API Reference

This document extends the API information in `app_truth.md` with request/response examples for Contact, Introducer, and Admin onboarding. For price scraping see **`docs/ADMIN_SCRAPING.md`**. For auto-trade market settings see **`app_truth.md`** § Auto Trade & Liquidity Engine.

Base URL: `/api/v1`. All admin endpoints require authentication (e.g. `Cookie: access_token=...` or `Authorization: Bearer <token>`).

---

## Contact & Introducer

### POST /contact/request

Submit a contact request (no NDA). Creates a contact request with `user_role=NDA`, `request_flow=buyer`.

**Request (JSON)**

```http
POST /api/v1/contact/request
Content-Type: application/json
```

```json
{
  "entity_name": "Acme Corp",
  "contact_email": "contact@acme.com",
  "contact_first_name": "Jane",
  "contact_last_name": "Doe",
  "position": "Sustainability Manager"
}
```

**Response (200)** — `ContactRequestResponse`: `id`, `entity_name`, `contact_email`, `contact_first_name`, `contact_last_name`, `position`, `user_role` (e.g. `"NDA"`), `request_flow` (`"buyer"`), `created_at`, etc.

---

### POST /contact/nda-request

Submit an NDA request (buyer flow). Same body as below but creates `request_flow=buyer`. **Multipart form**: `entity_name`, `contact_email`, `contact_first_name`, `contact_last_name`, `position`, `file` (PDF).

---

### POST /contact/introducer-nda-request

Submit an NDA request for the **Introducer** flow. Creates a contact request with `user_role=NDA` and `request_flow=introducer`. Used by the `/introducer` page. Backoffice approves via create-from-request with `target_role=INTRODUCER`.

**Request (multipart/form-data)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_name` | string | Yes | Entity or company name |
| `contact_email` | string | Yes | Valid email |
| `contact_first_name` | string | Yes | First name |
| `contact_last_name` | string | Yes | Last name |
| `position` | string | Yes | Job title / position |
| `file` | file | Yes | Signed NDA document (PDF only, max 10MB) |

**Example (curl)**

```bash
curl -X POST "http://localhost:8000/api/v1/contact/introducer-nda-request" \
  -F "entity_name=Introducer Co" \
  -F "contact_email=intro@example.com" \
  -F "contact_first_name=John" \
  -F "contact_last_name=Smith" \
  -F "position=Partner" \
  -F "file=@/path/to/nda.pdf"
```

**Response (200)** — `ContactRequestResponse`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "entity_name": "Introducer Co",
  "contact_email": "intro@example.com",
  "contact_first_name": "John",
  "contact_last_name": "Smith",
  "position": "Partner",
  "nda_file_name": "nda.pdf",
  "user_role": "NDA",
  "request_flow": "introducer",
  "created_at": "2026-02-13T12:00:00.000000Z"
}
```

**Errors:** 400 (invalid email, file not PDF, file too large).

---

## Admin — Contact requests & create user

### GET /admin/contact-requests

List contact requests with optional filters. Admin only.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | — | Filter by `user_role` (e.g. NDA, KYC, REJECTED) |
| `request_flow` | string | — | `buyer` or `introducer` |
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (1–100) |

**Example**

```http
GET /api/v1/admin/contact-requests?request_flow=introducer&per_page=20
Cookie: access_token=...
```

**Response (200)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_name": "Introducer Co",
      "contact_email": "intro@example.com",
      "contact_first_name": "John",
      "contact_last_name": "Smith",
      "position": "Partner",
      "nda_file_name": "nda.pdf",
      "user_role": "NDA",
      "request_flow": "introducer",
      "notes": null,
      "created_at": "2026-02-13T12:00:00.000000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1
  }
}
```

---

### POST /admin/users/create-from-request

Create a user from an approved contact request. Admin only. For **Introducer** requests use `target_role=INTRODUCER` (user is created without an Entity). For buyer flow use default `target_role=KYC` (Entity is created).

**Query parameters (all required except where noted)**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request_id` | UUID | Yes | Contact request ID |
| `email` | string | Yes | User email (must be unique) |
| `first_name` | string | Yes | First name |
| `last_name` | string | Yes | Last name |
| `mode` | string | Yes | `manual` or `invitation` |
| `password` | string | If mode=manual | Required for manual; min 8 characters |
| `position` | string | No | Job title |
| `target_role` | string | No | `KYC` (default, buyer flow) or `INTRODUCER` |

**Example (Introducer)**

```http
POST /api/v1/admin/users/create-from-request?request_id=550e8400-e29b-41d4-a716-446655440000&email=intro@example.com&first_name=John&last_name=Smith&mode=manual&password=SecurePass123&target_role=INTRODUCER
Cookie: access_token=...
```

**Response (200)**

```json
{
  "message": "User created successfully",
  "success": true,
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "intro@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "INTRODUCER",
    "entity_id": null,
    "creation_method": "manual"
  }
}
```

For buyer flow (`target_role=KYC`), `user.entity_id` is set and `user.role` is `KYC`.

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Invalid `request_id` (not a valid UUID) |
| 400 | User with this email already exists |
| 400 | Password required / at least 8 characters (manual mode) |
| 404 | Contact request not found |
| 400/409/500 | From database or business logic (optional `details.hint` in body) |

---

## Cash Market

Requires funded user (CEA, ADMIN, or MM). See `app_truth.md` §5 and §8 for balances and client WebSocket.

### GET /cash-market/trades/{certificate_type}

Returns recent executed trades for the given certificate type. **side** is the aggressor (taker): BUY if the buy order was created at or after the sell order, else SELL.

**Query**

| Name   | Type | Default | Description        |
|--------|------|--------|--------------------|
| `limit`| int  | 50     | 1–100, max trades. |

**Response (200)** — List of `CashMarketTradeResponse`:

| Field             | Type   | Description                          |
|-------------------|--------|--------------------------------------|
| `id`              | UUID   | Trade id                             |
| `certificate_type`| string | `"CEA"` or `"EUA"`                  |
| `price`           | number | Execution price                     |
| `quantity`        | int    | Executed quantity                    |
| `side`            | string | `"BUY"` or `"SELL"` (aggressor side) |
| `executed_at`     | string | ISO 8601 datetime                    |

**Example**

```http
GET /api/v1/cash-market/trades/CEA?limit=20
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "certificate_type": "CEA",
    "price": 9.85,
    "quantity": 100,
    "side": "BUY",
    "executed_at": "2026-02-14T01:22:08.123456Z"
  }
]
```

### WebSocket: trade_executed

After a limit order matches, the backend broadcasts to all clients connected to **WS /api/v1/client/ws**:

| Field             | Type   | Description                |
|-------------------|--------|----------------------------|
| `type`            | string | `"trade_executed"`         |
| `data.id`         | string | Trade UUID                 |
| `data.certificate_type` | string | `"CEA"` or `"EUA"`   |
| `data.price`      | number | Execution price            |
| `data.quantity`   | int    | Executed quantity          |
| `data.side`       | string | `"BUY"` or `"SELL"`        |
| `data.executed_at`| string | ISO 8601 datetime          |

The frontend normalizes to camelCase (`executedAt`) and dispatches `nihao:tradeExecuted`; `useCashMarket` prepends to `recentTrades` (cap 20). Ticker and ACTIVITY on Cash Market Pro use this same state. The **CEA Price chart** on the same page fetches `GET /cash-market/trades/CEA?limit=100` on mount and subscribes to `nihao:tradeExecuted`, applying only CEA trades to the series.

---

## Other API docs

- **Price scraping (EUA/CEA):** `docs/ADMIN_SCRAPING.md` — GET/POST/PUT scraping-sources, test, refresh, 429 backoff, `is_primary`, config (`xpath_selector`, `css_selector`, `regex_pattern`).
- **Auto-trade market settings:** `app_truth.md` § Auto Trade & Liquidity Engine — GET/PUT auto-trade-market-settings, `avg_spread`, `tick_size`, response builder.
- **Deposits, backoffice, swap, cash market, auth:** `app_truth.md` §5, §8 and related sections.
