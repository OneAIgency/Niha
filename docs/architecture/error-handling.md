# Error Handling Architecture

**Version:** 1.0  
**Last Updated:** 2026-01-25  
**Status:** Production

## Overview

The Nihao Carbon Platform uses a standardized error handling system that provides consistent error responses across all API endpoints, proper database transaction management, and comprehensive error logging.

## Error Handling Module

### Location
`backend/app/core/exceptions.py`

### Core Functions

#### `create_error_response()`
Creates standardized HTTPException responses with consistent format.

**Parameters:**
- `status_code` (int): HTTP status code
- `error_code` (str): Machine-readable error code
- `message` (str): Human-readable error message
- `details` (Optional[Dict]): Additional error details

**Returns:**
- `HTTPException` with standardized format:
  ```json
  {
    "error": "Human-readable message",
    "code": "ERROR_CODE",
    "details": { /* optional */ }
  }
  ```

**Example:**
```python
from ...core.exceptions import create_error_response, ErrorCodes

raise create_error_response(
    status_code=404,
    error_code=ErrorCodes.NOT_FOUND,
    message="User not found",
    details={"user_id": str(user_id)}
)
```

#### `handle_database_error()`
Handles database exceptions with proper logging and user-friendly error messages.

**Parameters:**
- `e` (Exception): The exception that occurred
- `operation` (str): Description of the operation that failed
- `logger_instance` (Optional[Logger]): Optional logger instance

**Returns:**
- `HTTPException` with appropriate error message based on exception type

**Handled Error Types:**
- `DUPLICATE_ENTRY` (409) - Unique constraint violations
- `INVALID_REFERENCE` (400) - Foreign key constraint violations
- `MISSING_REQUIRED_FIELD` (400) - Not null constraint violations
- `DATABASE_ERROR` (500) - Generic database errors

**Example:**
```python
try:
    db.add(document)
    await db.commit()
except Exception as e:
    await db.rollback()
    raise handle_database_error(e, "uploading KYC document", logger)
```

### Error Codes

The `ErrorCodes` class provides standard error codes for the application:

**Authentication & Authorization:**
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `INVALID_CREDENTIALS` - Invalid login credentials

**Resource Errors:**
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `DUPLICATE_ENTRY` - Duplicate record violation

**Validation Errors:**
- `VALIDATION_ERROR` - General validation failure
- `INVALID_INPUT` - Invalid input data
- `MISSING_REQUIRED_FIELD` - Required field missing

**Database Errors:**
- `DATABASE_ERROR` - Generic database error
- `INVALID_REFERENCE` - Invalid foreign key reference

**Business Logic Errors:**
- `INSUFFICIENT_BALANCE` - Insufficient account balance
- `INVALID_STATE` - Invalid operation for current state
- `OPERATION_NOT_ALLOWED` - Operation not permitted

## Database Transaction Management

### Pattern

All database write operations should follow this pattern:

```python
try:
    # Database operations
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
except Exception as e:
    await db.rollback()
    raise handle_database_error(e, "operation description", logger)
```

### Implementation Locations

**Onboarding API** (`backend/app/api/v1/onboarding.py`):
- Document upload operations
- Document deletion operations
- KYC submission operations

**Backoffice API** (`backend/app/api/v1/backoffice.py`):
- User approval operations
- Deposit confirmation operations
- Asset management operations

### Best Practices

1. **Always use try/except** for database write operations
2. **Always rollback** on error before raising exception
3. **Use handle_database_error()** for consistent error responses
4. **Log errors** with context (operation description, user ID, etc.)
5. **Clean up resources** (e.g., delete uploaded files if DB operation fails)

## Error Response Format

### Standard Format

All API errors follow this structure:

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

### Status Code Mapping

| Error Type | Status Code | Error Code |
|------------|-------------|------------|
| Validation Error | 400 | `VALIDATION_ERROR` |
| Authentication Required | 401 | `UNAUTHORIZED` |
| Insufficient Permissions | 403 | `FORBIDDEN` |
| Resource Not Found | 404 | `NOT_FOUND` |
| Conflict (Duplicate) | 409 | `DUPLICATE_ENTRY` |
| Server Error | 500 | `DATABASE_ERROR` |

## Logging

### Error Logging

All errors are logged with:
- Full exception traceback (`exc_info=True`)
- Operation context
- User information (when available)

**Example:**
```python
logger.error(f"Database error during {operation}: {e}", exc_info=True)
```

### Log Levels

- **ERROR**: Database errors, critical failures
- **WARNING**: Non-critical issues (e.g., default passwords in production)
- **INFO**: Normal operations (user creation, document upload)
- **DEBUG**: Detailed debugging information

## WebSocket Error Handling

### Pattern

WebSocket connections use try/except with proper logging:

```python
try:
    await websocket.send_json({...})
except Exception as e:
    logger.error(f"WebSocket error: {e}", exc_info=True)
    backoffice_ws_manager.disconnect(websocket)
```

### Implementation

**Location:** `backend/app/api/v1/backoffice.py`

**Features:**
- Proper exception logging
- Graceful connection cleanup
- Heartbeat error handling

## Frontend Error Handling

### API Error Responses

Frontend should handle standardized error responses:

```typescript
try {
  await api.updateProfile(data);
} catch (error: any) {
  const errorDetail = error.response?.data?.detail;
  if (errorDetail?.code === 'VALIDATION_ERROR') {
    // Handle validation error
  } else if (errorDetail?.code === 'NOT_FOUND') {
    // Handle not found
  }
}
```

### Error Display

- Display `errorDetail.error` to users (human-readable message)
- Use `errorDetail.code` for conditional logic
- Log `errorDetail.details` for debugging

## Configuration

### Environment Variables

No additional environment variables required. Error handling uses existing logging configuration.

### Settings

Error handling respects:
- `settings.DEBUG` - Controls exception detail level
- `settings.ENVIRONMENT` - Affects error message verbosity

## Troubleshooting

### Common Issues

**Issue:** Database errors not being caught
**Solution:** Ensure all database operations are wrapped in try/except blocks

**Issue:** Errors not logged
**Solution:** Check logger configuration and ensure `exc_info=True` is used

**Issue:** Inconsistent error format
**Solution:** Always use `create_error_response()` or `handle_database_error()`

### Debugging

1. Check application logs for full exception tracebacks
2. Verify database connection pool status
3. Review error response format in API responses
4. Test error scenarios with invalid data

## Migration Guide

### Before (Inconsistent)

```python
if not user:
    raise HTTPException(status_code=404, detail="User not found")

await db.commit()  # No error handling
```

### After (Standardized)

```python
if not user:
    raise create_error_response(
        status_code=404,
        error_code=ErrorCodes.NOT_FOUND,
        message="User not found",
        details={"user_id": str(user_id)}
    )

try:
    await db.commit()
except Exception as e:
    await db.rollback()
    raise handle_database_error(e, "updating user profile", logger)
```

## Related Documentation

- [Database Access Guide](../DATABASE_ACCESS.md)
- [API Documentation](../api/)
- [Architecture Overview](./)
