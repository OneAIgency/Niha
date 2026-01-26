# Plan: Implementare Settlement Extern (T+1-T+5)

## Descriere

Implementare sistem complet de settlement extern conform documentației, înlocuind settlement-ul instant actual. Sistemul va gestiona:
- **CEA Purchase Settlement:** T+1 to T+3 (transfer de la seller la Nihao custody)
- **Swap CEA→EUA Settlement:** T+1 to T+5 (transfer CEA la counterparty, EUA la Union Registry)

Toate tranzacțiile vor avea statusuri intermediare și tracking complet. Dashboard-ul va afișa tranzacții pending cu progres settlement.

## Faze de Implementare

### Faza 1: Data Layer - Modele și Migrații

#### 1.1 Creează Model SettlementBatch
**Fișier:** `backend/app/models/models.py`

**Câmpuri:**
- `id` (UUID, PK)
- `batch_reference` (String, unique, indexed) - ex: "SET-2026-001234-CEA"
- `entity_id` (UUID, FK to entities)
- `order_id` (UUID, FK to orders) - order care a generat settlement-ul
- `trade_id` (UUID, FK to cash_market_trades, nullable) - trade asociat
- `settlement_type` (Enum: CEA_PURCHASE, SWAP_CEA_TO_EUA)
- `status` (Enum: PENDING, TRANSFER_INITIATED, IN_TRANSIT, AT_CUSTODY, SETTLED, FAILED)
- `asset_type` (Enum: CEA, EUA) - ce asset se decontează
- `quantity` (Numeric) - cantitatea de decontat
- `price` (Numeric) - prețul tranzacției
- `total_value_eur` (Numeric) - valoarea totală
- `expected_settlement_date` (DateTime) - T+1, T+3, sau T+5
- `actual_settlement_date` (DateTime, nullable)
- `registry_reference` (String, nullable) - referință de la registry
- `counterparty_id` (UUID, nullable, FK) - seller sau market maker
- `notes` (Text, nullable)
- `created_at`, `updated_at`

**Enum SettlementStatus:**
```python
class SettlementStatus(str, enum.Enum):
    PENDING = "PENDING"                    # T+0: Order confirmed, waiting T+1
    TRANSFER_INITIATED = "TRANSFER_INITIATED"  # T+1: Transfer started
    IN_TRANSIT = "IN_TRANSIT"              # T+2: In registry processing
    AT_CUSTODY = "AT_CUSTODY"              # T+3: Arrived at Nihao custody (CEA) or T+2-T+3 (EUA)
    SETTLED = "SETTLED"                    # T+3 (CEA) or T+5 (EUA): Final settlement
    FAILED = "FAILED"                      # Settlement failed
```

**Enum SettlementType:**
```python
class SettlementType(str, enum.Enum):
    CEA_PURCHASE = "CEA_PURCHASE"          # CEA purchase from seller
    SWAP_CEA_TO_EUA = "SWAP_CEA_TO_EUA"    # Swap CEA→EUA
```

#### 1.2 Creează Model SettlementStatusHistory
**Fișier:** `backend/app/models/models.py`

**Câmpuri:**
- `id` (UUID, PK)
- `settlement_batch_id` (UUID, FK to settlement_batches)
- `status` (Enum SettlementStatus)
- `notes` (Text, nullable)
- `updated_by` (UUID, FK to users, nullable) - admin care a actualizat
- `created_at` (DateTime)

**Scop:** Audit trail pentru toate schimbările de status

#### 1.3 Modifică Model Order
**Fișier:** `backend/app/models/models.py`

**Adaugă câmpuri:**
- `settlement_batch_id` (UUID, FK to settlement_batches, nullable) - link la settlement batch

#### 1.4 Modifică Model CashMarketTrade
**Fișier:** `backend/app/models/models.py`

**Adaugă câmpuri:**
- `settlement_batch_id` (UUID, FK to settlement_batches, nullable) - link la settlement batch

#### 1.5 Creează Migrație Alembic
**Fișier:** `backend/alembic/versions/XXXX_add_settlement_system.py`

**Acțiuni:**
1. Creează tabel `settlement_batches`
2. Creează tabel `settlement_status_history`
3. Adaugă coloane noi în `orders` și `cash_market_trades`
4. Creează indexuri pentru performanță

### Faza 2: Business Logic - Settlement Service

#### 2.1 Creează SettlementService
**Fișier:** `backend/app/services/settlement_service.py`

**Funcții principale:**

**`create_cea_purchase_settlement()`**
- Input: order_id, trade_id, entity_id, quantity, price, seller_id
- Creează SettlementBatch cu:
  - `settlement_type = CEA_PURCHASE`
  - `status = PENDING`
  - `expected_settlement_date = T+3` (3 zile lucrătoare)
  - `asset_type = CEA`
