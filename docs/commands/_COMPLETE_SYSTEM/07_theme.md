# Agent 07: Theme & Design Tokens

> **Ce face**: Gestionează design tokens centralizate - sursa unică de adevăr pentru toate valorile de design.
> **Când îl folosești**: Când adaugi/modifici culori, spacing, tipografie, shadows.
> **Rezultat**: Tokens actualizate și fișiere regenerate.

---

## Cum Îl Folosești

```bash
@07_theme.md "Descriere modificări"
```

**Exemple:**
```bash
@07_theme.md "Adaugă paleta de culori warning pentru validare formulare"
@07_theme.md "Actualizează scala de spacing să includă 18px (4.5)"
@07_theme.md "Setează design tokens inițiale pentru proiect nou"
```

---

## Principiu Fundamental

```
┌─────────────────────────────────────────────────────────────┐
│                 SURSĂ UNICĂ DE ADEVĂR                       │
│                                                             │
│   tokens.ts (EDITEAZĂ AICI)                                 │
│       │                                                     │
│       ├──▶ design-tokens.css (GENERAT - nu edita)          │
│       │                                                     │
│       └──▶ tailwind.theme.js (GENERAT - nu edita)          │
│                                                             │
│   Schimbă tokens.ts → Rulează build → Totul se actualizează │
└─────────────────────────────────────────────────────────────┘
```

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Înțelege Cererea

Parsează ce modificări de tokens sunt necesare:
- Culori noi?
- Valori spacing noi?
- Tipografie nouă?
- Modificări la tokens existente?
- Setup complet de teme?

### Pas 2: Verifică Tokens Curente

Citește `src/theme/tokens.ts` (sau echivalent):

```typescript
// Structură exemplu
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

### Pas 3: Planifică Modificările de Tokens

Pentru fiecare modificare, determină:

1. **Categorie**: colors, spacing, typography, radius, shadows, etc.
2. **Nume**: Nume semantic (nu `blue-500`, ci `primary-500` sau `info`)
3. **Valori**: Atât light cât și dark mode (pentru culori)
4. **Utilizare**: Unde va fi folosit

### Pas 4: Modifică tokens.ts

**Pentru setup proiect nou**, creează structură completă:

```typescript
// src/theme/tokens.ts

export const tokens = {
  colors: {
    // Culori brand
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Culoare brand principală
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },

    // Paletă neutral
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

    // Culori semantice
    semantic: {
      success: { light: '#10b981', dark: '#34d399' },
      warning: { light: '#f59e0b', dark: '#fbbf24' },
      error: { light: '#ef4444', dark: '#f87171' },
      info: { light: '#3b82f6', dark: '#60a5fa' },
    },

    // Culori suprafață (theme-aware)
    surface: {
      background: { light: '#f8fafc', dark: '#0f172a' },
      card: { light: '#ffffff', dark: '#1e293b' },
      elevated: { light: '#f1f5f9', dark: '#334155' },
    },

    // Culori text (theme-aware)
    text: {
      primary: { light: '#0f172a', dark: '#ffffff' },
      secondary: { light: '#475569', dark: '#cbd5e1' },
      muted: { light: '#64748b', dark: '#94a3b8' },
    },

    // Culori border (theme-aware)
    border: {
      default: { light: '#e2e8f0', dark: '#334155' },
      strong: { light: '#cbd5e1', dark: '#475569' },
    },
  },

  spacing: {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },

  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
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
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
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
    fixed: '30',
    modal: '40',
    popover: '50',
    tooltip: '60',
  },
} as const;

// Type exports pentru TypeScript support
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
```

**Pentru adăugare tokens noi:**

```typescript
// Adaugă la structura existentă
colors: {
  // ... culori existente

  // Adăugare nouă
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
},
```

### Pas 5: Creează/Actualizează Script Generator

`src/theme/scripts/generate.ts`:

```typescript
import { tokens } from '../tokens';
import * as fs from 'fs';
import * as path from 'path';

function generateCSS(): string {
  let css = `/* AUTO-GENERATED - NU EDITA */\n`;
  css += `/* Editează src/theme/tokens.ts în schimb */\n\n`;

  // Generează :root (light mode)
  css += ':root {\n';
  css += generateCSSVariables(tokens, 'light');
  css += '}\n\n';

  // Generează .dark
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
  return `// AUTO-GENERATED - NU EDITA
// Editează src/theme/tokens.ts în schimb

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

// Generează fișierele
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

### Pas 6: Actualizează package.json

Asigură-te că scriptul de build există:

```json
{
  "scripts": {
    "theme:build": "tsx src/theme/scripts/generate.ts",
    "predev": "npm run theme:build",
    "prebuild": "npm run theme:build"
  }
}
```

### Pas 7: Rulează Generarea

```bash
npm run theme:build
```

Verifică output:
- `src/theme/generated/design-tokens.css` creat/actualizat
- `src/theme/generated/tailwind.theme.js` creat/actualizat

### Pas 8: Actualizează Documentația

Dacă modificări semnificative de tokens:

1. **Actualizează `docs/DESIGN_SYSTEM.md`**:
   - Documentație culori noi
   - Valori spacing noi
   - Exemple utilizare

2. **Actualizează `app_truth.md` §9**:
   - Locații fișiere tokens
   - Convenții noi dacă e cazul

### Pas 9: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                    UPDATE THEME COMPLET
═══════════════════════════════════════════════════════════════

Modificări făcute:
  ✓ src/theme/tokens.ts
      - Adăugat: paletă culori warning
      - Modificat: scala spacing

Fișiere generate:
  ✓ src/theme/generated/design-tokens.css
  ✓ src/theme/generated/tailwind.theme.js

Documentație actualizată:
  ✓ docs/DESIGN_SYSTEM.md

Pentru a folosi tokens noi:
  CSS:      var(--color-warning-500)
  Tailwind: bg-warning-500
  TS:       tokens.colors.warning[500]

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Niciodată nu edita fișierele generate** - Vor fi suprascrise
2. **Folosește nume semantice** - `surface`, `primary`, nu `white`, `green`
3. **Suportă ambele teme** - Definește întotdeauna light și dark pentru culori
4. **Documentează tokens noi** - Actualizează DESIGN_SYSTEM.md
5. **Rulează generarea** - Întotdeauna `npm run theme:build` după modificări

---

## Structura Fișiere

```
src/theme/
├── tokens.ts              ← EDITEAZĂ ASTA (sursă unică de adevăr)
├── index.ts               ← Exporturi
├── scripts/
│   └── generate.ts        ← Script generator
└── generated/             ← NU EDITA (auto-generat)
    ├── design-tokens.css
    └── tailwind.theme.js
```

---

## Output

- `tokens.ts` actualizat
- Fișiere CSS și Tailwind regenerate
- Documentație actualizată
