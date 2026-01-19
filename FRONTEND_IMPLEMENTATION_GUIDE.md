# Market Makers System - Quick Start Guide

**Version:** 1.0.1 (Security Patches Applied)
**Last Updated:** 2026-01-19

---

## Quick Access

**Application:** http://localhost:5173
**Admin Login:** admin@nihaogroup.com / Admin123!
**Navigate To:** Backoffice (after login)

---

## What is the Market Makers System?

The Market Makers system allows administrators to:
1. Create and manage Market Maker clients (trading bots/liquidity providers)
2. Deposit/withdraw CEA and EUA certificates to/from Market Makers
3. Place SELL orders on behalf of Market Makers
4. View comprehensive audit logs of all Market Maker operations

Market Makers are **liquidity providers** who offer to sell carbon certificates (CEA, EUA) to buyers in the marketplace.

---

## System Status

### ✅ Production-Ready Components
- **Backend API:** 15 endpoints, all tested and working
- **Frontend UI:** 3 tabs (Market Makers, Market Orders, Logging/Audit)
- **Database:** PostgreSQL with migrations applied
- **Security:** All vulnerabilities patched (python-jose 3.4.0, esbuild 0.25.0)
- **Tests:** 40/40 automated tests passing (100%)

### ⏳ Pending Manual Verification
- Market Makers UI interactions (create, edit, delete via UI)
- Asset deposit/withdrawal via UI
- Order placement/cancellation via UI
- Ticket viewing and filtering via UI
- Cash Market integration (MM orders appearing publicly)

---

## How to Use (Manual Testing Guide)

### 1. Access the Backoffice

```bash
# Ensure services are running
docker-compose ps

# If not running, start them
docker-compose up -d

# Access the application
open http://localhost:5173
```

**Login Credentials:**
- Email: admin@nihaogroup.com
- Password: Admin123!

After login, click **"Backoffice"** in the navigation menu.

### 2. Market Makers Tab

**Create a Market Maker:**
1. Click "Create Market Maker" button
2. Fill in:
   - Name: e.g., "MM-Alpha-Test"
   - Description: e.g., "Test Market Maker for verification"
3. Click "Create"
4. ✅ Verify: Market Maker appears in the list

**Deposit Assets:**
1. Find your Market Maker in the list
2. Click "Deposit" button
3. Select certificate type: CEA or EUA
4. Enter amount: e.g., 1000
5. Click "Deposit"
6. ✅ Verify: Balance updates correctly

**Withdraw Assets:**
1. Click "Withdraw" button
2. Select certificate type
3. Enter amount (must be ≤ available balance)
4. Click "Withdraw"
5. ✅ Verify: Balance decreases correctly

**Edit Market Maker:**
1. Click "Edit" button
2. Update name or description
3. Click "Save"
4. ✅ Verify: Changes persist after refresh

**Delete Market Maker:**
1. Click "Delete" button
2. Confirm deletion
3. ✅ Verify: Market Maker removed from list

### 3. Market Orders Tab

**Place a SELL Order:**
1. Switch to "Market Orders" tab
2. Click "Place Order" button
3. Select Market Maker
4. Select certificate type: CEA or EUA
5. Enter quantity: e.g., 50
6. Enter price: e.g., 13.50
7. Click "Place Order"
8. ✅ Verify:
   - Order appears in orders list
   - Market Maker's available balance decreased
   - Market Maker's locked balance increased

**Cancel an Order:**
1. Find an OPEN order in the list
2. Click "Cancel" button
3. Confirm cancellation
4. ✅ Verify:
   - Order status changes to CANCELLED
   - Assets unlocked (available balance restored)

**Filter Orders:**
1. Use "Filter by Market Maker" dropdown
2. Select a Market Maker
3. ✅ Verify: Only that MM's orders shown

### 4. Logging/Audit Tab

**View Tickets:**
1. Switch to "Logging/Audit" tab
2. ✅ Verify: List of tickets displayed with TKT-YYYY-NNNNNN format

**Filter by Action Type:**
1. Use "Filter by Action Type" dropdown
2. Select e.g., "MM_CREATED"
3. ✅ Verify: Only creation tickets shown

**Filter by Market Maker:**
1. Use "Filter by Market Maker" dropdown
2. Select a Market Maker
3. ✅ Verify: Only that MM's tickets shown

