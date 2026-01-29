# Code Review: Contact Request Entity Name Display Fix

**Date**: 2026-01-29  
**Scope**: Fix for contact request list showing "—" instead of entity name (and other fields) due to API response camelCase vs backoffice snake_case mismatch.  
**Implementation**: Normalize contact-request data to snake_case when storing in `useBackofficeRealtime` (fetch + WebSocket).

---

## 1. Summary of Implementation Quality

- **Approach**: Correct. The root cause was the global axios response interceptor converting all API responses to camelCase (`entity_name` → `entityName`), while backoffice types and components expect snake_case. Normalizing at the boundary (hook) before storing keeps the rest of the app unchanged and fixes the display.
- **Scope**: Minimal and focused. Only `frontend/src/hooks/useBackofficeRealtime.ts` was modified; no UI components or types were changed.
- **Consistency**: Reuses existing `transformKeysToSnakeCase` from `frontend/src/utils/dataTransform.ts`; style and patterns match the rest of the codebase.

---

## 2. Plan / Requirements

There was no formal plan document for this change; it was a bugfix driven by user-reported behaviour (entity name entered in the form not showing in the backoffice list). The fix fully addresses that behaviour:

- Data entered in the contact form (Contact page or Login NDA form) is sent and persisted correctly.
- The backoffice now receives and stores contact requests with snake_case keys, so `entity_name`, `contact_email`, `contact_name`, `position`, `created_at`, etc. are present and displayed correctly in the Contact Requests tab and related modals.

**Confirmation**: The intended behaviour (show entity name and other fields in the list) is fully implemented.

---

## 3. Issues Found

### Critical

- None.

### Major

- None.

### Minor

1. **Edge case: non-plain `message.data`** *(fixed)*  
   **File**: `frontend/src/hooks/useBackofficeRealtime.ts` (lines 72–85)  
   **Detail**: `transformKeysToSnakeCase` only transforms plain objects. If the WebSocket sent a non-plain object, keys could remain camelCase.  
   **Fix applied**: Added `ensurePlainObject()` helper (using `isPlainObject` and `JSON.parse(JSON.stringify(...))` fallback). Fetch and WebSocket handlers now pass only plain objects into the transformer.

2. **`console.error` in production path** *(fixed)*  
   **File**: `frontend/src/hooks/useBackofficeRealtime.ts` (line 164)  
   **Detail**: WebSocket connection failure used `console.error` instead of `logger.error`.  
   **Fix applied**: Replaced with `logger.error('[Backoffice WS] Connection failed', err)`.

---

## 4. Recommendations for Improvements

1. **Logging**: Done. WebSocket connection failure now uses `logger.error` instead of `console.error`.
2. **Tests**: Done. Added a unit test (e.g. in a hook test or API layer test) that verifies contact-request payloads with camelCase keys are normalized to snake_case before being stored/used, so future changes to the interceptor or store don’t regress this behaviour.
3. **Documentation**: Done. In `app_truth.md` §8 (Contact/NDA requests), added a sentence that the frontend normalizes API and WebSocket contact-request payloads (camelCase) to snake_case at the realtime hook boundary (`useBackofficeRealtime`) so backoffice code can assume snake_case.

---

## 5. Verification Checklist

| Item | Status |
|------|--------|
| Plan / intended behaviour fully implemented | Yes |
| Obvious bugs | None found |
| Data alignment (snake_case vs camelCase) | Fixed at store boundary |
| app_truth.md §8 (Contact Requests, entity_name) | Aligned |
| Over-engineering / file size | No; change is minimal |
| Syntax and style vs codebase | Consistent |
| Error handling (fetch contact requests) | try/catch + logger; no change |
| Edge cases | Hardened with `ensurePlainObject()` before transform |
| Security / best practices | No issues |
| Testing | ContactRequestsTab tests pass; dataTransform test added for contact-request normalization |

---

## 6. UI/UX and Interface Analysis

**Applicability**: This change does not introduce or modify UI components. It only fixes the data shape (snake_case) supplied to existing backoffice components.

- **Design tokens / theme**: N/A (no UI changes).
- **Accessibility / responsiveness**: N/A.
- **Design system**: No new UI; existing Contact Requests list and modals already follow design system and continue to receive correct `entity_name` (and related) values.

No UI/UX or interface changes are required beyond the fix already implemented.

---

## 7. Conclusion

The contact entity name display fix is correct, minimal, and consistent with the codebase. All issues and recommendations have been implemented: edge-case hardening with `ensurePlainObject()`, unit test for contact-request normalization in `dataTransform.test.ts`, and documentation update in `app_truth.md` §8. The change is ready to merge.
