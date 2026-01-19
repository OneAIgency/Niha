# Market Makers System with Comprehensive Audit Logging

**Date:** 2026-01-19
**Status:** Approved for Implementation
**Type:** New Feature

## Overview

Implement a Market Maker system where admin-controlled clients can place sell orders in the cash market. Includes comprehensive audit logging with ticketing for all system actions (market makers and regular users treated uniformly).

## Key Requirements

1. **Market Makers are Users with special role** - reuse existing authentication/permission infrastructure
2. **Admin-controlled** - Not AI agents; admin manually places orders on their behalf
3. **Transaction-based asset management** - All balance changes tracked as transactions
4. **Comprehensive audit trail** - Every action logged with unique ticket ID
5. **Backoffice UI** - 3 new tabs: Market Makers, Market Orders, Logging

## Architecture Components

### 1. Database Models

#### New Tables

**MarketMakerClient**
```sql
market_maker_clients:
  - id (UUID, PK)
  - user_id (UUID, FK → users.id, UNIQUE)
  - name (VARCHAR) - Display name (ex: "MM-Alpha")
  - description (TEXT) - Admin notes
  - is_active (BOOLEAN) - Can place orders?
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - created_by (UUID, FK → users.id) - Which admin created
```

**AssetTransaction**
```sql
asset_transactions:
  - id (UUID, PK)
  - ticket_id (VARCHAR(30), FK → ticket_logs.ticket_id)
  - market_maker_id (UUID, FK → market_maker_clients.id)
  - certificate_type (ENUM: CEA, EUA)
  - transaction_type (ENUM: DEPOSIT, WITHDRAWAL, TRADE_DEBIT, TRADE_CREDIT)
  - amount (NUMERIC) - Positive for deposits/credits, negative for withdrawals/debits
  - balance_after (NUMERIC) - Running balance
  - notes (TEXT)
  - created_by (UUID, FK → users.id) - Which admin
  - created_at (TIMESTAMP)
```

**TicketLog**
```sql
ticket_logs:
  - id (UUID, PK)
  - ticket_id (VARCHAR(30), UNIQUE) - Format: TKT-2026-001234
  - timestamp (TIMESTAMP)
  - user_id (UUID, FK → users.id, nullable)
  - market_maker_id (UUID, FK → market_maker_clients.id, nullable)
  - action_type (VARCHAR) - ORDER_PLACED, TRADE_EXECUTED, ASSET_MODIFIED, etc.
  - entity_type (VARCHAR) - Order, Trade, User, MarketMaker, etc.
  - entity_id (UUID) - ID of affected entity
  - status (ENUM: SUCCESS, FAILED)
  - request_payload (JSONB) - Full request data
  - response_data (JSONB) - Full response
  - ip_address (VARCHAR)
  - user_agent (VARCHAR)
  - session_id (UUID, FK → user_sessions.id, nullable)
  - before_state (JSONB, nullable) - State before modification
  - after_state (JSONB, nullable) - State after modification
  - related_ticket_ids (ARRAY of VARCHAR) - Cascade actions
  - tags (ARRAY of VARCHAR) - For filtering
```

#### Modified Tables

**Users** - Add enum value:
```python
UserRole.MARKET_MAKER
```

**Orders** - Add columns:
```sql
- market_maker_id (UUID, FK → market_maker_clients.id, nullable)
- ticket_id (VARCHAR(30), FK → ticket_logs.ticket_id)
```

**CashMarketTrades** - Add columns:
```sql
- market_maker_id (UUID, FK → market_maker_clients.id, nullable)
- ticket_id (VARCHAR(30), FK → ticket_logs.ticket_id)
```

### 2. API Endpoints

#### Market Makers Management

**GET /api/v1/admin/market-makers**
- List all market makers with balances
- Returns: id, name, description, is_active, current_balances, stats

**POST /api/v1/admin/market-makers**
- Create new market maker
- Auto-creates User with MARKET_MAKER role
- Request: name, description, email, initial_balances (optional)
- Returns: MarketMakerResponse + ticket_id

