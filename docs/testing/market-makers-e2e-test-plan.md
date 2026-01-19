# Market Makers System - End-to-End Test Plan

**Date:** 2026-01-19
**Version:** 1.0
**Status:** Ready for Execution

## Overview

This document provides a comprehensive test plan for the Market Makers system with audit logging. Follow each test case in sequence to verify the complete implementation.

## Prerequisites

### Environment Setup
```bash
# 1. Ensure you're in the correct worktree
cd /Users/victorsafta/work/Niha/.worktrees/market-makers-system

# 2. Start Docker services (if not already running)
docker-compose up -d

# 3. Apply database migration
cd backend
alembic upgrade head

# 4. Verify services are running
docker-compose ps
# Expected: backend (port 8000), frontend (port 5173), db (port 5432), redis (port 6379)
```

### Test User Credentials
```
Admin User:
  Email: admin@nihaogroup.com
  Password: admin123 (or check SEED_ADMIN_PASSWORD in .env)
```

## Test Cases

---

### Test Case 1: Database Migration Verification

**Objective:** Verify all new tables and columns exist

**Steps:**
```bash
# Connect to database
docker-compose exec db psql -U niha_user -d niha_carbon

# Check new tables exist
\dt market_maker_clients
\dt asset_transactions
\dt ticket_logs

# Check modified tables
\d orders  # Should have market_maker_id and ticket_id columns
\d cash_market_trades  # Should have market_maker_id and ticket_id columns

# Check enums
\dT+ usertype  # Should include MARKET_MAKER
\dT+ transactiontype  # Should include TRADE_DEBIT, TRADE_CREDIT
\dT+ ticketstatus  # Should include SUCCESS, FAILED
```

**Expected Results:**
- ✅ All 3 new tables exist
- ✅ Orders table has new columns: market_maker_id, ticket_id
- ✅ CashMarketTrades table has new columns: market_maker_id, ticket_id
- ✅ All new enum values present

---

### Test Case 2: Backend API - Health Check

**Objective:** Verify backend services are responding

**Steps:**
```bash
# Test backend health
curl http://localhost:8000/

# Test admin authentication
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nihaogroup.com",
    "password": "admin123"
  }'

# Save the access_token from response for subsequent tests
export TOKEN="<access_token_from_response>"
```

**Expected Results:**
- ✅ Backend responds with 200
- ✅ Login returns access_token and user object with role=ADMIN

---

### Test Case 3: Market Makers API - Create MM

**Objective:** Create a new market maker via API

**Steps:**
```bash
# Create market maker with initial balances
curl -X POST http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MM-Test-Alpha",
    "email": "mm-alpha@test.com",
    "description": "Test market maker",
    "initial_balances": {
      "CEA": 10000,
      "EUA": 5000
    }
  }'

# Save the market_maker ID and ticket_id from response
export MM_ID="<id_from_response>"
export CREATE_TICKET="<ticket_id_from_response>"

# Verify market maker was created
curl -X GET http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ Response includes market_maker object with:
  - `id`, `user_id`, `name`, `email`, `is_active=true`
  - `current_balances.CEA.total = 10000`
  - `current_balances.EUA.total = 5000`
- ✅ Response includes `ticket_id` (format: TKT-2026-NNNNNN)
- ✅ GET request shows the new MM in the list

---

### Test Case 4: Market Makers API - View Balances

**Objective:** Verify balance calculation from transactions

**Steps:**
```bash
# Get balances
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"

# Get transaction history
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ Balances show:
  - `CEA: {available: 10000, locked: 0, total: 10000}`
  - `EUA: {available: 5000, locked: 0, total: 5000}`
- ✅ Transactions show 2 DEPOSIT entries (one for CEA, one for EUA)
- ✅ Each transaction has `ticket_id` and `balance_after`

---

### Test Case 5: Market Makers API - Add/Withdraw Assets

**Objective:** Test transaction-based asset management

