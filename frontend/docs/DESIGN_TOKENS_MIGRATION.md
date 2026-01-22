# Design Tokens Migration Guide

## Color Migration: Slate to Navy

| Old (Slate) | New (Navy) | Usage |
|-------------|------------|-------|
| `slate-950` | `navy-900` | Darkest backgrounds |
| `slate-900` | `navy-800` | Dark backgrounds |
| `slate-800` | `navy-700` | Medium-dark backgrounds |
| `slate-700` | `navy-600` | Dark borders, hover states |
| `slate-600` | `navy-500` | Medium text |
| `slate-500` | `navy-400` | Secondary text |
| `slate-400` | `navy-400` | Muted text |
| `slate-300` | `navy-300` | Light borders |
| `slate-200` | `navy-200` | Very light borders |
| `slate-100` | `navy-100` | Light backgrounds |
| `slate-50` | `navy-50` | Lightest backgrounds |

## Find & Replace Script

```bash
# Find all slate colors in your files
grep -r "slate-" src/

# Replace in a specific file
sed -i '' 's/slate-950/navy-900/g' src/pages/YourPage.tsx
sed -i '' 's/slate-900/navy-800/g' src/pages/YourPage.tsx
sed -i '' 's/slate-800/navy-700/g' src/pages/YourPage.tsx
sed -i '' 's/slate-700/navy-600/g' src/pages/YourPage.tsx
sed -i '' 's/slate-600/navy-500/g' src/pages/YourPage.tsx
sed -i '' 's/slate-500/navy-400/g' src/pages/YourPage.tsx
sed -i '' 's/slate-400/navy-400/g' src/pages/YourPage.tsx
sed -i '' 's/slate-300/navy-300/g' src/pages/YourPage.tsx
sed -i '' 's/slate-200/navy-200/g' src/pages/YourPage.tsx
sed -i '' 's/slate-100/navy-100/g' src/pages/YourPage.tsx
sed -i '' 's/slate-50/navy-50/g' src/pages/YourPage.tsx
```

## Hardcoded RGB to CSS Variables

### Before (Hardcoded):
```tsx
<path
  fill="rgba(34, 197, 94, 0.2)"
  stroke="rgb(34, 197, 94)"
/>
<path
  fill="rgba(239, 68, 68, 0.2)"
  stroke="rgb(239, 68, 68)"
/>
```

### After (CSS Variables):
```tsx
<path
  fill="var(--color-bid-bg)"
  stroke="var(--color-bid)"
/>
<path
  fill="var(--color-ask-bg)"
  stroke="var(--color-ask)"
/>
```

## Available CSS Variables

### Backgrounds
```css
--color-background      /* Main page background */
--color-surface         /* Card/panel surface */
--color-elevated        /* Elevated elements */
--color-muted           /* Muted backgrounds */
```

### Text
```css
--color-text-primary    /* Main text */
--color-text-secondary  /* Secondary text */
--color-text-muted      /* Muted text */
--color-text-inverse    /* Inverse (light on dark) */
```

### Brand
```css
--color-primary         /* Emerald-500/400 */
--color-primary-hover   /* Emerald-600/500 */
--color-primary-active  /* Emerald-700/600 */
```

### Trading
```css
--color-bid             /* Buy orders - emerald */
--color-bid-bg          /* Buy background - emerald/20 */
--color-ask             /* Sell orders - red */
--color-ask-bg          /* Sell background - red/20 */
```

### Certificates
```css
--color-eua             /* EUA - blue */
--color-eua-bg          /* EUA background - blue/20 */
--color-cea             /* CEA - amber */
--color-cea-bg          /* CEA background - amber/20 */
```

### Status
```css
--color-success
--color-warning
--color-error
--color-info
```

## Migration Examples

### Example 1: Page Background

**Before:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
```

**After:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
```

### Example 2: Card Component

**Before:**
```tsx
<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
  <h3 className="text-slate-900 dark:text-white">Title</h3>
  <p className="text-slate-600 dark:text-slate-400">Content</p>
</div>
```

**After:**
```tsx
<div className="rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6">
  <h3 className="text-navy-900 dark:text-white">Title</h3>
  <p className="text-navy-600 dark:text-navy-400">Content</p>
</div>
```

### Example 3: SVG Chart

**Before:**
```tsx
<svg>
  <rect fill="#22c55e" />
  <path stroke="rgb(239, 68, 68)" />
</svg>
```

**After:**
```tsx
<svg>
  <rect fill="var(--color-bid)" />
  <path stroke="var(--color-ask)" />
</svg>
```

## Verification

After migration, verify:

```bash
# Check for any remaining slate colors
grep -r "slate-" src/

# Check for hardcoded colors
grep -r "rgb(" src/
grep -r "#[0-9a-fA-F]\{6\}" src/

# Run ESLint
npm run lint

# Run pre-commit hook
npm run check-design-system
```

## Common Issues

### Issue 1: Dark mode not working
**Problem:** Colors look wrong in dark mode
**Solution:** Ensure all color classes have `dark:` variants

### Issue 2: Charts not theme-aware
**Problem:** Charts don't change color in dark mode
**Solution:** Use CSS variables instead of hardcoded colors

### Issue 3: Inconsistent spacing
**Problem:** Components use off-scale spacing (p-7, gap-5, etc.)
**Solution:** Use standard scale (p-4, p-6, p-8, gap-4, gap-6, etc.)

## Help & Resources

- **Full Documentation:** `docs/DESIGN_SYSTEM.md`
- **Quick Reference:** `docs/STYLING_STANDARDS.md`
- **Developer Guidelines:** `.claude/claude.md`
- **Live Examples:** `http://localhost:5173/design-system`
- **Design Tokens Source:** `src/styles/design-tokens.css`
