# PlaceOrder Component API Documentation

**Component:** `PlaceOrder`  
**Location:** `frontend/src/components/backoffice/PlaceOrder.tsx`  
**Version:** 1.0  
**Date:** January 26, 2026

---

## Overview

The `PlaceOrder` component is a unified, reusable React component for placing both BID (buy) and ASK (sell) orders in the market maker system. It consolidates functionality previously split across `MMOrderPlacementModal` and `PlaceMarketOrderSection` into a single, context-aware component.

### Key Features

- **Context-Aware Behavior**: Adapts filtering, display, and validation based on order side (BID/ASK)
- **Market Maker Filtering**: 
  - ASK orders: Only shows CEA cash sellers with available CEA balance
  - BID orders: Shows all active market makers
- **Dynamic UI**: Displays relevant information based on order context
- **Form Validation**: Client-side validation with balance checks for ASK orders
- **Accessibility**: Full ARIA support for screen readers and keyboard navigation
- **Loading States**: Handles async operations with proper loading indicators
- **Error Handling**: Comprehensive error display and user feedback

---

## Props Interface

```typescript
interface PlaceOrderProps {
  certificateType: CertificateType;  // 'CEA' | 'EUA'
  side: 'BID' | 'ASK';
  onSubmit: (order: MarketOrder) => Promise<void>;
  onSuccess?: () => void;
  prefilledPrice?: number;
  compact?: boolean;
}
```

### Props Description

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `certificateType` | `'CEA' \| 'EUA'` | Yes | - | Certificate type for the order |
| `side` | `'BID' \| 'ASK'` | Yes | - | Order side - BID (buy) or ASK (sell) |
| `onSubmit` | `(order: MarketOrder) => Promise<void>` | Yes | - | Callback for order submission. Must handle API call and return Promise |
| `onSuccess` | `() => void` | No | `undefined` | Optional callback after successful submission (e.g., close modal, refresh data) |
| `prefilledPrice` | `number` | No | `undefined` | Pre-filled price value (typically from order book click) |
| `compact` | `boolean` | No | `false` | Compact mode for modal display (tighter spacing) |

### MarketOrder Type

```typescript
type MarketOrder = {
  market_maker_id: string;
  certificate_type: 'CEA' | 'EUA';
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
};
```

---

## Usage Examples

### Basic Usage (Modal)

Use a **single path**: `onSubmit` performs only the API call; `onSuccess` handles refresh and closing the modal. PlaceOrder catches API errors and does not call `onSuccess` on failure.

```tsx
import { PlaceOrder } from '../components/backoffice/PlaceOrder';

<PlaceOrder
  certificateType="CEA"
  side="ASK"
  onSubmit={async (order) => {
    await placeMarketMakerOrder(order);
  }}
  onSuccess={() => {
    handleOrderPlaced();
    closeModal();
  }}
  compact
/>
```

### With Pre-filled Price (Order Book Click)

When the user clicks a price in the order book:

- **Bid row (BUY)** → Open **ASK** modal with `prefilledPrice` (sell into the bid).
- **Ask row (SELL)** → Open **BID** modal with `prefilledPrice` (buy from the ask).

```tsx
<PlaceOrder
  certificateType="CEA"
  side="BID"
  onSubmit={handleOrderSubmit}
  onSuccess={handleSuccessAndCloseBid}
  prefilledPrice={bidPrefilledPrice}
  compact
/>
```

### Inline Usage (Non-Modal)

```tsx
<PlaceOrder
  certificateType="EUA"
  side="ASK"
  onSubmit={handleOrderSubmit}
  onSuccess={refreshData}
  compact={false}
/>
```

---

## Behavior by Order Side

### ASK Orders (Sell)

**Market Maker Filtering:**
- Only displays market makers with `mm_type === 'CEA_CASH_SELLER'`
- Only shows market makers with `cea_balance > 0`
- Dropdown displays: `"mm1 - 1,000,000 CEA available"`

**Display Elements:**
- Shows "Available CEA Balance" card with green styling
- Displays available balance for selected market maker
- Shows available balance hint under quantity input

**Validation:**
- Validates that quantity doesn't exceed available CEA/EUA balance
- Shows error: `"Insufficient {certificateType} balance. Available: {amount}"`

### BID Orders (Buy)

**Market Maker Filtering:**
- Shows all active market makers
- Dropdown displays: `"mm1"` or `"mm2 (Inactive)"` if inactive