**Steps:**
```bash
# Add more CEA certificates
curl -X POST http://localhost:8000/api/v1/admin/market-makers/$MM_ID/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_type": "CEA",
    "transaction_type": "DEPOSIT",
    "amount": 5000,
    "notes": "Additional funding"
  }'

# Verify new balance
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"

# Attempt withdrawal
curl -X POST http://localhost:8000/api/v1/admin/market-makers/$MM_ID/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_type": "CEA",
    "transaction_type": "WITHDRAWAL",
    "amount": 2000,
    "notes": "Test withdrawal"
  }'

# Verify final balance
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ After deposit: CEA total = 15000
- ✅ After withdrawal: CEA total = 13000
- ✅ Each operation returns a `ticket_id`
- ✅ Transaction history shows running balance correctly

---

### Test Case 6: Market Orders API - Place Order

**Objective:** Admin places sell order for MM with asset locking

**Steps:**
```bash
# Get current order book for reference
curl -X GET "http://localhost:8000/api/v1/admin/market-orders/orderbook/CEA" \
  -H "Authorization: Bearer $TOKEN"

# Place sell order
curl -X POST http://localhost:8000/api/v1/admin/market-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "'$MM_ID'",
    "certificate_type": "CEA",
    "side": "SELL",
    "price": 25.50,
    "quantity": 1000
  }'

# Save order_id and ticket_id from response
export ORDER_ID="<order_id_from_response>"
export ORDER_TICKET="<ticket_id_from_response>"

# Verify balances reflect locked assets
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"

# Verify order appears in public cash market
curl -X GET "http://localhost:8000/api/v1/cash-market/order-book?certificate_type=CEA"
```

**Expected Results:**
- ✅ Order created successfully with status=PENDING
- ✅ Response includes `ticket_id`
- ✅ Balances now show:
  - `CEA: {available: 12000, locked: 1000, total: 13000}`
- ✅ Order appears in public order book as a sell order
- ✅ Transaction history shows TRADE_DEBIT entry

---

### Test Case 7: Market Orders API - Cancel Order

**Objective:** Cancel order and verify asset release

**Steps:**
```bash
# Cancel the order
curl -X DELETE http://localhost:8000/api/v1/admin/market-orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"

# Verify balances - assets should be released
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"

# Verify transaction history
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ Cancel operation returns success with `ticket_id`
- ✅ Balances now show:
  - `CEA: {available: 13000, locked: 0, total: 13000}`
- ✅ Transaction history shows TRADE_CREDIT entry (releasing locked assets)
- ✅ Order status changed to CANCELLED in order book

---

### Test Case 8: Logging API - View Tickets

**Objective:** Verify comprehensive audit trail

