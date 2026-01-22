# Niha Carbon Platform - Development Guidelines

## Design System Enforcement

**CRITICAL:** All styling MUST follow the standardized design system defined in:
- Design Tokens: `src/styles/design-tokens.css`
- Documentation: `docs/DESIGN_SYSTEM.md`
- Live Showcase: `http://localhost:5173/design-system`

### Mandatory Styling Rules

#### Rule 1: Color System - Navy + Emerald ONLY

✅ **ALWAYS USE:**
```tsx
// Backgrounds
className="bg-white dark:bg-navy-800"
className="bg-navy-50 dark:bg-navy-900"
className="bg-navy-100 dark:bg-navy-800"

// Text
className="text-navy-900 dark:text-white"
className="text-navy-600 dark:text-navy-400"
className="text-navy-500 dark:text-navy-500"

// Brand / Primary Actions
className="bg-emerald-500 hover:bg-emerald-600"
className="text-emerald-600 dark:text-emerald-400"

// Trading Colors
className="text-emerald-600 dark:text-emerald-400"  // Bid/Buy
className="text-red-600 dark:text-red-400"           // Ask/Sell

// Certificate Colors
className="text-blue-600 dark:text-blue-400"         // EUA
className="text-amber-600 dark:text-amber-400"       // CEA
```

❌ **NEVER USE:**
```tsx
className="bg-slate-950"              // Wrong! Use navy-900
className="bg-slate-800"              // Wrong! Use navy-800
className="text-slate-600"            // Wrong! Use navy-600
className="bg-gray-100"               // Wrong! Use navy-100
style={{ color: '#10b981' }}         // Wrong! Use className
style={{ backgroundColor: 'rgb(34, 197, 94)' }}  // Wrong!
```

**Color Migration:**
- `slate-950` → `navy-900`
- `slate-900` → `navy-800`
- `slate-800` → `navy-700`
- `slate-700` → `navy-600`
- `slate-600` → `navy-500`
- `slate-500` → `navy-400`
- `slate-400` → `navy-400`
- `slate-300` → `navy-300`
- `slate-200` → `navy-200`
- `slate-100` → `navy-100`
- `slate-50` → `navy-50`

#### Rule 2: CSS Variables for Dynamic Colors

For charts, SVGs, or any element requiring theme-aware colors:

✅ **ALWAYS USE:**
```tsx
<path
  fill="var(--color-bid-bg)"
  stroke="var(--color-bid)"
/>
<path
  fill="var(--color-ask-bg)"
  stroke="var(--color-ask)"
/>
<div style={{ color: 'var(--color-primary)' }} />
```

❌ **NEVER USE:**
```tsx
<path fill="rgba(34, 197, 94, 0.2)" />  // Hardcoded!
<path stroke="rgb(239, 68, 68)" />      // Hardcoded!
```

**Available CSS Variables:**
```css
/* Backgrounds */
--color-background
--color-surface
--color-elevated
--color-muted

/* Text */
--color-text-primary
--color-text-secondary
--color-text-muted
--color-text-inverse

/* Brand */
--color-primary
--color-primary-hover
--color-primary-active

/* Trading */
--color-bid          /* Buy orders - emerald */
--color-bid-bg
--color-ask          /* Sell orders - red */
--color-ask-bg

/* Certificates */
--color-eua          /* Blue */
--color-eua-bg
--color-cea          /* Amber */
--color-cea-bg

/* Status */
--color-success
--color-warning
--color-error
--color-info
```

#### Rule 3: Typography Scale

✅ **ALWAYS USE:**
```tsx
className="text-xs"      // 12px
className="text-sm"      // 14px
className="text-base"    // 16px
className="text-lg"      // 18px
className="text-xl"      // 20px
className="text-2xl"     // 24px
className="text-3xl"     // 30px
className="text-4xl"     // 36px
className="text-5xl"     // 48px

// Font weights
className="font-normal"     // 400
className="font-medium"     // 500
className="font-semibold"   // 600
className="font-bold"       // 700
className="font-extrabold"  // 800
```

❌ **NEVER USE:**
```tsx
style={{ fontSize: '15px' }}  // Wrong! Use text-base
style={{ fontWeight: 550 }}   // Wrong! Use font-medium
```

