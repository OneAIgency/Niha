# Market Makers System Completion and Verification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify the Market Makers system through comprehensive E2E testing, document results, and prepare for branch completion.

**Architecture:** Execute the existing E2E test plan, verify all checklist items, document findings, and use finishing-a-development-branch skill.

**Tech Stack:** Docker, PostgreSQL, FastAPI, React, Manual UI testing

---

## Phase 1: Pre-Verification Setup

### Task 1: Verify Environment is Ready

**Files:**
- Check: Docker services status
- Check: Database migrations applied
- Check: All containers healthy

**Step 1: Check Docker services**

Run: `docker-compose ps`
Expected: All 4 services (backend, frontend, db, redis) showing "Up" status

**Step 2: Check backend logs for startup errors**

Run: `docker-compose logs backend --tail 50`
Expected: "Application startup complete" message, no errors

**Step 3: Check frontend logs**

Run: `docker-compose logs frontend --tail 20`
Expected: "VITE ready" message, no ECONNREFUSED errors

**Step 4: Verify you can access the application**

Open: http://localhost:5173
Expected: Login page loads successfully

**Step 5: Commit any pending changes**

```bash
git status
# If clean, proceed. If not, commit changes first.
```

---

## Phase 2: Database Verification

### Task 2: Verify database schema

**Files:**
- Database tables and constraints

**Step 1: Connect to database**

Run:
```bash
docker-compose exec db psql -U niha_user -d niha_carbon
```

**Step 2: Check tickets table exists**

```sql
\d tickets
```

Expected: Table with columns: id, entity_id, client_id, user_id, action_type, action_data, notes, created_at, updated_at

**Step 3: Check ticket_id_counter exists**

```sql
SELECT * FROM ticket_id_counter;
```

Expected: Single row with current_id value

**Step 4: Check MARKET_MAKER role exists**

```sql
SELECT enum_range(NULL::userrole);
```

Expected: List includes 'MARKET_MAKER'

**Step 5: Exit database**

```sql
\q
```

---

## Phase 3: Backend API Testing

### Task 3: Test Market Maker CRUD endpoints

**Files:**
- Backend API at http://localhost:8000

**Step 1: Login as admin to get JWT token**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nihaogroup.com", "password": "Admin123!"}' \
  | jq -r '.access_token'
```

Expected: JWT token returned
Save token: `export TOKEN="<paste_token_here>"`

**Step 2: Create a Market Maker**

```bash
curl -X POST http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MM-Test-Alpha",
    "legal_name": "Test Market Maker Alpha LLC",
    "email": "mm-test-alpha@internal.com"
  }'
```

Expected: 200 response with new MM details
Save MM ID: Note the "id" field from response

**Step 3: List all Market Makers**

```bash
curl -X GET http://localhost:8000/api/v1/admin/market-makers \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Array containing MM-Test-Alpha

**Step 4: Get specific Market Maker**

```bash
curl -X GET http://localhost:8000/api/v1/admin/market-makers/<MM_ID> \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Details of MM-Test-Alpha

**Step 5: Update Market Maker**

```bash
curl -X PUT http://localhost:8000/api/v1/admin/market-makers/<MM_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MM-Test-Alpha-Updated",
    "is_active": true
  }'
```

Expected: 200 response with updated name

---

### Task 4: Test Asset Management endpoints

**Files:**
- Backend asset endpoints

**Step 1: Deposit EUR to Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/deposit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "EUR",
    "amount": 10000.00,
    "notes": "Test EUR deposit"
  }'
```

Expected: 200 response, new balance shown

**Step 2: Deposit CEA to Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/deposit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "CEA",
    "amount": 500.00,
    "notes": "Test CEA deposit"
  }'
```

Expected: 200 response, new balance shown

**Step 3: Deposit EUA to Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/deposit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "EUA",
    "amount": 100.00,
    "notes": "Test EUA deposit"
  }'
```

Expected: 200 response, new balance shown

**Step 4: Get Market Maker balances**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: EUR: 10000, CEA: 500, EUA: 100

**Step 5: Withdraw EUR from Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/withdraw" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "EUR",
    "amount": 1000.00,
    "notes": "Test EUR withdrawal"
  }'
```

Expected: 200 response, balance now 9000 EUR

---

### Task 5: Test Order Management endpoints

**Files:**
- Backend order endpoints

**Step 1: Place BUY order for Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "<MM_ID>",
    "order_type": "BUY",
    "asset_type": "CEA",
    "quantity": 50.00,
    "price": 13.50
  }'
```

Expected: 200 response with order details, status "PENDING"
Save order ID

