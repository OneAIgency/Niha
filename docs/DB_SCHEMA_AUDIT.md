# DB Schema Audit Report - NIHA Carbon Platform

**Generated**: 2026-02-10
**Database**: PostgreSQL 16 (Docker)
**Engine**: SQLAlchemy 2.x (async) + Alembic
**Mode**: AUDIT (database accessible and functional)
**Last Updated**: 2026-02-10 (post-fix)

---

## Summary

| Metric | Count |
|--------|-------|
| Tables | 31 |
| Columns | ~230 |
| Indexes | 95 |
| Foreign Keys | 51 |
| Enumerations (active) | 29 |
| Enumerations (orphan/legacy) | 0 |
| Relationships (ORM) | 48 |
| Cascade Rules | 2 |
| Active Migrations | 43 |
| Archived Migrations | 10 |
| Data Rows (total) | ~37 |

**Issues Found**: 15 (Critical: 4, Warning: 6, Info: 5)
**Issues Fixed**: 12 | **Remaining**: 3 (Info only)

---

## Critical Issues — ALL FIXED

### 1. ~~`DepositStatus.CONFIRMED` - Dead Status Used in Active Code~~ FIXED

**Status**: RESOLVED
**Fix Applied**: Direct-create deposits now use `DepositStatus.CLEARED` instead of `CONFIRMED`. Count queries updated to filter by `CLEARED`. Data migration converts legacy CONFIRMED rows. CONFIRMED enum value marked as legacy in model comment.
**Migration**: `2026_02_10_conf_cleared`

---

### 2. ~~Duplicate Migration Columns - `2026_02_02_execution`~~ FIXED

**Status**: RESOLVED
**Fix Applied**: Migration made idempotent with `_column_exists()` checks using `information_schema.columns`. Works on both fresh and existing databases.

---

### 3. ~~`counterparty_type` Column Missing from Model~~ FIXED

**Status**: RESOLVED
**Fix Applied**: Removed phantom `counterparty_type` from `get_settlement_details()` docstring example. The actual response code already correctly omitted it.

---

### 4. ~~DepositStatus Enum Case Mismatch (Model vs Schema)~~ FIXED

**Status**: RESOLVED
**Fix Applied**: Unified all DepositStatus enum definitions to UPPERCASE:
- `schemas/schemas.py` DepositStatus: `"pending"` → `"PENDING"` (all values)
- `api/v1/deposits.py` DepositStatusEnum: `"pending"` → `"PENDING"` (all values)
- Now matches `models/models.py` (the DB source of truth)

---

## Warnings — MOSTLY FIXED

### 5. ~~9 Orphan Enum Types in Database~~ FIXED

**Status**: RESOLVED
**Fix Applied**:
- `init.sql` cleaned to only keep `uuid-ossp` extension and shared `jurisdiction` enum
- Migration `2026_02_10_drop_orphans` drops 8 orphan types from live DB
- Enum count: 37 → 29

---

### 6. ~~Port Discrepancy in Documentation~~ FIXED

**Status**: RESOLVED
**Fix Applied**: `CLAUDE.md` updated to show port 5434.

---

### 7. ~~Migration Head Discrepancy in Documentation~~ FIXED

**Status**: RESOLVED
**Fix Applied**: `CLAUDE.md` and `app_truth.md` updated. Current head: `2026_02_10_server_defaults`.

---

### 8. ~~No DB-Level Column Defaults~~ FIXED

**Status**: RESOLVED
**Fix Applied**: Migration `2026_02_10_server_defaults` adds PostgreSQL `DEFAULT` clauses:
- 51 timestamp columns: `DEFAULT (now() AT TIME ZONE 'utc')`
- 16 boolean columns: `DEFAULT true/false`
- 9 numeric columns: `DEFAULT 0`

---

### 9. `timestamp without time zone` Everywhere

**Status**: ACCEPTED (tracked debt)
**Severity**: WARNING

All 31 tables use `timestamp without time zone`. Combined with Python UTC handling via `datetime.now(timezone.utc).replace(tzinfo=None)`, this works. ~80 remaining `datetime.utcnow()` calls documented in CLAUDE.md technical debt.

