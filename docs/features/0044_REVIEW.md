# 0044 – Code Review: EUA Scraping First-Match Fix

## Summary

Fix for carboncredits.com API parsing: when the CSV returned multiple EU-related rows (e.g. "European Union" 71.83 and "EU ETS December 2025" 72.6), the parser used the **last** match (72.6) instead of the main spot price (71.83) shown on the source page.

**Change**: Use the **first** matching row for each certificate type instead of overwriting with each match.

## Modified Files

- `backend/app/services/price_scraper.py` – `_fetch_carboncredits_prices()`

## Implementation Quality

- **Correctness**: Fix addresses the root cause. `CertificateType.EUA not in prices` and `CertificateType.CEA not in prices` ensure we keep the first match.
- **Clarity**: Comment explains why first match is preferred (spot vs futures).
- **Backward compatible**: When API returns a single EU row (as currently), behavior unchanged.

## Issues Found

| Severity | Issue | File:Line |
|----------|-------|-----------|
| None | — | — |

## Recommendations

- Consider adding a unit test that mocks the CSV response with multiple EU rows and asserts the first match (71.83) is used.
- No doc changes needed; `docs/ADMIN_SCRAPING.md` describes the API, not parsing order.

## Plan Implementation

N/A – Bug fix without plan.
