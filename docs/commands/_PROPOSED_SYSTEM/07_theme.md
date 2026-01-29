# Agent 07: Theme & Design Tokens

> **Purpose**: Manage centralized design tokens - the single source of truth for all design values.

## When to Use

- Adding or modifying colors, spacing, typography, shadows
- Setting up design system for new project
- UI spec requires new tokens
- Design system audit or refactoring

## Usage

```bash
@07_theme.md "Description of theme changes"
```

**Examples:**
```bash
@07_theme.md "Add warning color palette for form validation"
@07_theme.md "Update spacing scale to include 18px (4.5)"
@07_theme.md "Setup initial design tokens for new project"
```

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                  SINGLE SOURCE OF TRUTH                     │
│                                                             │
│   tokens.ts (EDIT HERE)                                     │
│       │                                                     │
│       ├──▶ design-tokens.css (GENERATED - don't edit)      │
│       │                                                     │
│       └──▶ tailwind.theme.js (GENERATED - don't edit)      │
│                                                             │
│   Change tokens.ts → Run build → Everything updates         │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

### Step 1: Understand the Request

Parse what token changes are needed:
- New colors?
- New spacing values?
- New typography?
- Modification to existing tokens?
- Full theme setup?

### Step 2: Check Current Tokens

Read `src/theme/tokens.ts`:

```typescript
// Example structure
export const tokens = {
  colors: {
    primary: { /* shades */ },
    neutral: { /* shades */ },
    semantic: { /* success, error, etc */ },
  },
  spacing: { /* scale */ },
  typography: { /* fonts, sizes */ },
  radius: { /* border radius scale */ },
  shadows: { /* shadow definitions */ },
  // ...
} as const;
```

### Step 3: Plan Token Changes

For each change, determine:

1. **Category**: colors, spacing, typography, radius, shadows, etc.
2. **Name**: Semantic name (not `blue-500`, but `primary-500` or `info`)
3. **Values**: Both light and dark mode values (for colors)
4. **Usage**: Where it will be used

### Step 4: Modify tokens.ts

**For new project setup**, create complete structure:

```typescript
// src/theme/tokens.ts

export const tokens = {
  colors: {
    // Brand colors
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Main brand color
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    
    // Neutral palette
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    
    // Semantic colors
    semantic: {
      success: { light: '#10b981', dark: '#34d399' },
      warning: { light: '#f59e0b', dark: '#fbbf24' },
      error: { light: '#ef4444', dark: '#f87171' },
      info: { light: '#3b82f6', dark: '#60a5fa' },
    },
    
    // Surface colors (theme-aware)
    surface: {
      background: { light: '#f8fafc', dark: '#0f172a' },
      card: { light: '#ffffff', dark: '#1e293b' },
      elevated: { light: '#f1f5f9', dark: '#334155' },
    },
    
    // Text colors (theme-aware)
    text: {
      primary: { light: '#0f172a', dark: '#ffffff' },
      secondary: { light: '#475569', dark: '#cbd5e1' },
      muted: { light: '#64748b', dark: '#94a3b8' },
    },
    
    // Border colors (theme-aware)
    border: {
      default: { light: '#e2e8f0', dark: '#334155' },
      strong: { light: '#cbd5e1', dark: '#475569' },
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
  
  radius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  
  transitions: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
  },
  
  zIndex: {
    base: '0',
    dropdown: '10',
    sticky: '20',
    modal: '30',
    tooltip: '40',
  },
} as const;

// Type exports for TypeScript support
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
```

**For adding new tokens:**

```typescript
// Add to existing structure
colors: {
  // ... existing colors
  
  // New addition
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    // ... etc
  },
},
```

### Step 5: Create/Update Generator Script

`src/theme/scripts/generate.ts`:

```typescript
import { tokens } from '../tokens';
import * as fs from 'fs';
import * as path from 'path';

function generateCSS(): string {
  let css = `/* AUTO-GENERATED - DO NOT EDIT */\n/* Edit src/theme/tokens.ts instead */\n\n`;
  
  // Generate :root (light mode)
  css += ':root {\n';
  css += generateCSSVariables(tokens, 'light');
  css += '}\n\n';
  
  // Generate .dark
  css += '.dark {\n';
  css += generateCSSVariables(tokens, 'dark');
  css += '}\n';
  
  return css;
}

function generateCSSVariables(tokens: any, mode: 'light' | 'dark'): string {
  let vars = '';
  
  // Colors
  for (const [category, values] of Object.entries(tokens.colors)) {
    if (typeof values === 'object') {
      for (const [shade, value] of Object.entries(values as any)) {
        if (typeof value === 'object' && 'light' in value) {
          vars += `  --color-${category}-${shade}: ${value[mode]};\n`;
        } else if (typeof value === 'string') {
          vars += `  --color-${category}-${shade}: ${value};\n`;
        }
      }
    }
  }
  
  // Spacing
  for (const [key, value] of Object.entries(tokens.spacing)) {
    vars += `  --space-${key}: ${value};\n`;
  }
  
  // Typography
  for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
    vars += `  --text-${key}: ${value};\n`;
  }
  
  // Radius
  for (const [key, value] of Object.entries(tokens.radius)) {
    vars += `  --radius-${key}: ${value};\n`;
  }
  
  // Shadows
  for (const [key, value] of Object.entries(tokens.shadows)) {
    vars += `  --shadow-${key}: ${value};\n`;
  }
  
  return vars;
}

function generateTailwindTheme(): string {
  return `// AUTO-GENERATED - DO NOT EDIT
// Edit src/theme/tokens.ts instead

module.exports = ${JSON.stringify({
    colors: tokens.colors,
    spacing: tokens.spacing,
    fontFamily: tokens.typography.fontFamily,
    fontSize: tokens.typography.fontSize,
    fontWeight: tokens.typography.fontWeight,
    lineHeight: tokens.typography.lineHeight,
    borderRadius: tokens.radius,
    boxShadow: tokens.shadows,
  }, null, 2)};
`;
}

// Generate files
const cssOutput = generateCSS();
const tailwindOutput = generateTailwindTheme();

const generatedDir = path.join(__dirname, '../generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

fs.writeFileSync(path.join(generatedDir, 'design-tokens.css'), cssOutput);
fs.writeFileSync(path.join(generatedDir, 'tailwind.theme.js'), tailwindOutput);

console.log('✓ Generated design-tokens.css');
console.log('✓ Generated tailwind.theme.js');
```

### Step 6: Update package.json

Ensure build script exists:

```json
{
  "scripts": {
    "theme:build": "tsx src/theme/scripts/generate.ts",
    "predev": "npm run theme:build",
    "prebuild": "npm run theme:build"
  }
}
```

### Step 7: Run Generation

```bash
npm run theme:build
```

Verify output:
- `src/theme/generated/design-tokens.css` created/updated
- `src/theme/generated/tailwind.theme.js` created/updated

### Step 8: Update Documentation

If significant token changes:

1. **Update `docs/DESIGN_SYSTEM.md`**:
   - New color documentation
   - New spacing values
   - Usage examples

2. **Update `app_truth.md` §9**:
   - Token file locations
   - Any new conventions

### Step 9: Output Summary

```
═══════════════════════════════════════════════════════════════
                    THEME UPDATE COMPLETE
═══════════════════════════════════════════════════════════════

Changes made:
  ✓ src/theme/tokens.ts
      - Added: warning color palette
      - Modified: spacing scale

Generated files:
  ✓ src/theme/generated/design-tokens.css
  ✓ src/theme/generated/tailwind.theme.js

Documentation updated:
  ✓ docs/DESIGN_SYSTEM.md

To use new tokens:
  CSS:      var(--color-warning-500)
  Tailwind: bg-warning-500
  TS:       tokens.colors.warning[500]

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Never edit generated files** - They will be overwritten
2. **Use semantic names** - `surface`, `primary`, not `white`, `green`
3. **Support both themes** - Always define light and dark for colors
4. **Document new tokens** - Update DESIGN_SYSTEM.md
5. **Run generation** - Always run `npm run theme:build` after changes

## File Structure

```
src/theme/
├── tokens.ts              ← EDIT THIS (single source of truth)
├── index.ts               ← Exports
├── scripts/
│   └── generate.ts        ← Generator script
└── generated/             ← DON'T EDIT (auto-generated)
    ├── design-tokens.css
    └── tailwind.theme.js
```

## Output

- Updated `tokens.ts`
- Regenerated CSS and Tailwind files
- Updated documentation
