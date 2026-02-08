# Code Review: 0025 – AML: WebSocket role update live + modal click-to-dismiss, dashboard blur persists

**Plan:** [docs/features/0025_PLAN.md](0025_PLAN.md)

Review performed against `docs/features/0025_PLAN.md`. Order: Phase 1 (Modal + blur) → Phase 2 (Client WebSocket + role update live).

---

## Phase 1 – Modal click-to-dismiss + blur persists (frontend only)

### 1.1 State and conditions ✅

- **`showAmlModal`**: `useState(true)` – initial `true` when AML user lands on dashboard.
- **`isAmlUser`**: Derived from `effectiveRole === 'AML'` (line 223); uses `getEffectiveRole(user, simulatedRole)` for correct role source.
- **Blur overlay**: Rendered when `isAmlUser` only (line 644): `{isAmlUser && (<div className="fixed inset-0 z-40" ... />)}`.
- **Modal**: Rendered when `isAmlUser && showAmlModal` (line 652).
- **Verdict**: Done.

### 1.2 Click-to-dismiss ✅

- Outer `motion.div` has `onClick={() => setShowAmlModal(false)}` (line 658) and covers full viewport (`fixed inset-0 z-50`).
- Click anywhere (blur overlay, modal content, backdrop) propagates to parent and dismisses modal.
- `onKeyDown` for Enter/Space (line 660) provides keyboard accessibility.
- **Verdict**: Done.

### 1.3 Blur persists after modal dismiss ✅

- Blur is a separate sibling element; its visibility depends only on `isAmlUser`.
- When modal is dismissed (`showAmlModal = false`), blur overlay remains visible.
- **Verdict**: Done.

### 1.4 Reset `showAmlModal` when AML returns ✅

- `useEffect` (lines 414–416): `setShowAmlModal(isAmlUser)` when `isAmlUser` changes.
- When user returns with AML role (e.g. via simulation), modal shows again.
- **Verdict**: Done.

---

## Phase 2 – Client WebSocket + role update live

### 2.1 Backend – ClientConnectionManager ✅

- **File**: `backend/app/api/v1/client_ws.py`
- **Manager**: `ClientConnectionManager` with `_connections: Dict[UUID, List[WebSocket]]` mapping `user_id` to connections.
- **`connect(websocket, user_id)`**: Accepts WS, appends to user’s connection list.
- **`disconnect(websocket, user_id)`**: Removes connection, cleans up empty lists.
- **`broadcast_to_users(user_ids, message)`**: Sends JSON to all connections for given user IDs; adds `timestamp`; removes dead connections on send failure.
- **Verdict**: Done.

### 2.2 Backend – WebSocket endpoint ✅

- **Endpoint**: `WS /api/v1/client/ws` with query param `token=<jwt>`.
- **Auth**: Uses `verify_token(token)`, rejects on missing/invalid/blacklisted token (4001).
- **User extraction**: `user_id` from JWT `sub` claim.
- **Heartbeat**: Sends `heartbeat` every 30 seconds to keep connection alive.
- **Verdict**: Done.

### 2.3 Backend – clear_deposit integration ✅

- **File**: `backend/app/api/v1/deposits.py` (lines 644–650)
- After `db.commit()` and backoffice broadcast, calls `client_ws_manager.broadcast_to_users(upgraded_user_ids, {"type": "role_updated", "data": {"role": "CEA", "entity_id": str(deposit.entity_id)}})`.
- `upgraded_user_ids` comes from `deposit_service.clear_deposit()` return value.
- **Verdict**: Done.

### 2.4 Frontend – clientRealtimeApi ✅

- **File**: `frontend/src/services/api.ts`
- **`ClientWebSocketMessage`**: `type: 'connected' | 'heartbeat' | 'role_updated'`, optional `data: { role?, entityId? }`.
- **`clientRealtimeApi.connectWebSocket(token, onMessage, onOpen, onClose, onError)`**: Builds WS URL with `?token=`, connects, parses JSON, applies `transformKeysToCamelCase`, invokes `onMessage`.
- **URL logic**: Same pattern as prices WS (VITE_WS_URL, port 5173 proxy, fallback to 8000).
- **Verdict**: Done.

### 2.5 Frontend – useClientRealtime hook ✅

- **File**: `frontend/src/hooks/useClientRealtime.ts`
- Connects when `isAuthenticated` and `token` exist.
- On `role_updated`: calls `usersApi.getProfile()`, then `setAuth(user, currentToken)`.
- Reconnect: on close, schedules reconnect after 5 seconds if still authenticated.
- Cleanup: closes WS and clears timeout on unmount.
- **Verdict**: Done.

### 2.6 Frontend – hook mounting ✅

- **File**: `frontend/src/components/layout/Layout.tsx`
- `useClientRealtime()` called at top level of Layout.
- Hook guards with `if (!isAuthenticated || !token) return`, so no-op when unauthenticated.
- **Verdict**: Done.

### 2.7 app_truth.md ✅

- **§8** (line 125): Describes Client WebSocket – endpoint `WS /api/v1/client/ws`, `role_updated` on AML→CEA, `useClientRealtime` in Layout, refetch `/users/me`, `setAuth`, User.role as SSOT.
- **Verdict**: Done.

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| showAmlModal + isAmlUser | ✅ | State and conditions correct |
| Blur overlay (isAmlUser only) | ✅ | Independent of modal |
| Modal (isAmlUser && showAmlModal) | ✅ | Click anywhere dismisses |
| showAmlModal reset on AML return | ✅ | useEffect syncs with isAmlUser |
| ClientConnectionManager | ✅ | user_id → connections, broadcast_to_users |
| WS endpoint /api/v1/client/ws | ✅ | JWT auth, heartbeat |
| clear_deposit → broadcast role_updated | ✅ | After commit, to upgraded_user_ids |
| clientRealtimeApi + ClientWebSocketMessage | ✅ | Types, connectWebSocket, transform |
| useClientRealtime | ✅ | role_updated → getProfile → setAuth |
| Layout mount | ✅ | useClientRealtime in Layout |
| app_truth.md | ✅ | §8 Client WebSocket |

---

## Action Items

None. Implementation matches the plan.

---

## Improvements applied (post-review)

1. **Backend – client_ws.py**: Added `logging` and `logger`; broadcast failures are now logged with `logger.debug("Client WS broadcast failed for user %s: %s", uid, e)` for easier debugging.
2. **Frontend – useClientRealtime.test.ts**: Added unit tests for the hook:
   - Connects when authenticated
   - On `role_updated`, calls `getProfile` and `setAuth`
   - Ignores non-`role_updated` messages (heartbeat, connected)

---

## Minor notes (non-blocking)

1. **Modal inner card**: The inner `motion.div` (modal content) does not use `onClick={e => e.stopPropagation()}`. Per plan (“click oriunde”), any click should dismiss, so propagation is correct; no change needed.

2. **effectiveRole vs user.role**: Plan mentions `isAmlUser` without specifying `user?.role` vs `effectiveRole`. Using `effectiveRole` is consistent with role simulation and redirect logic; correct choice.

3. **entity_id in payload**: Backend sends `entity_id`; frontend transforms to `entityId`. The hook does not use it (refetch covers all data); acceptable.
