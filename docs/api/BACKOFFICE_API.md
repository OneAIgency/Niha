# Backoffice API Documentation

**Version:** 1.1  
**Last Updated:** 2026-01-25  
**Base URL:** `/api/v1/backoffice`  
**Authentication:** Bearer Token (Admin role required)

## Error Handling

All endpoints use standardized error responses. See [API Error Handling](./ERROR_HANDLING.md) for error response format and error codes.

**Example Error Response:**
```json
{
  "detail": {
    "error": "User not found",
    "code": "NOT_FOUND",
    "details": {
      "operation": "retrieving user details",
      "user_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

## Overview

The Backoffice API provides endpoints for administrators to manage user approvals, KYC document reviews, deposit confirmations, and user activity monitoring. All endpoints require admin authentication.

## Authentication

All endpoints require a valid JWT token with `role=ADMIN`:

```http
Authorization: Bearer <access_token>
```

## User Management

### Get User Sessions

Retrieve a user's session history including IP addresses and activity.

```http
GET /backoffice/users/{user_id}/sessions
```

**Path Parameters:**
- `user_id` (string, required): UUID of the user

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "started_at": "2026-01-25T10:00:00Z",
    "ended_at": "2026-01-25T11:30:00Z",
    "duration_seconds": 5400,
    "is_active": false
  }
]
```

**Notes:**
- Returns up to 100 most recent sessions
- Sessions are ordered by `started_at` descending
- `is_active` is `true` when `ended_at` is null
- `duration_seconds` is calculated when session ends

### Get User Trades

Retrieve a user's trading history including all trades where the user's entity was buyer or seller.

```http
GET /backoffice/users/{user_id}/trades
```

**Path Parameters:**
- `user_id` (string, required): UUID of the user

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "trade_type": "buy",
    "certificate_type": "CEA",
    "quantity": 100.0,
    "price_per_unit": 14.50,
    "total_value": 1450.0,
    "status": "completed",
    "is_buyer": true,
    "created_at": "2026-01-25T10:00:00Z",
    "completed_at": "2026-01-25T10:05:00Z"
  }
]
```

**Notes:**
- Returns up to 100 most recent trades
- Only returns trades if user has an associated entity
- `is_buyer` indicates if user's entity was the buyer (`true`) or seller (`false`)
- Trades are ordered by `created_at` descending

**Error Responses:**

- `404 Not Found`: User not found
- `200 OK` with empty array: User has no entity or no trades

## KYC Document Management

### Get All KYC Documents

Retrieve all KYC documents, optionally filtered by user or status.

```http
GET /backoffice/kyc-documents
```

**Query Parameters:**
- `user_id` (string, optional): Filter by user ID
- `status` (string, optional): Filter by status (`pending`, `approved`, `rejected`)

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "entity_id": "770e8400-e29b-41d4-a716-446655440002",
    "document_type": "passport",
    "file_name": "passport.pdf",
    "mime_type": "application/pdf",
    "status": "pending",
    "reviewed_at": null,
    "notes": null,
    "created_at": "2026-01-25T10:00:00Z"
  }
]
```

### Review KYC Document

Approve or reject a KYC document with optional notes.

```http
PUT /backoffice/kyc-documents/{document_id}/review
```

