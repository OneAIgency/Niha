# AML Hold Management System - Design Document

**Date:** 2026-01-26
**Priority:** P0 (Critical for Platform Operations)
**Status:** Approved for Implementation

## Executive Summary

Implement fully manual AML hold management system for deposit clearance. Admin reviews and approves all deposits after automated hold period calculation. Email notifications are stubbed for future implementation after domain/mail server setup.

## Business Context

### Current Problem
- Deposits lack hold period management
- No compliance review workflow
- Admin cannot track deposits awaiting clearance
- Client funds unlock timing is unclear

### Solution
Manual deposit review system with:
- Automatic hold period calculation based on compliance rules
- Admin review interface with compliance context
- Manual approval/rejection workflow
- Audit trail for all decisions
- Email notification stubs (activate later)

### Success Metrics
- All deposits go through manual admin review
- Hold periods calculated correctly (1/2/3 days based on rules)
- Admin can process deposits in <2 minutes per deposit
- Complete audit trail for compliance

## Hold Period Rules

```
First Deposit (≥€50,000):
├─ Hold Duration: 2 business days
├─ Auto-release: NO (manual approval required)
└─ Type: FIRST_DEPOSIT

Subsequent Deposits (<24 months):
├─ Hold Duration: 1 business day
├─ Auto-release: NO (manual approval required)
└─ Type: SUBSEQUENT

Large Deposits (>€500,000):
├─ Hold Duration: 3 business days
├─ Auto-release: NO (manual approval required)
└─ Type: LARGE_AMOUNT
```

## Architecture

### System Components

```
Frontend (React + TypeScript)
├─ BackofficePage
│  └─ DepositsTab (NEW)
│     ├─ DepositsListView
│     │  ├─ Filter bar (Status, Date Range, Amount, Search)
│     │  ├─ Deposits table (8 columns)
│     │  └─ Badge counter ("3 pending review")
│     ├─ DepositReviewModal
│     │  ├─ Deposit details section
│     │  ├─ Compliance context section
│     │  ├─ Previous deposits history
│     │  ├─ Notes textarea
│     │  └─ Action buttons (Approve/Reject)
│     └─ RejectionReasonModal
│        ├─ Reason dropdown
│        ├─ Additional comments
│        └─ Confirm/Cancel

Backend (FastAPI + SQLAlchemy)
├─ API Endpoints
│  ├─ GET /api/v1/admin/deposits
│  │  └─ List all deposits with filters
│  ├─ GET /api/v1/admin/deposits/{id}
│  │  └─ Single deposit with compliance context
│  ├─ POST /api/v1/admin/deposits/{id}/approve
│  │  └─ Approve and clear deposit
│  └─ POST /api/v1/admin/deposits/{id}/reject
│     └─ Reject with reason
├─ Services
│  ├─ DepositService
│  │  ├─ create_deposit() - auto-calculate hold
│  │  ├─ approve_deposit(admin_id)
│  │  ├─ reject_deposit(admin_id, reason)
│  │  └─ get_deposits_for_review()
│  └─ NotificationService (STUB)
│     ├─ send_deposit_cleared_email() - placeholder
│     └─ send_deposit_rejected_email() - placeholder

Database (PostgreSQL)
├─ deposits table
│  ├─ Core Fields
│  │  ├─ id (UUID, PK)
│  │  ├─ user_id (FK to users)
│  │  ├─ entity_id (FK to entities)
│  │  ├─ amount (Decimal)
│  │  ├─ currency (VARCHAR: EUR/USD/GBP)
│  │  └─ wire_reference (VARCHAR, unique)
│  ├─ Banking Fields
│  │  ├─ source_bank (VARCHAR)
│  │  ├─ received_at (TIMESTAMP)
│  │  └─ reported_amount (Decimal, optional)
│  ├─ Status Fields
│  │  ├─ status (ENUM: PENDING, RECEIVED, ON_HOLD, CLEARED, REJECTED)
│  │  ├─ hold_type (ENUM: FIRST_DEPOSIT, SUBSEQUENT, LARGE_AMOUNT)
│  │  ├─ hold_days_required (INT: 1, 2, or 3)
│  │  └─ hold_expires_at (TIMESTAMP)
│  ├─ Approval Fields
│  │  ├─ cleared_at (TIMESTAMP, nullable)
│  │  ├─ cleared_by_admin_id (FK to users, nullable)
│  │  ├─ rejection_reason (TEXT, nullable)
│  │  ├─ rejected_at (TIMESTAMP, nullable)
│  │  └─ rejected_by_admin_id (FK to users, nullable)
│  └─ Audit Fields
│     ├─ admin_notes (TEXT, nullable)
│     ├─ created_at (TIMESTAMP)
│     └─ updated_at (TIMESTAMP)
│
└─ Indexes
   ├─ idx_deposits_status
   ├─ idx_deposits_user_id
   ├─ idx_deposits_entity_id
   ├─ idx_deposits_hold_expires_at
   └─ idx_deposits_wire_reference (unique)
```

