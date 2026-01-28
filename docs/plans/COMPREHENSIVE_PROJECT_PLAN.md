# Niha Carbon Platform - Comprehensive Project Plan

**Version:** 2.0
**Date:** 2026-01-27
**Status:** Active Development

---

## Executive Summary

This document provides a complete, actionable project plan for finalizing the Niha Carbon Trading Platform. It consolidates all requirements from the existing documentation, identifies gaps between current implementation and desired state, and provides detailed sprint specifications.

---

## Part I: Current State Analysis

### 1.1 Implemented Features (Production-Ready)

| Category | Feature | Status | Notes |
|----------|---------|--------|-------|
| **Authentication** | JWT + Redis sessions | COMPLETE | Role-based access (ADMIN, PENDING, APPROVED, FUNDED, MARKET_MAKER) |
| **User Management** | Admin user creation | COMPLETE | Manual + invitation flow |
| | Password setup via token | COMPLETE | Invitation token validation |
| | Role transitions | COMPLETE | PENDING -> APPROVED -> FUNDED |
| **KYC System** | Document upload | COMPLETE | 8 document types supported |
| | Admin review workflow | COMPLETE | Approve/reject with notes |
| | KYC status tracking | COMPLETE | Per-document and entity-level |
| **Market Makers** | CRUD operations | COMPLETE | Active/inactive toggle |
| | Asset management (CEA/EUA) | COMPLETE | Deposit/withdrawal with audit |
| | Order placement (BID/ASK) | COMPLETE | Full matching engine integration |
| | Ticket audit logging | COMPLETE | TKT-YYYY-NNNNNN format |
| **Cash Market** | Order book display | COMPLETE | Professional UI with depth |
| | Order matching engine | COMPLETE | Price-time priority (FIFO) |
| | Trade execution | COMPLETE | Buyer/seller balance updates |
| | Market orders (BUY) | PARTIAL | User BUY only via full balance |
| **Settlement** | T+3 settlement batches | COMPLETE | CEA purchase flow |
| | Status progression | COMPLETE | PENDING -> TRANSFER_INITIATED -> IN_TRANSIT -> AT_CUSTODY -> SETTLED |
| | Background processor | COMPLETE | Hourly status updates |
| | Settlement timeline UI | COMPLETE | Client view with progress |
| **Swap Market** | Swap offers display | PARTIAL | UI exists, backend partial |
| | CEA->EUA conversion | PARTIAL | Settlement type defined |
| **Backoffice** | Dashboard overview | COMPLETE | Cards for all sections |
| | Users management | COMPLETE | List, edit, role changes |
| | Deposits tab | PARTIAL | Missing AML hold management |
| | Contact requests | COMPLETE | View, update status |
| **Frontend** | Design system | COMPLETE | Navy + Emerald theme |
| | Responsive layout | COMPLETE | Mobile-friendly |
| | TypeScript types | COMPLETE | 0 compilation errors |
| **Testing** | Frontend tests | COMPLETE | 132 tests, vitest + MSW |
| | Backend tests | PARTIAL | pytest setup, needs expansion |

### 1.2 Partially Implemented Features

| Feature | Current State | Missing Components |
|---------|---------------|-------------------|
| **AML Hold Management** | Design complete | Backend endpoints, Frontend UI, Hold calculation |
| **Deposit Client Flow** | Backend schema exists | Client announcement endpoint, My deposits view |
| **Withdrawal System** | Not started | Full implementation required |
| **Transaction History** | Basic trades list | Unified view, filters, export |
| **Email Notifications** | Resend configured | Templates, trigger points |
| **Swap Execution** | Settlement types defined | Full swap flow, matching |
| **Client Onboarding** | Entity exists | Enhanced multi-step wizard |
| **Portfolio View** | Dashboard balance | P&L, performance charts |

### 1.3 Not Started Features

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| Market Maker API (external) | Medium | High | API key auth |
| Auto-quoting engine | Low | High | MM API |
| Reconciliation reports | Medium | Medium | Transaction history |
| Push notifications | Low | Medium | Email first |
| Mobile app | Low | Very High | Web complete |

---

## Part II: Architecture Overview

### 2.1 System Architecture

```
                                    +------------------+
                                    |   Load Balancer  |
                                    +--------+---------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
          +---------v---------+    +---------v---------+    +---------v---------+
          |   Frontend (React)|    |   Backend (FastAPI)|    |   WebSocket       |
          |   Vite + TS       |    |   Python 3.12     |    |   Real-time       |
          |   Port: 5173      |    |   Port: 8000      |    |   notifications   |
          +---------+---------+    +---------+---------+    +---------+---------+
                    |                        |                        |
                    |              +---------v---------+              |
                    |              |   Redis           |              |
                    +------------->|   Sessions/Cache  |<-------------+
                                   |   Port: 6379      |
                                   +---------+---------+
                                             |
                                   +---------v---------+
                                   |   PostgreSQL 15   |
                                   |   Main Database   |
                                   |   Port: 5432      |
                                   +-------------------+
```

### 2.2 Data Model Summary

**Core Entities:**
- `User` - Authentication, roles, profile
- `Entity` - Company/individual with KYC, balances
- `MarketMakerClient` - Liquidity providers
- `Order` - BUY/SELL orders in cash market
- `CashMarketTrade` - Executed trades
- `SettlementBatch` - T+N settlement tracking
- `Deposit` - Wire transfer tracking
- `EntityHolding` - Asset balances (EUR, CEA, EUA)
- `AssetTransaction` - Audit trail for all movements
- `TicketLog` - Comprehensive action logging

