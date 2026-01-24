# Order Book Merged Layout - Design Document

**Date:** 2026-01-24
**Component:** TradingOrderBook
**Goal:** Modify order book to show best bid and best ask on the same line with merged vertical layout

---

## Overview

Transform the TradingOrderBook from a 2-column side-by-side layout to a single-column merged layout where:
- Ask orders flow from top (highest to lowest)
- Best bid and best ask are displayed prominently on a single centered row
- Bid orders flow below (highest to lowest)

This creates a traditional order book view with clear visual hierarchy.

---

## Current vs New Layout

**Current Layout:**
```
┌──────────────────────┬──────────────────────┐
│ BIDS (5 cols)        │ ASKS (5 cols)        │
├──────────────────────┼──────────────────────┤
│ Total|Total|Val|Vol|P│ P|Vol|Val|Total|Total│
│ 99.500  150  14,925€ │ 99.505  50  4,976€   │
│ 99.480   80   7,958€ │ 99.520  100  9,955€  │
└──────────────────────┴──────────────────────┘
         Spread: 0.005
```

**New Layout:**
```
┌─────────────────────────────────────┐
│ Price | Volume | Total (EUR)        │ ← Single column header
├─────────────────────────────────────┤
│ 99.550    100    9,955.00          │ ← Ask orders (top)
│ 99.520     50    4,976.00          │
│ ════════════════════════════════════│
│ 99.500 BID | Spread: 0.005 | 99.505 ASK │ ← CENTER ROW
│ ════════════════════════════════════│
│ 99.480    150   14,922.00          │ ← Bid orders (bottom)
│ 99.460     80    7,968.00          │
└─────────────────────────────────────┘
```

---

## Component Structure

### 1. Layout Flow

```
1. Header ("Order Book")
2. Column Headers (Price | Volume | Total EUR)
3. Ask Orders Section (5 levels, highest → lowest)
4. Center Highlight Row (Best Bid | Spread | Best Ask)
5. Bid Orders Section (5 levels, highest → lowest)
6. Totals Summary (Bid totals | Ask totals)
7. Depth Chart (unchanged)
```

### 2. Column Structure

**Simplified to 3 columns:**
- **Price:** Left-aligned, colored (red for asks, emerald for bids)
- **Volume:** Right-aligned, monospace
- **Total (EUR):** Right-aligned, monospace, calculated as Volume × Price

**Grid:** `grid grid-cols-3 gap-4`

**Removed columns (from current implementation):**
- Total Value (EUR) - cumulative removed for simplicity
- Total Volume - cumulative removed for simplicity
- Value (EUR) - renamed to "Total (EUR)" but same calculation

---

## Visual Design Specifications

### Center Row (Best Bid/Ask)

**Purpose:** Most prominent element showing the current market spread

**Visual Treatment:**
- Background: `bg-gradient-to-r from-emerald-50 via-navy-50 to-red-50`
- Dark mode: `dark:from-emerald-900/20 dark:via-navy-800 dark:to-red-900/20`
- Border: `border-y-2 border-navy-300 dark:border-navy-600`
- Padding: `py-3 px-4` (taller than regular rows)
- Height: ~56px vs ~32px for regular rows

**Content Layout (3 sections):**
```
┌────────────────┬────────────────┬────────────────┐
│   99.500 BID   │  Spread: 0.005 │   99.505 ASK   │
│    (emerald)   │   (centered)   │     (red)      │
└────────────────┴────────────────┴────────────────┘
```

**Left Section (Best Bid):**
- Price: `text-emerald-700 dark:text-emerald-300 font-bold text-base`
- Label: "BID" in `text-xs text-emerald-600 dark:text-emerald-400`
- Monospace font for price
- Format: 3 decimals (e.g., "99.500")

**Center Section (Spread):**
- Badge: `bg-white dark:bg-navy-700 rounded-full px-3 py-1 border border-navy-200 dark:border-navy-600`
- Text: `text-navy-600 dark:text-navy-400 text-xs font-medium`
- Format: "Spread: X.XXX"

**Right Section (Best Ask):**
- Price: `text-red-700 dark:text-red-300 font-bold text-base`
- Label: "ASK" in `text-xs text-red-600 dark:text-red-400`
- Monospace font for price
- Format: 3 decimals (e.g., "99.505")

### Ask Rows (Above Center)

**Data:** Top 5 ask levels, sorted highest to lowest (descending)

**Row Structure:**
```
Grid: grid grid-cols-3 gap-4
Padding: py-1.5 px-2
Height: ~32px
```

**Column Styling:**
1. **Price (left):**
   - `text-red-600 dark:text-red-400 font-semibold text-sm`
   - `font-mono tabular-nums`
   - Format: 3 decimals

2. **Volume (right):**
   - `text-navy-900 dark:text-white font-mono text-sm`
   - `text-right tabular-nums`
   - Format: Whole number with commas

3. **Total EUR (right):**
   - `text-navy-700 dark:text-navy-300 font-mono text-xs`
   - `text-right tabular-nums`
   - Format: 2 decimals with commas

