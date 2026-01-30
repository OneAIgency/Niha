# Agent 01: Plan Feature

> **Purpose**: Create a technical plan that precisely describes how to implement a feature.

## When to Use

- Adding a new feature to an existing project
- Called by `auto_feature.md` or `auto_project.md` orchestrators
- Manual planning before implementation

## Usage

```bash
@01_plan.md "Feature description"
```

**Example:**
```bash
@01_plan.md "Add user authentication with email/password and OAuth (Google, GitHub)"
```

## Prerequisites

- `app_truth.md` must exist (run `@00_brief.md` first if not)

## Instructions for AI Agent

### Step 1: Understand the Feature

1. Parse the feature description
2. Identify:
   - **Scope**: What exactly needs to be built?
   - **Dependencies**: What existing code does this touch?
   - **Type**: Backend-only, frontend-only, or full-stack?
   - **Has UI**: Does this feature have user interface components?

### Step 2: Research the Codebase

1. **Check `app_truth.md`** for:
   - Technology stack and versions
   - Existing patterns and conventions
   - API structure
   - Database conventions
   - UI/UX standards (§9)

2. **Find related files**:
   - Existing similar features
   - Shared utilities
   - Related components
   - Database models

3. **Note integration points**:
   - Which files need modification?
   - Which new files need creation?
   - Any breaking changes?

### Step 3: Clarify if Needed

If requirements are unclear, ask **up to 5 questions**:

```
Before creating the plan, I need clarification:

1. [Specific question about scope]
2. [Specific question about behavior]
...

Please answer these, and I'll proceed with the plan.
```

**Do not proceed** until answers are received.

### Step 4: Write the Plan

Write to: `docs/features/NNNN_PLAN.md` (next available number)

Use this structure:

```markdown
# Feature: [Feature Name]

> **Plan ID**: NNNN
> **Created**: [Date]
> **Status**: Draft

## Overview

[2-3 sentences describing what this feature does and why]

## Requirements

From user request:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Technical Approach

### Architecture Decision

[Brief explanation of the chosen approach and why]

### Has UI Components: [Yes/No]

[If yes, note that UI spec will be created by 02_interface.md]

## Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `path/to/file.ts` | [What it does] |
| `path/to/file.ts` | [What it does] |

### Files to Modify

| File | Changes |
|------|---------|
| `path/to/existing.ts` | [What changes] |
| `path/to/existing.ts` | [What changes] |

### Database Changes

[If applicable]

**New Tables:**
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  ...
);
```

**Migrations:**
- Migration name: `YYYY_MM_DD_description`
- Changes: [describe]

### API Endpoints

[If applicable]

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/v1/resource | Create resource |
| GET | /api/v1/resource/:id | Get resource |

**Request/Response Examples:**

```json
// POST /api/v1/resource
// Request
{
  "field": "value"
}

// Response
{
  "data": { "id": "...", "field": "value" }
}
```

### Key Algorithms

[If any complex logic, explain step-by-step]

1. Step one
2. Step two
3. Step three

## Implementation Phases

[Only if feature is large enough to need phases]

### Phase 1: Data Layer
- [ ] Create types/interfaces
- [ ] Create database migrations
- [ ] Create models

### Phase 2A: Backend (can parallel with 2B)
- [ ] Create API endpoints
- [ ] Add validation
- [ ] Add error handling

### Phase 2B: Frontend (can parallel with 2A)
- [ ] Create components
- [ ] Add state management
- [ ] Connect to API

### Phase 3: Integration
- [ ] End-to-end testing
- [ ] Error handling verification

## Dependencies

### External Packages
- [package-name]: [why needed]

### Internal Dependencies
- [file/module]: [why needed]

## Edge Cases

- [Edge case 1]: [How to handle]
- [Edge case 2]: [How to handle]

## Security Considerations

[If applicable]

- [Security concern]: [Mitigation]

## Out of Scope

[Explicitly list what this feature does NOT include]

- [Thing 1]
- [Thing 2]

---

## Checklist Before Implementation

- [ ] Plan reviewed
- [ ] `app_truth.md` consulted
- [ ] No conflicts with existing features
- [ ] UI spec created (if Has UI = Yes)
```

### Step 5: Determine Next Step

Based on `Has UI Components`:

**If Yes:**
```
Plan complete. Feature has UI components.
→ Next: @02_interface.md will create UI specification
```

**If No:**
```
Plan complete. No UI components needed.
→ Next: @03_implement.md will implement the feature
```

### Step 6: Output Summary

```
═══════════════════════════════════════════════════════════════
                      PLAN COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Plan: docs/features/NNNN_PLAN.md
Has UI: [Yes/No]

Files to create: N
Files to modify: M
Database changes: [Yes/No]
API endpoints: K

Next step:
  → @02_interface.md (if UI)
  → @03_implement.md (if no UI)

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Be precise** - Specific file paths, specific functions
2. **No code in plan** - Describe what to do, not how to code it
3. **Check existing patterns** - Match project conventions
4. **No mock data** - Plan for real data from start
5. **Consider phases** - Only for large features
6. **Note dependencies** - Both external and internal

## Output Files

| File | Purpose |
|------|---------|
| `docs/features/NNNN_PLAN.md` | Technical implementation plan |

## Next Agent

→ `@02_interface.md` - If feature has UI components  
→ `@03_implement.md` - If feature has no UI