### 2.3 User Journey States

```
CONTACT_REQUEST --> NDA_SIGNED --> USER_CREATED (PENDING)
                                         |
                                         v
                              ONBOARDING_COMPLETE (PENDING)
                                         |
                                         v
                                KYC_APPROVED (APPROVED)
                                         |
                                         v
                              FIRST_DEPOSIT (ON_HOLD)
                                         |
                                         v
                              DEPOSIT_CLEARED (FUNDED)
                                         |
                                         v
                                    TRADING_ENABLED
```

---

## Part III: Implementation Phases

### Phase 1: Backoffice Completion (Sprints 5-8)
**Timeline:** 2-3 weeks
**Priority:** CRITICAL - Required for operations

### Phase 2: Client Journey (Sprints 9-15)
**Timeline:** 4-5 weeks
**Priority:** HIGH - Core revenue functionality

### Phase 3: Market Maker Integration (Sprints 16-18)
**Timeline:** 2 weeks
**Priority:** MEDIUM - Liquidity optimization

### Phase 4: Polish & Production (Sprints 19-22)
**Timeline:** 2-3 weeks
**Priority:** HIGH - Production readiness

---

## Part IV: Detailed Sprint Specifications

---

## SPRINT 5: Deposit Management - Client Announcement & AML Hold

**Duration:** 3-4 days
**Priority:** P0 (Critical)
**Dependencies:** None

### Business Requirements
1. Clients must be able to announce incoming wire transfers
2. Admin must confirm receipt and trigger AML hold
3. Hold period: 1-3 business days based on rules
4. Admin manually approves/rejects after hold expires

### 5.1 Database Changes

**Migration: Add AML fields to deposits table**

```sql
-- New columns for deposits table
ALTER TABLE deposits ADD COLUMN hold_type VARCHAR(50);  -- FIRST_DEPOSIT, SUBSEQUENT, LARGE_AMOUNT
ALTER TABLE deposits ADD COLUMN hold_days_required INTEGER;
ALTER TABLE deposits ADD COLUMN hold_expires_at TIMESTAMP;
ALTER TABLE deposits ADD COLUMN aml_status VARCHAR(50) DEFAULT 'PENDING';  -- PENDING, ON_HOLD, CLEARED, REJECTED
ALTER TABLE deposits ADD COLUMN cleared_at TIMESTAMP;
ALTER TABLE deposits ADD COLUMN cleared_by_admin_id UUID REFERENCES users(id);
ALTER TABLE deposits ADD COLUMN rejected_at TIMESTAMP;
ALTER TABLE deposits ADD COLUMN rejected_by_admin_id UUID REFERENCES users(id);
ALTER TABLE deposits ADD COLUMN rejection_reason TEXT;
ALTER TABLE deposits ADD COLUMN admin_notes TEXT;
ALTER TABLE deposits ADD COLUMN source_bank VARCHAR(255);
ALTER TABLE deposits ADD COLUMN source_iban VARCHAR(50);
ALTER TABLE deposits ADD COLUMN source_swift VARCHAR(20);

-- Update status enum
-- Add: ON_HOLD to DepositStatus enum

-- Create indexes
CREATE INDEX idx_deposits_aml_status ON deposits(aml_status);
CREATE INDEX idx_deposits_hold_expires_at ON deposits(hold_expires_at);
```

### 5.2 Backend Endpoints

**New endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/funding/deposits/announce` | Client announces wire transfer | User |
| GET | `/api/v1/funding/deposits/my-deposits` | List client's deposits | User |
| GET | `/api/v1/funding/wire-instructions` | Get bank details for wire | User |
| POST | `/api/v1/admin/deposits/{id}/confirm` | Admin confirms wire received | Admin |
| POST | `/api/v1/admin/deposits/{id}/approve` | Admin approves after AML hold | Admin |
| POST | `/api/v1/admin/deposits/{id}/reject` | Admin rejects with reason | Admin |
| GET | `/api/v1/admin/deposits` | List all deposits with filters | Admin |
| GET | `/api/v1/admin/deposits/{id}` | Deposit detail with context | Admin |

**Request/Response Schemas:**

```python
# POST /funding/deposits/announce
class DepositAnnouncementRequest(BaseModel):
    amount: Decimal
    currency: str  # EUR, USD, GBP
    source_bank: str
    source_iban: Optional[str]
    source_swift: Optional[str]
    wire_reference: Optional[str]
    notes: Optional[str]

class DepositAnnouncementResponse(BaseModel):
    deposit_id: UUID
    wire_instructions: WireInstructions
    expected_hold_type: str
    expected_hold_days: int
    message: str

# POST /admin/deposits/{id}/confirm
class DepositConfirmRequest(BaseModel):
    actual_amount: Decimal
    actual_currency: str
    received_at: datetime
    admin_notes: Optional[str]

# POST /admin/deposits/{id}/approve
class DepositApproveRequest(BaseModel):
    admin_notes: Optional[str]

# POST /admin/deposits/{id}/reject
class DepositRejectRequest(BaseModel):
    reason: str  # SUSPICIOUS_ACTIVITY, INCOMPLETE_KYC, AML_COMPLIANCE_CONCERN, etc.
    reason_details: str
    admin_notes: Optional[str]
