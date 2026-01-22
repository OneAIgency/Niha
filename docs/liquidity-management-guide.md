# Liquidity Management User Guide

## Overview

The Liquidity Management system enables administrators to programmatically inject market depth by coordinating orders across multiple market makers. This system automatically distributes BID and ASK orders across available market makers with tight spreads to create a liquid order book.

### Key Features

- **Automated Order Distribution**: Automatically allocates orders across multiple market makers
- **Preview Before Execution**: Review allocation plan and validate sufficient assets before committing
- **Tight Spread Generation**: Creates orders with 0.2-0.5% spreads for competitive pricing
- **Multi-Level Price Distribution**: Distributes volume across 3 price levels (50/30/20) for depth
- **Complete Audit Trail**: All operations tracked with tickets and liquidity operation records

---

## Market Maker Types

The liquidity management system uses two types of market makers:

### 1. Cash Buyer (CASH_BUYER)

**Purpose**: Provide BID liquidity by placing buy orders using EUR.

**Characteristics**:
- Holds EUR balance (`eur_balance` field)
- Places BUY orders (BID side)
- Used for providing buy-side liquidity

**Example**:
```
Market Maker: MM-Cash-Buyer-01
EUR Balance: 100,000 EUR
Type: CASH_BUYER

Can place: BUY orders for CEA/EUA using EUR
```

### 2. CEA Cash Seller (CEA_CASH_SELLER)

**Purpose**: Provide ASK liquidity by placing sell orders using certificate holdings.

**Characteristics**:
- Holds certificate balances (CEA or EUA)
- Places SELL orders (ASK side)
- Used for providing sell-side liquidity

**Example**:
```
Market Maker: MM-CEA-Seller-01
CEA Balance: 10,000 CEA
Type: CEA_CASH_SELLER

Can place: SELL orders for CEA certificates
```

---

## How It Works

### Workflow Overview

1. **Create Market Makers** → Set up CASH_BUYER MMs with EUR and CEA_CASH_SELLER MMs with certificates
2. **Preview Liquidity Creation** → Review allocation plan showing which MMs will be used and order distribution
3. **Execute Liquidity Creation** → System places orders across all available MMs automatically
4. **Monitor Orders** → Track orders in the order book and through audit logs

### Price Level Distribution

Orders are distributed across **3 price levels** with volume allocation:

**BID Orders (Buy Side)**:
- **Level 1**: 0.2% below reference price (50% of volume)
- **Level 2**: 0.4% below reference price (30% of volume)
- **Level 3**: 0.5% below reference price (20% of volume)

**ASK Orders (Sell Side)**:
- **Level 1**: 0.2% above reference price (50% of volume)
- **Level 2**: 0.4% above reference price (30% of volume)
- **Level 3**: 0.5% above reference price (20% of volume)

**Reference Price Calculation**:
- Uses mid-price from current orderbook if both BID and ASK exist
- Falls back to best bid or best ask if only one side exists
- Uses last trade price if available
- Defaults to predefined prices (CEA: 14.0 EUR, EUA: 81.0 EUR) if no market data

### Order Allocation

**BID Orders**:
- Total EUR amount divided equally among all active CASH_BUYER market makers
- Each MM gets `total_bid_eur / number_of_mms` EUR allocation
- Each MM places 3 orders (one per price level) with volume distributed 50/30/20

**ASK Orders**:
- Total certificate quantity needed = `ask_amount_eur / reference_price`
- Quantity divided equally among all active CEA_CASH_SELLER market makers with available balance
- Each MM gets `total_quantity / number_of_mms` certificate allocation
- Each MM places 3 orders (one per price level) with volume distributed 50/30/20

### Balance Requirements

**For BID Liquidity**:
- Requires sufficient EUR balance across all CASH_BUYER market makers
- Total EUR available must be >= `bid_amount_eur`

**For ASK Liquidity**:
- Requires sufficient certificate balance across all CEA_CASH_SELLER market makers
- Total certificates available must be >= `ask_amount_eur / reference_price`

---

## API Usage

### Preview Liquidity Creation

Before executing liquidity creation, preview the operation to see:
- Which market makers will be used
- How orders will be distributed
- Whether sufficient assets are available
- Estimated spread and order count

