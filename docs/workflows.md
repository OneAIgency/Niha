# Niha Platform Workflows

This document visualizes the core functional workflows of the Niha Platform using Mermaid diagrams. We use these to validate our implementation logic.

## 1. Fund Flows: Deposits & AML
How fiat (EUR) enters the system and becomes available balance.

```mermaid
sequenceDiagram
    participant User
    participant Bank
    participant Platform as Niha Platform
    participant Admin as Backoffice Admin
    participant DB as Database

    Note over User, Platform: Step 1: Announcement
    User->>Platform: Announce Wire (Amount, Bank)
    Platform->>DB: Create Deposit (Status: PENDING)
    Platform-->>User: Show "Waiting for Wire"

    Note over Bank, Admin: Step 2: Confirmation
    Bank->>Admin: Wire Received (EUR)
    Admin->>Platform: Confirm Receipt (Actual Amount)
    Platform->>Platform: Calculate AML Hold (1-3 days)
    Platform->>DB: Update Deposit (Status: ON_HOLD)
    Platform-->>User: Show "Locked / AML Review"

    Note over Platform, DB: Step 3: Clearing
    alt Hold Expired
        Platform->>Platform: Auto-Clear Job
        Platform->>DB: Update Deposit (Status: CLEARED)
        Platform->>DB: Credit Entity Balance (+EUR)
        Platform-->>User: Funds Available
    else Manual Clear
        Admin->>Platform: Force Clear
        Platform->>DB: Update Deposit (Status: CLEARED)
        Platform->>DB: Credit Entity Balance (+EUR)
    end
```

## 2. Cash Market: Trading (Simulated vs Real)
How CEA/EUR is traded. *Currently migrating from Simulation to Real.*

```mermaid
sequenceDiagram
    participant Buyer
    participant Seller
    participant API
    participant MatchingEngine
    participant DB

    Note over Buyer, API: Order Placement
    Buyer->>API: POST /orders (BUY CEA @ €9.50)
    API->>DB: Lock EUR Balance (Quantity * Price)
    API->>DB: Create Order (Status: OPEN)

    Note over API, DB: Matching (Real-time)
    API->>MatchingEngine: Process New Order
    MatchingEngine->>DB: Find Matching Sell Orders
    
    alt Match Found
        MatchingEngine->>DB: Create Trade Record
        MatchingEngine->>DB: Update Buyer Balance (+CEA, -EUR)
        MatchingEngine->>DB: Update Seller Balance (-CEA, +EUR)
        MatchingEngine->>DB: Update Orders (FILLED/PARTIALLY_FILLED)
        API-->>Buyer: Order Executed
    else No Match
        API-->>Buyer: Order Open (Added to Book)
    end
```

## 3. Swap Market: CEA ↔ EUA
How users swap one certificate type for another.

```mermaid
sequenceDiagram
    participant User
    participant SwapAPI
    participant DB
    participant Counterparty

    Note over User, DB: Creation
    User->>SwapAPI: Create Request (Offer 1000 CEA for EUA)
    SwapAPI->>DB: Lock 1000 CEA (Holdings)
    SwapAPI->>DB: Create SwapRequest (Status: OPEN)

    Note over DB, Counterparty: Discovery
    Counterparty->>SwapAPI: GET /swaps/available
    SwapAPI->>DB: Query OPEN requests
    DB-->>Counterparty: List of anonymized requests

    Note over Counterparty, DB: Accept/Match
    Counterparty->>SwapAPI: Accept Swap #123
    SwapAPI->>DB: Verify Counterparty Balance (1000 EUA)
    SwapAPI->>DB: Lock 1000 EUA
    SwapAPI->>DB: Execute Swap (Transfer Assets)
    SwapAPI->>DB: Update Request (Status: COMPLETED)
```

## 4. Marketplace: Listings (EUA/CEA)
Direct sales of certificates (listings).

```mermaid
sequenceDiagram
    participant Seller
    participant MarketplaceAPI
    participant Buyer
    participant DB

    Note over Seller, DB: Listing
    Seller->>MarketplaceAPI: Create Listing (Sell 500 EUA @ €85)
    MarketplaceAPI->>DB: Lock 500 EUA
    MarketplaceAPI->>DB: Create Certificate Record (Status: AVAILABLE)

    Note over Buyer, DB: Buying
    Buyer->>MarketplaceAPI: Buy Listing #999
    MarketplaceAPI->>DB: Check Buyer EUR Balance
    MarketplaceAPI->>DB: Transfer Assets (Buyer +EUA, Seller +EUR)
    MarketplaceAPI->>DB: Mark Certificate SOLD
```