**Step 2: Place SELL order for Market Maker**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "<MM_ID>",
    "order_type": "SELL",
    "asset_type": "EUA",
    "quantity": 10.00,
    "price": 78.50
  }'
```

Expected: 200 response with order details

**Step 3: List Market Maker orders**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-orders?market_maker_id=<MM_ID>" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Array with 2 orders (BUY CEA, SELL EUA)

**Step 4: Cancel an order**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders/<ORDER_ID>/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: 200 response, order status changed to "CANCELLED"

**Step 5: Verify assets unlocked after cancel**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Assets available again (EUA back to 100 if cancelled SELL order)

---

### Task 6: Test Logging/Audit endpoints

**Files:**
- Backend logging endpoints

**Step 1: Get all tickets**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Array of tickets showing all actions performed so far

**Step 2: Filter by action type (MM_CREATED)**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?action_type=MM_CREATED" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Tickets for Market Maker creation only

**Step 3: Filter by Market Maker ID**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?market_maker_id=<MM_ID>" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: All tickets related to MM-Test-Alpha

**Step 4: Get specific ticket details**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets/<TICKET_ID>" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Full ticket details with action_data JSON

**Step 5: Verify ticket ID format**

Check response: Ticket IDs should be like "TKT-000001", "TKT-000002", etc.

---

## Phase 4: Frontend UI Testing

### Task 7: Test Market Makers UI (Admin Tab)

**Files:**
- Frontend at http://localhost:5173

**Step 1: Login to frontend**

1. Open http://localhost:5173
2. Enter: admin@nihaogroup.com / Admin123!
3. Click Login

Expected: Redirected to Cash Market page

**Step 2: Navigate to Backoffice**

1. Click on "Backoffice" in navigation
2. Verify you see 3 tabs: Market Makers, Market Orders, Logging/Audit

Expected: Market Makers tab active by default

**Step 3: Verify Market Maker list displays**

Expected: Table showing MM-Test-Alpha-Updated with balances

**Step 4: Create new Market Maker via UI**

1. Click "Create Market Maker" button
2. Fill in:
   - Name: MM-Test-Beta
   - Legal Name: Test Market Maker Beta LLC
   - Email: mm-test-beta@internal.com
3. Click Create

Expected: Modal closes, new MM appears in table

**Step 5: Test asset deposit via UI**

1. Click "Manage Assets" on MM-Test-Beta
2. Select EUR, enter 5000, notes "Initial EUR funding"
3. Click Deposit

Expected: Modal closes, EUR balance updates to 5000

**Step 6: Test asset withdrawal via UI**

1. Click "Manage Assets" on MM-Test-Beta
2. Select EUR, enter 500, notes "Test withdrawal"
3. Click Withdraw

Expected: EUR balance updates to 4500

**Step 7: Test Market Maker edit**

1. Click "Edit" on MM-Test-Beta
2. Change name to "MM-Test-Beta-Modified"
3. Click Save

Expected: Name updates in table

---

### Task 8: Test Market Orders UI Tab

**Files:**
- Frontend Market Orders tab

**Step 1: Switch to Market Orders tab**

Click "Market Orders" tab

Expected: Orders table displayed (may be empty if previous orders filled/cancelled)

**Step 2: Place BUY order via UI**

1. Click "Place Order" button
2. Select MM-Test-Beta
3. Select BUY, CEA, quantity 100, price 13.00
4. Click Place Order

Expected: Modal closes, order appears in table with status PENDING

**Step 3: Place SELL order via UI**

1. Click "Place Order"
2. Select MM-Test-Beta
3. Select SELL, EUR, quantity 1000, price 1.00
4. Click Place Order

Expected: Order appears in table

**Step 4: Filter orders by Market Maker**

1. Use Market Maker filter dropdown
2. Select MM-Test-Beta

Expected: Only MM-Test-Beta orders shown

**Step 5: Cancel an order via UI**

1. Click "Cancel" on the CEA BUY order
2. Confirm cancellation

Expected: Order status changes to CANCELLED

---

### Task 9: Test Logging/Audit UI Tab

**Files:**
- Frontend Logging/Audit tab

**Step 1: Switch to Logging/Audit tab**

Click "Logging/Audit" tab

Expected: Audit log table displayed with recent tickets

**Step 2: Verify ticket format**

Expected: Ticket IDs formatted as "TKT-XXXXXX"

**Step 3: Filter by action type**

1. Use "Action Type" filter
2. Select "MM_CREATED"

Expected: Only Market Maker creation tickets shown

**Step 4: Filter by Market Maker**

1. Use "Market Maker" filter
2. Select MM-Test-Beta

Expected: Only tickets related to MM-Test-Beta shown

**Step 5: View ticket details**

1. Click "View Details" on any ticket
2. Verify JSON action_data is readable

Expected: Modal shows full ticket information including action_data

**Step 6: Test pagination (if many tickets)**

If more than 50 tickets exist:
1. Scroll to bottom
2. Click "Next Page"

Expected: Next 50 tickets loaded

---

## Phase 5: Integration Testing

### Task 10: Test MM order appears in public Cash Market

**Files:**
- Public Cash Market page
- Market Maker order visibility

**Step 1: Place SELL order for MM-Test-Alpha**

Via UI:
1. Go to Market Orders tab
2. Place SELL order: EUA, quantity 5, price 77.00

**Step 2: Navigate to Cash Market (public)**

1. Click "Cash Market" in main navigation
2. Go to EUA tab

Expected: MM-Test-Alpha's SELL order appears in order book (anonymously)

**Step 3: Verify anonymity**

Expected: Order shows price/quantity but NOT the Market Maker name

**Step 4: Place matching BUY order as regular user**

As admin user (acting as regular trader):
1. Place BUY order: EUA, quantity 2, price 77.00
2. Submit order

Expected: Order matches with MM's SELL order, trade executes

**Step 5: Verify MM balances updated**

1. Go back to Backoffice → Market Makers
2. Check MM-Test-Alpha balances

Expected: EUA decreased by 2, EUR increased by 154 (2 * 77.00)

---

### Task 11: Test Market Maker cannot login to UI

**Files:**
- Login page authentication

**Step 1: Logout from admin account**

Click Logout

**Step 2: Attempt to login as Market Maker**

1. Go to login page
2. Enter: mm-test-alpha@internal.com / (any password)
3. Click Login

Expected: Error message: "Account is Market Maker (cannot login)" or similar 403 error

**Step 3: Verify in backend logs**

Run: `docker-compose logs backend --tail 20`

Expected: Log showing MM login attempt blocked

**Step 4: Login as admin again**

Email: admin@nihaogroup.com / Admin123!

Expected: Successful login

---

## Phase 6: Performance & Edge Cases

### Task 12: Test concurrent ticket generation

**Files:**
- Ticket ID counter uniqueness

**Step 1: Rapidly create multiple tickets**

Via API, run this 10 times quickly:
```bash
for i in {1..10}; do
  curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/deposit" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"asset_type": "EUR", "amount": 1.00, "notes": "Concurrency test '$i'"}' &
