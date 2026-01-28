# Code Review: Card Back, Contact Request List & View Modal

**Scope:** Section wrapper rename to `card_back` with theme tokens; Contact Requests tab refactor: compact list rows (`card_contact_request_list`), View modal with full form data and NDA PDF link, and action order (View → Approve & Invite → Reject → Delete).  
**Files changed:**  
- `frontend/src/index.css`  
- `frontend/src/components/common/Card.tsx`  
- `frontend/src/styles/design-tokens.css`  
- `frontend/docs/DESIGN_SYSTEM.md`  
- `frontend/src/components/backoffice/ContactRequestsTab.tsx`  
- `frontend/src/components/backoffice/ContactRequestViewModal.tsx` (new)  
- `frontend/src/components/common/StatCard.tsx`  
- `frontend/src/components/cash-market/ProfessionalOrderBook.tsx`  
- `frontend/src/design-editor/LiveCanvas.tsx`  

**Review date:** 2026-01-28

---

## 1. Summary of Implementation Quality

Implementation is **good** and aligned with the design system. The section wrapper is centralized as `card_back` with CSS variables in `design-tokens.css` (light/dark), so theme changes apply in one place. Contact Requests use a compact row (`card_contact_request_list`) with Entitate, Nume, and Data completării, Typography for labels/values, a View modal with all form fields and NDA download link, and actions in the requested order. No hard-coded colors in new UI; Tailwind navy/design tokens only. A few minor improvements are recommended (accessibility, unused prop).

---

## 2. Implementation Confirmation (No Formal Plan)

There was no single attached plan; work was driven by a series of user requests. The following was implemented:

| Change | Location | Status |
|--------|----------|--------|
| Section wrapper renamed to `card_back` | index.css, Card.tsx, design-tokens.css | Done |
| Card back params in theme (bg, border, radius) | design-tokens.css `:root` and `.dark` | Done – `--color-card-back-bg`, `--color-card-back-border`, `--radius-card-back` |
| Softer background (a few steps above layout) | design-tokens.css | Done – navy-100 light, navy-900 dark |
| DESIGN_SYSTEM.md updated for card_back | frontend/docs/DESIGN_SYSTEM.md | Done |
| Contact Requests: remove duplicate "Contact Requests" heading | ContactRequestsTab.tsx | Done |
| Define `card_contact_request_list` (compact row) | index.css | Done – compact padding, gap, navy tokens |
| List row: Entitate, Nume, Data completării from DB | ContactRequestsTab.tsx | Done – Typography for label/value |
| View icon → modal with all form data + NDA PDF link | ContactRequestViewModal.tsx, ContactRequestsTab | Done |
| Actions: View → Approve & Invite → Reject → Delete icon | ContactRequestsTab.tsx | Done |
| StatCard, ProfessionalOrderBook, LiveCanvas use `card_back` | StatCard.tsx, ProfessionalOrderBook.tsx, LiveCanvas.tsx | Done |

---

## 3. Issues Found

### Critical
- **None.**

### Major
- **None.**

### Minor

1. **ContactRequestViewModal.tsx – No keyboard close or focus trap**
   - **Issue:** Modal does not close on Escape and does not trap focus. Screen reader and keyboard-only users may have a weaker experience.
   - **Recommendation:** Add `onKeyDown` on the overlay (e.g. Escape → `onClose()`) and consider a focus trap (e.g. focus first focusable element on open, trap Tab inside modal). Optional: use a shared modal hook or component that already handles this.

2. **ContactRequestsTab.tsx – `onIpLookup` never used**
   - **Issue:** Prop `onIpLookup` is still required and passed from the parent but is no longer used (IP was removed from the list row; it is only shown in the View modal as plain text).
   - **Recommendation:** Either (a) add a "Lookup" link/button next to the IP field in `ContactRequestViewModal` that calls `onIpLookup(request.submitter_ip)` and open the existing IP lookup modal from the parent, or (b) keep the prop for future use and document that it is reserved (current approach is acceptable).

3. **ContactRequestViewModal.tsx – AnimatePresence exit animation**
   - **Issue:** When `isOpen` becomes false, the component returns `null` immediately, so the motion exit animation may not run. Same pattern as `ApproveInviteModal`; not blocking.
   - **Recommendation:** For a smoother close, keep the modal mounted while closing and use `AnimatePresence` with a key (e.g. `request?.id`) and `mode="wait"`, or ensure the closing state is rendered once before unmounting. Low priority.

---

## 4. Checks Performed

| Criterion | Result |
|-----------|--------|
| Plan / user requests fully implemented | Yes – card_back, tokens, compact list, View modal, NDA link, action order |
| Obvious bugs | None |
| Data alignment (snake_case, API shape) | ContactRequest type and API fields (entity_name, contact_name, created_at, etc.) used consistently |
| app_truth.md | Respected – design system references, Tailwind tokens, no slate/gray |
| Over-engineering / file size | No – ContactRequestViewModal is focused; ContactRequestsTab remains readable |
| Syntax / style vs codebase | Matches – Typography, Button, Badge, Card, Tailwind, navy tokens |
| Error handling and edge cases | formatDate(created_at) and contact_name optional; DataRow hides null/empty |
| Security / best practices | NDA download uses existing auth API; no sensitive data in markup |
| Testing | No new tests; recommendation: optional unit test for ContactRequestViewModal DataRow and formatDate handling |

