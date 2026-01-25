# Admin Scraping Sources API

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Base URL:** `/api/v1/admin`  
**Authentication:** Bearer Token (Admin role required)

## Overview

The Admin Scraping API lets administrators manage price-scraping sources (EUA/CEA) used by the platform. Sources are configured with a URL, certificate type, scraping library (HTTPX, BeautifulSoup, Selenium, Playwright), and scrape interval. The Settings UI (`/settings`) consumes these endpoints.

All endpoints require a valid JWT with `role=ADMIN`:

```http
Authorization: Bearer <access_token>
```

## Endpoints

### Get all scraping sources

```http
GET /admin/scraping-sources
```

**Response:** `200 OK`

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "EUA",
    "url": "https://carboncredits.com/carbon-prices-today/",
    "certificate_type": "EUA",
    "scrape_library": "HTTPX",
    "is_active": true,
    "scrape_interval_minutes": 5,
    "last_scrape_at": "2026-01-25T14:30:00Z",
    "last_scrape_status": "success",
    "last_price": 88.65,
    "config": null,
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-25T14:30:00Z"
  }
]
```

**Notes:**
- `last_scrape_status`: `success` | `failed` | `timeout`
- `scrape_library`: `HTTPX` | `BEAUTIFULSOUP` | `SELENIUM` | `PLAYWRIGHT`
- Sources are ordered by `created_at` descending

---

### Create scraping source

```http
POST /admin/scraping-sources
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "CEA China",
  "url": "https://example.com/cea-prices",
  "certificate_type": "CEA",
  "scrape_library": "HTTPX",
  "scrape_interval_minutes": 10,
  "config": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–100 chars |
| `url` | string | Yes | 1–500 chars |
| `certificate_type` | string | Yes | `EUA` or `CEA` |
| `scrape_library` | string | No | Default `HTTPX` |
| `scrape_interval_minutes` | int | No | 1–60, default 5 |
| `config` | object | No | Optional CSS selectors, regex, etc. |

**Response:** `200 OK`

Returns the full source object (same shape as GET), including `last_scrape_at`, `last_scrape_status`, `last_price`, `updated_at` (null for new sources).

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "name": "CEA China",
  "url": "https://example.com/cea-prices",
  "certificate_type": "CEA",
  "scrape_library": "HTTPX",
  "is_active": true,
  "scrape_interval_minutes": 10,
  "last_scrape_at": null,
  "last_scrape_status": null,
  "last_price": null,
  "config": null,
  "created_at": "2026-01-25T15:00:00Z",
  "updated_at": "2026-01-25T15:00:00Z"
}
```

---

### Update scraping source

```http
PUT /admin/scraping-sources/{source_id}
Content-Type: application/json
```

**Path parameters:** `source_id` (UUID)

**Request body:** Partial update; all fields optional.

```json
{
  "name": "EUA Updated",
  "scrape_interval_minutes": 15,
  "scrape_library": "BEAUTIFULSOUP"
}
```

**Response:** `200 OK`

```json
{
  "message": "Scraping source updated",
  "success": true
}
```

**Error responses:**
- `404 Not Found`: Scraping source not found

---

### Test scraping source

Runs a single scrape for the given source. Does not persist results.

```http
POST /admin/scraping-sources/{source_id}/test
```

**Path parameters:** `source_id` (UUID)

**Response:** `200 OK`

**Success:**
```json
{
  "success": true,
  "message": "Scrape successful",
  "price": 88.65
}
```

**Failure (still 200):**
```json
{
  "success": false,
  "message": "Scrape failed. Check URL, selectors, and network.",
  "price": null
}
```

**Notes:**
- Always returns `200`; check `success` to determine outcome.
- `message` is user-oriented; full details are logged server-side.
- `404`: Source not found.

---

### Refresh scraping source

Performs a scrape and persists `last_price`, `last_scrape_at`, `last_scrape_status`, and `PriceHistory`.

```http
POST /admin/scraping-sources/{source_id}/refresh
```

**Path parameters:** `source_id` (UUID)

**Response:** `200 OK`

```json
{
  "message": "Prices refreshed successfully"
}
```

**Error responses:**
- `404 Not Found`: Scraping source not found
- `500 Internal Server Error`: Scrape failed (details in `detail`)

---

### Delete scraping source

```http
DELETE /admin/scraping-sources/{source_id}
```

**Path parameters:** `source_id` (UUID)

**Response:** `200 OK`

```json
{
  "message": "Scraping source 'EUA' deleted successfully"
}
```

**Error responses:**
- `404 Not Found`: Scraping source not found

---

## Frontend integration

The Settings page (`/settings`) uses these endpoints to manage **Price Scraping Sources**. The Sources card is targetable via `data-testid="price-scraping-sources-card"` and `data-component="PriceScrapingSources"` for E2E and DOM tools. API errors are shown in an inline error banner with dismiss.

## Related documentation

- [CORS Configuration](../configuration/CORS.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Database Configuration](../architecture/database-configuration.md)