**PUT /api/v1/admin/market-makers/{id}**
- Update market maker details
- Request: name, description, is_active
- Returns: MarketMakerResponse + ticket_id

**DELETE /api/v1/admin/market-makers/{id}**
- Soft delete (set is_active = false)
- Returns: success + ticket_id

#### Asset Transactions

**GET /api/v1/admin/market-makers/{id}/transactions**
- List transaction history for MM
- Query: certificate_type?, limit?, offset?
- Returns: List of transactions with running balances

**POST /api/v1/admin/market-makers/{id}/transactions**
- Create deposit/withdrawal transaction
- Request: certificate_type, transaction_type, amount, notes
- Returns: Transaction + new balance + ticket_id

**GET /api/v1/admin/market-makers/{id}/balances**
- Get current balances (available + locked)
- Returns: {CEA: {available, locked_in_orders, total}, ...}

#### Market Orders (Admin-placed)

**GET /api/v1/admin/market-orders/orderbook**
- Replica of cash market order book
- Query: certificate_type
- Returns: Full order book (same as public endpoint)

**POST /api/v1/admin/market-orders**
- Admin places order on behalf of MM
- Request: market_maker_id, certificate_type, side (SELL only), order_type, price, quantity
- Validates: MM exists, is_active, sufficient balance
- Creates: Order + locks assets (TRADE_DEBIT) + ticket
- Returns: OrderResponse + ticket_id

**GET /api/v1/admin/market-orders**
- List all MM orders
- Query: market_maker_id?, status?, limit?, offset?
- Returns: List of orders

**DELETE /api/v1/admin/market-orders/{order_id}**
- Cancel MM order
- Releases locked assets (TRADE_CREDIT)
- Returns: success + ticket_id

#### Logging/Audit Trail

**GET /api/v1/admin/logging/tickets**
- List all audit tickets with filtering
- Query: date_from, date_to, action_type[], user_id, market_maker_id, status, entity_type, entity_id, search, tags[], limit, offset
- Returns: {total, tickets: List[TicketLogResponse]}

**GET /api/v1/admin/logging/tickets/{ticket_id}**
- Get full ticket details
- Returns: Complete TicketLogResponse

**GET /api/v1/admin/logging/stats**
- Dashboard statistics
- Query: date_from?, date_to?
- Returns: total_actions, success/failed counts, by_action_type, by_user, actions_over_time

**GET /api/v1/admin/logging/market-maker-actions**
- Pre-filtered: market_maker_id IS NOT NULL
- Same interface as /tickets

**GET /api/v1/admin/logging/failed-actions**
- Pre-filtered: status = FAILED
- Same interface as /tickets

### 3. Backend Services

**TicketService** (new)
```python
- generate_ticket_id() → str  # TKT-2026-001234
- create_ticket(...) → TicketLog
- get_current_state(entity_type, entity_id) → dict
- link_related_tickets(parent_id, child_ids)
```

**MarketMakerService** (new)
```python
- create_market_maker(data, admin_user) → MarketMakerClient + ticket
- get_balances(mm_id) → dict with available/locked/total
- create_transaction(mm_id, type, amount, ...) → Transaction + ticket
- validate_sufficient_balance(mm_id, cert_type, amount) → bool
```

**Logging Middleware** (new)
```python
- Intercepts all API requests
- Creates ticket for configured action types
- Captures: request payload, response, IP, session, before/after state
- Async ticket creation (non-blocking)
```

### 4. Frontend Components

#### Backoffice Tabs (new)

**Tab: Market Makers**
- List all market makers (table)
- Create new MM button → modal
- Edit MM → modal (name, description, active toggle)
- View balances per MM
- Asset transactions section:
  - Transaction history table per MM
  - "Add Transaction" button → modal (deposit/withdrawal)
  - Shows running balance after each transaction

