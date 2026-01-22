# Design System Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize the entire Niha Carbon Platform to use the design system consistently, ensuring all new implementations and modifications follow standardized patterns.

**Architecture:** Replace all inconsistent color usage (slate → navy), eliminate hardcoded colors, create comprehensive developer guidelines in `.claude/claude.md`, and establish automated enforcement through linting.

**Tech Stack:** React, TypeScript, Tailwind CSS, CSS Variables, ESLint, PostCSS

**Critical Issues Found:**
- 13 pages use `slate-*` instead of standardized `navy-*` colors
- 2 chart components use hardcoded RGB colors
- 12 out-of-system colors scattered across codebase
- No developer guidelines for design system enforcement
- No automated linting for color consistency

---

## Task 1: Create Developer Guidelines in Claude.md

**Files:**
- Create: `.claude/claude.md`

**Goal:** Establish the single source of truth for all styling standards that will be enforced in every new implementation.

### Step 1: Create .claude directory

```bash
mkdir -p .claude
```

### Step 2: Create comprehensive claude.md

Create `.claude/claude.md` with complete design system guidelines:

```markdown
# Niha Carbon Platform - Development Guidelines

## Design System Enforcement

**CRITICAL:** All styling MUST follow the standardized design system defined in:
- Design Tokens: `/src/styles/design-tokens.css`
- Documentation: `/docs/DESIGN_SYSTEM.md`
- Live Reference: http://localhost:5173/design-system

### Mandatory Styling Rules

#### Rule 1: Color System - Navy + Emerald ONLY

✅ **ALWAYS USE:**
```tsx
// Navy palette for backgrounds/text
className="bg-white dark:bg-navy-800"
className="text-navy-900 dark:text-white"
className="border-navy-200 dark:border-navy-700"

// Emerald for brand/primary actions
className="bg-emerald-500 hover:bg-emerald-600"
className="text-emerald-600 dark:text-emerald-400"

// Trading colors
className="text-bid"  // or text-emerald-600 dark:text-emerald-400
className="text-ask"  // or text-red-600 dark:text-red-400

// Certificate colors
className="text-eua"  // or text-blue-600 dark:text-blue-400
className="text-cea"  // or text-amber-600 dark:text-amber-400
```

❌ **NEVER USE:**
```tsx
// Wrong - slate colors
className="bg-slate-950"
className="text-slate-600"

// Wrong - hardcoded colors
style={{ color: '#10b981' }}
style={{ backgroundColor: 'rgb(16, 185, 129)' }}

// Wrong - out-of-system colors
className="bg-purple-500"
className="text-pink-600"
```

#### Rule 2: CSS Variables for Dynamic Theming

✅ **USE CSS VARIABLES WHEN:**
- Implementing custom components
- Need theme-aware colors
- Building reusable utilities

```tsx
style={{ backgroundColor: 'var(--color-surface)' }}
style={{ color: 'var(--color-text-primary)' }}
```

#### Rule 3: Inline Styles - Only for Dynamic Values

✅ **ACCEPTABLE:**
```tsx
<div style={{ width: `${percentage}%` }} />
<div style={{ height: calculatedHeight }} />
<div style={{ transform: `translateX(${offset}px)` }} />
```

❌ **NOT ACCEPTABLE:**
```tsx
<div style={{ backgroundColor: '#f5f5f5' }} />
<div style={{ padding: '16px' }} />
<div style={{ borderRadius: '8px' }} />
```

#### Rule 4: Dark Mode Support - MANDATORY

Every component MUST support dark mode:

✅ **CORRECT:**
```tsx
<div className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white">
  <p className="text-navy-600 dark:text-navy-400">Secondary text</p>
</div>
```

❌ **WRONG:**
```tsx
<div className="bg-white text-black">  {/* No dark mode */}
  <p className="text-gray-600">Secondary text</p>
</div>
```

### Component Patterns

#### Buttons

```tsx
// Primary button
<button className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl">
  Primary Action
</button>

// Secondary button
<button className="rounded-xl bg-navy-900 dark:bg-navy-700 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-navy-800 dark:hover:bg-navy-600 hover:shadow-lg">
  Secondary Action
</button>
```

#### Cards

```tsx
<div className="rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-lg transition-all hover:shadow-xl">
  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Title</h3>
  <p className="mt-2 text-sm text-navy-600 dark:text-navy-400">Content</p>
</div>
```

#### Inputs

```tsx
<input
  type="text"
  className="w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-3 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