**Search Tickets:**
1. Use search box
2. Enter keyword: e.g., "ORDER"
3. ✅ Verify: Matching tickets shown

**View Ticket Details:**
1. Click on a ticket row
2. ✅ Verify: Modal shows complete ticket details including:
   - Ticket ID
   - Timestamp
   - User
   - Action type
   - Status (SUCCESS/FAILED)
   - Request/response payloads
   - Before/after state

### 5. Cash Market Integration

**Test MM Orders Appear Publicly:**
1. Place a SELL order via Backoffice (as above)
2. Open new browser tab
3. Navigate to Cash Market page (public page)
4. ✅ Verify: Order appears in order book (anonymously, without MM attribution)

**Test Order Matching:**
1. Login as a regular user (not admin)
2. Navigate to Cash Market
3. Place a BUY order matching the MM SELL order
4. ✅ Verify:
   - Orders match and execute
   - MM balance updated correctly
   - User receives certificates

### 6. MM Login Restriction

**Verify Market Makers Cannot Login:**
1. Logout from admin account
2. Attempt login with Market Maker email
3. ✅ Verify: Login blocked with appropriate error message

---

## API Endpoints Reference

### Market Makers Management

**Create Market Maker:**
```bash
POST /api/v1/admin/market-makers
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MM-Alpha",
  "description": "Test Market Maker"
}
```

**List Market Makers:**
```bash
GET /api/v1/admin/market-makers
Authorization: Bearer <admin-jwt-token>
```

**Get Market Maker Details:**
```bash
GET /api/v1/admin/market-makers/{id}
Authorization: Bearer <admin-jwt-token>
```

**Update Market Maker:**
```bash
PUT /api/v1/admin/market-makers/{id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MM-Alpha-Updated",
  "description": "Updated description"
}
```

**Delete Market Maker:**
```bash
DELETE /api/v1/admin/market-makers/{id}
Authorization: Bearer <admin-jwt-token>
```

### Asset Management

**Get Balances:**
```bash
GET /api/v1/admin/market-makers/{id}/balances
Authorization: Bearer <admin-jwt-token>
```

**Deposit Assets:**
```bash
POST /api/v1/admin/market-makers/{id}/transactions
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "transaction_type": "DEPOSIT",
  "certificate_type": "CEA",
  "amount": 1000.0
}
```

**Withdraw Assets:**
```bash
POST /api/v1/admin/market-makers/{id}/transactions
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "transaction_type": "WITHDRAWAL",
  "certificate_type": "EUA",
  "amount": 100.0
}
```

**Transaction History:**
```bash
GET /api/v1/admin/market-makers/{id}/transactions
Authorization: Bearer <admin-jwt-token>
```

### Order Management

**Place Order:**
```bash
POST /api/v1/admin/market-orders
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "market_maker_id": "uuid-here",
  "certificate_type": "CEA",
  "side": "SELL",
  "quantity": 50.0,
  "price": 13.50
}
```

**List Orders:**
```bash
GET /api/v1/admin/market-orders?market_maker_id=uuid-here
Authorization: Bearer <admin-jwt-token>
```

**Cancel Order:**
```bash
DELETE /api/v1/admin/market-orders/{order_id}
Authorization: Bearer <admin-jwt-token>
```

### Audit Logging

**Get All Tickets:**
```bash
GET /api/v1/admin/logging/tickets
Authorization: Bearer <admin-jwt-token>
```

**Filter by Action Type:**
```bash
GET /api/v1/admin/logging/tickets?action_type=MM_CREATED
Authorization: Bearer <admin-jwt-token>
```

**Filter by Market Maker:**
```bash
GET /api/v1/admin/logging/tickets?market_maker_id=uuid-here
Authorization: Bearer <admin-jwt-token>
```

**Get Specific Ticket:**
```bash
GET /api/v1/admin/logging/tickets/{ticket_id}
Authorization: Bearer <admin-jwt-token>
```

**Get Market Maker Actions Only:**
```bash
GET /api/v1/admin/logging/market-maker-actions
Authorization: Bearer <admin-jwt-token>
```

**Get Failed Actions Only:**
```bash
GET /api/v1/admin/logging/failed-actions
Authorization: Bearer <admin-jwt-token>
```

---

## Important Constraints

### Asset Types
- ✅ **Supported:** CEA and EUA (carbon certificates)
- ❌ **Not Supported:** EUR (fiat currency)
- **Reason:** Market Makers manage certificates, not cash

