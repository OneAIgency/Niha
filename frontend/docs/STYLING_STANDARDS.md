# Styling Standards Quick Reference

## Color System

### Approved Colors

**Backgrounds & Surfaces:**
```tsx
bg-white dark:bg-navy-800
bg-navy-50 dark:bg-navy-900
bg-navy-100 dark:bg-navy-800
```

**Text Colors:**
```tsx
text-navy-900 dark:text-white
text-navy-600 dark:text-navy-400
text-navy-500 dark:text-navy-500
```

**Brand/Primary:**
```tsx
bg-emerald-500 hover:bg-emerald-600
text-emerald-600 dark:text-emerald-400
```

**Trading:**
```tsx
text-emerald-600 dark:text-emerald-400  // Bid/Buy
text-red-600 dark:text-red-400           // Ask/Sell
```

**Certificates:**
```tsx
text-blue-600 dark:text-blue-400         // EUA
text-amber-600 dark:text-amber-400       // CEA
```

### Never Use

- `slate-*` colors (use `navy-*` instead)
- `gray-*` colors (use `navy-*` instead)
- Hardcoded hex/RGB: `#10b981`, `rgb(16, 185, 129)`
- Inline styles for colors

## CSS Variables for Charts/SVG

```tsx
var(--color-primary)
var(--color-bid)
var(--color-bid-bg)
var(--color-ask)
var(--color-ask-bg)
var(--color-eua)
var(--color-cea)
```

## Typography

```tsx
text-xs      // 12px
text-sm      // 14px
text-base    // 16px
text-lg      // 18px
text-xl      // 20px

font-normal     // 400
font-medium     // 500
font-semibold   // 600
font-bold       // 700
```

## Spacing (4px base)

```tsx
p-4    // 16px - Most common
p-6    // 24px - Cards
p-8    // 32px - Large containers
gap-4  // 16px - Most common
gap-6  // 24px - Larger spacing
```

## Border Radius

```tsx
rounded-xl   // 16px - Buttons, inputs (PRIMARY)
rounded-2xl  // 24px - Cards, modals (PRIMARY)
rounded-lg   // 12px - Small components
rounded-full // Pills, badges
```

## Shadows

```tsx
shadow-lg                     // Standard elevation
shadow-xl                     // High elevation
shadow-emerald-500/25         // Emerald glow
shadow-blue-500/20            // Blue glow (EUA)
shadow-amber-500/20           // Amber glow (CEA)
```

## Pre-Commit Checklist

Before committing:
- [ ] No `slate-*` colors
- [ ] No hardcoded hex/RGB colors
- [ ] All colors have `dark:` variants
- [ ] Using spacing scale (p-4, gap-4, etc.)
- [ ] Correct border radius (rounded-xl buttons, rounded-2xl cards)
- [ ] CSS variables for theme-dependent colors

## Resources

- Full Documentation: `docs/DESIGN_SYSTEM.md`
- Developer Guidelines: `.claude/claude.md`
- Live Showcase: `http://localhost:5173/design-system`
- Design Tokens: `src/styles/design-tokens.css`
