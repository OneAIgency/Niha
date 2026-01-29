# Orchestrator: Auto-Feature

> **Purpose**: Implement a complete feature from description to documentation, fully automated.

## Usage

```bash
@auto_feature.md "Feature description"
```

**Examples:**
```bash
@auto_feature.md "Add user profile page with avatar upload, bio, and settings"
@auto_feature.md "Implement order book with real-time bid/ask updates"
@auto_feature.md "Add email notification system for order confirmations"
```

## Prerequisites

- Project already set up (`app_truth.md` exists)
- Design token system in place (for UI features)

## What This Does

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTO-FEATURE SEQUENCE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  01_plan        Create technical plan                       │
│      ↓          [docs/features/NNNN_PLAN.md]               │
│                                                             │
│  02_interface   Create UI spec (if feature has UI)         │
│      ↓          [docs/features/NNNN_UI_SPEC.md]            │
│                                                             │
│  03_implement   Build the feature                          │
│      ↓          [actual code files]                        │
│                                                             │
│  04_review      Code review against plan                   │
│      ↓          [docs/features/NNNN_REVIEW.md]             │
│                                                             │
│  05_fix         Fix all issues found                       │
│      ↓          [repeat with 04 until clean]               │
│                                                             │
│  06_docs        Update all documentation                   │
│      ↓          [app_truth.md, DESIGN_SYSTEM.md, etc]      │
│                                                             │
│  ✓ COMPLETE     Feature ready for merge                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

Execute the following steps **in order**, **without stopping** for user input unless explicitly required by the step.

---

### STEP 1: PLAN

**Execute**: `@01_plan.md` with user's feature description

**Actions**:
1. Check `app_truth.md` for project context
2. Research codebase for related files
3. Ask clarifying questions if needed (up to 5, then PAUSE)
4. Create technical plan

**Determine next feature number**:
```
List docs/features/*.md
Extract highest NNNN number
FEATURE_NUM = highest + 1 (or 0001 if none)
```

**Output**:
- `PLAN_FILE` = `docs/features/[FEATURE_NUM]_PLAN.md`
- `HAS_UI` = true/false (from plan)

**Continue immediately to Step 2**

---

### STEP 2: INTERFACE (Conditional)

**Condition**: Execute only if `HAS_UI = true`

**Execute**: `@02_interface.md @[PLAN_FILE]`

**Actions**:
1. Review plan for UI requirements
2. Check existing components and design tokens
3. Create UI specification
4. Identify if new tokens needed

**Output**:
- `UI_SPEC_FILE` = `docs/features/[FEATURE_NUM]_UI_SPEC.md`
- `NEEDS_NEW_TOKENS` = true/false

**If `NEEDS_NEW_TOKENS = true`**:
```
Execute @07_theme.md to add required tokens
Wait for completion
```

**Continue immediately to Step 3**

---

### STEP 3: IMPLEMENT

**Execute**: `@03_implement.md @[PLAN_FILE]`

If UI spec exists, also reference: `@[UI_SPEC_FILE]`

**Actions**:
1. Review plan (and UI spec)
2. Implement in order: types → database → backend → frontend
3. Self-verify: types, lint, manual test
4. List all files created/modified

**Output**:
- `FILES_CREATED` = [list]
- `FILES_MODIFIED` = [list]

**Continue immediately to Step 4**

---

### STEP 4: REVIEW

**Execute**: `@04_review.md @[PLAN_FILE]`

**Actions**:
1. Review all code against plan
2. Check `app_truth.md` compliance
3. Check UI compliance (if applicable)
4. Categorize all issues found

**Output**:
- `REVIEW_FILE` = `docs/features/[FEATURE_NUM]_REVIEW.md`
- `CRITICAL_COUNT` = number
- `MAJOR_COUNT` = number
- `MINOR_COUNT` = number
- `TOTAL_ISSUES` = CRITICAL + MAJOR + MINOR

**Decision**:
```
IF TOTAL_ISSUES = 0:
    SKIP to Step 6 (documentation)
ELSE:
    CONTINUE to Step 5 (fix)
```

---

### STEP 5: FIX + RE-REVIEW (Loop)

**Initialize**:
```
FIX_CYCLE = 0
MAX_CYCLES = 3
```

**Loop**:
```
WHILE TOTAL_ISSUES > 0 AND FIX_CYCLE < MAX_CYCLES:
    
    FIX_CYCLE += 1
    
    # Fix all issues
    Execute @05_fix.md @[REVIEW_FILE]
    
    # Re-review
    Execute @04_review.md @[PLAN_FILE] (re-review mode)
    
    # Update counts from new review
    TOTAL_ISSUES = CRITICAL_COUNT + MAJOR_COUNT + MINOR_COUNT
    
    # Log progress
    Print "Fix cycle {FIX_CYCLE}: {TOTAL_ISSUES} issues remaining"

END WHILE
```

**After loop**:
```
IF TOTAL_ISSUES > 0:
    # Still have issues after max cycles
    PAUSE and report:
    
    "═══════════════════════════════════════════════════════════
     ⚠️  HUMAN INTERVENTION REQUIRED
    ═══════════════════════════════════════════════════════════
    
    After {MAX_CYCLES} fix cycles, {TOTAL_ISSUES} issues remain:
      Critical: {CRITICAL_COUNT}
      Major: {MAJOR_COUNT}
      Minor: {MINOR_COUNT}
    
    Review file: {REVIEW_FILE}
    
    Options:
    1. Fix issues manually, then run: @06_docs.md @[PLAN_FILE]
    2. Provide guidance for specific issues
    3. Accept current state and continue: reply 'continue anyway'
    
    ═══════════════════════════════════════════════════════════"
    
    WAIT for human response
    
ELSE:
    CONTINUE to Step 6
```