#### Rule 4: Spacing System (4px base)

✅ **ALWAYS USE:**
```tsx
className="p-4"    // 16px - Most common
className="p-6"    // 24px - Cards
className="p-8"    // 32px - Large containers
className="gap-4"  // 16px - Most common
className="gap-6"  // 24px - Larger spacing
className="mt-2"   // 8px
className="mb-4"   // 16px
```

❌ **NEVER USE:**
```tsx
style={{ padding: '15px' }}  // Wrong! Use p-4
style={{ gap: '18px' }}      // Wrong! Use gap-4
className="p-7"              // Wrong! Not in scale
```

#### Rule 5: Border Radius

✅ **ALWAYS USE:**
```tsx
className="rounded-xl"   // 16px - Buttons, inputs (PRIMARY)
className="rounded-2xl"  // 24px - Cards, modals (PRIMARY)
className="rounded-lg"   // 12px - Small components
className="rounded-full" // Pills, avatars, badges
```

❌ **NEVER USE:**
```tsx
className="rounded-md"   // 8px - Too small for our design
style={{ borderRadius: '15px' }}  // Wrong! Use rounded-xl
```

#### Rule 6: Shadows

✅ **ALWAYS USE:**
```tsx
className="shadow-lg"              // Cards
className="shadow-xl"              // Elevated elements
className="shadow-emerald-500/25"  // Emerald glow for primary buttons
className="shadow-blue-500/20"     // Blue glow for EUA
className="shadow-amber-500/20"    // Amber glow for CEA
```

❌ **NEVER USE:**
```tsx
style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}  // Wrong!
```

#### Rule 7: Dark Mode Support

✅ **ALWAYS provide dark mode variants:**
```tsx
<div className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white">
  <h1 className="text-navy-900 dark:text-white">Title</h1>
  <p className="text-navy-600 dark:text-navy-400">Content</p>
  <button className="bg-emerald-500 hover:bg-emerald-600 text-white">
    Action
  </button>
</div>
```

❌ **NEVER omit dark mode:**
```tsx
<div className="bg-white text-black">  // Wrong! Missing dark: variants
```

### Component Patterns

#### Buttons

**Primary Button (Brand Actions):**
```tsx
<button className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl">
  Primary Action
</button>
```

**Secondary Button:**
```tsx
<button className="rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-6 py-3 text-base font-semibold text-navy-900 dark:text-white transition-all hover:border-navy-300 dark:hover:border-navy-500">
  Secondary Action
</button>
```

**Ghost Button:**
```tsx
<button className="rounded-xl px-6 py-3 text-base font-semibold text-navy-600 dark:text-navy-400 transition-all hover:bg-navy-100 dark:hover:bg-navy-700">
  Ghost Action
</button>
```

#### Cards

**Default Card:**
```tsx
<div className="rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-lg transition-all hover:shadow-xl">
  <h3 className="text-lg font-bold text-navy-900 dark:text-white">
    Card Title
  </h3>
  <p className="mt-2 text-sm text-navy-600 dark:text-navy-400">
    Card content
  </p>
</div>
```

**Glass Effect Card:**
```tsx
<div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
  Content
</div>
```

#### Inputs

**Text Input:**
```tsx
<input
  type="text"
  className="w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-3 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
  placeholder="Enter text..."
/>
```

**Input with Icon:**
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
  <input
    type="text"
    className="w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 py-3 pl-12 pr-4 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
    placeholder="Search..."
  />
</div>
```

#### Badges

**Status Badge (Success):**
```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
  <Check className="h-3 w-3" />
  Success
</span>
```

**Certificate Badge (EUA):**
```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
  EUA
</span>
```

**Certificate Badge (CEA):**
```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
  CEA
</span>
```

#### Trading UI

**Bid Row (Buy Orders):**
```tsx
<div className="rounded-lg p-3 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
  <span className="font-mono text-emerald-600 dark:text-emerald-400">
    €99.50
  </span>
</div>
```

**Ask Row (Sell Orders):**
```tsx
<div className="rounded-lg p-3 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">
  <span className="font-mono text-red-600 dark:text-red-400">
    €99.55
  </span>
