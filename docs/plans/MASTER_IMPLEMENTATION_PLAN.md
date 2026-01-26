# Niha Carbon Platform - Master Implementation Plan
**Version:** 1.0
**Date:** 2026-01-26
**Status:** Active Development

---

## 🎯 Vision & Scope

Platformă completă pentru tranzacționarea certificatelor de carbon (EUA/CEA) cu:
- **Backoffice** complet funcțional pentru administrare
- **Client Journey** end-to-end (onboarding → trading → settlement)
- **Market Maker** integration pentru lichiditate
- **Compliance & Security** la cel mai înalt nivel

---

## 📊 Current Status (Sprint 4 Complete)

### ✅ Implemented Features
- Authentication & Authorization (JWT + Redis sessions)
- User Management (Admin creation, invitations, roles)
- KYC Review Workflow (document upload, approval/rejection)
- Contact Requests Management
- Market Maker Management (creation, orders, transactions)
- Settlement Monitoring & Batch Processing
- Cash Market Trading (order book, depth chart, trade execution)
- Swap Requests (EUA ↔ CEA)
- Real-time Updates (WebSocket backoffice notifications)
- **AML Hold Management** (Sprint 4 - just completed)

### 🔧 Technical Foundation
- Backend: FastAPI + PostgreSQL + Redis + SQLAlchemy 2.0 async
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Design System: Navy + Emerald color scheme
- Real-time: WebSocket connections
- Database: PostgreSQL 15 with comprehensive migrations
- Testing: pytest (backend), vitest (frontend planned)

---

## 🏗️ Implementation Phases

### **PHASE 1: Backoffice Completion** (Sprints 5-8)
Priority: Critical foundation for operations

### **PHASE 2: Client Journey** (Sprints 9-15)
Priority: Core revenue generation

### **PHASE 3: Market Maker Integration** (Sprints 16-18)
Priority: Liquidity & market efficiency

### **PHASE 4: Polish & Production** (Sprints 19-22)
Priority: Production readiness

---

## 📋 PHASE 1: Backoffice Completion

### Sprint 5: Deposit Management - Client Flow
**Goal:** Complete end-to-end deposit workflow (client announcement → admin confirmation → AML hold → clearing)

**Backend:**
- [ ] POST `/api/v1/funding/deposits/announce` - Client announces wire transfer
  - Request: { amount, currency, wire_reference, bank_details }
  - Creates deposit with status: PENDING
  - Returns deposit_id and wire instructions
- [ ] GET `/api/v1/funding/deposits/my-deposits` - Client views their deposits
  - Returns: all deposits for current user with status
- [ ] POST `/api/v1/admin/deposits/{id}/confirm` - Admin confirms receipt
  - Request: { actual_amount, actual_currency, received_at, admin_notes }
  - Updates status: PENDING → ON_HOLD
  - Triggers hold period calculation
  - Links to AML deposits table

**Frontend:**
- [ ] `DepositAnnouncementModal` - Client-facing modal for announcing deposits
  - Form: amount, currency, bank selection
  - Display wire transfer instructions
  - Generate unique reference code
- [ ] `MyDepositsTab` - Client view of their deposit history
  - Table: amount, status, dates, reference
  - Status badges with colors
  - Real-time updates via WebSocket
- [ ] Update `PendingDepositsTab` to confirm deposits
  - Add "Confirm Receipt" button
  - Modal with actual amount received
  - Connect to AML flow

**Database:**
- [ ] Modify `deposits` table schema (if needed)
- [ ] Add `client_announcements` table for tracking
- [ ] Create indexes for performance

**Testing:**
- [ ] End-to-end deposit flow: announce → confirm → AML → clear
- [ ] Balance update verification
- [ ] Email notifications (stubbed)

**Estimated Time:** 8-10 hours

---

### Sprint 6: Withdrawal Management
**Goal:** Allow clients to withdraw funds to bank accounts

**Backend:**
- [ ] POST `/api/v1/funding/withdrawals/request` - Client requests withdrawal
  - Request: { amount, currency, bank_account_id, reason }
  - Validates: sufficient balance, KYC approved
  - Creates withdrawal with status: PENDING
- [ ] GET `/api/v1/funding/withdrawals/my-withdrawals` - List client withdrawals
- [ ] GET `/api/v1/admin/withdrawals` - Admin lists all withdrawal requests
  - Filters: status, date range, amount range, user
- [ ] POST `/api/v1/admin/withdrawals/{id}/approve` - Admin approves
  - Deducts from client balance
  - Updates status: PENDING → APPROVED → PROCESSING
  - Creates audit log
- [ ] POST `/api/v1/admin/withdrawals/{id}/reject` - Admin rejects
  - Requires rejection reason
  - Status: PENDING → REJECTED
