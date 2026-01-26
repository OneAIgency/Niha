# Database Indexes Recommendation for Order Book Performance

**Date:** January 25, 2026  
**Feature:** Market Maker Order Book Integration  
**Purpose:** Optimize query performance for `get_real_orderbook()` function

## Current Indexes

Based on the Order model definition, the following indexes already exist:
- `orders.seller_id` (index=True)
- `orders.entity_id` (index=True)
- `orders.market_maker_id` (index=True)
- `orders.created_at` (index=True)
- `orders.ticket_id` (index=True)

## Recommended Composite Indexes

To optimize the `get_real_orderbook()` queries, consider adding the following composite indexes:

### 1. Index for SELL Orders Query

**Query Pattern:**
```sql
SELECT * FROM orders
WHERE certificate_type = ?
  AND side = 'SELL'
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (seller_id IS NOT NULL OR market_maker_id IS NOT NULL)
ORDER BY price ASC, created_at ASC
```

**Recommended Index:**
```sql
CREATE INDEX idx_orders_sell_active 
ON orders (certificate_type, side, status, price, created_at)
WHERE side = 'SELL' 
  AND status IN ('OPEN', 'PARTIALLY_FILLED');
```

**Coverage:** Covers the WHERE clause and ORDER BY clause for SELL orders.

### 2. Index for BUY Orders Query

**Query Pattern:**
```sql
SELECT * FROM orders
WHERE certificate_type = ?
  AND side = 'BUY'
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (entity_id IS NOT NULL OR market_maker_id IS NOT NULL)
ORDER BY price DESC, created_at ASC
```

**Recommended Index:**
```sql
CREATE INDEX idx_orders_buy_active 
ON orders (certificate_type, side, status, price DESC, created_at)
WHERE side = 'BUY' 
  AND status IN ('OPEN', 'PARTIALLY_FILLED');
```

**Coverage:** Covers the WHERE clause and ORDER BY clause for BUY orders.

### 3. Partial Index for Active Orders (Alternative)

If PostgreSQL partial indexes are preferred:

```sql
-- For SELL orders
CREATE INDEX idx_orders_sell_active_partial 
ON orders (certificate_type, price, created_at)
WHERE side = 'SELL' 
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (seller_id IS NOT NULL OR market_maker_id IS NOT NULL);

-- For BUY orders
CREATE INDEX idx_orders_buy_active_partial 
ON orders (certificate_type, price DESC, created_at)
WHERE side = 'BUY' 
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (entity_id IS NOT NULL OR market_maker_id IS NOT NULL);
```

## Migration Script

Create an Alembic migration to add these indexes:

```python
"""Add indexes for order book queries

Revision ID: add_orderbook_indexes
Revises: <previous_revision>
Create Date: 2026-01-25
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Index for SELL orders
    op.create_index(
        'idx_orders_sell_active',
        'orders',
        ['certificate_type', 'side', 'status', 'price', 'created_at'],
        postgresql_where=sa.text("side = 'SELL' AND status IN ('OPEN', 'PARTIALLY_FILLED')")
    )
    
    # Index for BUY orders
    op.create_index(
        'idx_orders_buy_active',
        'orders',
        ['certificate_type', 'side', 'status', sa.text('price DESC'), 'created_at'],
        postgresql_where=sa.text("side = 'BUY' AND status IN ('OPEN', 'PARTIALLY_FILLED')")
    )

def downgrade():
    op.drop_index('idx_orders_buy_active', table_name='orders')
    op.drop_index('idx_orders_sell_active', table_name='orders')
```

## Performance Impact

**Expected Benefits:**
- Faster query execution for order book retrieval
- Better performance with large order volumes (>10,000 orders)
- Reduced database load

**Trade-offs:**
- Slight increase in INSERT/UPDATE time (minimal)
- Additional storage space (minimal for indexes)

## Monitoring

After adding indexes, monitor:
1. Query execution time for `get_real_orderbook()`
2. Database CPU usage during order book queries
3. Index usage statistics (PostgreSQL `pg_stat_user_indexes`)

## Verification

To verify indexes are being used:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE certificate_type = 'CEA'
  AND side = 'SELL'
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
  AND (seller_id IS NOT NULL OR market_maker_id IS NOT NULL)
ORDER BY price ASC, created_at ASC;
```

Look for "Index Scan" or "Index Only Scan" in the execution plan.
