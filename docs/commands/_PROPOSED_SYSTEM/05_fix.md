# Agent 05: Fix Issues

> **Purpose**: Fix all issues identified in code review.

## When to Use

- After code review found issues
- Called by orchestrators when review status is "CHANGES REQUIRED"
- Manual fix cycle

## Usage

```bash
@05_fix.md @docs/features/NNNN_REVIEW.md
```

## Prerequisites

- Review document exists with issues listed
- Original plan available for reference
- Understand the codebase context

## Instructions for AI Agent

### Step 1: Parse Review Document

1. **Read `NNNN_REVIEW.md`**
2. **Extract all issues** into categories:
   - Critical: [List with file/line references]
   - Major: [List with file/line references]
   - Minor: [List with file/line references]
   - Recommendations: [List]

3. **Count issues**:
   ```
   CRITICAL_COUNT = X
   MAJOR_COUNT = Y
   MINOR_COUNT = Z
   TOTAL_ISSUES = X + Y + Z
   ```

### Step 2: Fix in Priority Order

**Order matters.** Fix in this sequence:

```
1. All Critical issues (MUST fix all)
       ↓
2. All Major issues (MUST fix all)
       ↓
3. All Minor issues (SHOULD fix all)
       ↓
4. Recommendations (if time permits)
```

### Step 3: Fix Each Issue

For each issue:

1. **Locate the file and line** from review
2. **Understand the problem** - Read the "Problem" section
3. **Apply the fix** - Follow "Expected" or "Fix" guidance
4. **Verify the fix**:
   - Does it compile/lint?
   - Does it break anything else?
   - Does it follow project patterns?

**Fix template:**

```
Fixing [C1/M1/m1]: [Issue Title]
  File: path/to/file.ts
  Line: 42

  Before:
  [old code]

  After:
  [new code]

  Verification:
  - TypeScript: ✓
  - Lint: ✓
  - Related tests: ✓
```

### Step 4: Verify No Regressions

After all fixes:

1. **Run linter**
   ```bash
   npm run lint      # Frontend
   ruff check .      # Backend (Python)
   ```

2. **Run type check**
   ```bash
   npm run typecheck # or tsc --noEmit
   ```

3. **Run tests** (if available)
   ```bash
   npm run test
   pytest
   ```

4. **Manual smoke test**
   - Test the feature works end-to-end
   - Test adjacent features weren't broken

### Step 5: Update Review Document

Add a section to `NNNN_REVIEW.md`:

```markdown
---

## Fix Cycle 1

**Date**: [Date]
**Fixed by**: AI Agent

### Issues Fixed

| ID | Issue | Status |
|----|-------|--------|
| C1 | [Title] | ✓ Fixed |
| M1 | [Title] | ✓ Fixed |
| M2 | [Title] | ✓ Fixed |
| m1 | [Title] | ✓ Fixed |

### Verification

- Linter: PASS
- Type check: PASS
- Tests: PASS
- Manual test: PASS

### Notes

[Any relevant notes about the fixes]

---
```

### Step 6: Determine Next Step

**Decision logic:**

```
If (all Critical + Major + Minor fixed successfully):
    → Request re-review to verify
    → Next: @04_review.md (re-review mode)

If (some issues couldn't be fixed):
    → Document why
    → Report to human for decision
    → PAUSE for human input
```

### Step 7: Output Summary

```
═══════════════════════════════════════════════════════════════
                      FIX CYCLE COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Review: docs/features/NNNN_REVIEW.md
Fix cycle: #1

Issues addressed:
  Critical: X/X fixed
  Major:    Y/Y fixed
  Minor:    Z/Z fixed

Verification:
  Linter:     PASS
  Type check: PASS
  Tests:      PASS
  Manual:     PASS

[If all fixed:]
Ready for re-review.
Next step:
  → @04_review.md @docs/features/NNNN_PLAN.md (re-review)

[If some not fixed:]
⚠️ Some issues could not be fixed:
  - [Issue ID]: [Why]

Human decision required.

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Fix in priority order** - Critical first, always
2. **One issue at a time** - Don't mix fixes
3. **Verify each fix** - Check it works before moving on
4. **Don't introduce new issues** - Be careful with changes
5. **Document everything** - Update the review file
6. **Stay in scope** - Only fix what's in the review

## Common Fix Patterns

### Missing Error Handling

```typescript
// Before
const data = await api.getData();

// After
try {
  const data = await api.getData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw new Error('Unable to load data. Please try again.');
}
```

### Hard-Coded Colors

```tsx
// Before
<div style={{ backgroundColor: '#10b981' }}>

// After
<div className="bg-emerald-500">
```

### Missing Loading State

```tsx
// Before
return <DataList data={data} />;

// After
if (isLoading) {
  return <LoadingSpinner />;
}
return <DataList data={data} />;
```

### Type Safety

```typescript
// Before
function process(data: any) {

// After
interface ProcessData {
  id: string;
  value: number;
}
function process(data: ProcessData) {
```

### Missing ARIA Labels

```tsx
// Before
<button onClick={handleClick}>
  <Icon />
</button>

// After
<button 
  onClick={handleClick}
  aria-label="Close dialog"
>
  <Icon />
</button>
```

## Output

- Updated code with all fixes applied
- Updated `NNNN_REVIEW.md` with fix cycle documentation

## Next Agent

→ `@04_review.md` - Re-review to verify fixes (loop until clean)