**Interactive States:**
- Hover: `hover:bg-red-50 dark:hover:bg-red-900/10`
- Focus: `focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400`
- Cursor: `cursor-pointer`
- Transition: `transition-colors`

### Bid Rows (Below Center)

**Data:** Top 5 bid levels, sorted highest to lowest (descending)

**Row Structure:**
```
Grid: grid grid-cols-3 gap-4
Padding: py-1.5 px-2
Height: ~32px
```

**Column Styling:**
1. **Price (left):**
   - `text-emerald-600 dark:text-emerald-400 font-semibold text-sm`
   - `font-mono tabular-nums`
   - Format: 3 decimals

2. **Volume (right):**
   - `text-navy-900 dark:text-white font-mono text-sm`
   - `text-right tabular-nums`
   - Format: Whole number with commas

3. **Total EUR (right):**
   - `text-navy-700 dark:text-navy-300 font-mono text-xs`
   - `text-right tabular-nums`
   - Format: 2 decimals with commas

**Interactive States:**
- Hover: `hover:bg-emerald-50 dark:hover:bg-emerald-900/10`
- Focus: `focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400`
- Cursor: `cursor-pointer`
- Transition: `transition-colors`

### Column Headers

**Single row above asks:**
```
Price | Volume | Total (EUR)
```

**Styling:**
- Grid: `grid grid-cols-3 gap-4`
- Text: `text-xs font-medium text-navy-500 dark:text-navy-400`
- Transform: `uppercase tracking-wider`
- Padding: `pb-2 mb-2`
- Border: `border-b border-navy-200 dark:border-navy-700`

**Alignment:**
- Price: `text-left`
- Volume: `text-right`
- Total (EUR): `text-right`

### Totals Summary

**Position:** Below bid orders, above depth chart

**Layout:**
```
Grid: grid grid-cols-2 gap-8
Border: border-t border-navy-200 dark:border-navy-700
Spacing: pt-3 mt-4
```

**Left Side (Bid Totals):**
```
Total Bids: 14,925.00 EUR | 150 cert.
```
- Text: `text-sm font-mono font-bold text-navy-900 dark:text-white`
- Color accent: `text-emerald-600 dark:text-emerald-400` for label

**Right Side (Ask Totals):**
```
Total Asks: 9,955.00 EUR | 100 cert.
```
- Text: `text-sm font-mono font-bold text-navy-900 dark:text-white`
- Color accent: `text-red-600 dark:text-red-400` for label

**Format:**
- EUR values: 2 decimals with commas
- Volume: Whole numbers with commas
- Separator: " | " between EUR and volume

---

## Data Flow Changes

### Current Implementation

```typescript
const displayBids = bidsWithCumulativeValues.slice(0, 10);
const displayAsks = asksWithCumulativeValues.slice(0, 10);
```

### New Implementation

```typescript
// Take top 5 for each side (total 10 + center row = 11 visible levels)
const displayAsks = asksWithCumulativeValues.slice(0, 5);
const displayBids = bidsWithCumulativeValues.slice(0, 5);

// Extract best bid/ask for center row
const bestBidData = bidsWithCumulativeValues[0] || null;
const bestAskData = asksWithCumulativeValues[0] || null;

// Remove best from lists (they're in center row)
const askRowsAboveCenter = displayAsks; // All 5 asks shown
const bidRowsBelowCenter = displayBids.slice(1); // Skip best bid (it's in center)
```

**Note:** Actually, we show all 5 bids including best bid below center. Best bid appears in BOTH center row (highlighted) and first bid row (for consistency with order flow).

### Calculation Changes

**Remove cumulative calculations:**
- Current: Shows cumulative volume and cumulative EUR value
- New: Shows only per-order total (Volume × Price)

**Simplified calculations:**
```typescript
const orderTotal = level.quantity * level.price;
// Format as formatEurValue(orderTotal)
```

**Totals remain unchanged:**
- Bid liquidity: Sum of all bid volumes and values
- Ask liquidity: Sum of all ask volumes and values

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. Ask rows (top to bottom)
2. Center row (not focusable - informational only)
3. Bid rows (top to bottom)

**Key Handlers:**
- Enter: Select price level
- Space: Select price level
- Each row: `tabIndex={0}` and `onKeyDown` handler

**ARIA Labels:**

**Ask rows:**
```
aria-label="Ask order at price 99.550, quantity 100, total 9,955.00 EUR"
```

**Center row:**
```
aria-label="Best bid 99.500, best ask 99.505, spread 0.005"
```

**Bid rows:**
```
aria-label="Bid order at price 99.480, quantity 150, total 14,922.00 EUR"
```

**Role attributes:**
- Each row: `role="row"`
- Center row: `role="status"` (live region for screen readers)

### Focus States

**All clickable rows:**
- Outline: `focus:outline-none`
- Ring: `focus:ring-2 focus:ring-{color}-500 dark:focus:ring-{color}-400`
- Visible focus indicator for keyboard users

---

## Edge Cases

### 1. No Best Bid or Best Ask

**When both are null:**
```
┌─────────────────────────────────┐
│      -- BID | No Spread | -- ASK      │
└─────────────────────────────────┘
```

