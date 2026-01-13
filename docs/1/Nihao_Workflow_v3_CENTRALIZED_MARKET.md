# NIHAO CARBON PLATFORM - OPERATIONAL WORKFLOW GUIDE

**VERSION 3.0 | Centralized Market Model with CLOB & Client Money Accounts**

Date: January 8, 2026  
Status: Production-Ready Workflow Documentation  
Operating Model: Live Trading + Central Limit Order Book + Daily Netting

---

## EXECUTIVE SUMMARY

**Platform Operating Model: LIVE CENTRALIZED MARKET**

- Centralized Limit Order Book (CLOB) matching engine
- Real-time order placement with immediate execution
- Nihao as Central Counterparty (CCP) for all trades
- Client Money & Assets Account (no traditional escrow, daily netting)
- Price-time priority matching rules (FIFO at same price)
- Daily batch settlement with net positions
- Complete audit trail with unique ticket IDs for all client activities

### Client Journey (Simplified)

1. **Fund Client Account** → Wire EUR/USD to Nihao Client Money Account
2. **Browse CEA Market** → Real-time order book with bid/ask depth
3. **Place CEA Buy Order** → Immediate validation & order book acceptance
4. **Receive CEA in Custody** → Confirmed in Nihao's China registry account
5. **Browse Swap Market** → Real-time EUA/CEA swap order book
6. **Place EUA Buy Order (CEA Payment)** → Immediate matching & execution
7. **Receive EUA in Registry** → Confirmed in Client's Union Registry account
8. **Settlement Confirmed** → Daily batch processing, positions netted

**Total Platform Lifecycle:** T+0 (order placement) to T+5 (registry confirmation)

---

## PART 1: SYSTEM ARCHITECTURE & CORE CONCEPTS

### 1.1 Client Money & Assets Account (vs. Traditional Escrow)

**What Changed:**

- **OLD:** Escrow Account with per-transaction settlement verification
- **NEW:** Client Money & Assets Account with daily batch netting
- **Key Principle:** Nihao holds all client cash and certificates, but settles once daily at EOD, not trade-by-trade

**How It Works:**

- Client wires EUR/USD → arrives in Nihao Client Money Account at bank
- Client's position (cash, CEA, EUA) tracked **internally** in Nihao system
- At **End of Day (EOD)**, Nihao calculates net positions for each client:
  - Example: Client bought 100 CEA for EUR 1,000, sold 50 CEA for EUR 500
  - Net position: +50 CEA, –EUR 500
  - **Only the net is settled externally** (not each trade separately)
- Reduces complexity: fewer bank/registry instructions, faster clearance

**Ring-Fencing & Protection:**

- Client funds are **segregated** from Nihao's operating capital
- Client Money Account is protected from Nihao's creditors (per regulatory requirement)
- All client positions backed 1:1 by assets held at bank/registry
- Daily reconciliation ensures accuracy

### 1.2 Nihao as Central Counterparty (CCP)

**What This Means:**