```

### 5.3 Business Logic

**Hold Period Calculation:**

```python
def calculate_hold_period(user_id: UUID, amount: Decimal) -> Tuple[str, int]:
    """
    Calculate hold type and days based on:
    1. Large amount (>500K EUR): 3 business days
    2. First deposit (>=50K EUR): 2 business days
    3. First deposit (<50K EUR): 1 business day
    4. Subsequent deposit: 1 business day

    Returns: (hold_type, hold_days)
    """
    if amount > 500000:
        return ("LARGE_AMOUNT", 3)

    # Check if first deposit
    previous_deposits = get_cleared_deposits(user_id)
    if len(previous_deposits) == 0:
        if amount >= 50000:
            return ("FIRST_DEPOSIT", 2)
        return ("FIRST_DEPOSIT", 1)

    # Check if >24 months since last deposit
    last_deposit = previous_deposits[0]
    months_since = (datetime.now() - last_deposit.cleared_at).days / 30
    if months_since > 24:
        return ("FIRST_DEPOSIT", 2)

    return ("SUBSEQUENT", 1)


def calculate_hold_expiry(received_at: datetime, hold_days: int) -> datetime:
    """
    Calculate hold expiry date, skipping weekends.
    """
    expiry = received_at
    days_added = 0
    while days_added < hold_days:
        expiry += timedelta(days=1)
        if expiry.weekday() < 5:  # Monday = 0, Friday = 4
            days_added += 1
    return expiry
```

### 5.4 Frontend Components

**New Components:**

1. **DepositAnnouncementModal** (`/components/funding/DepositAnnouncementModal.tsx`)
   - Form: amount, currency, source bank, IBAN, notes
   - Shows wire instructions after submission
   - Validation: positive amount, required fields

2. **MyDepositsTab** (`/components/dashboard/MyDepositsTab.tsx`)
   - Table: date, amount, status, hold info
   - Status badges with colors
   - Click to expand details

3. **DepositsTab** (Backoffice) (`/components/backoffice/DepositsTab.tsx`)
   - Filter bar: status, date range, amount range, search
   - Table: client, entity, amount, wire ref, received, status, hold expires, actions
   - Badge counter for pending review

4. **DepositReviewModal** (`/components/backoffice/DepositReviewModal.tsx`)
   - Deposit details section
   - Client information section
   - Previous deposits history
   - AML risk indicator
   - Notes textarea
   - Approve/Reject buttons

5. **RejectionReasonModal** (`/components/backoffice/RejectionReasonModal.tsx`)
   - Reason dropdown
   - Additional details textarea
   - Confirm/Cancel

### 5.5 Acceptance Criteria

- [ ] Client can announce deposit with bank details
- [ ] System calculates hold period automatically
- [ ] Admin sees pending deposits in backoffice
- [ ] Admin can confirm wire receipt
- [ ] Deposit transitions to ON_HOLD with expiry date
- [ ] Admin can approve after hold expires
- [ ] Admin can reject with reason
- [ ] Client balance updates on approval
- [ ] Complete audit trail for all actions
- [ ] Email notification stubs in place

### 5.6 Testing Scenarios

1. First deposit >= 50K -> 2 day hold
2. First deposit < 50K -> 1 day hold
3. Large deposit > 500K -> 3 day hold
4. Subsequent deposit -> 1 day hold
5. Hold expiry calculation skips weekends
6. Cannot approve before hold expires (optional warning)
7. Rejection stores reason and notifies client
8. Balance correctly updated on approval

---

## SPRINT 6: Withdrawal Management

**Duration:** 4-5 days
**Priority:** P0 (Critical)
**Dependencies:** Sprint 5 (Deposit flow for balance context)

### 6.1 Database Changes

```sql
-- New table: withdrawals
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Request details
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,

    -- Bank details (ad-hoc, not pre-registered)
    bank_iban VARCHAR(50) NOT NULL,
    bank_swift VARCHAR(20),
    bank_name VARCHAR(255) NOT NULL,
    bank_country VARCHAR(100),
    account_holder_name VARCHAR(255) NOT NULL,

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED

    -- Processing
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    wire_transfer_reference VARCHAR(100),

    -- Rejection
    rejected_at TIMESTAMP,
    rejected_by UUID REFERENCES users(id),
    rejection_reason TEXT,

    -- Audit
    admin_notes TEXT,
    client_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_entity_id ON withdrawals(entity_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);
```

### 6.2 Backend Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/funding/withdrawals/request` | Client requests withdrawal | User |
| GET | `/api/v1/funding/withdrawals/my-withdrawals` | List client's withdrawals | User |
| POST | `/api/v1/funding/withdrawals/{id}/cancel` | Client cancels pending withdrawal | User |
| GET | `/api/v1/admin/withdrawals` | List all withdrawals with filters | Admin |
| GET | `/api/v1/admin/withdrawals/{id}` | Withdrawal detail | Admin |
| POST | `/api/v1/admin/withdrawals/{id}/approve` | Admin approves | Admin |
| POST | `/api/v1/admin/withdrawals/{id}/reject` | Admin rejects with reason | Admin |
| POST | `/api/v1/admin/withdrawals/{id}/mark-processing` | Mark wire initiated | Admin |
| POST | `/api/v1/admin/withdrawals/{id}/complete` | Mark completed with ref | Admin |

### 6.3 Business Logic