- [ ] POST `/api/v1/admin/withdrawals/{id}/complete` - Mark as completed
  - Status: PROCESSING → COMPLETED
  - Records wire transfer details

**Frontend:**
- [ ] `WithdrawalRequestModal` - Client requests withdrawal
  - Form: amount, currency, bank account selection
  - Validation: max = available balance
  - Confirmation step
- [ ] `MyWithdrawalsTab` - Client views withdrawal history
  - Status tracking with timeline
  - Cancellation option (if PENDING)
- [ ] `WithdrawalsTab` (Backoffice) - Admin manages withdrawals
  - Table with filters
  - Approve/Reject actions
  - Mark as completed
  - Bank transfer details tracking

**Database:**
- [ ] Create `withdrawals` table
  - Fields: id, user_id, entity_id, amount, currency, status, bank_account_id
  - Statuses: PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED
  - Audit fields: approved_by, rejected_by, rejection_reason, completed_at
- [ ] Create `bank_accounts` table (if not exists)
  - Fields: user_id, account_name, iban, swift, bank_name, verified

**Testing:**
- [ ] Withdrawal request validation
- [ ] Balance deduction on approval
- [ ] Status transitions
- [ ] Admin approval/rejection workflow

**Estimated Time:** 10-12 hours

---

### Sprint 7: Bank Account Management
**Goal:** Clients manage their bank accounts for deposits/withdrawals

**Backend:**
- [ ] POST `/api/v1/funding/bank-accounts` - Add bank account
  - Request: { account_name, iban, swift, bank_name, country }
  - Validation: IBAN format, required fields
  - Status: PENDING_VERIFICATION
- [ ] GET `/api/v1/funding/bank-accounts` - List client's bank accounts
- [ ] PUT `/api/v1/funding/bank-accounts/{id}` - Update bank account
  - Only if not verified yet
- [ ] DELETE `/api/v1/funding/bank-accounts/{id}` - Remove bank account
  - Only if no pending transactions
- [ ] GET `/api/v1/admin/bank-accounts` - Admin views all accounts
  - Filters: status, user, verification date
- [ ] POST `/api/v1/admin/bank-accounts/{id}/verify` - Admin verifies
  - Uploads verification document
  - Status: PENDING_VERIFICATION → VERIFIED
- [ ] POST `/api/v1/admin/bank-accounts/{id}/reject` - Admin rejects
  - Status: PENDING_VERIFICATION → REJECTED
  - Requires rejection reason

**Frontend:**
- [ ] `BankAccountsTab` - Client manages bank accounts
  - List of saved accounts with status badges
  - Add new account button
  - Edit/Delete actions
- [ ] `AddBankAccountModal` - Add/Edit bank account form
  - Fields: IBAN, SWIFT, Bank Name, Country
  - IBAN validation
  - Preview wire instructions
- [ ] `BankAccountsAdminTab` (Backoffice) - Admin verifies accounts
  - Pending verification queue
  - Verify/Reject actions
  - Document viewer for proof

**Database:**
- [ ] Create `bank_accounts` table
  - Fields: id, user_id, entity_id, account_name, iban, swift, bank_name, country
  - status: PENDING_VERIFICATION, VERIFIED, REJECTED
  - Audit: verified_by, verified_at, rejected_by, rejection_reason
  - is_primary: boolean (default deposit/withdrawal account)

**Testing:**
- [ ] IBAN validation
- [ ] Bank account CRUD operations
- [ ] Verification workflow
- [ ] Primary account selection

**Estimated Time:** 6-8 hours

---

### Sprint 8: Transaction History & Reporting
**Goal:** Comprehensive transaction history and reporting for clients and admins

**Backend:**
- [ ] GET `/api/v1/funding/transactions` - Client transaction history
  - Returns: deposits, withdrawals, trades, settlements, fees
  - Filters: type, date range, status, currency
  - Pagination & sorting
- [ ] GET `/api/v1/admin/reports/transactions` - Admin transaction report
  - Aggregates: total volume, fees collected, by currency, by type
  - Date range filtering
  - Export to CSV/Excel
- [ ] GET `/api/v1/admin/reports/balances` - Admin balance report
  - All client balances snapshot
  - Total platform holdings (EUR, EUA, CEA)
  - Export capability
- [ ] GET `/api/v1/admin/reports/reconciliation` - Daily reconciliation
  - Opening balance + transactions = closing balance
  - Discrepancy detection
  - Audit trail

**Frontend:**
- [ ] `TransactionHistoryTab` - Client views all transactions
  - Unified timeline view (deposits, withdrawals, trades, settlements)
  - Filters and search
  - Transaction detail modal
  - Export to CSV
- [ ] `ReportsTab` (Backoffice) - Admin reporting dashboard
  - Transaction volume charts
  - Balance overview
  - Reconciliation status
  - Export tools

