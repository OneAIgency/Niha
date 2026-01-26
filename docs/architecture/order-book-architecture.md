# Order Book Architecture

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Status:** Production

## Overview

The Nihao Carbon Platform uses a **Central Limit Order Book (CLOB)** system for the CEA-CASH market. This document describes how the order book aggregates and displays orders from multiple sources, including Market Makers.

## Order Book Structure

### Data Sources

The order book combines orders from three sources:

1. **Sellers** - Legacy sellers placing SELL orders
2. **Entities** - Regular users placing BUY orders
3. **Market Makers** - Admin-managed liquidity providers placing both BUY and SELL orders

### Order Aggregation

Orders are aggregated by price level:

- **Same Price Level:** Multiple orders at the same price are combined
- **Quantity:** Sum of all remaining quantities at that price
- **Order Count:** Number of individual orders at that price
- **Cumulative Quantity:** Running total from best price

### Price-Time Priority (FIFO)

Within each price level, orders are matched in FIFO order:
- First order placed at a price executes first
- Ensures fair matching regardless of order source
- Maintains market integrity

## UI Display & Visual Design

### Order Book Component

The frontend displays the order book using the `TradingOrderBook` component, which provides:

**Visual Features:**
- **Best Bid/Ask Highlighting**: Best bid and best ask rows are highlighted with:
  - Larger font size (text-lg vs text-xs)
  - Bold font weight
  - Colored borders (emerald for bids, red for asks)
  - 25% background opacity with respective colors

- **Background Opacity Pattern**: Color-coded alternating opacity pattern:
  - **Best Bid/Ask**: 25% opacity with emerald (bids) or red (asks) color
  - **From Best Bid going up**: Alternating 10% → 5% → 10%... with emerald color
  - **From Best Ask going down**: Alternating 10% → 5% → 10%... with red color
  - Pattern radiates from best bid/ask positions for intuitive visual flow

- **Layout**: 
  - Compact 5-column display (Price | Volume | Value EUR | Total | Total EUR)
  - Scrollable with sticky column headers
  - Asks displayed top to bottom (higher prices to best ask)
  - Bids displayed below asks (highest to lowest)
  - Spacing between asks and bids sections

**Design System Integration:**
- Uses standardized CSS classes from `design-tokens.css`
- CSS classes: `.orderbook-row-best-bid`, `.orderbook-row-best-ask`, `.orderbook-row-odd-bid`, `.orderbook-row-even-bid`, `.orderbook-row-odd-ask`, `.orderbook-row-even-ask`
- Design tokens: `--orderbook-row-opacity-low` (5%), `--orderbook-row-opacity-medium` (10%), `--orderbook-row-opacity-best` (25%)
- Full dark mode support

**Accessibility:**
- ARIA labels on all interactive rows
- Keyboard navigation (Enter/Space to select price)
- Focus states with colored rings
- Semantic HTML structure

