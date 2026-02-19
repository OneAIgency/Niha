# Code Review: init.sql seed data fix

**Files modified**: `backend/init.sql`  
**Change type**: Bug fix (DB bootstrap failure on fresh rebuild)  
**Plan**: N/A (ad-hoc fix)

---

## Summary

Removed INSERT statements from `backend/init.sql` that referenced tables (`trading_fee_configs`, `auto_trade_market_settings`, `auto_trade_settings`) before they exist. These tables are created by Alembic migrations, which run after the backend starts, while `init.sql` runs when PostgreSQL starts for the first time with an empty data directory—i.e. before any migrations. The inserts caused the DB container to exit with code 3 and prevented backend/frontend from starting.

**Implementation quality**: Good. Single, targeted change. No over-engineering.

---

## Issues Found

| Severity | Count | Details |
|----------|-------|---------|
| Critical | 0 | — |
| Major    | 0 | — |
| Minor    | 0 | — |

---

## Verification Against Checklist

1. **Plan implementation**: N/A (bug fix, no plan)
2. **Obvious bugs**: None
3. **Data alignment (snake_case/camelCase, nested objects)**: N/A (SQL only)
4. **app_truth.md compliance**: No changes to app behavior; init.sql is internal bootstrap. app_truth §7 correctly states schema is created/updated by migrations and `init_db()`.
5. **Over-engineering / refactor**: None; change is minimal
6. **Syntax / style consistency**: Matches existing init.sql style
7. **Error handling / edge cases**: Init no longer fails; migrations handle seed data idempotently
8. **Security / best practices**: No new risks; removed code was failing, not executing
9. **Testing**: Manual verification—rebuild succeeds, containers healthy
10. **UI/UX**: N/A (backend init script)

---

## Migration Coverage of Removed Seed Data

| Table | Migration | Seed in migration |
|-------|-----------|-------------------|
| `trading_fee_configs` | `2026_01_30_trading_fees.py` | Yes — CEA_CASH, SWAP, 0.005 |
| `auto_trade_settings` | `2026_02_02_auto_trade_settings.py` | Yes — CEA, EUA |
| `auto_trade_market_settings` | `2026_02_02_auto_trade_market_settings.py` | Yes — CEA_BID, CEA_ASK, EUA_SWAP |

Removed init.sql seed data is fully covered by Alembic migrations. Migration schema has evolved (e.g. auto_trade_market_settings has different columns); migrations are the correct source of seed data.

---

## Recommendations

None. Fix is complete.

---

## UI/UX and Interface Analysis

N/A — No UI components changed.
