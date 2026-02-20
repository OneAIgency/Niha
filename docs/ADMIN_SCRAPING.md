# Admin Price Scraping (EUA/CEA)

This document describes how EUA and CEA price scraping works, the admin API, and troubleshooting. Implementation follows **0026** (single fetch for carboncredits.com, 429 backoff).

## Overview

- **Settings → Price Scraping Sources** (admin-only): configure name, URL, certificate type (EUA/CEA), scrape interval, library (httpx, BeautifulSoup, etc.), and **is_primary**. Each source has an optional **config** (JSON) with `xpath_selector`, `css_selector`, or `regex_pattern` to extract the price from the scraped HTML. At most one source per certificate type can be primary; the primary flag is used when multiple sources exist (e.g. for display or default selection).
- **Scheduler**: runs every 60 seconds; for each active source whose interval has elapsed, it triggers a refresh. Carboncredits.com sources are refreshed as a **group** with one HTTP request per cycle.
- **Test** (per source): runs a single scrape and returns the extracted price; no DB update. For carboncredits.com this uses the same single-fetch path (one request, returns price for that source’s certificate type).
- **Refresh** (per source): updates DB from the source. For carboncredits.com, refreshing any carboncredits.com source refreshes **all** active carboncredits.com sources in one request.

## Generic scraping (non-carboncredits.com)

For sources whose URL does not contain `carboncredits.com`, the system fetches the page and extracts the price using the source's **config** (in order of precedence):

1. **xpath_selector** — XPath expression (e.g. `/html/body/.../tr[4]/td[2]`). Use Chrome DevTools to copy XPath.
2. **css_selector** — CSS selector (e.g. `#price`, `.value`).
3. **regex_pattern** — Regex with one capture group for the price.
4. Default — common price patterns (€, $, ¥, EUR, USD, etc.).

Example: to scrape EUA from Trading Economics, set URL to `https://tradingeconomics.com/commodity/carbon` and config to `{"xpath_selector": "//a[@href='/commodity/carbon']/ancestor::tr/td[@id='p']"}`. This XPath anchors to the unique `/commodity/carbon` link in the EU Carbon Permits row, making it robust against table reordering. Note: `td#p` is NOT unique on this page (97 occurrences), so positional XPaths like `tr[N]` will target the wrong row. HTTPX works fine — no Playwright needed.

## Carboncredits.com behaviour (0026)

| Aspect | Behaviour |
|--------|-----------|
| **External API** | Single endpoint: `https://carboncredits.com/wp-content/themes/fetchcarbonprices.php` (CSV with EU and China prices). |
| **Group** | Any scraping source whose `url` contains `carboncredits.com` is in the "carboncredits" group. |
| **Single fetch** | One GET per refresh cycle; response is parsed for EU (EUA) and China (CEA) and all group sources are updated from that response. |
| **Scheduler** | If any carboncredits.com source is due by interval, `refresh_carboncredits_sources(db, list_of_carboncredits_sources)` is called once; other sources are refreshed individually. |
| **Admin Refresh** | Calling **Refresh** on one carboncredits.com source triggers refresh for all active carboncredits.com sources. |
| **Admin Test** | Test still runs one logical “scrape” for that source; for carboncredits.com it uses the shared fetch and returns the price for that source’s certificate type (no duplicate request). |
| **First match** | When the API returns multiple EU-related rows (e.g. "European Union" and "EU ETS December 2025"), the parser uses the **first** matching row (main spot price) rather than the last. |

## 429 rate limit and backoff

- When the carboncredits.com API returns **HTTP 429**, the backend:
  1. Parses **Retry-After** (integer seconds or HTTP-date); if missing or invalid, uses 5 minutes; result is capped between 60 s and 10 minutes.
  2. Sets Redis key **`carboncredits_backoff_until`** with value = end-of-backoff ISO timestamp and TTL = backoff seconds (key expires when backoff ends).
  3. Raises so the API returns 429 with message: *"Rate limited by source. Please wait a few minutes before retrying."*

- Before each carboncredits.com fetch, the backend checks that Redis key. If it exists and current time is before the stored “until” time, it raises immediately (same 429-style message). So the scheduler and manual Refresh/Test do not hit the source again until the backoff period has passed.

- **Redis**: If Redis is unavailable, the backoff check is skipped (fail open); 429 from the remote is still returned to the user.

## API endpoints (admin)

