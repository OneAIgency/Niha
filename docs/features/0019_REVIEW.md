# Code Review: 0019 – Number inputs: thousands separator and unified styling

**Scope**: Platform-wide change to use comma (`,`) as thousands separator in all numeric input fields and to apply a single, consistent input style (per user-specified DOM). Implemented by updating the shared `NumberInput` component and replacing every `type="number"` usage with `NumberInput` across backoffice, settings, and funding flows.

**No formal plan document** – work was driven by a direct user request; this review verifies correctness, design system alignment, and best practices.

---

## Summary of implementation quality

The feature is **correctly implemented**. A single shared component (`NumberInput`) now drives all numeric inputs: it formats with comma thousands (via `en-US` locale), uses design tokens (navy, emerald, red for error), supports light/dark theme, and is used consistently. No remaining `type="number"` inputs exist in the frontend. A few minor issues and recommendations are listed below.

**User request implementation**: Full. All numeric input fields use `NumberInput` with comma thousands separator and the requested base style (`w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-navy-900 dark:text-white` plus focus ring). Exceptions are only where a page intentionally overrides (e.g. FundingPage dark card, WithdrawalRequestModal) for context-specific styling.

---

## Issues found

### Critical
*None.*

### Major
*None.*

### Minor

1. **Design system input shape variance**  
   **File**: `frontend/src/components/common/NumberInput.tsx`  
   **Reference**: `frontend/docs/DESIGN_SYSTEM.md` § Inputs (lines 547–551)  
   **Detail**: The design system shows inputs as `rounded-xl border-2` and `px-4 py-3`. `NumberInput` uses `rounded-lg`, `border` (single), and `px-3 py-2` to match the user’s requested DOM. Functionally fine; the platform now has two input “shapes” (standard text inputs per design doc vs this number style).  
   **Recommendation**: Either document in DESIGN_SYSTEM.md that numeric inputs use `NumberInput` with `rounded-lg`/`border`/`px-3 py-2`, or add a design token/variant so “number” vs “text” input style is explicit.

2. **PendingDepositsTab: focus ring when valid**  
   **File**: `frontend/src/components/backoffice/PendingDepositsTab.tsx` (lines 399–402)  
   **Detail**: When there is no validation error, the `NumberInput` is given `className="focus:ring-navy-500"`, overriding the component default `focus:ring-emerald-500`.  
   **Reference**: `docs/commands/interface.md` and DESIGN_SYSTEM.md require form inputs to use **emerald** for focus ring.  
   **Recommendation**: Remove the `focus:ring-navy-500` override when there is no error so the default emerald focus ring applies; keep only the error branch (`border-red-300 dark:border-red-700 focus:ring-red-500`).

3. **Unstable dependency in `useCallback` (NumberInput)**  
   **File**: `frontend/src/components/common/NumberInput.tsx` (lines 187–198)  
   **Detail**: `handleBlur` and `handleFocus` list `props` (and `handleBlur` also lists `props`) in their dependency arrays. `props` is a new object every render, so both callbacks are recreated every render, negating `useCallback` benefits and potentially causing extra child re-renders.  
   **Recommendation**: Destructure `onBlur` and `onFocus` from `props` in the component signature and use only those in the dependency arrays (e.g. `[value, locale, decimals, onBlur]` and `[onFocus]`).

4. **No automated tests for NumberInput or replaced inputs**  
   **Detail**: No new or updated unit tests for `NumberInput` (formatting, parsing, cursor position, decimals) or for the replaced usages (e.g. AddAssetModal, CreateMarketMakerModal, FundingPage).  
   **Recommendation**: Add tests for `parseFormattedNumber`, `formatNumberWithSeparators`, and for `NumberInput` (value/onChange with commas, decimals, error state). Consider one integration-style test for a key flow (e.g. deposit amount or fee override) that uses `NumberInput`.

---

## Verification against user request

