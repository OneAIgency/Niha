# Agent 00: Project Brief

> **Purpose**: Define project scope, architecture, and establish the Single Source of Truth.

## When to Use

- Starting a **new project** from scratch
- Major pivot or rewrite of existing project
- First-time setup of agent system on existing codebase

## Usage

```bash
@00_brief.md "Description of your application"
```

**Example:**
```bash
@00_brief.md "A carbon credit trading platform supporting EU ETS (EUA) and Chinese allowances (CEA) with real-time market data, order book, and settlement workflows"
```

## Instructions for AI Agent

### Step 1: Gather Requirements

From the user's description, extract:

1. **Core Purpose** - What problem does this solve?
2. **Target Users** - Who will use this?
3. **Key Features** - What are the main capabilities?
4. **Technical Constraints** - Any specific requirements?

If the description is insufficient, ask **up to 5 clarifying questions**:

```
Before I create the project brief, I need a few clarifications:

1. [Question about scope/features]
2. [Question about users/personas]
3. [Question about technical requirements]
...
```

### Step 2: Determine Technology Stack

Based on requirements, recommend appropriate stack:

**Frontend Options:**
- React + TypeScript + Vite (recommended for SPAs)
- Next.js (for SSR/SSG needs)
- Vue + Nuxt (alternative)
- Plain HTML/CSS/JS (simple sites)

**Backend Options:**
- Python + FastAPI (recommended for APIs)
- Node.js + Express (JavaScript ecosystem)
- Go + Gin (high performance)
- Django (full-featured)

**Database Options:**
- PostgreSQL (recommended for relational)
- MongoDB (document store)
- SQLite (simple/embedded)
- Redis (caching/sessions)

**Infrastructure:**
- Docker + Docker Compose (recommended)
- Kubernetes (large scale)
- Serverless (AWS Lambda, Vercel)

### Step 3: Create Product Brief

Write to: `docs/PRODUCT_BRIEF.md`

```markdown
# [Project Name] - Product Brief

## Overview
[2-3 sentences describing the product]

## Target Audience
[Who uses this and why]

## Core Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]
...

## Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | [Tech] | [Why] |
| Backend | [Tech] | [Why] |
| Database | [Tech] | [Why] |
| Infrastructure | [Tech] | [Why] |

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2]
```

### Step 4: Create Application Truth

Write to: `app_truth.md` (project root)

This is the **Single Source of Truth** for the entire project. All agents reference this file.

```markdown
# APP TRUTH - [Project Name]

> **Purpose**: Single Source of Truth (SSOT) for project configuration, architecture, and standards.
> **Updated**: [Date]

## 1. Project Identity

- **Name**: [Project Name]
- **Version**: 0.1.0
- **Description**: [One-line description]

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | [e.g., React] | [e.g., 18.x] |
| Backend | [e.g., FastAPI] | [e.g., 0.100+] |
| Database | [e.g., PostgreSQL] | [e.g., 15] |
| Cache | [e.g., Redis] | [e.g., 7] |
| Infrastructure | [e.g., Docker] | - |

## 3. Infrastructure & Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | [e.g., 5173] | http://localhost:5173 |
| Backend | [e.g., 8000] | http://localhost:8000 |
| Database | [e.g., 5432] | postgresql://... |

## 4. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Database connection string |
| SECRET_KEY | Yes | Application secret |
| [OTHER] | [Yes/No] | [Description] |

## 5. Project Structure

```
project-root/
├── frontend/           # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── theme/      # Centralized design tokens
│   │   └── utils/
│   └── package.json
├── backend/            # Backend API
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   └── requirements.txt
├── docs/
│   ├── commands/       # Agent system
│   └── features/       # Feature documentation
├── app_truth.md        # This file
└── docker-compose.yml
```

## 6. Coding Standards

### Naming Conventions
- **Files**: kebab-case (e.g., `user-service.ts`)
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Database**: snake_case (e.g., `user_id`, `created_at`)

### Code Style
- [Frontend linter]: ESLint + Prettier
- [Backend linter]: [e.g., Ruff, Black]
- Max line length: 100 characters
- Indentation: 2 spaces (frontend), 4 spaces (backend)

## 7. API Conventions

### Endpoints
- RESTful: `GET/POST/PUT/DELETE /api/v1/resource`
- Response format: `{ data: T, error?: string }`

### Error Handling
- HTTP status codes for errors
- Structured error responses
- Logging with context

## 8. Database Conventions

### Tables
- Primary key: `id` (UUID or serial)
- Timestamps: `created_at`, `updated_at`
- Soft delete: `deleted_at` (optional)

### Migrations
- Tool: [e.g., Alembic, Prisma]
- Naming: `YYYY_MM_DD_description`

## 9. UI/UX & Design System

### Design Token Location
| Purpose | File |
|---------|------|
| Token definitions | `src/theme/tokens.ts` |
| Generated CSS | `src/theme/generated/design-tokens.css` |
| Tailwind config | `src/theme/generated/tailwind.theme.js` |
| Documentation | `docs/DESIGN_SYSTEM.md` |

### Rules
- **No hard-coded colors** - Use design tokens
- **No hard-coded spacing** - Use spacing scale
- **Support dark mode** - All components must work in both themes
- **Mobile-first** - Design for mobile, enhance for desktop

### Color Palette
- Primary: [Color name and purpose]
- Neutral: [Color name and purpose]
- Semantic: success, warning, error, info

## 10. Authentication & Security

[Define auth patterns, roles, permissions]

## 11. Operational Commands

```bash
# Development
docker compose up          # Start all services
npm run dev               # Frontend only
npm run theme:build       # Regenerate design tokens

# Testing
npm run test              # Frontend tests
pytest                    # Backend tests

# Production
docker compose -f docker-compose.prod.yml up
```

## 12. Deployment

[CI/CD, hosting, environments]

---

**Note**: This file is the source of truth. All agents reference it. Update it when architecture changes.
```

### Step 5: Create Initial Directory Structure

Create these directories and placeholder files:

```
docs/
├── commands/           # Already exists (this system)
├── features/           # For feature documentation
│   └── .gitkeep
└── DESIGN_SYSTEM.md    # Placeholder for design docs
```

For frontend projects, also create:
```
src/theme/
├── tokens.ts           # Design token definitions
├── generated/          # Generated files (gitignore internals)
│   └── .gitkeep
└── scripts/
    └── generate.ts     # Token generator script
```

### Step 6: Output Summary

```
═══════════════════════════════════════════════════════════════
                    PROJECT BRIEF COMPLETE
═══════════════════════════════════════════════════════════════

Project: [Project Name]
Stack: [Frontend] + [Backend] + [Database]

Files created:
  ✓ docs/PRODUCT_BRIEF.md
  ✓ app_truth.md
  ✓ docs/features/ (directory)
  ✓ src/theme/ (directory, if frontend)

Next steps:
  1. Review app_truth.md and adjust if needed
  2. Run @auto_feature.md for first feature
     OR
  2. Run @01_plan.md for manual planning

═══════════════════════════════════════════════════════════════
```

## Output Files

| File | Purpose |
|------|---------|
| `docs/PRODUCT_BRIEF.md` | High-level product description |
| `app_truth.md` | Technical SSOT (referenced by all agents) |

## Next Agent

→ `@01_plan.md` - Plan the first feature