/>
```

#### Trading UI

```tsx
// Bid row (buy order)
<div className="rounded-lg p-3 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
  <span className="text-emerald-600 dark:text-emerald-400">€99.50</span>
</div>

// Ask row (sell order)
<div className="rounded-lg p-3 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">
  <span className="text-red-600 dark:text-red-400">€99.55</span>
</div>
```

### Spacing System

Use the 4px-based spacing scale:

```tsx
// Card padding
<div className="p-4">Small</div>
<div className="p-6">Medium (default)</div>
<div className="p-8">Large</div>

// Gaps
<div className="flex gap-2">Tight</div>
<div className="flex gap-4">Normal</div>
<div className="flex gap-6">Comfortable</div>

// Section spacing
<section className="py-8 md:py-10">Content</section>
```

### Border Radius

```tsx
<button className="rounded-xl">Buttons, inputs (16px)</button>
<div className="rounded-2xl">Cards, modals (24px)</div>
<span className="rounded-full">Badges, pills (circular)</span>
```

### Typography

```tsx
// Font families
<p className="font-sans">Body text (Inter)</p>
<p className="font-mono">Numbers (JetBrains Mono)</p>

// Font sizes
<h1 className="text-3xl font-bold">Page title</h1>
<h2 className="text-xl font-bold">Section heading</h2>
<p className="text-base">Body text</p>
<span className="text-sm">Secondary text</span>
<span className="text-xs">Labels, captions</span>

// Numeric values (always use monospace)
<span className="font-mono text-lg font-semibold">€1,234.56</span>
```

### Pre-Commit Checklist

Before committing ANY styling changes:

- [ ] All colors use navy/emerald palette (no slate/purple/pink)
- [ ] Dark mode support added with `dark:` prefix
- [ ] No hardcoded hex/RGB colors (except for calculated values)
- [ ] Spacing uses design tokens (p-4, gap-6, etc.)
- [ ] Border radius uses standard values (rounded-xl, rounded-2xl)
- [ ] Typography uses design system scale
- [ ] Tested in both light AND dark mode
- [ ] Referenced design system page for patterns

### Common Mistakes to Avoid

❌ **Mistake 1: Using Slate Colors**
```tsx
// Wrong
className="bg-slate-900"

// Correct
className="bg-navy-900"
```

❌ **Mistake 2: Hardcoded Colors in Charts**
```tsx
// Wrong
stroke="rgb(34, 197, 94)"

// Correct
stroke="currentColor" className="text-emerald-500"
// or
stroke="var(--color-bid)"
```

❌ **Mistake 3: Missing Dark Mode**
```tsx
// Wrong
className="bg-white text-black"

// Correct
className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
```

❌ **Mistake 4: Inconsistent Spacing**
```tsx
// Wrong
className="p-5"  // 20px - not in our scale

// Correct
className="p-4"  // 16px
className="p-6"  // 24px
```

### Resources

- **Design System Reference:** http://localhost:5173/design-system
- **Documentation:** `/docs/DESIGN_SYSTEM.md`
- **Design Tokens:** `/src/styles/design-tokens.css`
- **Component Examples:** `/src/components/common/`

### Code Review Checklist

When reviewing PRs, check:

1. ✅ Colors match design system (navy + emerald)
2. ✅ Dark mode implemented correctly
3. ✅ Spacing uses standard scale
4. ✅ Typography uses design system
5. ✅ No hardcoded colors
6. ✅ Border radius uses standard values
7. ✅ Animations use defined patterns
8. ✅ Tested in both themes

### Adding New Colors

If you need a color not in the design system:

1. **DON'T** add it directly to components
2. **DO** propose it to design team first
3. **DO** add to design-tokens.css if approved
4. **DO** update DESIGN_SYSTEM.md documentation
5. **DO** add to DesignSystemPage.tsx showcase
6. **DO** create PR for review

### Performance Guidelines

- Prefer Tailwind classes over inline styles (99% of cases)
- Use CSS variables only when theme-aware colors are needed
- Avoid inline styles for static values
- Use `transition-*` classes for animations
- Leverage Tailwind's JIT compilation

---

## When Building New Features

### Step 1: Check Design System First
Visit http://localhost:5173/design-system and find the pattern you need.

### Step 2: Copy Pattern
Use the exact code from the design system page.

### Step 3: Adapt for Your Use Case
Modify content, not styling structure.

### Step 4: Test Both Themes
Always test light AND dark mode.

### Step 5: Review Against Checklist
Use the pre-commit checklist above.

---

## Emergency Contact

If you're unsure about styling decisions:
1. Check `/docs/DESIGN_SYSTEM.md` first
2. Look at similar components in `/src/components/common/`
3. Visit the design system page: http://localhost:5173/design-system
4. Ask in #design-system Slack channel (if applicable)

---

**Last Updated:** 2026-01-22
**Version:** 1.0.0
```