**Tab: Market Orders**
- Left side: Replica order book (real-time, same as CashMarketPage)
- Right side: Order entry form (standalone, persistent)
  - Dropdown: Select Market Maker
  - Input: Certificate Type, Price, Quantity
  - Button: "Place Sell Order"
  - Order history table below (MM orders only)

**Tab: Logging**
Sub-tabs:
1. **Overview**
   - Metrics cards: total actions, success rate, failed count
   - Charts: actions over time, top action types

2. **All Tickets**
   - Filterable table: date range, action type, user, MM, status
   - Search by ticket ID
   - Click row → modal with full details
   - Export CSV

3. **Market Maker Actions**
   - Same as All Tickets, pre-filtered for MM actions

4. **Failed Actions**
   - Same as All Tickets, pre-filtered for failures
   - Highlighted in red for visibility

5. **Search**
   - Advanced search form
   - Multiple criteria: entity type, entity ID, tags, text search
   - Results table

### 5. Logging System Details

**Actions to be logged:**

- **Market Maker actions:**
  - MM_CREATED, MM_UPDATED, MM_DELETED
  - ASSET_DEPOSIT, ASSET_WITHDRAWAL
  - MM_ORDER_PLACED, MM_ORDER_CANCELLED
  - MM_TRADE_EXECUTED

- **User actions:**
  - USER_LOGIN, USER_LOGOUT, USER_LOGIN_FAILED
  - USER_CREATED, USER_UPDATED, USER_DELETED
  - KYC_UPLOADED, KYC_APPROVED, KYC_REJECTED
  - DEPOSIT_APPROVED, DEPOSIT_REJECTED

- **Order/Trade actions:**
  - ORDER_PLACED, ORDER_CANCELLED, ORDER_FILLED
  - TRADE_EXECUTED, TRADE_SETTLED

- **Admin actions:**
  - ENTITY_MODIFIED, CERTIFICATE_MODIFIED
  - SETTINGS_CHANGED, PRICE_UPDATED

**Ticket ID Format:**
```
TKT-YYYY-NNNNNN
Example: TKT-2026-001234

Counter: per-year, zero-padded 6 digits
Stored in: Redis (fast increment) + DB backup
```

**Middleware Logic:**
```python
@app.middleware("http")
async def logging_middleware(request, call_next):
    # Capture request start
    ticket_id = generate_ticket_id()
    start_time = time.time()

    # Get before state for PUT/DELETE
    before_state = None
    if request.method in ["PUT", "DELETE"]:
        before_state = get_current_state(...)

    # Execute request
    response = await call_next(request)

    # Get after state for POST/PUT
    after_state = None
    if request.method in ["POST", "PUT"]:
        after_state = get_current_state(...)

    # Create ticket (async, non-blocking)
    await create_ticket(
        ticket_id=ticket_id,
        action_type=infer_action_type(request.url, request.method),
        request_payload=await request.json(),
        response_data=response.body,
        before_state=before_state,
        after_state=after_state,
        ...
    )

    # Add ticket_id to response headers
    response.headers["X-Ticket-ID"] = ticket_id

    return response
```

## Data Flow Examples

### Example 1: Admin creates Market Maker

1. Admin clicks "Create Market Maker" in backoffice
2. Fills form: name="MM-Alpha", email="mm-alpha@internal.com", initial_balances={CEA: 10000}
3. POST /api/v1/admin/market-makers
4. Backend:
   - Generates ticket_id: TKT-2026-001234
   - Creates User (role=MARKET_MAKER, email, auto-generated password)
   - Creates MarketMakerClient (links to user_id)
   - If initial_balances provided:
     - Creates DEPOSIT transaction (amount=10000, balance_after=10000)
     - Links transaction to ticket
   - Creates TicketLog entry (action=MM_CREATED, status=SUCCESS)
   - Returns: MM data + ticket_id
5. Frontend shows success + ticket_id

### Example 2: Admin places sell order for MM

