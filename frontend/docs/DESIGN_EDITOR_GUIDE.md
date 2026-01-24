# Design Editor Guide

## Overview

The Design Editor is an interactive browser-based tool for visually editing, testing, and generating code for React components.

**URL:** http://localhost:5173/design-editor

## Features

### 1. Component Browser (Left Sidebar)
- **Search:** Find components by name or description
- **Category Filter:** Filter by common, cash-market, backoffice, liquidity, onboarding, layout
- **Component Info:** See props count and description

### 2. Live Canvas (Center)
- **Dynamic Preview:** See component rendered in real-time
- **Viewport Control:** Test desktop (default), tablet (768px), mobile (375px)
- **Theme Toggle:** Switch between light and dark mode (isolated for preview)
- **Component Info:** View path and prop count

### 3. Props Panel (Right Sidebar)
- **Auto-generated Controls:** Type-aware controls for all props
  - String props → Text input
  - Boolean props → Toggle switch (keyboard accessible)
  - Number props → Number input
  - Union types → Dropdown select (e.g., variant: 'primary' | 'secondary' | 'ghost')
- **Reset Button:** Clear all props to defaults

### 4. Code Generator (Bottom)
- **Live Code:** Updates as you modify props
- **Copy Button:** One-click copy to clipboard with error handling
- **Language Toggle:** Switch between TSX and JSX syntax highlighting
- **Import Statement:** Automatic import path generation
- **Stats:** Shows prop count and line count

## Workflow

1. **Select Component:** Click component in browser
2. **Configure Props:** Use controls in props panel
3. **Preview:** See live preview with chosen props
4. **Test Responsive:** Try different viewports
5. **Test Theme:** Toggle light/dark mode
6. **Copy Code:** Click "Copy Code" button
7. **Paste:** Use in your component

## Keyboard Shortcuts

- `Tab`: Navigate between controls
- `Space/Enter`: Toggle switches and buttons
- Copy button supports keyboard activation

## Tips

- Start with simple components (Badge, Button, Card) to understand the workflow
- Use search to quickly find components
- Category filter helps when browsing many components
- Reset props if things get messy
- Always test both light and dark themes
- Check viewport responsiveness for layout components

## Troubleshooting

**Component doesn't load:**
- Check if component exports are correct
- Run `npm run generate:registry` to refresh component metadata
- Check browser console for errors

**Props not showing:**
- Ensure component has TypeScript interface with `Props` suffix
- Example: `interface ButtonProps { ... }`
- Run `npm run generate:registry` to update registry

**Code generation issues:**
- Verify all prop values are valid
- Check browser console for errors
- Boolean props: `true` shows as prop name, `false` is omitted

**Copy button shows "Failed":**
- Check browser permissions for clipboard access
- HTTPS/localhost required for clipboard API
- Try clicking the button again

## Development

**Update Registry:**
```bash
npm run generate:registry
```
This scans all components and updates `src/component-registry.json`.

**Add New Components:**
Components are auto-discovered. Just:
1. Create component file in `src/components/[category]/`
2. Export component with proper TypeScript interface (name ending in `Props`)
3. Run `npm run generate:registry`
4. Component appears in Design Editor

**Component Requirements:**
- Must be a named export (not default)
- Must have TypeScript props interface with `Props` suffix
- Props interface should document all props with types

## Architecture

**Component Registry:**
- Auto-discovery system scans `src/components/` directory
- Extracts metadata: name, category, path, props, description
- Generates `src/component-registry.json` (61+ components)
- Registry regenerates on every build via `prebuild` hook

**Dynamic Loading:**
- Components loaded with React.lazy for code-splitting
- Isolated rendering with Suspense fallback
- Theme isolation (preview theme doesn't affect editor)

**Type Inference:**
- Automatic control generation based on TypeScript types
- Boolean detection: `type.includes('boolean')`
- Number detection: `type.includes('number')`
- Select detection: Union types with string literals

## Current Stats

- **Components:** 61+ auto-discovered components
- **Categories:** 6 (common, cash-market, backoffice, liquidity, onboarding, layout)
- **Prop Controls:** 4 types (string, boolean, number, select)
- **Features:** Search, filter, live preview, code generation

## Future Enhancements

**Planned:**
- Style customization UI
- State testing (loading, error, disabled)
- Export to file
- Component variants explorer
- AI-powered generation

**Phase 2:** CLI tools for scaffolding
**Phase 3:** VS Code extension integration
**Phase 4:** Component import from other sites

## Access

**Direct URL:** Navigate to `http://localhost:5173/design-editor`

**For production:** This is a development tool. Do not deploy to production.
