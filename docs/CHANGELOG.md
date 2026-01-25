# Changelog

All notable changes to the Nihao Carbon Platform are documented in this file.

## [2026-01-25] - Comprehensive Code Review Fixes

### Security
- **CORS Configuration** - Fixed production CORS to use configured origins instead of allowing all origins
- **Database Connection Pooling** - Replaced NullPool with QueuePool for better performance and connection reuse

### Error Handling
- **Standardized Error Responses** - Created `backend/app/core/exceptions.py` with consistent error format
- **Database Error Handling** - All database operations now have try/except with rollback
- **WebSocket Error Handling** - Improved error logging and connection cleanup

### Design System
- **Hard-coded Colors Removed** - Refactored all reusable components to use design tokens
- **Theme Support** - All refactored components properly support light/dark mode switching
- **Components Refactored**: OnboardingLayout, KycUploadModal, LivePriceDisplay

### Features
- **Profile Management** - Implemented API calls for profile update and password change
- **TODO Completion** - Documented remaining TODOs in order_service.py

### Documentation
- Added [Error Handling Architecture](architecture/error-handling.md)
- Added [Database Configuration](architecture/database-configuration.md)
- Added [API Error Handling](api/ERROR_HANDLING.md)
- Added [CORS Configuration](configuration/CORS.md)
- Added [Development Guide](DEVELOPMENT.md)
- Updated Design System documentation with color refactoring details

### Settings & Admin Scraping
- **Settings error feedback** - Inline error banner with dismiss; all scraping-source actions surface API errors via `getApiErrorMessage`
- **Price Scraping Card** - Added `data-testid="price-scraping-sources-card"` and `data-component="PriceScrapingSources"` for E2E and DOM tools
- **Admin Scraping API** - Create response returns full shape (`last_scrape_at`, `last_scrape_status`, `last_price`, `updated_at`); ScrapeLibrary fallback `HTTPX`; test/refresh log exceptions and return user-oriented messages
- **Admin Scraping API docs** - Added [Admin Scraping API](api/ADMIN_SCRAPING_API.md) with request/response examples

### Technical Improvements
- Extracted magic numbers to constants (WebSocket heartbeat interval)
- Improved code organization and consistency
- Enhanced logging throughout application
- CORS `allow_methods` and `allow_headers` restricted to `GET, POST, PUT, DELETE, OPTIONS` and `Content-Type, Authorization`; [CORS](configuration/CORS.md) doc updated to match

---

## Previous Changes

See individual feature documentation in `docs/features/` and `docs/fixes/` for detailed change logs.
