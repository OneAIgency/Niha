# Settlement System Architecture

**Data:** 2026-01-25  
**Status:** Implementat complet  
**Versiune:** 1.0

## Overview

Sistemul de settlement extern gestionează decontarea tranzacțiilor CEA și swap-urilor CEA→EUA conform timeline-urilor documentate (T+1-T+3 business days pentru CEA, T+1-T+5 business days pentru swap). Toate tranzacțiile au statusuri intermediare și tracking complet.

**Key Features:**
- Business days calculation (excludes weekends)
- Guaranteed unique batch references
- Validated status transitions
- Automatic background processing
- Complete audit trail
- Email notifications at each stage

## Arhitectură

### Componente Principale

1. **Database Models**
   - `SettlementBatch` - tracking pentru fiecare settlement
   - `SettlementStatusHistory` - audit trail pentru toate schimbările de status

2. **Business Logic**
   - `SettlementService` - creare și management settlements
   - `SettlementProcessor` - background job pentru actualizare automată statusuri
   - `balance_utils` - shared utilities pentru balance management (previne circular imports)

3. **API Layer**
   - `/api/v1/settlement/pending` - listează settlements pending
   - `/api/v1/settlement/{id}` - detalii settlement
   - `/api/v1/settlement/{id}/timeline` - timeline complet

4. **Frontend**
   - `SettlementTransactions` component - afișează pending transactions
   - `SettlementDetails` component - modal cu detalii complete
   - Integrare în Dashboard

5. **Email Notifications**
   - Confirmation email la T+0
   - Status update emails la fiecare schimbare
   - Completion email când settlement se finalizează

## Flow Diagrams

### CEA Purchase Settlement Flow

```
Order Execution (T+0)
    ↓
Reserve EUR (deduct from balance immediately)
    ↓
Create SettlementBatch (status=PENDING, expected=T+3 business days)
    - Generate unique batch reference (database-driven counter)
    - Calculate expected date using business days (excludes weekends)
    ↓
Link to Order and Trade
    ↓
Send Confirmation Email (non-blocking)
    ↓
Background Processor (T+1 business day)
    ↓
Update Status → TRANSFER_INITIATED
    - Validate status transition
    - Create status history entry
    ↓
Send Status Update Email
    ↓
Background Processor (T+2 business days)
    ↓
Update Status → IN_TRANSIT
    ↓
Send Status Update Email
    ↓
Background Processor (T+3 business days)
    ↓
Update Status → AT_CUSTODY → SETTLED
    ↓
Finalize Settlement (add CEA to EntityHolding)
    - Update actual_settlement_date
    - Create AssetTransaction record
    ↓
Send Completion Email
    ↓
CEA Available in Account
```

### Swap CEA→EUA Settlement Flow

```
Swap Execution (T+0)
    ↓
Get current market prices from PriceService
    ↓
Create 2 SettlementBatches:
  - CEA Outbound (expected=T+2 business days)
  - EUA Inbound (expected=T+5 business days)
    - Generate unique batch references
    - Use actual market prices (not hard-coded)
    ↓
Link to Order and Trade
    ↓
Reserve CEA (deduct from balance immediately)
    - Note: CEA is deducted immediately to prevent double-spending
    - Actual transfer happens at T+2, but asset is "locked" now
    ↓
Send Confirmation Email (non-blocking)
    ↓
Background Processor (T+1 business day)
    ↓
CEA Outbound: Status → TRANSFER_INITIATED
    ↓
Send Status Update Email
    ↓
Background Processor (T+2 business days)
    ↓
CEA Outbound: Status → AT_CUSTODY → SETTLED
    ↓
Finalize CEA Outbound (CEA remains deducted, transaction recorded)
    ↓
EUA Inbound: Status → TRANSFER_INITIATED (T+2)
    ↓
Background Processor (T+3 business days)
    ↓
EUA Inbound: Status → AT_CUSTODY
    ↓
Background Processor (T+5 business days)
    ↓
EUA Inbound: Status → SETTLED
    ↓
Finalize EUA Inbound (add EUA to EntityHolding)
    ↓
Send Completion Email
    ↓
EUA Available in Account
```