**Display Elements:**
- Shows "Current Balances" card with CEA and EUA balances
- No available balance card (not needed for buy orders)

**Validation:**
- Standard price and quantity validation
- No balance validation (buy orders don't require certificate balance)

---

## Form Fields

### Market Maker Selection
- **Type:** Dropdown select
- **Required:** Yes
- **Loading State:** Shows spinner while loading market makers
- **Accessibility:** `aria-required`, `aria-busy`, `aria-invalid`, `aria-describedby`

### Certificate Type
- **Type:** Read-only display
- **Required:** No (display only)
- **Accessibility:** `role="textbox"`, `aria-readonly="true"`

### Price Input
- **Type:** Number input
- **Required:** Yes
- **Step:** 0.01
- **Min:** 0
- **Placeholder:** "0.00"
- **Accessibility:** `aria-required`, `aria-invalid`, `aria-describedby`

### Quantity Input
- **Type:** Number input
- **Required:** Yes
- **Step:** 1
- **Min:** 0
- **Placeholder:** "0"
- **Accessibility:** `aria-required`, `aria-invalid`, `aria-describedby`
- **Hint:** For ASK orders, shows available balance below input

---

## Validation Rules

### Client-Side Validation

1. **Market Maker Selection**
   - Must select a market maker
   - Error: `"Please select a Market Maker"`

2. **Price Validation**
   - Must be a valid number
   - Must be greater than 0
   - Error: `"Price must be greater than 0"`

3. **Quantity Validation**
   - Must be a valid number
   - Must be greater than 0
   - Error: `"Quantity must be greater than 0"`

4. **Balance Validation (ASK only)**
   - Quantity must not exceed available certificate balance
   - Error: `"Insufficient {certificateType} balance. Available: {amount}"`

### Server-Side Validation

The component relies on the API (`placeMarketMakerOrder`) for server-side validation. Errors from the API are displayed to the user.

---

## State Management

### Internal State

- `marketMakers`: List of available market makers (filtered by side)
- `selectedMM`: Selected market maker ID
- `balances`: Current balances for selected market maker
- `price`: Price input value
- `quantity`: Quantity input value
- `loading`: Submission loading state
- `loadingMMs`: Market makers loading state
- `loadingBalances`: Balance loading state
- `error`: Error message (null if no error)
- `success`: Success message (null if no success)

### State Flow

1. **Component Mount** → Load market makers (filtered by side)
2. **Market Maker Selected** → Load balances for selected MM
3. **Form Submit** → Validate → Call `onSubmit` → On success: reset form, call `onSuccess`

---

## Error Handling

### Error Sources

1. **API Errors**: Network failures, server errors
2. **Validation Errors**: Client-side form validation
3. **Balance Errors**: Insufficient balance for ASK orders

### Error Display

- Errors are displayed in a red alert box with icon
- Uses `aria-live="assertive"` for screen reader announcements
- Errors are cleared on form submission or when form is reset

### Success Handling

- Success message displayed in green alert box
- Auto-dismisses after 5 seconds (if `onSuccess` not provided)
- Immediately cleared if `onSuccess` callback is provided

---

## Accessibility Features

### ARIA Attributes

- **Form**: `aria-label` for form identification
- **Inputs**: `aria-required`, `aria-invalid`, `aria-describedby`, `aria-busy`
- **Error Messages**: `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`
- **Success Messages**: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- **Loading States**: `aria-busy`, `aria-label` for spinners
- **Labels**: Proper `htmlFor` associations

### Keyboard Navigation

- All form elements are keyboard accessible
- Tab order follows logical form flow
- Submit button accessible via Enter key
- Cancel button (in compact mode) accessible via Tab

### Screen Reader Support

- All interactive elements have descriptive labels
- Error messages are announced immediately
- Loading states are announced
- Form validation errors are linked to inputs

---

## Styling Modes

### Compact Mode (`compact={true}`)

- Used in modal overlays
- Tighter spacing: `p-6 space-y-5`
- Smaller padding on inputs: `px-4 py-2.5`
- Different background colors: `bg-white dark:bg-navy-900`
- Shows Cancel and Submit buttons side-by-side

### Standard Mode (`compact={false}`)

- Used in inline forms
- Standard spacing: `space-y-4`
- Standard padding: `px-4 py-2.5`
- Standard background: `bg-white dark:bg-navy-800`
- Shows single full-width Submit button

---

## Integration with MarketOrdersPage

The component is used in `MarketOrdersPage` for both BID and ASK order modals. `handleOrderSubmit` performs only the API call (`placeMarketMakerOrder`); each modal’s `onSuccess` callback refreshes the order book and closes that modal (single path).

```tsx
// ASK Modal
<PlaceOrder
  certificateType={certificateType}
  side="ASK"
  onSubmit={handleOrderSubmit}
  onSuccess={handleSuccessAndCloseAsk}
  prefilledPrice={askPrefilledPrice}
  compact
/>

// BID Modal
<PlaceOrder
  certificateType={certificateType}
  side="BID"
  onSubmit={handleOrderSubmit}
  onSuccess={handleSuccessAndCloseBid}
  prefilledPrice={bidPrefilledPrice}
  compact
/>
```

Order-book price clicks set the appropriate prefilled price and open the correct modal (BUY → ASK, SELL → BID). See [Behavior by Order Side](#behavior-by-order-side) and the pre-filled price example above.

---

## API Dependencies

### Required API Functions

- `getMarketMakers(params)`: Fetches list of market makers
- `getMarketMakerBalances(mmId)`: Fetches balances for a market maker
- `placeMarketMakerOrder(order)`: Submits order to API (via `onSubmit` prop)

### API Response Formats

**Market Maker Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  cea_balance: number;
  eua_balance: number;
  mm_type?: string;  // 'CEA_CASH_SELLER' | 'CASH_BUYER' | 'SWAP_MAKER'
}
```

**Balance Response:**
```typescript
{
  cea_balance: number;
  eua_balance: number;
  cea_available: number;
  eua_available: number;
  cea_locked: number;
  eua_locked: number;
}
```

---

## Constants

```typescript
const SUCCESS_MESSAGE_TIMEOUT = 5000; // 5 seconds
```

---

## Troubleshooting

### Market Makers Not Loading

**Symptom:** Dropdown shows "Loading market makers..." indefinitely

**Possible Causes:**
- API endpoint unavailable
- Network error
- Authentication issue

**Solution:** Check browser console for error messages, verify API endpoint is accessible

### Balance Not Displaying

**Symptom:** Balance card doesn't appear after selecting market maker

**Possible Causes:**
- API call failed silently
- Market maker has no balance data
- Network timeout

**Solution:** Check network tab for failed API calls, verify market maker has balance data

### Validation Errors Not Showing

**Symptom:** Form submits but validation should have prevented it

**Possible Causes:**
- Validation logic not triggered
- Error state not updating

**Solution:** Verify `validateForm()` is called, check error state updates

### Modal Not Closing After Success

**Symptom:** Order placed successfully but modal remains open

**Possible Causes:**
- `onSuccess` callback not provided
- `onSuccess` callback not closing modal
- Error in `onSuccess` callback

**Solution:** Ensure `onSuccess` callback is provided and properly closes modal

---

## Best Practices

1. **Always provide `onSuccess` callback** when using in modals to handle refresh and close.
2. **Keep `onSubmit` API-only** – perform the API call only; let PlaceOrder catch errors and avoid calling `onSuccess` on failure. Re-throw in `onSubmit` if the parent must be aware.
3. **Use `prefilledPrice`** when the user clicks order book prices (BUY → ASK, SELL → BID).
4. **Set `compact={true}`** (or `compact`) when using in modal overlays.
5. PlaceOrder surfaces API errors internally; no separate parent-level error UI is required for submission failures.

---

## Related Components

- `MMOrderPlacementModal` - Legacy component (replaced by PlaceOrder)
- `PlaceMarketOrderSection` - Legacy component (replaced by PlaceOrder)
- `MarketOrdersPage` - Parent component using PlaceOrder
- `AdminOrderBookSection` - Provides price click functionality

---

## Changelog

### Version 1.1 (January 26, 2026)
- Integration with MarketOrdersPage: single-path submit (`onSubmit` API-only, `onSuccess` refresh + close)
- Order-book price click: BUY → ASK modal + prefilled price, SELL → BID modal + prefilled price
- Documented `prefilledPrice` usage for both BID and ASK modals

### Version 1.0 (January 26, 2026)
- Initial implementation
- Unified BID and ASK order placement
- Context-aware filtering and display
- Full accessibility support
- Comprehensive error handling
