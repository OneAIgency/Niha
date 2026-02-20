# 0044 – Code Review: EUA Scraping First-Match Fix

## Summary

Fix for carboncredits.com API parsing: when the CSV returned multiple EU-related rows (e.g. "European Union" 71.83 and "EU ETS December 2025" 72.6), the parser used the **last** match (72.6) instead of the main spot price (71.83) shown on the source page.

**Change**: Use the **first** matching row for each certificate type instead of overwriting with each match.

## Modified Files

| File | Change |
|------|--------|
| `backend/app/services/price_scraper.py` | `_fetch_carboncredits_prices()` – added `CertificateType.EUA not in prices` and `CertificateType.CEA not in prices` guards so first match wins |
| `docs/ADMIN_SCRAPING.md` | Added **First match** row to Carboncredits.com behaviour table |

## Implementation Quality

- **Correctness**: Fix addresses the root cause. The guards ensure we keep the first matching row for each certificate type; subsequent rows are ignored.
- **Clarity**: Inline comment explains why first match is preferred: spot (European Union) vs futures (EU ETS December 2025).
- **Backward compatible**: When API returns a single EU row (as currently), behavior unchanged.
- **Symmetry**: Same logic applied for both EUA and CEA.

## Code Review Checklist

| Criterion | Status |
|-----------|--------|
| 1. Plan implemented | N/A – bug fix, no plan |
| 2. Obvious bugs | ✅ None |
| 3. Data alignment (snake_case, nested objects) | ✅ Not applicable – internal parsing only |
| 4. `app_truth.md` compliance | ✅ Price scraping behaviour unchanged; doc mentions carboncredits.com, not parsing order |
| 5. Over-engineering | ✅ Minimal change; no refactor |
| 6. Syntax / style consistency | ✅ Matches existing code (existing `elif`, logging) |
| 7. Error handling / edge cases | ✅ Preserved; still raises if neither EU nor China found |
| 8. Security | ✅ No new inputs; same HTTP fetch path |
| 9. Test coverage | ⚠️ Minor: no unit test for CSV first-match behaviour |
| 10. UI/UX | N/A – backend-only change |

## Issues Found

| Severity | Issue | File:Line |
|----------|-------|-----------|
| Minor | No unit test for multi-row CSV first-match logic | `tests/test_price_scraper.py` |

## Recommendations

1. **Unit test**: Add a test that mocks the CSV response with multiple EU rows (e.g. "European Union", 71.83 and "EU ETS December 2025", 72.6) and asserts the returned EUA price is 71.83 (first match).
2. **Doc**: `docs/ADMIN_SCRAPING.md` already updated with First match behaviour – no further changes needed.

## Plan Implementation

N/A – Bug fix without plan.

## Tests

- `pytest tests/test_price_scraper.py` – 7 passed (existing XPath extraction tests; CSV path not covered).