### Step 3: Verify file creation

```bash
cat .claude/claude.md | head -20
```

Expected: File created with guidelines content

### Step 4: Commit

```bash
git add .claude/claude.md
git commit -m "docs: Add comprehensive design system guidelines to claude.md

- Establish mandatory styling rules (navy + emerald only)
- Define component patterns for buttons, cards, inputs, trading UI
- Add pre-commit checklist
- Document common mistakes and how to avoid them
- Create code review checklist
- Add process for proposing new colors

This becomes the single source of truth for all styling decisions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Additional Documentation Files

**Files:**
- Create: `docs/STYLING_STANDARDS.md`
- Create: `docs/DESIGN_TOKENS_MIGRATION.md`

### Step 1: Create STYLING_STANDARDS.md

Create `docs/STYLING_STANDARDS.md`:

```markdown
# Styling Standards - Niha Carbon Platform

Quick reference for developers working on the platform.

## TL;DR

- Use `navy-*` for backgrounds/text (NOT slate)
- Use `emerald-*` for primary brand (NOT teal/green)
- Use design tokens from `/src/styles/design-tokens.css`
- Always support dark mode with `dark:` prefix
- Check design system first: http://localhost:5173/design-system

## Color Palette

### Primary Colors
- **Navy:** `navy-50` through `navy-950` (backgrounds, text, borders)
- **Emerald:** `emerald-400` through `emerald-700` (brand, primary actions)

### Trading Colors
- **Bid/Buy:** `emerald-*` (green)
- **Ask/Sell:** `red-*` (red)

### Certificate Colors
- **EUA:** `blue-*`
- **CEA:** `amber-*`

### Status Colors
- **Success:** `emerald-*`
- **Warning:** `amber-*`
- **Error:** `red-*`
- **Info:** `blue-*`

## Do's and Don'ts

### ✅ DO

```tsx
// Use navy palette
<div className="bg-navy-900 text-white">

// Support dark mode
<div className="bg-white dark:bg-navy-800">

// Use CSS variables for theme-aware colors
<div style={{ backgroundColor: 'var(--color-surface)' }}>

// Use design token classes
<div className="bg-surface text-primary">
```

### ❌ DON'T

```tsx
// Don't use slate
<div className="bg-slate-900">

// Don't hardcode colors
<div style={{ color: '#10b981' }}>

// Don't forget dark mode
<div className="bg-white text-black">

// Don't use arbitrary values
<div className="p-[17px]">
```

## Component Quick Reference

See `/src/components/common/` for examples of:
- Button.tsx - All button variants
- Card.tsx - All card styles
- Input.tsx - All input states
- Badge.tsx - All badge types
- Tabs.tsx - All tab styles

## Migration Guide

See `DESIGN_TOKENS_MIGRATION.md` for step-by-step migration from old patterns.

## Resources

- Live Reference: http://localhost:5173/design-system
- Full Documentation: `/docs/DESIGN_SYSTEM.md`
- Claude Guidelines: `/.claude/claude.md`
```

### Step 2: Create DESIGN_TOKENS_MIGRATION.md

Create `docs/DESIGN_TOKENS_MIGRATION.md`:

```markdown
# Design Tokens Migration Guide

## Overview

This guide helps migrate existing components to use the standardized design system.

## Quick Migration Steps

### 1. Find All Instances

Search for problematic patterns:

```bash
# Find slate colors
grep -r "slate-" src/

# Find hardcoded hex colors
grep -r "#[0-9a-fA-F]\{6\}" src/ --include="*.tsx" --include="*.ts"

# Find RGB colors
grep -r "rgb(" src/ --include="*.tsx" --include="*.ts"
```

### 2. Replace Slate with Navy

**Find:**
```tsx
className="bg-slate-950"
className="text-slate-600"
className="border-slate-700"
```

**Replace with:**
```tsx
className="bg-navy-900"
className="text-navy-600"
className="border-navy-700"
```

### 3. Replace Hardcoded Colors

**Find:**
```tsx
style={{ backgroundColor: '#10b981' }}
style={{ color: 'rgb(16, 185, 129)' }}
```