---

### STEP 6: DOCUMENTATION

**Execute**: `@06_docs.md @[PLAN_FILE] @[REVIEW_FILE]`

**Actions**:
1. Update `app_truth.md` if architecture affected
2. Update `docs/DESIGN_SYSTEM.md` if UI components added
3. Add code comments where needed
4. Update README if user-facing feature

**Continue immediately to Completion**

---

### COMPLETION

**Output final summary**:

```
═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature description]

Documentation:
  ✓ Plan:     docs/features/[FEATURE_NUM]_PLAN.md
  ✓ UI Spec:  docs/features/[FEATURE_NUM]_UI_SPEC.md (if applicable)
  ✓ Review:   docs/features/[FEATURE_NUM]_REVIEW.md

Implementation:
  Files created:
    ✓ [path/to/file1]
    ✓ [path/to/file2]
  
  Files modified:
    ✓ [path/to/file3]
    ✓ [path/to/file4]

Quality:
  Review cycles: [FIX_CYCLE]
  Issues fixed: [total count]
  Final status: CLEAN

Documentation updated:
  ✓ [list of docs updated]

Status: READY FOR MERGE

═══════════════════════════════════════════════════════════════
```

---

## Human Intervention Points

The orchestrator **pauses only when**:

1. **Clarifying questions** (Step 1) - If feature description is ambiguous
2. **After 3 fix cycles** (Step 5) - If Critical/Major issues persist
3. **Breaking changes detected** (any step) - If feature would break existing functionality
4. **Security concerns** (any step) - If implementation involves sensitive patterns

---

## Flags

Modify behavior with flags:

```bash
# Skip UI specification
@auto_feature.md --no-ui "Backend-only feature"

# Skip documentation
@auto_feature.md --skip-docs "Prototype, document later"

# Dry run (plan only)
@auto_feature.md --dry-run "Feature description"

# Verbose mode
@auto_feature.md --verbose "Feature description"

# Force continue past review issues
@auto_feature.md --force "Feature description"
```

---

## Error Handling

If any step fails:

1. **Log the error** with full context
2. **Save progress** - All completed files remain
3. **Report clearly**:
   ```
   ═══════════════════════════════════════════════════════════
   ✗ AUTO-FEATURE FAILED AT STEP [N]: [Step Name]
   ═══════════════════════════════════════════════════════════
   
   Error: [Error message]
   
   Files created before failure:
     ✓ [list]
   
   To continue manually:
     1. Fix: [what to fix]
     2. Run: @[next_agent].md [args]
   
   To retry this step:
     @[current_agent].md [args]
   ═══════════════════════════════════════════════════════════
   ```

---

## Example Run

```
User: @auto_feature.md "Add deposit announcement with amount and reference number"

Agent:
═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE STARTED
═══════════════════════════════════════════════════════════════

[STEP 1/6] Planning...
  → Reading app_truth.md...
  → Researching codebase...
  → Found related: deposits.py, FundingPage.tsx
  ✓ Plan: docs/features/0015_PLAN.md
  → Has UI: YES

[STEP 2/6] Creating UI spec...
  → Checking design tokens...
  → Designing components...
  ✓ UI Spec: docs/features/0015_UI_SPEC.md
  → New tokens needed: NO

[STEP 3/6] Implementing...
  → Creating types...
  → Creating API endpoint...
  → Creating UI components...
  ✓ Implementation complete
  → Files created: 3
  → Files modified: 4

[STEP 4/6] Reviewing...
  → Checking plan compliance...
  → Checking code quality...
  → Checking UI compliance...
  ✓ Review: docs/features/0015_REVIEW.md
  → Issues: 0 Critical, 1 Major, 2 Minor

[STEP 5/6] Fixing issues...
  → Fix cycle 1...
  → Fixing M1: Missing validation...
  → Fixing m1: Button spacing...
  → Fixing m2: Missing aria-label...
  ✓ All issues fixed
  
  → Re-reviewing...
  → Issues: 0 Critical, 0 Major, 0 Minor
  ✓ Review PASSED

[STEP 6/6] Documenting...
  → Updating app_truth.md...
  → Adding code comments...
  ✓ Documentation complete

═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE COMPLETE
═══════════════════════════════════════════════════════════════

Feature: Add deposit announcement with amount and reference number

Documentation:
  ✓ Plan:     docs/features/0015_PLAN.md
  ✓ UI Spec:  docs/features/0015_UI_SPEC.md
  ✓ Review:   docs/features/0015_REVIEW.md

Implementation:
  Files created:
    ✓ frontend/src/components/funding/AnnounceDepositModal.tsx
    ✓ backend/app/schemas/deposit.py
    ✓ backend/alembic/versions/2024_01_15_deposit_announce.py
  
  Files modified:
    ✓ frontend/src/pages/FundingPage.tsx
    ✓ backend/app/api/v1/deposits.py
    ✓ backend/app/models/deposit.py
    ✓ app_truth.md

Quality:
  Review cycles: 1
  Issues fixed: 3
  Final status: CLEAN

Status: READY FOR MERGE

═══════════════════════════════════════════════════════════════
```
