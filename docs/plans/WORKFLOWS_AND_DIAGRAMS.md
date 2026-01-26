# Niha Carbon Platform - Workflows & Diagrams
**Version:** 1.0 (Draft)
**Date:** 2026-01-26
**Status:** Work in Progress

---

## 📋 Table of Contents

1. [User Roles & Permissions](#user-roles--permissions)
2. [Deposit Workflow](#deposit-workflow)
3. [Withdrawal Workflow](#withdrawal-workflow)
4. [KYC & Onboarding Flow](#kyc--onboarding-flow)
5. [Trading Workflow](#trading-workflow)
6. [Settlement Workflow](#settlement-workflow)
7. [System Architecture](#system-architecture)
8. [Database Schema Overview](#database-schema-overview)

---

## 1. User Roles & Permissions

```mermaid
graph TB
    subgraph "User Roles"
        ADMIN[Admin]
        CLIENT[Client/Approved User]
        PENDING[Pending User]
        MM[Market Maker]
    end

    subgraph "Admin Permissions"
        ADMIN --> A1[Manage Users]
        ADMIN --> A2[Review KYC]
        ADMIN --> A3[Approve/Reject Deposits]
        ADMIN --> A4[Approve/Reject Withdrawals]
        ADMIN --> A5[Manage Market Makers]
        ADMIN --> A6[View All Transactions]
        ADMIN --> A7[Access Audit Logs]
    end

    subgraph "Client Permissions"
        CLIENT --> C1[Announce Deposits]
        CLIENT --> C2[Request Withdrawals]
        CLIENT --> C3[Upload KYC Documents]
        CLIENT --> C4[Place Orders]
        CLIENT --> C5[View Portfolio]
        CLIENT --> C6[View Transaction History]
    end

    subgraph "Pending User"
        PENDING --> P1[Complete Onboarding]
        PENDING --> P2[Upload KYC]
        PENDING --> P3[View Status]
    end

    subgraph "Market Maker"
        MM --> M1[All Client Permissions]
        MM --> M2[API Access]
        MM --> M3[Auto-Quoting]
        MM --> M4[Bulk Orders]
    end
```

---

## 2. Deposit Workflow

### 2.1 Full Deposit Journey

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant A as Admin
    participant AML as AML System

    Note over C,AML: Phase 1: Announcement
    C->>FE: Announces wire transfer + provides bank details
    Note right of C: Bank details: IBAN, SWIFT,<br/>bank name (ad-hoc, not pre-registered)
    FE->>BE: POST /funding/deposits/announce<br/>(amount, currency, bank_details)
    BE->>DB: Create deposit (status: PENDING)<br/>Store bank details in deposit record
    BE-->>FE: Return wire instructions + deposit_id
    FE-->>C: Show wire transfer details

    Note over C,AML: Phase 2: Bank Transfer (External)
    C->>C: Initiates wire transfer at bank

    Note over C,AML: Phase 3: Admin Confirmation
    A->>FE: Opens Pending Deposits tab
    FE->>BE: GET /admin/deposits?status=PENDING
    BE-->>FE: Return pending deposits
    A->>FE: Confirms receipt with actual amount
    FE->>BE: POST /admin/deposits/{id}/confirm
    BE->>DB: Update deposit (status: ON_HOLD)
    BE->>AML: Create AML hold record
    AML->>AML: Calculate hold period
    BE-->>FE: Confirmation success

    Note over C,AML: Phase 4: AML Hold Period (1-3 days)
    AML->>AML: Wait for hold period

    Note over C,AML: Phase 5: AML Review
    A->>FE: Opens AML Review tab
    FE->>BE: GET /admin/deposits?status=ON_HOLD
    BE-->>FE: Return deposits ready for review
    A->>FE: Reviews compliance context
    A->>FE: Approves deposit
    FE->>BE: POST /admin/deposits/{id}/approve
    BE->>DB: Update deposit (status: CLEARED)
    BE->>DB: Update client balance += amount
    BE-->>FE: Success
    FE-->>A: Show confirmation
    BE->>C: Send notification (email + in-app)
```

### 2.2 Deposit State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Client announces transfer
    PENDING --> ON_HOLD: Admin confirms receipt
    PENDING --> CANCELLED: Client cancels (timeout)

    ON_HOLD --> CLEARED: Admin approves (AML review)
    ON_HOLD --> REJECTED: Admin rejects (compliance issue)

    CLEARED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]

    note right of ON_HOLD
        Hold period: 1-3 days
        - First deposit: 1-2 days
        - Large amount (>€500K): 3 days
    end note

    note right of CLEARED
        Balance updated
        Client can trade
    end note
```

### 2.3 Hold Period Calculation Logic

```mermaid
flowchart TD
    Start([Deposit Confirmed]) --> CheckFirst{Is first deposit?}

    CheckFirst -->|Yes| CheckAmount{Amount >= €50,000?}
    CheckFirst -->|No| CheckLarge{Amount > €500,000?}

    CheckAmount -->|Yes| Hold2[Hold: 2 business days<br/>Type: FIRST_DEPOSIT]
    CheckAmount -->|No| Hold1[Hold: 1 business day<br/>Type: FIRST_DEPOSIT]

    CheckLarge -->|Yes| Hold3[Hold: 3 business days<br/>Type: LARGE_AMOUNT]
    CheckLarge -->|No| Hold1Sub[Hold: 1 business day<br/>Type: SUBSEQUENT]

    Hold1 --> CalcExpiry[Calculate expiry date<br/>Skip weekends]
    Hold2 --> CalcExpiry
    Hold3 --> CalcExpiry
    Hold1Sub --> CalcExpiry

    CalcExpiry --> CreateAML[Create AML hold record<br/>Status: ON_HOLD]
    CreateAML --> End([Ready for AML review])
```

---

## 3. Withdrawal Workflow

### 3.1 Withdrawal Journey

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant A as Admin
    participant Bank as External Bank

    Note over C,Bank: Phase 1: Request
    C->>FE: Requests withdrawal + provides bank details
    Note right of C: Bank details: IBAN, SWIFT,<br/>bank name, account holder<br/>(ad-hoc, not pre-registered)
    FE->>BE: POST /funding/withdrawals/request<br/>(amount, currency, bank_details)
    BE->>DB: Check: balance >= amount?
    alt Insufficient balance
        BE-->>FE: Error: Insufficient balance
        FE-->>C: Show error
    else Sufficient balance
        BE->>DB: Create withdrawal (status: PENDING)
        BE->>DB: Reserve balance (locked)
        BE-->>FE: Withdrawal created
        FE-->>C: Request submitted
        BE->>A: Notify admin (email + dashboard)
    end

    Note over C,Bank: Phase 2: Admin Review
    A->>FE: Opens Withdrawals tab
    FE->>BE: GET /admin/withdrawals?status=PENDING
    BE-->>FE: Return pending withdrawals
    A->>FE: Reviews request

    alt Admin Approves
        A->>FE: Approves withdrawal
        FE->>BE: POST /admin/withdrawals/{id}/approve
        BE->>DB: Update withdrawal (status: APPROVED)
        BE->>DB: Deduct from balance
        BE->>DB: Update withdrawal (status: PROCESSING)
        BE-->>FE: Success
        BE->>C: Notify approval

        Note over A,Bank: Phase 3: Bank Transfer (Manual)
        A->>Bank: Initiates wire transfer
        Bank-->>A: Transfer completed

        A->>FE: Marks as completed
        FE->>BE: POST /admin/withdrawals/{id}/complete
        BE->>DB: Update withdrawal (status: COMPLETED)
        BE-->>FE: Success
        BE->>C: Notify completion
    else Admin Rejects
        A->>FE: Rejects with reason
        FE->>BE: POST /admin/withdrawals/{id}/reject
        BE->>DB: Update withdrawal (status: REJECTED)
        BE->>DB: Unlock reserved balance
        BE-->>FE: Success
        BE->>C: Notify rejection with reason
    end
```

### 3.2 Withdrawal State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Client requests withdrawal

    PENDING --> APPROVED: Admin approves
    PENDING --> REJECTED: Admin rejects
    PENDING --> CANCELLED: Client cancels

    APPROVED --> PROCESSING: Balance deducted<br/>Wire transfer initiated

    PROCESSING --> COMPLETED: Transfer confirmed
    PROCESSING --> FAILED: Transfer failed

    FAILED --> PENDING: Retry

    COMPLETED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]

    note right of PENDING
        Balance locked
        Cannot trade with locked amount
    end note

    note right of REJECTED
        Balance unlocked
        Rejection reason provided
    end note
```

---

## 4. KYC & Onboarding Flow

### 4.1 Full Onboarding Journey

```mermaid
flowchart TD
    Start([User Registration]) --> CreateAccount[Create Account<br/>Email + Password]
    CreateAccount --> VerifyEmail{Email verified?}

    VerifyEmail -->|No| SendVerification[Send verification email]
    SendVerification --> VerifyEmail

    VerifyEmail -->|Yes| SelectType[Select Entity Type]

    SelectType --> Company{Company or<br/>Individual?}

    Company -->|Company| CompanyForm[Fill Company Details<br/>- Legal name<br/>- Registration number<br/>- Jurisdiction<br/>- Address]
    Company -->|Individual| IndividualForm[Fill Individual Details<br/>- Full name<br/>- Date of birth<br/>- Nationality<br/>- Address]

    CompanyForm --> UploadKYC[Upload KYC Documents]
    IndividualForm --> UploadKYC

    UploadKYC --> RequiredDocs{All required<br/>docs uploaded?}

    RequiredDocs -->|No| ShowChecklist[Show missing documents]
    ShowChecklist --> UploadKYC

    RequiredDocs -->|Yes| Submit[Submit for Review]
    Submit --> PendingReview[Status: PENDING_REVIEW]

    PendingReview --> AdminReview[Admin Reviews]

    AdminReview --> Decision{Admin Decision}

    Decision -->|Approve| Approved[Status: APPROVED<br/>Can start trading]
    Decision -->|Request Changes| ChangesNeeded[Status: CHANGES_REQUESTED<br/>With feedback comments]
    Decision -->|Reject| Rejected[Status: REJECTED<br/>With rejection reason]

    ChangesNeeded --> UpdateInfo[User updates information]
    UpdateInfo --> Submit

    Approved --> Funded{Has funded<br/>account?}
    Funded -->|Yes| Trading[Status: FUNDED<br/>Can trade]
    Funded -->|No| WaitingFunds[Status: APPROVED<br/>Awaiting deposit]

    Trading --> End([Fully Onboarded])

    style Approved fill:#d4edda
    style Rejected fill:#f8d7da
    style ChangesNeeded fill:#fff3cd
```

### 4.2 KYC Document Types

```mermaid
graph LR
    subgraph "Individual KYC"
        I1[Passport or National ID]
        I2[Proof of Address<br/>Utility bill, Bank statement]
        I3[Selfie with ID<br/>Optional]
    end

    subgraph "Company KYC"
        C1[Certificate of Incorporation]
        C2[Company Registration Extract]
        C3[Articles of Association]
        C4[Proof of Company Address]
        C5[Director ID Documents]
        C6[Shareholder Information<br/>If >25% ownership]
        C7[Beneficial Owner Declaration]
    end

    subgraph "KYC Status"
        S1[Each document: PENDING_REVIEW]
        S2[Admin reviews each]
        S3[APPROVED or REJECTED per doc]
        S4[Overall KYC status]
    end

    I1 --> S1
    I2 --> S1
    C1 --> S1
    C2 --> S1
    C3 --> S1
    C4 --> S1
    C5 --> S1
    C6 --> S1
    C7 --> S1

    S1 --> S2
    S2 --> S3
    S3 --> S4
```

---

## 5. Trading Workflow

### 5.1 Order Placement & Matching

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend
    participant BE as Backend/Order Engine
    participant DB as Database
    participant MM as Market Maker

    Note over C,MM: Phase 1: Order Placement
    C->>FE: Places BUY order (100 EUA @ €99.50)
    FE->>BE: POST /orders/place
    BE->>DB: Check: balance >= (100 * 99.50)?

    alt Insufficient Balance
        BE-->>FE: Error: Insufficient balance
        FE-->>C: Show error
    else Sufficient Balance
        BE->>DB: Create order (status: PENDING)
        BE->>DB: Lock balance (100 * 99.50)
        BE->>DB: Update order (status: OPEN)
        BE->>BE: Attempt immediate match

        Note over BE,DB: Order Matching Logic
        BE->>DB: Query SELL orders where price <= 99.50
        BE->>DB: Order by price ASC, created_at ASC

        alt Match Found
            BE->>DB: Create trade (buyer + seller)
            BE->>DB: Update both orders (fill quantity)
            BE->>DB: Update balances
            BE-->>FE: Order filled
            BE->>C: Notify fill
            BE->>MM: Notify fill (if MM was counterparty)
        else No Match
            BE-->>FE: Order placed (waiting for match)
            BE->>C: Notify order placed
        end
    end

    Note over C,MM: Background: Continuous Matching
    loop Every N seconds
        BE->>DB: Query OPEN orders
        BE->>BE: Match compatible orders
        BE->>DB: Create trades + update orders
        BE->>C: Notify fills
    end
```

### 5.2 Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Order created
    PENDING --> OPEN: Validations passed<br/>Balance/certificates locked
    PENDING --> REJECTED: Validation failed

    OPEN --> PARTIALLY_FILLED: Partial match
    OPEN --> FILLED: Fully matched
    OPEN --> CANCELLED: User cancels
    OPEN --> EXPIRED: Time limit reached (if applicable)

    PARTIALLY_FILLED --> FILLED: Remaining quantity matched
    PARTIALLY_FILLED --> CANCELLED: User cancels remainder

    FILLED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]

    note right of OPEN
        Waiting in order book
        Balance/certificates locked
    end note

    note right of PARTIALLY_FILLED
        Some quantity filled
        Remaining still in book
    end note
```

### 5.3 Order Matching Algorithm

```mermaid
flowchart TD
    Start([New BUY order received]) --> LockFunds[Lock buyer's balance]
    LockFunds --> QuerySells[Query SELL orders<br/>WHERE price <= buy_price<br/>ORDER BY price ASC, created_at ASC]

    QuerySells --> HasSells{Any matching<br/>SELL orders?}

    HasSells -->|No| AddToBook[Add to order book<br/>Status: OPEN]
    AddToBook --> End([Done])

    HasSells -->|Yes| NextSell[Take next SELL order]
    NextSell --> CalcQty[quantity = MIN(buy.remaining, sell.remaining)]

    CalcQty --> CreateTrade[Create trade record<br/>- buyer_id, seller_id<br/>- quantity, price]

    CreateTrade --> UpdateOrders[Update both orders<br/>- filled_quantity<br/>- remaining_quantity]

    UpdateOrders --> TransferAssets[Transfer assets<br/>- Deduct buyer balance<br/>- Add buyer certificates<br/>- Deduct seller certificates<br/>- Add seller balance]

    TransferAssets --> NotifyUsers[Notify both parties<br/>WebSocket + Email]

    NotifyUsers --> CheckBuyRemaining{Buy order<br/>fully filled?}

    CheckBuyRemaining -->|Yes| BuyFilled[Mark BUY: FILLED]
    CheckBuyRemaining -->|No| CheckMoreSells{More matching<br/>SELL orders?}

    CheckMoreSells -->|Yes| NextSell
    CheckMoreSells -->|No| BuyPartial[Mark BUY: PARTIALLY_FILLED<br/>Add to order book]

    BuyFilled --> End
    BuyPartial --> End
```

---

## 6. Settlement Workflow

### 6.1 Settlement Journey

```mermaid
sequenceDiagram
    participant Trade as Trade System
    participant Settlement as Settlement Processor
    participant DB as Database
    participant Registry as EU Registry
    participant Buyer as Buyer
    participant Seller as Seller

    Note over Trade,Seller: T+0: Trade Executed
    Trade->>DB: Create trade record
    Trade->>Settlement: Trigger settlement process

    Note over Trade,Seller: T+1: Settlement Initiation
    Settlement->>DB: Create settlement batch
    Settlement->>DB: Group trades by T+2 date
    Settlement->>DB: Update batch status: PENDING

    Note over Trade,Seller: T+2: Settlement Processing
    Settlement->>Settlement: Check buyer has EUR balance
    Settlement->>Settlement: Check seller has certificates

    alt All checks pass
        Settlement->>DB: Update batch: PROCESSING
        Settlement->>Registry: Request certificate transfer

        Registry-->>Settlement: Transfer initiated (ref: ABC123)

        Settlement->>DB: Update batch: AWAITING_CONFIRMATION
        Settlement->>Buyer: Notify: certificates in transit
        Settlement->>Seller: Notify: EUR credited, certs being transferred

        Note over Settlement,Registry: Wait for registry confirmation
        Registry-->>Settlement: Transfer confirmed

        Settlement->>DB: Update batch: SETTLED
        Settlement->>DB: Update buyer position: + certificates
        Settlement->>DB: Update seller position: - certificates
        Settlement->>Buyer: Notify: certificates received
        Settlement->>Seller: Notify: transfer completed
    else Checks fail
        Settlement->>DB: Update batch: FAILED
        Settlement->>DB: Add failure reason
        Settlement->>Buyer: Notify failure
        Settlement->>Seller: Notify failure
        Settlement->>Trade: Reverse trade (optional)
    end
```

### 6.2 Settlement State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Batch created (T+0)

    PENDING --> PROCESSING: T+2 reached<br/>All validations pass
    PENDING --> ON_HOLD: Issue detected<br/>Manual review needed

    PROCESSING --> AWAITING_CONFIRMATION: Transfer initiated<br/>Waiting for registry

    AWAITING_CONFIRMATION --> SETTLED: Registry confirms
    AWAITING_CONFIRMATION --> FAILED: Registry rejects<br/>or timeout

    ON_HOLD --> PROCESSING: Admin resolves issue
    ON_HOLD --> FAILED: Cannot resolve

    FAILED --> [*]
    SETTLED --> [*]

    note right of PENDING
        T+0 to T+2
        Pre-settlement checks
    end note

    note right of AWAITING_CONFIRMATION
        Certificates in transit
        Balances already updated
    end note
```

---

## 7. System Architecture

### 7.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web Application<br/>React + TypeScript]
        MobileApp[Mobile App<br/>Future]
    end

    subgraph "API Gateway"
        LB[Load Balancer<br/>ALB/Nginx]
        Auth[Authentication<br/>JWT + Redis]
    end

    subgraph "Application Layer"
        API[FastAPI Backend]
        WS[WebSocket Server<br/>Real-time updates]
        BG[Background Workers<br/>Order matching, settlements]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Main database)]
        Redis[(Redis<br/>Sessions, cache)]
        S3[S3<br/>Document storage]
    end

    subgraph "External Services"
        Email[Email Service<br/>Resend]
        Registry[EU Registry API]
        Bank[Banking Partner]
    end

    WebApp --> LB
    MobileApp --> LB
    LB --> Auth
    Auth --> API
    Auth --> WS

    API --> PG
    API --> Redis
    API --> S3
    API --> Email
    API --> Registry

    BG --> PG
    BG --> Redis
    BG --> Email
    BG --> Registry

    WS --> Redis
```

### 7.2 Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant LB as Load Balancer
    participant Auth as Auth Middleware
    participant API as API Endpoint
    participant Cache as Redis Cache
    participant DB as PostgreSQL

    U->>FE: Action (e.g., place order)
    FE->>LB: HTTPS Request + JWT token
    LB->>Auth: Forward request

    Auth->>Cache: Validate JWT token
    alt Token invalid
        Cache-->>Auth: Invalid
        Auth-->>FE: 401 Unauthorized
        FE-->>U: Redirect to login
    else Token valid
        Cache-->>Auth: Valid + user info
        Auth->>API: Forward request + user context

        API->>Cache: Check cache
        alt Cache hit
            Cache-->>API: Return cached data
            API-->>FE: Response
        else Cache miss
            API->>DB: Query database
            DB-->>API: Return data
            API->>Cache: Store in cache
            API-->>FE: Response
        end

        FE-->>U: Display result
    end
```

---

## 8. Database Schema Overview

### 8.1 Core Entities

```mermaid
erDiagram
    USERS ||--o{ ENTITIES : "belongs to"
    USERS ||--o{ DEPOSITS : "makes"
    USERS ||--o{ WITHDRAWALS : "requests"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ KYC_DOCUMENTS : "uploads"

    ENTITIES ||--o{ POSITIONS : "holds"
    ENTITIES ||--o{ TRANSACTIONS : "makes"

    ORDERS ||--o{ TRADES : "results in"
    ORDERS ||--o{ ORDER_FILLS : "has"

    TRADES ||--o{ SETTLEMENT_BATCHES : "grouped in"

    DEPOSITS ||--o{ AML_DEPOSITS : "triggers"

    USERS {
        uuid id PK
        uuid entity_id FK
        string email
        string password_hash
        enum role
        boolean is_active
        timestamp created_at
    }

    ENTITIES {
        uuid id PK
        string legal_name
        enum entity_type
        string jurisdiction
        enum kyc_status
        decimal balance_amount
        string balance_currency
    }

    DEPOSITS {
        uuid id PK
        uuid user_id FK
        uuid entity_id FK
        decimal amount
        string currency
        string wire_reference
        string bank_iban
        string bank_swift
        string bank_name
        enum status
        timestamp created_at
    }

    AML_DEPOSITS {
        uuid id PK
        uuid deposit_id FK
        enum status
        enum hold_type
        integer hold_days_required
        timestamp hold_expires_at
        uuid cleared_by_admin_id FK
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid entity_id FK
        enum certificate_type
        enum side
        decimal quantity
        decimal price
        enum status
        decimal filled_quantity
    }

    TRADES {
        uuid id PK
        uuid buy_order_id FK
        uuid sell_order_id FK
        uuid buyer_entity_id FK
        uuid seller_entity_id FK
        decimal quantity
        decimal price
        timestamp executed_at
    }
```

---

## 9. Questions for Refinement

Acum că avem structura de bază, hai să o perfecționăm împreună:

### 9.1 Despre Deposits & Withdrawals:
- [ ] Vrei să permitem clienților să anuleze deposits în status PENDING?
- [ ] Limită minimă/maximă pentru deposits/withdrawals?
- [ ] Fees pentru withdrawals? Dacă da, structură (flat fee / percentage)?
- [ ] Multiple currencies (EUR, USD, GBP) sau doar EUR initial?

### 9.2 Despre Trading:
- [ ] Suport pentru order types: Market, Limit, Stop-Loss, Take-Profit?
- [ ] Time-in-force: GTC (Good Till Cancelled), Day Order, IOC (Immediate or Cancel)?
- [ ] Minimum order quantity? (ex: minimum 1 EUA certificate)
- [ ] Maximum position limits per client?
- [ ] Fees pentru trades? Maker/Taker model?

### 9.3 Despre Settlement:
- [ ] T+2 standard sau vrei flexibilitate?
- [ ] Settlement în batch (end of day) sau real-time?
- [ ] Fallback dacă EU Registry API nu răspunde?
- [ ] Partial settlements acceptate?

### 9.4 Despre Market Makers:
- [ ] Câți market makers vor fi pe platformă?
- [ ] Minimum quote requirements? (must maintain bid/ask spread)
- [ ] Inventory limits per market maker?
- [ ] Rebate structure pentru MM (primesc back parte din fees)?

### 9.5 Despre Notifications:
- [ ] Email + in-app suficient sau vrei și SMS?
- [ ] Push notifications (browser/mobile)?
- [ ] Telegram/Slack webhooks pentru admini?

### 9.6 Despre Reporting & Compliance:
- [ ] Rapoarte regulate către autorități? (MiFID II, EMIR?)
- [ ] Export format preferat: CSV, Excel, PDF?
- [ ] Retention policy: păstrăm date câți ani?

---

## 10. Next Steps

Spune-mi:
1. **Ce workflow vrei să clarificăm mai întâi?** (Deposits, Withdrawals, Trading, etc.)
2. **Ce elemente vrei să scoatem din plan?** (Features care nu sunt prioritare)
3. **Ce elemente vrei să adăugăm?** (Features care lipsesc)
4. **Ce întrebări din secțiunea 9 vrei să discutăm?**

Apoi vom:
- Actualiza MASTER_IMPLEMENTATION_PLAN.md cu deciziile tale
- Crea diagrame mai detaliate pentru workflow-urile selectate
- Prioritiza sprint-urile pe baza feedback-ului tău

---

**Nota:** Toate diagramele Mermaid se randează automat în:
- GitHub
- GitLab
- Visual Studio Code (cu extensie Markdown Preview)
- Obsidian
- Confluence (cu plugin)