**Replace with:**
```tsx
className="bg-emerald-500"
style={{ backgroundColor: 'var(--color-primary)' }}
```

### 4. Add Dark Mode Support

**Before:**
```tsx
<div className="bg-white text-black">
  <p className="text-gray-600">Text</p>
</div>
```

**After:**
```tsx
<div className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white">
  <p className="text-navy-600 dark:text-navy-400">Text</p>
</div>
```

## Component-Specific Migrations

### Login Page

**Before (LoginPage.tsx):**
```tsx
className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
```

**After:**
```tsx
className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900"
```

### Charts (DepthChart.tsx)

**Before:**
```tsx
<path
  fill="rgba(34, 197, 94, 0.2)"
  stroke="rgb(34, 197, 94)"
/>
```

**After:**
```tsx
<path
  fill="currentColor"
  stroke="currentColor"
  className="text-emerald-500 fill-emerald-500/20"
/>
```

Or use CSS variables:
```tsx
<path
  fill="var(--color-bid-bg)"
  stroke="var(--color-bid)"
/>
```

## Testing After Migration

### Checklist

- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] Colors match design system reference
- [ ] No console errors
- [ ] Hover states work correctly
- [ ] Focus states visible
- [ ] Animations smooth
- [ ] Accessible (contrast ratios)

### Visual Regression Testing

1. Take screenshot before migration
2. Apply migration
3. Take screenshot after migration
4. Compare side-by-side
5. Verify colors match design system

## Common Issues

### Issue 1: Chart Colors Not Updating

**Problem:** SVG elements with hardcoded RGB colors

**Solution:** Use CSS variables or className with currentColor

### Issue 2: Dark Mode Not Working

**Problem:** Missing `dark:` prefix

**Solution:** Add dark variant for every color class

### Issue 3: Text Invisible in Dark Mode

**Problem:** Black text on dark background

**Solution:** Always use `text-navy-900 dark:text-white` pattern

## Automated Migration

### Find-Replace Script

Create `scripts/migrate-colors.sh`:

```bash
#!/bin/bash

# Replace slate with navy
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/slate-50/navy-50/g' {} +
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/slate-100/navy-100/g' {} +
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/slate-200/navy-200/g' {} +
# ... continue for all slate variants

echo "Migration complete. Review changes with: git diff"
```

**WARNING:** Always review automated changes carefully!

## Verification

After migrating a component:

1. Open http://localhost:5173/design-system
2. Compare your component colors with reference
3. Toggle dark mode (moon icon in top right)
4. Verify all colors match design system

## Need Help?

- Check design system: http://localhost:5173/design-system
- Read full docs: `/docs/DESIGN_SYSTEM.md`
- Review examples: `/src/components/common/`
- Consult Claude guidelines: `/.claude/claude.md`
```

### Step 3: Verify files created

```bash
ls -la docs/STYLING_STANDARDS.md docs/DESIGN_TOKENS_MIGRATION.md
```

Expected: Both files exist

### Step 4: Commit

```bash
git add docs/STYLING_STANDARDS.md docs/DESIGN_TOKENS_MIGRATION.md
git commit -m "docs: Add styling standards and migration guide

STYLING_STANDARDS.md:
- Quick reference for developers
- Do's and don'ts with examples
- Component quick reference
- Color palette summary

DESIGN_TOKENS_MIGRATION.md:
- Step-by-step migration guide
- Find-replace patterns
- Component-specific migrations
- Testing checklist
- Common issues and solutions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Fix Critical Color Inconsistencies - LoginPage

**Files:**
- Modify: `src/pages/LoginPage.tsx`

**Goal:** Replace all `slate-*` colors with `navy-*` to match design system.

### Step 1: Read current LoginPage

```bash
head -100 src/pages/LoginPage.tsx
```

### Step 2: Create backup

```bash
cp src/pages/LoginPage.tsx src/pages/LoginPage.tsx.backup
```

### Step 3: Replace slate with navy

Find and replace in `LoginPage.tsx`:

```tsx
// Find: slate-950
// Replace with: navy-900

// Find: slate-900
// Replace with: navy-800

// Find: slate-800
// Replace with: navy-700

// Find: slate-700
// Replace with: navy-600

// Find: slate-600
// Replace with: navy-500
```

Specifically update these patterns:

**Background gradient:**
```tsx
// Before:
className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"

// After:
className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900"
```

**Card backgrounds:**
```tsx
// Before:
className="bg-slate-900/50"

// After:
className="bg-navy-800/50"
```