## Status Transitions

**Important:** All transitions are validated. Invalid transitions raise `ValueError`.

### Valid Transition Rules

- `PENDING` → `TRANSFER_INITIATED` or `FAILED`
- `TRANSFER_INITIATED` → `IN_TRANSIT` or `FAILED`
- `IN_TRANSIT` → `AT_CUSTODY` or `FAILED`
- `AT_CUSTODY` → `SETTLED` or `FAILED`
- `SETTLED` → (terminal state)
- `FAILED` → (terminal state)

### CEA Purchase (Business Days)

| Day | Status | Description |
|-----|--------|-------------|
| T+0 | PENDING | Order confirmed, settlement initiated |
| T+1 | TRANSFER_INITIATED | Transfer started |
| T+2 | IN_TRANSIT | In registry processing |
| T+3 | AT_CUSTODY → SETTLED | Arrived at Nihao custody, finalized |

### Swap CEA Outbound (Business Days)

| Day | Status | Description |
|-----|--------|-------------|
| T+0 | PENDING | Swap confirmed, CEA deducted (reserved) |
| T+1 | TRANSFER_INITIATED | CEA transfer started |
| T+2 | AT_CUSTODY → SETTLED | CEA at counterparty, finalized |

### Swap EUA Inbound (Business Days)

| Day | Status | Description |
|-----|--------|-------------|
| T+0 | PENDING | Swap confirmed |
| T+2 | TRANSFER_INITIATED | EUA transfer started |
| T+3 | AT_CUSTODY | EUA at Nihao custody |
| T+5 | SETTLED | EUA delivered, finalized |

## Database Schema

### SettlementBatch

