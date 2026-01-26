# Users API Documentation

**Version:** 1.0  
**Base URL:** `/api/v1/users`

## Overview

The Users API provides endpoints for user profile management, including viewing and updating personal information, changing passwords, and accessing entity information.

## Authentication

All endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <token>
```

## Endpoints

### Get Current User Profile

Retrieve the authenticated user's profile information.

```http
GET /users/me
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1 234 567 890",
  "position": "Carbon Trading Manager",
  "role": "FUNDED",
  "entity_id": "uuid",
  "must_change_password": false,
  "last_login": "2026-01-26T10:30:00Z"
}
```

**Errors:**
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (account inactive)

---

### Update Current User Profile

Update the authenticated user's profile information. Only admin users can edit profiles.

```http
PUT /users/me
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1 234 567 890",
  "position": "Carbon Trading Manager"
}
```

All fields are optional. Only provided fields will be updated.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1 234 567 890",
  "position": "Carbon Trading Manager",
  "role": "FUNDED",
  "entity_id": "uuid",
  "must_change_password": false,
  "last_login": "2026-01-26T10:30:00Z"
}
```

**Access Control:**
- Only users with `ADMIN` role can update profiles
- Regular users can view but not edit their profile

**Errors:**
- `400` - Invalid input data
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

---

### Change Password

Change the authenticated user's password.

```http
PUT /users/me/password
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character: `!@#$%^&*()_+-=[]{}|;:,.<>?`

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Validation:**
- Current password must be verified (if user has an existing password)
- New password must meet strength requirements
- Password validation happens on both frontend and backend

**Errors:**
- `400` - Invalid password format or current password incorrect
- `401` - Unauthorized
- `404` - User not found

**Error Response Example:**
```json
{
  "detail": "Password must contain at least one special character"
}
```

---

### Get Current User's Entity

Retrieve the entity information associated with the authenticated user.

```http
GET /users/me/entity
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Acme Carbon Trading Ltd",
  "legal_name": "Acme Carbon Trading Limited",
  "jurisdiction": "EU",
  "verified": true,
  "kyc_status": "approved"
}
```

**Response:** `200 OK` (if no entity)
```json
null
```

**Entity Fields:**
- `id` - Entity UUID
- `name` - Entity display name
- `legal_name` - Legal entity name
- `jurisdiction` - Jurisdiction code (EU, CN, HK, OTHER)
- `verified` - Whether entity is verified
- `kyc_status` - KYC status (pending, approved, rejected)

**Errors:**
- `401` - Unauthorized

---

### Get User Activity Log

Retrieve activity log entries for the authenticated user.

```http
GET /users/me/activity?page=1&per_page=20
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `per_page` (optional) - Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "login",
      "details": {
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-01-26T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "pages": 8
}
```

**Errors:**
- `401` - Unauthorized

---

### Get User Sessions

Retrieve recent session history for the authenticated user.

```http
GET /users/me/sessions
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "started_at": "2026-01-26T10:30:00Z",
    "ended_at": "2026-01-26T12:45:00Z",
    "duration_seconds": 8100,
    "is_active": false
  }
]
```

Returns up to 50 most recent sessions, ordered by start time (newest first).

**Errors:**
- `401` - Unauthorized

---

## Frontend Integration

### TypeScript API Client

The frontend uses a centralized API client in `frontend/src/services/api.ts`:

```typescript
import { usersApi } from '../services/api';

// Get profile
const profile = await usersApi.getProfile();

// Update profile (admin only)
const updated = await usersApi.updateProfile({
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1 234 567 890',
  position: 'Manager'
});

// Change password
await usersApi.changePassword('oldPassword', 'newPassword');

// Get entity
const entity = await usersApi.getMyEntity();

// Get activity log
const activity = await usersApi.getActivity({ page: 1, per_page: 20 });

// Get sessions
const sessions = await usersApi.getSessions();
```

### Profile Page Component

The profile page (`frontend/src/pages/ProfilePage.tsx`) implements:

- **Profile Viewing** - All users can view their profile
- **Profile Editing** - Only admin users can edit (restricted by `isAdmin` check)
- **Password Change** - All authenticated users can change their password
- **Entity Information** - Displays associated entity data
- **Error Handling** - Comprehensive error states and user feedback
- **Loading States** - Skeleton loaders during data fetching
- **Success Feedback** - Confirmation messages for successful operations

**Access Control:**
```typescript
const isAdmin = user?.role === 'ADMIN';
// Edit Profile button only shown if isAdmin === true
```

---

## Security Considerations

1. **Password Validation**
   - Frontend validates password strength before submission
   - Backend re-validates to prevent bypass
   - Special character set must match exactly: `!@#$%^&*()_+-=[]{}|;:,.<>?`

2. **Profile Updates**
   - Only admin users can update profiles
   - Regular users can view but not modify
   - Email address cannot be changed via this endpoint

3. **Entity Access**
   - Users can only view their own entity
   - Entity data is filtered by `entity_id` association

4. **Session Tracking**
   - All profile updates are logged in activity log
   - Password changes trigger security audit events

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Examples

### Complete Profile Update Flow (Admin)

```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Response contains access_token

# 2. Update Profile
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1 234 567 890",
    "position": "Senior Manager"
  }'
```

### Password Change Flow

```bash
# Change Password
curl -X PUT http://localhost:8000/api/v1/users/me/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!"
  }'
```

### Get Entity Information

```bash
# Get Entity
curl -X GET http://localhost:8000/api/v1/users/me/entity \
  -H "Authorization: Bearer $TOKEN"
```

---

## Related Documentation

- [Authentication API](./AUTHENTICATION.md) - Login and token management
- [Backoffice API](./BACKOFFICE_API.md) - Admin user management
- [Error Handling](./ERROR_HANDLING.md) - Error response format

---

**Last Updated:** 2026-01-26  
**Version:** 1.0