**Text colors:**
```tsx
// Before:
className="text-slate-400"

// After:
className="text-navy-400"
```

### Step 4: Test the page

```bash
npm run dev
```

Open http://localhost:5173/login

Visual checks:
- [ ] Background gradient displays correctly
- [ ] Card is visible and readable
- [ ] Text contrast is sufficient
- [ ] Buttons render properly
- [ ] Input fields are styled correctly

### Step 5: Commit

```bash
git add src/pages/LoginPage.tsx
git commit -m "fix: Replace slate colors with navy in LoginPage

- Change slate-950 → navy-900 (background)
- Change slate-900 → navy-800 (cards, overlays)
- Change slate-800 → navy-700 (elevated elements)
- Change slate-600 → navy-500 (borders, muted text)

This aligns LoginPage with the standardized design system.

Fixes: Design system color consistency
Related: DESIGN_SYSTEM.md, .claude/claude.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Fix Critical Color Inconsistencies - OnboardingPage

**Files:**
- Modify: `src/pages/OnboardingPage.tsx`

### Step 1: Read current file

```bash
grep -n "slate-" src/pages/OnboardingPage.tsx
```

### Step 2: Replace all slate colors

Apply same replacements as LoginPage:
- `slate-950` → `navy-900`
- `slate-900` → `navy-800`
- `slate-800` → `navy-700`
- `slate-700` → `navy-600`
- `slate-600` → `navy-500`
- `slate-500` → `navy-400`
- `slate-400` → `navy-300`

### Step 3: Test the page

```bash
npm run dev
```

Open http://localhost:5173/onboarding

Check:
- [ ] Layout renders correctly
- [ ] Text is readable in both modes
- [ ] Navigation works
- [ ] Cards display properly

### Step 4: Commit

```bash
git add src/pages/OnboardingPage.tsx
git commit -m "fix: Replace slate colors with navy in OnboardingPage

Standardize onboarding page to use navy palette consistently.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Fix Critical Color Inconsistencies - LandingPage

**Files:**
- Modify: `src/pages/LandingPage.tsx`

### Step 1: Identify slate usage

```bash
grep -n "slate-" src/pages/LandingPage.tsx
```

### Step 2: Replace with navy equivalents

Same pattern as previous tasks.

### Step 3: Test

Visual verification in both light and dark modes.

### Step 4: Commit

```bash
git add src/pages/LandingPage.tsx
git commit -m "fix: Replace slate colors with navy in LandingPage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Fix Remaining Pages with Slate Colors

**Files:**
- Modify: `src/pages/Onboarding1Page.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/pages/SwapPage.tsx`
- Modify: `src/pages/LearnMorePage.tsx`
- Modify: `src/pages/ContactPage.tsx`
- Modify: `src/pages/ComponentShowcasePage.tsx`

### Step 1: Batch find-replace

For each file, run:

```bash
# Find all slate usage
grep -n "slate-" src/pages/[PageName].tsx

# Apply replacements (same pattern)
```

### Step 2: Test each page individually

Navigate to each page and verify:
- Colors match design system
- Dark mode works correctly
- No visual regressions

### Step 3: Commit per page

```bash
git add src/pages/[PageName].tsx
git commit -m "fix: Replace slate colors with navy in [PageName]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Fix Chart Hardcoded Colors - DepthChart

**Files:**
- Modify: `src/components/cash-market/DepthChart.tsx`

**Goal:** Replace hardcoded RGB colors with CSS variables or Tailwind classes.

### Step 1: Read current implementation

```bash
grep -n "rgb(" src/components/cash-market/DepthChart.tsx
```

### Step 2: Replace hardcoded colors

**Current (lines ~128-141):**
```tsx
<path
  d={chartData.bidPath}
  fill="rgba(34, 197, 94, 0.2)"
  stroke="rgb(34, 197, 94)"
  strokeWidth="0.5"
/>

<path
  d={chartData.askPath}
  fill="rgba(239, 68, 68, 0.2)"
  stroke="rgb(239, 68, 68)"
  strokeWidth="0.5"
/>
```

**Replace with CSS variables:**
```tsx
<path
  d={chartData.bidPath}
  fill="var(--color-bid-bg)"
  stroke="var(--color-bid)"
  strokeWidth="0.5"
/>

<path
  d={chartData.askPath}
  fill="var(--color-ask-bg)"
  stroke="var(--color-ask)"
  strokeWidth="0.5"
/>
```

### Step 3: Test the chart

```bash
npm run dev
```

