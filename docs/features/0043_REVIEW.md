# 0043 — Code Review: XPath selector support for EUA price scraping

## Summary

Implementation adds support for extracting scraped prices via XPath (in addition to existing CSS selectors and regex). Target use case: scrape EUA value from Trading Economics (`/html/body/form/div[5]/div/div[1]/div[3]/div/div/table/tbody/tr[4]/td[2]`).

**Plan**: Ad-hoc user request; no formal plan attached.

## Files Modified

| File | Changes |
|------|---------|
| `backend/app/services/price_scraper.py` | `_extract_via_xpath()`, `xpath_selector` in `_extract_price` and `_extract_exchange_rate` |
| `frontend/src/pages/SettingsPage.tsx` | `xpath_selector` in edit form state, handlers, and modal |
| `docs/ADMIN_SCRAPING.md` | Generic scraping section, config options, Trading Economics example |

---

## 1. Implementation Correctness

- **Backend**: XPath extraction is checked before CSS and regex, matching documented precedence. `_extract_via_xpath` uses lxml (already in `requirements.txt`) and handles exceptions; failures fall through to other extractors.
- **Frontend**: Config merge preserves `css_selector`, `regex_pattern`, etc. Empty `xpath_selector` is removed from config; saving sends full merged `config` to the API.
- **API alignment**: `ScrapingSourceUpdate.config` accepts `Dict[str, Any]`; backend stores and returns `config` as-is. Frontend sends `config: { xpath_selector: "..." }`; keys match backend expectations.

---

## 2. Bugs & Edge Cases

- **Content type**: lxml `fromstring()` accepts HTML; invalid/malformed HTML may raise. Exception is caught and `None` is returned; extraction falls back to CSS/regex/defaults.
- **XPath returns attribute node**: `elements[0].text_content()` is used; for attribute nodes (e.g. `@value`) it may not behave as expected. Current use case (Trading Economics `<td>`) is text content — acceptable. Document if attribute XPath is ever needed.
- **Config merge on save**: `{ ...(editingSource.config || {}) }` correctly spreads existing config; clearing `xpath_selector` removes it via `delete config.xpath_selector`.

---

## 3. Data Alignment

- **snake_case vs camelCase**: API expects `xpath_selector` in config. Frontend uses `config.xpath_selector` (snake_case). `transformKeysToSnakeCase` leaves snake_case keys unchanged — correct.
- **Config typing**: `source.config as Record<string, unknown>` is used; API returns config as JSON. Safe.

---

## 4. app_truth.md Compliance

- Price scraping config is documented in `app_truth.md` §4 (integration parameters). `docs/ADMIN_SCRAPING.md` was updated; no change to `app_truth.md` required for this feature.

---

## 5. Code Style & Consistency

- **Backend**: Matches existing patterns (e.g. `_parse_price`, `config.get()`). Lazy `from lxml import html` inside `_extract_via_xpath` is consistent with other optional parsing.
- **Frontend**: Matches Edit modal patterns (labels, `form-input`, `form-select`). Helper text is inline; consistent with other fields in the same modal.

---

## 6. Error Handling & Security

- **Error handling**: `_extract_via_xpath` catches all exceptions, logs a warning, returns `None`. No unhandled exceptions.
- **Security**: XPath is user-configured; lxml evaluates XPath against fetched HTML. No user input is executed as code. XPath injection into lxml is limited to document traversal; no obvious exploit for arbitrary code. Acceptable for admin-only configuration.

---

## 7. Testing

- No new unit tests for `_extract_via_xpath` or XPath extraction flow.
- Manual Test button in Settings exercises the full scrape + extract path.
- **Recommendation**: Add a unit test for `_extract_via_xpath` with sample HTML and XPath (e.g. `tr[4]/td[2]`).

---

## 8. UI/UX & Design System

### Design tokens & interface
- **Colors**: `text-navy-300`, `text-navy-400`, `form-input` — design tokens used correctly.
- **No hard-coded colors**: No hex, `slate-*`, or `gray-*`.
- **Form inputs**: Uses `form-input`, `form-select`; focus styles inherited.
- **Settings pattern**: Matches other Settings modals (Card, labels, spacing).

### Accessibility
- Label associated with input via `htmlFor` / `label` (implicit via structure).
- XPath input has no `aria-label` or `aria-describedby`; helper text is a sibling `<p>`. Screen readers will read label and helper — acceptable.
- Keyboard: Tab order follows DOM; no custom focus traps.

### Responsiveness
- Modal uses `max-w-md mx-4`; usable on mobile. XPath input can wrap long paths.

### Recommendations
- Consider `aria-describedby` linking helper text to the input for screen readers.
- Consider shortening helper text or moving the full Trading Economics XPath to a tooltip to reduce visual clutter.

---

## Issues Summary

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| Minor | No unit test for `_extract_via_xpath` | `price_scraper.py` | ✅ Fixed: `tests/test_price_scraper.py` |
| Minor | Long helper text may clutter modal | `SettingsPage.tsx` | ✅ Fixed: shortened to "Chrome DevTools: right-click element → Copy → Copy XPath" |
| Minor | XPath input lacks explicit `aria-describedby` | `SettingsPage.tsx` | ✅ Fixed: added `aria-describedby` + `id` on hint |

### Critical
None.

### Major
None.

---

## Recommendations (implemented)

1. ✅ Add `xpath_selector` to the Add Source modal — implemented.
2. ✅ Add a unit test for `_extract_via_xpath` — implemented in `tests/test_price_scraper.py`.
3. ✅ Shorten helper text — implemented.

---

## Verification

- Implementation matches the user request (XPath support for EUA from Trading Economics).
- Extraction order: xpath_selector → css_selector → regex_pattern → defaults.
- API and frontend config handling are consistent.