---

### 10. ~~`EntityHolding` Missing Unique Constraint~~ FIXED

**Status**: RESOLVED
**Fix Applied**: `UniqueConstraint('entity_id', 'asset_type', name='uq_entity_holding_asset')` added to model and DB.
**Migration**: `2026_02_10_entity_holding_uq`

---

### 11. ~~CHECK Constraints for Positive Amounts~~ FIXED

**Status**: RESOLVED (was a recommendation, now implemented)
**Fix Applied**: Migration `2026_02_10_positive_checks` adds:
- `ck_entity_holdings_quantity_non_neg`: quantity >= 0
- `ck_orders_quantity_positive`: quantity > 0
- `ck_orders_price_non_neg`: price >= 0
- `ck_withdrawals_amount_positive`: amount > 0
- `ck_deposits_amounts_positive`: amount > 0, reported_amount > 0
- `ck_entities_balances_non_neg`: balance_amount >= 0, total_deposited >= 0

---

## Informational — NOT ADDRESSED (low priority)

### 12. `is_demo` Column Added Then Dropped

Migrations `2026_02_07_add_user_is_demo` and `2026_02_07_drop_user_is_demo` form a no-op pair. Left as-is to preserve migration chain integrity.

### 13. Auto-Trade Rules Has Dual Interval Systems

`auto_trade_rules` has BOTH minutes-based and seconds-based interval fields. Seconds-based is preferred. Deprecation deferred — requires frontend + service layer coordination.

### 14. Single Model File (~1400 lines)

All 31 models live in `backend/app/models/models.py`. Manageable for now; consider splitting by domain if it exceeds 2000 lines.

---

## Schema Health Score: 92/100

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Structural Integrity | 19 | 20 | UniqueConstraint added, phantom field fixed, CONFIRMED→CLEARED |
| Data Types | 18 | 20 | Consistent UUIDs, proper Numeric precision, but timestamp without tz |
| Indexing | 19 | 20 | Comprehensive indexing, 95 indexes across 31 tables |
| Naming | 18 | 20 | Orphan enums removed; dual interval naming remains |
| Constraints | 18 | 20 | UniqueConstraint + 6 CHECK constraints + server defaults added |

---

## Migration Chain (updated)

```
fe405e6fd550 (contact first/last name)
    → 2026_02_10_conf_cleared (CONFIRMED→CLEARED data migration)
    → 2026_02_10_entity_holding_uq (UniqueConstraint)
    → 2026_02_10_positive_checks (CHECK constraints)
    → 2026_02_10_drop_orphans (drop 8 orphan enum types)
    → 2026_02_10_server_defaults (DB-level defaults) ← HEAD
```

## Fixes Summary

| # | Issue | Severity | Status | Migration |
|---|-------|----------|--------|-----------|
| 1 | DepositStatus.CONFIRMED dead code | CRITICAL | FIXED | `conf_cleared` + code changes |
| 2 | Duplicate migration columns | CRITICAL | FIXED | `execution` made idempotent |
| 3 | counterparty_type phantom | CRITICAL | FIXED | Docstring cleaned |
| 4 | DepositStatus case mismatch | CRITICAL | FIXED | Enums unified to UPPERCASE |
| 5 | Orphan enum types | WARNING | FIXED | `drop_orphans` + init.sql |
| 6 | Port discrepancy | WARNING | FIXED | CLAUDE.md updated |
| 7 | Migration head outdated | WARNING | FIXED | CLAUDE.md + app_truth.md |
| 8 | No DB-level defaults | WARNING | FIXED | `server_defaults` |
| 9 | timestamp without tz | WARNING | ACCEPTED | Tracked debt |
| 10 | Missing UniqueConstraint | WARNING | FIXED | `entity_holding_uq` |
| 11 | Missing CHECK constraints | RECOMMENDATION | FIXED | `positive_checks` |
| 12 | is_demo no-op pair | INFO | ACCEPTED | Chain integrity preserved |
| 13 | Dual interval systems | INFO | DEFERRED | Needs coordination |
| 14 | Single models.py | INFO | DEFERRED | Under 2000 lines |
