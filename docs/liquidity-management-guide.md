# Liquidity Management User Guide

## Overview

The Liquidity Management system enables automated creation and management of market maker positions in the carbon trading platform. This guide covers how to create, preview, and execute liquidity provision strategies using two distinct market maker types.

### Key Features

- **Dual Market Maker Types**: Support for both Liquidity Provider (LP) and Arbitrage Hedger (AH) strategies
- **Preview Before Execution**: Review orders and balance impacts before committing
- **Automated Order Generation**: Systematic creation of BID and ASK orders with configurable spreads
- **Multi-Currency Support**: Native EUR integration with automatic value calculations
- **Order Tracking**: Complete audit trail through tickets and order history

---

## Market Maker Types

### 1. Liquidity Provider (LP)

**Purpose**: Provide liquidity by offering to buy and sell a carbon asset against EUR.

**Strategy**: Creates symmetric BID and ASK orders around a mid-price to facilitate market trading.

**Order Structure**:
- **BID Order**: Buy base asset (e.g., CEA) with quote asset (EUR)
  - Price: `mid_price × (1 - spread_bps / 20000)`
  - Quantity: `total_base_quantity`

- **ASK Order**: Sell base asset (e.g., CEA) for quote asset (EUR)
  - Price: `mid_price × (1 + spread_bps / 20000)`
  - Quantity: `total_base_quantity`

**Example**:
```
Mid Price: 50.00 EUR/CEA
Spread: 10 bps (0.10%)
Quantity: 1000 CEA

Results in:
- BID: Buy 1000 CEA at 49.975 EUR (cost: 49,975 EUR)
- ASK: Sell 1000 CEA at 50.025 EUR (value: 50,025 EUR)
```

**Use Cases**:
- Providing depth to the order book
- Earning spreads on matched trades
- Maintaining market liquidity during low activity periods

---

### 2. Arbitrage Hedger (AH)

**Purpose**: Exploit pricing discrepancies between two carbon assets (e.g., CEA and EUA).

**Strategy**: Creates offsetting positions across two carbon assets to capture arbitrage opportunities.

**Order Structure**:
- **BID Base / ASK Quote**: Buy base asset, implicitly sell quote asset
  - Price: `mid_price × (1 - spread_bps / 20000)`
  - Quantity: `total_base_quantity`

- **ASK Base / BID Quote**: Sell base asset, implicitly buy quote asset
  - Price: `mid_price × (1 + spread_bps / 20000)`
  - Quantity: `total_base_quantity`

**Example**:
```
Mid Price: 1.05 EUA/CEA (1 CEA = 1.05 EUA)
Spread: 20 bps (0.20%)
Quantity: 500 CEA

Results in:
- BID CEA: Buy 500 CEA at 1.0490 EUA (cost: 524.5 EUA)
- ASK CEA: Sell 500 CEA at 1.0510 EUA (value: 525.5 EUA)
```

**Use Cases**:
- Hedging carbon portfolio risk
- Capturing arbitrage between related assets
- Maintaining neutral market exposure

---

## How It Works

### Workflow Overview

1. **Create Market Maker** → Define strategy parameters (type, assets, price, spread, quantity)
2. **Preview Orders** → Review generated orders and balance impacts before execution
3. **Execute Orders** → Create orders in the system and generate tracking tickets
4. **Monitor Orders** → Track order status and matches through the UI

### Spread Calculation

The spread is specified in **basis points (bps)**, where 1 bps = 0.01%.

**Formula**:
- Half spread = `spread_bps / 20000`
- BID Price = `mid_price × (1 - half_spread)`
- ASK Price = `mid_price × (1 + half_spread)`

**Examples**:
- 10 bps = 0.10% = 0.0010 half-spread
- 20 bps = 0.20% = 0.0020 half-spread
- 50 bps = 0.50% = 0.0050 half-spread

### Balance Impact

**Liquidity Provider (LP)**:
- **BID Order Impact**: Requires `quantity × bid_price` in quote asset (EUR)
- **ASK Order Impact**: Requires `quantity` in base asset (CEA)

**Arbitrage Hedger (AH)**:
- **BID Base Impact**: Requires `quantity × bid_price` in quote asset (EUA)
- **ASK Base Impact**: Requires `quantity` in base asset (CEA)

---

## UI Guide

### Creating a Market Maker