```python
async def request_withdrawal(user_id: UUID, request: WithdrawalRequest) -> Withdrawal:
    """
    Create withdrawal request with validations.
    """
    entity = await get_user_entity(user_id)

    # Validation 1: KYC approved
    if entity.kyc_status != KYCStatus.APPROVED:
        raise HTTPException(400, "KYC not approved")

    # Validation 2: Sufficient balance
    available_balance = await get_available_balance(entity.id, request.currency)
    if available_balance < request.amount:
        raise HTTPException(400, f"Insufficient balance. Available: {available_balance}")

    # Validation 3: IBAN format (basic)
    if not validate_iban_format(request.bank_iban):
        raise HTTPException(400, "Invalid IBAN format")

    # Lock the funds
    await lock_balance(entity.id, request.amount, request.currency)

    # Create withdrawal record
    withdrawal = Withdrawal(
        entity_id=entity.id,
        user_id=user_id,
        amount=request.amount,
        currency=request.currency,
        bank_iban=request.bank_iban,
        bank_swift=request.bank_swift,
        bank_name=request.bank_name,
        account_holder_name=request.account_holder_name,
        status="PENDING",
        client_notes=request.notes
    )

    # Create audit transaction
    await create_asset_transaction(
        entity_id=entity.id,
        transaction_type=TransactionType.WITHDRAWAL_PENDING,
        amount=-request.amount,  # Negative for debit
        notes=f"Withdrawal request to {request.bank_name}"
    )

    # Notify admin (stub)
    await notify_admin_new_withdrawal(withdrawal)

    return withdrawal


async def approve_withdrawal(withdrawal_id: UUID, admin_id: UUID, notes: str) -> Withdrawal:
    """
    Approve withdrawal and deduct from balance.
    """
    withdrawal = await get_withdrawal(withdrawal_id)

    if withdrawal.status != "PENDING":
        raise HTTPException(400, "Can only approve PENDING withdrawals")

    # Deduct from entity balance
    await deduct_balance(withdrawal.entity_id, withdrawal.amount, withdrawal.currency)

    # Update withdrawal
    withdrawal.status = "APPROVED"
    withdrawal.approved_at = datetime.utcnow()
    withdrawal.approved_by = admin_id
    withdrawal.admin_notes = notes

    # Create audit log
    await create_audit_log(
        action="WITHDRAWAL_APPROVED",
        admin_id=admin_id,
        resource_type="WITHDRAWAL",
        resource_id=withdrawal_id
    )

    # Notify client (stub)
    await notify_client_withdrawal_approved(withdrawal)

    return withdrawal
```

### 6.4 Frontend Components

1. **WithdrawalRequestModal** (`/components/funding/WithdrawalRequestModal.tsx`)
   - Form: amount, currency, bank details
   - IBAN validator
   - Available balance display
   - Confirmation step

2. **MyWithdrawalsTab** (`/components/dashboard/MyWithdrawalsTab.tsx`)
   - Table with status timeline
   - Cancel button for pending
   - Track wire status

3. **WithdrawalsTab** (Backoffice) (`/components/backoffice/WithdrawalsTab.tsx`)
   - Filter bar
   - Table: client, amount, bank, status, dates, actions
   - Approve/Reject/Complete actions

4. **WithdrawalDetailModal** (`/components/backoffice/WithdrawalDetailModal.tsx`)
   - Full details view
   - Bank information display
   - Status timeline
   - Action buttons based on current status

### 6.5 Acceptance Criteria

- [ ] Client can request withdrawal with bank details
- [ ] System validates KYC and balance
- [ ] Funds locked immediately on request
- [ ] Client can cancel pending withdrawals
- [ ] Admin sees withdrawals in backoffice
- [ ] Admin can approve (balance deducted)
- [ ] Admin can reject with reason (funds unlocked)
- [ ] Admin can mark as processing (wire initiated)
- [ ] Admin can mark as completed (wire reference stored)
- [ ] Full audit trail for all status changes

---

## SPRINT 7: Transaction History & Reporting

**Duration:** 3-4 days
**Priority:** P1 (High)
**Dependencies:** Sprints 5-6

### 7.1 Backend Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/transactions` | Unified transaction history | User |
| GET | `/api/v1/transactions/export` | Export to CSV | User |
| GET | `/api/v1/admin/reports/transactions` | Admin transaction report | Admin |
| GET | `/api/v1/admin/reports/balances` | All balances snapshot | Admin |
| GET | `/api/v1/admin/reports/daily-summary` | Daily activity summary | Admin |

### 7.2 Transaction View

```python
class TransactionView(BaseModel):
    """Unified transaction view combining all transaction types"""
    id: UUID
    date: datetime
    type: str  # DEPOSIT, WITHDRAWAL, TRADE_BUY, TRADE_SELL, SWAP, SETTLEMENT
    description: str
    amount: Decimal
    currency: str
    balance_after: Optional[Decimal]
    status: str
    reference: str
    counterparty: Optional[str]
    details: Optional[dict]
```

### 7.3 Frontend Components

1. **TransactionHistoryTab** (`/components/dashboard/TransactionHistoryTab.tsx`)
   - Unified timeline view
   - Filters: type, date range, status
   - Search by reference
   - Expandable details
   - Export button

2. **ReportsTab** (Backoffice) (`/components/backoffice/ReportsTab.tsx`)
   - Transaction volume chart
   - Balance overview cards
   - Daily summary table
   - Export tools

### 7.4 Acceptance Criteria

- [ ] Client sees all transactions in one view
- [ ] Filters work correctly
- [ ] Export to CSV works
- [ ] Admin sees aggregated reports
- [ ] Performance acceptable with large datasets

---

## SPRINT 8: Email Notifications System

**Duration:** 2-3 days
**Priority:** P1 (High)
**Dependencies:** Sprints 5-7 (trigger points)

