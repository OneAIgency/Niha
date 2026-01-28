# Code Review: 0006 – NDA form, date salvate, notificare backoffice, badge, modal

**Plan**: `docs/features/0006_PLAN.md`  
**Review date**: 2026-01-29

---

## Summary of implementation quality

The feature is **largely correctly implemented**: NDA form data and PDF are stored in the DB, the backoffice list and badge update via WebSocket and initial fetch, and the view modal shows all form fields including NDA download and IP lookup. A few issues should be fixed for backend standards and API consistency.

---

## Plan implementation confirmation

| Requirement | Status |
|-------------|--------|
| 1. Form data + PDF saved in DB | ✅ Implemented: `create_nda_request` stores entity_name, contact_email, contact_name, position, nda_file_name, nda_file_data, nda_file_mime_type, submitter_ip, request_type="nda", status=NEW. No mock/cache. |
| 2. Notificare nouă cerere la backoffice/onboarding/requests | ✅ Backend broadcasts `new_request`; `useBackofficeRealtime` handles it and calls `addContactRequest`; list updates without refresh. |
| 3. Badge actualizat | ✅ Badge = `contactRequestsCount` = `contactRequests.length`; `addContactRequest` deduplicates by id (filter then prepend). `.subsubheader-nav-badge` used on requests tab. |
| 4. Toate elementele din form afișate în modal | ✅ ContactRequestViewModal shows Entitate, Nume, Email, Position, Reference, Request type, Status, Data completării, IP (with Lookup), Notes, NDA document (name + download). |

Optional “toast New contact request” on WebSocket `new_request` was not implemented; plan marked it optional.

---

## Issues found

### Critical

#### 1. Backend: missing DB error handling in contact router

**File**: `backend/app/api/v1/contact.py`  
**Lines**: 59–61 (`create_contact_request`), 140–143 (`create_nda_request`)

**Issue**: Both endpoints perform `db.add(contact)`, `await db.commit()`, `await db.refresh(contact)` without `try/except`, `rollback`, or `handle_database_error`. This violates the backend rule in `.cursor/rules/backend.mdc`: all database writes must use the standard pattern with rollback and `handle_database_error`.

**Recommendation**: Wrap each write block in:

```python
try:
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
except Exception as e:
    await db.rollback()
    from ...core.exceptions import handle_database_error
    raise handle_database_error(e, "creating contact request", logger)
```

Use a module-level `logger` (e.g. `logger = logging.getLogger(__name__)`).

---

### Major

#### 2. Backend: ContactRequestResponse schema missing submitter_ip and notes

**File**: `backend/app/schemas/schemas.py`  
**Lines**: 101–114

**Issue**: `ContactRequestResponse` does not include `submitter_ip` or `notes`. The plan required the POST response and WebSocket payload to carry all fields needed for list/modal. GET `/admin/contact-requests` and the WebSocket `new_request` payload both send these fields manually; POST `/contact/nda-request` and `/contact/request` use `response_model=ContactRequestResponse`, so the response body omits `submitter_ip` and `notes`. Any client that relied on the POST response would not get them.

**Recommendation**: Add to `ContactRequestResponse`:

- `submitter_ip: Optional[str] = None`
- `notes: Optional[str] = None`

---

### Minor

#### 3. Frontend: weak typing for contact-requests API

**File**: `frontend/src/services/api.ts`  
**Lines**: 666–672, 675–676

**Issue**: `getContactRequests` returns `Promise<PaginatedResponse<any>>` and `updateContactRequest` uses `update: any`, which weakens type safety.

**Recommendation**: Use `PaginatedResponse<ContactRequestResponse>` for `getContactRequests` and a proper type (e.g. `ContactRequestUpdate` or an interface with `status?`, `notes?`) for the update payload.

#### 4. Optional toast not implemented

**Plan**: Optional toast/banner “New contact request received” when `new_request` is received on the requests page.

**Status**: Not implemented. Acceptable as optional; can be added later if desired.

---

## Data alignment and API shape

- **Snake_case**: Backend sends snake_case (GET, WebSocket, manual dicts); frontend types (`ContactRequest`, `ContactRequestResponse`) use snake_case. ✅  
- **Paginated GET**: Response is `{ data: [...], pagination: { page, per_page, total, total_pages } }`; `useBackofficeRealtime` uses `setContactRequests(response.data)`. ✅  
- **WebSocket**: `new_request` payload includes id, entity_name, contact_email, contact_name, position, reference, request_type, nda_file_name, submitter_ip, status, notes, created_at. Frontend treats `message.data` as `ContactRequestResponse`. ✅  
- **created_at**: Backend sends ISO string with "Z"; frontend `formatDate` and list/modal use it correctly. ✅  

