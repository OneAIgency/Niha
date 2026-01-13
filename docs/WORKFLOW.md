# Niha Platform - Complete Workflow Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Phase 1: NDA Submission](#phase-1-nda-submission)
4. [Phase 2: NDA Review & Account Creation](#phase-2-nda-review--account-creation)
5. [Phase 3: Onboarding & KYC](#phase-3-onboarding--kyc)
6. [Phase 4: KYC Review](#phase-4-kyc-review)
7. [Phase 5: Funding](#phase-5-funding)
8. [Phase 6: Trading](#phase-6-trading)
9. [CEA Cash Market](#cea-cash-market)
10. [CEA → EUA Swap Market](#cea--eua-swap-market)
11. [Confirmation Flows](#confirmation-flows)
12. [AI Agents](#ai-agents)
13. [Admin Features](#admin-features)

---

## Overview

Niha is a carbon trading platform that bridges the EU ETS (European Union Emissions Trading System) and China ETS markets. The platform facilitates:

- **CEA Purchasing**: EU entities buy Chinese Emission Allowances (CEA)
- **CEA → EUA Swaps**: Convert CEA to European Union Allowances (EUA) for EU ETS compliance

### Key Principles
- All transactions require **100% full payment upfront**
- Funds secured in **Nihao client account with HSBC**
- **Instant platform transactions** (all participants online)
- Only external dependencies (registries, banks) have real waiting time

---

## User Roles

| Role | Access | Trading | Description |
|------|--------|---------|-------------|
| **PENDING** | /onboarding | No | New user, needs KYC verification |
| **APPROVED** | /dashboard (blurred trading) | No | KYC approved, needs funding |
| **FUNDED** | Full platform | Yes | Fully verified and funded |
| **ADMIN** | Everything + Admin pages | Yes | Platform administrator |
| **AGENT** | Backend only | N/A | AI agent (Ollama) for market making |

---

## Phase 1: NDA Submission

### Login Page (/login)

```
┌─────────────────────────────────────┐
│           LOGIN PAGE                │
│  ┌─────────────┐ ┌───────────────┐  │
│  │   ENTER     │ │  SUBMIT NDA   │  │
│  │ (Existing)  │ │ (New Client)  │  │
│  └─────────────┘ └───────────────┘  │
└─────────────────────────────────────┘
```

### NDA Upload Page (/nda-upload)

**Required Fields:**
- Upload signed NDA (PDF)
- Corporate Email
- Representative Name
- Position in Company

**Flow:**
1. New client clicks "Submit NDA"
2. Fills form and uploads signed NDA
3. Submits for admin review
4. Status: PENDING REVIEW

---

## Phase 2: NDA Review & Account Creation

### Admin Settings Page (/settings)

**NDA Submissions Table:**
| Representative | Position | Email | NDA | Actions |
|----------------|----------|-------|-----|---------|
| John Smith | CEO | john@corp.com | [View] | [Approve] [Reject] |

### Flow:
1. Admin reviews NDA in /settings
2. If approved → [Create Account] button appears
3. Admin clicks [Create Account]
4. System auto-generates:
   - User account
   - Random password
   - Role: PENDING
5. Credentials visible in /users page
6. Admin sends credentials to client (email/phone)

### Users Page (/users)
| Name | Email | Password | Role | Status | Actions |
|------|-------|----------|------|--------|---------|
| John Smith | john@corp.com | Xk9#mP2$ | PENDING | Active | [Edit] |

---

## Phase 3: Onboarding & KYC

### Onboarding Page (/onboarding)

**Available to:** Role = PENDING

**Sections:**
1. **Documentation (Read-only)**
   - Market Overview
   - About Nihao
   - CEA Holders Info
   - EUA Holders Info
   - EU Entities Info
   - Strategic Advantages

2. **Upload Documents (KYC Files)**
   - ID Documents
   - Company Documents
   - Financial Statements
   - Compliance Documents

3. **Review Checklist**
   - Verify all documents uploaded

4. **Submit for Activation**
   - [SEND REQUEST] button
   - Enabled only when all documents uploaded

### Flow:
1. Client logs in with credentials
2. Reads documentation
3. Uploads all KYC documents
4. Reviews checklist
5. Clicks [SEND REQUEST]
6. Status: PENDING_REVIEW
7. Admin receives notification

---

## Phase 4: KYC Review

### Backoffice Page (/backoffice)

**Notification:** "John Smith submitted full documentation for review"

**KYC Document Review:**
| Document | Status | Actions |
|----------|--------|---------|
| Passport | Pending | [View] [Approve] [Reject] |
| Company Registration | Approved | [View] |
| Financial Statement | Rejected | [View] - Reason shown |

### Flow:
1. Admin receives notification
2. Reviews each document in /backoffice
3. Approves or rejects each document
4. If rejected → Client notified, can resubmit
5. If ALL approved:
   - Role: PENDING → APPROVED
   - Email sent: "KYC approved, new privileges granted"

---

## Phase 5: Funding

### Client View (Role: APPROVED)

- Can access Dashboard, Profile
- Trading features LOCKED (blurred/disabled)
- Sees: "Please fund your account to enable trading"
- Bank details provided for wire transfer

### Admin Funding Approval (/users)

When admin confirms wire received in Nihao client account:

```
┌─────────────────────────────────────────────────┐
│  User: John Smith              [FUND USER]      │
│  ┌───────────────────────────────────────────┐  │
│  │  Amount:   [5,000,000]                    │  │
│  │  Currency: [EUR ▼]                        │  │
│  │                                           │  │
│  │            [APPROVE FUNDING]              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Flow:
1. Client sends wire transfer to Nihao client account (HSBC)
2. Admin confirms wire received
3. Admin inputs amount and currency
4. Clicks [APPROVE FUNDING]
5. Role: APPROVED → FUNDED
6. Email sent: "Account funded, trading enabled"

---

## Phase 6: Trading

### Available to: Role = FUNDED

**Pages:**
- /dashboard - Portfolio overview
- /cash-market - Buy CEA
- /swap - Swap CEA → EUA
- /profile - Account settings

### Trading Flow:

```
€5,000,000     ───BUY CEA───►    443,014 CEA    ───SWAP───►    39,357 EUA
(EUR Balance)                    (CEA Balance)                  (EUA Balance)
                                                                     │
                                                                     ▼
                                                              EU ETS Compliance
```

---

## CEA Cash Market

### Page: /cash-market

### Rules:
| Rule | Description |
|------|-------------|
| Buyers | Real funded users only |
| Sellers | AI Agents (Ollama) only |
| Order Type | BUY only (users cannot sell) |
| Order Amount | 100% of available balance (no partial) |
| Payment | 100% upfront, locked in client account |
| Delivery | 10-30 days (China ETS registry) |

### UI Layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│  CEA CASH MARKET              Last: ¥88.50  |  +1.2%  |  Vol: 1.2M  │
├─────────────────────────────────┬───────────────────────────────────┤
│  ORDER BOOK                     │  YOUR ORDER                       │
│  ┌───────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │    BID     │     ASK      │  │  │  Available Balance          │  │
│  │  (empty)   │   ¥88.50 ███ │  │  │  €5,000,000.00              │  │
│  │            │   ¥88.55 ██  │  │  └─────────────────────────────┘  │
│  │            │   ¥88.60 ████│  │  ┌─────────────────────────────┐  │
│  │            │   ¥88.65 ███ │  │  │  Order Preview              │  │
│  │            │   ¥88.70 █   │  │  │  Price:    ¥88.50           │  │
│  │            │              │  │  │  Amount:   €5,000,000       │  │
│  │  No bids   │  AI Sellers  │  │  │  Quantity: ~443,014 CEA     │  │
│  └───────────────────────────┘  │  │  Fee:      €25,000          │  │
│                                 │  │  Net CEA:  ~440,789         │  │
│                                 │  └─────────────────────────────┘  │
│                                 │  ┌─────────────────────────────┐  │
│                                 │  │  [ BUY CEA - FULL BALANCE ] │  │
│                                 │  └─────────────────────────────┘  │
├─────────────────────────────────┴───────────────────────────────────┤
│  RECENT TRANSACTIONS                                                │
│  Time     │ Type │ Quantity    │ Price  │ Value       │ Status     │
│  14:32:05 │ BUY  │ 250,000 CEA │ ¥88.48 │ €2,800,000  │ Done       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CEA → EUA Swap Market

### Page: /swap

### Rules:
| Rule | Description |
|------|-------------|
| User Action | Give CEA, receive EUA |
| Swap Amount | 100% of CEA balance (no partial) |
| Counterparty | AI Agents (Ollama) |
| CEA Transfer | Immediate |
| EUA Delivery | 10-14 days (EU ETS registry) |

### UI Layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│  CEA → EUA SWAP MARKET          Best Ratio: 1:11.2  |  24h: 12 swaps│
├─────────────────────────────────────────────────────────────────────┤
│  SWAP VISUALIZATION                                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   ┌─────────────┐                      ┌─────────────┐        │  │
│  │   │  CEA        │       ═══════►       │  EUA        │        │  │
│  │   │  443,014 t  │    1 EUA = 11.2 CEA  │  39,555 t   │        │  │
│  │   │  (You give) │                      │  (You get)  │        │  │
│  │   └─────────────┘                      └─────────────┘        │  │
│  └───────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────┬───────────────────────────────────┤
│  AVAILABLE OFFERS               │  YOUR SWAP                        │
│  ┌───────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ Ratio  │ EUA Avail │Depth │  │  │  Your CEA Balance           │  │
│  │ 1:11.2 │ 50,000    │ ████ │◄─┼──│  443,014 tonnes             │  │
│  │ 1:11.3 │ 80,000    │ █████│  │  └─────────────────────────────┘  │
│  │ 1:11.4 │ 120,000   │ ██████  │  ┌─────────────────────────────┐  │
│  │ 1:11.5 │ 200,000   │ ████████│  │  Swap Preview               │  │
│  └───────────────────────────┘  │  │  You give: 443,014 CEA      │  │
│                                 │  │  Ratio:    1:11.2           │  │
│  Lower ratio = better for you   │  │  You get:  39,555 EUA       │  │
│                                 │  │  Fee:      198 EUA          │  │
│                                 │  │  Net EUA:  39,357           │  │
│                                 │  │  Value:    ~€3,148,560      │  │
│                                 │  └─────────────────────────────┘  │
│                                 │  ┌─────────────────────────────┐  │
│                                 │  │ [ SWAP CEA→EUA FULL BAL ]   │  │
│                                 │  └─────────────────────────────┘  │
├─────────────────────────────────┴───────────────────────────────────┤
│  RECENT SWAPS                                                       │
│  Time     │ CEA Given  │ EUA Received │ Ratio  │ Status            │
│  14:32:05 │ 500,000    │ 44,642       │ 1:11.2 │ Complete          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Confirmation Flows

### CEA Purchase Confirmations

| Step | Type | Content |
|------|------|---------|
| 1. Preview | Dialog | Order details, price, quantity, fee, warnings |
| 2. Final | Dialog | Checkbox confirmation, terms acknowledgment |
| 3. Placed | Dialog | Order reference, expected delivery, email sent |
| 4. Delivered | Email + Notification | CEA balance updated, swap available |

### CEA Purchase Email Flow:

**Email 1: Order Confirmed**
```
Subject: CEA Purchase Order Confirmed - #CEA-2026-01-13-0042

Your CEA purchase order has been confirmed.
- Amount: €5,000,000.00
- CEA Quantity: 443,014 tonnes
- Expected Delivery: 10-30 business days

Your funds have been secured in your client account.
```

**Email 2: CEA Delivered**
```
Subject: CEA Delivered - #CEA-2026-01-13-0042

Great news! Your CEA certificates have been delivered.
- CEA Delivered: 443,014 tonnes
- Registry: China ETS

You can now swap your CEA for EUA in the Swap Market.
```

### Swap Confirmations

| Step | Type | Content |
|------|------|---------|
| 1. Preview | Dialog | Swap details, ratio, EUA estimate, warnings |
| 2. Final | Dialog | Checkbox confirmation, terms acknowledgment |
| 3. Initiated | Dialog | Swap reference, expected delivery, email sent |
| 4. Complete | Email + Notification | EUA balance updated, compliance ready |

### Swap Email Flow:

**Email 1: Swap Initiated**
```
Subject: CEA → EUA Swap Initiated - #SWAP-2026-01-28-0015

Your CEA to EUA swap has been initiated.
- CEA Transferred: 443,014 tonnes
- EUA to Receive: 39,357 tonnes
- Swap Ratio: 1 EUA = 11.2 CEA
- Expected EUA Delivery: 10-14 business days
```

**Email 2: Swap Complete**
```
Subject: EUA Delivered - Swap Complete - #SWAP-2026-01-28-0015

Great news! Your swap is complete and EUA has been delivered.
- EUA Received: 39,357 tonnes
- Registry: EU ETS

Your EUA is now available for EU ETS compliance.
```

---

## AI Agents

### Overview

AI Agents are automated market participants powered by Ollama (local LLM). They are treated as real clients in the system.

### Agent Types:

| Type | Market | Role | Example Names |
|------|--------|------|---------------|
| SELLER | Cash Market | Sell CEA to users | CEA_Seller_Shanghai, CEA_Seller_Beijing |
| PROVIDER | Swap Market | Provide EUA for CEA swaps | EUA_Provider_Frankfurt, EUA_Provider_London |

### Agent Characteristics:
- Run on Ollama (llama3, mistral)
- Have user accounts in database (role: AGENT)
- Generate orders automatically based on strategy
- Respond to market conditions
- Set prices/ratios dynamically

---

## Admin Features

### Admin Pages:
- /settings - NDA submissions, AI agents management
- /users - User management, funding approval
- /backoffice - KYC document review

### Settings Page - AI Agents

**AI Agents Status:**
| Agent | Type | Model | Holdings | Status |
|-------|------|-------|----------|--------|
| CEA_Seller_Shanghai | SELLER | llama3 | 500,000 CEA | Active |
| EUA_Provider_Frankfurt | SWAP | llama3 | 100,000 EUA | Active |

**Agent Activity Log:**
| Time | Agent | Action | Details |
|------|-------|--------|---------|
| 14:32:05 | CEA_Seller_Shanghai | ORDER PLACED | ASK 10,000 CEA @ ¥88.50 |
| 14:31:22 | EUA_Provider_London | SWAP MATCHED | 5,044 EUA → user |

**Agent Details (expandable):**
- Model
- Holdings
- Sold/Provided Today
- Revenue
- Strategy
- Active Orders

### Market Overview:

| Cash Market (CEA) | Swap Market (CEA→EUA) |
|-------------------|------------------------|
| Total ASK: 2.25M CEA | Total EUA: 300K |
| Best ASK: ¥88.50 | Best Ratio: 1:11.2 |
| 24h Volume: 450K CEA | 24h Swaps: 3 |
| Active Agents: 3 | Active Agents: 2 |

---

## Dashboard

### User Dashboard (/dashboard)

**Account Summary:**
| EUR Balance | CEA Balance | EUA Balance | Pending Orders |
|-------------|-------------|-------------|----------------|
| €0 (locked) | 443,014 t | 0 t | 1 |

**Holdings:**
| Asset | Balance | Avg Price | Value | Status |
|-------|---------|-----------|-------|--------|
| EUR | €0 | - | €0 | Locked in order |
| CEA | 443,014 t | ¥88.50 | €4,975,000 | Available |
| EUA | 0 t | - | €0 | - |

**Pending Orders:**
| Date | Type | Details | Status | ETA |
|------|------|---------|--------|-----|
| 2026-01-13 | SWAP CEA→EUA | 443,014 CEA → 39,357 EUA | Pending Delivery | 10d |

**Transaction History:**
| Date | Type | Details | Status | Ref |
|------|------|---------|--------|-----|
| 2026-01-13 | SWAP | 443,014 CEA → 39,357 EUA | Pending | SW001 |
| 2026-01-10 | BUY CEA | €5M → 443,014 CEA | Done | TX001 |
| 2026-01-08 | DEPOSIT | €5,000,000 | Done | DP001 |
| 2026-01-05 | KYC | Account approved | Done | - |
| 2026-01-02 | NDA | NDA approved | Done | - |

---

## UI Design Guidelines

### Colors:
- Background: #0F172A (navy-900)
- Card: #1E293B (navy-800)
- CEA Accent: #F59E0B (amber-500)
- EUA Accent: #3B82F6 (blue-500)
- Buy/Success: #10B981 (emerald-500)
- Sell/Ask: #EF4444 (red-500)
- Swap Arrow: #8B5CF6 (violet-500)
- Text Primary: #F8FAFC (slate-50)
- Text Secondary: #94A3B8 (slate-400)

### Typography:
- Prices: Font Mono, Bold
- Labels: Inter, Medium
- Values: Inter, Semibold

### Key UX Principles:
- Single large CTA button (full balance only)
- Read-only order book (no price selection)
- Clear fee and net calculations
- Two-step confirmation dialogs
- Email + in-app notifications

---

## Complete User Journey

```
1. SUBMIT NDA        → 2. NDA APPROVED      → 3. ACCOUNT CREATED
   /nda-upload          /settings (admin)      /users (admin)
                                               credentials sent
        │
        ▼
4. LOGIN & KYC       → 5. KYC APPROVED      → 6. WIRE TRANSFER
   /onboarding          /backoffice (admin)    Client → HSBC
   upload docs          review docs
        │
        ▼
7. FUNDING APPROVED  → 8. BUY CEA           → 9. CEA DELIVERED
   /users (admin)       /cash-market           10-30 days
   input amount         full balance buy
        │
        ▼
10. SWAP CEA→EUA     → 11. EUA DELIVERED    → 12. EU ETS COMPLIANCE
    /swap               10-14 days              Complete
    full balance swap
```

---

*Document Version: 1.0*
*Last Updated: January 13, 2026*
