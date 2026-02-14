# 0031 Review: Recommended Value Buttons, ActionsDropdown, is_primary Feature

**Reviewer**: Claude Opus 4.6 (Senior Code Reviewer)
**Date**: 2026-02-13
**Status**: Fixes applied (see "Fixes applied (post-review)" below)

---

## Summary

This changeset adds three capabilities:

1. **Clickable recommended values** in AutoTradePage `SettingsInput` and `VarietySlider`
2. **ActionsDropdown component** replacing inline buttons in SettingsPage tables
3. **`is_primary` field** for ScrapingSource (full stack: migration, model, schema, API, frontend)

Overall the implementation is solid and well-structured. The ActionsDropdown is a clean extraction, the backend primary-unset logic is correct, and the edit modals are thorough. However, there are several issues that need attention, ranging from a critical number-parsing bug to important state consistency gaps.

---

## 1. Recommended Value Parsing (AutoTradePage)

### CRITICAL: `hint.replace(/[^0-9.\-]/g, '')` misparses comma-separated numbers

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/AutoTradePage.tsx`, lines 317-319

```typescript
const num = parseFloat(hint.replace(/[^0-9.\-]/g, '').replace(/^\./, '0.'));
if (!isNaN(num)) onChange(num);
```

The regex strips all characters except digits, dots, and hyphens. For hints containing thousands separators (commas), this produces **wrong values**:

| Hint string | After regex strip | parseFloat result | Expected |
|---|---|---|---|
| `"500,000 EUR"` | `"500000"` | `500000` | 500000 |
| `"1,000,000 EUR"` | `"1000000"` | `1000000` | 1000000 |
| `"0.20 EUR"` | `"0.20"` | `0.2` | 0.2 |
| `"60 sec"` | `"60"` | `60` | 60 |
| `"3%"` | `"3"` | `3` | 3 |
| `"0.0050"` | `"0.0050"` | `0.005` | 0.005 |
| `"5,000 EUR"` | `"5000"` | `5000` | 5000 |

**Wait -- this actually works correctly for all current hint formats.** The commas are stripped along with other non-numeric characters, leaving `"500000"` which `parseFloat` handles properly.

However, there is still a **subtle edge-case bug**: the regex allows multiple dots and hyphens in the middle of the string. If a hint like `"1.000.000 EUR"` (European-style thousands) were ever used, the result would be `parseFloat("1.000.000")` = `1` (parseFloat stops at the second dot). This is not currently triggered by any existing hint, but is fragile.

**Verdict**: The current hint set works correctly. The pattern is **acceptable** for now but fragile. Mark as **Suggestion**.

### VarietySlider parsing is correct

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/AutoTradePage.tsx`, lines 362-364

```typescript
const match = hint.match(/\d+/);
if (match) onChange(Number(match[0]));
```

For hint `"7 / 10"`, `match(/\d+/)` extracts `"7"` which is correct. For `"5 / 10"`, extracts `"5"`. This is correct behavior -- it takes the first number, which is the recommended variety value.

---

## 2. ActionsDropdown Component (SettingsPage)

### Good: Click-outside behavior

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/SettingsPage.tsx`, lines 50-95

The `useEffect` with `mousedown` listener and `ref.current.contains()` check is a standard and correct pattern for click-outside dismissal. The cleanup on unmount is proper. The `z-50` class ensures the dropdown renders above table rows.

### Good: Dropdown auto-closes on action

Line 78: `onClick={() => { a.onClick(); setOpen(false); }}` correctly closes the dropdown immediately when an action is selected.

### IMPORTANT: Dropdown may render off-screen for bottom table rows

The dropdown uses `top-full` (renders below the trigger button). For the last row in a table, this can cause the dropdown to overflow below the visible area. There is no check for viewport boundary or upward flip.

**Recommendation**: Either add `overflow-y: auto` to the parent container, or detect whether the dropdown should flip upward when near the bottom of the viewport. For a Settings page with typically few rows, this is low-risk but worth noting.

### Suggestion: Missing Escape key handler

The dropdown does not close when the user presses Escape. Consider adding a `keydown` listener for `Escape` in the same `useEffect`.

---

## 3. Price Scraping Source Name Not Displayed in Table

### IMPORTANT: Source name missing from Price Scraping table

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/SettingsPage.tsx`, lines 706-717

The "Source" column for Price Scraping only shows the certificate type badge, the primary badge, and the URL:

```tsx
<p className="font-medium text-sm ... flex items-center gap-1.5 flex-wrap">
  <Badge variant={...}>{source.certificateType}</Badge>
  {source.isPrimary && (<Badge variant="success" ...>Primary</Badge>)}
</p>
<p className="text-[10px] ... truncate" title={source.url}>
  {source.url}
</p>
```

**The source name (`source.name`) is never rendered.** Compare with the Exchange Rate table (line 860) which does display `source.name`:

```tsx
<span className="truncate">{source.name}</span>
```

This is likely a regression or oversight from the refactor. Without the name, users cannot identify which source is which -- they only see the certificate type badge and URL.

