# Agent Development System

> **Version**: 1.0.0  
> **Purpose**: Standardized, portable workflow system for application development with AI agents.

## Overview

This is a complete agent-based development system that takes you from idea to production-ready code with minimal human intervention. Copy this entire `/docs/commands/` directory to any new project to get started.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT DEVELOPMENT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ORCHESTRATORS                                  │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ auto_project │  │ auto_feature │  │  auto_theme  │  │  auto_audit  │    │
│  │ (new app)    │  │ (add feat)   │  │  (design)    │  │  (cleanup)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           AGENT COMMANDS                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   00_brief    01_plan    02_interface    03_implement              │   │
│  │                                                                     │   │
│  │   04_review   05_fix     06_docs         07_theme     08_audit     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              CORE FILES                                     │
│                                                                             │
│    ┌────────────────┐         ┌────────────────┐         ┌──────────────┐  │
│    │  app_truth.md  │         │ DESIGN_SYSTEM  │         │ tokens.ts    │  │
│    │  (SSOT)        │         │ .md            │         │ (theme)      │  │
│    └────────────────┘         └────────────────┘         └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### New Project (From Scratch)

```bash
@auto_project.md "Description of your application"
```

This runs: `brief` → `theme setup` → `first feature` (plan → interface → implement → review → fix → docs)

### New Feature (Existing Project)

```bash
@auto_feature.md "Description of the feature"
```

This runs: `plan` → `interface` → `implement` → `review` → `fix` → `docs`

### Design System Changes

```bash
@auto_theme.md "Description of theme changes"
```

This runs: `theme` workflow with token generation

### Project Audit & Cleanup

```bash
@auto_audit.md              # Audit only
@auto_audit.md --fix        # Audit + automatic fixes
```

This runs: comprehensive audit → (optional) automatic cleanup → verification

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   NEW PROJECT                          EXISTING PROJECT                     │
│   ───────────                          ────────────────                     │
│                                                                             │
│   @auto_project.md                     @auto_audit.md (recommended first)   │
│         │                                      │                            │
│         ▼                                      ▼                            │
│   ┌───────────┐                        ┌─────────────┐                      │
│   │ 00_brief  │                        │  08_audit   │                      │
│   └─────┬─────┘                        └──────┬──────┘                      │
│         │                                     │                             │
│         ▼                                     ▼                             │
│   ┌───────────┐                        Fix issues if needed                 │
│   │ 07_theme  │                               │                             │
│   │ (setup)   │                               │                             │
│   └─────┬─────┘                               │                             │
│         │                                     │                             │
│         └──────────────┬──────────────────────┘                             │
│                        │                                                    │
│                        ▼                                                    │
│                  @auto_feature.md                                           │
│                        │                                                    │
│         ┌──────────────┼──────────────┐                                     │
│         ▼              ▼              ▼                                     │
│   ┌──────────┐  ┌────────────┐  ┌───────────┐                              │
│   │ 01_plan  │  │02_interface│  │ 07_theme  │ (if new tokens)              │
│   └────┬─────┘  │ (if UI)    │  └───────────┘                              │
│        │        └─────┬──────┘                                              │
│        └──────────────┼───────────────────────────┐                         │
│                       ▼                           │                         │
│                ┌─────────────┐                    │                         │
│                │03_implement │◀───────────────────┘                         │
│                └──────┬──────┘                                              │
│                       │                                                     │
│                       ▼                                                     │
│                ┌─────────────┐                                              │
│                │ 04_review   │◀──────────┐                                  │
│                └──────┬──────┘           │                                  │
│                       │                  │                                  │
│                       ▼                  │                                  │
│              Issues found?               │                                  │
│                 │     │                  │                                  │
│              No │     │ Yes              │                                  │
│                 │     ▼                  │                                  │
│                 │  ┌──────────┐          │                                  │
│                 │  │ 05_fix   │──────────┘                                  │
│                 │  └──────────┘   (loop until clean)                        │
│                 │                                                           │
│                 ▼                                                           │
│          ┌─────────────┐                                                    │
│          │  06_docs    │                                                    │
│          └─────────────┘                                                    │
│                 │                                                           │
│                 ▼                                                           │
│          ✓ FEATURE COMPLETE                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Commands Reference

### Orchestrators (Automated Workflows)

| Command | Use Case | What It Runs |
|---------|----------|--------------|
| `@auto_project.md` | New application from scratch | 00 → 07 → (01-06 for first feature) |
| `@auto_feature.md` | Add feature to existing app | 01 → 02 → 03 → 04 → 05 → 06 |
| `@auto_theme.md` | Design system changes | 07 (with generation) |
| `@auto_audit.md` | Project health check & cleanup | 08 (+ fixes if --fix) |

### Individual Agents (Manual Control)