**Database:**
- [ ] Create unified `transactions` view (if needed)
  - Combines deposits, withdrawals, trades, settlements
  - Standardized schema for reporting
- [ ] Add `daily_reconciliations` table for audit

**Testing:**
- [ ] Transaction filtering and pagination
- [ ] CSV export format
- [ ] Reconciliation accuracy
- [ ] Performance with large datasets

**Estimated Time:** 8-10 hours

---

## 📋 PHASE 2: Client Journey

### Sprint 9: Enhanced Onboarding - Entity Setup
**Goal:** Complete entity creation and verification flow

**Backend:**
- [ ] POST `/api/v1/onboarding/entity` - Create entity (company/individual)
  - Request: { entity_type, legal_name, registration_number, jurisdiction, address }
  - Creates entity with status: DRAFT
- [ ] PUT `/api/v1/onboarding/entity/{id}` - Update entity details
- [ ] POST `/api/v1/onboarding/entity/{id}/submit` - Submit for review
  - Status: DRAFT → PENDING_REVIEW
  - Triggers admin notification
- [ ] GET `/api/v1/admin/entities` - Admin lists entities
  - Filters: status, jurisdiction, entity_type, KYC status
- [ ] POST `/api/v1/admin/entities/{id}/approve` - Admin approves entity
  - Status: PENDING_REVIEW → APPROVED
  - Enables trading
- [ ] POST `/api/v1/admin/entities/{id}/request-changes` - Request changes
  - Status: PENDING_REVIEW → CHANGES_REQUESTED
  - Includes feedback comments

**Frontend:**
- [ ] `EntitySetupFlow` - Multi-step entity creation wizard
  - Step 1: Entity type selection (company/individual)
  - Step 2: Legal details form
  - Step 3: Address & contact info
  - Step 4: Review & submit
  - Progress indicator
- [ ] `EntityReviewTab` (Backoffice) - Admin reviews entities
  - Pending queue
  - Entity detail viewer
  - Approve/Request Changes actions
  - Comment system

**Database:**
- [ ] Enhance `entities` table with additional fields
  - Add: address_line1, address_line2, city, postal_code, country
  - Add: tax_id, incorporation_date, website
  - Add: status, status_updated_at, status_updated_by

**Testing:**
- [ ] Entity creation and update flow
- [ ] Admin review and approval
- [ ] Status transitions
- [ ] Validation rules (jurisdiction-specific)

**Estimated Time:** 8-10 hours

---

### Sprint 10: KYC Document Upload - Client Side
**Goal:** Client-initiated KYC document submission

**Backend:**
- [ ] POST `/api/v1/kyc/documents/upload` - Client uploads KYC document
  - Request: multipart/form-data with file + metadata
  - Supported types: passport, national_id, proof_of_address, company_registration
  - File validation: size, type (PDF, JPG, PNG)
  - Creates document with status: PENDING_REVIEW
- [ ] GET `/api/v1/kyc/documents/my-documents` - Client views their documents
  - Returns: all documents with status
- [ ] DELETE `/api/v1/kyc/documents/{id}` - Client deletes document
  - Only if status: PENDING_REVIEW or REJECTED
- [ ] GET `/api/v1/kyc/status` - Client checks KYC status
  - Returns: overall status, missing documents, review comments

**Frontend:**
- [ ] `KYCUploadTab` - Client uploads KYC documents
  - Document type selector
  - Drag-and-drop file upload
  - Preview uploaded files
  - Status tracking for each document
- [ ] `KYCStatusPanel` - Shows KYC completion status
  - Checklist of required documents
  - Status badges (pending, approved, rejected)
  - Admin comments display
  - Re-upload rejected documents

**Database:**
- [ ] Ensure `kyc_documents` table supports client uploads
  - Add: uploaded_by_client: boolean
  - Add: client_notes: text

**Testing:**
- [ ] File upload and validation
- [ ] Document status tracking
- [ ] Re-upload after rejection
- [ ] Storage and retrieval

**Estimated Time:** 6-8 hours

---

### Sprint 11: Marketplace - Browse & Discover
**Goal:** Client browses available certificates and market data

**Backend:**
- [ ] GET `/api/v1/marketplace/certificates` - List available certificates
  - Filters: certificate_type (EUA/CEA), vintage_year, price_range, available_quantity
  - Sorting: price, vintage, availability
  - Pagination
  - Returns: certificate details + current market price
- [ ] GET `/api/v1/marketplace/certificates/{id}` - Certificate detail view
  - Returns: full certificate info, price history, available sellers
- [ ] GET `/api/v1/marketplace/price-history` - Historical pricing
  - Parameters: certificate_type, date_range, interval (daily/weekly)
  - Returns: time series data for charts
