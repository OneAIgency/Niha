# Agent 06: Write Documentation

> **Purpose**: Document the feature so documentation reflects actual implementation.

## When to Use

- After code review passes with no Critical/Major issues
- Called by orchestrators as final step
- Manual documentation updates

## Usage

```bash
@06_docs.md @docs/features/NNNN_PLAN.md @docs/features/NNNN_REVIEW.md
```

## Prerequisites

- Implementation complete and reviewed
- Code review passed (no Critical/Major issues)
- Access to the implemented code

## Core Principle

**The code is the source of truth.** If there's any discrepancy between plan/review and the actual code, document what the code does.

## Instructions for AI Agent

### Step 1: Gather Context

1. **Read the plan** - Original requirements
2. **Read the review** - Final state, any deviations
3. **Examine the code** - What was actually implemented
4. **Check `app_truth.md`** - What sections might need updates

### Step 2: Identify Documentation Needs

Determine what needs documentation:

| Change Type | Documentation Needed |
|-------------|---------------------|
| New API endpoints | `app_truth.md` §7, API docs |
| Database changes | `app_truth.md` §8, schema docs |
| New UI components | `DESIGN_SYSTEM.md`, component docs |
| New design tokens | `app_truth.md` §9, token docs |
| Config changes | `app_truth.md` §4, README |
| New routes | `app_truth.md` §8 (routing) |
| Auth changes | `app_truth.md` §10 |

### Step 3: Update app_truth.md

**Only update sections affected by this feature.**

Common sections to update:

**§7 API Conventions** - If new endpoints:
```markdown
### [Feature Name] Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/v1/resource | Create resource |
| GET | /api/v1/resource/:id | Get resource |
```

**§8 Database/Routing** - If new tables or routes:
```markdown
### [Feature Name]
- Route: `/path/to/feature`
- Access: [Roles that can access]
- Description: [What it does]
```

**§9 UI/UX** - If new design patterns:
```markdown
### [New Component/Pattern]
- Location: `src/components/path/Component.tsx`
- Usage: [When to use this]
- Tokens: [Which design tokens it uses]
```

### Step 4: Update DESIGN_SYSTEM.md

**Only if UI components were created.**

Add documentation for new components:

```markdown
### [Component Name]

**Purpose**: [What it does]

**Location**: `src/components/path/ComponentName.tsx`

**Usage**:
```tsx
<ComponentName
  prop1="value"
  prop2={true}
  onAction={() => {}}
/>
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| prop1 | string | Yes | Description |
| prop2 | boolean | No | Description |

**Variants**:
- Default: [Description]
- Active: [Description]

**Design Tokens Used**:
- `--color-surface` - Background
- `--space-4` - Padding
```

### Step 5: Add Code Comments

Add comments only where purpose is unclear:

```typescript
/**
 * Calculates settlement date based on T+3 business days rule.
 * Excludes weekends and configured holidays.
 * 
 * @param tradeDate - The date of the trade
 * @returns Settlement date (T+3 business days)
 */
function calculateSettlementDate(tradeDate: Date): Date {
  // Complex logic that benefits from explanation
}
```

**Do NOT add obvious comments:**
```typescript
// ❌ Don't do this
// Get user by ID
function getUserById(id: string) { ... }

// ✅ Only when logic is non-obvious
// Uses binary search for O(log n) lookup in sorted price levels
function findPriceLevel(price: number): PriceLevel | null { ... }
```

### Step 6: Update README (if applicable)

If feature is user-facing or changes setup:

```markdown
## [Feature Name]

[Brief description]

### Usage

[How to use the feature]

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| VAR_NAME | What it does | value |
```

### Step 7: Clean Up Feature Docs

The feature documentation files are for historical reference:

- `NNNN_PLAN.md` - Keep as-is (historical)
- `NNNN_UI_SPEC.md` - Keep as-is (historical)
- `NNNN_REVIEW.md` - Keep as-is (historical)

**Do NOT** create new documentation files in `docs/features/`. That directory is for plan/review history only.

### Step 8: Verify Documentation

Checklist:
- [ ] `app_truth.md` updated (if architecture affected)
- [ ] `DESIGN_SYSTEM.md` updated (if UI components added)
- [ ] Code comments added (where logic is complex)
- [ ] README updated (if user-facing changes)
- [ ] No broken links in documentation
- [ ] Examples are accurate and runnable

### Step 9: Output Summary

```
═══════════════════════════════════════════════════════════════
                   DOCUMENTATION COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]

Documentation updated:
  ✓ app_truth.md
      - §7: Added API endpoints for [feature]
      - §8: Added route documentation
  ✓ DESIGN_SYSTEM.md
      - Added [ComponentName] documentation
  ✓ Code comments
      - [file.ts]: Added JSDoc for complex functions

No updates needed:
  - README.md (no user-facing changes)

Feature documentation preserved:
  - docs/features/NNNN_PLAN.md
  - docs/features/NNNN_UI_SPEC.md
  - docs/features/NNNN_REVIEW.md

═══════════════════════════════════════════════════════════════
                    FEATURE COMPLETE
═══════════════════════════════════════════════════════════════
```

## Rules

1. **Code is truth** - Document what's implemented, not what was planned
2. **Don't over-document** - Only document what's not obvious
3. **Keep examples runnable** - Test code examples work
4. **Update, don't duplicate** - Modify existing docs, don't create parallel versions
5. **Feature docs are history** - Don't add to `docs/features/` except plan/review

## Output

Updated documentation across the project.

## Next Agent

None - Feature development is complete!

---

## Feature Complete Checklist

At this point, the feature should have:

- [x] Plan document (`NNNN_PLAN.md`)
- [x] UI spec (`NNNN_UI_SPEC.md`) - if applicable
- [x] Working implementation
- [x] Code review passed (`NNNN_REVIEW.md`)
- [x] All issues fixed
- [x] Documentation updated
- [x] Ready for merge/deploy
