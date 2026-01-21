# Market Architecture

## Overview

The Niha Carbon platform operates two distinct markets:

1. **CEA-CASH Market**: Cash trading of CEA certificates
2. **SWAP Market**: Exchange of CEA certificates for EUA certificates

This document describes the architecture, business rules, and implementation details of both markets.

## The Two Markets

### CEA-CASH Market

**Purpose:** Allow customers to buy CEA certificates with EUR cash.

**Participants:**
- **Customers (Buyers):** Entities that want to purchase CEA certificates
- **CEA-CASH Sellers:** Market makers that hold CEA certificates and sell them
- **CASH Buyers:** Market makers that provide liquidity by buying CEA certificates

**Trading Mechanism:**
- Order book with bids (buy orders) and asks (sell orders)
- Price discovery through matching buy and sell orders
- Support for market orders and limit orders
- Real-time order matching engine

**Key Characteristics:**
- Certificate type: CEA only
- Settlement currency: EUR
- Order types: Market, Limit
- Execution: Immediate or resting in order book

### SWAP Market

**Purpose:** Allow customers to exchange CEA certificates for EUA certificates at fixed conversion rates.

**Participants:**
- **Customers:** Entities that want to convert between CEA and EUA
- **SWAP Makers:** Market makers that facilitate conversions with inventory of both certificates

**Trading Mechanism:**
- Swap request system (not an order book)
- Fixed conversion rates (no price discovery)
- Batch matching of swap requests
- Settlement requires both certificates

**Key Characteristics:**
- Certificate types: CEA ↔ EUA
- No cash involved
- Conversion rates: Fixed by platform or dynamic based on supply/demand
- Execution: Batch processing

## Market Maker Types

### CEA_CASH_SELLER

**Market:** CEA-CASH

**Role:** Sells CEA certificates for EUR cash

**Inventory:**
- Holds: CEA certificates
- Receives: EUR cash when orders execute

**Order Behavior:**
- Places SELL orders in the CEA-CASH order book
- Prices CEA certificates in EUR
- Competes with other sellers on price

**Example:** A company that produces CEA certificates and wants to sell them for cash.

### CASH_BUYER

**Market:** CEA-CASH

**Role:** Buys CEA certificates with EUR cash

**Inventory:**
- Holds: EUR cash
- Receives: CEA certificates when orders execute

**Order Behavior:**
- Places BUY orders in the CEA-CASH order book
- Bids on CEA certificates in EUR
- Provides liquidity to the market

**Example:** An investment fund that provides liquidity by purchasing CEA certificates.

### SWAP_MAKER

**Market:** SWAP (CEA-EUA)

**Role:** Facilitates conversions between CEA and EUA

**Inventory:**
- Holds: Both CEA and EUA certificates
- Exchanges: Converts customer requests at configured rates

**Behavior:**
- Maintains inventory of both certificate types
- Accepts swap requests from customers
- Executes swaps at fixed or dynamic rates
- Rebalances inventory periodically

**Example:** A liquidity provider that enables customers to convert between certificate types.

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    market markettype NOT NULL,  -- 'CEA_CASH' or 'SWAP'
    entity_id UUID REFERENCES entities(id),
    market_maker_id UUID REFERENCES market_maker_clients(id),
    certificate_type certificatetype NOT NULL,  -- 'CEA' or 'EUA'
    side orderside NOT NULL,  -- 'BUY' or 'SELL'
    price NUMERIC(18, 4) NOT NULL,
    quantity NUMERIC(18, 2) NOT NULL,
    filled_quantity NUMERIC(18, 2) DEFAULT 0,
    status orderstatus DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- If `market = 'CEA_CASH'`, then `certificate_type` must be `'CEA'`
- If `market = 'SWAP'`, orders are not used (swap requests are)

### Market Maker Clients Table

```sql
CREATE TABLE market_maker_clients (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mm_type marketmakertype NOT NULL,  -- 'CEA_CASH_SELLER', 'CASH_BUYER', 'SWAP_MAKER'
    eur_balance NUMERIC(18, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- If `mm_type = 'CASH_BUYER'`, then `eur_balance > 0` and no certificate holdings
- If `mm_type = 'CEA_CASH_SELLER'`, then CEA certificate holdings > 0 and `eur_balance = 0`
- If `mm_type = 'SWAP_MAKER'`, then both CEA and EUA certificate holdings > 0

## API Endpoints

### CEA-CASH Market

```
GET  /api/v1/cash-market/orderbook/cea     # Get CEA-CASH order book
POST /api/v1/cash-market/orders             # Place order in CEA-CASH market
GET  /api/v1/cash-market/orders/my          # Get my orders
POST /api/v1/cash-market/orders/cancel      # Cancel order
```

### SWAP Market

```
GET  /api/v1/swap/rates                     # Get current conversion rates
POST /api/v1/swap/requests                  # Submit swap request
GET  /api/v1/swap/requests/my               # Get my swap requests
POST /api/v1/swap/requests/cancel           # Cancel swap request
```

### Market Makers (Admin)

```
GET    /api/v1/admin/market-makers          # List all market makers
POST   /api/v1/admin/market-makers          # Create new market maker
GET    /api/v1/admin/market-makers/{id}     # Get market maker details
PATCH  /api/v1/admin/market-makers/{id}     # Update market maker
DELETE /api/v1/admin/market-makers/{id}     # Delete market maker
```

## User Interface

### Backoffice

**Market Makers Page:**
- Filter by market (CEA-CASH or SWAP)
- Show market-specific roles and balances
- Portfolio summary grouped by market

**Create Market Maker:**
1. Select market first
2. Choose role within that market
3. Provide appropriate balances for role

### Customer Portal

**CEA-CASH Market Page:**
- Order book showing bids and asks
- Place buy/sell orders for CEA
- View my orders and trade history

**SWAP Market Page:**
- Current conversion rates
- Submit swap requests
- View swap request status

## Testing Strategy

### Unit Tests

- Market maker validation (balance requirements per type)
- Order validation (market/certificate type consistency)
- Swap request validation

### Integration Tests

- CEA-CASH order matching
- SWAP request processing
- Market maker order placement

### E2E Tests

- Create market maker → place orders → match → settle
- Submit swap request → match → execute
- Portfolio value calculations by market

## Migration Path

See `docs/plans/2026-01-21-market-maker-market-restructure.md` for detailed migration steps from old certificate-based model to new market-based model.

## Implementation Status

✅ **Phase 1: Database Schema** - Complete
- MarketMakerType enum migrated
- Market field added to orders

✅ **Phase 2: Backend Services** - Complete
- LiquidityService updated
- Market maker validation updated

✅ **Phase 3: Frontend** - Complete
- TypeScript types updated
- Components redesigned for market-first UI

✅ **Phase 4: Documentation** - Complete
- Order book plan updated
- Architecture document created

## Key Principles

1. **Market Separation**: CEA-CASH and SWAP are fundamentally different markets with different mechanisms
2. **Type Safety**: Market makers are typed by the market they operate in
3. **Business Rule Enforcement**: Database and application layers enforce market-specific rules
4. **Clear UI Flow**: Market selection comes first, then role selection
5. **Scalability**: Architecture supports adding new markets in the future

## Future Enhancements

- Dynamic SWAP rates based on supply/demand
- Cross-market analytics
- Market maker performance metrics by market
- Advanced order types (stop-loss, iceberg orders)