done
wait
```

**Step 2: Verify all tickets have unique IDs**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[].ticket_id' | sort
```

Expected: All ticket IDs unique (no duplicates)

**Step 3: Verify ticket IDs sequential**

Expected: IDs increment by 1 each (TKT-000015, TKT-000016, TKT-000017, etc.)

---

### Task 13: Test insufficient balance errors

**Files:**
- Asset balance validation

**Step 1: Attempt withdrawal exceeding balance**

Try to withdraw more EUR than MM-Test-Beta has:
```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets/withdraw" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "EUR",
    "amount": 999999.00,
    "notes": "Should fail"
  }'
```

Expected: 400 error "Insufficient balance"

**Step 2: Attempt order exceeding balance**

Try to place SELL order for more assets than available:
```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "<MM_ID>",
    "order_type": "SELL",
    "asset_type": "EUA",
    "quantity": 999999.00,
    "price": 50.00
  }'
```

Expected: 400 error "Insufficient EUA balance"

**Step 3: Verify no tickets created for failed operations**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logging/tickets?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Latest tickets don't include failed operations (no ticket for failed withdrawal/order)

---

### Task 14: Test order cancellation asset unlock

**Files:**
- Asset locking/unlocking logic

**Step 1: Check MM-Test-Beta current EUA balance**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets" \
  -H "Authorization: Bearer $TOKEN"
```

Note: Current EUA available

**Step 2: Place SELL order locking EUA**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "market_maker_id": "<MM_ID>",
    "order_type": "SELL",
    "asset_type": "EUA",
    "quantity": 20.00,
    "price": 75.00
  }'
```

Save order ID

**Step 3: Verify EUA balance decreased (locked)**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: EUA balance decreased by 20

**Step 4: Cancel the order**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/market-orders/<ORDER_ID>/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

**Step 5: Verify EUA balance restored (unlocked)**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/market-makers/<MM_ID>/assets" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: EUA balance back to original amount

---

## Phase 7: Documentation & Results

### Task 15: Document test results

**Files:**
- Create: `docs/testing/market-makers-e2e-test-results.md`

**Step 1: Create results document**