**Endpoint**: `POST /api/v1/liquidity/preview`

**Request**:
```json
{
  "certificate_type": "CEA",
  "bid_amount_eur": 100000,
  "ask_amount_eur": 50000
}
```

**Response**:
```json
{
  "can_execute": true,
  "certificate_type": "CEA",
  "bid_plan": {
    "mms": [
      {
        "mm_id": "uuid",
        "mm_name": "MM-Cash-Buyer-01",
        "mm_type": "CASH_BUYER",
        "allocation": 50000.0,
        "orders_count": 3
      }
    ],
    "total_amount": 100000.0,
    "price_levels": [
      {"price": 13.972, "percentage": 50.0},
      {"price": 13.944, "percentage": 30.0},
      {"price": 13.930, "percentage": 20.0}
    ]
  },
  "ask_plan": {
    "mms": [
      {
        "mm_id": "uuid",
        "mm_name": "MM-CEA-Seller-01",
        "mm_type": "CEA_CASH_SELLER",
        "allocation": 1785.71,
        "orders_count": 3
      }
    ],
    "total_amount": 50000.0,
    "price_levels": [
      {"price": 14.028, "percentage": 50.0},
      {"price": 14.056, "percentage": 30.0},
      {"price": 14.070, "percentage": 20.0}
    ]
  },
  "missing_assets": null,
  "suggested_actions": [],
  "total_orders_count": 6,
  "estimated_spread": 0.5
}
```

**Insufficient Assets Response**:
```json
{
  "can_execute": false,
  "missing_assets": {
    "asset_type": "EUR",
    "required": 100000.0,
    "available": 50000.0,
    "shortfall": 50000.0
  },
  "suggested_actions": [
    "create_liquidity_providers",
    "fund_existing_lps"
  ]
}
```

### Create Liquidity

Execute liquidity creation after previewing. This will:
- Place orders across all available market makers
- Lock assets (EUR for CASH_BUYER, certificates for CEA_CASH_SELLER)
- Create audit trail with ticket logging
- Return liquidity operation record

**Endpoint**: `POST /api/v1/liquidity/create`

**Request**:
```json
{
  "certificate_type": "CEA",
  "bid_amount_eur": 100000,
  "ask_amount_eur": 50000,
  "notes": "Weekly liquidity injection"
}
```

**Response**:
```json
{
  "success": true,
  "liquidity_operation_id": "uuid",
  "orders_created": 6,
  "bid_liquidity_eur": 100000.0,
  "ask_liquidity_eur": 50000.0,
  "market_makers_used": [
    {
      "mm_id": "uuid",
      "mm_type": "CASH_BUYER",
      "amount": 50000.0
    },
    {
      "mm_id": "uuid",
      "mm_type": "CEA_CASH_SELLER",
      "amount": 1785.71
    }
  ]
}
```

**Error Response (Insufficient Assets)**:
```json
{
  "detail": {
    "error": "insufficient_assets",
    "asset_type": "EUR",
    "required": 100000.0,
    "available": 50000.0,
    "shortfall": 50000.0
  }
}
```

### Authentication

All endpoints require admin authentication:

```http
Authorization: Bearer <admin_access_token>
```

---

## Setting Up Market Makers

Before using liquidity management, you need to create and fund market makers:

### Creating Cash Buyer Market Makers

Cash Buyer MMs hold EUR and place BUY orders. Create them via the Market Makers API:

**Endpoint**: `POST /api/v1/admin/market-makers`

**Request**:
```json
{
  "name": "MM-Cash-Buyer-01",
  "email": "mm-cash-buyer-01@internal.com",
  "description": "Liquidity provider for buy side",
  "mm_type": "CASH_BUYER",
  "initial_eur_balance": 200000
}
```

**Note**: For `CASH_BUYER` type, use `initial_eur_balance` (not `initial_balances`).

### Creating CEA Cash Seller Market Makers

CEA Cash Seller MMs hold certificates and place SELL orders:

**Request**:
```json
{
  "name": "MM-CEA-Seller-01",
  "email": "mm-cea-seller-01@internal.com",
  "description": "Liquidity provider for sell side",
  "mm_type": "CEA_CASH_SELLER",
  "initial_balances": {
    "CEA": 10000
  }
}
```

