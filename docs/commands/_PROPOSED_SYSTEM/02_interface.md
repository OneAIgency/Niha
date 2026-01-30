# Agent 02: Interface & UI Specification

> **Purpose**: Create UI/UX specifications and maintain design system consistency.

## When to Use

- Feature plan indicates UI components needed
- Creating new UI components or pages
- Design system updates or audits
- Called by orchestrators when `Has UI = Yes`

## Usage

```bash
@02_interface.md @docs/features/NNNN_PLAN.md
```

**Example:**
```bash
@02_interface.md @docs/features/0014_PLAN.md
```

## Prerequisites

- Feature plan exists (`docs/features/NNNN_PLAN.md`)
- `app_truth.md` exists with §9 UI/UX standards
- Design token system set up (or will be created)

## Instructions for AI Agent

### Step 1: Review Context

1. **Read the plan** - Understand what UI is needed
2. **Check `app_truth.md` §9** - UI/UX standards
3. **Check `docs/DESIGN_SYSTEM.md`** - If exists, review existing patterns
4. **Check `src/theme/tokens.ts`** - Available design tokens

### Step 2: Identify UI Components

From the plan, list:

1. **Pages** - New pages/routes needed
2. **Components** - Reusable components
3. **Layouts** - Layout changes
4. **Modals/Dialogs** - Overlay components
5. **Forms** - Input forms
6. **Data Display** - Tables, lists, cards

### Step 3: Check Existing Components

Before designing new components:

1. **Search for similar components** in codebase
2. **Check component library** (`src/components/common/` or similar)
3. **Note reusable patterns** - Don't reinvent

### Step 4: Create UI Specification

Write to: `docs/features/NNNN_UI_SPEC.md`

```markdown
# UI Specification: [Feature Name]

> **Plan**: NNNN_PLAN.md
> **Created**: [Date]

## Overview

[Brief description of the UI being created]

## Design System Compliance

### Tokens Used

| Category | Token | Value | Usage |
|----------|-------|-------|-------|
| Color | `--color-primary` | [value] | Primary actions |
| Color | `--color-surface` | [value] | Card backgrounds |
| Spacing | `--space-4` | 1rem | Component padding |
| Radius | `--radius-xl` | 1rem | Button corners |

### New Tokens Required

[If any - these must be added to tokens.ts first]

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-new-thing` | #xxx | [Why needed] |

## Pages

### [Page Name]

**Route**: `/path/to/page`

**Layout**:
```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────┐ │
│ │ Sidebar │ │ Main Content        │ │
│ │         │ │                     │ │
│ │         │ │ ┌─────────────────┐ │ │
│ │         │ │ │ Component A     │ │ │
│ │         │ │ └─────────────────┘ │ │
│ │         │ │                     │ │
│ │         │ │ ┌─────────────────┐ │ │
│ │         │ │ │ Component B     │ │ │
│ │         │ │ └─────────────────┘ │ │
│ └─────────┘ └─────────────────────┘ │
└─────────────────────────────────────┘
```

**Behavior**:
- [Interaction 1]
- [Interaction 2]

**States**:
- Loading: [Description]
- Empty: [Description]
- Error: [Description]
- Success: [Description]

## Components

### [Component Name]

**Purpose**: [What it does]

**Location**: `src/components/[path]/[ComponentName].tsx`

**Props**:
```typescript
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}
```

**Variants**:
- Default: [Description]
- Active: [Description]
- Disabled: [Description]

**Responsive Behavior**:
- Mobile (< 640px): [Behavior]
- Tablet (640-1024px): [Behavior]
- Desktop (> 1024px): [Behavior]

**Accessibility**:
- Role: [ARIA role]
- Keyboard: [Key interactions]
- Screen reader: [Announcements]

**Example Usage**:
```tsx
<ComponentName
  prop1="value"
  onAction={() => handleAction()}
/>
```

### [Another Component]

[Same structure...]

## Forms

### [Form Name]

**Fields**:

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| email | email | Valid email format | Yes |
| amount | number | > 0, max 2 decimals | Yes |

**Submission**:
- Endpoint: `POST /api/v1/...`
- Success: [What happens]
- Error: [How errors display]

**States**:
- Initial: Empty form
- Validating: Inline validation
- Submitting: Button disabled, loading spinner
- Success: Success message, redirect/close
- Error: Error message, form still editable

## Modals/Dialogs

### [Modal Name]

**Trigger**: [What opens it]

**Content**:
- [Element 1]
- [Element 2]

**Actions**:
- Primary: [Button label] → [Action]
- Secondary: [Button label] → [Action]
- Close: Click outside, X button, Escape key

## Data Display

### [Table/List Name]

**Columns/Fields**:

| Column | Source | Format | Sortable |
|--------|--------|--------|----------|
| Name | `data.name` | Text | Yes |
| Amount | `data.amount` | Currency (€) | Yes |
| Date | `data.created_at` | Relative time | Yes |

**Interactions**:
- Row click: [Action]
- Hover: [Visual change]

**Empty State**:
- Message: "[No items message]"
- Action: [Optional CTA]

## Animations

### Transitions

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Modal | Open | Fade + scale | 200ms |
| Card | Hover | Elevation | 150ms |
| Button | Click | Scale down | 100ms |

## Theme Support

All components must support:
- [ ] Light mode
- [ ] Dark mode

Color mappings:
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `--color-surface` | `--color-surface` |
| Text | `--color-text-primary` | `--color-text-primary` |
| Border | `--color-border` | `--color-border` |

## Implementation Notes

### Existing Components to Use

- `Button` from `src/components/common/Button`
- `Card` from `src/components/common/Card`
- [Others...]

### New Components to Create

1. `ComponentA` - [Brief purpose]
2. `ComponentB` - [Brief purpose]

### Styling Approach

- Use Tailwind utility classes
- Use design tokens via CSS variables
- No hard-coded colors or spacing

---

## Checklist Before Implementation

- [ ] All components use design tokens
- [ ] Dark mode considered for all elements
- [ ] Responsive breakpoints defined
- [ ] Accessibility requirements noted
- [ ] Loading/empty/error states defined
- [ ] Animations specified
```

### Step 5: Check Design Token Needs

If new tokens are required:

```
⚠️ New design tokens needed:

The following tokens must be added before implementation:
- --color-new-thing: [value]
- --space-new: [value]

Run @07_theme.md to add these tokens first.
```

### Step 6: Output Summary

```
═══════════════════════════════════════════════════════════════
                   UI SPECIFICATION COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
UI Spec: docs/features/NNNN_UI_SPEC.md

Components:
  Pages: N
  Components: M
  Modals: K
  Forms: L

New tokens required: [Yes/No]
Existing components reused: [List]

Next step:
  → @07_theme.md (if new tokens needed)
  → @03_implement.md (if no new tokens)

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Use design tokens** - Never hard-code colors/spacing in spec
2. **Reuse existing components** - Check before creating new
3. **Consider all states** - Loading, empty, error, success
4. **Accessibility first** - ARIA, keyboard, screen readers
5. **Responsive required** - Mobile, tablet, desktop
6. **Both themes** - Light and dark mode support

## Output Files

| File | Purpose |
|------|---------|
| `docs/features/NNNN_UI_SPEC.md` | UI/UX specification |

## Next Agent

→ `@07_theme.md` - If new tokens needed  
→ `@03_implement.md` - If ready to implement
