# Code Review: Contact requests list values and view modal completeness (0007)

**Plan:** [0007_PLAN.md](./0007_PLAN.md)  
**Review date:** 2026-01-29

---

## Summary of implementation quality

The feature is **correctly implemented** and matches the plan. The Contact Requests list shows Entity and Name from each request with appropriate fallbacks, the View button `aria-label` uses a safe fallback so it never shows "undefined", and the View modal displays all contact request fields in a consistent layout with a clearly labeled NDA PDF link. Code uses theme tokens only (navy, Typography), respects existing patterns, and aligns with `app_truth.md` and the design system. No critical or major issues were found.

---

## Plan implementation confirmation

| Requirement | Status | Notes |
|-------------|--------|--------|
| List: show **Entity** value after "ENTITY:" | Done | `ContactRequestsTab.tsx` L116: `request.entity_name ?? '—'` |
| List: show **Name** value (not "—" when data exists) | Done | L124: `request.contact_name \|\| '—'` |
| Fix View button `aria-label` when entity name missing | Done | L145: `entity_name ?? contact_email ?? id ?? 'contact request'` |
| Modal: show **all** contact request fields | Done | `ContactRequestViewModal.tsx`: ID, Entity, Name, Email, Position, Request type, Status, NDA file name, Submitter IP, Notes, Submitted |
| Modal: theme tokens only (navy, Typography) | Done | Uses `Typography`, `border-navy-*`, `text-navy-*`, `bg-navy-*`, `focus:ring-emerald-500` |
| Modal: NDA as clear **link** for verification | Done | L204–206: "Link to attached PDF for verification"; styled link with FileText + Download icons |
| No backend/API changes | N/A | Plan stated none required; mapping in `BackofficeOnboardingPage.tsx` L76–88 passes `entity_name` and `contact_name` |

---

## Issues found

### Critical
- None.

### Major
- None.

### Minor (addressed)

1. **Modal NDA control semantics** — **Fixed.**  
   **File:** `frontend/src/components/backoffice/ContactRequestViewModal.tsx`  
   Replaced `<a href="#">` with `<button type="button">` styled as a link; added `disabled={downloadLoading}` and `disabled:opacity-50 disabled:cursor-not-allowed` for loading state.

2. **No dedicated tests for Contact Requests UI** — **Fixed.**  
   Added `frontend/src/components/backoffice/__tests__/ContactRequestViewModal.test.tsx` (9 tests: render when open/closed, all fields, NDA section and download button, close, loading state, IP lookup). Added `frontend/src/components/backoffice/__tests__/ContactRequestsTab.test.tsx` (9 tests: empty state, loading, entity/name display, fallbacks for missing entity/name, View button aria-label fallbacks, open view modal).

---

## Data alignment and API

- **Backend:** `GET /admin/contact-requests` returns `data[]` with `entity_name`, `contact_name`, and all other fields in snake_case (`backend/app/api/v1/admin.py` L89–105). WebSocket `new_request` / `request_updated` use the same shape.
- **Frontend types:** `ContactRequestResponse` in `frontend/src/types/index.ts` (L189–201) and `ContactRequest` in `frontend/src/types/backoffice.ts` include `entity_name`, `contact_name` (optional). No mismatch.
- **Mapping:** `BackofficeOnboardingPage.tsx` (L76–88) maps `realtimeContactRequests` to `ContactRequest[]` with `entity_name` and `contact_name` passed through. `useBackofficeRealtime` stores API `response.data` (array) in the store; list and modal consume the same objects. No nested `{ data: {} }` confusion.

---

## app_truth.md and design system

- **§8 (Backoffice, Contact/NDA):** Contact/NDA response shape and WebSocket payload match; admin contact-requests and mapping are consistent with app_truth.
- **§9 (UI/UX & design system):**  
  - No hard-coded hex/RGB or `slate-*`/`gray-*` in `ContactRequestsTab.tsx` or `ContactRequestViewModal.tsx`.  
  - Components use Tailwind navy/emerald tokens and `Typography` variants.  
  - List rows use `.card_contact_request_list` as in app_truth.  
  - Modal uses `dark:bg-navy-800`, `dark:border-navy-*`, `dark:text-*`, so theme switching is supported.

---

## UI/UX and interface analysis

- **Reference files:** Checked against `docs/commands/interface.md`, `frontend/docs/DESIGN_SYSTEM.md`, `frontend/src/styles/design-tokens.css`, `.cursor/rules/niha-core.mdc`.
- **Design tokens:** Only Tailwind token classes (e.g. `text-navy-500`, `bg-navy-50`, `border-navy-200`, `focus:ring-emerald-500`). No hex, RGB, or disallowed slate/gray.
- **Theme:** Light/dark handled via `dark:` variants; modal and list respect theme.
- **Accessibility:** View/Approve/Reject/Delete buttons have descriptive `aria-label` with safe fallbacks; modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; Escape and focus trap are implemented; NDA control has `aria-label` including file name.
- **Responsiveness:** List uses `flex-wrap` and `min-w-0`/`shrink-0`; modal is `max-w-lg max-h-[90vh]` with `overflow-y-auto` for content.
- **States:** Loading skeletons, empty state (“No contact requests”), and NDA block only when `nda_file_name` is present are handled.

No UI/UX compliance issues; optional improvement is the NDA control semantics noted above.

---

## Error handling, security, and style

- **Error handling:** List and modal are presentational; errors are handled at page/hook level (e.g. `useBackofficeRealtime` logs fetch failures). NDA download is triggered by parent `onDownloadNDA`; no new error paths in these components.
- **Security:** No user input rendered without existing escaping; modal shows server-supplied contact data. NDA download remains `GET /admin/contact-requests/{id}/nda` with auth as before.
- **Style:** Matches existing backoffice patterns (Card, Typography, Badge, Button, ConfirmationModal). File lengths and structure are fine; no over-engineering observed.

---

## Recommendations

1. ~~Replace the NDA `<a href="#">` with a `<button type="button">`~~ — **Done.**
2. ~~Add UI tests for Contact Requests list and View modal~~ — **Done.** Both test files added; 18 tests pass.
3. No blocking changes; the feature is ready to ship from a code review perspective.
