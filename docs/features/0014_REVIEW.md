# 0014 – Contact request disappears after approval – Code Review

**Scope:** When an admin approves KYC for a client (create user from contact request), that contact request disappears from the list on `/backoffice/onboarding/requests` immediately after approval (user_role becomes KYC). No formal plan file; requirement was direct: “când acceptă KYC pentru un client, el dispare din listă imediat după ce a fost aprobat”.

**Reviewed:** `frontend/src/pages/BackofficeOnboardingPage.tsx` (filter of contact requests by `user_role`), alignment with `app_truth.md` and backend `ContactStatus` (NDA, KYC, REJECTED).

---

## 1. Summary of implementation quality

The feature is **correctly implemented**. The Contact Requests list is now derived from the realtime store by **filtering out** contact requests with `user_role === 'KYC'` (approved, user created) and `user_role === 'REJECTED'`. When the backend sets `contact_request.user_role = KYC` and broadcasts `request_updated` via WebSocket, the store updates that request; the derived list no longer includes it, so the row disappears immediately. The nav count uses the filtered list length, so it stays in sync.

**Strengths:**

- **Minimal change:** Single place (BackofficeOnboardingPage): map → filter → pass filtered list and its length to ContactRequestsTab. No API or store changes.
- **Realtime + refresh:** Both paths work: WebSocket `request_updated` updates the store → filtered list excludes the item; manual refresh refetches all requests → filter again excludes KYC/REJECTED.
- **Aligned with backend:** Backend `ContactStatus` is NDA, REJECTED, KYC only; filtering KYC and REJECTED matches the “pending” semantics for this tab.
- **app_truth.md:** §8 states contact request state is only `user_role` (NDA, KYC, REJECTED); filtering by `user_role` is consistent with the client state rule.

---

## 2. Issues found

### Critical

**None.**

### Major

**None.**

### Minor (addressed)

1. **Future status values** — **FIXED**  
   - **File:** `frontend/src/utils/contactRequest.ts` (new), `frontend/src/pages/BackofficeOnboardingPage.tsx`.  
   - **Fix:** Introduced allowlist `PENDING_CONTACT_REQUEST_ROLES = ['NDA', 'new']` and `isPendingContactRequest(user_role)`. Only known pending values are shown; any new terminal status is hidden by default until explicitly added to the allowlist.

2. **Optional unit test** — **DONE**  
   - **File:** `frontend/src/utils/__tests__/contactRequest.test.ts`.  
   - **Fix:** Unit tests for `isPendingContactRequest` (NDA/new → true, KYC/REJECTED/other → false) and for filtering a mixed list (only NDA and 'new' remain). `PENDING_CONTACT_REQUEST_ROLES` is also asserted.

---

## 3. Requirement compliance

| Requirement | Status |
|-------------|--------|
| Approved contact request (KYC) disappears from list | Met (filter excludes KYC) |
| Disappears immediately after approval | Met (realtime `request_updated` → store update → filter excludes row) |
| REJECTED also excluded from list | Met (same filter) |

The requested behaviour is **fully addressed**.

---

## 4. Data alignment and edge cases

- **user_role source:** `realtimeContactRequests` are normalized to snake_case in `useBackofficeRealtime`; `user_role` is read with fallback `?? 'new'`. Filter compares against `'KYC'` and `'REJECTED'` (backend enum values). No camelCase/snake_case mismatch.
- **handleOpenNDA / handleRejectRequest:** Both use `contactRequests.find(r => r.id === requestId)`. They only run for rows still in the list (pending). After reject, the item gets `user_role: 'REJECTED'` and is removed from the filtered list on next render; no stale reference.
- **Loading state:** `setLoading(realtimeContactRequests.length === 0 && connectionStatus === 'connecting')` uses full store length. If all requests are KYC/REJECTED, the list is empty but store is not; loading clears once connection is established. Acceptable; optional refinement would be to treat “all filtered out” differently from “no data”, but not necessary for the current requirement.

---

## 5. Error handling and security

- No new API calls or error paths; filtering is derived state. Existing error handling for reject/approve/delete unchanged.
- No new endpoints or PII exposure; filter is client-side only. No security impact.

---

## 6. UI/UX and design system

**Reference:** `app_truth.md` §9, `docs/commands/interface.md`, design tokens.

- **No new UI:** Only the **set** of items in the list changed (pending-only). ContactRequestsTab, badges, modals, and styling are unchanged.
- **Count badge:** SubSubHeader “Contact Requests” count now reflects pending count only; consistent with the list content.
- **Tokens / theme / a11y:** No new components or styles; no change to design token usage or accessibility.

**Verdict:** Implementation aligns with the design system and interface rules; no UI/UX issues.

---

## 7. Recommendations

1. ~~Consider allowlisting pending statuses (NDA, 'new') instead of blocklisting (KYC, REJECTED).~~ **Done:** `utils/contactRequest.ts` with `PENDING_CONTACT_REQUEST_ROLES` and `isPendingContactRequest`.
2. ~~Optionally add a unit test for the filter.~~ **Done:** `utils/__tests__/contactRequest.test.ts`.
3. No further change required; implementation is complete and correct.

---

## 8. Files touched (after fixes)

| Area | File |
|------|------|
| Frontend | `frontend/src/pages/BackofficeOnboardingPage.tsx`, `frontend/src/utils/contactRequest.ts`, `frontend/src/utils/index.ts` |
| Tests | `frontend/src/utils/__tests__/contactRequest.test.ts` |

No backend changes.
