# Code Review

We just implemented the feature described in the attached plan.

Please do a thorough code review:

**Note**: If the feature includes UI components, review them against the interface and design system standards below and the reference files listed.

## Interface & design system – reference files

When reviewing UI/frontend changes, verify implementation against these sources. See also **`app_truth.md`** §9 (UI/UX & Design System) for the same reference list and interface standards.

- **`docs/commands/interface.md`** – Design system principles, token usage, theme system, component requirements (accessibility, responsiveness, states).
- **`app_truth.md`** (project root) – Application SSOT; check for UI/UX or frontend standards if present.
- **`frontend/docs/DESIGN_SYSTEM.md`** – Full design system doc: colors (navy, emerald, EUA/CEA, bid/ask), typography, spacing, radius, shadows, component patterns, trading UI.
- **`frontend/src/styles/design-tokens.css`** – CSS variables (light/dark), utility classes (`.text-primary`, `.page-title`, `.bg-surface`, `.badge-eua`, etc.).
- **`frontend/tailwind.config.js`** – Theme extension: `navy`, `emerald`, `primary` palettes; `darkMode: 'class'`; migration notes (no `slate-*`/`gray-*`, use `navy-*`).
- **`.cursor/rules/niha-core.mdc`** – Frontend rules: no hard-coded colors, use Tailwind tokens (navy, emerald, amber, blue, red).

1. Make sure that the plan was correctly implemented
2. Look for any obvious bugs or issues in the code
3. Look for subtle data alignment issues (e.g. expecting snake_case but getting camelCase, or expecting data to come through in an object but receiving a nested object like `{data:{}}`)
4. Check the code respects **`app_truth.md`** specifications (project root; if it exists)
5. Look for any over-engineering or files getting too large and needing refactoring
6. Look for any weird syntax or style that doesn't match other parts of the codebase
7. Verify error handling and edge cases are properly covered
8. Check for security vulnerabilities or best practice violations
9. Ensure proper testing coverage and test quality
10. **UI/UX Review** (if feature has UI components):
    - Review against **`docs/commands/interface.md`** (design tokens, theme system, component requirements)
    - Check against **`app_truth.md`** and **`frontend/docs/DESIGN_SYSTEM.md`** for design system standards
    - Verify no hard-coded colors/spacing/typography: use token classes from `design-tokens.css` or Tailwind classes from `tailwind.config.js` (navy, emerald; no `slate-*` or `gray-*`)
    - Confirm components support theme switching (light/dark; class on root)
    - Verify accessibility (ARIA, keyboard, contrast) and responsive behavior
    - Confirm reusable structure and handling of loading, error, and empty states

## Output

Document your findings in `docs/features/<N>_REVIEW.md` unless a different file name is specified.

Include:
- Summary of implementation quality
- List of issues found (if any), categorized by severity (Critical, Major, Minor)
- Specific file and line references for each issue
- Recommendations for improvements
- Confirmation that the plan was fully implemented
- **UI/UX and Interface Analysis** (if feature has UI components):
  - Dedicated section analyzing compliance with `docs/commands/interface.md` and the design system reference files above
  - Design token usage review (hard-coded colors, `slate-*`/`gray-*`, hex/RGB; reference: `design-tokens.css`, `tailwind.config.js`, `check-design-system.js`)
  - Theme system compliance (light/dark; `design-tokens.css` and Tailwind `dark:`)
  - Component requirements verification (accessibility, responsiveness, states)
  - Design system integration assessment (`frontend/docs/DESIGN_SYSTEM.md`, `app_truth.md`)
  - Recommendations for improving UI/UX consistency