1. Admin in "Market Orders" tab
2. Selects "MM-Alpha" from dropdown
3. Enters: CEA, price=25.50, quantity=100
4. Clicks "Place Sell Order"
5. POST /api/v1/admin/market-orders
6. Backend:
   - Validates: MM exists, is_active=true
   - Checks balance: MM-Alpha has 10000 CEA available
   - Generates ticket_id: TKT-2026-001235
   - Locks assets:
     - Creates TRADE_DEBIT transaction (-100 CEA)
     - Updates balance: available=9900, locked=100
   - Creates Order (market_maker_id=MM-Alpha.id, ticket_id=TKT-2026-001235)
   - Creates TicketLog (action=MM_ORDER_PLACED, status=SUCCESS)
   - Order appears in public cash market
   - Returns: Order + ticket_id
7. Frontend shows order in table + ticket_id

### Example 3: MM order gets matched

1. Regular user places BUY order matching MM's sell
2. Matching engine executes trade
3. Backend:
   - Generates ticket_id: TKT-2026-001236
   - Creates CashMarketTrade (links buyer + MM seller)
   - Updates order statuses (FILLED)
   - For MM:
     - Creates TRADE_CREDIT transaction (releases locked 100 CEA)
     - Balance now: available=9900, locked=0
     - Net effect: -100 CEA sold
   - Creates TicketLog (action=MM_TRADE_EXECUTED, related_tickets=[TKT-2026-001235])
   - Links trade ticket to original order ticket
4. Trade appears in MM's transaction history

## Security & Permissions

- All Market Maker endpoints require `role=ADMIN`
- Logging endpoints require `role=ADMIN`
- Market Makers (role=MARKET_MAKER) cannot login to UI
- Only admins can create/modify MMs
- Only admins can place orders on behalf of MMs
- Ticket IDs are exposed in API responses for traceability

## Testing Strategy

1. **Unit tests:**
   - TicketService: ID generation, uniqueness
   - MarketMakerService: balance calculations, transaction logic
   - Asset locking/unlocking on order placement/cancellation

2. **Integration tests:**
   - Full flow: create MM → deposit assets → place order → cancel → check balances
   - Trade execution with MM as seller
   - Logging middleware: verify tickets created for all actions

3. **E2E tests:**
   - Admin UI: create MM, add assets, place orders
   - Verify orders appear in public cash market
   - Verify audit trail captures all actions

## Implementation Phases

**Phase 1: Database & Models**
- Create migrations for new tables
- Add enum values to existing tables
- Create SQLAlchemy models

**Phase 2: Backend Services**
- TicketService implementation
- MarketMakerService implementation
- Logging middleware

**Phase 3: API Endpoints**
- Market Makers CRUD
- Asset transactions
- Market orders (admin)
- Logging endpoints

**Phase 4: Frontend Components**
- Market Makers tab (list, create, edit, transactions)
- Market Orders tab (order book replica + form)
- Logging tab (multi-view with tabs)

**Phase 5: Integration & Testing**
- Connect frontend to backend
- End-to-end testing
- Performance testing (logging overhead)

**Phase 6: Documentation**
- API documentation
- Admin user guide
- Audit log retention policy

## Success Criteria

✅ Admin can create/edit market makers in backoffice
✅ Admin can deposit/withdraw assets (transaction-based)
✅ Admin can place sell orders on behalf of MMs
✅ MM orders appear in public cash market
✅ Orders are matched normally by FIFO engine
✅ Asset balances update correctly (available/locked)
✅ Every action generates unique ticket ID
✅ Comprehensive audit trail accessible in Logging tab
✅ Failed actions are captured with error details
✅ Performance impact of logging < 50ms per request

## Future Enhancements (Out of Scope)

- AI-driven market maker strategies
- Automated order placement based on market conditions
- Risk management alerts
- Advanced analytics dashboard
- Audit log export to external systems (Splunk, etc.)
- Compliance reporting (MIFID II, etc.)