- [ ] GET `/api/v1/marketplace/statistics` - Market statistics
  - Returns: total volume (24h, 7d, 30d), average prices, trends

**Frontend:**
- [ ] `MarketplacePage` - Browse certificates
  - Grid/List view toggle
  - Filters sidebar (type, vintage, price)
  - Search by registry ID or name
  - Sort options
  - Certificate cards with key info
- [ ] `CertificateDetailModal` - Detailed certificate view
  - Certificate information
  - Price chart (7d, 30d, all time)
  - Available sellers table
  - "Buy Now" / "Make Offer" buttons
- [ ] `MarketStatsDashboard` - Market overview
  - Total volume traded
  - Price trends (EUA vs CEA)
  - Top certificates by volume
  - Recent trades ticker

**Database:**
- [ ] Create `marketplace_listings` table
  - Fields: id, certificate_id, seller_entity_id, quantity, price, status
  - Indexes for fast filtering

**Testing:**
- [ ] Certificate filtering and search
- [ ] Price history data accuracy
- [ ] Performance with large datasets
- [ ] Real-time price updates

**Estimated Time:** 10-12 hours

---

### Sprint 12: Order Placement - Buy/Sell
**Goal:** Clients can place buy/sell orders for certificates

**Backend:**
- [ ] POST `/api/v1/orders/place` - Place order
  - Request: { certificate_type, order_type (BUY/SELL), quantity, price, order_kind (MARKET/LIMIT) }
  - Validations:
    - KYC approved
    - Sufficient balance (for BUY) or certificates (for SELL)
    - Price within limits
  - Creates order with status: PENDING → OPEN
  - Attempts immediate matching
- [ ] GET `/api/v1/orders/my-orders` - Client's order history
  - Filters: status, type, certificate_type, date_range
  - Returns: all orders with fill status
- [ ] POST `/api/v1/orders/{id}/cancel` - Cancel order
  - Only if status: OPEN or PARTIALLY_FILLED
  - Refunds reserved balance/certificates
  - Status: OPEN → CANCELLED
- [ ] GET `/api/v1/orders/{id}` - Order detail
  - Returns: order info, fill history, related trades

**Order Matching Engine:**
- [ ] Implement order matching logic
  - Price-time priority
  - Immediate matching on placement
  - Background job for continuous matching
  - Partial fills support
- [ ] Create `order_fills` table for tracking fills
- [ ] Integrate with settlement system

**Frontend:**
- [ ] `OrderEntryPanel` - Place orders
  - Buy/Sell toggle
  - Market/Limit order selector
  - Quantity and price inputs
  - Balance/Position display
  - Order preview before confirmation
- [ ] `MyOrdersTab` - View and manage orders
  - Active orders table
  - Order history table
  - Cancel order action
  - Order detail modal
  - Fill notifications
- [ ] `OrderConfirmationModal` - Confirm order placement
  - Order summary
  - Estimated total cost/proceeds
  - Fee breakdown
  - Final confirmation

**Database:**
- [ ] Enhance `orders` table for client orders
  - Add: user_id, entity_id, certificate_type, order_kind (MARKET/LIMIT)
  - Add: filled_quantity, average_fill_price
  - Indexes for matching engine
- [ ] Create `order_fills` table
  - Fields: order_id, trade_id, quantity, price, filled_at

**Testing:**
- [ ] Order placement validation
- [ ] Balance/certificate locking
- [ ] Order matching logic
- [ ] Partial fill handling
- [ ] Cancel order and refund

**Estimated Time:** 14-16 hours (complex)

---

### Sprint 13: Trade Execution & Matching
**Goal:** Automated trade matching and execution

**Backend:**
- [ ] Background job: Order matching scheduler
  - Runs every N seconds (configurable)
  - Matches BUY and SELL orders by price-time priority
  - Creates `Trade` records
  - Updates order fill status
- [ ] POST `/api/v1/trades/{id}/confirm` - Confirm trade (if manual confirmation needed)
  - Updates trade status: PENDING → CONFIRMED
- [ ] GET `/api/v1/trades/my-trades` - Client's trade history
  - Filters: certificate_type, date_range, counterparty
  - Returns: all trades with settlement status
- [ ] WebSocket: Real-time trade notifications
  - Push to client when their order is filled
  - Update order book in real-time

**Trade Matching Logic:**
```python
# Pseudo-code for matching
for buy_order in buy_orders.order_by('price DESC, created_at ASC'):
    for sell_order in sell_orders.filter(price__lte=buy_order.price).order_by('price ASC, created_at ASC'):
        quantity = min(buy_order.remaining, sell_order.remaining)
        create_trade(buy_order, sell_order, quantity, sell_order.price)
        update_order_fills(buy_order, sell_order, quantity)
        if buy_order.fully_filled:
            break
```