No issues found with nested `{ data: {} }` or mismatched casing.

---

## Error handling and edge cases

- **Backend**: Email and file validation (extension, size ≤ 10MB) and clear HTTP 400 messages. Email send failure in NDA flow is caught and ignored so the request is still created. Missing: DB error handling (see Critical #1).  
- **Frontend**: NDA form validates entity, email, contact name, position, file presence and PDF extension; shows generic error on submit failure. Download NDA and IP lookup have loading/error handling on the onboarding page. ✅  

---

## Security and best practices

- Client IP taken from `X-Forwarded-For` or `request.client.host`.  
- NDA download and contact list are behind admin auth (`get_admin_user`).  
- File type and size validated; only PDF stored.  
- No sensitive data logged in the reviewed paths.  

No further issues identified.

---

## Over-engineering and file size

- `contact.py` is focused and not oversized.  
- Modal and tab components are of reasonable size and responsibility.  
- No unnecessary abstractions noted.  

---

## Style and consistency

- Backend contact and admin contact-request code matches project style.  
- Frontend uses shared Typography, Button, Card, Badge; class names and structure align with the rest of the codebase.  

---

## UI/UX and design system compliance

### Reference files checked

- `docs/commands/interface.md` – design tokens, theme, component requirements  
- `app_truth.md` §9 – UI/UX and design system references  
- `frontend/docs/DESIGN_SYSTEM.md` – colors, typography, components  
- `frontend/src/styles/design-tokens.css` – variables, `.subsubheader-nav-badge`  
- `.cursor/rules/niha-core.mdc` – no hard-coded colors, Tailwind tokens  

### Findings

- **ContactRequestViewModal** and **ContactRequestsTab**: Use only `navy-*`, `emerald-*`, `red-*` (e.g. reject); no `slate-*`, `gray-*`, or hard-coded hex/RGB in class names. ✅  
- **Badge**: SubSubHeader uses `subsubheader-nav-badge` for the contact requests count; design-tokens.css defines the badge variables. ✅  
- **Theme**: Components use `dark:` variants (e.g. `dark:bg-navy-800`, `dark:border-navy-600`). ✅  
- **Accessibility**: Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape to close, focus trap, and `aria-label` on buttons (close, download, IP lookup). ✅  
- **Loading / empty**: ContactRequestsTab shows loading skeleton and empty state (“No contact requests”) with icon. Modal download button shows loading state. ✅  

**LoginPage**: The NDA form and success state use design tokens. The CO₂ molecule SVG uses `stopColor="rgb(...)"` and `stroke="rgb(...)"`; this is decorative animation, not core UI. Optional improvement: replace with token-based classes or CSS variables if the design system is extended to illustrations.

### Design system integration

- Cards and list rows use `card_contact_request_list` and shared components.  
- Typography uses `Typography` with `variant` and `color`.  
- No design system violations in the backoffice components reviewed.  

---

## Testing

- No new tests were found for the NDA flow, contact API, or WebSocket `new_request` in the scope of this review.  
- **Recommendation**: Add backend tests for `create_nda_request` (validation, DB persistence, broadcast) and, if desired, frontend tests for modal and list behavior.  

---

## Recommendations summary

1. **Critical**: Add try/except, rollback, and `handle_database_error` to both contact creation endpoints in `backend/app/api/v1/contact.py`.  
2. **Major**: Add `submitter_ip` and `notes` to `ContactRequestResponse` in `backend/app/schemas/schemas.py`.  
3. **Minor**: Tighten types in `frontend/src/services/api.ts` for `getContactRequests` and `updateContactRequest`.  
4. **Optional**: Implement “New contact request” toast when `new_request` is received; consider replacing hard-coded RGB in LoginPage CO₂ SVG with design tokens.  
5. **Optional**: Add backend (and optionally frontend) tests for NDA submit and realtime list/badge behavior.  

---

## Conclusion

The 0006 plan is **fully implemented** for the four main requirements (form + PDF in DB, backoffice notification, badge, modal content). Addressing the critical DB error handling and the major schema completeness will align the implementation with project standards and API consistency.