**Recommendation**: Add `{source.name}` between the badges and the URL, similar to how the Exchange Rate table does it.

---

## 4. Edit Source Handler: Optimistic State Update Issues

### IMPORTANT: `certificate_type` is not sent to the API but is updated in local state

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/SettingsPage.tsx`, lines 345-352

The `handleSaveEditSource` sends these fields to the API:

```typescript
await adminApi.updateScrapingSource(editingSource.id, {
  name: editSourceForm.name,
  url: editSourceForm.url,
  scrapeLibrary: editSourceForm.scrape_library,
  scrapeIntervalMinutes: editSourceForm.scrape_interval_minutes,
  isPrimary: editSourceForm.is_primary,
  isActive: editSourceForm.is_active,
} as Partial<ScrapingSource>);
```

But the local state update at line 359 updates `certificateType`:

```typescript
certificateType: editSourceForm.certificate_type as 'EUA' | 'CEA',
```

The edit modal allows changing `certificate_type` (lines 1218-1225), but:

1. The `ScrapingSourceUpdate` Pydantic schema (backend `/Users/victorsafta/work/Niha/backend/app/schemas/schemas.py`, line 522) does **not** include `certificate_type` as an updatable field.
2. The API payload does not include it.
3. The backend `update_scraping_source` handler does not update it.

**Result**: If a user changes the certificate type in the edit modal, the local UI will show the new type, but the server still has the old type. On next page load, the change will revert.

**Recommendation**: Either (a) remove the Certificate Type dropdown from the edit modal since it cannot be changed via the update API, or (b) add `certificate_type` to `ScrapingSourceUpdate` and handle it in the backend endpoint.

### IMPORTANT: Primary unset in optimistic update uses `certificate_type` from form (not from source)

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/SettingsPage.tsx`, lines 365-367

```typescript
: editSourceForm.is_primary && s.certificateType === editSourceForm.certificate_type
  ? { ...s, isPrimary: false }
  : s
```

This unsets `isPrimary` for other sources with the same `certificate_type` from the form. Since `certificate_type` cannot actually be changed via the API (as noted above), this compares against a potentially stale value if the user changed it in the UI. In practice this works because the backend does the correct primary unset based on the server-side `certificate_type`, and on next reload the UI will sync. But the optimistic update could show incorrect primary badges briefly.

### IMPORTANT: Exchange Rate edit does NOT unset other primaries optimistically

**File**: `/Users/victorsafta/work/Niha/frontend/src/pages/SettingsPage.tsx`, lines 463-467

```typescript
setExchangeRateSources(prev => prev.map(s =>
  s.id === editingExchangeSource.id
    ? { ...s, name: ..., isPrimary: editExchangeForm.is_primary, ... }
    : s
));
```

Unlike the scraping source handler, the exchange rate handler does NOT unset `isPrimary` on sibling sources when setting one as primary. The backend does handle this correctly (lines 1799-1808 in admin.py), but the optimistic UI will show multiple sources as "Primary" until the next data reload.

**Recommendation**: Either add the same optimistic unset logic as in `handleSaveEditSource`, or reload the data from the server after save (which is the safest approach).

---

## 5. Backend API: `is_primary` Unset Logic

### Good: Backend primary unset is correct

**File**: `/Users/victorsafta/work/Niha/backend/app/api/v1/admin.py`, lines 1527-1536

```python
if update.is_primary:
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(ScrapingSource)
        .where(
            ScrapingSource.certificate_type == source.certificate_type,
            ScrapingSource.id != source.id,
        )
        .values(is_primary=False)
    )
```

This correctly:
- Only triggers when `is_primary` is truthy (True)
- Uses the *existing* source's `certificate_type` (not the update payload, which cannot change it)
- Excludes the current source from the unset
- Uses a proper bulk update

### Good: Lazy import avoids circular import

The `from sqlalchemy import update as sql_update` inside the function body is a valid pattern to avoid name collision with the `update` parameter. The same pattern is used in `update_exchange_rate_source` (line 1788).

### IMPORTANT: Condition `if update.is_primary:` does not distinguish between True and None

**File**: `/Users/victorsafta/work/Niha/backend/app/api/v1/admin.py`, line 1527

The condition `if update.is_primary:` is truthy only when `is_primary` is `True`. Since `None` and `False` are both falsy, this is correct -- the unset only happens when explicitly setting primary to True. Good.

However, line 1546 uses `if update.is_primary is not None:` for the actual field update, which correctly handles setting `is_primary` to `False` as well. The logic is sound.

---

## 6. Schema Serialization: Missing `last_price_eur` and `last_exchange_rate`

### IMPORTANT: `ScrapingSourceResponse` is missing `last_price_eur` and `last_exchange_rate`

**File**: `/Users/victorsafta/work/Niha/backend/app/schemas/schemas.py`, lines 502-519

The Pydantic response schema includes:
```python
last_price: Optional[float]
```

