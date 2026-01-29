# Orchestrator: Auto-Project

> **Purpose**: Start a new project from scratch and implement the first feature automatically.

## Usage

```bash
@auto_project.md "Complete description of your application"
```

**Example:**
```bash
@auto_project.md "A task management app with projects, tasks, due dates, and team collaboration. Users can create projects, add tasks with priorities, assign to team members, and track progress. Needs authentication and real-time updates."
```

## What This Does

Executes the complete project setup and first feature implementation:

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-PROJECT SEQUENCE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PHASE 1: PROJECT SETUP                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  00_brief     Create product brief & app_truth.md   │  │
│  │      ↓                                               │  │
│  │  07_theme     Setup design token system             │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PHASE 2: FIRST FEATURE                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  01_plan      Plan the core feature                  │  │
│  │      ↓                                               │  │
│  │  02_interface Create UI specification (if needed)   │  │
│  │      ↓                                               │  │
│  │  03_implement Build the feature                     │  │
│  │      ↓                                               │  │
│  │  04_review    Code review                           │  │
│  │      ↓                                               │  │
│  │  05_fix       Fix issues (loop until clean)         │  │
│  │      ↓                                               │  │
│  │  06_docs      Document everything                   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│                    PROJECT READY                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

Execute the following phases **in order**, **without stopping** for user input unless explicitly required.

---

## PHASE 1: PROJECT SETUP

### Step 1.1: Create Project Brief

**Execute**: `@00_brief.md` with the user's description

**Actions**:
1. Parse the application description
2. Ask up to 5 clarifying questions if needed (PAUSE for answers)
3. Determine technology stack
4. Create `docs/PRODUCT_BRIEF.md`
5. Create `app_truth.md`
6. Create directory structure

**Output variables**:
- `PROJECT_NAME` = extracted from brief
- `HAS_FRONTEND` = true/false
- `HAS_BACKEND` = true/false
- `TECH_STACK` = { frontend, backend, database }

**Continue immediately to Step 1.2**

---

### Step 1.2: Setup Design System (if frontend)

**Condition**: Only if `HAS_FRONTEND = true`

**Execute**: `@07_theme.md "Setup initial design tokens for [PROJECT_NAME]"`

**Actions**:
1. Create `src/theme/tokens.ts` with complete token structure
2. Create `src/theme/scripts/generate.ts`
3. Generate initial CSS and Tailwind files
4. Create `docs/DESIGN_SYSTEM.md` template

**Continue immediately to Phase 2**

---

## PHASE 2: FIRST FEATURE

### Step 2.1: Identify Core Feature

From the product brief, identify the **most essential feature** to implement first.

**Priority order**:
1. Authentication (if mentioned)
2. Core data model CRUD (main entity)
3. Primary user workflow

**Set**: `FIRST_FEATURE` = "[Feature description]"

---

### Step 2.2: Plan Feature

**Execute**: `@01_plan.md "[FIRST_FEATURE]"`

**Actions**:
1. Create technical plan
2. Identify if feature has UI
3. Write `docs/features/0001_PLAN.md`

**Output variables**:
- `PLAN_FILE` = `docs/features/0001_PLAN.md`
- `FEATURE_HAS_UI` = true/false

**Continue immediately to Step 2.3**

---

### Step 2.3: Create UI Specification (if needed)

**Condition**: Only if `FEATURE_HAS_UI = true`

**Execute**: `@02_interface.md @docs/features/0001_PLAN.md`

**Actions**:
1. Create UI specification
2. Identify design tokens needed
3. Write `docs/features/0001_UI_SPEC.md`

**Output variables**:
- `UI_SPEC_FILE` = `docs/features/0001_UI_SPEC.md`
- `NEW_TOKENS_NEEDED` = true/false

**If `NEW_TOKENS_NEEDED = true`**:
- Execute `@07_theme.md` to add required tokens
- Then continue

**Continue immediately to Step 2.4**

---

### Step 2.4: Implement Feature

**Execute**: `@03_implement.md @docs/features/0001_PLAN.md`

(Include UI spec if exists)