## Data Flow

### Deposit Creation Flow
```
1. Client initiates wire transfer
2. Wire arrives at Nihao bank
3. Backend receives webhook/manual entry:
   POST /api/v1/deposits/create
   {
     "user_id": "uuid",
     "amount": 50000,
     "currency": "EUR",
     "wire_reference": "DEP-2026-001-AA",
     "source_bank": "HSBC Hong Kong"
   }
4. DepositService.create_deposit():
   ├─ Check if first deposit (query user's deposit history)
   ├─ Check amount threshold (>€500K)
   ├─ Calculate hold_type and hold_days_required
   ├─ Calculate hold_expires_at = received_at + hold_days_required
   ├─ Set status = ON_HOLD
   └─ Save to database
5. Client sees: "ON HOLD - AML Clearing [Day 1 of 2]"
```

### Admin Review Flow
```
1. Admin opens Backoffice → Deposits tab
2. Sees table row:
   | John Doe | ABC Corp | €50,000 | DEP-2026-001 | Jan 24 | ON HOLD | Jan 26, 09:00 | [Review] |
3. Clicks [Review] → DepositReviewModal opens
4. Modal shows:
   ├─ Deposit details (amount, wire ref, source bank)
   ├─ Client info (name, entity, KYC status)
   ├─ Previous deposits: "First deposit" or list of 3 most recent
   ├─ AML risk score: Low/Medium/High badge
   └─ Action buttons
5. Admin decision:
   A) Approve:
      ├─ Click "✓ Approve Deposit"
      ├─ POST /api/v1/admin/deposits/{id}/approve
      ├─ Backend: status = CLEARED, cleared_at = now, cleared_by_admin_id
      ├─ Client balance unlocked
      └─ (Future: Email sent to client)
   B) Reject:
      ├─ Click "❌ Reject Deposit"
      ├─ RejectionReasonModal opens
      ├─ Admin selects reason + adds comments
      ├─ POST /api/v1/admin/deposits/{id}/reject
      ├─ Backend: status = REJECTED, reason logged
      └─ (Future: Email sent to client with reason)
```

## API Specifications

### GET /api/v1/admin/deposits

**Query Parameters:**
- `status` (optional): `ON_HOLD` | `CLEARED` | `REJECTED` | `ALL`
- `user_id` (optional): Filter by user UUID
- `start_date` (optional): ISO 8601 date
- `end_date` (optional): ISO 8601 date
- `min_amount` (optional): Decimal
- `max_amount` (optional): Decimal
- `search` (optional): Search by client name, entity name, wire reference
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)