**Styling:**
- Background: `bg-navy-50 dark:bg-navy-800`
- Border: `border-y-2 border-dashed border-navy-300 dark:border-navy-600`
- Text: `text-navy-500 dark:text-navy-400`
- No gradient, gray/muted appearance

### 2. Only Bids (No Asks)

**Center row:**
```
┌─────────────────────────────────┐
│  99.500 BID | No Spread | -- ASK  │
└─────────────────────────────────┘
```

**Layout:**
- No ask section above center
- Column headers still shown
- Only bid rows below center
- Totals show only bid data

### 3. Only Asks (No Bids)

**Center row:**
```
┌─────────────────────────────────┐
│  -- BID | No Spread | 99.505 ASK │
└─────────────────────────────────┘
```

**Layout:**
- Ask section above center
- Column headers shown
- No bid rows below center
- Totals show only ask data

### 4. Less Than 5 Levels

**Show all available:**
- If 3 asks: Show 3 ask rows
- If 2 bids: Show 2 bid rows
- No empty placeholder rows
- Layout adjusts naturally

### 5. Invalid/Missing Data

**Validation:**
- Keep existing `validateOrderBookLevel()` function
- Filter out invalid levels before display
- Graceful handling of edge cases

---

## Responsive Behavior

**Minimum Width:**
- Component minimum: ~400px
- Below this: Consider horizontal scroll or stacking

**Column Widths:**
- Price: `minmax(80px, 1fr)`
- Volume: `minmax(80px, 1fr)`
- Total EUR: `minmax(100px, 1fr)`

**Mobile Considerations:**
- On screens < 640px: May need to reduce font sizes
- Consider making this component horizontally scrollable
- Or create a mobile-specific simplified view

---

## Loading & Empty States

**Loading State:** (Unchanged)
```tsx
if (isLoading) {
  return (
    <Card>
      <Header>Order book</Header>
      <div>Loading order book...</div>
    </Card>
  );
}
```

**Empty State:** (Unchanged)
```tsx
if (no bids && no asks) {
  return (
    <Card>
      <Header>Order book</Header>
      <div>No orders available</div>
    </Card>
  );
}
```

---

## Implementation Checklist

### Phase 1: Structure Changes
- [ ] Remove 2-column grid layout
- [ ] Create single-column container
- [ ] Add new column headers (3 columns)
- [ ] Implement center row component
- [ ] Reverse asks display order (highest first)

### Phase 2: Styling
- [ ] Apply center row gradient background
- [ ] Add thick borders to center row
- [ ] Update ask row colors (red theme)
- [ ] Update bid row colors (emerald theme)
- [ ] Adjust hover states for new layout

### Phase 3: Data Flow
- [ ] Limit to 5 asks and 5 bids
- [ ] Extract best bid/ask for center row
- [ ] Remove cumulative calculations
- [ ] Update totals layout (2-column)

### Phase 4: Accessibility
- [ ] Update ARIA labels for new layout
- [ ] Add center row status role
- [ ] Test keyboard navigation flow
- [ ] Verify focus indicators

### Phase 5: Edge Cases
- [ ] Handle null best bid/ask
- [ ] Handle only bids scenario
- [ ] Handle only asks scenario
- [ ] Test with < 5 levels

### Phase 6: Testing
- [ ] Visual regression testing
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Responsive testing
- [ ] Dark mode verification

---

## Files to Modify

**Primary:**
- `src/components/cash-market/TradingOrderBook.tsx`

**Potentially Affected:**
- `src/components/cash-market/DepthChart.tsx` (may need layout adjustment)
- Any parent components that size/constrain the order book

**Testing:**
- Manual testing in Cash Market page
- Visual verification with real market data

---

## Design System Compliance

**Colors Used:**
- ✅ Navy background colors (navy-50, navy-700, navy-800)
- ✅ Emerald for bids (emerald-50, emerald-600, emerald-700)
- ✅ Red for asks (red-50, red-600, red-700)
- ✅ All colors have dark mode variants

**Spacing:**
- ✅ Standard scale: p-2, p-3, p-4, gap-4, gap-8
- ✅ Consistent with design system

**Typography:**
- ✅ Font sizes: text-xs, text-sm, text-base
- ✅ Font weights: font-medium, font-semibold, font-bold
- ✅ Monospace for numbers: font-mono

**Border Radius:**
- ✅ rounded-full for spread badge
- ✅ No rounded corners on rows (clean grid)

**No Violations:**
- No slate-* colors
- No hardcoded hex values
- All styling uses Tailwind utilities

---

## Success Criteria

1. ✅ Best bid and best ask appear on the same line
2. ✅ Clear visual hierarchy with prominent center row
3. ✅ Simplified 3-column structure is easy to scan
4. ✅ Asks flow from top (highest → lowest)
5. ✅ Bids flow from bottom (highest → lowest)
6. ✅ Spread is clearly visible in center
7. ✅ Keyboard navigation works top-to-bottom
8. ✅ All accessibility requirements met
9. ✅ Design system compliance maintained
10. ✅ Works in both light and dark modes

---

**End of Design Document**
