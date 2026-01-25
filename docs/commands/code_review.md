# Code Review

We just implemented the feature described in the attached plan.

Please do a thorough code review:

**Note**: If the feature includes UI components, review them against `@interface.md` specifications for design tokens, theme system, and component requirements.

1. Make sure that the plan was correctly implemented
2. Look for any obvious bugs or issues in the code
3. Look for subtle data alignment issues (e.g. expecting snake_case but getting camelCase, or expecting data to come through in an object but receiving a nested object like `{data:{}}`)
4. Check the code respects `app-truth.md` specifications (if it exists in the project)
5. Look for any over-engineering or files getting too large and needing refactoring
6. Look for any weird syntax or style that doesn't match other parts of the codebase
7. Verify error handling and edge cases are properly covered
8. Check for security vulnerabilities or best practice violations
9. Ensure proper testing coverage and test quality
10. **UI/UX Review** (if feature has UI components):
    - Review UI components against `@interface.md` specifications (design tokens, theme system, component requirements)
    - Check if UI follows design system standards from `app-truth.md`
    - Verify components use design tokens (no hard-coded colors, spacing, or typography)
    - Confirm all components support theme switching (light/dark/custom)
    - Verify accessibility (ARIA labels, keyboard navigation, color contrast)
    - Confirm responsive behavior works on different screen sizes
    - Validate that components are reusable and properly structured
    - Check component states (loading, error, empty states) are handled

## Output

Document your findings in `docs/features/<N>_REVIEW.md` unless a different file name is specified.

Include:
- Summary of implementation quality
- List of issues found (if any), categorized by severity (Critical, Major, Minor)
- Specific file and line references for each issue
- Recommendations for improvements
- Confirmation that the plan was fully implemented
- **UI/UX and Interface Analysis** (if feature has UI components):
  - Dedicated section analyzing compliance with `@interface.md` specifications
  - Design token usage review (hard-coded values found, if any)
  - Theme system compliance (light/dark/custom theme support)
  - Component requirements verification (accessibility, responsiveness, states)
  - Design system integration assessment
  - Recommendations for improving UI/UX consistency