**Note**: For `CEA_CASH_SELLER` type, use `initial_balances` with certificate amounts.

See [MARKET_MAKERS_API.md](./api/MARKET_MAKERS_API.md) for complete market maker management documentation.

---

## Best Practices

### Market Maker Setup

1. **Balance Distribution**:
   - Distribute EUR across multiple CASH_BUYER market makers for redundancy
   - Distribute certificates across multiple CEA_CASH_SELLER market makers
   - Avoid concentrating all assets in a single MM

2. **Initial Funding**:
   - Start with realistic amounts based on expected liquidity needs
   - Monitor order fill rates to determine optimal balance levels
   - Keep reserves for market opportunities

### Liquidity Creation Strategy

1. **BID/ASK Balance**:
   - Match BID and ASK liquidity amounts for balanced market
   - Adjust ratios based on market conditions (more BID if buyers active, more ASK if sellers active)
   - Monitor spread to ensure competitive pricing

2. **Frequency**:
   - Create liquidity regularly to maintain depth
   - Adjust amounts based on market activity
   - Monitor order book depth before creating new liquidity

3. **Price Levels**:
   - System automatically creates 3 price levels with tight spreads (0.2-0.5%)
   - Volume distributed 50/30/20 for optimal depth
   - Reference price calculated from current market conditions

### Asset Management

1. **Monitor Balances**:
   - Check EUR balances on CASH_BUYER MMs regularly
   - Check certificate balances on CEA_CASH_SELLER MMs regularly
   - Refund MMs when balances get low

2. **Order Monitoring**:
   - Track which orders are filling
   - Cancel stale orders if market moved significantly
   - Adjust liquidity amounts based on fill rates

### General Guidelines

1. **Always Preview First**: Use preview endpoint to validate before execution
2. **Check Asset Sufficiency**: Ensure sufficient balances before creating liquidity
3. **Monitor Operations**: Review liquidity operation history regularly
4. **Document Actions**: Use notes field to document reasons for liquidity creation
5. **Audit Trail**: All operations create tickets - use for compliance and debugging

---

## Troubleshooting

### Common Issues

**Issue**: Preview shows `can_execute: false` with missing assets

**Cause**: Insufficient balances across market makers

**Solution**:
1. Check EUR balances on CASH_BUYER market makers
2. Check certificate balances on CEA_CASH_SELLER market makers
3. Either:
   - Create new market makers with required assets
   - Fund existing market makers via transactions
   - Reduce liquidity amounts to match available assets

**Issue**: Execution fails with "insufficient_assets" error

**Cause**: Asset balances changed between preview and execution, or validation failed

**Solution**:
1. Re-run preview to check current asset availability
2. Ensure no other operations consumed assets between preview and execution
3. Fund market makers if needed
4. Retry execution

**Issue**: Orders not appearing in order book

**Cause**: Market makers may be inactive, or orders were placed but not visible

**Solution**:
1. Verify market makers are active (`is_active: true`)
2. Check order book refresh (may take a few seconds)
3. Verify orders were created via liquidity operation record
4. Check audit logs for any errors

**Issue**: Reference price seems incorrect

**Cause**: No market data available, using default prices

**Solution**:
1. Check if order book has any existing orders
2. Verify price scraping is working
3. Default prices used: CEA = 14.0 EUR, EUA = 81.0 EUR
4. Once market has activity, reference price will use real market data

**Issue**: Orders created but not distributed as expected

**Cause**: Number of market makers changed, or allocation calculation issue

**Solution**:
1. Check how many active MMs exist for each type
2. Review liquidity operation record to see actual allocation
3. Ensure MMs have sufficient balances (low-balance MMs may be skipped)

---

## Related Documentation

- **Market Makers API**: [MARKET_MAKERS_API.md](./api/MARKET_MAKERS_API.md)
- **Market Makers Guide**: [MARKET_MAKERS_GUIDE.md](./admin/MARKET_MAKERS_GUIDE.md)
- **Logging API**: [LOGGING_API.md](./api/LOGGING_API.md)

---

## Support

For additional assistance:
- **Technical Issues**: Contact platform engineering team
- **API Questions**: Review API documentation and examples
- **Audit Logs**: Use Logging API to review operation history

---

**Last Updated**: 2026-01-21
**Version**: 2.0
