# Fix Login Authentication Issue - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Diagnose and fix why user cannot authenticate on the login page

**Architecture:** Frontend port changed from 5173 to 5174 during rebuild. Need to verify if this is causing authentication issues or if there's an actual authentication bug.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite (port 5174)
- Backend: Python FastAPI (port 8000)
- Auth: JWT tokens stored in localStorage
- API: Axios with dynamic URL detection

---

## Root Cause Analysis

During the application rebuild, Vite detected port 5173 was already in use and automatically switched to port 5174:

```
Port 5173 is in use, trying another one...
VITE v5.4.21  ready in 140 ms
➜  Local:   http://localhost:5174/
```

The user is trying to access `http://localhost:5173/login` which no longer serves the application.

**Potential Issues:**
1. User accessing wrong port (5173 instead of 5174)
2. API URL misconfiguration due to port change
3. Token/session persistence issues from old port
4. CORS configuration issues

---

## Task 1: Verify Current Application State

**Files:**
- Check: Frontend running on port 5174
- Check: Backend running on port 8000
- Test: Login page accessibility

**Step 1: Verify frontend is accessible**

Run: `curl -s http://localhost:5174/ | head -20`
Expected: HTML page loads with Vite meta tags

**Step 2: Verify backend is accessible**

Run: `curl -s http://localhost:8000/api/v1/docs 2>&1 | head -20`
Expected: FastAPI docs page or redirect

**Step 3: Check login page loads on correct port**

Run: `curl -s http://localhost:5174/login | grep -i "NIHAO"`
Expected: "NIHAO" text found (login page title)

**Step 4: Verify old port 5173 is not serving content**

Run: `curl -s http://localhost:5173/ 2>&1`
Expected: Connection refused or empty response

**Step 5: Commit**

No commit needed - this is verification only.

---

## Task 2: Test Authentication Flow (Password Login)

**Files:**
- Test: POST /api/v1/auth/login endpoint
- Verify: Token generation and user response

**Step 1: Create test credentials file**

Create `/tmp/login-test.json`:
```json
{
  "email": "eu@eu.ro",
  "password": "Admin123!"
}
```

**Step 2: Test authentication endpoint directly**

Run:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d @/tmp/login-test.json \
  | python3 -m json.tool
```

Expected: JSON response with `access_token` and `user` object

**Step 3: Verify token is valid JWT**

Extract token from response and decode:
```bash
# Save token from previous response
TOKEN="<token_from_step_2>"
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -m json.tool
```

Expected: JWT payload with `sub` (user_id) and `email`

**Step 4: Test protected endpoint with token**

Run:
```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
```

Expected: User profile data

**Step 5: Commit**

No commit needed - this is testing only.

---

## Task 3: Test Frontend Login Form

**Files:**
- Modify: Create test script to simulate login
- Verify: Frontend JavaScript can make requests

**Step 1: Check API URL detection logic**

Read `/Users/victorsafta/work/Niha/frontend/src/services/api.ts:42-73`

Expected behavior:
- Port 5173 → uses relative URLs (Vite proxy)
- Port 5174 → uses constructed URL `${protocol}//${hostname}:8000`

**Step 2: Verify Vite proxy configuration**

Run: `cat /Users/victorsafta/work/Niha/frontend/vite.config.ts | grep -A 20 "proxy"`

Expected: Proxy config for `/api` → `http://localhost:8000`

**Step 3: Test API from frontend perspective**

Open browser console simulation:
```bash
# Simulate what frontend sees on port 5174
curl http://localhost:5174/ -v 2>&1 | grep "< HTTP"
```

Expected: 200 OK response

**Step 4: Check for CORS issues**

Run:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:5174" \
  -H "Content-Type: application/json" \
  -d '{"email":"eu@eu.ro","password":"Admin123!"}' \
  -v 2>&1 | grep -i "access-control"
```

Expected: CORS headers present (Access-Control-Allow-Origin)

**Step 5: Commit**

No commit needed - this is verification only.

---

## Task 4: Check for Stale LocalStorage Data

**Files:**
- Investigate: localStorage from port 5173 vs 5174
- Clear: Old tokens if present

**Step 1: Document localStorage isolation**

Create `/tmp/localstorage-note.md`:
```markdown
# LocalStorage Port Isolation

LocalStorage is isolated by origin (protocol + hostname + port).