---

## 5. UI/UX and Design System

### Reference files
- **docs/commands/interface.md** – Design tokens, theme, component requirements.  
- **app_truth.md** §9 – UI/UX and design system file list.  
- **frontend/docs/DESIGN_SYSTEM.md** – Cards section updated for `card_back` and token table.  
- **frontend/src/styles/design-tokens.css** – Card back variables in `:root` and `.dark`.  
- **.cursor/rules/niha-core.mdc** – No hard-coded colors; Tailwind tokens.

### Design token usage
- **card_back:** Uses only CSS variables `--color-card-back-bg`, `--color-card-back-border`, `--radius-card-back`, `--shadow-lg`, `--space-6` in `index.css`. No hex in component code.  
- **card_contact_request_list:** Uses Tailwind classes only: `navy-50/80`, `navy-800/50`, `navy-200/80`, `navy-600/80`. No `slate-*`, `gray-*`, or hex.  
- **ContactRequestViewModal:** All colors and spacing are Tailwind (`navy-*`, `dark:`). Typography uses design system variants (`sectionLabel`, `bodySmall`, `color="muted"` / `"primary"`).  
- **ContactRequestsTab:** Same – navy tokens, Typography, Button variants (primary, secondary with `text-red-500` for Reject per design system).  
- **check-design-system.js:** No violations in the modified/added TSX/CSS (no slate/gray, no hex in component files; hex only in design-tokens.css variable definitions, which are allowed).

### Theme (light/dark)
- `card_back` and `card_contact_request_list` both support dark mode via `dark:` and design-tokens `.dark` overrides.  
- Modal and list row use `dark:bg-navy-*`, `dark:border-navy-*`, `dark:text-*` consistently.

### Accessibility and responsiveness
- **ARIA:** View button has `aria-label`; modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; close button has `aria-label`.  
- **Keyboard:** Modal does not yet close on Escape or trap focus (see Minor #1).  
- **Responsiveness:** List row uses `flex-col sm:flex-row` and `flex-wrap`; modal is `max-w-lg max-h-[90vh]` with overflow; layout remains usable on small screens.

### Loading, error, empty states
- Loading: Skeleton rows use `card_contact_request_list` and `animate-pulse`.  
- Empty: "No contact requests" with icon and muted text.  
- NDA download: `downloadLoading` disables the button and shows "…".  
- No explicit error UI for failed NDA download; parent/page-level error handling is assumed.

### Design system integration
- DESIGN_SYSTEM.md documents `card_back` as the standard section/card wrapper and lists its tokens.  
- Reject button follows DESIGN_SYSTEM (secondary variant + `text-red-500`).  
- Card back and list row are reusable and token-driven.

---

## 6. Recommendations

1. **Accessibility:** Add Escape-to-close and, if possible, focus trap for `ContactRequestViewModal` (and consider a shared modal pattern for future modals).  
2. **onIpLookup:** Either use it in the View modal (e.g. "Lookup" next to IP) or leave as reserved and document in the component JSDoc.  
3. **Optional:** Add unit tests for `ContactRequestViewModal` (DataRow null/empty, formatDate) and for the list row rendering with minimal request data.  
4. **Optional:** Improve modal close animation by keeping the modal in the tree until exit animation completes (AnimatePresence + key/mode).

---

## 7. Conclusion

The card_back theme integration and Contact Requests refactor (compact list, View modal, NDA link, action order) are implemented correctly and in line with the design system and app_truth. No critical or major issues. Minor improvements recommended: keyboard/accessibility for the View modal, and clarifying or using `onIpLookup`. Ready to merge from a code-review perspective once the team is satisfied with the minor items.

---

## 8. Resolution (2026-01-28)

All minor issues and recommendations have been implemented:

| Issue / Recommendation | Resolution |
|------------------------|------------|
| **ContactRequestViewModal – No keyboard close or focus trap** | Escape key closes the modal; focus is moved to the close button on open; Tab / Shift+Tab cycle is trapped inside the modal (focusable elements: close, Lookup if IP, NDA download if present). |
| **ContactRequestsTab – `onIpLookup` never used** | `onIpLookup` is passed to `ContactRequestViewModal`. In the View modal, when `submitter_ip` exists, a "Lookup" link is shown next to the IP; clicking it calls `onIpLookup(ip)` and opens the existing IP lookup flow from the parent. |
| **ContactRequestViewModal – AnimatePresence exit animation** | Replaced with manual exit state: `exiting` + `closingRequest`. On close/Escape the modal animates to opacity 0 / scale 0.95; `onAnimationComplete` calls `onClose()` and clears state. |
| **Focus and a11y** | Close button has `focus:ring-2 focus:ring-emerald-500`; NDA and Lookup buttons have focus styles; dialog has `aria-labelledby` and `aria-modal`. |
