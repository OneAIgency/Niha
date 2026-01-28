"""
Standardized error handling and exception utilities.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
) -> HTTPException:
    """
    Create a standardized error response.

    Args:
        status_code: HTTP status code
        error_code: Machine-readable error code
        message: Human-readable error message
        details: Optional additional details

    Returns:
        HTTPException with standardized format
    """
    error_detail = {"error": message, "code": error_code}
    if details:
        error_detail["details"] = details

    return HTTPException(status_code=status_code, detail=error_detail)


def handle_database_error(
    e: Exception, operation: str, logger_instance: Optional[logging.Logger] = None
) -> HTTPException:
    """
    Handle database errors with proper logging and user-friendly messages.

    Args:
        e: The exception that occurred
        operation: Description of the operation that failed
        logger_instance: Optional logger instance (defaults to module logger)

    Returns:
        HTTPException with appropriate error message
    """
    log = logger_instance or logger
    log.error(f"Database error during {operation}: {e}", exc_info=True)

    # Check for common database errors
    error_msg = str(e).lower()
    if "unique constraint" in error_msg or "duplicate key" in error_msg:
        return create_error_response(
            status_code=status.HTTP_409_CONFLICT,
            error_code="DUPLICATE_ENTRY",
            message="A record with this information already exists",
            details={"operation": operation},
        )
    elif "foreign key constraint" in error_msg:
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_REFERENCE",
            message="Referenced record does not exist",
            details={"operation": operation},
        )
    elif "not null constraint" in error_msg:
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="MISSING_REQUIRED_FIELD",
            message="Required field is missing",
            details={"operation": operation},
        )
    else:
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            message=f"An error occurred while {operation}",
            details={"operation": operation},
        )


# Common error codes
class ErrorCodes:
    """Standard error codes for the application"""

    # Authentication & Authorization
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

    # Resource errors
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY"

    # Validation errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"

    # Database errors
    DATABASE_ERROR = "DATABASE_ERROR"
    INVALID_REFERENCE = "INVALID_REFERENCE"

    # Business logic errors
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE"
    INVALID_STATE = "INVALID_STATE"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
