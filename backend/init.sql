-- Nihao Carbon Trading Platform - Database Initialization
-- This script runs automatically when PostgreSQL container starts
--
-- Only PostgreSQL-specific extensions and shared enum types used by the app.
-- All other enums (userrole, contactstatus, kycstatus, etc.) are created by
-- Alembic migrations with UPPERCASE values; legacy lowercase enums were removed
-- to avoid orphan types (see docs/DB_SCHEMA_AUDIT.md).

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shared enum: same name and values as SQLAlchemy jurisdiction
DO $$ BEGIN
    CREATE TYPE jurisdiction AS ENUM ('EU', 'CN', 'HK', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: Tables and other enum types are created by Alembic migrations

-- ============================================================================
-- SEED DATA (safety net — migrations also insert these, ON CONFLICT = no-op)
-- ============================================================================

-- Trading fees: 0.5% default for both markets
INSERT INTO trading_fee_configs (id, market, bid_fee_rate, ask_fee_rate, is_active)
VALUES
    (gen_random_uuid(), 'CEA_CASH', 0.005, 0.005, true),
    (gen_random_uuid(), 'SWAP',     0.005, 0.005, true)
ON CONFLICT (market) DO NOTHING;

-- Auto-trade per-market settings (sensible defaults)
INSERT INTO auto_trade_market_settings (
    id, market_key, enabled,
    target_liquidity, price_deviation_pct, avg_order_count,
    min_order_volume_eur, max_order_volume_eur, volume_variety,
    avg_order_count_variation_pct,
    max_orders_per_price_level, max_orders_per_level_variation_pct,
    min_order_value_variation_pct,
    interval_seconds, order_interval_variation_pct,
    internal_trade_interval, internal_trade_volume_min, internal_trade_volume_max
)
VALUES
    (gen_random_uuid(), 'CEA_BID',  true, 500000, 3.0, 10, 1000, 250000, 7, 10, 3, 10, 10, 60, 10, 120, 2000, 100000),
    (gen_random_uuid(), 'CEA_ASK',  true, 500000, 3.0, 10, 1000, 250000, 7, 10, 3, 10, 10, 60, 10, 120, 2000, 100000),
    (gen_random_uuid(), 'EUA_SWAP', true, 500000, 2.0,  8, 1000, 500000, 5, 10, 3, 10, 10, 90, 10, 300, 2000, 200000)
ON CONFLICT (market_key) DO NOTHING;

-- Auto-trade global settings per certificate type
INSERT INTO auto_trade_settings (id, certificate_type, liquidity_limit_enabled)
VALUES
    (gen_random_uuid(), 'CEA', true),
    (gen_random_uuid(), 'EUA', true)
ON CONFLICT (certificate_type) DO NOTHING;