- http://localhost:5173 has separate localStorage from http://localhost:5174
- Old tokens from port 5173 won't affect port 5174
- User needs to use http://localhost:5174/login NOT 5173
```

**Step 2: Verify this is documented for user**

No action needed - will inform user in final summary.

**Step 3: Commit**

No commit needed - documentation only.

---

## Task 5: Identify Actual Root Cause

**Files:**
- Analyze: All test results from Tasks 1-4
- Determine: Is it port issue or auth bug?

**Step 1: Review all test results**

Check which tests passed/failed:
- [ ] Frontend accessible on 5174?
- [ ] Backend accessible on 8000?
- [ ] Direct auth endpoint works?
- [ ] CORS configured correctly?

**Step 2: Classify the issue**

Determine root cause category:

**A) User Error (Port Issue):**
- User accessing wrong port (5173 instead of 5174)
- Fix: Tell user to use http://localhost:5174/login

**B) API Configuration Issue:**
- Vite proxy not working on port 5174
- Fix: Update vite.config.ts proxy settings

**C) CORS Issue:**
- Backend rejecting requests from port 5174
- Fix: Update CORS allowed origins

**D) Authentication Bug:**
- Actual bug in login flow
- Fix: Debug and fix the specific bug

**Step 3: Write diagnosis summary**

Create `/tmp/diagnosis-summary.md` with findings

**Step 4: Commit**

No commit needed - diagnosis only.

---

## Task 6: Implement Fix (Based on Diagnosis)

**Files:**
- Modify: Depends on root cause from Task 5
- Test: Login works after fix

**Case A: Port Issue (Most Likely)**

**Step 1: No code changes needed**

User just needs to access correct URL.

**Step 2: Verify correct URL works**

Run: `curl -s http://localhost:5174/login | grep "NIHAO"`
Expected: Login page found

**Step 3: Test login on correct port**

Manual test: Navigate to http://localhost:5174/login in browser and try logging in

**Step 4: Commit**

No commit needed.

---

**Case B: Vite Proxy Issue**

**Step 1: Check if port 5174 is in Vite proxy config**

Read: `/Users/victorsafta/work/Niha/frontend/vite.config.ts`

**Step 2: Update proxy config if needed**

If proxy only works for port 5173, update to handle 5174.

**Step 3: Restart frontend**

Run: `cd /Users/victorsafta/work/Niha/frontend && npm run dev`

**Step 4: Test login**

Try logging in on http://localhost:5174/login

**Step 5: Commit**

```bash
git add vite.config.ts
git commit -m "fix: Update Vite proxy config for port 5174

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

**Case C: CORS Issue**

**Step 1: Read backend CORS config**

Read: `/Users/victorsafta/work/Niha/backend/app/main.py` (look for CORS middleware)

**Step 2: Add port 5174 to allowed origins**

Edit CORS origins to include `http://localhost:5174`

**Step 3: Restart backend**

Stop and restart backend server

**Step 4: Test login**

Try logging in on http://localhost:5174/login

**Step 5: Commit**

```bash
git add app/main.py
git commit -m "fix: Add port 5174 to CORS allowed origins

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

**Case D: Authentication Bug**

**Step 1: Review error details**

Check browser console for specific error messages

**Step 2: Debug based on error**

Add console.log statements to:
- `/Users/victorsafta/work/Niha/frontend/src/pages/LoginPage.tsx:369-393` (handleLogin)
- `/Users/victorsafta/work/Niha/frontend/src/services/api.ts:143-146` (loginWithPassword)

**Step 3: Fix the identified bug**

Implement specific fix based on debugging

**Step 4: Test login**

Verify fix works

**Step 5: Commit**

```bash
git add <files>
git commit -m "fix: <specific bug description>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Verify Fix and Document

**Files:**
- Test: End-to-end login flow
- Document: Resolution and preventive measures

**Step 1: Test complete login flow**

1. Navigate to http://localhost:5174/login
2. Enter credentials (eu@eu.ro / Admin123!)
3. Click CONTINUE
4. Verify redirect to /dashboard or /onboarding

Expected: Successful login and navigation

**Step 2: Verify token persistence**

1. Refresh page
2. Verify still logged in (token in localStorage)

Expected: User remains authenticated

**Step 3: Test logout and re-login**

1. Logout
2. Login again
3. Verify works

Expected: Both logout and login work correctly

**Step 4: Document the resolution**

Create note for user explaining:
- Root cause
- Fix applied
- Correct URL to use (http://localhost:5174/login)
- Why port changed (5173 was in use)

**Step 5: Commit**

If any fixes were made, ensure they're committed.

---

## Testing Checklist

After implementation, verify:

- [ ] Frontend accessible on http://localhost:5174
- [ ] Backend accessible on http://localhost:8000
- [ ] Login page loads correctly
- [ ] Can submit login form
- [ ] Successful login redirects to dashboard/onboarding
- [ ] Token stored in localStorage
- [ ] Token persists across page refresh
- [ ] Logout works correctly
- [ ] Can login again after logout
- [ ] API requests include Authorization header
- [ ] Protected routes work with token

---

## Expected Outcome

User can successfully:
1. Navigate to http://localhost:5174/login (NOT 5173)
2. Enter credentials
3. Login successfully
4. Access authenticated pages
5. Stay logged in across page refreshes

**Key Message for User:**
> The frontend server is now running on **port 5174** (not 5173). Please use `http://localhost:5174/login` to access the application.
