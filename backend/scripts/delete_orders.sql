-- Script to delete all orders from cash market and swap market
-- Run with: psql -h localhost -p 5433 -U niha_user -d niha_carbon -f delete_orders.sql

-- Delete cash market trades first (they reference orders)
DELETE FROM cash_market_trades;

-- Delete all orders (both cash market and swap)
DELETE FROM orders;

-- Delete swap requests
DELETE FROM swap_requests;

-- Show confirmation
SELECT 
    'Deleted all orders, swap requests, and trades' AS status,
    (SELECT COUNT(*) FROM orders) AS remaining_orders,
    (SELECT COUNT(*) FROM swap_requests) AS remaining_swap_requests,
    (SELECT COUNT(*) FROM cash_market_trades) AS remaining_trades;