```sql
CREATE TABLE settlement_batches (
    id UUID PRIMARY KEY,
    batch_reference VARCHAR(50) UNIQUE NOT NULL,
    entity_id UUID NOT NULL REFERENCES entities(id),
    order_id UUID REFERENCES orders(id),
    trade_id UUID REFERENCES cash_market_trades(id),
    settlement_type settlementtype NOT NULL,
    status settlementstatus NOT NULL DEFAULT 'PENDING',
    asset_type assettype NOT NULL,
    quantity NUMERIC(18, 2) NOT NULL,
    price NUMERIC(18, 4) NOT NULL,
    total_value_eur NUMERIC(18, 2) NOT NULL,
    expected_settlement_date TIMESTAMP NOT NULL,
    actual_settlement_date TIMESTAMP,
    registry_reference VARCHAR(100),
    counterparty_id UUID,
    counterparty_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### SettlementStatusHistory

```sql
CREATE TABLE settlement_status_history (
    id UUID PRIMARY KEY,
    settlement_batch_id UUID NOT NULL REFERENCES settlement_batches(id),
    status settlementstatus NOT NULL,
    notes TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL
);
```

## Background Processing

### SettlementProcessor

**Frecvență:** La fiecare oră (configurable)

**Proces:**
1. Query toate settlements cu status != SETTLED and != FAILED
2. Pentru fiecare settlement:
   - Calculează days since order creation (calendar days)
   - Determină expected status bazat pe timeline și business days
   - Dacă status trebuie actualizat:
     - Validează status transition
     - Actualizează status (cu commit)
     - Creează status history entry
     - Trimite email notification (non-blocking)
     - Dacă status = SETTLED, finalizează settlement automat

**Error Handling:**
- Fiecare settlement procesat independent
- Errors loggate dar nu blochează procesarea altor settlements
- Failed settlements continuă să fie procesate în următoarele runde
- Overdue settlements detectate și loggate pentru investigare

## Email Notifications

### Confirmation Email (T+0)
- Trimis când settlement batch este creat
- Include: batch reference, type, quantity, expected date, timeline

### Status Update Email
- Trimis la fiecare schimbare de status
- Include: old status, new status, progress percent, notes

### Completion Email
- Trimis când status devine SETTLED
- Include: batch reference, asset type, quantity, actual settlement date

## API Endpoints

### GET /api/v1/settlement/pending
Listează settlements pending pentru current user.

**Query Parameters:**
- `settlement_type` (optional): Filter by type
- `status` (optional): Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "batch_reference": "SET-2026-001234-CEA",
      "settlement_type": "CEA_PURCHASE",
      "status": "PENDING",
      "asset_type": "CEA",
      "quantity": 1082.86,
      "price": 12.96,
      "total_value_eur": 14031.56,
      "expected_settlement_date": "2026-01-28T00:00:00Z",
      "progress_percent": 0.0,
      "created_at": "2026-01-25T10:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/v1/settlement/{id}
Detalii complete settlement cu timeline.

**Response:**
```json
{
  "id": "uuid",
  "batch_reference": "SET-2026-001234-CEA",
  "settlement_type": "CEA_PURCHASE",
  "status": "TRANSFER_INITIATED",
  "asset_type": "CEA",
  "quantity": 1082.86,
  "price": 12.96,
  "total_value_eur": 14031.56,
  "expected_settlement_date": "2026-01-28T00:00:00Z",
  "progress_percent": 25.0,
  "timeline": [
    {
      "status": "PENDING",
      "notes": "Settlement batch created",
      "created_at": "2026-01-25T10:00:00Z"
    },
    {
      "status": "TRANSFER_INITIATED",
      "notes": "Status automatically updated based on timeline (T+1)",
      "created_at": "2026-01-26T10:00:00Z"
    }
  ]
}
```

## Frontend Components

### SettlementTransactions
Afișează lista settlements pending cu:
- Type și batch reference
- Status badge cu icon
- Progress bar
- Expected settlement date
- Click pentru detalii

### SettlementDetails
Modal cu detalii complete:
- Header cu type și reference
- Status badge
- Details grid (asset, quantity, price, value, dates)
- Progress bar
- Timeline complet cu toate status changes
- Registry reference (dacă disponibil)
- Notes

## Error Handling

### Settlement Failed
- Status devine `FAILED`
- Email notification trimis
- Admin notification pentru investigare
- Rollback logic (dacă necesar)

### Overdue Settlements
- Background processor detectează settlements overdue
- Log warning pentru investigare
- Admin notification
- Client notification cu update

## Performance Considerations

### Indexes
- `settlement_batches.entity_id` - pentru queries user
- `settlement_batches.status` - pentru background processor
- `settlement_batches.expected_settlement_date` - pentru overdue detection
- `settlement_batches.batch_reference` - pentru lookup după reference
- `settlement_batches.order_id` - pentru link cu orders
- `settlement_batches.trade_id` - pentru link cu trades
- `settlement_batches.created_at` - pentru sorting și queries temporale
- `settlement_status_history.settlement_batch_id` - pentru timeline queries
- `settlement_status_history.created_at` - pentru sorting timeline
- `settlement_status_history.status` - pentru filtering după status

### Caching
- Pending settlements cached în frontend (refresh la 30s)
- Background processor rulează la fiecare oră (nu la fiecare request)

## Security

### Authorization
- Users pot vedea doar propriile settlements
- Admin endpoints pentru update manual status
- Audit trail complet în `SettlementStatusHistory`

### Data Integrity
- Foreign keys pentru toate relationships
- Transaction safety pentru finalizare settlement
- Rollback support pentru failed settlements

## Monitoring

### Metrics
- Number of pending settlements
- Average settlement duration
- Failed settlements count
- Overdue settlements count

### Alerts
- Settlements overdue > 1 day
- Failed settlements
- Background processor errors

## Future Enhancements

1. **Registry Integration**
   - Validare confirmări de la registries reale
   - Automatic status updates bazat pe registry confirmations

2. **Retry Logic**
   - Automatic retry pentru failed settlements
   - Secondary market fallback

3. **Reconciliation**
   - Periodic reconciliation între platformă și registries
   - Discrepancy detection și alerting

4. **Advanced Tracking**
   - Real-time status updates via WebSocket
   - Push notifications pentru mobile apps
