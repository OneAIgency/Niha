# Code Review: NDA open in browser (all changes in conversation)

**Scope:** NDA PDF behavior – first changed to download, then to open in browser.  
**Review date:** 2026-01-29

---

## Summary of implementation quality

The final behavior (open NDA PDF in a new browser tab) is implemented correctly in `frontend/src/services/api.ts`. The API fetches the blob with auth, creates an object URL, opens it in a new tab with `noopener`, and revokes the URL after 5 seconds. Error handling is delegated to the caller (`BackofficeOnboardingPage`), which catches and surfaces errors. No backend or type changes were required.

**Gap:** The UI still uses “Download” wording (button label, aria-label, loading text, error message, and file comment). That is misleading now that the action opens the PDF in the browser instead of downloading.

---

## Plan / requirements confirmation

There was no formal plan file; the requirements were:

1. Initially: make the PDF download instead of opening in the browser.
2. Then: make the PDF open in the browser instead of downloading.

The current implementation satisfies the final requirement: the PDF opens in a new tab. The earlier “download” implementation was replaced by the “open in browser” implementation.

---

## Issues found

### Critical

- None.

### Major

- None.

### Minor

1. **Button and accessibility copy say “Download” but action opens in browser**  
   **Files:**  
   - `frontend/src/components/backoffice/ContactRequestViewModal.tsx`  
   **References:**  
   - L213: `aria-label={`Download NDA ${showingRequest.nda_file_name}`}`  
   - L216: `{downloadLoading ? 'Downloading…' : \`Download ${showingRequest.nda_file_name}\`}`  
   **Recommendation:** Change to “View” or “Open” so copy matches behavior, e.g. `aria-label={\`View NDA ${showingRequest.nda_file_name}\`}` and button text “View …” / “Opening…” when loading.

2. **Modal file comment still describes “download”**  
   **File:** `frontend/src/components/backoffice/ContactRequestViewModal.tsx`  
   **Reference:** L2: “a button to download the attached NDA PDF”  
   **Recommendation:** Update to “a button to open the attached NDA PDF in a new tab” (or similar).

3. **Page handler and error message use “download”**  
   **File:** `frontend/src/pages/BackofficeOnboardingPage.tsx`  
   **References:**  
   - L165: `handleDownloadNDA` (name is fine if kept for API compatibility)  
   - L173: `'Failed to download NDA file'`  
   **Recommendation:** At minimum, change the user-facing error to “Failed to open NDA file” so it matches the actual action.

4. **API function name and comment**  
   **File:** `frontend/src/services/api.ts`  
   **References:**  
   - L726: comment “Open NDA file in browser” is correct  
   - L727: function name `downloadNDA`  
   **Recommendation:** Optional: rename to `openNDAInBrowser` (or `viewNDA`) and update call sites and prop names (`onDownloadNDA` → `onViewNDA`, etc.) for consistency. Not required if the team prefers to keep existing names for API/backoffice consistency.

5. **Pop-up blockers**  
   **File:** `frontend/src/services/api.ts`  
   **Reference:** L734: `window.open(url, '_blank', 'noopener')`  
   **Note:** `window.open` after an async call can be blocked by pop-up blockers.  
   **Recommendation:** If this becomes a support issue, consider a short message when the new tab fails to open (e.g. “Allow pop-ups for this site and try again”) or document the requirement in user/admin docs.

---

## Error handling and edge cases

- **API:** `downloadNDA` does not catch errors; it throws on failed fetch or non-2xx. That is appropriate for a thin API layer.
- **Caller:** `BackofficeOnboardingPage.handleDownloadNDA` wraps the call in try/catch, sets `setError('Failed to download NDA file')`, and uses `setActionLoading` for loading state. Error handling is in place; only the error message text should be updated (see Minor #3).
- **Edge case:** If the request has no `nda_file_name`, the page only calls `downloadNDA` when `request?.nda_file_name` is truthy, so the backend still returns the PDF by `requestId`. No change needed.

---

## Data alignment and API

- Backend `GET /admin/contact-requests/{id}/nda` returns a blob with `Content-Disposition: attachment`; the frontend ignores disposition and opens the blob in a new tab. No mismatch.
- `downloadNDA(requestId, fileName)` still receives `fileName`; the second parameter is unused (`_fileName`) but the signature is unchanged, so call sites and types remain valid.

---

## Security and best practices

- Blob URL is created from fetched data (same-origin, authenticated request). No new exposure.
- `window.open(..., 'noopener')` is used; no `opener` reference is passed. Good.
- Object URL is revoked after 5 seconds to avoid leaking blob URLs; 5 s is reasonable for the new tab to load.

---

## Testing

- **ContactRequestViewModal** and **ContactRequestsTab** tests still assert on “Download NDA …” in button/aria-label (e.g. `ContactRequestViewModal.test.tsx` L132, L192). They only check that the handler is called with the request id; they do not assert “open in new tab” behavior.
- **Recommendation:** If the button and aria-label are updated to “View”/“Open” (Minor #1), update the tests to use the new text (e.g. `name: /View NDA …/i`). No new test coverage is strictly required for “open in browser” unless the product owner wants it.

---

## UI/UX and interface

- **Design system:** The NDA control is in `ContactRequestViewModal` and already uses design tokens (`navy-*`, `emerald-500`, `Typography`). No hard-coded colors or design-system violations were introduced.
- **Accessibility:** The only issue is semantic accuracy: the control is announced and labeled as “Download” while it opens the PDF in a new tab. Updating aria-label and visible label to “View”/“Open” (Minor #1) would align semantics with behavior and improve accessibility.
- **Loading/error states:** Loading state (“Downloading…”) and disabled button are present; only the wording should be updated to “Opening…” and “Failed to open NDA file” for consistency.

---

## Recommendations summary

1. **Do:** Update `ContactRequestViewModal` button text and aria-label from “Download” to “View” (or “Open”), and loading text to “Opening…”.
2. **Do:** Update the modal file comment and the user-facing error message in `BackofficeOnboardingPage` to “open” instead of “download”.
3. **Optional:** Rename `downloadNDA` / `onDownloadNDA` to `openNDAInBrowser` / `onOpenNDA` (or similar) and update all references for consistency.
4. **Optional:** If pop-up blocking is reported, add a fallback message or document the need to allow pop-ups for the backoffice.

---

## Confirmation

- **Requirement (final):** PDF opens in browser → **Implemented** in `api.ts` via blob fetch + `window.open(url, '_blank', 'noopener')`.
- **Scope:** Only the NDA open-in-browser behavior and related copy/comments were in scope; no other features were modified.