**Path Parameters:**
- `document_id` (string, required): UUID of the document

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Document verified successfully"
}
```

**Response:** `200 OK`
```json
{
  "message": "Document reviewed successfully"
}
```

**Status Values:**
- `approved`: Document is accepted
- `rejected`: Document is rejected

### Get Document Content

Retrieve the binary content of a KYC document for preview.

```http
GET /backoffice/kyc-documents/{document_id}/content
```

**Path Parameters:**
- `document_id` (string, required): UUID of the document

**Response:** `200 OK`
- Content-Type: Document MIME type (e.g., `application/pdf`, `image/jpeg`)
- Body: Binary file content

**Error Responses:**
- `404 Not Found`: Document not found
- `403 Forbidden`: Insufficient permissions

## User Approval

### Approve User

Approve a pending user, changing their role from `PENDING` to `APPROVED` and updating entity KYC status.

```http
PUT /backoffice/users/{user_id}/approve
```

**Path Parameters:**
- `user_id` (string, required): UUID of the user

**Response:** `200 OK`
```json
{
  "message": "User user@example.com has been approved"
}
```

**Notes:**
- User role changes from `PENDING` to `APPROVED`
- If user has an entity, entity KYC status is set to `APPROVED`
- Approval email is sent to the user
- Entity is marked as verified

**Error Responses:**
- `404 Not Found`: User not found
- `400 Bad Request`: User is not pending approval

### Reject User

Reject a pending user and deactivate their account.

```http
PUT /backoffice/users/{user_id}/reject
```

**Path Parameters:**
- `user_id` (string, required): UUID of the user

**Request Body:**
```json
{
  "reason": "KYC verification failed"
}
```

**Response:** `200 OK`
```json
{
  "message": "User user@example.com has been rejected"
}
```

**Notes:**
- User account is deactivated (`is_active = false`)
- If user has an entity, entity KYC status is set to `REJECTED`

## Deposit Management

### Get All Deposits

Retrieve all deposits, optionally filtered by status or entity.

```http
GET /backoffice/deposits
```

**Query Parameters:**
- `status` (string, optional): Filter by status (`pending`, `confirmed`, `rejected`)
- `entity_id` (string, optional): Filter by entity ID

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "entity_id": "660e8400-e29b-41d4-a716-446655440001",
    "entity_name": "Example Corp",
    "user_email": "user@example.com",
    "reported_amount": 10000.0,
    "reported_currency": "EUR",
    "wire_reference": "WIRE123456",
    "bank_reference": "BANK789",
    "status": "pending",
    "reported_at": "2026-01-25T10:00:00Z",
    "notes": null,
    "created_at": "2026-01-25T10:00:00Z"
  }
]
```

### Confirm Deposit

Confirm a pending deposit with the actual received amount.

```http
PUT /backoffice/deposits/{deposit_id}/confirm
```

**Path Parameters:**
- `deposit_id` (string, required): UUID of the deposit

**Request Body:**
```json
{
  "amount": 10000.0,
  "currency": "EUR",
  "notes": "Deposit confirmed via wire transfer"
}
```

**Response:** `200 OK`
```json
{
  "message": "Deposit confirmed successfully"
}
```

**Notes:**
- Updates entity balance with confirmed amount
- Changes user role from `APPROVED` to `FUNDED` if applicable
- Grants Cash Market access to the user
- Deposit status changes to `confirmed`

**Error Responses:**
- `404 Not Found`: Deposit not found
- `400 Bad Request`: Invalid amount or currency
- `400 Bad Request`: Deposit is not in pending status

### Reject Deposit

Reject a pending deposit.

```http
PUT /backoffice/deposits/{deposit_id}/reject
```

**Path Parameters:**
- `deposit_id` (string, required): UUID of the deposit

**Response:** `200 OK`
```json
{
  "message": "Deposit rejected"
}
```

**Notes:**
- Deposit status changes to `rejected`
- No balance changes are made
- User is notified of rejection

## Pending Users

### Get Pending Users

Retrieve all users pending approval with their document counts.

```http
GET /backoffice/pending-users
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "entity_name": "Example Corp",
    "documents_count": 3,
    "created_at": "2026-01-25T10:00:00Z"
  }
]
```

**Notes:**
- Returns only users with role `PENDING`
- Includes count of uploaded KYC documents
- Includes entity name if user has an associated entity

## Error Responses

All endpoints use standardized error responses. See [API Error Handling](./ERROR_HANDLING.md) for complete error response format and error codes.

**Common Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
  ```json
  {
    "detail": {
      "error": "Could not validate credentials",
      "code": "UNAUTHORIZED"
    }
  }
  ```

- `403 Forbidden`: User does not have admin role
  ```json
  {
    "detail": {
      "error": "Admin access required",
      "code": "FORBIDDEN"
    }
  }
  ```

- `404 Not Found`: Resource not found
  ```json
  {
    "detail": {
      "error": "User not found",
      "code": "NOT_FOUND",
      "details": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000"
      }
    }
  }
  ```

- `500 Internal Server Error`: Server error
  ```json
  {
    "detail": {
      "error": "An error occurred while processing request",
      "code": "DATABASE_ERROR",
      "details": {
        "operation": "retrieving user details"
      }
    }
  }
  ```