1. Navigate to **Admin → Market Makers**
2. Click **Create Market Maker**
3. Fill in the form:
   - **Market Maker Type**: Select LP or AH
   - **Base Asset**: The primary carbon asset
   - **Quote Asset**: EUR (for LP) or another carbon asset (for AH)
   - **Mid Price**: Target price for order generation
   - **Spread (bps)**: Desired spread in basis points
   - **Total Base Quantity**: Amount of base asset to trade
4. Click **Create**

The system will auto-generate a name in the format:
- LP: `LP-{BASE}/{QUOTE}-{MID_PRICE}-{SPREAD}-{DATE}`
- AH: `AH-{BASE}/{QUOTE}-{MID_PRICE}-{SPREAD}-{DATE}`

### Viewing Market Makers

The Market Makers table displays:
- **Name**: Auto-generated identifier
- **Type**: LP or AH
- **Base Asset**: Primary trading asset
- **Quote Asset**: Secondary trading asset
- **Mid Price**: Target price
- **Spread**: Spread in basis points
- **Quantity**: Total base quantity
- **CEA Value**: Calculated value in CEA (for tracking)
- **EUA Value**: Calculated value in EUA (for tracking)
- **Status**: Active/Inactive
- **Created**: Creation timestamp
- **Actions**: Preview and Execute buttons

### Previewing Orders

1. Locate the market maker in the table
2. Click the **Preview** button (eye icon)
3. Review the modal showing:
   - Market maker details
   - Two generated orders with:
     - Order side (BID/ASK)
     - Asset pair
     - Price
     - Quantity
     - Total value
   - Calculated balance impacts

### Executing Orders

1. After reviewing the preview, click the **Execute** button (play icon)
2. Confirm the execution in the dialog
3. The system will:
   - Create two orders in ACTIVE status
   - Generate tracking tickets for each order
   - Display a success notification

### Monitoring Orders

1. Navigate to **Orders** to see all created orders
2. Filter by:
   - Market Maker
   - Asset pair
   - Order status
   - Date range
3. View order details including:
   - Associated market maker
   - Current status
   - Match history

---

## API Endpoints

### Create Market Maker

**Endpoint**: `POST /api/market-makers`

**Request Body**:
```json
{
  "market_maker_type": "LIQUIDITY_PROVIDER",
  "base_asset_id": 1,
  "quote_asset_id": 3,
  "mid_price": "50.00",
  "spread_bps": 10,
  "total_base_quantity": "1000.0"
}
```

