# Live Order Book Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The cash market order book already combines customer orders (from Entities via entity_id) and market maker orders (via market_maker_id) in the backend. This plan documents the current architecture and confirms no changes are needed.

**Architecture:** Backend `get_real_orderbook()` function queries the Order table, which can have orders from three sources: Entities (customers placing BUY orders), Sellers (legacy SELL orders), and MarketMakers (orders via market_maker_id). All orders are aggregated by price level and displayed together in the ProfessionalOrderBook component.

**Tech Stack:** React, TypeScript, FastAPI, SQLAlchemy, PostgreSQL

---

## Current Architecture Analysis

### Backend Implementation

**File:** `backend/app/services/order_matching.py:549-655`

The `get_real_orderbook()` function already implements combined order book:

1. **Queries BUY orders from Entities** (lines 573-585):
   ```python
   buy_result = await db.execute(
       select(Order, Entity)
       .join(Entity, Order.entity_id == Entity.id, isouter=True)
       .where(
           and_(
               Order.certificate_type == cert_enum,
               Order.side == OrderSide.BUY,
               Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
           )
       )
   )
   ```

2. **Queries SELL orders from Sellers** (lines 557-570):
   ```python
   sell_result = await db.execute(
       select(Order, Seller)
       .join(Seller, Order.seller_id == Seller.id, isouter=True)
       .where(
           and_(
               Order.certificate_type == cert_enum,
               Order.side == OrderSide.SELL,
               Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
           )
       )
   )
   ```

3. **Note:** The query uses `isouter=True` which means it includes orders even if there's no matching Entity or Seller. This allows Market Maker orders (which have `market_maker_id` set instead of `entity_id` or `seller_id`) to be included.

4. **Aggregates by price level** (lines 587-621):
   - Groups orders by price
   - Counts total quantity at each price level
   - Counts number of orders at each price level
   - Calculates cumulative quantities for depth visualization

5. **Returns combined order book** (lines 644-655):
   - Sorted bids (highest price first)
   - Sorted asks (lowest price first)
   - Spread, best bid, best ask
   - Market statistics

### Order Model Structure

**File:** `backend/app/models/models.py:384-391`

The Order table has three foreign keys to identify order source:
- `entity_id`: For customer BUY orders (regular users)
- `seller_id`: For legacy SELL orders (sellers)
- `market_maker_id`: For Market Maker orders (both BUY and SELL)

This design allows all three order types to coexist in the same table and be queried together.

### Frontend Implementation

**File:** `frontend/src/pages/CashMarketPage.tsx:28-54`

Already implements live updates:
1. Fetches order book from `/cash-market/real/orderbook/${certificateType}`
2. Polls every 3 seconds with `setInterval(fetchData, 3000)`
3. Displays using `ProfessionalOrderBook` component

**File:** `frontend/src/components/cash-market/ProfessionalOrderBook.tsx`

Displays aggregated order book data:
- Shows bids and asks side-by-side
- Visualizes depth with background bars
- Displays order count at each price level
- Highlights best bid/ask

## Conclusion

**The system already implements the requested functionality.**

The backend's `get_real_orderbook()` function queries all orders from the Order table regardless of source (customer, seller, or market maker) because:

1. All orders are in the same `Order` table
2. The queries use outer joins, so orders without entity_id or seller_id are still included
3. Orders with `market_maker_id` set will appear in the results
4. All orders are aggregated together by price level

The frontend already polls this endpoint every 3 seconds and displays the combined order book in real-time.

## Verification Task

To confirm market maker orders appear in the order book, we should:

### Task 1: Verify Market Maker Orders in Order Book

**Files:**
- Inspect: `backend/app/services/order_matching.py:549-655`

**Step 1: Review query logic**

Examine the SQL queries to confirm they include market maker orders:
- Line 558-570: SELL order query uses `isouter=True` which includes NULL sellers
- Line 573-585: BUY order query uses `isouter=True` which includes NULL entities
- These outer joins mean orders with `market_maker_id` (but NULL entity_id/seller_id) are included

**Step 2: Test with real data**

Create a market maker order and verify it appears:
1. Use backoffice to create an active LIQUIDITY_PROVIDER market maker with EUR balance
2. The market maker bot should automatically place BUY orders
3. Navigate to `/cash-market` and check if the BUY order appears in the order book
4. Verify the order count increases at that price level

**Step 3: Verify aggregation**

Confirm market maker orders are aggregated with customer orders:
1. Place a customer BUY order at the same price as a market maker order
2. Check that the order count shows 2+ at that price level
3. Check that the quantity shows the sum of both orders

**Expected Result:**
- Market maker orders appear in the order book
- They are aggregated with customer orders at the same price
- Order count reflects total number of orders from all sources

## No Implementation Changes Needed

The system already works as requested. The order book is "live" (polls every 3 seconds) and "real" (combines all orders from customers and market makers).

If verification shows market maker orders are NOT appearing, then we would need to:
1. Debug why the outer join queries aren't including them
2. Possibly add explicit filtering for `market_maker_id IS NOT NULL`
3. Update the query logic to union all three order sources

But based on the code review, the current implementation should already work correctly.
