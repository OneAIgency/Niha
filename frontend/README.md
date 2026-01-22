# Niha Carbon Platform - Frontend

A modern React-based frontend for the Niha Carbon Trading Platform, built with TypeScript, Tailwind CSS, and a comprehensive design system.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State Management:** Zustand
- **Styling:** Tailwind CSS + CSS Variables
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts + Custom SVG
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Design System

The Niha Carbon Platform uses a comprehensive, standardized design system built on Tailwind CSS with custom design tokens.

### Key Principles

- **Navy + Emerald Color Palette**: Navy for backgrounds/text, Emerald for brand/actions
- **Dark Mode First**: All components support light and dark themes
- **Trading UI Colors**: Green (bid/buy), Red (ask/sell), Blue (EUA), Amber (CEA)
- **Consistent Spacing**: 4px base unit (p-4, gap-4, etc.)
- **Standard Radius**: rounded-xl (16px) for buttons/inputs, rounded-2xl (24px) for cards

### Quick Reference

**Approved Colors:**
```tsx
// Backgrounds
bg-white dark:bg-navy-800
bg-navy-50 dark:bg-navy-900

// Text
text-navy-900 dark:text-white
text-navy-600 dark:text-navy-400

// Brand/Primary
bg-emerald-500 hover:bg-emerald-600

// Trading
text-emerald-600 // Bid/Buy
text-red-600     // Ask/Sell

// Certificates
text-blue-600    // EUA
text-amber-600   // CEA
```

**Never Use:**
- `slate-*` colors (use `navy-*` instead)
- `gray-*` colors (use `navy-*` instead)
- Hardcoded hex/RGB colors
- Inline color styles

### Resources

- **Live Showcase**: http://localhost:5173/design-system (start dev server)
- **Full Documentation**: [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
- **Quick Reference**: [`docs/STYLING_STANDARDS.md`](./docs/STYLING_STANDARDS.md)
- **Migration Guide**: [`docs/DESIGN_TOKENS_MIGRATION.md`](./docs/DESIGN_TOKENS_MIGRATION.md)
- **Developer Guidelines**: [`.claude/claude.md`](./.claude/claude.md)
- **Design Tokens**: [`src/styles/design-tokens.css`](./src/styles/design-tokens.css)

### Enforcement

The design system is enforced through:
- **ESLint Rules**: Block hardcoded colors and slate-* usage
- **Pre-commit Hook**: Validates staged files before commit
- **Manual Check**: `npm run check-design-system`

### Before Committing

Always ensure:
- [ ] No `slate-*` or `gray-*` colors
- [ ] No hardcoded hex/RGB colors
- [ ] All colors have `dark:` variants
- [ ] Using spacing scale (p-4, p-6, p-8)
- [ ] Correct border radius (rounded-xl buttons, rounded-2xl cards)

## Project Structure

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

## License

Proprietary - All rights reserved.