**Frontend:**
- [ ] `TradeHistoryTab` - View trade history
  - Table: date, type, certificate, quantity, price, counterparty, status
  - Trade detail modal
  - Settlement tracking
- [ ] Real-time notifications for trade fills
  - Toast notification on order fill
  - Sound alert (optional, user preference)
  - Update order book and positions

**Database:**
- [ ] Enhance `trades` table
  - Ensure proper linking to orders
  - Add: settlement_batch_id (for future settlement)
- [ ] Create indexes for trade history queries

**Testing:**
- [ ] Order matching algorithm correctness
- [ ] Partial fill scenarios
- [ ] Price-time priority enforcement
- [ ] Real-time notification delivery
- [ ] Race condition handling (concurrent orders)

**Estimated Time:** 12-14 hours (complex)

---

### Sprint 14: Portfolio & Positions Management
**Goal:** Client views their holdings, positions, and P&L

**Backend:**
- [ ] GET `/api/v1/portfolio/summary` - Portfolio overview
  - Returns: total balance (EUR), certificate holdings (EUA/CEA), total value
  - P&L: realized, unrealized
  - Aggregated by certificate type
- [ ] GET `/api/v1/portfolio/positions` - Detailed positions
  - Returns: all certificate holdings with cost basis, current value, P&L
  - Filters: certificate_type, vintage_year
- [ ] GET `/api/v1/portfolio/performance` - Performance metrics
  - Time period: 1W, 1M, 3M, 6M, 1Y, ALL
  - Returns: total return %, value over time chart data
- [ ] GET `/api/v1/portfolio/activity-feed` - Recent activity
  - Returns: last N transactions (trades, deposits, withdrawals, settlements)
  - Real-time updates via WebSocket

**Frontend:**
- [ ] `PortfolioPage` - Main portfolio dashboard
  - Summary cards: Total Value, Cash Balance, Certificates Held, P&L
  - Performance chart (value over time)
  - Positions table (certificate, quantity, avg cost, current value, P&L)
  - Activity feed
- [ ] `PositionDetailModal` - Drill-down into position
  - Certificate details
  - Transaction history for this position
  - Cost basis calculation breakdown
  - P&L chart

**Database:**
- [ ] Create `portfolio_snapshots` table (optional, for performance)
  - Daily snapshots of portfolio value
  - Enables faster performance calculations
- [ ] Create views for aggregated positions

**Testing:**
- [ ] P&L calculation accuracy
- [ ] Position aggregation correctness
- [ ] Performance chart data
- [ ] Real-time activity feed updates

**Estimated Time:** 8-10 hours

---

### Sprint 15: Settlement Integration - Client View
**Goal:** Client tracks settlement status and receives certificates

**Backend:**
- [ ] GET `/api/v1/settlements/my-settlements` - Client's settlements
  - Returns: all settlement batches for client's trades
  - Filters: status, date_range, certificate_type
- [ ] GET `/api/v1/settlements/{id}` - Settlement detail
  - Returns: settlement batch info, included trades, status timeline
  - Shows expected vs actual settlement dates
- [ ] POST `/api/v1/settlements/{id}/confirm-receipt` - Client confirms certificate receipt
  - Updates status: DELIVERED → CONFIRMED
  - Optional: upload proof of receipt document

**Frontend:**
- [ ] `SettlementsTab` - Client views settlements
  - Pending settlements table
  - Completed settlements table
  - Settlement status badges with timeline
  - Confirm receipt action
- [ ] `SettlementDetailModal` - Settlement details
  - Included trades list
  - Settlement timeline (initiated → processed → delivered → confirmed)
  - Registry information
  - Delivery proof upload

**Integration:**
- [ ] Connect to existing settlement batch system
- [ ] Ensure client can see only their own settlements
- [ ] Update settlement status based on client confirmations

**Testing:**
- [ ] Settlement filtering and display
- [ ] Status timeline accuracy
- [ ] Client confirmation workflow
- [ ] Document upload and storage

**Estimated Time:** 6-8 hours

---

## 📋 PHASE 3: Market Maker Integration

### Sprint 16: Market Maker API & Authentication
**Goal:** Market makers can integrate via API for automated trading

**Backend:**
- [ ] POST `/api/v1/auth/mm/api-key` - Generate API key for market maker
  - Admin-only endpoint
  - Request: { market_maker_id, scope, expires_at }
  - Returns: api_key (show once)
  - Stores hashed key in database
- [ ] DELETE `/api/v1/auth/mm/api-key/{id}` - Revoke API key
- [ ] GET `/api/v1/auth/mm/api-keys` - List API keys for market maker
  - Returns: key_id, scope, created_at, last_used_at (not the actual key)
- [ ] Implement API key authentication middleware
  - Header: `X-API-Key: <key>`
  - Rate limiting per key
  - Scope validation