| Requirement | Implementation | Result |
|-------------|----------------|--------|
| Thousands separator comma (e.g. 1,000.50) | `NumberInput` uses `locale="en-US"` (default); formatting uses `Intl.NumberFormat` | ✓ |
| Same base style as specified DOM (w-full px-3 py-2 border border-navy-300 …) | Default `className` in `NumberInput` matches; consumers can override | ✓ |
| Applied “in all the platform” | All former `type="number"` replaced with `NumberInput`; grep finds no remaining `type="number"` | ✓ |

---

## UI/UX and design system analysis

### Design token usage
- **NumberInput** uses only Tailwind tokens: `navy-*`, `emerald-500` (focus), `red-500` (error). No `slate-*`, `gray-*`, or hex/RGB. Compliant with `tailwind.config.js` and `.cursor/rules/niha-core.mdc`.
- Replacing components that passed custom classes (e.g. `rounded-xl`, `border-2`) now rely on `NumberInput`’s base classes; local overrides are limited to focus ring or context (e.g. dark card on FundingPage). No hard-coded colors introduced.

### Theme system
- Base style uses `dark:` variants (`dark:border-navy-600`, `dark:bg-navy-800`, `dark:text-white`, etc.). Theme switching (class on root) is supported.
- `design-tokens.css` / Tailwind `darkMode: 'class'` are respected.

### Component requirements (interface.md)
- **Focus ring**: Default is `focus:ring-emerald-500`; error state uses `focus:ring-red-500`. One consumer (PendingDepositsTab) overrides to navy when valid; see Minor #2.
- **Accessibility**: `aria-invalid`, `aria-describedby` when `error` is set; error message has `role="alert"`. Input uses `inputMode="decimal"` for better mobile keyboards. No new focus traps or missing labels.
- **States**: Default, focus, error, and disabled are supported; loading/empty are handled at page level, not inside `NumberInput`.

### Design system integration
- **DESIGN_SYSTEM.md**: Inputs section describes “Basic input” and “Error state”; `NumberInput` aligns on focus (emerald) and error (red). Only variance is border/radius/size (see Minor #1).
- **app_truth.md** §9: Use of components from `frontend/src/components/common/` (including `NumberInput`) and design-token classes is consistent.

### Recommendations for UI/UX consistency
1. Resolve PendingDepositsTab focus ring override so all number inputs use emerald focus when valid.
2. Document in DESIGN_SYSTEM.md that numeric inputs are implemented with `NumberInput` and note its default size/border (e.g. “Numeric inputs use the NumberInput component; see common/NumberInput.tsx for default styling.”).
3. Optionally add a short “Number inputs” subsection under § Inputs describing comma formatting and `decimals`/`locale` props.

---

## Files touched (reference)

- **Shared**: `frontend/src/components/common/NumberInput.tsx` (default style and behaviour).
- **Backoffice**: AddAssetModal, CreateMarketMakerModal, MMOrderPlacementModal, EditOrderModal, EditAssetModal, UserOrdersSection, MarketMakerAutoTradeTab, AMLDepositsTab, PendingDepositsTab, WithdrawalRequestModal, MarketMakerTransactionsSection.
- **Pages**: SettingsPage, FeeSettingsPage, FundingPage.

---

## Recommendations summary

1. **Minor #2**: Remove `focus:ring-navy-500` for the valid state in PendingDepositsTab so focus uses emerald. **Done.**
2. **Minor #3**: Stabilize `handleBlur` / `handleFocus` deps in `NumberInput` by depending on `onBlur`/`onFocus` instead of `props`. **Done.**
3. **Minor #1**: Document `NumberInput` in DESIGN_SYSTEM.md as the standard for numeric inputs and its default style. **Done** – added “Number inputs” subsection under § Inputs with default style, formatting (comma thousands), and props.
4. **Minor #4**: Add unit tests for `NumberInput` and, if feasible, at least one integration test for a flow using it. **Done** – added `frontend/src/components/__tests__/NumberInput.test.tsx` (parseFormattedNumber, formatNumberWithSeparators, NumberInput behaviour). Created missing `frontend/src/test/utils.tsx` so existing component tests can run.
