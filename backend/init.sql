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