Use Edit tool to create results file with this template:

```markdown
# Market Makers System - E2E Test Results

**Date:** 2026-01-19
**Tester:** Claude Sonnet 4.5
**Environment:** Docker (localhost:5173, localhost:8000)

## Test Summary

| Category | Tests Run | Passed | Failed | Notes |
|----------|-----------|--------|--------|-------|
| Database Schema | 4 | X | Y | ... |
| Backend API - CRUD | 5 | X | Y | ... |
| Backend API - Assets | 5 | X | Y | ... |
| Backend API - Orders | 5 | X | Y | ... |
| Backend API - Logging | 5 | X | Y | ... |
| Frontend UI - MMs | 7 | X | Y | ... |
| Frontend UI - Orders | 5 | X | Y | ... |
| Frontend UI - Logging | 6 | X | Y | ... |
| Integration Tests | 5 | X | Y | ... |
| Performance Tests | 3 | X | Y | ... |
| Edge Cases | 3 | X | Y | ... |

**Total:** X/Y tests passed

## Detailed Results

### Database Verification
[Paste actual results for each step]

### Backend API Testing
[Paste actual results]

### Frontend UI Testing
[Paste screenshots or detailed results]

### Integration Testing
[Document integration flows]

### Performance & Edge Cases
[Document edge case handling]

## Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1 | ... | High/Med/Low | Fixed/Open |

## Recommendations

1. ...
2. ...

## Conclusion

[Overall assessment of system readiness]
```

**Step 2: Fill in actual test results**

For each test case executed, document:
- What was tested
- Expected result
- Actual result
- Pass/Fail status
- Any errors encountered

**Step 3: Commit test results**

```bash
git add docs/testing/market-makers-e2e-test-results.md
git commit -m "test: document E2E test results for Market Makers system

All critical flows verified and documented

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Verify implementation checklist

**Files:**
- Check: `docs/plans/2026-01-19-market-makers-implementation.md`

**Step 1: Review implementation checklist**

Read the "Verification Checklist" section from the implementation plan

**Step 2: Mark completed items**

For each item in the checklist:
- [ ] All database migrations run successfully → [x] or [ ]
- [ ] All API endpoints return correct responses → [x] or [ ]
- [ ] Ticket IDs generated uniquely and sequentially → [x] or [ ]
... (continue for all items)

**Step 3: Document any incomplete items**

If any checklist items are NOT complete:
- Document why
- Create follow-up tasks
- Decide if blocking for merge

**Step 4: Update implementation plan**

Use Edit tool to update the checklist in the implementation plan with actual status

**Step 5: Commit updated checklist**

```bash
git add docs/plans/2026-01-19-market-makers-implementation.md
git commit -m "docs: update implementation checklist with verification status

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 8: Branch Completion

### Task 17: Run final verification

**Files:**
- All system components

**Step 1: Ensure no uncommitted changes**

```bash
git status
```

Expected: "nothing to commit, working tree clean"

**Step 2: Run full test suite (if exists)**

```bash
cd backend
pytest
```

Expected: All tests pass (or document failures)

**Step 3: Check for console errors in frontend**

1. Open http://localhost:5173
2. Open DevTools console
3. Navigate through all pages

Expected: No console errors (warnings OK)

**Step 4: Verify all services healthy**

```bash
docker-compose ps
```

Expected: All services "Up" and healthy

**Step 5: Check backend API docs**

Open: http://localhost:8000/docs

Expected: All Market Maker endpoints documented and testable

---

### Task 18: Use finishing-a-development-branch skill

**Files:**
- All project files

**Step 1: Invoke the skill**

Use the Skill tool to invoke: `superpowers:finishing-a-development-branch`

**Step 2: Follow the skill instructions**

The skill will guide through:
1. Running tests
2. Verifying branch state
3. Presenting options (Merge, PR, or Keep)
4. Executing chosen option

**Step 3: Document decision**

Note which option was chosen and why

---

## Success Criteria

Before considering this plan complete:

- [ ] All E2E test cases executed (Tasks 2-14)
- [ ] Test results documented (Task 15)
- [ ] Implementation checklist verified (Task 16)
- [ ] All tests passing or failures documented
- [ ] No critical bugs blocking merge
- [ ] finishing-a-development-branch skill completed (Task 18)
- [ ] Branch ready for PR or merge

---

## Notes

- If any test fails, use **superpowers:systematic-debugging** skill to investigate
- Document all issues found in test results
- For minor bugs, create GitHub issues and proceed
- For critical bugs, fix before completing branch

---

**Plan complete. Ready for execution with superpowers:executing-plans.**
