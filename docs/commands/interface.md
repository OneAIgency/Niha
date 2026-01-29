# Interface & Design System

Your task is to maintain UI/UX consistency, create centralized design systems that enable one-command theme changes, manage themes and components, and ensure all features integrate seamlessly into the application's user interface.

## Core Principle

The design system MUST be centralized so that changing a theme or design token in ONE place automatically updates ALL components across the entire application. Components must NEVER use hard-coded colors, spacing, or typography—they MUST reference design tokens.

## Steps

1. Analyze the current UI/UX state:
   - Check `app-truth.md` for existing UI/UX standards
   - Review existing component structure and styling approach
   - Identify current design tokens (if any)
   - Note any hard-coded values that need refactoring

2. Create or maintain centralized design tokens in a single source file (e.g., `src/design-system/tokens.ts`):
   - Colors (primary, secondary, text, background, etc.)
   - Typography (font families, sizes, weights, line heights)
   - Spacing scale
   - Shadows, border radius, transitions
   - Breakpoints and z-index values

3. Set up theme system:
   - Create theme configuration (light, dark, custom themes)
   - Set up theme provider for the application
   - Ensure all components access tokens through theme provider

4. For feature UI integration:
   - Review feature requirements from plan
   - Identify required UI components
   - Create UI specifications if needed
   - Ensure components use design tokens
   - Verify accessibility and responsive behavior

5. For research requests:
   - Research modern UI libraries and design systems
   - Compare options and provide recommendations
   - Include implementation guidance

## Rules

1. Components must NEVER use hard-coded design values (colors, spacing, typography, shadows, etc.)
2. All design values must live in the centralized tokens file
3. Components must reference tokens through theme provider
4. All components must support theme switching (light/dark/custom)
5. Maintain consistency with existing project style and patterns
6. Follow accessibility standards (WCAG guidelines, keyboard navigation, ARIA attributes)
7. Ensure responsive design works on all screen sizes
8. Document design system in `docs/design-system/` if it exists

## Component Requirements

When creating or reviewing components, verify:

- Uses design tokens (no hex colors, no px spacing, no hard-coded fonts)
- Form inputs and focusable elements use **emerald** for focus ring (e.g. `focus:ring-emerald-500`); see `frontend/docs/DESIGN_SYSTEM.md` § Forms/Inputs.
- Supports all theme variants
- Keyboard navigable and screen reader friendly
- Proper ARIA attributes
- Responsive on mobile, tablet, and desktop
- Handles loading, error, and empty states
- **Client status badge:** Use `ClientStatusBadge` (or `clientStatusVariant` from `utils/roleBadge`) for deposit/client role display in cards and tables; design tokens only. See `frontend/docs/DESIGN_SYSTEM.md` § Badges → Client status badge.

**Backoffice nav levels:** Subheader nav uses `.subheader-nav-btn`, `.subheader-nav-btn-active`, `.subheader-nav-btn-inactive` from `frontend/src/styles/design-tokens.css`. SubSubHeader nav (child-level, e.g. Onboarding subpages) uses `.subsubheader-nav-btn*` and count badge `.subsubheader-nav-badge`; customize via CSS variables in the same file. See `frontend/docs/DESIGN_SYSTEM.md` and `app_truth.md` §8–9.

**Settings pages:** Platform Settings (e.g. Price Scraping Sources, Mail & Authentication) use the same Card/Input patterns and design tokens; each section is wrapped in `.card_back` or `<Card />`. No hard-coded colors; use navy/emerald/amber/blue/red tokens per the design system.

## Output

1. **Design System Documentation**: Update `docs/design-system/` with tokens, themes, and components
2. **UI Specifications**: Create `docs/features/<N>_UI_SPEC.md` for feature UI requirements
3. **Component Implementation**: Create components following project structure, using tokens
4. **Research Reports**: Create `docs/ui-research/UI_RESEARCH_<topic>_<date>.md` for research findings
5. **app-truth.md Updates**: Update UI/UX section with design system location, patterns, and standards

Prioritize being concise and actionable. Focus on creating a centralized system that enables one-command theme changes.