</div>
```

**Spread Indicator:**
```tsx
<div className="border-t border-b border-navy-200 dark:border-navy-700 py-3">
  <span className="text-xs text-navy-600 dark:text-navy-400">Spread:</span>
  <span className="ml-2 font-mono font-bold text-navy-900 dark:text-white">
    €0.10
  </span>
</div>
```

### Pre-Implementation Checklist

Before writing ANY component code:

1. ✅ Reviewed `src/styles/design-tokens.css` for available tokens
2. ✅ Checked `/design-system` showcase page for similar patterns
3. ✅ Confirmed navy-* colors for backgrounds/text
4. ✅ Confirmed emerald-* for brand/primary actions
5. ✅ Confirmed appropriate certificate/trading colors
6. ✅ Included dark: variants for ALL colors
7. ✅ Used standard spacing scale (p-4, gap-4, etc.)
8. ✅ Used rounded-xl for buttons/inputs, rounded-2xl for cards
9. ✅ Used CSS variables for any theme-dependent colors
10. ✅ No hardcoded hex/RGB colors anywhere

### Common Mistakes to Avoid

#### ❌ Mistake 1: Using slate-* colors
```tsx
// WRONG
<div className="bg-slate-900 text-slate-100">

// CORRECT
<div className="bg-navy-900 dark:bg-navy-800 text-white">
```

#### ❌ Mistake 2: Hardcoded colors
```tsx
// WRONG
<path fill="#10b981" stroke="rgb(16, 185, 129)" />

// CORRECT
<path fill="var(--color-primary)" stroke="var(--color-primary)" />
```

#### ❌ Mistake 3: Missing dark mode
```tsx
// WRONG
<div className="bg-white text-black">

// CORRECT
<div className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white">
```

#### ❌ Mistake 4: Inconsistent border radius
```tsx
// WRONG
<button className="rounded-lg">  // 12px
<div className="rounded-md">     // 8px

// CORRECT
<button className="rounded-xl">  // 16px (standard for buttons)
<div className="rounded-2xl">    // 24px (standard for cards)
```

#### ❌ Mistake 5: Off-scale spacing
```tsx
// WRONG
<div className="p-7">           // 28px - not in scale
<div style={{ padding: '15px' }}>

// CORRECT
<div className="p-6">           // 24px - in scale
<div className="p-8">           // 32px - in scale
```

### Resources

**Design System Files:**
- Design Tokens: `/Users/victorsafta/work/Niha/frontend/src/styles/design-tokens.css`
- Documentation: `/Users/victorsafta/work/Niha/frontend/docs/DESIGN_SYSTEM.md`
- Romanian Docs: `/Users/victorsafta/work/Niha/frontend/docs/DESIGN_SYSTEM_RO.md`
- Showcase Page: `/Users/victorsafta/work/Niha/frontend/src/pages/DesignSystemPage.tsx`

**Live References:**
- Design System Showcase: `http://localhost:5173/design-system`
- Component Showcase: `http://localhost:5173/components`

**Icon Library:**
- Lucide React: https://lucide.dev
- Already installed: `lucide-react`

### Enforcement

**Automated Checks:**
- ESLint rules block hardcoded colors
- Pre-commit hook validates design system compliance
- CI/CD pipeline checks for violations

**Manual Review:**
Before committing, verify:
1. No slate-* colors anywhere
2. No hardcoded hex/RGB colors
3. All colors have dark: variants
4. All spacing uses scale (p-4, gap-4, etc.)
5. Correct border radius (rounded-xl buttons, rounded-2xl cards)

---

## Architecture Guidelines

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── cash-market/     # Cash market specific
│   │   ├── swap/            # Swap specific
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   └── styles/
│       └── design-tokens.css # Design system tokens
├── docs/                    # Documentation
└── public/                  # Static assets
```

### Technology Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State Management:** Zustand
- **Styling:** Tailwind CSS + CSS Variables
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts (for some), Custom SVG (for depth charts)
- **HTTP Client:** Axios

### Code Quality Standards

- All components must be TypeScript with proper typing
- Use functional components with hooks
- Follow React best practices (no prop drilling, proper key usage)
- Extract reusable logic to custom hooks
- Keep components small (<200 lines)
- Write meaningful commit messages

---

**Last Updated:** 2026-01-22
**Version:** 1.0.0