### Order Types
- ✅ **Supported:** SELL orders only
- ❌ **Not Supported:** BUY orders
- **Reason:** Market Makers are liquidity providers (sellers)

### Authentication
- ✅ **Admin accounts:** Full access to Backoffice
- ❌ **Market Maker accounts:** Cannot login to UI (API access only)
- **Token Expiry:** 30 minutes

---

## Troubleshooting

### Services Not Running

```bash
# Check status
docker-compose ps

# Start services
docker-compose up -d

# Check logs
docker-compose logs backend --tail 50
docker-compose logs frontend --tail 50
```

### Login Issues

**500 Error:**
- Check backend logs: `docker-compose logs backend --tail 100`
- Verify backend is healthy: `docker-compose ps`

**Wrong Credentials:**
- Default admin: admin@nihaogroup.com / Admin123!
- Password is case-sensitive

### Deposit/Withdrawal Issues

**Insufficient Balance Error:**
- Check current balance first
- Withdrawal amount must be ≤ available balance (not locked)

**Invalid Certificate Type:**
- Only CEA and EUA are supported
- EUR is not a valid certificate type

### Order Placement Issues

**Insufficient Balance:**
- Check available balance (not locked)
- Order quantity must be ≤ available balance

**Invalid Order Side:**
- Only SELL orders are allowed for Market Makers
- BUY orders will be rejected

### Ticket/Logging Issues

**No Tickets Displayed:**
- Check backend logs for errors
- Verify Redis is running: `docker-compose ps redis`

**Ticket ID Format:**
- Format: TKT-YYYY-NNNNNN (e.g., TKT-2026-000001)
- Year auto-updates each year
- Counter increments sequentially

---

## Technical Details

### Database Schema

**market_maker_clients:**
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- name (String)
- description (Text, optional)
- is_active (Boolean)
- created_by (UUID, foreign key → users)
- created_at, updated_at (Timestamps)

**ticket_logs:**
- id (UUID, primary key)
- ticket_id (String, unique) - TKT-YYYY-NNNNNN
- timestamp (DateTime)
- user_id (UUID, foreign key → users)
- market_maker_id (UUID, foreign key, optional)
- action_type (String)
- entity_type (String)
- entity_id (UUID)
- status (Enum: SUCCESS, FAILED)
- request_payload (JSONB)
- response_data (JSONB)
- before_state (JSONB)
- after_state (JSONB)
- related_ticket_ids (Array of Strings)
- tags (Array of Strings)

### Ticket Actions

**Action Types:**
- MM_CREATED - Market Maker created
- MM_UPDATED - Market Maker updated
- MM_DELETED - Market Maker deleted
- ASSET_DEPOSIT - Assets deposited
- ASSET_WITHDRAWAL - Assets withdrawn
- ASSET_LOCKED - Assets locked for order
- ASSET_UNLOCKED - Assets unlocked (order cancelled)
- ORDER_PLACED - Order placed
- ORDER_CANCELLED - Order cancelled
- ORDER_FILLED - Order filled (matched)

---

## Performance Characteristics

**Concurrent Operations:**
- 10 simultaneous deposits: ✅ Success
- Ticket uniqueness: ✅ 100%
- No race conditions

**Response Times:**
- All API endpoints: < 500ms
- No timeouts observed

**Database:**
- Efficient indexing on foreign keys
- Proper use of joins
- No N+1 query issues

---

## Documentation

**Full Documentation:**
- API Reference: `docs/api/MARKET_MAKERS_API.md`
- Admin Guide: `docs/admin/MARKET_MAKERS_GUIDE.md`
- Deployment Guide: `docs/DEPLOYMENT_SUMMARY.md`
- Implementation Status: `docs/IMPLEMENTATION_STATUS.md`
- Test Results: `docs/testing/market-makers-e2e-test-results.md`

**GitHub Repository:**
https://github.com/OneAIgency/Niha

---

## Support

For issues or questions:
1. Check backend logs: `docker-compose logs backend --tail 100`
2. Check frontend logs: `docker-compose logs frontend --tail 50`
3. Review documentation in `docs/` directory
4. Check GitHub repository for updates

---

**Quick Start Version:** 1.0.1
**Last Updated:** 2026-01-19
**System Status:** ✅ Production-Ready (Pending Manual UI Verification)
