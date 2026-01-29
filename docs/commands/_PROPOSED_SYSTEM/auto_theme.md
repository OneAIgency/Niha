# Orchestrator: Auto-Theme

> **Purpose**: Make design system changes with automatic regeneration and documentation.

## Usage

```bash
@auto_theme.md "Description of theme changes"
```

**Examples:**
```bash
@auto_theme.md "Add purple accent color palette for premium features"
@auto_theme.md "Update spacing scale to include 1.125rem (18px)"
@auto_theme.md "Setup complete design system for new project"
@auto_theme.md "Add dark mode variants for all semantic colors"
```

## Prerequisites

For existing projects:
- `app_truth.md` exists
- `src/theme/tokens.ts` exists (or will be created)

For new projects:
- Can be run standalone to initialize theme system

## What This Does

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-THEME SEQUENCE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ANALYZE      Parse request, check current tokens        │
│        ↓                                                    │
│  2. PLAN         Determine what changes are needed          │
│        ↓                                                    │
│  3. MODIFY       Update tokens.ts                           │
│        ↓                                                    │
│  4. GENERATE     Run theme:build script                     │
│        ↓                                                    │
│  5. VERIFY       Check generated files are correct          │
│        ↓                                                    │
│  6. DOCUMENT     Update DESIGN_SYSTEM.md                    │
│        ↓                                                    │
│  ✓ COMPLETE                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

Execute all steps **in sequence**, **without pausing** unless errors occur.

---

### STEP 1: ANALYZE

**Actions**:
1. Parse user's theme change request
2. Check if `src/theme/tokens.ts` exists
3. If exists, read current token structure
4. Identify what category of change this is:
   - Colors (new palette, modify existing)
   - Spacing (new values, modify scale)
   - Typography (fonts, sizes, weights)
   - Radius (border radius values)
   - Shadows (new shadows, modify existing)
   - Full setup (create entire system)

**Output**:
```
CHANGE_TYPE = [colors | spacing | typography | radius | shadows | full_setup]
TOKENS_EXIST = true/false
CURRENT_TOKENS = [parsed structure if exists]
```

**Continue immediately to Step 2**

---

### STEP 2: PLAN

**Actions**:
1. Determine exact changes needed in `tokens.ts`
2. Check for naming conflicts with existing tokens
3. Ensure changes follow conventions:
   - Semantic names (not `blue-500`, but `primary-500` or `info`)
   - Light/dark variants for theme-aware colors
   - Consistent scale for spacing/sizing

**For each change, document**:
```
PLANNED_CHANGES = [
  { category: "colors", action: "add", name: "purple", values: {...} },
  { category: "spacing", action: "modify", name: "4.5", value: "1.125rem" },
  ...
]
```

**If `TOKENS_EXIST = false`**:
```
PLANNED_CHANGES = [
  { category: "full", action: "create", template: "complete_token_structure" }
]
```

**Continue immediately to Step 3**

---

### STEP 3: MODIFY TOKENS

**Execute**: `@07_theme.md` logic

**Actions**:

**If creating new system** (`TOKENS_EXIST = false`):
1. Create `src/theme/tokens.ts` with complete structure
2. Create `src/theme/scripts/generate.ts`
3. Create `src/theme/index.ts` for exports
4. Update `package.json` with theme:build script

**If modifying existing** (`TOKENS_EXIST = true`):
1. Read current `tokens.ts`
2. Apply each change from `PLANNED_CHANGES`
3. Write updated `tokens.ts`

**Validation**:
- TypeScript compiles without errors
- All theme-aware colors have light/dark variants
- No duplicate token names

**Continue immediately to Step 4**

---

### STEP 4: GENERATE

**Actions**:
1. Run theme generation:
   ```bash
   npm run theme:build
   ```
   
2. Or if script doesn't exist, run directly:
   ```bash
   npx tsx src/theme/scripts/generate.ts
   ```

**Expected output files**:
- `src/theme/generated/design-tokens.css`
- `src/theme/generated/tailwind.theme.js`

**Continue immediately to Step 5**

---

### STEP 5: VERIFY

**Actions**:
1. Check generated files exist
2. Verify CSS contains expected variables:
   ```css
   /* Should contain new tokens */
   --color-purple-500: #...;
   ```
3. Verify Tailwind theme contains expected values
4. Check no generation errors in output

**If verification fails**:
```
PAUSE and report:
"Generation failed: [error details]
 Check src/theme/scripts/generate.ts for issues."
```

**If verification passes**:
**Continue immediately to Step 6**

---

### STEP 6: DOCUMENT

**Actions**:

1. **Update `docs/DESIGN_SYSTEM.md`**:
   - Add new color palettes with examples
   - Add new spacing values to scale table
   - Add usage examples for new tokens

2. **Update `app_truth.md` §9** (if significant changes):
   - New token categories
   - New conventions

**Documentation format for new colors**:
```markdown
### [Color Name] Palette

| Shade | Light | Dark | Usage |
|-------|-------|------|-------|
| 50 | #xxx | #xxx | Backgrounds |
| 500 | #xxx | #xxx | Primary |
| 900 | #xxx | #xxx | Text |

**CSS Variable**: `var(--color-[name]-[shade])`
**Tailwind Class**: `bg-[name]-[shade]`, `text-[name]-[shade]`
```

---

### COMPLETION

**Output final summary**:

```
═══════════════════════════════════════════════════════════════
                     AUTO-THEME COMPLETE
═══════════════════════════════════════════════════════════════

Changes made to src/theme/tokens.ts:
  ✓ [Change 1 description]
  ✓ [Change 2 description]

Generated files updated:
  ✓ src/theme/generated/design-tokens.css
  ✓ src/theme/generated/tailwind.theme.js

Documentation updated:
  ✓ docs/DESIGN_SYSTEM.md

New tokens available:

  CSS Variables:
    var(--color-purple-500)
    var(--space-4-5)
    ...

  Tailwind Classes:
    bg-purple-500
    p-4.5
    ...

Usage example:
  <div className="bg-purple-500 p-4.5">
    Purple background with custom spacing
  </div>

═══════════════════════════════════════════════════════════════
```

---

## Human Intervention Points

Pauses only for:

1. **Naming conflicts** - If new token would override important existing token
2. **Breaking changes** - If modifying token used extensively
3. **Generation errors** - If script fails

---

## Flags

```bash
# Setup mode - create complete token system
@auto_theme.md --setup "Initialize design system"

# Preview mode - show what would change without applying
@auto_theme.md --preview "Add purple palette"

# Force - skip conflict checks
@auto_theme.md --force "Rename primary to brand"
```

---

## Example Run

```
User: @auto_theme.md "Add a purple accent palette for premium features"

Agent:
═══════════════════════════════════════════════════════════════
                     AUTO-THEME STARTED
═══════════════════════════════════════════════════════════════

[STEP 1/6] Analyzing...
  → Reading src/theme/tokens.ts...
  → Current palettes: primary, neutral, semantic
  → Change type: colors (add new palette)

[STEP 2/6] Planning...
  → New palette: purple (50-900 shades)
  → Will add light/dark variants
  → No naming conflicts detected

[STEP 3/6] Modifying tokens...
  → Adding purple palette to tokens.ts...
  → Adding semantic alias: premium → purple.500
  ✓ tokens.ts updated

[STEP 4/6] Generating...
  → Running npm run theme:build...
  ✓ Generated design-tokens.css
  ✓ Generated tailwind.theme.js

[STEP 5/6] Verifying...
  → Checking CSS variables...
  → Checking Tailwind theme...
  ✓ All tokens generated correctly

[STEP 6/6] Documenting...
  → Updating DESIGN_SYSTEM.md...
  → Adding purple palette documentation...
  ✓ Documentation updated

═══════════════════════════════════════════════════════════════
                     AUTO-THEME COMPLETE
═══════════════════════════════════════════════════════════════

Changes made to src/theme/tokens.ts:
  ✓ Added purple color palette (50-900)
  ✓ Added semantic alias: premium → purple.500

Generated files updated:
  ✓ src/theme/generated/design-tokens.css
  ✓ src/theme/generated/tailwind.theme.js

Documentation updated:
  ✓ docs/DESIGN_SYSTEM.md - Added purple palette section

New tokens available:

  CSS Variables:
    var(--color-purple-50) through var(--color-purple-900)
    var(--color-premium)

  Tailwind Classes:
    bg-purple-50 through bg-purple-900
    text-purple-50 through text-purple-900

Usage example:
  <div className="bg-purple-100 border-purple-300 text-purple-900">
    Premium feature content
  </div>
  
  <Badge className="bg-purple-500 text-white">
    Premium
  </Badge>

═══════════════════════════════════════════════════════════════
```

---

## Theme Setup for New Projects

When running on a project without existing theme:

```bash
@auto_theme.md --setup "Initialize with emerald primary, navy neutrals"
```

This creates:
1. Complete `src/theme/` directory structure
2. Full token definitions in `tokens.ts`
3. Generator script
4. Initial generated files
5. Base `DESIGN_SYSTEM.md`
6. Updates `package.json` with build scripts