- **Every trade** involves Nihao as one side:
  - Client A sells CEA → Nihao buys CEA (from Client A's perspective)
  - Client B buys CEA → Nihao sells CEA (from Client B's perspective)
- From **Client's view:** "I traded with Nihao"
- From **Nihao's internal view:** "I matched Client A (seller) with Client B (buyer)"

**Why This Works:**

- Eliminates counterparty risk for clients (Nihao guarantees all trades)
- Simplifies settlement (Nihao nets all positions internally, then settles net)
- Enables real-time matching (no negotiation, immediate execution)
- Provides complete audit trail (Nihao tracks every side of every trade)

### 1.3 Two Separate Markets (Simultaneous Operation)

**MARKET 1: CEA ↔ CASH (Central Limit Order Book)**

- Instrument: CEA (in tCO2e units)
- Settlement Currency: EUR (or USD/GBP)
- Order Types: Buy/Sell with price (EUR per CEA) and quantity
- Matching: Price-time priority (FIFO at same price level)
- Example Order:
  - "BUY 100 CEA @ EUR 12.50 per CEA, expires EOD" → Order ID: ORD-CASH-2026-001234

**MARKET 2: EUA ↔ CEA (Swap Market, CLOB for Paired Instruments)**

- Instrument of Reference: EUA (in unit counts)
- Pricing Currency: CEA per EUA (e.g., 8.55 CEA = 1 EUA)
- Order Types: Buy/Sell EUA with price in CEA and quantity in EUA
- Matching: Price-time priority (FIFO at same price level)
- Example Order:
  - "BUY 50 EUA @ 8.60 CEA per EUA, expires EOD" → Order ID: ORD-SWAP-2026-005678

**Key Difference:**

- Market 1: Settlement in cash (bank transfer) + CEA (registry transfer)
- Market 2: Settlement in CEA (registry) + EUA (registry) — **no cash involved**

---

## PART 2: TICKETING & AUDIT TRAIL

Every client action generates a **unique ticket ID** for regulatory/audit purposes.

### Ticket Naming Convention

| Ticket Type | Prefix | Example | Purpose |
|-------------|--------|---------|---------|
| Deposit (cash in) | DEP | DEP-2026-001-AA | Track cash inflows |
| Withdrawal (cash out) | WDL | WDL-2026-002-AB | Track cash outflows |
| Instrument Transfer In | INSTR-IN | INSTR-IN-2026-001-CEA | CEA/EUA received to custody |
| Instrument Transfer Out | INSTR-OUT | INSTR-OUT-2026-002-CEA | CEA/EUA sent from custody |
| Order (CEA Market) | ORD-CASH | ORD-CASH-2026-001234 | Order placement (cash market) |
| Order (Swap Market) | ORD-SWAP | ORD-SWAP-2026-005678 | Order placement (swap market) |
| Order Modification | MOD | MOD-ORD-CASH-2026-001234-A | Change qty/price of existing order |
| Order Cancellation | CXL | CXL-ORD-CASH-2026-001234 | Cancel existing order |
| Trade Execution (CEA) | TRD-CASH | TRD-CASH-2026-000457 | Trade matched (cash market) |
| Trade Execution (Swap) | TRD-SWAP | TRD-SWAP-2026-000987 | Trade matched (swap market) |
| Daily Settlement Batch | SET-BATCH | SET-BATCH-20260108 | EOD netting & clearing run |

### Ticket Content (Every Ticket Recorded)

Each ticket captures:

- **Timestamp** (down to millisecond, HK time)
- **User** (client ID, IP address, device fingerprint)
- **Action** (place, modify, cancel, execute, settle)
- **Market** (CEA-CASH, EUA-CEA)
- **Order Details** (if applicable: side, qty, price, order type)
- **Trade Details** (if applicable: matched with which order, quantities, price, fee)
- **Settlement Details** (if applicable: netting position, delivery instructions, status)
- **Linked Tickets** (references to related tickets: order → trade → settlement batch)
- **Status** (OPEN, FILLED, PARTIAL, CANCELLED, CLEARED, SETTLED, FAILED, REMEDIED)

**Storage:** All tickets stored in immutable database with 7-year retention for regulatory audit.

---

## PART 3: DEPOSIT & ACCOUNT INITIALIZATION

### 3.1 Client Initiates Deposit

**Timeline:** T+0 (same day)

**Client Action:**

```
1. Logs into Nihao Platform
2. Navigates to Account → Deposit Funds
3. Selects currency (EUR, USD, GBP) and amount
4. Confirms bank wire details provided by Nihao
5. Initiates wire transfer from their bank
→ System generates: DEP-2026-001-AA (Deposit Ticket)
```

**Platform Display (Real-time):**

```
Deposit Status: PENDING - Awaiting Bank Confirmation
Deposit Amount: EUR [amount]
Wire Reference: DEP-2026-001-AA
Wire Instructions:
  ├─ Bank Name: [Nihao's Bank]
  ├─ IBAN: [Nihao Client Money Account IBAN]
  ├─ SWIFT: [Code]
  └─ Reference: DEP-2026-001-AA (must include in wire)
Estimated Arrival: 2-5 business days
Client Money Account Balance: EUR [previous balance]
```

### 3.2 Wire Received & AML Hold

**Timeline:** T+2 to T+5 (wire arrival) + T+1 to T+2 (AML processing)

**Process:**

```
Wire arrives at Nihao bank → Matched to DEP ticket by reference number
  └─ System confirms receipt
  └─ Generates confirmation email
  └─ Places funds on AML HOLD (1-2 days depending on deposit size)
  └─ Automated sanctions screening (OFAC, EU, UN lists)
  └─ If PASS: funds released to Client Money Account
  └─ If FAIL: hold escalated to compliance, client contacted
```

**Platform Display (On Hold):**

```
Deposit Status: RECEIVED - On AML Hold [1 of 2 days]
Amount Received: EUR [amount]
Funds Available for Trading: EUR 0.00 (on hold)
Total Account Balance: EUR [amount] (visible but locked)
Hold Release Time: [Specific date & time HK]
Message: Funds will be available at 09:00 HK time on [date]
```

### 3.3 Funds Cleared & Trading Ready

**Timeline:** Upon AML hold expiration (automatic)

**Platform Display (Cleared):**

```
Deposit Status: ✓ CLEARED
Client Money Account Balance: EUR [amount]
Available for Trading: EUR [amount]
On Hold in Settlements: EUR 0.00
Last Updated: [Date] [Time] HK
Next Step: [Button] BROWSE MARKETPLACE or BROWSE SWAP CENTER
```

**Client Email #1: Funds Cleared**

```
SUBJECT: ✓ Your Nihao Account is Ready for Trading

Dear [Client Name],

Your deposit of EUR [amount] has been successfully cleared.

ACCOUNT STATUS:
├─ Deposit Reference: DEP-2026-001-AA
├─ Amount: EUR [amount]
├─ Received: [Date]
├─ Status: ✓ CLEARED & READY
├─ Available Balance: EUR [amount]
└─ Last Updated: [Date] [Time] HK

You can now trade on both markets:
1. CEA Market: Buy/Sell CEA certificates for EUR
2. Swap Market: Buy/Sell EUA for CEA (peer-to-peer matching)

Next Steps:
├─ Click "BROWSE MARKETPLACE" to enter CEA market
├─ Browse live CEA order book with bid/ask depth
├─ Or click "BROWSE SWAP CENTER" to enter swap market
└─ Place your first order by clicking BUY or SELL

Platform Support: support@nihaogroup.hk | +852 3062 3366

Best regards,
Nihao Trading Team
```

---

## PART 4: MARKET 1 - CEA ↔ CASH (Order Book Trading)

### 4.1 Client Browses CEA Market

**Timeline:** Real-time (instant viewing)

**Platform Display:**

```
CEA MARKET - LIVE ORDER BOOK
┌────────────────────────────────────┐
│ Status: OPEN for trading           │
│ Session: 08:00 HK - 17:00 HK       │
│ Current Time: 12:34 HK             │
│ Last Update: 00:01 seconds ago     │
└────────────────────────────────────┘

MARKET STATISTICS:
├─ Last Trade Price: EUR 12.45 per CEA
├─ 24h High: EUR 12.89
├─ 24h Low: EUR 11.95
├─ Daily Volume: 145,320 CEA
└─ Open Orders: 287 (bid) / 156 (ask)

DEPTH OF MARKET (BID - BUY SIDE):
Price      │ Qty (tCO2e)  │ Orders
EUR 12.45  │ 2,450        │ 12
EUR 12.44  │ 1,876        │ 8
EUR 12.43  │ 3,200        │ 15
EUR 12.42  │ 5,123        │ 23
[...more levels...]

DEPTH OF MARKET (ASK - SELL SIDE):
Price      │ Qty (tCO2e)  │ Orders
EUR 12.46  │ 1,200        │ 6
EUR 12.47  │ 2,890        │ 11
EUR 12.48  │ 4,560        │ 19
EUR 12.49  │ 3,175        │ 14
[...more levels...]

YOUR CLIENT MONEY ACCOUNT:
├─ EUR Available: EUR 50,000.00
├─ CEA Holdings: 0.00 tCO2e
└─ Margin Available: EUR 50,000.00
```

### 4.2 Client Places Buy Order

**Timeline:** Real-time (sub-millisecond execution)

**Client Action:**

```
1. Selects "BUY" order type
2. Enters quantity: 1,000 tCO2e
3. Enters limit price: EUR 12.45 per CEA
4. Sets expiry: End of Day (EOD)
5. Reviews fee (0.5%): EUR 62.25
6. Clicks "PLACE ORDER"
```

**Validation by Nihao System:**

```
✓ Client has funds available?
    ├─ Amount needed: 1,000 × EUR 12.45 + 0.5% fee
    ├─ = EUR 12,450 + EUR 62.25 = EUR 12,512.25
    ├─ Available: EUR 50,000.00
    └─ PASS → Funds reserved (blocked for this order)

✓ Client in good standing (KYC/AML)?
    └─ PASS

✓ Order parameters valid?
    ├─ Quantity: 1,000 tCO2e (within limits)
    ├─ Price: EUR 12.45 (reasonable market level)
    └─ PASS

✓ All validations passed → ORDER ACCEPTED
    └─ Generate: ORD-CASH-2026-001234
    └─ Insert into order book at EUR 12.45 bid side
    └─ Status: OPEN (waiting for match)
    └─ Time priority: [12:34:56.789 HK]
```

**Platform Display (Order Confirmation):**

```
✓ ORDER PLACED SUCCESSFULLY

Order ID: ORD-CASH-2026-001234
Status: OPEN (in order book)
Side: BUY
Quantity: 1,000 tCO2e
Limit Price: EUR 12.45 per CEA
Total Value: EUR 12,450.00
Platform Fee: 0.5% = EUR 62.25
Total Cost: EUR 12,512.25

FUNDS STATUS:
├─ Reserved for this order: EUR 12,512.25
├─ Remaining available: EUR 37,487.75
└─ Total account balance: EUR 50,000.00

ORDER BOOK POSITION:
├─ Current bid: EUR 12.45 (YOUR ORDER)
├─ Position in queue: #3 (3 other buy orders at EUR 12.45)
├─ Time in queue: You are 3rd in line (placed at 12:34:56)
├─ Next higher bid: EUR 12.44 (1,876 CEA)
└─ Distance to execution: 1 tick (EUR 0.01)

Expiry: End of Day (17:00 HK)
[MODIFY] [CANCEL] [VIEW DETAILS]
```

**Client Email #2: Order Confirmation**

```
SUBJECT: BUY Order Placed - ORD-CASH-2026-001234

Dear [Client Name],

Your BUY order has been placed in the CEA Market order book.

ORDER SUMMARY:
├─ Order ID: ORD-CASH-2026-001234
├─ Side: BUY
├─ Quantity: 1,000 tCO2e
├─ Limit Price: EUR 12.45 per CEA
├─ Status: OPEN (waiting for match)
├─ Placed at: [Date] 12:34:56 HK time
├─ Expiry: End of Day (17:00 HK)
└─ Fee: 0.5% (EUR 62.25)

ACCOUNT IMPACT:
├─ Funds Reserved: EUR 12,512.25
├─ Remaining Available: EUR 37,487.75
└─ Can still trade with: EUR 37,487.75

WHAT HAPPENS NEXT:

If another client places a SELL order at EUR 12.45 or lower:
├─ Your buy order will be MATCHED automatically
├─ You will receive immediate notification
├─ CEA will enter Nihao custody for you
├─ Settlement begins immediately

If no match by 17:00 HK:
├─ Order EXPIRES automatically
├─ Funds reserved will be RELEASED
├─ You can place a new order

Monitor your order status:
├─ Log into platform and click "ORDERS"
├─ Or view live updates in "MY TRADING"
├─ Real-time matching notifications sent via email

Questions? Contact support@nihaogroup.hk

Best regards,
Nihao Trading Desk
```

### 4.3 Order Matching (Price-Time Priority)

**Timeline:** Real-time (milliseconds)

**Scenario:**

```
12:35:20 → Another client places SELL order:
  ├─ Quantity: 500 tCO2e
  ├─ Limit Price: EUR 12.45 (market order, willing to accept any price)
  └─ → IMMEDIATE MATCHING ENGINE ACTIVATION

Matching Algorithm:
  ├─ Ask: "Is there a BUY order at EUR 12.45 or higher?"
  ├─ Answer: YES - ORD-CASH-2026-001234 exists (BUY 1,000 @ EUR 12.45)
  ├─ "Time check: Is this order first in queue at this price?"
  ├─ Answer: NO - There are 2 orders before it (time priority)
  ├─ → Execute against the 2 orders first (FIFO)
  └─ → ORD-CASH-2026-001234 remains OPEN for 500 of original 1,000

EXECUTION #1:
  ├─ Buyer: Client X (first order at EUR 12.45)
  ├─ Seller: Client Y (new SELL order)
  ├─ Quantity: 200 tCO2e
  ├─ Price: EUR 12.45 per CEA
  ├─ → Generate: TRD-CASH-2026-000457 (Trade Ticket #1)
  └─ Status: MATCHED

EXECUTION #2:
  ├─ Buyer: Client Z (second order at EUR 12.45)
  ├─ Seller: Client Y (same SELL order, partial match)
  ├─ Quantity: 300 tCO2e
  ├─ Price: EUR 12.45 per CEA
  ├─ → Generate: TRD-CASH-2026-000458 (Trade Ticket #2)
  └─ Status: MATCHED

Client Y's SELL order: FULLY FILLED (500 out of 500)
ORD-CASH-2026-001234 (YOUR order): Still OPEN for 1,000 (no match yet)
```

### 4.4 Settlement of Matched Trade (Intraday)

**Timeline:** Immediate (after matching)

**What Happens (Internally at Nihao):**

```
TRD-CASH-2026-000457 is MATCHED
  └─ Buyer (Client X) owes: 200 × EUR 12.45 = EUR 2,490
  └─ Seller (Client Y) owes: 200 tCO2e
  
Internal ledger updates (NOT external yet):
  ├─ Client X balance: EUR –2,490 (reserved until EOD netting)
  ├─ Client Y CEA: –200 tCO2e (reserved until EOD netting)
  ├─ Nihao as CCP tracks both sides
  └─ Status: CLEARED (internal clearing complete)

Platform Display (Client X - Buyer):**

Order Status: ORD-CASH-2026-001234
├─ PARTIALLY FILLED: 200 / 1,000 tCO2e
├─ Average Price: EUR 12.45 per CEA
├─ Remaining Qty: 800 tCO2e
├─ Status: OPEN (still waiting for 800 more)
├─ Last Match: [Date] 12:35:20
└─ CEA In Custody: 200 tCO2e

Client Money Account:
├─ EUR Available: EUR 37,987.75 (after trade reservation)
├─ EUR Reserved for Order: EUR 9,960.00 (for remaining 800 @ EUR 12.45)
├─ Total EUR Available (both): EUR 47,947.75
└─ CEA Held (Settlement): 200 tCO2e

Client Email #3: Trade Executed

SUBJECT: Trade Executed - ORD-CASH-2026-001234 [PARTIAL FILL]

Dear [Client Name],

Your BUY order has been PARTIALLY FILLED.

TRADE DETAILS:
├─ Order ID: ORD-CASH-2026-001234
├─ Trade ID: TRD-CASH-2026-000457
├─ Qty Filled: 200 tCO2e
├─ Price: EUR 12.45 per CEA
├─ Total Cost: EUR 2,490.00
├─ Fee (0.5%): EUR 12.45
├─ Net Cost: EUR 2,502.45
├─ Execution Time: [Date] 12:35:20 HK
└─ Remaining Qty: 800 tCO2e (order still OPEN)

SETTLEMENT STATUS:
├─ CEA Position: 200 tCO2e added to your custody (interim)
├─ Will be confirmed at EOD batch processing
├─ EUR will be settled from your account at EOD
└─ Settlement Date: T+1 (next business day)

YOUR ORDER REMAINS OPEN:
├─ Qty Remaining: 800 tCO2e
├─ Bid Price: EUR 12.45 per CEA
├─ Position in Queue: [current position]
├─ Expiry: End of Day (17:00 HK)
└─ Can be MODIFIED or CANCELLED anytime

Monitor in real-time at: platform.nihaogroup.hk → MY TRADING

Best regards,
Nihao Trading Desk
```

### 4.5 End of Day (EOD) Batch Settlement

**Timeline:** 17:00 HK (daily, automated)

**EOD Process:**

```
17:00:00 HK → All open orders EXPIRED (unless GTC = Good Till Cancelled)
  ├─ ORD-CASH-2026-001234: EXPIRED (no remaining 800)
  ├─ Status: CANCELED (unfilled portion)
  └─ Funds released: EUR 9,960.00

17:00:30 → Nihao Clearing & Settlement Engine starts:

STEP 1: Aggregate All Trades Today
  ├─ Client X trades:
  │   ├─ TRD-CASH-2026-000457: +200 CEA, –EUR 2,502.45
  │   └─ [other trades if any]
  └─ Net Position for Client X: +200 CEA, –EUR 2,502.45

STEP 2: Calculate Net Position (Netting)
  ├─ Client's intraday cash bought/sold: Net it out
  ├─ Client's intraday CEA bought/sold: Net it out
  ├─ Result: Single net instruction per client per instrument
  └─ Example: Client X net: +200 CEA, –EUR 2,502.45

STEP 3: Generate Settlement Instructions
  ├─ For Cash (EUR):
  │   ├─ Instruction: Debit Client X's account EUR 2,502.45
  │   ├─ Destination: Nihao's bank account (client funds pool)
  │   └─ Ticket: SET-BATCH-20260108-EUR-NETTING
  │
  ├─ For CEA:
  │   ├─ Instruction: Send +200 tCO2e to Client X via China registry
  │   ├─ From: Nihao's CEA account (holding as custodian)
  │   ├─ To: Client X's CEA account (custody)
  │   └─ Ticket: SET-BATCH-20260108-CEA-NETTING

STEP 4: Execute External Settlement (Banks + Registries)
  ├─ Bank: Debit Client X's account (ACH or overnight batch)
  ├─ Registry: Initiate CEA transfer (overnight batch)
  ├─ Confirmation: Next business day (T+1)
  └─ Ticket Status: SETTLED (T+1 confirmation)

Platform Display (Client X - Next Morning T+1):**

Settlement Batch: SET-BATCH-20260108
├─ Status: ✓ SETTLED
├─ Execution Date: [Previous] 17:00 HK
├─ Settlement Date: [Today] (T+1)
├─ Trades Included: 1 (TRD-CASH-2026-000457)
│
├─ CASH SETTLEMENT:
│   ├─ Amount: –EUR 2,502.45
│   ├─ Method: Bank ACH transfer
│   ├─ Status: ✓ CONFIRMED
│   └─ New EUR Balance: EUR 47,497.55
│
├─ CEA SETTLEMENT:
│   ├─ Amount: +200 tCO2e
│   ├─ Method: China registry transfer
│   ├─ Status: ✓ CONFIRMED at 09:15 HK
│   └─ New CEA Balance: 200 tCO2e (confirmed in custody)
│
└─ All Fees Paid: EUR 12.45 (included in above)

Client Email #4: Settlement Complete

SUBJECT: ✓ Settlement Complete - SET-BATCH-20260108

Dear [Client Name],

Your trades from [yesterday] have been successfully settled.

SETTLEMENT SUMMARY:
├─ Settlement Batch: SET-BATCH-20260108
├─ Settlement Date: [Date] (T+1)
├─ Status: ✓ COMPLETE
├─ Trades Settled: 1
└─ Fees Paid: EUR 12.45

CASH SETTLEMENT:
├─ Amount Debited: EUR 2,502.45
├─ Method: Bank transfer (overnight batch)
├─ Confirmed: [Date] 08:30 HK
├─ New EUR Balance: EUR 47,497.55
└─ Status: ✓ COMPLETE

CEA SETTLEMENT:
├─ Amount Received: 200 tCO2e (vintage 2025)
├─ Method: China registry transfer
├─ Confirmed: [Date] 09:15 HK
├─ New CEA Balance: 200 tCO2e
└─ Status: ✓ COMPLETE (in custody)

NEXT STEPS:
You now have 200 tCO2e available to:
1. Sell in CEA Market for EUR
2. Swap for EUA in Swap Market
3. Hold in custody
4. Withdraw to external registry [contact support]

Place your next order anytime during market hours (08:00–17:00 HK).

Best regards,
Nihao Settlement Team
```

---

## PART 5: MARKET 2 - SWAP (EUA ↔ CEA Order Book)

### 5.1 Client Browses Swap Market

**Timeline:** Real-time (instant viewing)

**Platform Display:**

```
SWAP MARKET - LIVE PEER-TO-PEER ORDER BOOK
┌────────────────────────────────────┐
│ Status: OPEN for trading           │
│ Instrument: EUA (tCO2e units)      │
│ Pricing: CEA per EUA               │
│ Session: 08:00 HK - 17:00 HK       │
│ Last Update: 00:02 seconds ago     │
└────────────────────────────────────┘

MARKET STATISTICS:
├─ Last Swap Price: 8.62 CEA per EUA
├─ 24h High: 8.75 CEA per EUA
├─ 24h Low: 8.45 CEA per EUA
├─ Daily Swap Volume: 4,250 EUA swapped
└─ Open Swap Orders: 123 (buy EUA) / 98 (sell EUA)

SWAP DEPTH (BUY EUA SIDE - Offering CEA):
Price (CEA/EUA) │ Qty EUA  │ Orders
8.62            │ 500      │ 8
8.61            │ 750      │ 12
8.60            │ 1,200    │ 15
8.59            │ 890      │ 11
[...more levels...]

SWAP DEPTH (SELL EUA SIDE - Seeking CEA):
Price (CEA/EUA) │ Qty EUA  │ Orders
8.63            │ 400      │ 6
8.64            │ 600      │ 9
8.65            │ 1,100    │ 13
8.66            │ 750      │ 10
[...more levels...]

YOUR CLIENT MONEY ACCOUNT:
├─ EUR Available: EUR 47,497.55
├─ CEA Holdings: 200.00 tCO2e (available to swap)
├─ EUA Holdings: 0.00 EUA
└─ Swap Capacity: 200 × (1/8.62 CEA per EUA) = ~23.2 EUA potential
```

**Explanation for Client:**

```
How the Swap Market Works:

In this market, you SWAP your CEA for EUA.

BUY EUA / SELL CEA:
  You offer: [X] CEA
  You want: [Y] EUA
  Price: CEA per EUA (how many CEA you pay for 1 EUA)
  Example: "I will give 100 CEA to get 11.6 EUA @ 8.62 CEA/EUA"

SELL EUA / BUY CEA:
  You offer: [Y] EUA
  You want: [X] CEA
  Price: CEA per EUA (how many CEA you receive for 1 EUA)
  Example: "I have 11.6 EUA and I want 100 CEA @ 8.62 CEA/EUA"

Matching:
  A client wanting to BUY EUA (selling CEA) is matched with
  a client wanting to SELL EUA (buying CEA) at agreed price.

Current Market:
  Best BUY (buying EUA): 8.62 CEA per EUA
  Best SELL (selling EUA): 8.63 CEA per EUA
  Spread: 0.01 CEA (very tight)
```

### 5.2 Client Places Swap Order

**Timeline:** Real-time (sub-millisecond execution)

**Client Action:**

```
1. Selects "BUY EUA" (implicitly selling CEA)
2. Enters quantity: 20 EUA
3. Enters limit price: 8.65 CEA per EUA
   (meaning: "I will pay up to 8.65 CEA for each EUA")
4. Sets expiry: End of Day (EOD)
5. Reviews fee (0.5%): Calculated at execution
6. Clicks "PLACE SWAP ORDER"
```

**Validation by Nihao System:**

```
✓ Swap order parameters:
    ├─ You want to BUY: 20 EUA
    ├─ At price: max 8.65 CEA per EUA
    ├─ Total CEA needed: 20 × 8.65 = 173 CEA
    ├─ Plus 0.5% fee: 173 × 0.005 = 0.865 CEA
    ├─ Total: 173.865 CEA
    ├─ You have available: 200 CEA
    ├─ Enough? YES → PASS
    └─ CEA reserved: 173.865 CEA

✓ Client in good standing? → PASS
✓ Order parameters valid? → PASS

✓ All validations passed → SWAP ORDER ACCEPTED
    └─ Generate: ORD-SWAP-2026-005678
    └─ Insert into order book at 8.65 CEA/EUA ask side (buying EUA)
    └─ Status: OPEN (waiting for match)
    └─ Time priority: [12:40:15.234 HK]
```

**Platform Display (Swap Order Confirmation):**

```
✓ SWAP ORDER PLACED SUCCESSFULLY

Order ID: ORD-SWAP-2026-005678
Status: OPEN (in swap order book)
Side: BUY EUA (SELL CEA)
Quantity EUA: 20 EUA
Quantity CEA Needed: 173.00 CEA (@ 8.65 CEA/EUA limit)
Platform Fee: 0.5% = 0.865 CEA
Total CEA Reserved: 173.865 CEA

CEA BALANCE:
├─ Total CEA Holdings: 200.00 tCO2e
├─ Reserved for this swap: 173.865 CEA
├─ Remaining available: 26.135 CEA
└─ Can still place orders for: 26.135 CEA potential

SWAP ORDER BOOK POSITION:
├─ You are asking: 8.65 CEA per EUA (for buying EUA)
├─ Current best ask: 8.63 CEA per EUA (tighter than yours)
├─ Current best bid: 8.62 CEA per EUA
├─ Distance to execution: –2 ticks (your ask is worse, may not fill soon)
├─ Time in queue: 1st at 8.65 level
└─ NOTE: Lower price (more CEA per EUA) = more attractive

Expiry: End of Day (17:00 HK)
[MODIFY PRICE] [INCREASE QTY] [CANCEL] [VIEW DETAILS]
```

**Client Email #5: Swap Order Confirmation**

```
SUBJECT: SWAP Order Placed - ORD-SWAP-2026-005678 [BUY EUA]

Dear [Client Name],

Your SWAP order has been placed in the Swap Market order book.

SWAP ORDER SUMMARY:
├─ Order ID: ORD-SWAP-2026-005678
├─ Direction: BUY EUA / SELL CEA
├─ Quantity EUA: 20 EUA (you want to receive)
├─ Limit Price: 8.65 CEA per EUA (max you will pay)
├─ CEA Cost: 173.00 CEA @ 8.65 = 173.00 CEA
├─ Platform Fee: 0.5% = 0.865 CEA
├─ Total CEA Cost: 173.865 CEA
├─ Status: OPEN (waiting for seller EUA)
├─ Placed at: [Date] 12:40:15 HK
└─ Expiry: End of Day (17:00 HK)

MATCHING INFORMATION:
├─ Current best ask (others selling EUA): 8.63 CEA/EUA
├─ Your bid (you asking): 8.65 CEA/EUA
├─ Gap: +2 ticks (your offer is 2 ticks ABOVE market)
├─ Probability of match: HIGH (should fill soon if volume available)
└─ Potential match time: Next 1-2 minutes

ACCOUNT IMPACT:
├─ CEA Reserved: 173.865 CEA
├─ CEA Remaining: 26.135 CEA
├─ Can still place trades with: 26.135 CEA
└─ EUR Balance: Unchanged (EUR 47,497.55)

WHAT HAPPENS NEXT:

If another client places a SELL EUA order at 8.65 CEA/EUA or less:
├─ Your order will be MATCHED automatically
├─ You will receive immediate notification
├─ EUA will enter your Swap Center balance (awaiting registry transfer)
├─ Settlement begins immediately (T+1-T+3 to registries)

If no match by 17:00 HK:
├─ Order EXPIRES automatically
├─ CEA reserved will be RELEASED (173.865 returned to available)
├─ You can place a new order with different price

Monitor your order status:
├─ Log into platform and click "SWAP ORDERS"
├─ Or view live updates in "MY TRADING"
└─ Real-time matching notifications sent via email

IMPORTANT:
This is a PEER-TO-PEER swap. You will be matched with another
Nihao client (or potentially with our liquidity provider).
Once matched, settlement is guaranteed by Nihao.

Questions? Contact support@nihaogroup.hk

Best regards,
Nihao Trading Desk
```

### 5.3 Swap Matching & Execution

**Timeline:** Real-time (milliseconds)

**Scenario:**

```
12:42:10 → Another client places SELL EUA order:
  ├─ Quantity: 20 EUA
  ├─ Limit Price: 8.64 CEA per EUA
  │   (meaning: "I want at least 8.64 CEA per EUA")
  └─ → IMMEDIATE SWAP MATCHING ENGINE ACTIVATION

Matching Algorithm (Swap Market):
  ├─ Ask: "Is there a BUY EUA order at 8.64 CEA/EUA or higher?"
  ├─ Answer: YES - ORD-SWAP-2026-005678 (BUY EUA @ 8.65 CEA/EUA)
  ├─ "Time check: Is this order first in queue at this price level?"
  ├─ Answer: YES - Only one order at 8.65 or better
  ├─ "Does SELL order qty match BUY order qty?"
  ├─ Answer: YES - Both exactly 20 EUA
  └─ → EXECUTE FULL SWAP

EXECUTION:
  ├─ Buyer (Client X):
  │   ├─ Wants: 20 EUA
  │   ├─ Will pay: up to 8.65 CEA per EUA
  │   ├─ CEA reserved: 173.00 CEA
  │
  ├─ Seller (Client Y):
  │   ├─ Offers: 20 EUA
  │   ├─ Wants: at least 8.64 CEA per EUA
  │
  ├─ Matched Price: 8.65 CEA per EUA (buyer's limit is used as match price)
  │   (Reason: order book rule = maker's price prevails, Client X maker/Client Y taker)
  │
  ├─ Settlement:
  │   ├─ Client X pays: 20 × 8.65 = 173 CEA
  │   ├─ Client X receives: 20 EUA
  │   ├─ Client Y pays: 20 EUA
  │   ├─ Client Y receives: 173 CEA
  │
  └─ Generate: TRD-SWAP-2026-001789 (Swap Trade Ticket)

STATUS UPDATES:

ORD-SWAP-2026-005678: FULLY FILLED ✓
  ├─ Status: FILLED
  ├─ Qty Filled: 20 EUA (full order)
  ├─ Avg Price: 8.65 CEA per EUA
  ├─ Fee: 0.865 CEA (0.5%)
  └─ Total CEA Cost: 173.865 CEA

TRD-SWAP-2026-001789: MATCHED
  ├─ Buyer: Client X (BUY 20 EUA @ 8.65)
  ├─ Seller: Client Y (SELL 20 EUA @ 8.65)
  ├─ CEA Transferred: 173 from Client X to Client Y
  ├─ EUA Transferred: 20 from Client Y to Client X
  ├─ Status: CLEARED (internal clearing complete)
  └─ Next: EOD netting & settlement
```

### 5.4 End of Day Batch Settlement (Swap)

**Timeline:** 17:00 HK (daily, automated)

**EOD Process for Swap Trade:**

```
17:00:30 → Nihao Clearing & Settlement Engine (continued):

SWAP SETTLEMENT PROCESSING:

STEP 1: Aggregate Client X's Swap Trades
  ├─ Intraday swaps:
  │   ├─ TRD-SWAP-2026-001789: –173 CEA, +20 EUA
  │   └─ [other swaps if any]
  ├─ Net Position: –173 CEA, +20 EUA

STEP 2: Generate Net Settlement Instructions
  ├─ For CEA (China Registry):
  │   ├─ Instruction: SEND 173 CEA from Client X to China registry
  │   ├─ Source: Client X's CEA custody account
  │   ├─ Destination: Nihao operational account (temporary)
  │   ├─ Reason: Payment for EUA swap
  │   └─ Ticket: SET-BATCH-20260108-CEA-SWAP-OUT
  │
  ├─ For EUA (Union Registry):
  │   ├─ Instruction: RECEIVE 20 EUA at Nihao's EU account
  │   ├─ From: Swap counterparty (Client Y)
  │   ├─ To: Nihao operational account (temporary)
  │   ├─ Reason: Inbound EUA from swap
  │   └─ Ticket: SET-BATCH-20260108-EUA-IN

STEP 3: Execute External Settlement (Next Day T+1)
  ├─ China Registry: Process CEA outbound transfer (T+1-T+2)
  ├─ Union Registry: Process EUA inbound transfer (T+1-T+2)
  └─ Confirmation: Next morning (T+1)

STEP 4: Final Delivery to Client (T+3-T+5)
  ├─ Once EUA arrives in Nihao's EU registry account
  ├─ Nihao initiates final transfer to Client X's Union Registry
  ├─ Timeline: T+3 to T+5 (standard Union Registry processing)
  └─ Ticket: SET-BATCH-20260108-EUA-FINAL-OUT

Platform Display (Client X - Next Morning T+1):**

Settlement Batch: SET-BATCH-20260108-SWAP
├─ Status: ✓ CLEARED
├─ Settlement Date: [Today] (T+1)
├─ Trades Included: 1 (TRD-SWAP-2026-001789)
│
├─ CEA OUTBOUND (for payment):
│   ├─ Amount: –173 CEA
│   ├─ Status: ✓ TRANSFER INITIATED to China Registry
│   ├─ Expected Arrival at Counterparty: T+2
│   └─ Current CEA Balance: 26.135 CEA (173 transferred out)
│
├─ EUA INBOUND (swap receipt):
│   ├─ Amount: +20 EUA
│   ├─ Status: ⧖ IN TRANSIT (Union Registry processing)
│   ├─ Expected Arrival at Nihao: T+2
│   ├─ Expected Final Delivery to You: T+3-T+5
│   └─ Current EUA Balance: 0 (awaiting registry confirmation)
│
├─ FEE:
│   ├─ Platform Fee: 0.865 CEA (deducted from your CEA outbound)
│   └─ Included in: 173 CEA transferred
│
└─ Next: You will receive "✓ EUA DELIVERY COMPLETE" email when
          EUA arrives in your Union Registry account (T+5)

Client Email #6: Swap Settlement Initiated

SUBJECT: ✓ Swap Settlement Started - TRD-SWAP-2026-001789

Dear [Client Name],

Your swap has been matched and settlement has been initiated.

SWAP EXECUTION SUMMARY:
├─ Trade ID: TRD-SWAP-2026-001789
├─ Order ID: ORD-SWAP-2026-005678
├─ Execution Time: [Date] 12:42:10 HK
├─ Status: CLEARED (internal settlement complete)
│
├─ YOU PAID: 173 CEA @ 8.65 per EUA
│   ├─ (20 EUA × 8.65 CEA/EUA = 173 CEA)
│   ├─ Platform Fee: 0.865 CEA (0.5%, included above)
│   └─ CEA Deduction Date: [Today] EOD netting
│
├─ YOU RECEIVE: 20 EUA
│   ├─ Status: In transit to your Union Registry
│   ├─ Expected Arrival: T+3-T+5 (registry processing)
│   └─ Will notify when received
│
└─ Swap Counterparty: Client Y (verified via Nihao)

SETTLEMENT TIMELINE:

Today (T+0): Swap matched & confirmed
├─ CEA transfer initiated from your account

Tomorrow (T+1): CEA Outbound Status
├─ CEA transfer at Nihao (~8 hours after EOD)
├─ Transfer sent to China registry overnight batch
├─ Status: ✓ INITIATED

Day 2 (T+2): Registry Processing
├─ China Registry processes CEA inbound to counterparty
├─ Union Registry processes EUA inbound to Nihao
├─ Status: In progress

Days 3-5 (T+3-T+5): Final Delivery
├─ Nihao transfers EUA from EU registry to your Union Registry account
├─ Status: EXPECTED
├─ You will receive "✓ SWAP COMPLETE" email

Day 5+ (T+5): Final Confirmation
├─ EUA confirmed in your Union Registry account
├─ Ready for compliance surrender or holding
├─ Status: ✓ COMPLETE

ACCOUNT UPDATES:

CEA Position:
├─ Before: 200.00 tCO2e
├─ Transferred: –173.00 CEA
├─ Remaining: 26.135 CEA (available for trading)

EUA Position:
├─ Incoming: 20 EUA
├─ Status: In custody at Nihao (pending registry transfer)
├─ Estimated arrival at your registry: T+5

What You Can Do Now:
├─ Use your remaining 26.135 CEA to place new trades
├─ Wait for EUA to arrive in your registry (T+5)
├─ View settlement progress in real-time on platform

Questions? Contact support@nihaogroup.hk

Best regards,
Nihao Settlement Team
```

### 5.5 Final EUA Delivery & Swap Completion

**Timeline:** T+3 to T+5 (Union Registry processing)

**Platform Display (Final – T+5):**

```
Settlement Batch: SET-BATCH-20260108-SWAP
├─ Status: ✓ FULLY SETTLED
├─ Final Settlement Date: [Date] (T+5)
├─ Trades Included: 1 (TRD-SWAP-2026-001789)
│
├─ CEA OUTBOUND:
│   ├─ Amount: –173 CEA (+ 0.865 CEA fee)
│   ├─ Method: China registry transfer
│   ├─ Status: ✓ CONFIRMED (arrived at counterparty T+2)
│   └─ Confirmation Time: [Date] 09:30 HK
│
├─ EUA INBOUND & DELIVERY:
│   ├─ Amount: +20 EUA
│   ├─ Method: Union Registry transfer
│   ├─ Status: ✓ CONFIRMED in your registry account
│   ├─ Confirmation Time: [Date] 10:45 HK
│   └─ Your Union Registry Account: [XX-OPR-YYYY-XXXX]
│
├─ YOUR CURRENT POSITION:
│   ├─ CEA: 26.135 tCO2e (available)
│   ├─ EUA: 20 EUA (confirmed in your registry)
│   └─ EUR: EUR 47,497.55
│
└─ Compliance Status: ✓ READY
    ├─ Your EUA can be used for EU ETS compliance
    ├─ You can surrender EUA to meet obligations
    ├─ Or hold for future compliance periods
    └─ Or trade again in Nihao markets

Client Email #7: ✓ Swap Complete – EUA Delivery Confirmed

SUBJECT: ✓ SWAP COMPLETE - Your EUA is Now in Your Union Registry Account!

Dear [Client Name],

EXCELLENT NEWS! Your swap has been successfully completed.

Your 20 EUA are now confirmed in your Union Registry account!

SWAP COMPLETION SUMMARY:
├─ Trade ID: TRD-SWAP-2026-001789
├─ Completion Date: [Date] (T+5)
├─ Status: ✓ FULLY SETTLED
│
├─ YOU PAID: 173 CEA
├─ YOU RECEIVED: 20 EUA
├─ Swap Rate: 8.65 CEA per EUA
├─ Platform Fee: 0.865 CEA (0.5%)
│
└─ Swap Duration: 5 business days (T+0 to T+5)

EUA DELIVERY CONFIRMED:
├─ Union Registry Account: [XX-OPR-YYYY-XXXX]
├─ EUA Quantity: 20 EUA ✓ CONFIRMED
├─ Received Date: [Date] [Time] HK
├─ Status: READY FOR USE
└─ View in your Union Registry: [Link]

YOUR CURRENT HOLDINGS:
├─ CEA: 26.135 tCO2e (still available in Nihao custody)
├─ EUA: 20 EUA (confirmed in your Union Registry)
├─ EUR: EUR 47,497.55
└─ Total Account Value: ~EUR 48,000 (approximate)

WHAT YOU CAN DO NOW WITH YOUR EUA:

1. SURRENDER FOR EU ETS COMPLIANCE
   ├─ Use the 20 EUA to meet your emissions compliance
   ├─ Surrender by April 30 of your compliance year
   ├─ Filing is your responsibility (we provide support)

2. HOLD FOR FUTURE USE
   ├─ Keep in your registry account indefinitely
   ├─ Use in future compliance periods
   ├─ No time pressure to surrender

3. TRANSFER TO ANOTHER ACCOUNT
   ├─ Transfer to subsidiary or affiliate registry account
   ├─ Transfer to business partner
   ├─ Done via Union Registry directly

4. TRADE AGAIN IN NIHAO MARKETS
   ├─ Sell your EUA for EUR in CEA Market (indirect route)
   ├─ Or swap your remaining 26.135 CEA for more EUA
   ├─ Come back anytime during market hours

REMAINING CEA IN CUSTODY:
├─ You still have 26.135 CEA
├─ Available in your Nihao account
├─ Can place new trades with remaining CEA
├─ Or leave in custody for future

NEXT STEPS:

If you need compliance support:
└─ Contact our compliance team: compliance@nihaogroup.hk

If you want to trade more:
└─ Log in and browse CEA or Swap markets

If you have questions:
└─ Contact support: support@nihaogroup.hk | +852 3062 3366

Thank you for trading with Nihao Carbon Platform!

Best regards,
Nihao Trading Team & Settlement Operations
```

---

## PART 6: SETTLEMENT FAILURE & THREE-LEVEL REMEDIES

### 6.1 Trigger Conditions

Settlement failure occurs when:

- Bank transfer fails (insufficient funds, invalid IBAN, regulatory block, etc.)
- Registry transfer fails (account locked, vintage mismatch, regulatory hold, system error)
- Counterparty defaults (refuses to deliver instruments promised)
- Operational delay (exceeds SLA timeline)

### 6.2 Level 1: Cure Attempt (First 24 Hours)

**Action:** Investigation + reconnection with counterparty

- Nihao operations team investigates root cause (bank, registry, counterparty)
- Contact counterparty to confirm willingness and resolve blockers
- Resubmit transfer instructions if correctable
- Cost to Client: **EUR 0.00**
- Success Rate: **95%** (most delays resolved here)
- Timeline: **Next business day status update**
- Outcome: Settlement completes OR escalate to Level 2

### 6.3 Level 2: Secondary Market Remedy (Days 2–5)

**Action:** Nihao sources replacement instruments from market

- For failed CEA: Nihao buys CEA from market at current ask price
- For failed EUA: Nihao buys EUA from market at current ask price
- Cost to Client: **EUR 0.00** (Nihao absorbs up to 2% premium)
- Nihao Absorption: **Up to 2% market premium** on secondary purchase
- Timeline: **2-3 business days to source and deliver**
- Outcome: Client receives exact quantities promised OR escalate to Level 3

### 6.4 Level 3: Full Refund & Fee Waiver (Day 6+)

**Action:** Full refund of all amounts + waive all fees

- Refund all cash paid for failed trade
- Return all instruments reserved for failed trade
- Waive 100% of all fees charged for that trade
- Cost to Client: **EUR 0.00**
- Nihao Absorption: **100% of all losses**
- Timeline: **Same day processing**
- Outcome: Client account fully restored, transaction unwound

**Three-Level Guarantee:** Client has **ZERO financial loss** from any settlement failure, regardless of reason.

---

## PART 7: COMMUNICATION SUMMARY & TIMINGS

### 7.1 Communication Schedule (Complete Journey)

| Phase | Email # | Trigger | Subject Line | Timeline |
|-------|---------|---------|--------------|----------|
| **Deposit** | 1 | Deposit initiated | Wire transfer details & reference | T+0 (same day) |
| **Deposit** | 2 | Wire received at bank | Deposit received & on AML hold | T+2-T+5 |
| **Deposit** | 3 | AML cleared | Account ready for trading | T+6-T+7 |
| **CEA Market** | 4 | Order placed | CEA buy order confirmed | T+7 (immediate) |
| **CEA Market** | 5 | Order matched (partial) | Trade executed – partial fill | T+7-T+10 |
| **CEA Market** | 6 | EOD settlement complete | CEA & cash settled (T+1) | T+8-T+11 |
| **Swap Market** | 7 | Swap order placed | Swap CEA→EUA confirmed | T+10 (immediate) |
| **Swap Market** | 8 | Swap matched | Swap execution complete – cleared | T+10-T+12 |
| **Swap Market** | 9 | Swap settlement complete | Swap settled at registries (T+5) | T+14-T+16 |
| **Compliance** | 10 | Final delivery | EUA in your Union Registry | T+15+ |

**Total Communications:** 10 emails over 2-3 weeks  
**Average Frequency:** 1 email every 1-2 business days  
**Real-time Status:** 24/7 dashboard updates (no email needed for status checks)

### 7.2 Platform Real-Time Status Displays

Clients see live updates in dashboard:

- **My Account** → EUR balance, CEA holdings, EUA holdings
- **Active Orders** → Buy/sell orders in CEA market with queue position & time to expiry
- **Active Swaps** → Pending swap orders with match probability
- **Trade History** → All executed trades with prices, fees, settlement status
- **Settlement Batches** → Daily EOD batches with internal/external status
- **Notifications** → Real-time alerts for order matches, settlement updates, issues

---

## PART 8: INDUSTRY BENCHMARKS & FINAL TIMELINE

### 8.1 Speed Comparison (Nihao vs. Traditional Markets)

| Component | Traditional | Nihao | Advantage |
|-----------|-------------|-------|-----------|
| **CEA Purchase Browse** | 3-5 days (manual) | Real-time instant | 100% faster |
| **CEA Order Execution** | 1-2 hours (phone) | <5 minutes automated | 90% faster |
| **CEA Settlement** | 3-5 days | 2-3 days (T+1-T+2) | 30% faster |
| **Swap Rate Discovery** | 1-2 days (calls) | Real-time (CLOB) | 95% faster |
| **Swap Execution** | 2-4 hours (negotiation) | <5 minutes automated | 98% faster |
| **Swap Settlement** | 4-7 days | 3-5 days (T+1-T+5) | 25% faster |
| **TOTAL CYCLE** | 15-25 days | 10-15 days | **25% faster** |

### 8.2 Pricing & Risk Comparison

| Factor | Traditional | Nihao |
|--------|-------------|-------|
| **Counterparty Risk** | HIGH (unvetted sellers) | LOW (Nihao CCP guarantee) |
| **Bid-Ask Spread** | 1-3% (wide) | 0.5-1% (tight CLOB) |
| **Price Transparency** | Opaque (phone quotes) | Full transparency (live depth) |
| **Execution Certainty** | Uncertain (negotiation) | Certain (automatic matching) |
| **Settlement Guarantee** | No guarantee | 3-level remedies (100% guarantee) |
| **Audit Trail** | Manual logging | Automated tickets (7-year retention) |

---

## FINAL WORKFLOW TIMELINE

```
DEPOSIT PHASE:
├─ T+0: Client initiates wire
├─ T+2-T+5: Wire arrives at Nihao bank
├─ T+3-T+7: AML hold + clearing
└─ T+7: Account ready for trading

CEA MARKET (FIRST ORDER):
├─ T+7: Client places CEA buy order
├─ T+7: Order matches (if volume available)
├─ T+7: Trade executed (TRD-CASH ticket generated)
├─ T+8-T+11: CEA in custody, cash settled (EOD batch T+1)
└─ T+12: CEA confirmed ready to trade/swap

SWAP MARKET (FIRST SWAP):
├─ T+12: Client places swap order (buy EUA for CEA)
├─ T+12: Order matches (if volume available)
├─ T+12: Swap executed (TRD-SWAP ticket generated)
├─ T+13: EOD netting, registry transfers initiated
├─ T+13-T+14: CEA outbound to counterparty (China registry)
├─ T+14-T+15: EUA inbound from counterparty (Union registry)
├─ T+15-T+20: Final delivery EUA to client's Union Registry
└─ T+20+: EUA confirmed ready for compliance use

TOTAL END-TO-END: 10–20 business days (2–4 weeks)
```

---

## VERSION 3.0 FINAL STATUS

✓ **Piazza centralizată (CLOB)** con order book bid/ask  
✓ **Nihao come CCP** (controparte per tutti i trade)  
✓ **Client Money Account** (no escrow, daily netting)  
✓ **Due mercati operativi** simultaneamente (CEA-cash e EUA-CEA)  
✓ **Ticketing completo** con audit trail (DEP, ORD, MOD, CXL, TRD, SET)  
✓ **Price-time priority** matching (FIFO)  
✓ **Three-level settlement failure remedies** (Level 1-3)  
✓ **Daily EOD batch processing** con netting  
✓ **10 comunicazioni ai clienti** distribuite su 2-3 settimane  
✓ **25% più veloce** rispetto ai mercati tradizionali  

---

**END OF NIHAO OPERATIONAL WORKFLOW GUIDE v3.0**

Ready for legal review and diagram generation.