Navigate to cash market page and verify:
- [ ] Bid area renders in green
- [ ] Ask area renders in red
- [ ] Colors change with theme toggle
- [ ] Chart remains functional

### Step 4: Commit

```bash
git add src/components/cash-market/DepthChart.tsx
git commit -m "fix: Replace hardcoded RGB colors with CSS variables in DepthChart

Before: rgb(34, 197, 94) and rgb(239, 68, 68)
After: var(--color-bid) and var(--color-ask)

This makes the chart theme-aware and consistent with design system.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Fix Chart Hardcoded Colors - MarketDepthChart

**Files:**
- Modify: `src/components/cash-market/MarketDepthChart.tsx`

### Step 1: Identify hardcoded colors

```bash
grep -n "rgb(" src/components/cash-market/MarketDepthChart.tsx
```

### Step 2: Replace with CSS variables

Apply same pattern as DepthChart:
- `rgb(16, 185, 129)` → `var(--color-bid)`
- `rgba(16, 185, 129, 0.2)` → `var(--color-bid-bg)`
- `rgb(239, 68, 68)` → `var(--color-ask)`
- `rgba(239, 68, 68, 0.2)` → `var(--color-ask-bg)`

### Step 3: Test

Verify chart renders correctly in both themes.

### Step 4: Commit

```bash
git add src/components/cash-market/MarketDepthChart.tsx
git commit -m "fix: Replace hardcoded RGB colors with CSS variables in MarketDepthChart

Makes chart colors theme-aware and design system compliant.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create ESLint Rule for Color Enforcement

**Files:**
- Modify: `.eslintrc.cjs`
- Create: `eslint-rules/no-hardcoded-colors.js` (if custom rule needed)

### Step 1: Update ESLint configuration

Add rule to prevent hardcoded colors:

```javascript
// .eslintrc.cjs
module.exports = {
  // ... existing config
  rules: {
    // ... existing rules

    // Prevent hardcoded colors
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
        message: 'Hardcoded hex colors are not allowed. Use design tokens or Tailwind classes instead.'
      },
      {
        selector: 'CallExpression[callee.name="rgb"]',
        message: 'rgb() colors are not allowed. Use design tokens or Tailwind classes instead.'
      },
      {
        selector: 'CallExpression[callee.name="rgba"]',
        message: 'rgba() colors are not allowed. Use design tokens or Tailwind classes instead.'
      },
      {
        selector: 'Literal[value=/slate-/]',
        message: 'slate-* colors are not allowed. Use navy-* from the design system instead.'
      }
    ]
  }
}
```

### Step 2: Test the rule

```bash
npm run lint
```

Expected: Should flag any remaining hardcoded colors

### Step 3: Fix any violations

If linter finds issues, fix them before committing.

### Step 4: Commit

```bash
git add .eslintrc.cjs
git commit -m "chore: Add ESLint rules to enforce design system colors

Prevents:
- Hardcoded hex colors
- rgb/rgba color functions
- slate-* color classes

Developers must use navy-* and design tokens instead.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update tailwind.config.js Comments

**Files:**
- Modify: `tailwind.config.js`

### Step 1: Add documentation comments

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  // ...existing config
  theme: {
    extend: {
      colors: {
        // PRIMARY BRAND COLOR - Use for main actions, links
        // Note: Prefer emerald for most brand usage
        primary: {
          50: '#f0f9ff',
          // ... existing primary colors
        },

        // NAVY PALETTE - Main color system (backgrounds, text, borders)
        // ALWAYS use navy-* instead of slate-* or gray-*
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          // ... existing navy colors
          950: '#020617',
        },

        // EMERALD - Primary brand color, buy/bid actions
        // Inherits from Tailwind's emerald palette
        // Use: buttons, links, positive indicators, bid orders
      },

      // ANIMATION SYSTEM - Predefined animations
      // See DESIGN_SYSTEM.md for usage examples
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        // ... existing animations
      }
    }
  }
}
```

### Step 2: Commit

```bash
git add tailwind.config.js
git commit -m "docs: Add comments to tailwind.config.js explaining color system

Clarifies:
- When to use each color palette
- Navy vs slate distinction
- Emerald as primary brand color

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Remove Duplicate tokens.css

**Files:**
- Delete: `src/styles/tokens.css`
- Modify: `src/index.css` (if it imports tokens.css)

### Step 1: Check if tokens.css is imported

```bash
grep -n "tokens.css" src/index.css src/main.tsx
```

### Step 2: Remove import if exists

Remove any line that imports `tokens.css`

### Step 3: Delete the file

```bash
git rm src/styles/tokens.css
```

### Step 4: Test build

```bash
npm run build
```

Expected: No errors, build succeeds

### Step 5: Commit

```bash
git commit -m "refactor: Remove duplicate tokens.css file