| Command | Purpose | Output |
|---------|---------|--------|
| `@00_brief.md` | Define project scope | `app_truth.md`, `PRODUCT_BRIEF.md` |
| `@01_plan.md` | Plan a feature | `docs/features/NNNN_PLAN.md` |
| `@02_interface.md` | Design UI/UX | `docs/features/NNNN_UI_SPEC.md` |
| `@03_implement.md` | Write code | Working implementation |
| `@04_review.md` | Review code | `docs/features/NNNN_REVIEW.md` |
| `@05_fix.md` | Fix review issues | Fixed code |
| `@06_docs.md` | Update documentation | Updated docs |
| `@07_theme.md` | Modify design tokens | Updated theme files |
| `@08_audit.md` | Audit codebase | `AUDIT_REPORT_[DATE].md` |

## Directory Structure

```
project-root/
├── app_truth.md                    # Single Source of Truth
├── docs/
│   ├── commands/                   # This agent system
│   │   ├── README.md               # This file
│   │   │
│   │   │── # Orchestrators
│   │   ├── auto_project.md         # New project automation
│   │   ├── auto_feature.md         # Feature automation
│   │   ├── auto_theme.md           # Theme automation
│   │   ├── auto_audit.md           # Audit automation
│   │   │
│   │   │── # Individual Agents
│   │   ├── 00_brief.md             # Project brief
│   │   ├── 01_plan.md              # Feature planning
│   │   ├── 02_interface.md         # UI/UX specification
│   │   ├── 03_implement.md         # Implementation
│   │   ├── 04_review.md            # Code review
│   │   ├── 05_fix.md               # Fix issues
│   │   ├── 06_docs.md              # Documentation
│   │   ├── 07_theme.md             # Design tokens
│   │   └── 08_audit.md             # Project audit
│   │
│   ├── features/                   # Feature documentation
│   │   ├── 0001_PLAN.md
│   │   ├── 0001_UI_SPEC.md
│   │   ├── 0001_REVIEW.md
│   │   └── ...
│   │
│   ├── PRODUCT_BRIEF.md            # Product description
│   ├── DESIGN_SYSTEM.md            # Design documentation
│   └── AUDIT_REPORT_*.md           # Audit reports
│
└── src/
    └── theme/                      # Centralized design tokens
        ├── tokens.ts               # Single source of truth
        ├── index.ts                # Exports
        ├── scripts/
        │   └── generate.ts         # Token generator
        └── generated/
            ├── design-tokens.css   # Generated CSS
            └── tailwind.theme.js   # Generated Tailwind
```

## Core Principles

### 1. Single Source of Truth (SSOT)

- **Project config**: `app_truth.md`
- **Design tokens**: `src/theme/tokens.ts`
- **Feature history**: `docs/features/`

All agents reference these files. All changes update these files.

### 2. No Mock Data

All implementations work with real data. No placeholders, no dummy values.

### 3. No Hard-Coded Values

- Design values → Design tokens
- Configuration → Environment variables  
- Constants → Config files

### 4. Review-Fix Loop

Code is not complete until review passes with zero Critical/Major issues.

### 5. Document Everything

Every feature has: Plan → UI Spec (if UI) → Review

### 6. Regular Audits

Run `@auto_audit.md` regularly to maintain code health.

## Human Intervention Points

The system pauses for human input only when:

1. **Ambiguous requirements** - Description unclear
2. **Breaking changes** - Would break existing functionality
3. **Security decisions** - Auth/authz patterns
4. **After 3 fix cycles** - Issues persist
5. **Conflicting conventions** - Need to choose standard
6. **Secrets found** - Security concern

## Installation

### For New Projects

```bash
# 1. Create project directory
mkdir my-project && cd my-project

# 2. Copy agent system
cp -r /path/to/docs/commands ./docs/commands

# 3. Start with auto_project
@auto_project.md "Your app description"
```

### For Existing Projects

```bash
# 1. Copy agent system
cp -r /path/to/docs/commands ./docs/commands

# 2. Run audit first
@auto_audit.md

# 3. Create app_truth.md if missing
@00_brief.md "Your existing app description"

# 4. Proceed with features
@auto_feature.md "New feature"
```

## Recommended Workflow

### Daily Development

```bash
# Start new feature
@auto_feature.md "Feature description"
```

### Weekly Maintenance

```bash
# Quick health check
@auto_audit.md --quick
```

### Monthly Cleanup

```bash
# Full audit with fixes
@auto_audit.md --fix
```

### Before Major Release

```bash
# Comprehensive audit
@auto_audit.md

# Review report, fix critical issues
# Then proceed with release
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial release with 8 agents + 4 orchestrators |

---

**Next**: Start with `@auto_project.md` for new projects or `@auto_audit.md` for existing ones.