**Response:**
```json
{
  "deposits": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "entity": {
        "id": "uuid",
        "name": "ABC Corp"
      },
      "amount": 50000.00,
      "currency": "EUR",
      "wire_reference": "DEP-2026-001-AA",
      "source_bank": "HSBC Hong Kong",
      "received_at": "2026-01-24T09:30:00Z",
      "status": "ON_HOLD",
      "hold_type": "FIRST_DEPOSIT",
      "hold_days_required": 2,
      "hold_expires_at": "2026-01-26T09:00:00Z",
      "days_in_hold": 1,
      "cleared_at": null,
      "cleared_by": null,
      "rejected_at": null,
      "rejection_reason": null,
      "created_at": "2026-01-24T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "per_page": 20,
    "pages": 1
  }
}
```

### GET /api/v1/admin/deposits/{id}

**Response:**
```json
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "kyc_status": "APPROVED",
    "account_created_at": "2025-12-01T10:00:00Z"
  },
  "entity": {
    "id": "uuid",
    "name": "ABC Corp",
    "entity_type": "COMPANY",
    "kyc_status": "APPROVED"
  },
  "amount": 50000.00,
  "currency": "EUR",
  "wire_reference": "DEP-2026-001-AA",
  "source_bank": "HSBC Hong Kong",
  "received_at": "2026-01-24T09:30:00Z",
  "status": "ON_HOLD",
  "hold_type": "FIRST_DEPOSIT",
  "hold_days_required": 2,
  "hold_expires_at": "2026-01-26T09:00:00Z",
  "aml_risk_score": "LOW",
  "previous_deposits": [
    // Empty for first deposit, or list of previous 3 deposits
  ],
  "admin_notes": null,
  "cleared_at": null,
  "cleared_by": null,
  "rejected_at": null,
  "rejection_reason": null,
  "created_at": "2026-01-24T09:30:00Z",
  "updated_at": "2026-01-24T09:30:00Z"
}
```

### POST /api/v1/admin/deposits/{id}/approve

**Request Body:**
```json
{
  "admin_notes": "Compliance review completed. Source verified."
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "CLEARED",
  "cleared_at": "2026-01-26T08:45:00Z",
  "cleared_by": {
    "id": "uuid",
    "email": "admin@nihaogroup.hk",
    "first_name": "Admin",
    "last_name": "User"
  },
  "message": "Deposit approved successfully. Client balance updated."
}
```

### POST /api/v1/admin/deposits/{id}/reject

**Request Body:**
```json
{
  "reason": "SUSPICIOUS_ACTIVITY",
  "reason_details": "Source bank flagged for compliance review. Additional documentation required.",
  "admin_notes": "Contacted compliance team. Awaiting further investigation."
}
```