- Creează SettlementStatusHistory entry
- Returnează settlement_batch_id

**`create_swap_settlement()`**
- Input: order_id, trade_id, entity_id, cea_quantity, eua_quantity, ratio, market_maker_id
- Creează 2 SettlementBatch entries:
  1. CEA outbound (pentru CEA trimis la counterparty)
     - `settlement_type = SWAP_CEA_TO_EUA`
     - `status = PENDING`
     - `expected_settlement_date = T+2`
     - `asset_type = CEA`
  2. EUA inbound (pentru EUA primit)
     - `settlement_type = SWAP_CEA_TO_EUA`
     - `status = PENDING`
     - `expected_settlement_date = T+5`
     - `asset_type = EUA`
- Creează SettlementStatusHistory entries
- Returnează settlement_batch_ids

**`update_settlement_status()`**
- Input: settlement_batch_id, new_status, notes, updated_by
- Actualizează SettlementBatch.status
- Creează SettlementStatusHistory entry
- Dacă status = SETTLED, apelează `finalize_settlement()`

**`finalize_settlement()`**
- Input: settlement_batch_id
- Verifică tipul settlement:
  - CEA_PURCHASE: Adaugă CEA la EntityHolding
  - SWAP_CEA_TO_EUA: 
    - Dacă asset_type = CEA: Deduct CEA din EntityHolding
    - Dacă asset_type = EUA: Adaugă EUA la EntityHolding
- Creează AssetTransaction pentru audit
- Actualizează `actual_settlement_date`

**`get_pending_settlements()`**
- Returnează toate settlement batches cu status != SETTLED
- Filtrare opțională: entity_id, settlement_type, status

**`get_settlement_timeline()`**
- Input: settlement_batch_id
- Returnează lista de status changes cu timestamps
- Calculează progres (0-100%) bazat pe status și expected_settlement_date

#### 2.2 Modifică OrderMatchingService
**Fișier:** `backend/app/services/order_matching.py`

**Modificări în `execute_market_buy_order()`:**
- **ELIMINĂ** actualizarea instantanee a EntityHolding pentru CEA
- **ELIMINĂ** `update_entity_balance()` pentru CEA
- **PĂSTREAZĂ** deduct EUR (funds sunt rezervate)
- **ADaugă** apel la `settlement_service.create_cea_purchase_settlement()` pentru fiecare trade
- **ADaugă** link settlement_batch_id la Order și CashMarketTrade

**Modificări în `execute_swap_market_order()`:**
- **ELIMINĂ** actualizarea instantanee a EntityHolding pentru CEA și EUA
- **ELIMINĂ** `update_entity_balance()` pentru CEA și EUA
- **ADaugă** apel la `settlement_service.create_swap_settlement()`
- **ADaugă** link settlement_batch_id la Order și CashMarketTrade
- **ADaugă** rezervare CEA (lock în EntityHolding cu flag "locked_for_settlement")

#### 2.3 Creează SettlementProcessor (Background Job)
**Fișier:** `backend/app/services/settlement_processor.py`

**Funcții:**

**`process_settlement_batches()`** (runs daily sau la fiecare oră)
- Query settlement batches cu status PENDING și expected_settlement_date <= today
- Pentru fiecare batch:
  - Verifică dacă este timpul pentru next status
  - Actualizează status automat:
    - T+1: PENDING → TRANSFER_INITIATED
    - T+2: TRANSFER_INITIATED → IN_TRANSIT
    - T+3: IN_TRANSIT → AT_CUSTODY (pentru CEA) sau AT_CUSTODY (pentru EUA în swap)
    - T+3: AT_CUSTODY → SETTLED (pentru CEA purchase)
    - T+5: AT_CUSTODY → SETTLED (pentru EUA în swap)
  - Trimite notificări email la fiecare schimbare de status

**`check_settlement_overdue()`**
- Verifică settlement batches cu expected_settlement_date < today și status != SETTLED
- Trimite alertă către admin
- Log pentru investigare

**Integrare în FastAPI:**
- Adaugă background task în `lifespan()` din `main.py`
- Folosește `asyncio.create_task()` pentru task periodic
- Rulează la fiecare oră sau configurable interval

### Faza 3: API Endpoints

#### 3.1 Settlement API Router
**Fișier:** `backend/app/api/v1/settlement.py`

**Endpoints:**

**`GET /settlement/pending`**
- Returnează settlement batches pending pentru current user
- Filtrare: settlement_type, status
- Include timeline și progres

**`GET /settlement/{settlement_batch_id}`**
- Detalii complete settlement batch
- Include status history
- Include timeline estimat

**`GET /settlement/{settlement_batch_id}/timeline`**
- Timeline complet cu toate status changes
- Progres procentual