### 8.1 Email Templates

| Event | Template | Recipients |
|-------|----------|------------|
| Deposit announced | deposit_announced.html | Admin |
| Deposit confirmed | deposit_confirmed.html | Client |
| Deposit cleared | deposit_cleared.html | Client |
| Deposit rejected | deposit_rejected.html | Client |
| Withdrawal requested | withdrawal_requested.html | Admin |
| Withdrawal approved | withdrawal_approved.html | Client |
| Withdrawal rejected | withdrawal_rejected.html | Client |
| Withdrawal completed | withdrawal_completed.html | Client |
| Trade executed | trade_executed.html | Client |
| Settlement completed | settlement_completed.html | Client |
| KYC approved | kyc_approved.html | Client |
| KYC rejected | kyc_rejected.html | Client |

### 8.2 Email Service

```python
class EmailService:
    def __init__(self):
        self.resend = Resend(api_key=settings.RESEND_API_KEY)

    async def send_email(
        self,
        to: str,
        template: str,
        subject: str,
        context: dict
    ) -> bool:
        """Send email using Resend with Jinja2 templates"""
        html = render_template(template, context)

        try:
            self.resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": to,
                "subject": subject,
                "html": html
            })
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False
```

### 8.3 Template Structure

```html
<!-- base_email.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #1E293B; color: white; padding: 20px; }
        .content { padding: 30px; }
        .footer { background: #f5f5f5; padding: 20px; font-size: 12px; }
        .button { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="logo.png" alt="Niha" />
        </div>
        <div class="content">
            {% block content %}{% endblock %}
        </div>
        <div class="footer">
            Niha Carbon Platform | support@nihaogroup.com
        </div>
    </div>
</body>
</html>
```

### 8.4 Acceptance Criteria

- [ ] All email templates created and styled
- [ ] Emails trigger at correct events
- [ ] Resend integration working
- [ ] Failed emails logged for retry
- [ ] Unsubscribe link (future)

---

## SPRINT 9: Enhanced Client Onboarding

**Duration:** 3-4 days
**Priority:** P1 (High)
**Dependencies:** None

### 9.1 Multi-Step Wizard

```
Step 1: Entity Type Selection
    - Company or Individual
    - Jurisdiction selection

Step 2: Entity Details
    - Legal name
    - Registration number
    - Address (line1, line2, city, postal, country)
    - Tax ID
    - Website (optional)

Step 3: Representative Details
    - Name, position, email, phone
    - Proof of authority upload

Step 4: KYC Documents
    - Company: Registration cert, articles, financials
    - Individual: ID, proof of address

Step 5: Review & Submit
    - Summary of all information
    - Agreement checkboxes
    - Submit for review
```

### 9.2 Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/onboarding/entity` | Create entity draft |
| PUT | `/api/v1/onboarding/entity/{id}` | Update entity details |
| POST | `/api/v1/onboarding/entity/{id}/submit` | Submit for review |
| GET | `/api/v1/onboarding/status` | Get onboarding progress |
| GET | `/api/v1/onboarding/checklist` | Get required documents |

### 9.3 Database Changes

```sql
-- Enhance entities table
ALTER TABLE entities ADD COLUMN address_line1 VARCHAR(255);
ALTER TABLE entities ADD COLUMN address_line2 VARCHAR(255);
ALTER TABLE entities ADD COLUMN city VARCHAR(100);
ALTER TABLE entities ADD COLUMN postal_code VARCHAR(20);
ALTER TABLE entities ADD COLUMN country VARCHAR(100);
ALTER TABLE entities ADD COLUMN tax_id VARCHAR(50);
ALTER TABLE entities ADD COLUMN incorporation_date DATE;
ALTER TABLE entities ADD COLUMN website VARCHAR(255);
ALTER TABLE entities ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'DRAFT';
-- DRAFT, SUBMITTED, APPROVED, CHANGES_REQUESTED
```

### 9.4 Frontend Components

1. **OnboardingWizard** - Main wizard container
2. **EntityTypeStep** - Type and jurisdiction
3. **EntityDetailsStep** - Legal details form
4. **RepresentativeStep** - Contact info
5. **DocumentsStep** - KYC upload
6. **ReviewStep** - Summary and submit

### 9.5 Acceptance Criteria

- [ ] User can complete multi-step wizard
- [ ] Progress saved between steps
- [ ] All validations work
- [ ] Documents uploaded successfully
- [ ] Admin notified on submission
- [ ] User can track status

---

## SPRINT 10: Client KYC Document Upload

**Duration:** 2-3 days
**Priority:** P1 (High)
**Dependencies:** Sprint 9

### 10.1 Features

- Client-initiated document upload
- Document preview before upload
- File size and type validation
- Document status tracking
- Re-upload rejected documents

### 10.2 Backend

```python
# Endpoints
POST /api/v1/kyc/documents/upload  # Upload document
GET /api/v1/kyc/documents/my-documents  # List user's documents
DELETE /api/v1/kyc/documents/{id}  # Delete pending/rejected document
GET /api/v1/kyc/status  # Overall KYC status

# File validation
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"]
```

### 10.3 Frontend Components

1. **KYCUploadPanel** - Document upload interface
2. **DocumentDropzone** - Drag-and-drop file upload
3. **DocumentPreview** - Preview uploaded files
4. **KYCStatusCard** - Overall status display

---

## SPRINT 11: Marketplace Browse & Discover

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** Sprints 5-6 (Funded users)

### 11.1 Features