**Steps:**
```bash
# Get all tickets
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Get specific ticket by ID
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets/$CREATE_TICKET" \
  -H "Authorization: Bearer $TOKEN"

# Get MM-specific actions
curl -X GET "http://localhost:8000/api/v1/admin/logging/market-maker-actions" \
  -H "Authorization: Bearer $TOKEN"

# Get statistics
curl -X GET "http://localhost:8000/api/v1/admin/logging/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ All tickets endpoint returns tickets for MM creation, deposits, withdrawals, order placement, order cancellation
- ✅ Each ticket includes: ticket_id, action_type, entity_type, status, timestamps
- ✅ Specific ticket shows full details including request_payload and after_state
- ✅ MM actions filtered to only show market_maker_id IS NOT NULL
- ✅ Stats show total_actions, success_count, by_action_type breakdown

---

### Test Case 9: Frontend - Market Makers Tab

**Objective:** Test MM management UI

**Steps:**
1. Open browser to http://localhost:5173
2. Login with admin credentials
3. Navigate to Backoffice → Click "Market Makers" card
4. Verify MM list displays with:
   - MM-Test-Alpha row
   - CEA balance: 13,000 (available: 13,000, locked: 0)
   - EUA balance: 5,000 (available: 5,000, locked: 0)
5. Click on MM row to view details
6. View transaction history
7. Click "Add Transaction" → Add deposit of 1000 EUA
8. Verify balance updates immediately

**Expected Results:**
- ✅ MM appears in list with correct balances
- ✅ Transaction history shows all operations chronologically
- ✅ Running balance is correct after each transaction
- ✅ Add transaction modal works and updates data immediately
- ✅ Status badge shows "Active"
- ✅ Ticket IDs displayed for each action

---

### Test Case 10: Frontend - Market Orders Tab

**Objective:** Test order placement UI

**Steps:**
1. Navigate to Backoffice → Click "Market Orders" card
2. Verify left side shows order book (CEA)
3. Select "MM-Test-Alpha" from dropdown
4. Verify balance display shows: CEA Available: 13,000
5. Enter order details:
   - Price: 26.00
   - Quantity: 500
6. Click "Place Sell Order"
7. Verify success message with ticket ID
8. Verify order appears in Orders List below
9. Verify balance updates to show locked amount
10. Click "Cancel" on the order
11. Verify balance released

**Expected Results:**
- ✅ Order book displays current market depth
- ✅ MM dropdown populated with active MMs
- ✅ Balance check prevents over-selling
- ✅ Order placement succeeds and shows ticket ID
- ✅ Order appears in list immediately
- ✅ Balances update in real-time (available ↓, locked ↑)
- ✅ Cancellation works and releases assets
- ✅ Auto-refresh updates order book every 5 seconds

---

### Test Case 11: Frontend - Logging Tab

**Objective:** Test audit trail UI

**Steps:**
1. Navigate to Backoffice → Click "Audit Logging" card
2. **Overview Tab:**
   - Verify metrics cards show counts
   - Verify charts display action types and users
3. **All Tickets Tab:**
   - Apply filters (status, action type)
   - Search by ticket ID
   - Click row to view details modal
4. **MM Actions Tab:**
   - Verify only MM-related actions shown
   - Verify purple highlighting
5. **Failed Actions Tab:**
   - Verify only failed actions (if any)
   - Verify red highlighting
6. **Search Tab:**
   - Use advanced search with entity type
   - Verify results table

**Expected Results:**
- ✅ Overview shows accurate statistics
- ✅ Charts display data correctly
- ✅ All Tickets filterable and paginated
- ✅ Ticket detail modal shows complete information (payloads, states)
- ✅ MM Actions pre-filtered correctly
- ✅ Failed Actions highlighted in red
- ✅ Search works with multiple criteria
- ✅ Auto-refresh updates every 10 seconds

---

### Test Case 12: Integration - Order Matching

**Objective:** Verify MM orders match with regular user orders

**Setup:**
1. Create a regular user account (or use existing)
2. Fund the user with sufficient balance
3. Place MM sell order at specific price

**Steps:**
```bash
# 1. Admin places MM sell order (already tested above)
# Order: SELL 500 CEA @ 26.00

# 2. User places matching BUY order
curl -X POST http://localhost:8000/api/v1/cash-market/orders \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_type": "CEA",
    "side": "BUY",
    "order_type": "LIMIT",
    "price": 26.00,
    "quantity": 500
  }'

# 3. Verify trade executed
curl -X GET http://localhost:8000/api/v1/cash-market/my-trades \
  -H "Authorization: Bearer $USER_TOKEN"

# 4. Verify MM balances updated
curl -X GET http://localhost:8000/api/v1/admin/market-makers/$MM_ID/balances \
  -H "Authorization: Bearer $TOKEN"

# 5. Check audit log for trade execution
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?action_type=MM_TRADE_EXECUTED" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Results:**
- ✅ Trade executes immediately (FIFO matching)
- ✅ Both orders show status=FILLED
- ✅ CashMarketTrade created with both buyer and seller
- ✅ MM balance decremented by 500 CEA
- ✅ User balance incremented by 500 CEA
- ✅ Audit log shows MM_TRADE_EXECUTED ticket
- ✅ Related ticket IDs link order placement to trade

---

## Performance & Edge Cases

### Performance Test: Logging Overhead

**Objective:** Verify logging doesn't impact performance

**Steps:**
```bash
# Time a request without heavy load
time curl -X GET http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN"

# Expected: Response time < 200ms
```

**Expected Results:**
- ✅ API response time remains under 200ms
- ✅ No noticeable slowdown in frontend
- ✅ Database queries remain efficient

---

### Edge Case Test: Insufficient Balance

**Objective:** Verify balance validation

