# Code Review: Full Codebase (“All”)

**Date:** 2026-01-25  
**Scope:** Backend + Frontend, all documented plans (0001, 0003)  
**Reference:** `docs/commands/code_review.md`

---

## 1. Summary of Implementation Quality

The codebase is structured clearly (FastAPI backend, React frontend), uses async patterns and type hints, and has design tokens, RBAC, and JWT auth. Several production-readiness issues remain: CORS and DB pooling (see 0002), design-system violations (hard-coded colors), and uneven error handling. Settlement (0001) is implemented and has a dedicated review; the scraping+yuan→EUR and DOM-viz plan (0003) is **not** implemented.

**Overall:** Good base with known critical/major items to address before production.

---

## 2. Plan Implementation Status

### 0001 – Settlement External Implementation

**Status:** Implemented.  
**Review:** `docs/features/0001_settlement_external_implementation_REVIEW.md`

- Data layer (SettlementBatch, migration, Order/CashMarketTrade links), settlement service, processor, admin API, dashboard UI, and email notifications are in place.
- 0001 REVIEW lists critical/major/minor issues (e.g. business vs calendar days, error handling). Those should be addressed per that document.

### 0003 – Scraping Yuan→EUR + DOM Visualization Tool

**Status:** Not implemented.  
**Plan:** `docs/features/0003_PLAN.md`

- **Yuan→EUR:** `price_scraper` still stores CEA in CNY in `PriceHistory` (`currency="CNY"` at `price_scraper.py:338`). `last_price` and Settings UI still show ¥ for CEA. `get_current_prices` converts CEA to EUR; scrape/refresh and Settings do not. Plan requires always converting yuan→EUR and storing/displaying only EUR.
- **DOM visualization:** Price Scraping Sources Card has no `data-testid` / `data-component`, and there is no “Show DOM path” / “Visualize” control or panel. Plan requires stable DOM targeting and a small DOM-viz tool for that section.

**Conclusion:** 0003 is **not** fully implemented. Work is limited to the plan document.

### Confirmation: Plan implementation

- **0001:** Fully implemented per plan; see `0001_settlement_external_implementation_REVIEW.md` for verification and follow-up.
- **0003:** Not implemented; plan exists only. No yuan→EUR conversion in scraping, no DOM visualization tool, no `data-testid` on Price Scraping Card.

---

## 3. Issues Found

### Critical

#### CRITICAL-001: CORS allows all origins  
**File:** `backend/app/main.py:59-65`  
**Issue:** `allow_origins=["*"]` with `allow_credentials=True` is unsafe for production.  
**Recommendation:** Restrict origins via config (e.g. `settings.CORS_ORIGINS`) in production; keep `["*"]` only for development.  
**Reference:** 0002 CRITICAL-001.

#### CRITICAL-002: Database uses NullPool  
**File:** `backend/app/core/database.py:14-18`  
**Issue:** `NullPool` creates a new DB connection per request; poor performance and risk of exhaustion under load.  
**Recommendation:** Use `QueuePool` with `pool_size` / `max_overflow` and `pool_pre_ping=True`.  
**Reference:** 0002 CRITICAL-002.

---

### Major

#### MAJOR-001: Hard-coded colors (design-system violation)  
**Files:** e.g. `OnboardingPage.tsx`, `KycUploadModal.tsx`, `OnboardingLayout.tsx`, `LivePriceDisplay.tsx`, various onboarding pages.  
**Issue:** Inline color objects and hex/rgba values instead of design tokens.  
**Recommendation:** Use `design-tokens.css` and Tailwind classes that reference tokens; remove inline color styles.  
**Reference:** 0002 MAJOR-001; `@interface.md`.

#### MAJOR-002: Settings Page – no user-facing error feedback  
**File:** `frontend/src/pages/SettingsPage.tsx`  
**Issue:** `loadData`, `handleRefreshSource`, `handleDeleteSource`, `handleIntervalChange`, `handleLibraryChange`, `handleAddSource` only `console.error` on failure. Users get no toast, inline message, or alert.  
**Recommendation:** Add a minimal feedback mechanism (e.g. toast or inline error state) and surface a short, user-friendly message on API errors.

#### MAJOR-003: create_scraping_source response shape incomplete  
**File:** `backend/app/api/v1/admin.py:1176-1186`  
**Issue:** Create response omits `last_scrape_at`, `last_scrape_status`, `last_price`, `updated_at`. Frontend appends the created source to `sources` and relies on `ScrapingSource` having those optional. Table shows “-” / “Never” / “Unknown” for new sources, which is acceptable but inconsistent with GET.  
**Recommendation:** Either return the full scraping-source shape (including those fields, possibly null) or document that create returns a subset and that frontend should refetch or merge defaults.

---

### Minor

#### MINOR-001: ScrapeLibrary API fallback case  
**File:** `backend/app/api/v1/admin.py:1136, 1181`  
**Issue:** `... else "httpx"` uses lowercase when `scrape_library` is null; enum values are `"HTTPX"` etc. Frontend uses `'HTTPX'` as fallback. Inconsistency is minor because null usually implies default HTTPX.  
**Recommendation:** Use `ScrapeLibrary.HTTPX.value` (i.e. `"HTTPX"`) for the fallback to align with enum and frontend.