**Frontend (Backoffice):**
- [ ] `APIKeysTab` in Market Maker details
  - Generate new API key button
  - Display API key modal (show once warning)
  - List existing keys with last used timestamp
  - Revoke key action

**Database:**
- [ ] Create `mm_api_keys` table
  - Fields: id, market_maker_id, key_hash, scope, created_at, expires_at, last_used_at, is_active

**Documentation:**
- [ ] Create API documentation for market makers
  - Authentication guide
  - Available endpoints
  - Request/response examples
  - Rate limits
  - Error codes

**Testing:**
- [ ] API key generation and storage
- [ ] Authentication middleware
- [ ] Rate limiting
- [ ] Key revocation

**Estimated Time:** 8-10 hours

---

### Sprint 17: Market Maker Order Management API
**Goal:** Market makers can place/cancel orders via API

**Backend:**
- [ ] POST `/api/v1/mm/orders` - Place order via API
  - Same as client order placement, but authenticated via API key
  - Request: { certificate_type, side (BUY/SELL), quantity, price, order_type (MARKET/LIMIT) }
  - Returns: order_id, status
- [ ] GET `/api/v1/mm/orders` - List market maker's orders
  - Filters: status, certificate_type, date_range
  - Pagination
- [ ] DELETE `/api/v1/mm/orders/{id}` - Cancel order via API
- [ ] GET `/api/v1/mm/orders/{id}` - Get order detail via API
- [ ] POST `/api/v1/mm/orders/bulk` - Bulk order placement
  - Place multiple orders in one request
  - Atomic operation (all succeed or all fail)
  - Useful for quoting both sides of the market

**WebSocket for Market Makers:**
- [ ] WS `/api/v1/mm/stream` - Real-time market data stream
  - Authenticate via API key
  - Push: order book updates, trade executions, order fills
  - Subscribe to specific certificate types

**Frontend (Backoffice):**
- [ ] `MMAPIActivityTab` - Monitor API activity
  - Recent API calls log
  - Order placement via API vs UI
  - API error log
  - Rate limit status

**Testing:**
- [ ] API order placement and cancellation
- [ ] Bulk order operations
- [ ] WebSocket authentication and streaming
- [ ] Rate limiting per API key
- [ ] Error handling and validation

**Estimated Time:** 10-12 hours

---

### Sprint 18: Market Maker Quoting & Inventory
**Goal:** Market makers maintain continuous quotes and manage inventory

**Backend:**
- [ ] POST `/api/v1/mm/quotes/update` - Update market maker quotes
  - Request: { certificate_type, bid_price, bid_quantity, ask_price, ask_quantity }
  - Automatically creates/updates LIMIT orders on both sides
  - Replaces previous quotes
- [ ] GET `/api/v1/mm/inventory` - Market maker inventory
  - Returns: holdings by certificate type, average cost, P&L
  - Includes positions from trades
- [ ] GET `/api/v1/mm/risk-metrics` - Risk exposure
  - Returns: net position, exposure by certificate type, capital at risk
  - Calculates delta, gamma (if applicable)
- [ ] Auto-quoting engine (background job)
  - Market maker can enable auto-quoting
  - Algorithm: maintain spread around mid-price
  - Parameters: spread_bps, max_position, refresh_interval

**Frontend (Backoffice):**
- [ ] `MMInventoryTab` - View market maker inventory
  - Holdings table (certificate, quantity, avg cost, current value, P&L)
  - Net position by certificate type
  - Risk metrics dashboard
- [ ] `MMQuotingTab` - Configure auto-quoting
  - Enable/Disable toggle
  - Parameters: spread, max position, refresh interval
  - Manual quote update interface
  - Quote history log

**Database:**
- [ ] Create `mm_quotes` table (optional, for history)
  - Fields: market_maker_id, certificate_type, bid_price, bid_qty, ask_price, ask_qty, timestamp
- [ ] Create `mm_auto_quoting_config` table
  - Fields: market_maker_id, enabled, spread_bps, max_position, refresh_interval_seconds

**Testing:**
- [ ] Quote update and order creation
- [ ] Inventory calculation accuracy
- [ ] Risk metrics correctness
- [ ] Auto-quoting algorithm
- [ ] Position limits enforcement

**Estimated Time:** 12-14 hours

---

## 📋 PHASE 4: Polish & Production

### Sprint 19: Notifications & Alerts
**Goal:** Comprehensive notification system for critical events

**Backend:**
- [ ] Create notification service
  - Email notifications (via Resend)
  - In-app notifications (stored in DB)
  - WebSocket push notifications
- [ ] Notification triggers:
  - Deposit confirmed / cleared / rejected
  - Withdrawal approved / rejected / completed
  - KYC documents approved / rejected
  - Order filled (partial or complete)
  - Trade executed
  - Settlement completed
  - Price alerts (user-configured)
  - AML hold expiring soon
