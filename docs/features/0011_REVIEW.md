# Code Review: app_truth.md alignment to source code (0011)

**Scope**: Alignment of `app_truth.md` to the current codebase per `docs/commands/plan_feature.md` and findings in `docs/features/APP_TRUTH_DIFFERENCES.md`. No application code was changed; only the SSOT document was updated.

---

## Summary of implementation quality

The updates to `app_truth.md` correctly reflect the current source. All previously documented gaps (PENDING vs NDA/KYC, migration head, Docker command, Settings route, admin API paths, design-system script reference) have been addressed. The document is consistent with:

- Backend: `config.py`, `database.py`, `main.py`, `contact.py`, `admin.py`, Alembic versions
- Frontend: `App.tsx` (AuthGuard, route wrappers), `redirect.ts`, `types/index.ts` (UserRole)
- Scripts: `rebuild.sh`, `restart.sh` (docker compose)
- Design system: existing files only (no reference to missing `check-design-system.js`)

**Plan implementation**: The implicit “plan” was to adjust app_truth to source. That has been fully implemented.

---

## Issues found

### Critical
*None.*

### Major
*None.*

### Minor

1. **~~code_review.md still references missing script~~** *(Resolved)*  
   **File**: `docs/commands/code_review.md`  
   **Detail**: The code review instructions listed `frontend/scripts/check-design-system.js` as a reference file; that script does not exist. **Fix applied**: The bullet was removed from `docs/commands/code_review.md` so the reference list matches `app_truth.md` §9.

---

## Verification against source

| app_truth claim | Source check | Result |
|-----------------|--------------|--------|
| §7 Start Dev: `docker compose up` (v2; project `niha_platform`) | `rebuild.sh` uses `docker compose`; project from compose file | ✓ |
| §7 Current head `2026_01_29_full_flow`, chain baseline→…→full_flow | `backend/alembic/versions/*.py` revision chain | ✓ |
| §7 New migrations `down_revision = "2026_01_29_full_flow"` | Latest active revision is `2026_01_29_full_flow` | ✓ |
| §8 NDA/KYC onboarding; no PENDING role | `frontend/src/types/index.ts` UserRole; `redirect.ts` getPostLoginRedirect | ✓ |
| §8 ProtectedRoute `blockRoles={['NDA']}` | `App.tsx` line 160 | ✓ |
| §8 DashboardRoute `allowedRoles={['EUA', 'ADMIN']}` | `App.tsx` line 235 | ✓ |
| §8 OnboardingRoute `allowedRoles={['NDA', 'KYC']}` | `App.tsx` line 205 | ✓ |
| §8 ApprovedRoute `allowedRoles={['APPROVED', 'FUNDING', 'AML', 'ADMIN']}` | `App.tsx` line 214 | ✓ |
| §8 Settings at `/settings`; backend `GET/PUT /api/v1/admin/settings/mail` | `App.tsx` path `/settings`; `admin.py` prefix `/admin`, routes `/settings/mail` | ✓ |
| §8 Admin contact-requests `PUT/GET .../contact-requests/{request_id}` | `admin.py` router prefix `/admin`, path params `request_id` | ✓ |
| §9 No reference to `check-design-system.js` | app_truth.md §9 table has no such row | ✓ |

---

## Recommendations

1. **~~Sync code_review.md with app_truth.md~~** *(Done)*: The `check-design-system.js` bullet was removed from `docs/commands/code_review.md`; reference list now matches `app_truth.md` §9.
2. **~~Optional: note on APP_TRUTH_DIFFERENCES.md~~** *(Done)*: A short note was added at the top of `docs/features/APP_TRUTH_DIFFERENCES.md` stating that app_truth was updated as of 0011 and that the doc is a historical record; current SSOT is `app_truth.md`.

---

## Confirmation

- **Plan fully implemented**: Yes. `app_truth.md` has been adjusted to match the current source; all targeted sections (§7, §8, §9) are aligned with code and scripts.
- **Bugs / data alignment / security / tests**: N/A (documentation-only change).
- **UI/UX and interface analysis**: N/A. This change did not add or modify UI components; it only updated the SSOT document. No design token or component review was required.

---

## UI/UX and interface analysis

**Not applicable.** This feature was limited to updating `app_truth.md`. No frontend code or UI components were modified. The updated §9 in app_truth remains the reference for future UI work and is consistent with existing design system files (`interface.md`, `DESIGN_SYSTEM.md`, `design-tokens.css`, `tailwind.config.js`, `.cursor/rules/niha-core.mdc`).