- Browse available certificates
- Price history charts
- Market statistics
- Certificate detail view

### 11.2 Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/marketplace/certificates` | List available certs |
| GET | `/api/v1/marketplace/certificates/{id}` | Certificate detail |
| GET | `/api/v1/marketplace/price-history` | Historical prices |
| GET | `/api/v1/marketplace/statistics` | Market stats |

### 11.3 Frontend

1. **MarketplacePage** - Main browse view
2. **CertificateCard** - Certificate summary card
3. **CertificateDetailModal** - Full details
4. **PriceChart** - Historical price chart
5. **MarketStats** - Volume, trends display

---

## SPRINT 12: Order Placement - Buy/Sell

**Duration:** 4-5 days
**Priority:** P1 (High)
**Dependencies:** Sprint 11

### 12.1 Order Entry Features

- Market orders (immediate execution at best price)
- Limit orders (wait for price)
- Order preview with fee calculation
- Balance/certificate validation

### 12.2 Backend Logic

```python
async def place_order(user_id: UUID, request: OrderRequest) -> Order:
    """
    Place a new order with full validation.
    """
    entity = await get_user_entity(user_id)

    # Validation based on side
    if request.side == OrderSide.BUY:
        # Check EUR balance
        required_eur = request.quantity * request.price
        available_eur = await get_available_balance(entity.id, "EUR")
        if available_eur < required_eur:
            raise HTTPException(400, "Insufficient EUR balance")

        # Lock EUR
        await lock_balance(entity.id, required_eur, "EUR")

    elif request.side == OrderSide.SELL:
        # Check certificate balance
        cert_type = request.certificate_type
        available_certs = await get_available_certificates(entity.id, cert_type)
        if available_certs < request.quantity:
            raise HTTPException(400, f"Insufficient {cert_type} balance")

        # Lock certificates
        await lock_certificates(entity.id, cert_type, request.quantity)

    # Create order
    order = Order(
        entity_id=entity.id,
        certificate_type=request.certificate_type,
        side=request.side,
        price=request.price,
        quantity=request.quantity,
        market=MarketType.CEA_CASH,
        status=OrderStatus.OPEN
    )

    # Attempt immediate match
    if request.order_type == "MARKET":
        await attempt_immediate_match(order)

    return order
```

### 12.3 Frontend Components

1. **OrderEntryPanel** - Place order form
2. **OrderPreview** - Preview before submit
3. **MyOrdersTab** - Active and historical orders
4. **OrderDetailModal** - Order details and fills

---

## SPRINT 13: Trade Execution & Matching Engine

**Duration:** 4-5 days
**Priority:** P1 (High)
**Dependencies:** Sprint 12

### 13.1 Matching Algorithm

```python
async def match_orders():
    """
    FIFO Price-Time Priority Matching
    """
    # Get open buy orders sorted by price DESC, time ASC
    buy_orders = await get_open_orders(OrderSide.BUY, "price DESC, created_at ASC")

    for buy_order in buy_orders:
        # Get matching sell orders (price <= buy price)
        sell_orders = await get_matching_sell_orders(buy_order.price)

        for sell_order in sell_orders:
            if buy_order.filled:
                break

            # Calculate fill quantity
            fill_qty = min(
                buy_order.quantity - buy_order.filled_quantity,
                sell_order.quantity - sell_order.filled_quantity
            )

            # Execute trade at sell order price (taker pays)
            await execute_trade(buy_order, sell_order, fill_qty, sell_order.price)

            # Update order fills
            buy_order.filled_quantity += fill_qty
            sell_order.filled_quantity += fill_qty

            # Update order status
            await update_order_status(buy_order)
            await update_order_status(sell_order)
```

### 13.2 Trade Execution

```python
async def execute_trade(buy_order, sell_order, quantity, price):
    """
    Execute trade between buyer and seller.
    """
    total_value = quantity * price

    # Create trade record
    trade = CashMarketTrade(
        buy_order_id=buy_order.id,
        sell_order_id=sell_order.id,
        certificate_type=buy_order.certificate_type,
        quantity=quantity,
        price=price
    )

    # Transfer assets
    # Buyer: EUR -> Seller
    await transfer_eur(buy_order.entity_id, sell_order.entity_id, total_value)

    # Seller: Certificates -> Buyer
    await transfer_certificates(
        sell_order.entity_id,
        buy_order.entity_id,
        buy_order.certificate_type,
        quantity
    )

    # Create settlement batch
    await create_settlement_batch(trade)

    # Send notifications
    await notify_trade_executed(buy_order.entity_id, trade)
    await notify_trade_executed(sell_order.entity_id, trade)

    return trade
```

---

## SPRINT 14: Portfolio & Positions Management

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** Sprints 12-13

### 14.1 Features

- Portfolio summary (total value, P&L)
- Position breakdown by asset
- Performance chart over time
- Activity feed

### 14.2 Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/portfolio/summary` | Portfolio overview |
| GET | `/api/v1/portfolio/positions` | Detailed positions |
| GET | `/api/v1/portfolio/performance` | Performance metrics |
| GET | `/api/v1/portfolio/activity` | Recent activity |

### 14.3 Frontend

1. **PortfolioPage** - Main portfolio view
2. **PortfolioSummary** - Value cards
3. **PositionsTable** - Holdings breakdown
4. **PerformanceChart** - Value over time
5. **ActivityFeed** - Recent transactions

---

## SPRINT 15: Settlement Integration - Client View

**Duration:** 2-3 days
**Priority:** P1 (High)
**Dependencies:** Sprint 13