But the SQLAlchemy model (`/Users/victorsafta/work/Niha/backend/app/models/models.py`, lines 539-541) has:
```python
last_price = Column(Numeric(18, 4), nullable=True)
last_price_eur = Column(Numeric(18, 4), nullable=True)
last_exchange_rate = Column(Numeric(18, 8), nullable=True)
```

And the frontend TypeScript type (`/Users/victorsafta/work/Niha/frontend/src/types/index.ts`, lines 159-161) expects:
```typescript
lastPrice?: number;
lastPriceEur?: number;
lastExchangeRate?: number;
```

The backend schema does NOT serialize `last_price_eur` or `last_exchange_rate`, so the frontend will never receive these values from the API. The frontend renders `lastPriceEur` at line 771-774 of SettingsPage.tsx:

```tsx
{source.certificateType === 'CEA' && source.lastPriceEur && (
  <span>approx EUR{source.lastPriceEur.toFixed(2)}</span>
)}
```

This will always be `undefined` because the field is never sent by the backend.

**This appears to be a pre-existing issue** (not introduced in this changeset), but it is relevant because the `isPrimary` field was added to the schema in this changeset while these fields remain missing. This is the same class of bug as the "C1 bug from last review" mentioned in the review request.

**Recommendation**: Add `last_price_eur: Optional[float] = None` and `last_exchange_rate: Optional[float] = None` to `ScrapingSourceResponse`.

---

## 7. Migration

### Good: Migration is clean and correct

**File**: `/Users/victorsafta/work/Niha/backend/alembic/versions/2026_02_13_source_primary.py`

- Uses `server_default=sa.text("false")` with `nullable=False` -- correct for a boolean column
- Properly chains from previous migration revision
- Clean downgrade drops the column
- Does not add `is_primary` to `exchange_rate_sources` because that table already has the column (added in a previous migration)

---

## 8. Type Safety

### Good: TypeScript interface is correct

**File**: `/Users/victorsafta/work/Niha/frontend/src/types/index.ts`, line 155

```typescript
isPrimary: boolean;
```

This is a required boolean, which aligns with the backend schema `is_primary: bool = False`. The axios interceptor transforms `is_primary` to `isPrimary` automatically.

---

## Issue Summary

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | **Important** | `SettingsPage.tsx:706-717` | Source name not displayed in Price Scraping table |
| 2 | **Important** | `SettingsPage.tsx:345-352` | `certificate_type` editable in modal but not sent to API; local state diverges from server |
| 3 | **Important** | `SettingsPage.tsx:463-467` | Exchange rate edit does not optimistically unset other primary badges |
| 4 | **Important** | `schemas.py:502-519` | `ScrapingSourceResponse` missing `last_price_eur` and `last_exchange_rate` (pre-existing but related) |
| 5 | Suggestion | `AutoTradePage.tsx:317-319` | Hint parsing regex fragile with European-style decimal separators |
| 6 | Suggestion | `SettingsPage.tsx:50-95` | ActionsDropdown has no Escape key handler and no viewport flip for bottom rows |

---

## What Was Done Well

- The `ActionsDropdown` is a clean, reusable component with proper click-outside handling and loading states.
- Backend primary-unset logic is correct, using the source's existing `certificate_type` rather than trusting the update payload.
- The migration uses `server_default` which is correct for existing rows.
- The scraping source edit modal is well-structured with all relevant fields exposed.
- The optimistic primary unset in `handleSaveEditSource` is a good UX touch (even if incomplete for Exchange Rate sources).
- Column widths were correctly reduced from 16%/27% to 6% to match the compact ellipsis button.

---

## Recommended Actions

1. **Add `source.name` to the Price Scraping table** -- this is a visible UI gap.
2. **Either remove Certificate Type from the edit modal or add it to the update API** -- the current mismatch creates confusing UX.
3. **Add optimistic primary unset to `handleSaveEditExchange`** or reload exchange rate data after save.
4. **Add `last_price_eur` and `last_exchange_rate` to `ScrapingSourceResponse`** -- this fixes a pre-existing data serialization gap.

---

## Fixes applied (post-review)

**Status**: Recommendations and applicable fixes have been applied.

| # | Action | Status |
|---|--------|--------|
| 1 | Add `source.name` to Price Scraping table | **Already in place** — table already renders `source.name` (SettingsPage.tsx, Source column). |
| 2 | Remove Certificate Type from edit modal or add to API | **Done** — Certificate Type block removed from the **Edit** Scraping Source modal (it cannot be changed via the update API). Add Source modal still has the dropdown. |
| 3 | Optimistic primary unset in `handleSaveEditExchange` | **Already in place** — `handleSaveEditExchange` already unsets `isPrimary` on other sources with the same `fromCurrency`/`toCurrency` when setting one as primary. |
| 4 | Add `last_price_eur` and `last_exchange_rate` to `ScrapingSourceResponse` | **Already in place** — schema has both fields; with `from_attributes=True`, API responses include them from the model. |
| 6 | ActionsDropdown Escape key handler | **Done** — `keydown` listener for `Escape` added in the same `useEffect` as click-outside; closes the dropdown when Escape is pressed. |