Base path: `/api/v1/admin`. All require admin authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/scraping-sources` | List all scraping source configurations. |
| POST | `/scraping-sources` | Create a new scraping source. |
| PUT | `/scraping-sources/{source_id}` | Update a scraping source. |
| POST | `/scraping-sources/{source_id}/test` | Test scrape; returns extracted price, no DB update. |
| POST | `/scraping-sources/{source_id}/refresh` | Refresh from source. For carboncredits.com, refreshes all active carboncredits.com sources. |
| DELETE | `/scraping-sources/{source_id}` | Delete a scraping source. |

### Example: Create source

**Request**

```http
POST /api/v1/admin/scraping-sources
Content-Type: application/json
Cookie: access_token=...
```

```json
{
  "name": "Trading Economics EUA",
  "url": "https://tradingeconomics.com/commodity/carbon",
  "certificate_type": "EUA",
  "scrape_library": "playwright",
  "scrape_interval_minutes": 5,
  "is_primary": false,
  "config": {
    "xpath_selector": "//a[@href='/commodity/carbon']/ancestor::tr/td[@id='p']"
  }
}
```

For carboncredits.com sources, omit `config` — the system uses the shared CSV API. For other sources, optional `config` can include `xpath_selector`, `css_selector`, or `regex_pattern` (see [Generic scraping](#generic-scraping-non-carboncreditscom) above).

**Response (200)** — Same shape as a list item (id, name, url, certificate_type, is_primary, last_price, config, etc.).

### Example: Update source

**Request**

```http
PUT /api/v1/admin/scraping-sources/{source_id}
Content-Type: application/json
Cookie: access_token=...
```

Body: any subset of updatable fields (all optional). When `is_primary` is set to `true`, other sources with the same `certificate_type` are set to non-primary.

```json
{
  "name": "CarbonCredits EU (primary)",
  "is_primary": true,
  "scrape_interval_minutes": 10,
  "config": {
    "xpath_selector": "//a[@href='/commodity/carbon']/ancestor::tr/td[@id='p']"
  }
}
```

**Config options** (for non-carboncredits.com sources): `xpath_selector`, `css_selector`, `regex_pattern`. XPath takes precedence over CSS, then regex. Prefer href-anchored XPaths (e.g. `//a[@href='...']/ancestor::tr/td[@id='p']`) over positional ones (`tr[N]`) for robustness.

**Response (200)** — Updated scraping source object.

### Example: List sources

**Request**

```http
GET /api/v1/admin/scraping-sources
Cookie: access_token=...
```

**Response (200)**

```json
[
  {
    "id": "uuid",
    "name": "CarbonCredits EU",
    "url": "https://carboncredits.com/carbon-prices-today/",
    "certificate_type": "EUA",
    "scrape_library": "httpx",
    "is_active": true,
    "is_primary": true,
    "scrape_interval_minutes": 5,
    "last_scrape_at": "2026-02-08T12:00:00.000000Z",
    "last_scrape_status": "SUCCESS",
    "last_price": 88.65,
    "last_price_eur": null,
    "last_exchange_rate": null,
    "config": {},
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### Example: Test source

**Request**

```http
POST /api/v1/admin/scraping-sources/{source_id}/test
Cookie: access_token=...
```

**Response (200)**

```json
{
  "success": true,
  "message": "Scrape successful",
  "price": 88.65
}
```

**Response (429 when rate limited)**

```json
{
  "success": false,
  "message": "Rate limited by source. Please wait a few minutes before retrying.",
  "price": null
}
```

### Example: Refresh source

**Request**

```http
POST /api/v1/admin/scraping-sources/{source_id}/refresh
Cookie: access_token=...
```

**Response (200)**

```json
{
  "message": "Prices refreshed successfully"
}
```

**Response (429)** — Same body shape as other admin errors; HTTP status 429, detail: *"Rate limited by source. Please wait a few minutes before retrying."*

## Error mapping

`_scraping_error_status()` in `backend/app/api/v1/admin.py` maps exceptions to HTTP status and user-facing message:

| Condition in exception message | Status | Message |
|--------------------------------|--------|---------|
| `429`, `rate limit`, `too many requests` | 429 | Rate limited by source. Please wait a few minutes before retrying. |
| `timeout`, `timed out` | 504 | Request timed out. Please try again later. |
| `connection`, `connect`, `connection refused` | 502 | Connection error. Check if the source is accessible. |
| Other | 500 | Scraping failed. Check URL, selectors, and network. |

## Troubleshooting

- **"Rate limited by source"**  
  The remote (e.g. carboncredits.com) returned 429 or the system is in backoff. Wait until the backoff period ends (Redis key `carboncredits_backoff_until` expires). No configuration to disable backoff; it reduces repeated failed requests.

- **Test succeeds but Refresh fails**  
  Test does not write to DB. Refresh writes to DB and updates all carboncredits.com sources when you refresh any one of them. Check DB connectivity and that the source is active.

- **Only one source updated for carboncredits.com**  
  Ensure both EUA and CEA sources have URLs containing `carboncredits.com` and are active. Refresh on either should update both from one request.

- **Redis down**  
  Backoff is not applied (fail open); 429 from the remote is still returned. After Redis is back, the next 429 will set backoff again.

## Settings UI

**Settings → Price Scraping** (admin-only) exposes:

- **Add Trading Economics EUA** preset button: pre-fills the Add Source form with URL, XPath, and config for `tradingeconomics.com/commodity/carbon` EU Carbon Permits. Click **Add Source** (submit) to save to the database.
- **Add Source** and **Edit Source** modals: both include an optional **XPath selector** field. Use Chrome DevTools (right-click element → Copy → Copy XPath) to obtain the path. Config is stored in the source's `config` object.
- **Test** and **Refresh** actions per source.
- Price history charts per source.

## Key files

| Purpose | File |
|---------|------|
| Shared fetch, backoff check/set, refresh group, XPath extraction | `backend/app/services/price_scraper.py` |
| Unit tests for XPath extraction | `backend/tests/test_price_scraper.py` |
| Scheduler (carboncredits group vs others) | `backend/app/main.py` → `price_scraping_scheduler_loop` |
| Admin endpoints, error mapping | `backend/app/api/v1/admin.py` |
| Settings UI (Add/Edit modals with XPath, test/refresh, error display) | `frontend/src/pages/SettingsPage.tsx` |
