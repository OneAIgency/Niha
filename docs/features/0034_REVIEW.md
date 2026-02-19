# Code Review: Introducer Page – Simulate Request Button

## Summary

Implementation adds a dev-only "Simulează cerere introducer" button on the Introducer page that pre-fills the NDA form with sample data and a minimal valid PDF, allowing rapid simulation of introducer requests during development.

## Files Changed

- `frontend/src/pages/IntroducerPage.tsx`

## Implementation Quality

- **Scope**: Focused change; only IntroducerPage modified.
- **Dev-only**: Button visible only when `import.meta.env.DEV` is true.
- **Design tokens**: Uses `amber-*` for the button (allowed by design system).
- **TypeScript**: Compiles without errors.

## Issues Found

### Critical
None.

### Major
None.

### Minor
1. **Simulate button in NDA mode**: When the form is already in NDA mode and the user clicks "Simulează cerere", the handler overwrites the current form data. If the user had partially filled the form, that data is lost. Acceptable for a dev helper.
2. **Base64 PDF**: The minimal PDF is inlined as base64. Consider extracting to a constant or a separate module if it grows, but current size is fine.

## UI/UX Compliance

- **Design system**: Uses `amber-500/30`, `amber-400/70` – valid tokens.
- **Accessibility**: Button has `type="button"` and descriptive label.
- **Visibility**: Shown only in development.

## Recommendations

- None for this small dev feature.

## Plan Implementation

No plan file; implementation matches the requested behavior.