**Rejection Reasons Enum:**
- `SUSPICIOUS_ACTIVITY`
- `INCOMPLETE_KYC`
- `AML_COMPLIANCE_CONCERN`
- `INCORRECT_WIRE_REFERENCE`
- `SOURCE_VERIFICATION_FAILED`
- `OTHER`

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "rejected_at": "2026-01-26T08:45:00Z",
  "rejected_by": {
    "id": "uuid",
    "email": "admin@nihaogroup.hk"
  },
  "rejection_reason": "SUSPICIOUS_ACTIVITY",
  "message": "Deposit rejected. Client will be notified."
}
```

## UI Specifications

### Deposits Tab - List View

**Location:** `/backoffice` → "Deposits" tab (add after "KYC Review")

**Components:**

1. **Tab Header**
   - Badge with count: "Deposits (3 pending review)"
   - Refresh button (top right)

2. **Filter Bar**
   ```
   [Status: All ▼] [Date Range: Last 30 days ▼] [Amount: Any ▼] [Search: __________🔍]
   ```
   - Status dropdown: All | On Hold | Cleared | Rejected
   - Date range: Last 7 days | Last 30 days | Last 90 days | Custom
   - Amount: Any | <€50K | €50K-€500K | >€500K

3. **Deposits Table**
   ```
   | Client      | Entity      | Amount    | Wire Ref       | Received        | Status  | Hold Expires     | Actions |
   |-------------|-------------|-----------|----------------|-----------------|---------|------------------|---------|
   | John Doe    | ABC Corp    | €50,000   | DEP-2026-001   | Jan 24, 09:30   | 🟡 ON HOLD | Jan 26, 09:00   | [Review] |
   | Jane Smith  | XYZ Ltd     | $75,000   | DEP-2026-002   | Jan 25, 14:20   | 🔴 ON HOLD | Jan 26, 14:20   | [Review] |
   | Bob Jones   | Solo Trader | €125,000  | DEP-2026-003   | Jan 23, 11:00   | ✓ CLEARED  | -              | [View]   |
   ```

   **Status Badge Colors:**
   - 🟡 ON HOLD (yellow) - expires tomorrow or later
   - 🔴 ON HOLD (red) - expires today
   - ✓ CLEARED (green)
   - ❌ REJECTED (red)

   **Empty State:**
   ```
   ✓ No pending deposits
   All deposits have been processed
   ```

### Deposit Review Modal

**Trigger:** Click "Review" button in table row

**Modal Layout:**

```
┌─ Deposit Review ────────────────────────────────────────────────── ✕ ┐
│                                                                        │
│  DEPOSIT DETAILS                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Amount:           €50,000.00                                  │    │
│  │ Currency:         EUR                                         │    │
│  │ Wire Reference:   DEP-2026-001-AA                            │    │
│  │ Source Bank:      HSBC Hong Kong                             │    │
│  │ Received:         Jan 24, 2026 at 09:30 HKT                  │    │
│  │ Status:           🟡 ON HOLD - Day 1 of 2                     │    │
│  │ Hold Expires:     Jan 26, 2026 at 09:00 HKT                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  CLIENT INFORMATION                                                    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Name:             John Doe (john.doe@example.com)            │    │
│  │ Entity:           ABC Corp (COMPANY)                          │    │
│  │ KYC Status:       ✓ APPROVED                                 │    │
│  │ Account Age:      58 days (since Dec 1, 2025)                │    │
│  │ AML Risk Score:   🟢 LOW                                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  PREVIOUS DEPOSITS                                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ First deposit for this client                                 │    │
│  │ (OR list of 3 most recent deposits with amounts/dates)       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ADMIN NOTES                                                           │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ [Text area for admin comments]                                │    │
│  │                                                                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  [Cancel]              [✓ Approve Deposit]  [❌ Reject]       │    │
│  └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

### Rejection Reason Modal

**Trigger:** Click "❌ Reject" button in review modal

```
┌─ Reject Deposit ──────────────────────────────────────────────── ✕ ┐
│                                                                        │
│  Why are you rejecting this deposit?                                  │
│                                                                        │
│  Rejection Reason:                                                     │
│  [Suspicious Activity                                            ▼]   │
│     - Suspicious Activity                                             │
│     - Incomplete KYC                                                  │
│     - AML Compliance Concern                                          │
│     - Incorrect Wire Reference                                        │
│     - Source Verification Failed                                      │
│     - Other                                                           │
│                                                                        │
│  Additional Details:                                                   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ [Text area for specific reason and next steps for client]    │    │
│  │                                                                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ⚠️  Client will be notified of rejection (future email feature)      │
│                                                                        │
│  [Cancel]                                      [Confirm Rejection]    │
└────────────────────────────────────────────────────────────────────┘
```

## Business Logic Rules

### Hold Calculation (Automatic)

```python
def calculate_hold_period(user_id: str, amount: Decimal) -> tuple[HoldType, int]:
    """
    Calculate hold type and days required based on business rules.

    Returns: (hold_type, hold_days_required)
    """
    # Check if large deposit
    if amount > 500000:
        return (HoldType.LARGE_AMOUNT, 3)

    # Check deposit history
    previous_deposits = get_user_deposits(user_id, status=DepositStatus.CLEARED)

    if len(previous_deposits) == 0:
        # First deposit
        if amount >= 50000:
            return (HoldType.FIRST_DEPOSIT, 2)
        else:
            # Small first deposits still get 1 day hold
            return (HoldType.FIRST_DEPOSIT, 1)
    else:
        # Subsequent deposit
        last_deposit = previous_deposits[0]
        months_since_last = (datetime.now() - last_deposit.created_at).days / 30

        if months_since_last > 24:
            # Treat as first deposit if >24 months inactive
            return (HoldType.FIRST_DEPOSIT, 2)
        else:
            return (HoldType.SUBSEQUENT, 1)
```

