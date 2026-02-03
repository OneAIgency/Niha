# Agent 08: Audit Project

> **Purpose**: Comprehensive audit of existing codebase and documentation to identify inconsistencies, conflicts, stale files, and technical debt.

## When to Use

- Taking over an existing project
- Before major refactoring
- Periodic health check (quarterly recommended)
- After multiple features without cleanup
- Before onboarding new team members
- When experiencing unexplained bugs or confusion

## Usage

```bash
@08_audit.md
```

**With specific focus:**
```bash
@08_audit.md --focus=docs "Audit documentation only"
@08_audit.md --focus=theme "Audit design system only"
@08_audit.md --focus=code "Audit code only"
@08_audit.md --focus=deps "Audit dependencies only"
```

## What This Audits

```
┌─────────────────────────────────────────────────────────────┐
│                      AUDIT CATEGORIES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DOCUMENTATION        Stale docs, conflicts, gaps        │
│  2. CODE CONSISTENCY     Patterns, naming, structure        │
│  3. DESIGN SYSTEM        Token usage, hard-coded values     │
│  4. DEPENDENCIES         Unused, outdated, duplicates       │
│  5. CONFIGURATION        Env vars, configs, secrets         │
│  6. FILE HYGIENE         Dead code, unused files            │
│  7. APP_TRUTH SYNC       Reality vs documented state        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

Execute a comprehensive audit across all categories, then produce a detailed report with prioritized action items.

---

### PHASE 1: DOCUMENTATION AUDIT

**Check these files exist and are current:**

```
Required files:
├── app_truth.md              # Single source of truth
├── README.md                 # Project overview
├── docs/
│   ├── PRODUCT_BRIEF.md      # Product description
│   ├── DESIGN_SYSTEM.md      # Design documentation
│   ├── commands/             # Agent system
│   └── features/             # Feature history
└── .env.example              # Environment template
```

**For each documentation file, check:**

1. **Staleness indicators:**
   - Last modified date vs code changes
   - References to removed features
   - Outdated version numbers
   - Dead links (internal and external)
   - References to non-existent files/functions

2. **Conflicts:**
   - Contradictions between docs
   - Multiple docs describing same thing differently
   - `app_truth.md` vs actual implementation

3. **Gaps:**
   - Undocumented features
   - Missing API documentation
   - Missing setup instructions
   - Undocumented environment variables

**Output:**
```
DOCS_ISSUES = [
  { file: "...", issue: "stale", detail: "References removed feature X" },
  { file: "...", issue: "conflict", detail: "Contradicts app_truth.md §7" },
  { file: "...", issue: "gap", detail: "Missing docs for /api/v1/deposits" },
]
```

---

### PHASE 2: CODE CONSISTENCY AUDIT

**Check for pattern violations:**

1. **Naming conventions** (from `app_truth.md` §6):
   ```
   Scan all files for:
   - Inconsistent file naming (kebab-case vs camelCase vs snake_case)
   - Inconsistent function naming
   - Inconsistent component naming
   - Inconsistent variable naming
   ```

2. **Project structure violations:**
   ```
   Compare actual structure to app_truth.md §5:
   - Files in wrong directories
   - Unexpected directories
   - Missing expected directories
   ```

3. **Code pattern inconsistencies:**
   ```
   - Different error handling patterns
   - Different API call patterns
   - Different state management approaches
   - Different component structures
   ```

4. **Duplicate code:**
   ```
   - Similar functions in different files
   - Copy-pasted components with minor changes
   - Repeated utility functions
   ```

**Output:**
```
CODE_ISSUES = [
  { file: "...", issue: "naming", detail: "Uses camelCase, project uses kebab-case" },
  { file: "...", issue: "structure", detail: "Component in wrong directory" },
  { file: "...", issue: "duplicate", detail: "Similar to utils/format.ts" },
]
```

---

### PHASE 3: DESIGN SYSTEM AUDIT

**Check design token compliance:**

1. **Hard-coded values scan:**
   ```
   Search all frontend files for:
   - Hex colors (#xxx, #xxxxxx)
   - RGB/RGBA values
   - Hard-coded pixel values for spacing
   - Hard-coded font sizes
   - Inline styles with design values
   ```

2. **Deprecated token usage:**
   ```
   - Using old token names
   - Using removed tokens
   - Using non-standard Tailwind classes (slate-*, gray-*)
   ```

3. **Token definition issues:**
   ```
   - Tokens defined but never used
   - Tokens used but not defined
   - Duplicate token definitions
   - Inconsistent token values (same color, different names)
   ```

4. **Theme support:**
   ```
   - Components missing dark mode support
   - Hard-coded theme-specific values
   - Inconsistent dark mode implementation
   ```

**Output:**
```
THEME_ISSUES = [
  { file: "...", line: N, issue: "hard-coded", detail: "color: #10b981" },
  { file: "...", line: N, issue: "deprecated", detail: "Uses slate-500" },
  { file: "...", issue: "no-dark-mode", detail: "Component lacks dark: variants" },
]
```

---

### PHASE 4: DEPENDENCY AUDIT

**Check package health:**

1. **Unused dependencies:**
   ```
   For each dependency in package.json/requirements.txt:
   - Search codebase for imports
   - Flag if never imported
   ```

2. **Outdated dependencies:**
   ```
   Run:
   - npm outdated (frontend)
   - pip list --outdated (backend)
   
   Flag:
   - Major version behind
   - Security vulnerabilities
   ```

3. **Duplicate/conflicting:**
   ```
   - Multiple packages doing same thing
   - Conflicting versions
   - Peer dependency warnings
   ```

4. **Missing from package.json:**
   ```
   - Imports that aren't in dependencies
   - Relying on transitive dependencies
   ```

**Output:**
```
DEP_ISSUES = [
  { package: "lodash", issue: "unused", detail: "No imports found" },
  { package: "axios", issue: "outdated", detail: "1.2.0 → 1.6.0 available" },
  { package: "moment", issue: "deprecated", detail: "Use date-fns instead" },
]
```

---

### PHASE 5: CONFIGURATION AUDIT

**Check configuration hygiene:**

1. **Environment variables:**
   ```
   Compare:
   - .env.example vs actual usage in code
   - Documented env vars vs used env vars
   - Sensitive values accidentally committed
   ```

2. **Config file consistency:**
   ```
   - tsconfig.json settings
   - eslint/prettier configs
   - tailwind.config.js
   - docker-compose.yml
   - vite.config.ts
   ```

3. **Secrets detection:**
   ```
   Scan for accidentally committed:
   - API keys
   - Database credentials
   - JWT secrets
   - Private keys
   ```

**Output:**
```
CONFIG_ISSUES = [
  { issue: "missing-env", detail: "REDIS_URL used but not in .env.example" },
  { issue: "secret-exposed", detail: "API key found in config.ts", severity: "CRITICAL" },
  { issue: "config-mismatch", detail: "tsconfig strict:false but docs say strict:true" },
]
```

---

### PHASE 6: FILE HYGIENE AUDIT

**Find dead/unused files:**

1. **Orphaned files:**
   ```
   - Components never imported
   - Utilities never used
   - Styles never applied
   - Tests for removed code
   ```

2. **Backup/temp files:**
   ```
   - *.bak files
   - *.old files
   - *.tmp files
   - .DS_Store
   - Thumbs.db
   ```

3. **Generated files in git:**
   ```
   - node_modules accidentally committed
   - Build artifacts
   - Generated CSS/JS that should be gitignored
   ```

4. **Empty/stub files:**
   ```
   - Files with only comments
   - Files with TODO placeholders
   - Empty directories
   ```

**Output:**
```
FILE_ISSUES = [
  { file: "src/components/OldButton.tsx", issue: "orphan", detail: "Never imported" },
  { file: "src/utils/helper.bak", issue: "backup", detail: "Should be deleted" },
  { file: "dist/", issue: "generated", detail: "Should be in .gitignore" },
]
```

---

### PHASE 7: APP_TRUTH SYNC AUDIT

**Verify app_truth.md matches reality:**

1. **Section-by-section verification:**

   **§2 Technology Stack:**
   - Versions match package.json/requirements.txt?
   - Listed technologies actually used?
   
   **§3 Infrastructure & Ports:**
   - Ports match docker-compose.yml?
   - URLs match actual configuration?
   
   **§5 Project Structure:**
   - Directory structure matches reality?
   - All listed directories exist?
   
   **§7 API Conventions:**
   - Documented endpoints exist?
   - Response formats match documentation?
   
   **§8 Routes/Database:**
   - All routes documented?
   - Database schema matches?
   
   **§9 UI/UX Standards:**
   - Design tokens location correct?
   - Conventions being followed?

**Output:**
```
SYNC_ISSUES = [
  { section: "§2", issue: "version-mismatch", detail: "Says React 18, actually 18.2.0" },
  { section: "§3", issue: "port-wrong", detail: "Says 5173, docker uses 3000" },
  { section: "§7", issue: "missing-endpoint", detail: "/api/v1/deposits not documented" },
]
```

---

### PHASE 8: GENERATE REPORT

Create comprehensive audit report:

**Write to:** `docs/AUDIT_REPORT_[DATE].md`

```markdown
# Project Audit Report

> **Date**: [Date]
> **Project**: [Name from app_truth.md]
> **Audited by**: AI Agent

## Executive Summary

| Category | Issues Found | Critical | Major | Minor |
|----------|-------------|----------|-------|-------|
| Documentation | X | - | Y | Z |
| Code Consistency | X | - | Y | Z |
| Design System | X | - | Y | Z |
| Dependencies | X | A | Y | Z |
| Configuration | X | B | Y | Z |
| File Hygiene | X | - | Y | Z |
| App Truth Sync | X | - | Y | Z |
| **TOTAL** | **XX** | **C** | **YY** | **ZZ** |

### Health Score: [X/100]

```
██████████░░░░░░░░░░ 50/100 - Needs Attention
```

## Critical Issues (Fix Immediately)

[List all critical issues with file paths and specific fixes]

## Major Issues (Fix Soon)

[List all major issues organized by category]

## Minor Issues (Fix When Possible)

[List all minor issues]

## Recommended Actions

### Immediate (This Sprint)
1. [ ] [Action 1]
2. [ ] [Action 2]

### Short-term (This Month)
1. [ ] [Action 1]
2. [ ] [Action 2]

### Long-term (This Quarter)
1. [ ] [Action 1]
2. [ ] [Action 2]

## Files to Delete

```
[List of files safe to delete]
```

## Files to Update

```
[List of files needing updates with specific changes]
```

## Documentation Gaps to Fill

```
[List of missing documentation]
```

---

## Detailed Findings

### 1. Documentation Audit

[Detailed findings...]

### 2. Code Consistency Audit

[Detailed findings...]

[...etc for each category...]

---

## Appendix: All Issues

[Complete list of every issue found, sortable/filterable]
```

---

### COMPLETION

**Output summary:**

```
═══════════════════════════════════════════════════════════════
                      AUDIT COMPLETE
═══════════════════════════════════════════════════════════════

Project: [Name]
Audit Date: [Date]

Health Score: [XX/100]

Issues Found:
  🔴 Critical:  X (fix immediately)
  🟠 Major:     Y (fix soon)
  🟡 Minor:     Z (fix when possible)

Top 5 Priority Actions:
  1. [Most critical action]
  2. [Second priority]
  3. [Third priority]
  4. [Fourth priority]
  5. [Fifth priority]

Files to delete: N
Files to update: M
Documentation gaps: K

Full report: docs/AUDIT_REPORT_[DATE].md

Next steps:
  → Review report
  → Create cleanup tasks
  → Run @auto_feature.md for fixes if needed

═══════════════════════════════════════════════════════════════
```

---

## Human Intervention Points

**Pauses for:**
1. **Secrets found** - Immediate security concern
2. **Major structural issues** - Need architectural decisions
3. **Conflicting conventions** - Need to choose which to keep

---

## Flags

```bash
# Focus on specific area
@08_audit.md --focus=docs
@08_audit.md --focus=theme
@08_audit.md --focus=code
@08_audit.md --focus=deps
@08_audit.md --focus=config
@08_audit.md --focus=files
@08_audit.md --focus=sync

# Quick audit (critical issues only)
@08_audit.md --quick

# Generate fix tasks automatically
@08_audit.md --generate-tasks

# Compare with previous audit
@08_audit.md --compare=docs/AUDIT_REPORT_2024-01-01.md
```

---

## Audit Schedule Recommendation

| Frequency | Audit Type | Command |
|-----------|------------|---------|
| Weekly | Quick (critical only) | `@08_audit.md --quick` |
| Monthly | Full audit | `@08_audit.md` |
| Quarterly | Full + comparison | `@08_audit.md --compare=...` |
| Before release | Full audit | `@08_audit.md` |
| After major feature | Focused | `@08_audit.md --focus=code,docs` |