**`POST /settlement/{settlement_batch_id}/update-status`** (Admin only)
- Actualizare manuală status (pentru backoffice)
- Input: new_status, notes
- Creează SettlementStatusHistory entry

#### 3.2 Modifică CashMarket API
**Fișier:** `backend/app/api/v1/cash_market.py`

**Modificări:**
- `POST /cash-market/order/market` - returnează settlement_batch_id în răspuns
- Adaugă informații settlement în OrderExecutionResponse

#### 3.3 Modifică Swaps API
**Fișier:** `backend/app/api/v1/swaps.py`

**Modificări:**
- `POST /swaps/execute-market` - returnează settlement_batch_ids în răspuns
- Adaugă informații settlement în SwapExecutionResponse

### Faza 4: Frontend - Dashboard UI

#### 4.1 Creează SettlementTransactions Component
**Fișier:** `frontend/src/components/dashboard/SettlementTransactions.tsx`

**Funcționalități:**
- Afișează lista tranzacții pending
- Filtrare: CEA Purchase, Swap
- Status badges cu culori
- Progres bar pentru fiecare settlement
- Timeline vizual cu pași
- Link către detalii

**Design:**
- Card pentru fiecare settlement
- Status indicator (pending, in progress, completed)
- Progres bar 0-100%
- Timeline cu checkmarks pentru pași compleți
- Estimated completion date
- Action buttons (view details, contact support)

#### 4.2 Creează SettlementDetails Component
**Fișier:** `frontend/src/components/dashboard/SettlementDetails.tsx`

**Funcționalități:**
- Detalii complete settlement
- Timeline complet cu toate status changes
- Informații tranzacție (order, trade, counterparty)
- Registry references
- Notes și updates

#### 4.3 Modifică DashboardPage
**Fișier:** `frontend/src/pages/DashboardPage.tsx`

**Modificări:**
- Adaugă tab nou "Pending Transactions" sau secțiune dedicată
- Integrează SettlementTransactions component
- Afișează count de pending settlements în header
- Link către settlement details

#### 4.4 Creează Settlement API Service
**Fișier:** `frontend/src/services/api.ts`

**Funcții:**
- `getPendingSettlements()` - GET /settlement/pending
- `getSettlementDetails(id)` - GET /settlement/{id}
- `getSettlementTimeline(id)` - GET /settlement/{id}/timeline

#### 4.5 Actualizează Types
**Fișier:** `frontend/src/types/index.ts`

**Adaugă:**
```typescript
interface SettlementBatch {
  id: string;
  batch_reference: string;
  settlement_type: 'CEA_PURCHASE' | 'SWAP_CEA_TO_EUA';
  status: 'PENDING' | 'TRANSFER_INITIATED' | 'IN_TRANSIT' | 'AT_CUSTODY' | 'SETTLED' | 'FAILED';
  asset_type: 'CEA' | 'EUA';
  quantity: number;
  price: number;
  total_value_eur: number;
  expected_settlement_date: string;
  actual_settlement_date?: string;
  progress_percent: number;
  timeline: SettlementStatusHistory[];
}

interface SettlementStatusHistory {
  status: string;
  notes?: string;
  created_at: string;
  updated_by?: string;
}
```

### Faza 5: Email Notifications

#### 5.1 Modifică EmailService
**Fișier:** `backend/app/services/email_service.py`

**Adaugă funcții:**

**`send_settlement_confirmation()`**
- Trimis la T+0 când order este confirmat
- Include settlement batch reference
- Include timeline estimat

**`send_settlement_status_update()`**
- Trimis la fiecare schimbare de status
- Include status nou
- Include progres
- Include next steps

**`send_settlement_completed()`**
- Trimis când settlement este completat
- Include confirmation details
- Include link către dashboard

### Faza 6: Documentație și Unificare

#### 6.1 Actualizează Documentație Workflow
**Fișier:** `docs/08_Operational_Workflow_Live_Trading.md`

**Verificări:**
- Toate timeline-urile sunt corecte (T+1-T+3 pentru CEA, T+1-T+5 pentru swap)
- Status updates sunt corecte
- Email templates sunt corecte

#### 6.2 Actualizează Workflow Detailed Document
**Fișier:** `docs/features/workflow-cea-purchase-swap-detailed.md`

**Actualizări:**
- Elimină secțiunea "Discrepanță"
- Actualizează workflow-urile să reflecte settlement extern
- Adaugă pași noi pentru settlement processing

#### 6.3 Creează Settlement System Documentation
**Fișier:** `docs/architecture/settlement-system.md`

**Conținut:**
- Arhitectură settlement system
- Flow diagrams
- Status transitions
- Timeline-uri pentru fiecare tip de settlement
- Error handling și retry logic

## Algoritmi

### Settlement Status Progression