**Actions**:
1. Implement types/interfaces
2. Implement database layer (if applicable)
3. Implement backend/API (if applicable)
4. Implement frontend (if applicable)
5. Self-verify implementation

**Continue immediately to Step 2.5**

---

### Step 2.5: Code Review

**Execute**: `@04_review.md @docs/features/0001_PLAN.md`

**Actions**:
1. Review all code against plan
2. Check against `app_truth.md`
3. Check UI compliance (if applicable)
4. Write `docs/features/0001_REVIEW.md`

**Output variables**:
- `REVIEW_FILE` = `docs/features/0001_REVIEW.md`
- `CRITICAL_ISSUES` = count
- `MAJOR_ISSUES` = count
- `MINOR_ISSUES` = count
- `TOTAL_ISSUES` = sum

**Decision**:
- If `TOTAL_ISSUES > 0`: Continue to Step 2.6
- If `TOTAL_ISSUES = 0`: Skip to Step 2.7

---

### Step 2.6: Fix Issues (Loop)

**Execute**: `@05_fix.md @docs/features/0001_REVIEW.md`

**Actions**:
1. Fix all Critical issues
2. Fix all Major issues
3. Fix all Minor issues
4. Verify fixes

**After fixing, re-run review**:
- Execute `@04_review.md` again (re-review mode)
- Update issue counts

**Loop logic**:
```
FIX_CYCLE = 1

WHILE TOTAL_ISSUES > 0 AND FIX_CYCLE <= 3:
    Execute @05_fix.md
    Execute @04_review.md (re-review)
    FIX_CYCLE += 1

IF FIX_CYCLE > 3 AND TOTAL_ISSUES > 0:
    PAUSE - Report to human:
    "After 3 fix cycles, X issues remain. Human review required."
```

**Continue to Step 2.7 when TOTAL_ISSUES = 0**

---

### Step 2.7: Write Documentation

**Execute**: `@06_docs.md @docs/features/0001_PLAN.md @docs/features/0001_REVIEW.md`

**Actions**:
1. Update `app_truth.md` with feature details
2. Update `docs/DESIGN_SYSTEM.md` (if UI)
3. Add code comments where needed
4. Update README if user-facing

---

## COMPLETION

**Output final summary**:

```
═══════════════════════════════════════════════════════════════
                    AUTO-PROJECT COMPLETE
═══════════════════════════════════════════════════════════════

Project: [PROJECT_NAME]
Stack: [TECH_STACK]

Project files created:
  ✓ app_truth.md (Single Source of Truth)
  ✓ docs/PRODUCT_BRIEF.md
  ✓ docs/DESIGN_SYSTEM.md
  ✓ src/theme/ (Design token system)

First feature implemented:
  ✓ Feature: [FIRST_FEATURE]
  ✓ Plan: docs/features/0001_PLAN.md
  ✓ UI Spec: docs/features/0001_UI_SPEC.md (if applicable)
  ✓ Review: docs/features/0001_REVIEW.md
  ✓ Review cycles: [FIX_CYCLE]
  ✓ Total issues fixed: [count]

Implementation files:
  ✓ [List all created/modified files]

To start development server:
  [Commands based on stack]

To add more features:
  @auto_feature.md "Feature description"

═══════════════════════════════════════════════════════════════
```

---

## Human Intervention Points

The orchestrator **pauses** only for:

1. **Clarifying questions** (Step 1.1) - If description is ambiguous
2. **Technology choice** (Step 1.1) - If multiple valid options exist
3. **After 3 fix cycles** (Step 2.6) - If issues persist
4. **Security decisions** - If auth patterns need human approval

---

## Flags

```bash
# Skip frontend/theme setup
@auto_project.md --backend-only "API-only project description"

# Skip first feature, just setup
@auto_project.md --setup-only "Project description"

# Verbose output
@auto_project.md --verbose "Project description"
```

---

## Error Recovery

If any step fails:

1. Log the error with full context
2. Save all progress (partial files)
3. Report which step failed
4. Provide manual recovery instructions:
   ```
   To continue manually:
   1. Fix the error in [file]
   2. Run @[next_agent].md to continue
   ```