- [ ] POST `/api/v1/notifications/preferences` - User sets preferences
  - Enable/disable per event type
  - Choose channels: email, in-app, SMS (future)
- [ ] GET `/api/v1/notifications` - Get user notifications
  - Pagination, filters (read/unread, type)
- [ ] PUT `/api/v1/notifications/{id}/mark-read` - Mark as read

**Frontend:**
- [ ] `NotificationCenter` - In-app notification dropdown
  - Bell icon with unread count badge
  - List of recent notifications
  - Mark as read action
  - Link to related resource (order, deposit, etc.)
- [ ] `NotificationPreferencesPage` - Configure notifications
  - Table of event types with enable/disable toggles
  - Email/In-app channel selection per event
  - Test notification button
- [ ] Toast notifications for real-time events
  - Order fills, trade executions
  - Auto-dismiss after N seconds

**Database:**
- [ ] Create `notifications` table
  - Fields: id, user_id, type, title, message, data (JSON), read_at, created_at
- [ ] Create `notification_preferences` table
  - Fields: user_id, event_type, email_enabled, in_app_enabled

**Email Templates:**
- [ ] Design HTML email templates for each event type
  - Branded header/footer
  - Clear call-to-action
  - Mobile-responsive

**Testing:**
- [ ] Notification creation on events
- [ ] Email delivery (test mode)
- [ ] WebSocket push notifications
- [ ] Preference updates
- [ ] Notification filtering and pagination

**Estimated Time:** 10-12 hours

---

### Sprint 20: Audit Logging & Compliance
**Goal:** Comprehensive audit trail for regulatory compliance

**Backend:**
- [ ] Enhance audit logging system
  - Log all critical actions: login, order placement, trade execution, withdrawals, admin actions
  - Include: user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, timestamp
- [ ] GET `/api/v1/admin/audit-logs` - Search audit logs
  - Filters: user, action, resource_type, date_range
  - Pagination (important: can be millions of records)
  - Export to CSV
- [ ] GET `/api/v1/admin/audit-logs/{resource_type}/{resource_id}` - Audit trail for specific resource
  - Returns: all actions on a specific order, deposit, user, etc.
  - Timeline view
- [ ] Implement log retention policy
  - Keep logs for N years (configurable)
  - Archive old logs to cold storage
- [ ] Tamper-proof logging
  - Hash chain or blockchain-based integrity verification (optional)

**Frontend (Backoffice):**
- [ ] `AuditLogsTab` - Search and view audit logs
  - Advanced filters
  - Timeline view
  - Export functionality
  - Log detail modal
- [ ] Inline audit trail in resource detail views
  - Show audit trail in order detail, user detail, etc.
  - "View full history" link

**Database:**
- [ ] Ensure `activity_logs` table is comprehensive
  - Add indexes for common queries
  - Partition by date for performance (optional)
- [ ] Create `audit_snapshots` table (optional)
  - Store periodic snapshots of critical data for reconciliation

**Compliance Reports:**
- [ ] Generate compliance reports
  - Daily transaction summary
  - User activity report
  - Failed login attempts
  - Suspicious activity alerts

**Testing:**
- [ ] Audit log creation on all critical actions
- [ ] Log search and filtering performance
- [ ] Data integrity checks
- [ ] Export functionality

**Estimated Time:** 8-10 hours

---

### Sprint 21: Performance Optimization
**Goal:** Optimize for production-level performance

**Backend Optimization:**
- [ ] Database query optimization
  - Identify slow queries (using pg_stat_statements)
  - Add missing indexes
  - Optimize N+1 queries
  - Use database views for complex aggregations
- [ ] Caching layer
  - Redis caching for frequently accessed data (prices, order book)
  - Cache invalidation strategy
  - TTL configuration
- [ ] Background job optimization
  - Use Celery or similar for heavy tasks
  - Order matching as background job
  - Settlement processing as background job
- [ ] API rate limiting
  - Per user/API key rate limits
  - Progressive rate limiting (warning → throttle → block)
- [ ] Load testing
  - Simulate 1000+ concurrent users
  - Identify bottlenecks
  - Optimize or scale horizontally

**Frontend Optimization:**
- [ ] Code splitting
  - Lazy load routes
  - Dynamic imports for modals
  - Reduce initial bundle size
- [ ] Asset optimization
  - Image optimization (WebP, lazy loading)
  - Font subsetting
  - Tree shaking unused code
- [ ] Rendering optimization
  - React.memo for expensive components
  - Virtual scrolling for large tables
  - Debounce search inputs
- [ ] Bundle analysis
  - Identify large dependencies
  - Replace or remove if possible

