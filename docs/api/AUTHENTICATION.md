# Authentication API Documentation

**Version:** 1.0 (Updated for Market Makers)
**Base URL:** `/api/v1/auth`

## Overview

The platform uses JWT (JSON Web Token) based authentication with role-based access control. This document covers authentication endpoints and the newly added MARKET_MAKER role.

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `USER` | Regular platform user | Basic access |
| `APPROVED` | KYC-approved user | Can trade |
| `FUNDED` | Funded user account | Full trading access |
| `ADMIN` | Platform administrator | Full admin access |
| `MARKET_MAKER` | Market Maker client | **Cannot login** (managed by admin) |

### MARKET_MAKER Role (New)

**Purpose:** Special role for Market Maker clients managed by administrators.

**Key Characteristics:**
- Created automatically when admin creates a Market Maker
- Cannot login to the platform UI
- Cannot access any user-facing endpoints
- Orders placed by admins on their behalf
- All actions logged in audit trail

**Authentication Restriction:**
```
❌ Market Makers CANNOT login
❌ Market Makers CANNOT obtain JWT tokens
❌ Market Makers CANNOT access any API endpoints directly
```

**Management:**
- Only admins can create Market Makers
- Only admins can place orders for Market Makers
- Only admins can manage Market Maker assets
- See [MARKET_MAKERS_API.md](./MARKET_MAKERS_API.md) for full API reference

---

## Authentication Endpoints

### Login (Password)

```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "APPROVED",
    "entity_id": "uuid",
    "is_active": true
  }
}
```

**Validation:**
- Email must exist and be active
- Password must match
- Role CANNOT be `MARKET_MAKER`

**Errors:**
- `400` - Invalid email/password
- `401` - Incorrect credentials
- `403` - Account is Market Maker (cannot login)
- `403` - Account inactive

---

### Login (Magic Link)

```http
POST /auth/magic-link
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Magic link sent to email"
}
```

**Process:**
1. User requests magic link
2. System generates unique token
3. Email sent with link
4. User clicks link with token
5. Auto-login via token verification

**Validation:**
- Email must exist
- Account must be active
- Role CANNOT be `MARKET_MAKER`

**Errors:**
- `404` - Email not found
- `403` - Account is Market Maker
- `403` - Account inactive

---

### Verify Magic Link Token

```http
POST /auth/magic-link/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "unique-magic-link-token"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": { ... }
}
```

**Errors:**
- `400` - Invalid or expired token
- `403` - Account is Market Maker

---

### Get Current User

```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "APPROVED",
  "entity_id": "uuid",
  "is_active": true,
  "created_at": "2026-01-15T10:00:00Z"
}
```

**Errors:**
- `401` - Invalid or expired token

---

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**Notes:**
- Invalidates current session
- Token remains valid until expiration (JWT limitation)
- Client should delete stored token

---

## JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "APPROVED",
  "exp": 1737475200,
  "iat": 1737388800
}
```

**Expiration:** 24 hours from issuance

**Validation:**
- Signature verified with secret key
- Expiration checked (`exp` claim)
- User existence verified in database
- User active status checked

---

## Role-Based Access Control

### Endpoint Permissions

| Endpoint Pattern | Required Role |
|-----------------|---------------|
| `/api/v1/admin/*` | ADMIN |
| `/api/v1/cash-market/*` | APPROVED, FUNDED |
| `/api/v1/users/me` | Any authenticated user |
| `/api/v1/marketplace/*` | USER (minimum) |

### Admin Endpoints

All Market Maker and admin management requires `ADMIN` role:
- `/admin/market-makers/*` - ADMIN only
- `/admin/market-orders/*` - ADMIN only
- `/admin/logging/*` - ADMIN only
- `/admin/scraping-sources` - ADMIN only (price scraping; Settings UI)

**See:** [MARKET_MAKERS_API.md](./MARKET_MAKERS_API.md), [ADMIN_SCRAPING_API.md](./ADMIN_SCRAPING_API.md)

---

## Default Admin Account

**Development/Seeding:**
```
Email: admin@nihaogroup.com
Password: admin123
Role: ADMIN
```

**⚠️ Security Warning:**
- Change default password immediately in production
- Use `SEED_ADMIN_PASSWORD` environment variable for custom password
- Default credentials are for development only

**Production Setup:**
```bash
# In .env file
SEED_ADMIN_PASSWORD=your-secure-password-here
```

---

## Security Best Practices

### Token Storage (Frontend)

**✅ DO:**
- Store in memory (React state)
- Store in httpOnly cookies (if using server-rendered)
- Clear on logout

**❌ DON'T:**
- Store in localStorage (XSS vulnerable)
- Store in sessionStorage (XSS vulnerable)
- Share tokens across origins

### Password Requirements

**Current:**
- Minimum 8 characters
- No complexity requirements (to be enhanced)

**Recommended Production:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers
- Special characters required
- Password strength meter

### Token Refresh

**Current:** No refresh token mechanism

**Workaround:**
- Re-login when token expires (24h)
- Frontend can detect 401 and prompt re-authentication

**Future:** Refresh token endpoint planned for v2

---

## Authentication Attempt Logging

All authentication attempts are logged:

**Logged Information:**
- Email used
- Success/failure status
- IP address
- User agent
- Timestamp

**View Logs (Admin):**
```http
GET /admin/logging/tickets?action_type=USER_LOGIN&action_type=USER_LOGIN_FAILED
Authorization: Bearer <admin_token>
```

**Use Cases:**
- Security monitoring
- Brute force detection
- Compliance auditing

---

## Market Maker Authentication (Special Case)

**Question:** How do Market Makers authenticate?

**Answer:** They don't.

Market Makers are **admin-managed entities** that:
1. Cannot obtain JWT tokens
2. Cannot login to any interface
3. Have no password authentication
4. Are managed entirely through admin API

**Admin Flow:**
```
1. Admin logs in with their credentials
   → Receives JWT token with role=ADMIN

2. Admin creates Market Maker
   → MM created with role=MARKET_MAKER
   → MM has no password (random hash stored)

3. Admin places orders for MM
   → Admin's JWT token authorizes the action
   → Order attributed to MM
   → Audit log records admin user_id + market_maker_id

4. Orders execute automatically via matching engine
   → No authentication required for matching
   → Audit log records trade with MM involvement
```

**Security:**
- Only admins can act on behalf of MMs
- All MM actions require admin authentication
- Complete audit trail links admin to MM actions

---

## Error Responses

All authentication errors follow standard format:

```json
{
  "detail": "Error message"
}
```

**Common Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | Invalid credentials | Wrong email/password |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Account inactive or Market Maker attempting login |
| 404 | Not found | Email doesn't exist |

---

## Testing Authentication

**Test Admin Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nihaogroup.com",
    "password": "admin123"
  }'

# Save token
export TOKEN="<access_token>"

# Verify token works
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**Test Market Maker Restriction:**
```bash
# This should FAIL (Market Makers cannot login)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mm-alpha@internal.com",
    "password": "any-password"
  }'

# Expected: 403 Forbidden
```

---

## Migration Notes

### For Existing Systems

If upgrading from a version without Market Makers:

1. **Database Migration:** Run Alembic migration to add MARKET_MAKER enum value
2. **Code Deployment:** Deploy backend with role check
3. **Frontend Update:** Deploy frontend (no auth changes needed)
4. **Verification:** Test admin can create MMs but MMs cannot login

**Migration Command:**
```bash
cd backend
alembic upgrade head
```

---

## Related Documentation

- **Market Makers API:** [MARKET_MAKERS_API.md](./MARKET_MAKERS_API.md)
- **Logging API:** [LOGGING_API.md](./LOGGING_API.md)
- **Admin Guide:** [MARKET_MAKERS_GUIDE.md](../admin/MARKET_MAKERS_GUIDE.md)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19
