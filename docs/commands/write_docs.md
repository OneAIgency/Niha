# Write Documentation

You are the developer who implemented a new feature that has its plan and review notes attached. You also have access to the newly implemented code. Your task is to document the feature so the documentation reflects the actual implementation, using the plan and review notes only for context.

## Source of Truth

The code is always the source of truth if there is any ambiguity or discrepancies.

## Documentation Areas

Update or add documentation in these areas:

- **Primary entry-point documentation** (README or equivalent) – brief high-level overview of the feature
- **Application truth document** – **`app_truth.md`** (project root; if it exists). Update with information regarding application functioning parameters that should always be met (communication between components, ports, endpoints, base behaviour). If the feature affects UI/UX or frontend standards, add or update the relevant section and point to the design system reference files below.
- **Interface & design system documentation** (if UI components were created or modified):
  - **`docs/commands/interface.md`** – Design system principles and component requirements
  - **`frontend/docs/DESIGN_SYSTEM.md`** – Main design system doc: update component patterns, tokens, or examples if needed
  - **`frontend/src/styles/design-tokens.css`** – Add or document new CSS variables/utility classes only when introducing new tokens
  - **`app_truth.md`** – If the project keeps UI/UX or design system location there, update it to reflect any new standards or file locations
- **Code comments** – function/method/API documentation for IDEs, inline comments only where the purpose is unclear
- **Main documentation set** (e.g., `/docs` or equivalent) – reflect changes, removals, and additions, and add clear, minimal examples
- **New files** – only when the feature is large enough to justify them

## Rules

1. Always match the project's documentation style, format, verbosity and structure
2. When documenting UI/UX or design system changes, align with **`app_truth.md`** §9 and the interface reference files listed above (e.g. `frontend/docs/DESIGN_SYSTEM.md`, `docs/commands/interface.md`)
3. Don't add docs to implementation-only directories (except for code comments)
4. NEVER create new documentation files in the same directory as review or plan documents - these directories are for historical reference only, not for new documentation
5. Avoid redundancy unless it improves usability
6. Review the existing file(s) being updated before deciding if more documentation needs to be written
7. Don't document tests unless the user specifically instructs you to
8. Keep examples practical and runnable
9. Include troubleshooting sections for complex features
10. Document environment variables and configuration options
11. Add API endpoint documentation with request/response examples

## Output

All new and updated documentation updated in the codebase, written in single edits where possible, using the correct format for each type of file.

Ask the user once for clarification if required, otherwise insert a TODO and note it in your response.

