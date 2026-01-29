# Orchestrator: Auto-Audit

> **Purpose**: Complete project audit with optional automatic cleanup of identified issues.

## Usage

```bash
@auto_audit.md
```

**With automatic cleanup:**
```bash
@auto_audit.md --fix
```

**Focus on specific areas:**
```bash
@auto_audit.md --focus=docs,theme
@auto_audit.md --focus=code --fix
```

## What This Does

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-AUDIT SEQUENCE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PHASE 1: AUDIT                                         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  08_audit    Comprehensive project analysis            │ │
│  │              → Generates AUDIT_REPORT_[DATE].md        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PHASE 2: CLEANUP (if --fix flag)                       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Delete stale files                                    │ │
│  │  Update outdated docs                                  │ │
│  │  Fix design token violations                           │ │
│  │  Sync app_truth.md                                     │ │
│  │  Remove unused dependencies                            │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PHASE 3: VERIFICATION                                  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Re-audit to confirm fixes                             │ │
│  │  Generate before/after comparison                      │ │
│  │  Update documentation                                  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instructions for AI Agent

---

### PHASE 1: COMPREHENSIVE AUDIT

**Execute**: `@08_audit.md`

**Actions**:
1. Run all 7 audit categories
2. Generate detailed report
3. Categorize issues by severity and type

**Output**:
- `AUDIT_REPORT` = `docs/AUDIT_REPORT_[DATE].md`
- `CRITICAL_ISSUES` = [list]
- `MAJOR_ISSUES` = [list]
- `MINOR_ISSUES` = [list]
- `SAFE_TO_DELETE` = [file list]
- `NEEDS_UPDATE` = [file list]
- `HEALTH_SCORE` = X/100

**Present summary to user:**

```
═══════════════════════════════════════════════════════════════
                    AUDIT RESULTS SUMMARY
═══════════════════════════════════════════════════════════════

Health Score: [XX/100]

Issues by Category:
  Documentation:    X issues (Y fixable automatically)
  Code Consistency: X issues (Y fixable automatically)  
  Design System:    X issues (Y fixable automatically)
  Dependencies:     X issues (Y fixable automatically)
  Configuration:    X issues (Y fixable automatically)
  File Hygiene:     X issues (Y fixable automatically)
  App Truth Sync:   X issues (Y fixable automatically)

Automatic Fixes Available:
  ✓ Delete N stale/unused files
  ✓ Fix M hard-coded design values
  ✓ Update K documentation references
  ✓ Remove L unused dependencies
  ✓ Sync app_truth.md (P sections)

Manual Review Required:
  ⚠ X architectural decisions
  ⚠ Y security concerns
  ⚠ Z breaking changes

Full report: docs/AUDIT_REPORT_[DATE].md

═══════════════════════════════════════════════════════════════
```

**If `--fix` flag NOT provided:**
```
To apply automatic fixes, run:
  @auto_audit.md --fix

Or fix manually using the report as guide.
```
**STOP HERE if no --fix flag**

---

### PHASE 2: AUTOMATIC CLEANUP (if --fix)

Execute fixes in safe order:

#### Step 2.1: File Cleanup (Safest)

**Delete files identified as:**
- Backup files (*.bak, *.old, *.tmp)
- OS files (.DS_Store, Thumbs.db)
- Orphaned files (never imported/used)

**Before deleting each file:**
```
Log: "Deleting [file]: [reason]"
```

**Skip if:**
- File modified in last 7 days (might be work in progress)
- File has TODO/FIXME comments (intentional placeholder)

#### Step 2.2: Design Token Fixes

**For each hard-coded value found:**

1. **Colors:**
   ```tsx
   // Before
   style={{ color: '#10b981' }}
   
   // After
   className="text-emerald-500"
   ```

2. **Spacing:**
   ```tsx
   // Before
   style={{ padding: '16px' }}
   
   // After
   className="p-4"
   ```

3. **Deprecated classes:**
   ```tsx
   // Before
   className="bg-slate-500"
   
   // After
   className="bg-navy-500"
   ```