### 15.1 Features

- View pending settlements
- Settlement timeline
- Confirm receipt (optional)
- Track delivery

### 15.2 Components

1. **SettlementsTab** - List view
2. **SettlementTimeline** - Status progression
3. **SettlementDetailModal** - Full details

---

## SPRINT 16: Market Maker API & Authentication

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** None (can run parallel)

### 16.1 API Key System

```sql
CREATE TABLE mm_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_maker_id UUID NOT NULL REFERENCES market_maker_clients(id),
    key_hash VARCHAR(255) NOT NULL,  -- bcrypt hash of API key
    key_prefix VARCHAR(10) NOT NULL,  -- First 10 chars for identification
    name VARCHAR(100) NOT NULL,  -- Descriptive name
    scopes TEXT[] NOT NULL,  -- ['orders:read', 'orders:write', ...]
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

### 16.2 API Key Authentication

```python
async def authenticate_api_key(api_key: str) -> MarketMakerClient:
    """
    Authenticate request using X-API-Key header.
    """
    key_prefix = api_key[:10]

    # Find key by prefix
    api_key_record = await db.execute(
        select(MMAPIKey).where(
            MMAPIKey.key_prefix == key_prefix,
            MMAPIKey.is_active == True
        )
    )

    if not api_key_record:
        raise HTTPException(401, "Invalid API key")

    # Verify full key hash
    if not verify_api_key(api_key, api_key_record.key_hash):
        raise HTTPException(401, "Invalid API key")

    # Check expiry
    if api_key_record.expires_at and api_key_record.expires_at < datetime.utcnow():
        raise HTTPException(401, "API key expired")

    # Update last used
    api_key_record.last_used_at = datetime.utcnow()

    return await get_market_maker(api_key_record.market_maker_id)
```

### 16.3 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/mm/auth/api-key` | Generate API key (admin) |
| DELETE | `/api/v1/mm/auth/api-key/{id}` | Revoke key |
| GET | `/api/v1/mm/auth/api-keys` | List keys |

---

## SPRINT 17: Market Maker Order Management API

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** Sprint 16

### 17.1 Endpoints

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| POST | `/api/v1/mm/orders` | Place order | orders:write |
| GET | `/api/v1/mm/orders` | List orders | orders:read |
| DELETE | `/api/v1/mm/orders/{id}` | Cancel order | orders:write |
| POST | `/api/v1/mm/orders/bulk` | Bulk place | orders:write |

### 17.2 WebSocket Stream

```
WS /api/v1/mm/stream

Events:
- order_book_update: Real-time order book changes
- order_filled: Order fill notification
- trade_executed: Trade execution notification
```

---

## SPRINT 18: Market Maker Quoting & Inventory

**Duration:** 3-4 days
**Priority:** P3 (Low)
**Dependencies:** Sprint 17

### 18.1 Features

- Quote update endpoint
- Inventory tracking
- Auto-quoting engine (optional)
- Risk metrics

### 18.2 Auto-Quoting

```python
class AutoQuotingEngine:
    async def run(self, market_maker_id: UUID):
        """
        Maintain continuous quotes around mid price.
        """
        config = await get_auto_quoting_config(market_maker_id)

        while config.enabled:
            # Get current mid price
            mid_price = await get_mid_price(config.certificate_type)

            # Calculate bid/ask prices
            spread_bps = config.spread_bps
            bid_price = mid_price * (1 - spread_bps / 10000)
            ask_price = mid_price * (1 + spread_bps / 10000)

            # Get available inventory
            inventory = await get_mm_inventory(market_maker_id)

            # Calculate quantities
            bid_qty = min(config.max_position - inventory.position, config.max_order_size)
            ask_qty = min(inventory.position + config.max_position, config.max_order_size)

            # Cancel existing quotes
            await cancel_mm_quotes(market_maker_id)

            # Place new quotes
            if bid_qty > 0:
                await place_order(market_maker_id, "BID", bid_price, bid_qty)
            if ask_qty > 0:
                await place_order(market_maker_id, "ASK", ask_price, ask_qty)

            # Sleep for refresh interval
            await asyncio.sleep(config.refresh_interval_seconds)
```

---

## SPRINT 19: Notifications & Alerts

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** Sprint 8 (Email system)

### 19.1 Notification Types

- In-app notifications
- Email notifications
- WebSocket push (future)

### 19.2 Database

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, event_type)
);
```

### 19.3 Frontend

1. **NotificationCenter** - Bell icon with dropdown
2. **NotificationList** - List of notifications
3. **NotificationPreferences** - Settings page

---

## SPRINT 20: Audit Logging & Compliance

**Duration:** 3-4 days
**Priority:** P1 (High)
**Dependencies:** None

### 20.1 Enhanced Audit Logging

```python
class AuditService:
    async def log_action(
        self,
        user_id: UUID,
        action: str,
        resource_type: str,
        resource_id: UUID,
        old_value: Optional[dict],
        new_value: Optional[dict],
        ip_address: str,
        user_agent: str
    ):
        """
        Create comprehensive audit log entry.
        """
        await db.execute(
            insert(ActivityLog).values(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_value=old_value,
                new_value=new_value,
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=datetime.utcnow()
            )
        )
