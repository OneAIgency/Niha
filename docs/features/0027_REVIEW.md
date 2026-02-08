# Code Review: 0027 – EUR balance consistency (Dashboard = Backoffice)

**Plan:** [docs/features/0027_PLAN.md](0027_PLAN.md)  
**Scope:** Same EUR values from DB shown everywhere (dashboard, backoffice, cash market) via shared helper and fallback to `Entity.balance_amount`.

Review order: shared helper → cash_market endpoint → backoffice endpoint → edge cases & performance.

---

## 1. Shared helper – `balance_utils.get_entity_eur_balance`

**File:** `backend/app/services/balance_utils.py`

### 1.1 Signature and behaviour

- `get_entity_eur_balance(db: AsyncSession, entity_id: UUID) -> Decimal`
- Uses `get_entity_balance(db, entity_id, AssetType.EUR)` first; if result `> 0`, returns it.
- Otherwise loads `Entity` by `entity_id`; if `entity.balance_amount` is not None and `> 0`, returns `Decimal(str(entity.balance_amount))`; else returns `Decimal("0")`.

**Verdict:** Correct. Single place for “display EUR” logic.

### 1.2 Edge cases

- No holding / holding quantity 0 → fallback to `Entity.balance_amount`. OK.
- `entity.balance_amount` None or 0 → returns `Decimal("0")`. OK.
- `entity.balance_amount` negative: not checked; model allows it. Current logic uses `> 0`, so negative is not used as fallback. Acceptable for display; if business rules forbid negative, that belongs in model/validation.
- `entity_id` invalid: `select(Entity).where(Entity.id == entity_id)` returns no row → `entity` is None → returns `Decimal("0")`. Callers (cash_market for current user, backoffice after 404 check) ensure entity exists where it matters.

**Verdict:** Edge cases handled appropriately.

### 1.3 Types and imports

- `Entity` added to imports from `..models.models`. OK.
- Return type `Decimal` consistent with `get_entity_balance`. Callers use `float(eur_balance)` in responses. OK.

---

## 2. Cash market – `GET /user/balances`

**File:** `backend/app/api/v1/cash_market.py`

### 2.1 Changes

- Import: `from ...services.balance_utils import get_entity_eur_balance`.
- In `get_user_balances`: `eur_balance = await get_entity_eur_balance(db, current_user.entity_id)` instead of `get_entity_balance(db, current_user.entity_id, AssetType.EUR)`.
- CEA/EUA unchanged: still `get_entity_balance(..., AssetType.CEA)` and `AssetType.EUA`.
- Response shape unchanged: `eur_balance: float`, CEA/EUA as `int(round(...))`.

**Verdict:** Minimal, correct change; dashboard and cash market now show same EUR as backoffice.

### 2.2 Order preview/execute

- `preview_order` and `execute_market_buy_order` still use `get_entity_balance(db, entity_id, AssetType.EUR)` for available EUR (in `order_matching`). So tradable balance remains EntityHolding-only; display balance uses helper. Intentional and documented in plan (sync via backoffice if needed).

**Verdict:** OK.

---

## 3. Backoffice – `GET /entities/{entity_id}/assets`

**File:** `backend/app/api/v1/backoffice.py`

### 3.1 Changes

- Import: `get_entity_eur_balance` added next to `update_entity_balance` from `...services.balance_utils`.
- In `get_entity_assets`: after building `balances` from holdings, `balances[AssetType.EUR]` is set with `await get_entity_eur_balance(db, UUID(entity_id))` instead of the previous inline fallback (`if balances[AssetType.EUR] == 0 and entity.balance_amount: ...`).

**Verdict:** Logic centralized; behaviour unchanged (same fallback rule).

### 3.2 Redundant queries

- `get_entity_assets` already loads `entity` and all `holdings`. `get_entity_eur_balance` does: (1) `get_entity_balance` (one query for EntityHolding EUR), (2) if 0, `select(Entity)` (second query). So we re-query Entity and possibly the EUR holding. Acceptable for clarity and single source of truth; optional later optimization: pass optional `entity` / EUR holding into the helper to avoid extra queries when already loaded.

**Verdict:** No change required; note as optional optimization.

---

## 4. Consistency and conventions

### 4.1 CLAUDE / app_truth

- No new frozen-file or routing changes. Backend-only, no frontend edits. No conflict with CLAUDE.md or app_truth.

### 4.2 Naming and placement

- `get_entity_eur_balance` in `balance_utils` is discoverable and matches `get_entity_balance` / `update_entity_balance`. OK.

### 4.3 CEA/EUA integers (0021)

- CEA/EUA still returned as `int(round(float(...)))` in both endpoints. No regression.

---

## 5. Summary

| Area | Status | Notes |
|------|--------|--------|
| balance_utils.get_entity_eur_balance | Done | Single source for display EUR; EntityHolding + Entity.balance_amount fallback |
| cash_market get_user_balances | Done | Uses helper for eur_balance; response shape unchanged |
| backoffice get_entity_assets | Done | Uses helper; replaces inline fallback (DRY) |
| Edge cases (no entity, zero, negative) | OK | Safe behaviour for current use |
| Order preview/execute | Unchanged | Still EntityHolding-only for trading; by design |
| Performance | OK | Extra 1–2 queries in get_entity_assets acceptable; optional to optimize later |

---

## 6. Optional follow-ups — IMPLEMENTED

1. **Tests** — `backend/tests/test_balance_utils.py`: unit tests for `get_entity_eur_balance` (no holding + fallback; holding=0 + fallback; holding > 0 wins; entity missing → 0; no holding and balance_amount 0 → 0).
2. **Performance** — `get_entity_eur_balance` accepts optional `entity` and `eur_holding_quantity`; backoffice `get_entity_assets` passes them to avoid extra queries.
3. **Docs** — `app_truth.md` §5: added **EUR balance display (single source of truth)** with EntityHolding + Entity.balance_amount fallback and helper reference.
---

**Review complete.** Implementation matches plan 0027 and keeps EUR display consistent across the platform.