**CEA Purchase:**
```
T+0: Order confirmed → PENDING
T+1: Transfer initiated → TRANSFER_INITIATED
T+2: In registry processing → IN_TRANSIT
T+3: Arrived at Nihao custody → AT_CUSTODY → SETTLED (finalize settlement, add CEA to balance)
```

**Swap CEA→EUA:**
```
CEA Outbound:
  T+0: Swap confirmed → PENDING
  T+1: CEA transfer initiated → TRANSFER_INITIATED
  T+2: In transit → IN_TRANSIT → AT_CUSTODY (at counterparty)
  T+2: Finalize CEA deduction

EUA Inbound:
  T+0: Swap confirmed → PENDING
  T+2: EUA transfer initiated → TRANSFER_INITIATED
  T+3: EUA at Nihao custody → AT_CUSTODY
  T+5: EUA delivered to Union Registry → SETTLED (finalize settlement, add EUA to balance)
```

### Background Job Scheduling

**SettlementProcessor.run()** (executed hourly):
```python
1. Query pending settlements where expected_settlement_date <= today
2. For each settlement:
   a. Calculate days since order creation (T+0)
   b. Determine expected status based on timeline
   c. If current status != expected status:
      - Update status to expected status
      - Create status history entry
      - Send email notification
   d. If status == SETTLED and not finalized:
      - Call finalize_settlement()
      - Update EntityHolding
      - Send completion email
```

## Fișiere de Modificat

### Backend

**Modele:**
- `backend/app/models/models.py` - Adaugă SettlementBatch, SettlementStatusHistory, enums noi

**Servicii:**
- `backend/app/services/settlement_service.py` - NOU
- `backend/app/services/settlement_processor.py` - NOU
- `backend/app/services/order_matching.py` - Modifică execute_market_buy_order(), execute_swap_market_order()
- `backend/app/services/email_service.py` - Adaugă funcții settlement emails

**API:**
- `backend/app/api/v1/settlement.py` - NOU
- `backend/app/api/v1/cash_market.py` - Modifică răspunsuri să includă settlement info
- `backend/app/api/v1/swaps.py` - Modifică răspunsuri să includă settlement info

**Core:**
- `backend/app/main.py` - Adaugă background task pentru SettlementProcessor

**Migrații:**
- `backend/alembic/versions/XXXX_add_settlement_system.py` - NOU

**Schemas:**
- `backend/app/schemas/schemas.py` - Adaugă SettlementBatchResponse, SettlementStatusHistoryResponse

### Frontend

**Components:**
- `frontend/src/components/dashboard/SettlementTransactions.tsx` - NOU
- `frontend/src/components/dashboard/SettlementDetails.tsx` - NOU
- `frontend/src/pages/DashboardPage.tsx` - Modifică să includă pending transactions

**Services:**
- `frontend/src/services/api.ts` - Adaugă settlement API calls

**Types:**
- `frontend/src/types/index.ts` - Adaugă SettlementBatch, SettlementStatusHistory types

### Documentație

- `docs/08_Operational_Workflow_Live_Trading.md` - Verificare și actualizare
- `docs/features/workflow-cea-purchase-swap-detailed.md` - Actualizare workflow-uri
- `docs/architecture/settlement-system.md` - NOU

## Dependențe Noi

**Backend:**
- `APScheduler` sau `asyncio` pentru background jobs (asyncio este deja disponibil)
- Nu sunt necesare dependențe noi majore

## Testare

### Unit Tests
- `backend/tests/test_settlement_service.py` - Teste pentru settlement service
- `backend/tests/test_settlement_processor.py` - Teste pentru background processor
- `backend/tests/test_order_matching_settlement.py` - Teste pentru order matching cu settlement

### Integration Tests
- Test workflow complet CEA purchase cu settlement
- Test workflow complet swap cu settlement
- Test status progression automat
- Test email notifications

## Note de Implementare

1. **Backward Compatibility:** Tranzacțiile existente fără settlement batches vor rămâne funcționale. Noile tranzacții vor folosi sistemul de settlement.

2. **Migration Strategy:** 
   - Creează migrație pentru tabele noi
   - Rulare migrație înainte de deploy
   - Noile tranzacții folosesc settlement, cele vechi rămân instant

3. **Error Handling:**
   - Settlement failed → status FAILED
   - Retry logic pentru settlement processor
   - Admin notification pentru failed settlements

4. **Performance:**
   - Indexuri pe settlement_batch_id în orders și cash_market_trades
   - Indexuri pe status și expected_settlement_date pentru queries rapide
   - Cache pentru pending settlements în dashboard

5. **Security:**
   - Users pot vedea doar propriile settlements
   - Admin endpoints pentru update status manual
   - Audit trail complet în SettlementStatusHistory