### Approval Logic

```python
async def approve_deposit(
    deposit_id: str,
    admin_id: str,
    admin_notes: Optional[str] = None
) -> Deposit:
    """
    Approve deposit and unlock client funds.

    Side effects:
    1. Update deposit status to CLEARED
    2. Update client balance (add deposit amount to available balance)
    3. Log admin action
    4. (Future) Send email notification to client
    """
    deposit = await get_deposit(deposit_id)

    # Validation
    if deposit.status != DepositStatus.ON_HOLD:
        raise ValueError("Can only approve deposits with ON_HOLD status")

    # Update deposit
    deposit.status = DepositStatus.CLEARED
    deposit.cleared_at = datetime.now()
    deposit.cleared_by_admin_id = admin_id
    deposit.admin_notes = admin_notes

    # Update client balance
    await update_user_balance(
        user_id=deposit.user_id,
        amount=deposit.amount,
        currency=deposit.currency,
        operation="ADD"
    )

    # Log action
    await create_audit_log(
        action="DEPOSIT_APPROVED",
        admin_id=admin_id,
        resource_type="DEPOSIT",
        resource_id=deposit_id,
        details={"amount": deposit.amount, "currency": deposit.currency}
    )

    # (Future) Send email
    # await send_deposit_cleared_email(deposit)

    await db.commit()
    return deposit
```

### Rejection Logic

```python
async def reject_deposit(
    deposit_id: str,
    admin_id: str,
    reason: RejectionReason,
    reason_details: str,
    admin_notes: Optional[str] = None
) -> Deposit:
    """
    Reject deposit with reason.

    Side effects:
    1. Update deposit status to REJECTED
    2. Store rejection reason
    3. Log admin action
    4. (Future) Send email notification to client
    5. Funds remain in system for manual return process
    """
    deposit = await get_deposit(deposit_id)

    # Validation
    if deposit.status != DepositStatus.ON_HOLD:
        raise ValueError("Can only reject deposits with ON_HOLD status")

    # Update deposit
    deposit.status = DepositStatus.REJECTED
    deposit.rejected_at = datetime.now()
    deposit.rejected_by_admin_id = admin_id
    deposit.rejection_reason = f"{reason.value}: {reason_details}"
    deposit.admin_notes = admin_notes

    # Log action
    await create_audit_log(
        action="DEPOSIT_REJECTED",
        admin_id=admin_id,
        resource_type="DEPOSIT",
        resource_id=deposit_id,
        details={
            "amount": deposit.amount,
            "reason": reason.value,
            "reason_details": reason_details
        }
    )

    # (Future) Send email
    # await send_deposit_rejected_email(deposit, reason_details)

    await db.commit()
    return deposit
```

## Implementation Plan

### Phase 1: Database & Models (Backend) - 2 hours
1. Create Alembic migration for deposits table
2. Create SQLAlchemy Deposit model
3. Create DepositStatus and HoldType enums
4. Add indexes
5. Test migration up/down

### Phase 2: API Endpoints (Backend) - 3 hours
1. Create DepositService with business logic
2. Implement GET /api/v1/admin/deposits (list with filters)
3. Implement GET /api/v1/admin/deposits/{id} (detail)
4. Implement POST /api/v1/admin/deposits/{id}/approve
5. Implement POST /api/v1/admin/deposits/{id}/reject
6. Add API tests

### Phase 3: Frontend Components - 4 hours
1. Create DepositsTab component
2. Create DepositsListView with table and filters
3. Create DepositReviewModal with all sections
4. Create RejectionReasonModal
5. Connect to API endpoints
6. Add loading states and error handling