design-tokens.css is the single source of truth for design tokens.
The older tokens.css file is redundant and has been removed.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Create Pre-Commit Hook for Design System

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (add husky scripts if not present)

### Step 1: Install husky (if not installed)

```bash
npm install -D husky
npx husky install
```

### Step 2: Create pre-commit hook

```bash
npx husky add .husky/pre-commit "npm run lint"
```

### Step 3: Add design system check script

Add to `package.json`:

```json
{
  "scripts": {
    "check-design-system": "node scripts/check-design-system.js"
  }
}
```

### Step 4: Create check script

Create `scripts/check-design-system.js`:

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🎨 Checking design system compliance...\n');

let errors = 0;

// Check for slate colors
try {
  const slateFiles = execSync(
    'git diff --cached --name-only | xargs grep -l "slate-" 2>/dev/null || true',
    { encoding: 'utf-8' }
  ).trim();

  if (slateFiles) {
    console.error('❌ ERROR: Found slate-* colors in staged files:');
    console.error(slateFiles);
    console.error('   → Use navy-* instead\n');
    errors++;
  }
} catch (e) {
  // No slate colors found - good!
}

// Check for hardcoded hex colors
try {
  const hexFiles = execSync(
    'git diff --cached --name-only | xargs grep -l "#[0-9a-fA-F]\\{6\\}" 2>/dev/null || true',
    { encoding: 'utf-8' }
  ).trim();

  if (hexFiles) {
    console.warn('⚠️  WARNING: Found hardcoded hex colors in staged files:');
    console.warn(hexFiles);
    console.warn('   → Consider using design tokens or Tailwind classes\n');
  }
} catch (e) {
  // No hex colors found
}

// Check for rgb colors
try {
  const rgbFiles = execSync(
    'git diff --cached --name-only | xargs grep -l "rgb(" 2>/dev/null || true',
    { encoding: 'utf-8' }
  ).trim();

  if (rgbFiles) {
    console.warn('⚠️  WARNING: Found rgb() colors in staged files:');
    console.warn(rgbFiles);
    console.warn('   → Consider using design tokens or Tailwind classes\n');
  }
} catch (e) {
  // No rgb colors found
}

if (errors > 0) {
  console.error('\n❌ Design system check FAILED');
  console.error('Fix the errors above and try again.');
  console.error('See .claude/claude.md for styling guidelines.\n');
  process.exit(1);
}

console.log('✅ Design system check passed!\n');
process.exit(0);
```

### Step 5: Test the hook

```bash
# Make a test commit with slate color
echo "className=\"bg-slate-900\"" > test.tsx
git add test.tsx
git commit -m "test"
```

Expected: Hook should prevent commit and show error

### Step 6: Remove test file

```bash
git reset HEAD test.tsx
rm test.tsx
```

### Step 7: Commit

```bash
git add .husky/pre-commit scripts/check-design-system.js package.json
git commit -m "chore: Add pre-commit hook to enforce design system

Checks for:
- slate-* colors (ERROR - blocks commit)
- Hardcoded hex colors (WARNING)
- rgb() colors (WARNING)

Run 'npm run check-design-system' to check manually.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Update README with Design System Info

**Files:**
- Modify: `README.md`

### Step 1: Add Design System section

Add near the top of README:

```markdown
## 🎨 Design System

This project uses a comprehensive design system for consistent styling.

**Quick Links:**
- 📚 [Design System Documentation](docs/DESIGN_SYSTEM.md)
- 🎯 [Live Design System Reference](http://localhost:5173/design-system)
- 📖 [Styling Standards](docs/STYLING_STANDARDS.md)
- 🔧 [Developer Guidelines](.claude/claude.md)

**Key Rules:**
- Use `navy-*` for backgrounds/text (NOT slate)
- Use `emerald-*` for primary brand
- Always support dark mode with `dark:` prefix
- Check design system reference before styling

See `.claude/claude.md` for complete styling guidelines.
```

### Step 2: Update development section

Add to development instructions:

```markdown
### Styling Guidelines

Before writing any styles:

1. Check the design system: http://localhost:5173/design-system
2. Read `.claude/claude.md` for mandatory rules
3. Use design tokens from `src/styles/design-tokens.css`
4. Test in both light AND dark mode

**Pre-commit checks will enforce design system compliance.**
```