## Contact Requests (Admin)

Contact requests (join and NDA submissions) are listed and managed from the Onboarding → Contact Requests tab. NDA form data and PDF are stored in the database; the list and count badge update in real time via WebSocket.

### Get Contact Requests

Paginated list with optional status filter.

```http
GET /admin/contact-requests
```

**Query Parameters:**
- `status` (string, optional): Filter by status (e.g. `new`, `approved`, `rejected`)
- `page` (integer, default 1): Page number
- `per_page` (integer, default 20, max 100): Items per page

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_name": "Example Corp",
      "contact_email": "user@example.com",
      "contact_name": "John Doe",
      "position": "Director",
      "request_type": "nda",
      "nda_file_name": "signed_nda.pdf",
      "submitter_ip": "192.168.1.1",
      "status": "new",
      "notes": null,
      "created_at": "2026-01-29T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

**Notes:**
- Requires admin authentication.
- `request_type` is `join` or `nda`. NDA requests include `nda_file_name`; the PDF is served by GET `/admin/contact-requests/{request_id}/nda` and the frontend opens it in a new browser tab via `adminApi.openNDAInBrowser`. If the browser blocks the pop-up, the UI shows "Allow pop-ups for this site and try again."

### Get NDA File

Returns the NDA PDF for a contact request. Admin only. The frontend fetches this with auth and opens the blob in a new tab; the backend sends `Content-Disposition: attachment` but the client displays the PDF in-browser.

```http
GET /admin/contact-requests/{request_id}/nda
```

**Path Parameters:**
- `request_id` (string, required): UUID of the contact request

**Response:** `200 OK`
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="{nda_file_name}"`
- **Body:** Binary PDF content

**Error Responses:**
- `404 Not Found`: Contact request not found, or no NDA file attached

**Example (frontend):**
```typescript
await adminApi.openNDAInBrowser(requestId, request.nda_file_name);
// Fetches blob, creates object URL, opens in new tab with noopener.
// Throws Error('POPUP_BLOCKED') if window.open is blocked.
```

### Update Contact Request

Update status or notes (e.g. reject, add internal notes).

```http
PUT /admin/contact-requests/{request_id}
```

**Path Parameters:**
- `request_id` (string, required): UUID of the contact request

**Request Body:**
```json
{
  "status": "rejected",
  "notes": "Optional internal notes"
}
```

- `status` (string, optional): New status (e.g. `new`, `approved`, `rejected`)
- `notes` (string, optional): Admin notes

**Response:** `200 OK`
```json
{
  "message": "Contact request updated"
}
```

**Error Responses:**
- `404 Not Found`: Contact request not found

### WebSocket `new_request` Payload

When a new contact or NDA request is submitted, the backoffice WebSocket broadcasts `new_request` with the same shape as one item in GET `/admin/contact-requests` (id, entity_name, contact_email, contact_name, position, request_type, nda_file_name, submitter_ip, status, notes, created_at). Frontend uses this to update the list and badge without refresh. The HTTP API and WebSocket layer transform responses to camelCase; the frontend normalizes contact-request payloads back to snake_case in the realtime hook (`useBackofficeRealtime`) so backoffice components receive `entity_name`, `contact_email`, etc.

---

## WebSocket Support

The backoffice API supports real-time updates via WebSocket connection:

**Endpoint:** `ws://localhost:8000/api/v1/backoffice/ws`

### Connection Details

- **Heartbeat Interval:** 30 seconds (automatic keep-alive)
- **Error Handling:** Automatic reconnection with proper logging
- **Authentication:** Uses same JWT token as HTTP endpoints

### Message Types

- `connected`: Initial connection confirmation
- `heartbeat`: Keep-alive message (every 30 seconds)
- `new_request`: New contact request received
- `request_updated`: Contact request status updated
- `request_deleted`: Contact request deleted
- `kyc_document_uploaded`: New KYC document uploaded
- `kyc_document_reviewed`: KYC document reviewed
- `kyc_document_deleted`: KYC document deleted
- `user_created`: New user created from contact request

### Error Handling

WebSocket errors are automatically logged with full exception details. Connections are gracefully cleaned up on error or disconnect.

**See:** Frontend implementation in `frontend/src/hooks/useBackofficeRealtime.ts` for usage examples.
