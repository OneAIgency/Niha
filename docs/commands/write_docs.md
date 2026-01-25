# Write Documentation

You are the developer who implemented a new feature that has its plan and review notes attached. You also have access to the newly implemented code. Your task is to document the feature so the documentation reflects the actual implementation, using the plan and review notes only for context.

## Source of Truth

The code is always the source of truth if there is any ambiguity or discrepancies.

## Documentation Areas

Update or add documentation in these areas:

- **Primary entry-point documentation** (README or equivalent) – brief high-level overview of the feature
- **Application truth document** (`app-truth.md` if it exists) – update with information regarding application functioning parameters that should always be met when implementing something like communication between components, ports, endpoints, or anything regarding base functioning of the app
- **Design system documentation** (`docs/design-system/` if it exists) – update component documentation if UI components were created or modified. Reference `@interface.md` for comprehensive UI/UX documentation
- **Code comments** – function/method/API documentation for IDEs, inline comments only where the purpose is unclear
- **Main documentation set** (e.g., `/docs` or equivalent) – reflect changes, removals, and additions, and add clear, minimal examples
- **New files** – only when the feature is large enough to justify them

## Rules

1. Always match the project's documentation style, format, verbosity and structure
2. Don't add docs to implementation-only directories (except for code comments)
3. NEVER create new documentation files in the same directory as review or plan documents - these directories are for historical reference only, not for new documentation
4. Avoid redundancy unless it improves usability
5. Review the existing file(s) being updated before deciding if more documentation needs to be written
6. Don't document tests unless the user specifically instructs you to
7. Keep examples practical and runnable
8. Include troubleshooting sections for complex features
9. Document environment variables and configuration options
10. Add API endpoint documentation with request/response examples

## Output

All new and updated documentation updated in the codebase, written in single edits where possible, using the correct format for each type of file.

Ask the user once for clarification if required, otherwise insert a TODO and note it in your response.