**Response**:
```json
{
  "market_maker_id": 1,
  "name": "LP-CEA/EUR-50-10-2025-01-20",
  "market_maker_type": "LIQUIDITY_PROVIDER",
  "base_asset_id": 1,
  "quote_asset_id": 3,
  "mid_price": "50.00",
  "spread_bps": 10,
  "total_base_quantity": "1000.0",
  "is_active": true,
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

### Get All Market Makers

**Endpoint**: `GET /api/market-makers`

**Query Parameters**:
- `market_maker_type` (optional): Filter by LP or AH
- `is_active` (optional): Filter by active status
- `base_asset_id` (optional): Filter by base asset
- `quote_asset_id` (optional): Filter by quote asset

**Response**:
```json
[
  {
    "market_maker_id": 1,
    "name": "LP-CEA/EUR-50-10-2025-01-20",
    "market_maker_type": "LIQUIDITY_PROVIDER",
    "base_asset": {
      "asset_id": 1,
      "ticker": "CEA",
      "name": "Carbon Emissions Allowance"
    },
    "quote_asset": {
      "asset_id": 3,
      "ticker": "EUR",
      "name": "Euro"
    },
    "mid_price": "50.00",
    "spread_bps": 10,
    "total_base_quantity": "1000.0",
    "cea_value": "1000.0",
    "eua_value": null,
    "is_active": true,
    "created_at": "2025-01-20T10:00:00Z"
  }
]
```

---

### Preview Market Maker Orders

**Endpoint**: `GET /api/market-makers/{market_maker_id}/preview`

**Response**:
```json
{
  "market_maker_id": 1,
  "market_maker_type": "LIQUIDITY_PROVIDER",
  "base_asset": "CEA",
  "quote_asset": "EUR",
  "mid_price": "50.00",
  "spread_bps": 10,
  "total_base_quantity": "1000.0",
  "orders": [
    {
      "side": "BID",
      "base_asset": "CEA",
      "quote_asset": "EUR",
      "price": "49.975",
      "quantity": "1000.0",
      "total_value": "49975.00"
    },
    {
      "side": "ASK",
      "base_asset": "CEA",
      "quote_asset": "EUR",
      "price": "50.025",
      "quantity": "1000.0",
      "total_value": "50025.00"
    }
  ]
}
```

---

### Execute Market Maker Orders

**Endpoint**: `POST /api/market-makers/{market_maker_id}/execute`

**Response**:
```json
{
  "success": true,
  "market_maker_id": 1,
  "orders_created": 2,
  "order_ids": [101, 102]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Market maker not found"
}
```

---

### Get Market Maker by ID

**Endpoint**: `GET /api/market-makers/{market_maker_id}`

**Response**:
```json
{
  "market_maker_id": 1,
  "name": "LP-CEA/EUR-50-10-2025-01-20",
  "market_maker_type": "LIQUIDITY_PROVIDER",
  "base_asset": {
    "asset_id": 1,
    "ticker": "CEA",
    "name": "Carbon Emissions Allowance"
  },
  "quote_asset": {
    "asset_id": 3,
    "ticker": "EUR",
    "name": "Euro"
  },
  "mid_price": "50.00",
  "spread_bps": 10,
  "total_base_quantity": "1000.0",
  "cea_value": "1000.0",
  "eua_value": null,
  "is_active": true,
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

### Update Market Maker

**Endpoint**: `PUT /api/market-makers/{market_maker_id}`

**Request Body** (all fields optional):
```json
{
  "mid_price": "51.00",
  "spread_bps": 15,
  "total_base_quantity": "1500.0",
  "is_active": false
}
```

**Response**: Same as Get Market Maker by ID

---

### Delete Market Maker

**Endpoint**: `DELETE /api/market-makers/{market_maker_id}`

**Response**:
```json
{
  "message": "Market maker deleted successfully"
}
```

---

## Best Practices

### For Liquidity Providers (LP)

1. **Spread Selection**:
   - Tight spreads (5-10 bps): High-volume, low-margin strategy
   - Medium spreads (10-20 bps): Balanced risk/reward
   - Wide spreads (20+ bps): Low-volume, high-margin strategy

2. **Quantity Sizing**:
   - Start with smaller quantities to test market conditions
   - Scale up gradually based on fill rates
   - Monitor EUR balance requirements (quantity × price)

3. **Price Setting**:
   - Use recent trade data to set competitive mid-prices
   - Review and adjust prices regularly based on market movement
   - Consider market depth when positioning orders

### For Arbitrage Hedgers (AH)

1. **Spread Selection**:
   - Monitor the spread between CEA and EUA in external markets
   - Set internal spreads tighter than external opportunities
   - Account for execution risk and slippage

2. **Quantity Sizing**:
   - Match quantities to available inventory of both assets
   - Consider correlation stability between asset pairs
   - Maintain balanced exposure across both legs

3. **Price Setting**:
   - Track external market ratios continuously
   - Update mid-prices when external ratios shift
   - Factor in transaction costs and settlement timing

### General Guidelines

1. **Always Preview First**: Review orders and balance impacts before execution
2. **Monitor Fill Rates**: Track which orders are matching and adjust strategies
3. **Regular Maintenance**: Update or deactivate market makers as conditions change
4. **Balance Management**: Ensure sufficient balances in all required assets
5. **Risk Limits**: Set appropriate quantity limits based on capital and risk tolerance

---

## Troubleshooting

### Common Issues

**Issue**: Preview shows unexpected prices
- **Cause**: Spread calculation or mid-price entry error
- **Solution**: Verify mid-price and spread_bps values, check spread formula

**Issue**: Execution fails with "insufficient balance" error
- **Cause**: Required balances not available for order creation
- **Solution**: Review preview balance impacts, add funds before execution

**Issue**: Orders not matching
- **Cause**: Prices not competitive with market conditions
- **Solution**: Review current market prices, adjust mid-price or spread

**Issue**: Cannot create market maker with certain asset pairs
- **Cause**: Asset type restrictions (LP requires EUR, AH requires two carbon assets)
- **Solution**: Verify asset types match market maker type requirements

---

## Support

For additional assistance:
- Technical issues: Contact platform support
- Strategy questions: Consult with trading desk
- API integration: Review API documentation and examples

---

**Last Updated**: 2025-01-20
**Version**: 1.0
