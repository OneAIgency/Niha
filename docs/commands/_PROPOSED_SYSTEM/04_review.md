# Agent 04: Code Review

> **Purpose**: Thoroughly review implementation against the plan and project standards.

## When to Use

- After implementation is complete
- Called by orchestrators after `03_implement.md`
- Manual review of any code changes

## Usage

```bash
@04_review.md @docs/features/NNNN_PLAN.md
```

## Prerequisites

- Implementation is complete
- Plan document exists
- `app_truth.md` available for reference

## Instructions for AI Agent

### Step 1: Gather Context

1. **Read the plan** - `docs/features/NNNN_PLAN.md`
2. **Read UI spec** - `docs/features/NNNN_UI_SPEC.md` (if exists)
3. **Check `app_truth.md`** - Project standards
4. **Identify all changed files** - New and modified

### Step 2: Review Checklist

Go through each category systematically:

#### 2.1 Plan Compliance

- [ ] All requirements from plan implemented
- [ ] No extra features added (scope creep)
- [ ] Architecture matches plan
- [ ] API endpoints match plan specification
- [ ] Database schema matches plan

#### 2.2 Code Quality

- [ ] Follows project naming conventions (`app_truth.md` §6)
- [ ] Consistent with existing codebase style
- [ ] No overly complex functions (max ~50 lines)
- [ ] No duplicate code
- [ ] Proper separation of concerns
- [ ] Files not too large (max ~300 lines, split if larger)

#### 2.3 Type Safety

- [ ] All types properly defined
- [ ] No `any` types (unless absolutely necessary)
- [ ] Request/response types match between frontend and backend
- [ ] No implicit type coercion issues

#### 2.4 Error Handling

- [ ] All API calls have try/catch
- [ ] User-friendly error messages
- [ ] Errors logged appropriately
- [ ] No silent failures
- [ ] Edge cases handled

#### 2.5 Data Alignment

Common issues to check:
- [ ] snake_case vs camelCase consistency
- [ ] Date formats consistent
- [ ] Number precision (decimals)
- [ ] Null vs undefined handling
- [ ] Nested object access (`data.field` vs `data?.field`)

#### 2.6 Security

- [ ] Input validation on all endpoints
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization correct
- [ ] Sensitive data not logged
- [ ] No secrets in code

#### 2.7 Performance

- [ ] No N+1 query problems
- [ ] Appropriate database indexes
- [ ] No unnecessary re-renders (React)
- [ ] Large lists virtualized
- [ ] Images optimized

#### 2.8 UI/UX (if applicable)

Reference files to check against:
- `docs/commands/02_interface.md` (UI standards)
- `app_truth.md` §9 (UI/UX standards)
- `docs/DESIGN_SYSTEM.md` (design system)
- `src/theme/tokens.ts` (design tokens)

Verify:
- [ ] Uses design tokens (no hard-coded colors/spacing)
- [ ] Supports light and dark modes
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Follows existing component patterns

#### 2.9 Testing

- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] Component tests for UI (if applicable)
- [ ] Edge cases tested

### Step 3: Categorize Issues

For each issue found, categorize:

**Critical** (Must fix, blocks release)
- Security vulnerabilities
- Data loss potential
- Complete feature broken
- Major performance issues

**Major** (Must fix, significant impact)
- Partial functionality broken
- Missing error handling
- Accessibility violations
- Design system violations

**Minor** (Should fix, polish items)
- Code style inconsistencies
- Missing edge case handling
- Minor UI inconsistencies
- Documentation gaps

**Recommendations** (Nice to have)
- Performance optimizations
- Code organization improvements
- Future-proofing suggestions

### Step 4: Write Review Document

Write to: `docs/features/NNNN_REVIEW.md`

```markdown
# Code Review: [Feature Name]

> **Plan**: NNNN_PLAN.md
> **Reviewed**: [Date]
> **Status**: [PASS / CHANGES REQUIRED]

## Summary

[2-3 sentences summarizing implementation quality]

**Verdict**: [PASS / CHANGES REQUIRED]

## Statistics

| Category | Count |
|----------|-------|
| Files reviewed | N |
| Critical issues | X |
| Major issues | Y |
| Minor issues | Z |
| Recommendations | W |

## Plan Compliance

- [x] Requirement 1: Implemented correctly
- [x] Requirement 2: Implemented correctly
- [ ] Requirement 3: **Missing** (see Critical #1)

## Issues

### Critical Issues

#### C1: [Issue Title]

**File**: `path/to/file.ts`
**Line**: 42-45

**Problem**:
[Description of the issue]

**Current code**:
```typescript
// Problematic code
```

**Expected**:
```typescript
// How it should be
```

**Impact**: [Why this is critical]

---

### Major Issues

#### M1: [Issue Title]

**File**: `path/to/file.ts`
**Line**: 78

**Problem**:
[Description]

**Fix**:
[What to do]

---

### Minor Issues

#### m1: [Issue Title]

**File**: `path/to/file.ts`
**Line**: 102

**Issue**: [Brief description]
**Fix**: [Brief fix]

---

### Recommendations

#### R1: [Recommendation Title]

[Description and rationale]

---

## UI/UX Review

[If feature has UI components]

### Design Token Compliance

| Check | Status | Notes |
|-------|--------|-------|
| No hard-coded colors | ✓ / ✗ | [Notes] |
| No hard-coded spacing | ✓ / ✗ | [Notes] |
| Dark mode support | ✓ / ✗ | [Notes] |
| Responsive design | ✓ / ✗ | [Notes] |

### Component States

| Component | Loading | Error | Empty | Notes |
|-----------|---------|-------|-------|-------|
| ComponentA | ✓ | ✓ | ✓ | Good |
| ComponentB | ✓ | ✗ | ✓ | Missing error state |

### Accessibility

| Check | Status |
|-------|--------|
| ARIA labels | ✓ / ✗ |
| Keyboard navigation | ✓ / ✗ |
| Focus management | ✓ / ✗ |
| Color contrast | ✓ / ✗ |

---

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `path/to/file1.ts` | ✓ Clean | - |
| `path/to/file2.tsx` | ⚠️ Issues | M1, m2 |
| `path/to/file3.py` | ✗ Critical | C1 |

---

## Next Steps

[If CHANGES REQUIRED:]
1. Fix all Critical issues
2. Fix all Major issues
3. Fix Minor issues
4. Run `@05_fix.md` to address all issues
5. Re-run `@04_review.md` to verify

[If PASS:]
1. Proceed to `@06_docs.md` for documentation
```

### Step 5: Output Summary

```
═══════════════════════════════════════════════════════════════
                     CODE REVIEW COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Review: docs/features/NNNN_REVIEW.md

Results:
  Critical: X issues
  Major:    Y issues
  Minor:    Z issues
  Recommendations: W

Verdict: [PASS / CHANGES REQUIRED]

[If CHANGES REQUIRED:]
Next step:
  → @05_fix.md @docs/features/NNNN_REVIEW.md

[If PASS:]
Next step:
  → @06_docs.md @docs/features/NNNN_PLAN.md

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Be thorough** - Check every changed file
2. **Be specific** - Include file paths and line numbers
3. **Be objective** - Focus on facts, not preferences
4. **Prioritize correctly** - Critical > Major > Minor
5. **Provide solutions** - Don't just identify problems

## Output Files

| File | Purpose |
|------|---------|
| `docs/features/NNNN_REVIEW.md` | Detailed code review |

## Next Agent

→ `@05_fix.md` - If issues found  
→ `@06_docs.md` - If review passed