#### MINOR-002: Settings table – no `data-testid` on Price Scraping Card  
**File:** `frontend/src/pages/SettingsPage.tsx` (Card wrapping Price Scraping Sources table)  
**Issue:** No `data-testid="price-scraping-sources-card"` or similar. Harder to target in E2E tests or DOM tools.  
**Recommendation:** Add `data-testid` (and optionally `data-component`) as in 0003 plan.

#### MINOR-003: Error handling in admin scraping endpoints  
**Files:** `backend/app/api/v1/admin.py` – `test_scraping_source`, `refresh_scraping_source`  
**Issue:** Exceptions from `price_scraper` are re-raised or wrapped in HTTP 500. No structured error code or user-oriented message.  
**Recommendation:** Map known scraping failures to clearer HTTP responses and messages; log full details server-side.

---

## 4. Data Alignment

- **API ↔ Frontend:** Admin scraping endpoints return snake_case (`last_scrape_at`, `certificate_type`, etc.). Frontend `ScrapingSource` and api usage expect snake_case; `response.data` is used as-is. No mismatch observed.
- **create vs GET:** Create returns a subset of fields (see MAJOR-003). No runtime breakage; UX is slightly inconsistent.

---

## 5. Security

- **Positives:** Bcrypt password hashing, JWT auth, RBAC, Pydantic validation, ORM-based DB access.
- **Concerns:** CORS (CRITICAL-001), NullPool (CRITICAL-002). Seed default passwords in `database.py` are dev-only; ensure production uses env-driven secrets.

---

## 6. Error Handling and Edge Cases

- **Backend:** Many routes use `HTTPException` and `try/except`. Gaps remain in DB rollback and consistent error formats (see 0002 MAJOR-002, MINOR-001).
- **Frontend:** Settings only logs errors (MAJOR-002). Other pages use `alert` or comments about toasts. Error states (loading, empty, retry) are partially handled; no global error boundary reviewed.

---

## 7. Testing

- **Backend:** Tests exist under `backend/tests/` (e.g. liquidity, market maker, order matching). No tests observed for `price_scraper` or admin scraping endpoints. Pytest was not run in this review (environment-dependent).
- **Frontend:** `utils/__tests__/userUtils.test.ts` present; no E2E or component tests reviewed.
- **Recommendation:** Add unit tests for `price_scraper` and admin scraping; add E2E or integration coverage for Settings and Price Scraping flows.

---

## 8. UI/UX and Interface Compliance

### 8.1 `@interface.md` and design system

- **Tokens:** `design-tokens.css` defines colors, typography, spacing. Many components still use hard-coded colors (MAJOR-001).
- **Theme:** Light/dark tokens exist; some components use inline styles that may not respect theme.
- **Component rules:** `@interface.md` calls for tokens, accessibility, and responsive behavior. Trading-related components (e.g. `TradingOrderBook`, `OrderBookLiquiditySummary`) use `aria-label` / `role`; Settings Price Scraping table and Card do not.

### 8.2 UI/UX findings

| Topic | Status | Notes |
|-------|--------|-------|
| Design tokens | ⚠️ | Violations in onboarding and related components. |
| Theme support | ⚠️ | Partial; hard-coded colors bypass theme. |
| Accessibility | ⚠️ | Good in places (ARIA, roles); Settings table/Card unmarked. |
| Responsiveness | ✅ | Layout uses Tailwind responsive classes. |
| Loading / error / empty | ⚠️ | Settings has loading; error/empty feedback weak (MAJOR-002). |

### 8.3 Recommendations

1. Replace hard-coded colors with design tokens and Tailwind token-based classes.  
2. Add `data-testid` and ARIA where needed (e.g. Price Scraping Card, key actions).  
3. Introduce a small, consistent error feedback mechanism (e.g. toast or inline) and use it in Settings.  
4. Ensure all interactive components support keyboard and screen readers.

---

## 9. Recommendations Summary

### Before production

1. Fix CORS (CRITICAL-001) and DB pooling (CRITICAL-002).  
2. Reduce design-system violations (MAJOR-001).  
3. Add user-visible error feedback in Settings (MAJOR-002).

### Short term

1. Align `create_scraping_source` response with GET or document the delta (MAJOR-003).  
2. Add `data-testid` to Price Scraping Card (MINOR-002).  
3. Unify ScrapeLibrary fallback to `"HTTPX"` (MINOR-001).  
4. Improve error handling and logging in admin scraping endpoints (MINOR-003).

### Implementation of 0003

1. Implement yuan→EUR conversion in `price_scraper` (scrape/refresh, PriceHistory, `last_price`) and use EUR-only in Settings.  
2. Add DOM visualization tool and stable DOM targeting for Price Scraping Sources as specified in 0003 plan.

---

## 10. Conclusion

- **0001 (Settlement):** Implemented; follow `0001_settlement_external_implementation_REVIEW.md` for fixes.  
- **0003 (Scraping + DOM viz):** Not implemented; implement per `0003_PLAN.md` and re-review.  
- **Codebase-wide:** Address CRITICAL-001/002 and MAJOR-001/002, then refine error handling, tests, and UI/UX per above.

**Overall grade:** B+ (good structure and features; production readiness gaps remain).