**Verify each fix:**
- TypeScript still compiles
- No visual regression (log for manual check)

#### Step 2.3: Documentation Updates

**Fix stale references:**
- Update version numbers
- Fix dead internal links
- Remove references to deleted files
- Update file paths that changed

**Sync app_truth.md:**
- Update §2 versions from package.json
- Update §3 ports from docker-compose.yml
- Update §5 structure from actual directories
- Add missing documented endpoints to §7

#### Step 2.4: Dependency Cleanup

**For unused dependencies:**
```bash
npm uninstall [package]  # or
pip uninstall [package]
```

**Log each removal:**
```
Removed: lodash (unused - no imports found)
Removed: moment (deprecated - migrated to date-fns)
```

**Skip if:**
- Dependency is peer dependency
- Dependency used in config files
- Dependency used in scripts

#### Step 2.5: Configuration Sync

**Update .env.example:**
- Add missing variables found in code
- Remove variables no longer used
- Add comments for clarity

---

### PHASE 3: VERIFICATION

**Re-run audit to verify fixes:**

```bash
@08_audit.md --quick
```

**Compare results:**
```
Before Fix:
  Health Score: 45/100
  Critical: 3
  Major: 12
  Minor: 28

After Fix:
  Health Score: 78/100  (+33)
  Critical: 0  (-3)
  Major: 4  (-8)
  Minor: 15  (-13)

Remaining issues require manual attention.
```

**Generate cleanup summary:**

```
═══════════════════════════════════════════════════════════════
                    AUTO-CLEANUP COMPLETE
═══════════════════════════════════════════════════════════════

Health Score: 45/100 → 78/100 (+33 improvement)

Actions Taken:

  Files Deleted: 12
    - src/components/OldButton.tsx (orphan)
    - src/utils/helper.bak (backup)
    - ...

  Design Fixes: 24
    - Fixed 18 hard-coded colors
    - Fixed 4 hard-coded spacing
    - Replaced 2 deprecated classes

  Documentation Updates: 8
    - Updated app_truth.md (3 sections)
    - Fixed 5 dead links

  Dependencies Removed: 3
    - lodash (unused)
    - moment (deprecated)
    - query-string (unused)

  Configuration Updates: 2
    - Added 4 vars to .env.example
    - Removed 2 stale vars

Remaining Issues (Manual Required):

  🟠 Major: 4
    - [Issue requiring human decision]
    - [Architectural choice needed]
    
  🟡 Minor: 15
    - [List of minor issues]

Reports:
  - Full audit: docs/AUDIT_REPORT_[DATE].md
  - Cleanup log: docs/CLEANUP_LOG_[DATE].md

═══════════════════════════════════════════════════════════════
```

---

## Human Intervention Points

**Always pauses for:**

1. **Before deleting any file** (in batch):
   ```
   About to delete 12 files. Review list?
   [Show list]
   Proceed? (yes/no/review each)
   ```

2. **Security issues found:**
   ```
   ⚠️ SECURITY: Found potential secret in config.ts
   This requires immediate manual review.
   ```

3. **Breaking changes:**
   ```
   ⚠️ This fix may break: [component/feature]
   Proceed anyway? (yes/no/skip)
   ```

4. **Conflicting conventions:**
   ```
   Found 2 different naming patterns:
   - camelCase (23 files)
   - kebab-case (15 files)
   Which should be standard? (camel/kebab/skip)
   ```

---

## Safety Rules