### Phase 4: Integration & Testing - 2 hours
1. Create test deposits in database
2. Manual testing of full workflow
3. Test edge cases (expired holds, large amounts, etc.)
4. UI/UX refinement
5. Documentation update

**Total Estimated Time:** 11-13 hours (1.5-2 days)

## Email Notification Stubs

### Implementation Note
Email notifications are **stubbed** for now. Functions exist but do nothing until mail server is configured.

```python
# services/notification_service.py

async def send_deposit_cleared_email(deposit: Deposit) -> None:
    """
    STUB: Send email when deposit is cleared.

    TODO: Implement after domain + mail server setup
    - Template: deposit_cleared.html
    - Subject: "✓ Funds Cleared - Ready for Trading"
    - Content: Amount, balance, link to marketplace
    """
    logger.info(f"[STUB] Would send deposit cleared email to user {deposit.user_id}")
    # TODO: Implement Resend integration
    pass


async def send_deposit_rejected_email(deposit: Deposit, reason: str) -> None:
    """
    STUB: Send email when deposit is rejected.

    TODO: Implement after domain + mail server setup
    - Template: deposit_rejected.html
    - Subject: "Deposit Rejected - Action Required"
    - Content: Reason, next steps, contact info
    """
    logger.info(f"[STUB] Would send deposit rejected email to user {deposit.user_id}")
    # TODO: Implement Resend integration
    pass
```

## Testing Strategy

### Unit Tests
- [ ] Hold calculation logic (first deposit, subsequent, large amount)
- [ ] Deposit approval updates balance correctly
- [ ] Deposit rejection stores reason correctly
- [ ] Cannot approve/reject deposits with wrong status

### Integration Tests
- [ ] Create deposit → verify hold calculated correctly
- [ ] Approve deposit → verify balance updated
- [ ] Reject deposit → verify status and reason stored
- [ ] List deposits with filters returns correct results

### Manual QA
- [ ] Admin can see deposits in list view
- [ ] Filters work correctly
- [ ] Review modal shows all required info
- [ ] Approve button clears deposit and unlocks balance
- [ ] Reject button requires reason selection
- [ ] Status badges display correct colors
- [ ] Hold expiration countdown is accurate

## Security Considerations

### Authorization
- All admin deposit endpoints require `role=admin`
- JWT token validation on every request
- Audit log for all approve/reject actions

### Data Validation
- Deposit amounts must be positive
- Currency must be in allowed list (EUR, USD, GBP)
- Wire references must be unique
- Rejection reason must be from enum

### Audit Trail
Every action logged with:
- Admin user ID
- Timestamp
- Action type (APPROVED/REJECTED)
- Resource ID (deposit_id)
- Metadata (amount, reason, etc.)

## Future Enhancements (Post-MVP)

### Email System
- Activate email stubs when domain/mail server ready
- Create email templates
- Test email delivery
- Add email preferences (client can opt-out)

### Automated Hold Release
- Optional: Add cron job to auto-release after hold expires
- Admin can toggle manual vs auto mode per deposit
- Requires additional security review

### Advanced Features
- Bulk approve multiple deposits at once
- Export deposits to CSV for accounting
- Real-time notifications via WebSocket
- SMS alerts for large deposits (>€100K)
- Integration with external AML screening APIs

## Acceptance Criteria

- [x] Design documented and approved
- [ ] Database migration created and tested
- [ ] All API endpoints implemented and tested
- [ ] Frontend components match UI specifications
- [ ] Admin can approve deposits manually
- [ ] Admin can reject deposits with reason
- [ ] Client balance updates correctly on approval
- [ ] Complete audit trail for all actions
- [ ] Email notification stubs in place
- [ ] Manual QA completed successfully
- [ ] Documentation updated

---

**Document Status:** Approved for Implementation
**Next Step:** Create implementation sprint and git worktree
**Estimated Delivery:** 1.5-2 days
