# Code Review: Backoffice Offline + Login UniqueViolation Fixes

## Summary

Three bugfixes implemented in this session:

1. **Backoffice WebSocket URL** – Frontend connected to `ws://localhost:5173/...` (Vite) instead of `ws://localhost:8000/...` (backend). Fixed URL construction so WebSocket always targets backend port 8000.
2. **Backoffice WebSocket auth 403** – Endpoint checked `payload.get("role") != "ADMIN"`, but JWT does not include role. Fixed by loading user from DB by `sub` and verifying `user.role == ADMIN`.
3. **Login UniqueViolation** – `ticket_id` collision when Redis counter is behind DB (e.g. Redis reset, DB restored). Fixed by retrying `create_ticket` with new ID on `IntegrityError` (ix_ticket_logs_ticket_id).

## Implementation Quality

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | `getWsUrl`: use port 8000 when frontend on 5173; unified logic |
| `backend/app/api/v1/backoffice.py` | WebSocket auth: verify token → load user from DB → check role, blacklist |
| `backend/app/services/ticket_service.py` | Retry on ticket_id collision: `begin_nested` + IntegrityError handling |

## Issues Found

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Major    | 0 |
| Minor    | 0 |

## Checklist Verification

- **app_truth.md**: No spec changes needed; fixes align with existing behaviour.
- **Error handling**: Ticket collision retry is bounded (3 attempts); non-collision IntegrityError still raised.
- **Security**: WebSocket auth now uses DB role + token blacklist, consistent with HTTP endpoints.
- **Tests**: Backend tests pass (26 passed). No new tests added for these fixes.

## Recommendations

- Consider adding a test that simulates ticket_id collision (mock Redis returning reused counter) to validate retry path.
- Optional: initialize Redis ticket counter from `MAX(ticket_id)` in DB on first use for the year to reduce collisions.