1. **Never delete without confirmation** (batch confirm OK)
2. **Never modify files in .git/**
3. **Never remove dependencies used in production code**
4. **Always create backup before bulk changes** (git stash or branch)
5. **Stop immediately if build breaks**

---

## Flags

```bash
# Audit only, no fixes
@auto_audit.md

# Audit + automatic fixes
@auto_audit.md --fix

# Focus on specific areas
@auto_audit.md --focus=docs
@auto_audit.md --focus=theme
@auto_audit.md --focus=code
@auto_audit.md --focus=deps
@auto_audit.md --focus=all --fix

# Aggressive cleanup (less confirmation)
@auto_audit.md --fix --aggressive

# Dry run (show what would be done)
@auto_audit.md --fix --dry-run

# Generate tasks instead of fixing
@auto_audit.md --generate-tasks
```

---

## Integration with Feature Development

**Recommended workflow:**

```bash
# Before starting new feature
@auto_audit.md --quick

# If issues found
@auto_audit.md --fix

# Then proceed with feature
@auto_feature.md "New feature description"
```

**Or include in CI/CD:**
```yaml
# In GitHub Actions / GitLab CI
- name: Project Health Check
  run: |
    # Run audit, fail if critical issues
    npm run audit:check
```

---

## Example Full Run

```
User: @auto_audit.md --fix

Agent:
═══════════════════════════════════════════════════════════════
                    AUTO-AUDIT STARTED
═══════════════════════════════════════════════════════════════

[PHASE 1] Running comprehensive audit...

  [1/7] Documentation audit...
        → 3 stale docs, 2 dead links, 1 gap
  
  [2/7] Code consistency audit...
        → 5 naming violations, 2 duplicates
  
  [3/7] Design system audit...
        → 18 hard-coded colors, 4 deprecated classes
  
  [4/7] Dependency audit...
        → 3 unused, 2 outdated
  
  [5/7] Configuration audit...
        → 4 missing env vars, 0 secrets (good!)
  
  [6/7] File hygiene audit...
        → 8 orphans, 4 backups, 0 generated
  
  [7/7] App truth sync...
        → 3 sections outdated

  ✓ Audit complete: docs/AUDIT_REPORT_2024-01-15.md

═══════════════════════════════════════════════════════════════
                    AUDIT RESULTS
═══════════════════════════════════════════════════════════════

Health Score: 52/100

  🔴 Critical: 0
  🟠 Major: 8
  🟡 Minor: 34

Automatic fixes available for 36 issues.
4 issues require manual review.

Proceed with automatic fixes? (yes/no/review)

User: yes

[PHASE 2] Applying fixes...

  [1/5] Cleaning files...
        → Deleting 12 files...
        ✓ Deleted: src/components/OldFeature.tsx
        ✓ Deleted: src/utils/temp.bak
        ... (10 more)

  [2/5] Fixing design tokens...
        → Processing 22 violations...
        ✓ Fixed: Button.tsx line 45 (#10b981 → emerald-500)
        ✓ Fixed: Card.tsx line 23 (slate-500 → navy-500)
        ... (20 more)

  [3/5] Updating documentation...
        → Fixing 5 references...
        ✓ Fixed: README.md dead link
        ✓ Fixed: DESIGN_SYSTEM.md version
        ... (3 more)

  [4/5] Cleaning dependencies...
        → Removing 3 packages...
        ✓ Removed: lodash
        ✓ Removed: moment  
        ✓ Removed: query-string

  [5/5] Syncing configuration...
        → Updating .env.example...
        → Updating app_truth.md...
        ✓ Synced 3 sections

[PHASE 3] Verifying fixes...

  Running quick audit...
  
  Before: 52/100
  After:  84/100 (+32)

═══════════════════════════════════════════════════════════════
                    AUTO-AUDIT COMPLETE
═══════════════════════════════════════════════════════════════

Health Score: 52 → 84 (+32 improvement)

Fixed automatically: 36 issues
  - 12 files deleted
  - 22 design tokens fixed
  - 5 doc references updated
  - 3 dependencies removed
  - 3 config sections synced

Remaining (manual): 4 issues
  - M1: Choose naming convention (camel vs kebab)
  - M2: Decide on state management pattern
  - m1: Update old screenshots in docs
  - m2: Review commented-out code in api.ts

Full reports:
  - docs/AUDIT_REPORT_2024-01-15.md
  - docs/CLEANUP_LOG_2024-01-15.md

═══════════════════════════════════════════════════════════════
```