For detailed design system documentation, see [`frontend/docs/DESIGN_SYSTEM.md`](../../frontend/docs/DESIGN_SYSTEM.md#order-book-rows).

## Implementation

### Database Query

The `get_real_orderbook()` function queries orders:

**SELL Orders (Asks):**
```sql
SELECT * FROM orders
WHERE certificate_type = ?
  AND side = 'SELL'
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (seller_id IS NOT NULL OR market_maker_id IS NOT NULL)
  AND NOT (seller_id IS NOT NULL AND market_maker_id IS NOT NULL)  -- Defensive check
ORDER BY price ASC, created_at ASC
```

**BUY Orders (Bids):**
```sql
SELECT * FROM orders
WHERE certificate_type = ?
  AND side = 'BUY'
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (entity_id IS NOT NULL OR market_maker_id IS NOT NULL)
  AND NOT (entity_id IS NOT NULL AND market_maker_id IS NOT NULL)  -- Defensive check
ORDER BY price DESC, created_at ASC
```

### Aggregation Logic

1. **Filter Orders:** Only include orders with remaining quantity > 0
2. **Group by Price:** Combine orders at same price level
3. **Calculate Totals:** Sum quantities, count orders
4. **Sort:** Asks ascending, Bids descending
5. **Calculate Cumulative:** Running totals for depth visualization

### Response Format

```json
{
  "certificate_type": "CEA",
  "bids": [
    {
      "price": 25.00,
      "quantity": 1000.00,
      "order_count": 2,
      "cumulative_quantity": 1000.00
    }
  ],
  "asks": [
    {
      "price": 25.50,
      "quantity": 1500.00,
      "order_count": 3,
      "cumulative_quantity": 1500.00
    }
  ],
  "spread": 0.50,
  "best_bid": 25.00,
  "best_ask": 25.50,
  "last_price": 25.50,
  "volume_24h": 2500.00,
  "change_24h": 0.0
}
```

## Market Maker Integration

### SELL Orders from Market Makers

- Market Makers of type `CEA_CASH_SELLER` place SELL orders
- These orders appear in the `asks` array alongside Seller orders
- Aggregated by price level (no distinction by source in display)
- FIFO matching applies regardless of source

### BUY Orders from Market Makers

- Market Makers of type `CASH_BUYER` place BUY orders
- These orders appear in the `bids` array alongside Entity orders
- Aggregated by price level
- Provides liquidity to the market

### Order Visibility

- **Public Visibility:** All Market Maker orders are visible to all users
- **Real-Time Updates:** Orders appear immediately after placement
- **No Special Marking:** Market Maker orders look identical to regular orders in the order book
- **Admin View:** Admin endpoints can filter to show only MM orders if needed

## Data Integrity

### Defensive Checks

The system includes defensive checks to prevent data integrity issues:

1. **Multiple Source IDs:** Orders with both `seller_id` and `market_maker_id` are excluded
2. **Zero Remaining:** Orders with `remaining_quantity <= 0` are filtered out
3. **Status Filtering:** Only `OPEN` and `PARTIALLY_FILLED` orders included

### Error Handling

- Database errors return empty order book with default prices
- Errors are logged for monitoring
- System gracefully degrades on failures

## Performance Considerations

### Query Optimization

- Indexes on: `certificate_type`, `side`, `status`, `price`, `created_at`
- Composite indexes recommended for better performance (see `docs/verification/database_indexes_recommendation.md`)
- Efficient aggregation in application layer

### Caching

- Order book queries are not cached (real-time data required)
- Consider caching for high-frequency access if needed
- Cache invalidation on order placement/cancellation

### Scalability

- Current implementation handles < 10,000 orders efficiently
- For larger volumes, consider:
  - Database-level aggregation (GROUP BY)
  - Pagination for order book display
  - Separate read replicas for order book queries

## API Endpoints

### Public Endpoint

```
GET /api/v1/cash-market/real/orderbook/{certificate_type}
```

- Returns aggregated order book
- Includes all order sources
- Real-time data from database
- No authentication required

### Admin Endpoint

```
GET /api/v1/admin/market-orders/orderbook/{certificate_type}
```

- Same data as public endpoint
- Admin-only access
- Useful for monitoring and debugging

## Testing

### Unit Tests

See `backend/tests/test_order_matching.py` for comprehensive test coverage:
- Empty order book
- Market Maker orders inclusion
- Price aggregation
- Cumulative quantities
- Edge cases (filled orders, zero remaining)

### Integration Tests

- Verify orders appear in order book after placement
- Verify orders removed after cancellation
- Verify aggregation works correctly
- Verify FIFO matching respects order source

## Troubleshooting

### Orders Not Appearing

**Check:**
1. Order status is `OPEN` or `PARTIALLY_FILLED`
2. Order has remaining quantity > 0
3. Market Maker is active
4. Certificate type matches query

### Incorrect Aggregation

**Check:**
1. Price levels are correct (no rounding issues)
2. Remaining quantity calculations
3. No orders with multiple source IDs
4. Database indexes are up to date

### Performance Issues

**Check:**
1. Database indexes exist and are used
2. Query execution plan (EXPLAIN ANALYZE)
3. Order volume (consider pagination)
4. Database connection pool size

## Future Enhancements

### Potential Improvements

1. **Database-Level Aggregation:** Use SQL GROUP BY for better performance
2. **Order Book Snapshots:** Cache snapshots for high-frequency access
3. **WebSocket Updates:** Real-time order book updates via WebSocket
4. **Order Book Depth Limits:** Limit displayed depth for UI performance
5. **Historical Order Book:** Store snapshots for analysis

## Related Documentation

- [Market Model Architecture](./market-model.md)
- [Market Makers API](../api/MARKET_MAKERS_API.md)
- [Market Makers Admin Guide](../admin/MARKET_MAKERS_GUIDE.md)
- [Database Indexes Recommendation](../verification/database_indexes_recommendation.md)
- [Implementation Summary](../verification/implementation_summary.md)
- [Design System Documentation](../../frontend/docs/DESIGN_SYSTEM.md) - Order Book Background Opacity Rules

---

**Document Version:** 1.1  
**Last Updated:** 2026-01-25  
**Changes:** Added UI Display & Visual Design section documenting order book visual enhancements