**Steps:**
```bash
# Attempt to place order exceeding available balance
curl -X POST http://localhost:8000/api/v1/admin/market-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "'$MM_ID'",
    "certificate_type": "CEA",
    "side": "SELL",
    "price": 25.50,
    "quantity": 99999
  }'
```

**Expected Results:**
- ✅ API returns 400 error
- ✅ Error message: "Insufficient available balance"
- ✅ No order created
- ✅ Balances unchanged

---

### Edge Case Test: Inactive Market Maker

**Objective:** Verify inactive MM validation

**Steps:**
```bash
# Deactivate MM
curl -X PUT http://localhost:8000/api/v1/admin/market-makers/$MM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'

# Attempt to place order for inactive MM
curl -X POST http://localhost:8000/api/v1/admin/market-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "'$MM_ID'",
    "certificate_type": "CEA",
    "side": "SELL",
    "price": 25.50,
    "quantity": 100
  }'
```

**Expected Results:**
- ✅ API returns 400 error
- ✅ Error message: "Market Maker is not active"
- ✅ No order created

---

### Edge Case Test: BUY Order Attempt

**Objective:** Verify SELL-only enforcement

**Steps:**
```bash
# Attempt to place BUY order (should fail)
curl -X POST http://localhost:8000/api/v1/admin/market-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "'$MM_ID'",
    "certificate_type": "CEA",
    "side": "BUY",
    "price": 25.50,
    "quantity": 100
  }'
```

**Expected Results:**
- ✅ API returns 400 error
- ✅ Error message: "Only SELL orders allowed for Market Makers"
- ✅ No order created

---

## Final Verification Checklist

### Database
- [ ] All 3 new tables exist and populated
- [ ] Modified tables have new columns
- [ ] Foreign key constraints working
- [ ] Enums include all new values

### Backend API
- [ ] All 17 new endpoints respond correctly
- [ ] Authentication/authorization enforced
- [ ] Ticket IDs generated uniquely
- [ ] Asset locking/unlocking works
- [ ] Balance calculations accurate
- [ ] Transaction history complete

### Frontend
- [ ] All 3 new pages load without errors
- [ ] Navigation links work
- [ ] Market Makers tab fully functional
- [ ] Market Orders tab fully functional
- [ ] Logging tab fully functional
- [ ] Modals open/close correctly
- [ ] Forms validate input
- [ ] Real-time updates work
- [ ] Error messages display properly

### Integration
- [ ] MM orders appear in public cash market
- [ ] Orders match with regular users
- [ ] Audit trail captures everything
- [ ] Ticket IDs link related actions
- [ ] Performance acceptable (<50ms overhead)

### Security
- [ ] Only admins can access MM endpoints
- [ ] Market Makers cannot login to UI
- [ ] Balance validation prevents overselling
- [ ] Soft delete preserves audit trail

---

## Test Results Summary

**Date Executed:** _______________
**Executed By:** _______________

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Database Migration | ⬜ Pass / ⬜ Fail | |
| TC2: Backend Health | ⬜ Pass / ⬜ Fail | |
| TC3: Create MM | ⬜ Pass / ⬜ Fail | |
| TC4: View Balances | ⬜ Pass / ⬜ Fail | |
| TC5: Add/Withdraw Assets | ⬜ Pass / ⬜ Fail | |
| TC6: Place Order | ⬜ Pass / ⬜ Fail | |
| TC7: Cancel Order | ⬜ Pass / ⬜ Fail | |
| TC8: View Tickets | ⬜ Pass / ⬜ Fail | |
| TC9: MM Tab Frontend | ⬜ Pass / ⬜ Fail | |
| TC10: Orders Tab Frontend | ⬜ Pass / ⬜ Fail | |
| TC11: Logging Tab Frontend | ⬜ Pass / ⬜ Fail | |
| TC12: Order Matching | ⬜ Pass / ⬜ Fail | |
| Performance Test | ⬜ Pass / ⬜ Fail | |
| Edge Cases | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ All Pass / ⬜ Some Failures

**Issues Found:**
_________________________________
_________________________________
_________________________________

**Sign-off:** ___________________ (Date: ___________)
