# API Error Handling

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Base URL:** `/api/v1`

## Overview

All API endpoints return standardized error responses with consistent format, error codes, and detailed error information for debugging and user feedback.

## Error Response Format

### Standard Structure

All error responses follow this format:

```json
{
  "detail": {
    "error": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "operation": "operation description",
      "field": "field_name",
      "value": "invalid_value"
    }
  }
}
```

### Response Fields

- **`error`** (string): Human-readable error message for end users
- **`code`** (string): Machine-readable error code for programmatic handling
- **`details`** (object, optional): Additional context about the error

## Error Codes

### Authentication & Authorization

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `FORBIDDEN` | 403 | Insufficient permissions for operation |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |

### Resource Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `ALREADY_EXISTS` | 409 | Resource with this identifier already exists |
| `DUPLICATE_ENTRY` | 409 | Duplicate record violation (unique constraint) |

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | General validation failure |
| `INVALID_INPUT` | 400 | Invalid input data format |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing |

### Database Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DATABASE_ERROR` | 500 | Generic database operation error |
| `INVALID_REFERENCE` | 400 | Referenced record does not exist (foreign key) |

### Business Logic Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_BALANCE` | 400 | Account balance insufficient for operation |
| `INVALID_STATE` | 400 | Operation not valid for current resource state |
| `OPERATION_NOT_ALLOWED` | 403 | Operation not permitted in current context |

## Example Error Responses

### Not Found

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "detail": {
    "error": "User not found",
    "code": "NOT_FOUND",
    "details": {
      "operation": "retrieving user profile",
      "user_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

### Validation Error

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "detail": {
    "error": "Required field is missing",
    "code": "MISSING_REQUIRED_FIELD",
    "details": {
      "operation": "creating order",
      "field": "quantity",
      "value": null
    }
  }
}
```

### Duplicate Entry

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "detail": {
    "error": "A record with this information already exists",
    "code": "DUPLICATE_ENTRY",
    "details": {
      "operation": "creating user",
      "field": "email",
      "value": "user@example.com"
    }
  }
}
```

### Database Error

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "detail": {
    "error": "An error occurred while uploading KYC document",
    "code": "DATABASE_ERROR",
    "details": {
      "operation": "uploading KYC document"
    }
  }
}
```

## Client-Side Error Handling

### JavaScript/TypeScript Example

```typescript
try {
  const response = await api.updateProfile(data);
  // Success handling
} catch (error: any) {
  const errorDetail = error.response?.data?.detail;
  
  if (errorDetail) {
    switch (errorDetail.code) {
      case 'NOT_FOUND':
        // Handle not found
        showError(`Resource not found: ${errorDetail.error}`);
        break;
      case 'VALIDATION_ERROR':
        // Handle validation error
        showError(`Validation failed: ${errorDetail.error}`);
        break;
      case 'DUPLICATE_ENTRY':
        // Handle duplicate
        showError(`Already exists: ${errorDetail.error}`);
        break;
      default:
        // Generic error
        showError(errorDetail.error || 'An error occurred');
    }
  } else {
    // Network or other error
    showError('Network error. Please try again.');
  }
}
```

### Error Code Constants

```typescript
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  // ... etc
} as const;
```

## Best Practices

### For API Consumers

1. **Check error code** for programmatic handling
2. **Display error message** to users (human-readable)
3. **Log error details** for debugging
4. **Handle specific codes** differently (e.g., retry on 500, don't retry on 400)

### For API Developers

1. **Always use standardized error functions** (`create_error_response`, `handle_database_error`)
2. **Include operation context** in error details
3. **Log errors** with full exception information
4. **Rollback transactions** on database errors
5. **Use appropriate HTTP status codes**

## Error Logging

All errors are logged server-side with:
- Full exception traceback
- Operation context
- User information (when available)
- Request details

Logs are available in application logs and can be monitored for error patterns.

## Related Documentation

- [Error Handling Architecture](../architecture/error-handling.md)
- [Authentication API](./AUTHENTICATION.md)
- [Backoffice API](./BACKOFFICE_API.md)
- [Admin Scraping API](./ADMIN_SCRAPING_API.md)