### Step 3: Commit

```bash
git add README.md
git commit -m "docs: Add design system information to README

- Link to design system documentation
- Add styling guidelines for developers
- Highlight key rules (navy, not slate)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Final Verification and Testing

**Files:**
- None (testing only)

### Step 1: Run full build

```bash
npm run build
```

Expected: Build succeeds with no errors

### Step 2: Run linter

```bash
npm run lint
```

Expected: No errors (or only acceptable warnings)

### Step 3: Visual testing checklist

Open each page and verify:

**Light Mode:**
- [ ] LoginPage - Navy colors, no slate
- [ ] OnboardingPage - Navy colors, proper gradients
- [ ] LandingPage - Consistent with design system
- [ ] DashboardPage - All components styled correctly
- [ ] Cash Market - Charts use CSS variables
- [ ] Design System Page - Shows all patterns correctly

**Dark Mode:**
(Toggle with theme switcher in header)
- [ ] LoginPage - Dark backgrounds, light text
- [ ] OnboardingPage - Proper contrast
- [ ] LandingPage - Dark theme applied
- [ ] DashboardPage - Cards, tables dark themed
- [ ] Cash Market - Charts visible in dark mode
- [ ] Design System Page - Dark side shows correctly

### Step 4: Browser testing

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if on Mac)

### Step 5: Responsive testing

Check at breakpoints:
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px)
- [ ] Large desktop (1920px)

### Step 6: Document test results

Create `docs/TEST_RESULTS.md`:

```markdown
# Design System Standardization - Test Results

**Date:** 2026-01-22
**Tester:** [Your Name]

## Build & Lint

- ✅ Build succeeds
- ✅ Lint passes
- ✅ No TypeScript errors

## Visual Testing

### Light Mode
- ✅ All pages use navy colors
- ✅ No slate colors visible
- ✅ Charts render correctly
- ✅ Design system page functions

### Dark Mode
- ✅ All pages have dark variants
- ✅ Text contrast is sufficient
- ✅ Charts visible and themed
- ✅ Transitions smooth

## Browser Compatibility
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)

## Responsive Design
- ✅ Mobile (375px)
- ✅ Tablet (768px)
- ✅ Desktop (1024px)

## Design System Compliance
- ✅ No slate-* colors in codebase
- ✅ Charts use CSS variables
- ✅ All components support dark mode
- ✅ Spacing uses design tokens
- ✅ Typography uses design scale

## Issues Found
None

## Conclusion
All standardization tasks completed successfully. Design system is fully enforced.
```

### Step 7: Commit test results

```bash
git add docs/TEST_RESULTS.md
git commit -m "test: Document design system standardization test results

All tests passed:
- Build and lint successful
- Visual testing in light/dark modes
- Browser compatibility verified
- Responsive design confirmed
- Design system fully compliant

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary of Changes

**Files Created (6):**
1. `.claude/claude.md` - Comprehensive developer guidelines
2. `docs/STYLING_STANDARDS.md` - Quick reference
3. `docs/DESIGN_TOKENS_MIGRATION.md` - Migration guide
4. `.husky/pre-commit` - Automated enforcement
5. `scripts/check-design-system.js` - Design system checker
6. `docs/TEST_RESULTS.md` - Verification results

**Files Modified (15+):**
1. `src/pages/LoginPage.tsx` - Slate → Navy
2. `src/pages/OnboardingPage.tsx` - Slate → Navy
3. `src/pages/LandingPage.tsx` - Slate → Navy
4. `src/pages/Onboarding1Page.tsx` - Slate → Navy
5. `src/pages/ProfilePage.tsx` - Slate → Navy
6. `src/pages/SwapPage.tsx` - Slate → Navy
7. `src/pages/LearnMorePage.tsx` - Slate → Navy
8. `src/pages/ContactPage.tsx` - Slate → Navy
9. `src/pages/ComponentShowcasePage.tsx` - Slate → Navy
10. `src/components/cash-market/DepthChart.tsx` - RGB → CSS vars
11. `src/components/cash-market/MarketDepthChart.tsx` - RGB → CSS vars
12. `.eslintrc.cjs` - Add color rules
13. `tailwind.config.js` - Add documentation
14. `package.json` - Add scripts
15. `README.md` - Add design system info

**Files Deleted (1):**
1. `src/styles/tokens.css` - Duplicate removed

---

## Execution Options

Plan complete and saved to `docs/plans/2026-01-22-design-system-standardization.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