```

### 20.2 Compliance Reports

- Daily transaction summary
- User activity report
- Failed login attempts
- Suspicious activity alerts

---

## SPRINT 21: Performance Optimization

**Duration:** 3-4 days
**Priority:** P2 (Medium)
**Dependencies:** All core features

### 21.1 Backend Optimization

- Database query optimization
- N+1 query detection
- Redis caching layer
- Background job optimization

### 21.2 Frontend Optimization

- Code splitting
- Lazy loading
- Virtual scrolling for large tables
- Bundle size reduction

### 21.3 Load Testing

- Simulate 1000+ concurrent users
- Identify bottlenecks
- Performance benchmarks

---

## SPRINT 22: Security Hardening & Production

**Duration:** 4-5 days
**Priority:** P0 (Critical)
**Dependencies:** All features

### 22.1 Security Checklist

- [ ] OWASP Top 10 review
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input validation
- [ ] Secrets management
- [ ] TLS/SSL configuration
- [ ] Content Security Policy
- [ ] Dependency audit

### 22.2 Production Deployment

- [ ] Docker optimization
- [ ] CI/CD pipeline
- [ ] Monitoring setup
- [ ] Alerting configuration
- [ ] Backup strategy
- [ ] Disaster recovery plan

### 22.3 Documentation

- [ ] API documentation (OpenAPI)
- [ ] Admin user guide
- [ ] Client user guide
- [ ] Deployment runbook
- [ ] Incident response playbook

---

## Part V: Summary & Timeline

### Total Estimated Effort

| Phase | Sprints | Estimated Hours | Timeline |
|-------|---------|-----------------|----------|
| Phase 1: Backoffice | 5-8 | 48-60 hours | 2-3 weeks |
| Phase 2: Client Journey | 9-15 | 72-88 hours | 4-5 weeks |
| Phase 3: Market Maker API | 16-18 | 28-36 hours | 2 weeks |
| Phase 4: Polish & Production | 19-22 | 52-68 hours | 2-3 weeks |
| **Total** | **18 sprints** | **200-252 hours** | **10-13 weeks** |

### Critical Path

```
Sprint 5 (Deposits) --> Sprint 6 (Withdrawals) --> Sprint 7 (Transactions)
                                                          |
                                                          v
Sprint 9 (Onboarding) --> Sprint 10 (KYC) --> Sprint 11 (Marketplace)
                                                          |
                                                          v
Sprint 12 (Orders) --> Sprint 13 (Matching) --> Sprint 14 (Portfolio)
                                                          |
                                                          v
Sprint 19 (Notifications) --> Sprint 20 (Audit) --> Sprint 21 (Performance)
                                                          |
                                                          v
                                              Sprint 22 (Production)
```

### Parallel Workstreams

- **Workstream A:** Sprints 5-8 (Backoffice completion)
- **Workstream B:** Sprints 16-18 (MM API) - Can run parallel to A
- **Workstream C:** Sprints 9-15 (Client journey) - Depends on A

---

## Part VI: Risk Assessment

### High Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Settlement integration complexity | Delays in T+3 processing | Start early testing |
| External registry API changes | Feature breakage | API versioning, adapters |
| Performance under load | Poor user experience | Early load testing |
| Security vulnerabilities | Data breach | Regular audits |

### Medium Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email deliverability | Missed notifications | Monitor bounces, use Resend |
| Database migrations | Data integrity | Thorough testing, backups |
| Frontend complexity | Maintenance burden | Strict component design |

---

## Part VII: Success Metrics

### Operational Metrics

- Deposit processing time < 2 minutes
- Withdrawal processing time < 24 hours
- Trade execution latency < 500ms
- System uptime > 99.5%

### Business Metrics

- User onboarding completion rate > 80%
- KYC approval rate > 90%
- Trade success rate > 99%
- Client satisfaction score > 4.5/5

---

**Document Version:** 2.0
**Last Updated:** 2026-01-27
**Author:** Project Architect
**Status:** Ready for implementation

---

## Appendix A: File Locations Reference

### Backend

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── admin.py           # Admin endpoints
│   │   ├── auth.py            # Authentication
│   │   ├── backoffice.py      # Backoffice endpoints
│   │   ├── cash_market.py     # Trading endpoints
│   │   ├── settlement.py      # Settlement endpoints
│   │   └── users.py           # User endpoints
│   ├── models/
│   │   └── models.py          # All SQLAlchemy models
│   ├── services/
│   │   ├── deposit_service.py     # NEW: Deposit logic
│   │   ├── withdrawal_service.py  # NEW: Withdrawal logic
│   │   ├── email_service.py       # NEW: Email sending
│   │   └── settlement_service.py  # Settlement logic
│   └── schemas/
│       └── schemas.py         # Pydantic schemas
└── alembic/
    └── versions/              # Database migrations
```

### Frontend

```
frontend/
└── src/
    ├── components/
    │   ├── backoffice/
    │   │   ├── DepositsTab.tsx           # NEW
    │   │   ├── DepositReviewModal.tsx    # NEW
    │   │   ├── WithdrawalsTab.tsx        # NEW
    │   │   └── ReportsTab.tsx            # NEW
    │   ├── funding/
    │   │   ├── DepositAnnouncementModal.tsx  # NEW
    │   │   └── WithdrawalRequestModal.tsx    # NEW
    │   └── dashboard/
    │       ├── MyDepositsTab.tsx         # NEW
    │       ├── MyWithdrawalsTab.tsx      # NEW
    │       └── TransactionHistoryTab.tsx # NEW
    ├── pages/
    │   ├── OnboardingPage.tsx     # Enhanced
    │   ├── PortfolioPage.tsx      # NEW
    │   └── FundingPage.tsx        # NEW
    └── services/
        └── api.ts                 # API client functions
```
