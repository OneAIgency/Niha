# Market Makers System - Administrator Guide

**Version:** 1.0
**Last Updated:** 2026-01-19
**Target Audience:** Platform Administrators

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Managing Market Makers](#managing-market-makers)
4. [Asset Management](#asset-management)
5. [Placing Orders](#placing-orders)
6. [Audit Logging](#audit-logging)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

### What are Market Makers?

Market Makers (MMs) are admin-controlled clients that provide liquidity to the cash market by placing sell orders. Unlike regular users, Market Makers:

- Are managed entirely by administrators
- Cannot login to the platform
- Only place SELL orders (cannot buy)
- Have transaction-based asset management
- All actions are comprehensively logged

### Key Features

- **Transaction-Based Accounting** - All balance changes tracked as immutable transactions
- **Asset Locking** - Assets are automatically locked when orders are placed
- **Comprehensive Audit Trail** - Every action generates a unique ticket ID
- **Real-Time Balance Tracking** - Available vs. locked asset visualization
- **Admin-Only Access** - Only administrators can create and manage MMs

---

## Getting Started

### Accessing the Backoffice

1. Login to the platform with admin credentials
2. Navigate to **Backoffice** from the main navigation
3. Use the compact navigation bar (Subheader) to access:
   - **Market Makers** – Manage MM clients and assets
   - **Market Orders** – Place orders on behalf of MMs
   - **Order Book** – View order book and place MM orders
   - **Liquidity** – Create liquidity
   - **Audit Logging** – View comprehensive action history
   - **Users** – User management

See [Backoffice Layout & Navigation](BACKOFFICE_NAVIGATION.md) for routes and SubSubHeader usage.

### Quick Start Workflow

```
1. Create Market Maker
   ↓
2. Fund with Initial Assets (CEA/EUA)
   ↓
3. Place Sell Order
   ↓
4. Monitor in Audit Log
   ↓
5. Order Matches → Asset Balance Updates
```

---

## Managing Market Makers

### Creating a New Market Maker

**Step 1:** Navigate to Market Makers tab

**Step 2:** Click "Create Market Maker" button

**Step 3:** Fill in the form:
- **Name*** (required) - Display name (e.g., "MM-Alpha", "MM-Liquidity-Provider")
- **Email*** (required) - Unique email address (e.g., "mm-alpha@internal.com")
- **Description** (optional) - Notes for internal reference
- **Initial CEA Balance** (optional) - Starting CEA certificates (e.g., 10000)
- **Initial EUA Balance** (optional) - Starting EUA certificates (e.g., 5000)

**Step 4:** Click "Create"

**Result:**
- Market Maker created with a unique ID
- User account auto-created with MARKET_MAKER role
- Initial balances added as DEPOSIT transactions
- Ticket ID generated for audit trail
- MM appears in the list immediately

### Viewing Market Makers

The Market Makers list displays:
- **Name** - MM display name
- **Email** - Associated email
- **Status** - Active (green) or Inactive (gray) badge
- **CEA Balance** - Total CEA (available + locked)
- **EUA Balance** - Total EUA (available + locked)
- **Total Orders** - Number of orders placed
- **Description** - Internal notes

**Click on any row** to view full details and transaction history.

### Editing a Market Maker

**To edit MM details:**

1. Click on the MM row in the list
2. Click "Edit" button in the details panel
3. Modify:
   - Name
   - Description
   - Active status (toggle to deactivate)
4. Click "Save"

**Note:** Email cannot be changed after creation. Balances are modified via transactions (see Asset Management).

### Deactivating a Market Maker

**Soft Delete Process:**

1. Edit the Market Maker
2. Toggle "Active" switch to OFF
3. Save changes

**What happens:**
- MM marked as `is_active = false`
- Cannot place new orders
- Existing orders remain active
- All historical data preserved
- Reactivate anytime by toggling back ON

**Important:** This is a soft delete. No data is actually deleted to maintain audit trail integrity.

---

## Asset Management

### Understanding Balance Types

For each certificate type (CEA/EUA), Market Makers have three balance metrics:

- **Available** - Free assets that can be sold
- **Locked** - Assets locked in pending orders
- **Total** - Available + Locked

**Formula:** `Total = Available + Locked in Orders`

**Example:**
```
CEA Balance:
  Total: 10,000
  Locked: 1,500 (in pending order)
  Available: 8,500 (can place new orders)
```

### Viewing Balances

**Method 1: From MM List**
- Balances shown in table columns

**Method 2: From MM Details**
1. Click on MM row
2. View "Balance Cards" section
3. Shows breakdown per certificate type

**Method 3: From Transaction History**
- Each transaction shows `balance_after`
- Running balance visible chronologically

### Adding Assets (Deposit)

**When to use:** Funding a new MM or adding more liquidity

**Steps:**

1. Navigate to Market Makers tab
2. Click on the MM row
3. Scroll to "Transaction History" section
4. Click "Add Transaction" button
5. Fill form:
   - **Certificate Type:** CEA or EUA
   - **Transaction Type:** Deposit
   - **Amount*** (required) - Positive number (e.g., 5000)
   - **Notes** (optional) - Reason for deposit
6. Click "Submit"

**Result:**
- New transaction created with type=DEPOSIT
- Balance increases by the amount
- Ticket ID generated
- Appears in transaction history immediately

**Example:**
```
Before: CEA Total = 10,000
Deposit: 5,000 CEA
After: CEA Total = 15,000
```

### Withdrawing Assets

**When to use:** Reducing MM liquidity or rebalancing

**Steps:**

1. Navigate to Market Makers tab
2. Click on the MM row
3. Click "Add Transaction"
4. Fill form:
   - **Certificate Type:** CEA or EUA
   - **Transaction Type:** Withdrawal
   - **Amount*** (required) - Amount to withdraw
   - **Notes** (optional) - Reason for withdrawal
5. Click "Submit"

**Validation:**
- System checks available balance
- Cannot withdraw more than available
- Locked assets cannot be withdrawn

**Result:**
- New transaction created with type=WITHDRAWAL
- Balance decreases by the amount
- Ticket ID generated

**Example:**
```
Before: CEA Available = 10,000, Locked = 2,000, Total = 12,000
Withdrawal: 5,000 CEA
After: CEA Available = 5,000, Locked = 2,000, Total = 7,000
```

**Error Handling:**
- If amount > available → Error: "Insufficient available balance"
- Locked assets are protected

### Transaction History

**Viewing History:**

1. Click on MM row in list
2. Scroll to "Transaction History" section
3. View table with:
   - Date/Time
   - Certificate Type (CEA/EUA)
   - Transaction Type
   - Amount (color-coded: green = positive, red = negative)
   - Balance After (running balance)
   - Notes
   - Ticket ID

**Transaction Types:**

| Type | Description | Amount Sign |
|------|-------------|-------------|
| DEPOSIT | Assets added by admin | Positive (+) |
| WITHDRAWAL | Assets removed by admin | Negative (-) |
| TRADE_DEBIT | Assets locked when order placed | Negative (-) |
| TRADE_CREDIT | Assets released when order cancelled | Positive (+) |

**Filtering:**
- Filter by Certificate Type dropdown
- Chronological order (newest first)
- Pagination for large histories

---

## Placing Orders

### Overview

Admins place SELL orders on behalf of Market Makers. These orders:
- Appear in the public cash market order book
- Are matched by the FIFO engine like regular orders
- Automatically lock assets until filled or cancelled
- Generate comprehensive audit trail

### Navigating to Market Orders

1. Go to Backoffice
2. Click "Market Orders" card
3. Interface shows:
   - **Left:** Order book replica (real-time)
   - **Right:** Order placement form + orders list

### Understanding the Order Book

**Left side displays:**
- Current market depth for CEA (switch tabs for EUA)
- **Asks** (Sell Orders) - Red, from lowest price
- **Bids** (Buy Orders) - Green, from highest price
- **Spread** - Difference between best bid and ask
- Auto-refreshes every 5 seconds

**Use this to:**
- See current market prices
- Identify good sell price points
- Understand liquidity levels

### Placing a Sell Order

**Step 1:** Select Market Maker

- Use dropdown at top of form
- Only active MMs shown
- See available balance for selected MM

**Step 2:** Choose Certificate Type

- Switch between CEA/EUA tabs
- Order book updates accordingly

**Step 3:** Fill Order Details

- **Price*** (required) - Price per certificate (e.g., 25.50)
- **Quantity*** (required) - Number of certificates to sell (e.g., 1000)

**Validation:**
- System checks available balance
- Shows error if insufficient balance
- Cannot place order exceeding available assets

**Step 4:** Click "Place Sell Order"

**Result:**
- Order created with status=PENDING
- Assets immediately locked (Available ↓, Locked ↑)
- Order appears in public cash market
- Order appears in Orders List below form
- Success message with Ticket ID
- TRADE_DEBIT transaction created

**Example:**
```
MM: MM-Alpha
Available CEA: 10,000

Place Order: SELL 1,000 CEA @ 25.50

Result:
  Available CEA: 9,000
  Locked CEA: 1,000
  Order ID: 12345-abcd
  Ticket: TKT-2026-001234
```

### Monitoring Orders

**Orders List** (below order form) shows:

- **Market Maker** - Which MM owns the order
- **Certificate Type** - CEA or EUA
- **Side** - Always SELL for MMs
- **Price** - Order price
- **Quantity** - Total quantity
- **Filled** - How much has been matched
- **Remaining** - Quantity - Filled
- **Status** - PENDING, PARTIALLY_FILLED, FILLED, CANCELLED
- **Created** - Timestamp
- **Actions** - Cancel button (if pending/partial)

**Status Meanings:**

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| PENDING | No matches yet | Cancel |
| PARTIALLY_FILLED | Some quantity filled | Cancel remaining |
| FILLED | Completely matched | View only |
| CANCELLED | Cancelled by admin | View only |

**Filters:**
- Filter by Market Maker
- Filter by Status
- Filter by Certificate Type
- Auto-refreshes every 5 seconds

### Cancelling an Order

**When to use:**
- Price no longer competitive
- Need to free up locked assets
- MM being deactivated

**Steps:**

1. Find the order in Orders List
2. Click "Cancel" button (trash icon)
3. Confirm in modal
4. Order cancelled immediately

**Result:**
- Order status → CANCELLED
- Locked assets released (Available ↑, Locked ↓)
- TRADE_CREDIT transaction created
- Removed from public order book
- Ticket ID generated for audit

**Note:** Only PENDING and PARTIALLY_FILLED orders can be cancelled. Filled orders are historical records.

### When Orders Get Matched

**Automatic matching happens when:**
- A user places a BUY order at matching or higher price
- FIFO matching engine processes the trade

**What happens:**

1. **Trade Execution**
   - Order status → FILLED (or PARTIALLY_FILLED)
   - Assets transferred from MM to buyer
   - Cash transferred from buyer to MM (if applicable)

2. **Balance Updates**
   - MM: Total decreases by filled amount
   - MM: Locked decreases (assets no longer locked)
   - Buyer: Certificates increased

3. **Audit Trail**
   - MM_TRADE_EXECUTED ticket created
   - Links to original order placement ticket
   - Both buyer and seller actions logged

4. **Visibility**
   - Trade appears in MM's transaction history
   - Trade appears in buyer's trade history
   - Shows in Logging tab under MM Actions

---

## Audit Logging

### Overview

Every action in the Market Makers system generates a unique **Ticket ID** (format: `TKT-2026-NNNNNN`). These tickets provide:

- Complete audit trail
- Before/after state snapshots
- Request/response payloads
- Related action linking
- Searchable history

### Navigating to Logging

1. Go to Backoffice
2. Click "Audit Logging" card
3. Five tabs available:
   - **Overview** - Statistics and charts
   - **All Tickets** - Complete audit trail
   - **MM Actions** - Only MM-related actions
   - **Failed Actions** - Only errors
   - **Search** - Advanced search

### Overview Tab

**Displays:**

**Metric Cards:**
- Total Actions - All logged actions
- Successful - Actions that completed
- Failed - Actions with errors
- Success Rate - Percentage

**Charts:**
- Top Action Types - Bar chart showing most common actions
- Most Active Users - Who is using the system

**Use for:**
- Quick health check
- Identifying patterns
- Activity monitoring

### All Tickets Tab

**Shows:** Complete list of all audit tickets

**Columns:**
- Ticket ID - Unique identifier
- Timestamp - When action occurred
- Action Type - What was done
- Entity Type - What was affected
- Status - SUCCESS or FAILED
- User - Who performed action
- MM - Market Maker involved (if applicable)

**Filtering:**
- Search by Ticket ID or tags
- Filter by Status (Success/Failed)
- Filter by Action Type
- Filter by Entity Type
- Auto-refreshes every 10 seconds

**Viewing Details:**
- Click any row to open detail modal
- Shows complete information including:
  - All identifiers (User ID, MM ID, Entity ID)
  - Tags
  - Related Ticket IDs
  - Request Payload (JSON)
  - Response Data (JSON)
  - Before/After State (JSON)
  - Technical info (IP, User Agent)

### MM Actions Tab

**Purpose:** Pre-filtered view of only Market Maker related actions

**Shows:**
- Only tickets where `market_maker_id IS NOT NULL`
- Purple highlighting for visual distinction
- Same table structure as All Tickets

**Action Types you'll see:**
- MM_CREATED
- MM_UPDATED
- MM_DELETED (deactivation)
- ASSET_DEPOSIT
- ASSET_WITHDRAWAL
- MM_ORDER_PLACED
- MM_ORDER_CANCELLED
- MM_TRADE_EXECUTED

**Use for:**
- Monitoring MM activity specifically
- Auditing admin actions on MMs
- Tracking MM order flow

### Failed Actions Tab

**Purpose:** Quickly identify and diagnose errors

**Shows:**
- Only tickets where `status = FAILED`
- Red highlighting for visibility
- Same table structure

**Common failure reasons:**
- Insufficient balance when placing order
- Inactive MM used
- Invalid input data
- System errors

**Use for:**
- Error monitoring
- Debugging issues
- Security monitoring (repeated failures)

**Empty state:**
- If no failures, shows green success message
- "All actions completed successfully"

### Search Tab

**Purpose:** Advanced search with multiple criteria

**Search Fields:**
- **Ticket ID** - Exact or partial match
- **Action Type** - e.g., MM_CREATED, ORDER_PLACED
- **Entity Type** - e.g., Order, MarketMaker, User
- **Entity ID** - UUID of specific entity
- **User ID** - Who performed action
- **Market Maker ID** - Which MM involved
- **Status** - Success or Failed
- **Tags** - Comma-separated (e.g., "market_maker, order")
- **Date From** - Start of time range
- **Date To** - End of time range

**Usage:**
1. Fill one or more search fields
2. Click "Search"
3. Results display in table below
4. Click "Clear" to reset

**Example Searches:**

**Find all actions for a specific MM:**
```
Market Maker ID: <uuid>
Date From: 2026-01-01
```

**Find failed order placements:**
```
Action Type: MM_ORDER_PLACED
Status: Failed
Date From: 2026-01-15
```

**Find all deposits:**
```
Tags: asset_transaction, deposit
```

### Ticket Details

**Click any ticket row to see:**

**Basic Info:**
- Action Type
- Entity Type
- Timestamp
- Status badge

**Identifiers:**
- User ID (who performed action)
- Market Maker ID (if applicable)
- Entity ID (what was affected)

**Tags:**
- Keywords for categorization
- Searchable

**Related Tickets:**
- Links to parent/child actions
- Example: Order placement → Trade execution
- Click-through navigation

**Request Payload:**
- Complete JSON of request sent
- Shows exactly what was requested
- Useful for debugging

**Response Data:**
- Complete JSON of response
- Shows what system returned
- Includes error messages if failed

**Before State:**
- Snapshot of entity before action
- For updates and deletes
- Shows previous values

**After State:**
- Snapshot of entity after action
- For creates and updates
- Shows new values

**Technical Info:**
- IP Address - Where request came from
- User Agent - Browser/client used
- Session ID - Login session

**Use Cases:**

1. **Audit Compliance** - Full paper trail for regulators
2. **Debugging** - See exactly what happened
3. **Security** - Detect unauthorized actions
4. **Training** - Understand system usage patterns

---

## Best Practices

### Market Maker Management

**Naming Convention:**
- Use consistent naming: `MM-{Purpose}-{Identifier}`
- Examples: `MM-Liquidity-01`, `MM-Alpha-CEA`, `MM-Test-Staging`
- Avoid generic names like "Test1"

**Initial Funding:**
- Start with realistic amounts based on market size
- Don't over-fund (ties up capital)
- Don't under-fund (insufficient liquidity)

**Documentation:**
- Use Description field for notes
- Document purpose, strategy, constraints
- Update when circumstances change

**Regular Reviews:**
- Weekly: Check balances and activity
- Monthly: Audit transaction history
- Quarterly: Review effectiveness

### Asset Management

**Transaction Hygiene:**
- Always add Notes to transactions
- Explain reason for deposit/withdrawal
- Reference external tickets/approvals

**Balance Monitoring:**
- Check Available vs Locked regularly
- Ensure sufficient available for strategy
- Don't let too much sit idle

**Reconciliation:**
- Monthly: Verify transaction history
- Compare Total balance with expected
- Investigate discrepancies immediately

### Order Placement

**Pricing Strategy:**
- Monitor order book before placing
- Price competitively but profitably
- Consider spread and liquidity

**Size Strategy:**
- Don't place one huge order
- Break into multiple smaller orders
- Stagger over time

**Risk Management:**
- Don't lock all available assets
- Keep reserve for market opportunities
- Monitor partially filled orders

**Cancellation Policy:**
- Cancel stale orders (e.g., > 24 hours)
- Cancel if market moved significantly
- Free up locked assets regularly

### Audit Compliance

**Regular Reviews:**
- Daily: Check Failed Actions tab
- Weekly: Review MM Actions tab
- Monthly: Full audit of all tickets

**Documentation:**
- Save Ticket IDs for important actions
- Include in external documentation
- Link to approval workflows

**Retention:**
- Audit logs kept indefinitely
- Cannot be deleted (by design)
- Export capability for external storage

**Access Control:**
- Only grant admin access to authorized personnel
- Review user access quarterly
- Audit admin actions monthly

---

## Troubleshooting

### Common Issues

#### Issue: "Insufficient available balance" when placing order

**Cause:** Trying to sell more than available (not counting locked)

**Solution:**
1. Check MM balances
2. View locked amount in pending orders
3. Either:
   - Cancel existing orders to free assets
   - Add more assets via deposit
   - Reduce order quantity

**Prevention:** Monitor locked vs available regularly

---

#### Issue: Cannot cancel order

**Cause:** Order already filled or in wrong status

**Solution:**
1. Check order status
2. If FILLED: Order already matched, cannot cancel
3. If CANCELLED: Already cancelled
4. Refresh page to see latest status

**Note:** Only PENDING and PARTIALLY_FILLED orders can be cancelled

---

#### Issue: Order not appearing in market

**Cause:** MM is inactive

**Solution:**
1. Check MM status in Market Makers tab
2. If inactive, reactivate:
   - Click MM row
   - Click "Edit"
   - Toggle Active to ON
   - Save

**Prevention:** Only deactivate MMs when intentionally removing from market

---

#### Issue: Balances don't match expectations

**Cause:** Locked assets in pending orders or recent trades

**Solution:**
1. View transaction history
2. Check "Locked" amount in balance card
3. Review recent orders and trades
4. Calculate: `Total = Available + Locked`

**Investigation:**
- Sort transactions by date
- Look for TRADE_DEBIT (locks) and TRADE_CREDIT (releases)
- Verify against orders in Market Orders tab

---

#### Issue: Cannot create MM with email

**Cause:** Email already used by another user/MM

**Solution:**
- Use unique email for each MM
- Check if email exists: Backoffice → User Details
- Use format: `mm-{name}@internal.com`

**Note:** Emails must be unique across entire platform

---

#### Issue: Ticket not appearing in Logging tab

**Cause:** Auto-refresh delay or wrong filter

**Solution:**
1. Click "Refresh" button
2. Check filters applied
3. Try "Search" tab with Ticket ID
4. Verify you're in correct tab

**Note:** Auto-refresh is every 10 seconds

---

### Getting Help

**Internal Support:**
- Contact: Platform Engineering Team
- Email: platform-support@company.com
- Slack: #platform-support

**Documentation:**
- API Documentation: `/docs/api/MARKET_MAKERS_API.md`
- Test Plan: `/docs/testing/market-makers-e2e-test-plan.md`
- System Design: `/docs/plans/2026-01-19-market-makers-system-design.md`

**Logs:**
- Backend Logs: `docker-compose logs backend`
- Database: Connect via `docker-compose exec db psql`
- Audit Trail: Use Logging tab

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Esc` | Close modal |
| `Ctrl+R` | Refresh current view |

### Ticket ID Format

```
TKT-YYYY-NNNNNN

TKT: Ticket prefix
YYYY: Year (2026)
NNNNNN: Sequential number (zero-padded 6 digits)

Example: TKT-2026-001234
```

Sequential counter resets each year.

### Status Badges

| Badge Color | Meaning |
|-------------|---------|
| Green | Success / Active / Filled |
| Yellow | Pending / Partially Filled |
| Gray | Inactive / Cancelled |
| Red | Failed / Error |

### Action Type Reference

| Action Type | Description | Entity Type |
|-------------|-------------|-------------|
| MM_CREATED | Market Maker created | MarketMaker |
| MM_UPDATED | MM details updated | MarketMaker |
| MM_DELETED | MM deactivated | MarketMaker |
| ASSET_DEPOSIT | Assets added | AssetTransaction |
| ASSET_WITHDRAWAL | Assets removed | AssetTransaction |
| ASSET_TRADE_DEBIT | Assets locked | AssetTransaction |
| ASSET_TRADE_CREDIT | Assets released | AssetTransaction |
| MM_ORDER_PLACED | Order created | Order |
| MM_ORDER_CANCELLED | Order cancelled | Order |
| MM_TRADE_EXECUTED | Trade matched | Trade |

---

**Document End** - Version 1.0 - 2026-01-19