**Database:**
- [ ] Add composite indexes for common query patterns
- [ ] Implement connection pooling (pgbouncer)
- [ ] Set up read replicas (future)

**Monitoring:**
- [ ] Set up APM (Application Performance Monitoring)
  - Track slow endpoints
  - Monitor database queries
  - Alert on performance degradation
- [ ] Set up error tracking (Sentry or similar)

**Testing:**
- [ ] Load testing with realistic scenarios
  - Login surge
  - Order book updates (high frequency)
  - Concurrent trades
- [ ] Stress testing to find breaking points
- [ ] Performance benchmarks before/after optimization

**Estimated Time:** 12-15 hours

---

### Sprint 22: Security Hardening & Production Readiness
**Goal:** Production-grade security and deployment readiness

**Security Enhancements:**
- [ ] Security audit
  - OWASP Top 10 checklist
  - SQL injection prevention (verify parameterized queries)
  - XSS prevention (sanitize inputs)
  - CSRF protection
  - Rate limiting on all endpoints
- [ ] Secrets management
  - Move all secrets to environment variables
  - Use AWS Secrets Manager or HashiCorp Vault (production)
  - Rotate API keys and database credentials
- [ ] TLS/SSL configuration
  - Enforce HTTPS everywhere
  - Configure strong cipher suites
  - HSTS headers
- [ ] Content Security Policy (CSP)
  - Restrict script sources
  - Prevent inline scripts
- [ ] Input validation and sanitization
  - Validate all user inputs on backend
  - Sanitize before rendering in frontend
- [ ] Dependency audit
  - Run `npm audit` and `pip-audit`
  - Update vulnerable dependencies
  - Remove unused dependencies

**Deployment:**
- [ ] Dockerize application
  - Multi-stage builds
  - Optimize image size
  - Security scanning (Trivy)
- [ ] CI/CD pipeline
  - GitHub Actions or GitLab CI
  - Automated tests on every commit
  - Staging deployment on merge to develop
  - Production deployment on merge to main
- [ ] Infrastructure as Code
  - Terraform or CloudFormation
  - Define: EC2/ECS, RDS, Redis, Load Balancer, CloudFront
- [ ] Database migrations
  - Blue-green deployment strategy
  - Rollback plan
- [ ] Monitoring and alerting
  - CloudWatch / Datadog / Prometheus
  - Alert on: error rates, latency, server down, database connection issues

**Documentation:**
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Admin user guide
- [ ] Client user guide
- [ ] Deployment runbook
- [ ] Incident response playbook

**Compliance:**
- [ ] GDPR compliance check
  - Data retention policies
  - Right to be forgotten
  - Data export functionality
- [ ] KYC/AML compliance documentation
- [ ] Terms of Service and Privacy Policy

**Testing:**
- [ ] Penetration testing (hire security firm or use automated tools)
- [ ] Disaster recovery testing
  - Backup restoration
  - Failover testing
- [ ] End-to-end production readiness checklist

**Estimated Time:** 15-18 hours

---

## 🎯 Summary & Timeline

### Total Estimated Time: **200-240 hours** (5-6 weeks at 40 hours/week)

### Phase Breakdown:
- **Phase 1 (Backoffice Completion):** 32-40 hours (~1 week)
- **Phase 2 (Client Journey):** 68-82 hours (~2 weeks)
- **Phase 3 (Market Maker Integration):** 30-36 hours (~1 week)
- **Phase 4 (Polish & Production):** 45-55 hours (~1.5 weeks)
- **Buffer for unexpected issues:** ~20% = 40-48 hours

---

## 🚀 Next Steps

### Immediate Actions:
1. **Review and approve this plan**
2. **Prioritize sprints** (can be reordered based on business needs)
3. **Set up Sprint 5** in `.claude/sprint/5/`
4. **Start implementation** using the sprint workflow

### Sprint Workflow (Standard Process):
```bash
# 1. Create new sprint
/sprint:new

# 2. Edit specs.md with sprint details from this plan

# 3. Run sprint workflow
/sprint

# 4. Review implementation reports
# - Check conformity
# - Test functionality
# - Fix issues if needed

# 5. Commit and merge when complete

# 6. Repeat for next sprint
```

---

## 📝 Notes

- **Flexibility:** Sprints can be reordered based on business priorities
- **Dependencies:** Some sprints have dependencies (e.g., Sprint 11 requires Sprint 10)
- **Parallel Work:** Multiple developers can work on different sprints simultaneously
- **Testing:** Each sprint includes testing; comprehensive E2E testing should be done before production
- **Documentation:** Update documentation as features are implemented
- **Feedback Loop:** Gather user feedback after each phase and adjust plan if needed

---

**Last Updated:** 2026-01-26
**Version:** 1.0
**Status:** Ready for implementation
