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


def _collect_error_text(e: Exception) -> str:
    """Build lowercase error text from exception and optional orig/cause."""
    parts = [str(e)]
    orig = getattr(e, "orig", None) or getattr(e, "__cause__", None)
    if orig is not None and orig is not e:
        parts.append(str(orig))
    return " ".join(parts).lower()


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

    error_msg = _collect_error_text(e)
    hint = str(e).strip()[:400]

    if (
        "unique constraint" in error_msg
        or "duplicate key" in error_msg
        or "uniqueviolation" in error_msg
    ):
        return create_error_response(
            status_code=status.HTTP_409_CONFLICT,
            error_code="DUPLICATE_ENTRY",
            message="A record with this information already exists",
            details={"operation": operation},
        )
    if "foreign key constraint" in error_msg or "foreign key" in error_msg:
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_REFERENCE",
            message="Referenced record does not exist",
            details={"operation": operation},
        )
    if "not null constraint" in error_msg or "not null" in error_msg:
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="MISSING_REQUIRED_FIELD",
            message="Required field is missing",
            details={"operation": operation},
        )
    if "invalid input value for enum" in error_msg:
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_ENUM",
            message=(
                "Invalid enum value (e.g. status or role). "
                "Ensure DB migrations are applied (contactstatus/userrole include KYC, etc.). "
                "Run: docker compose exec backend alembic upgrade head"
            ),
            details={"operation": operation, "hint": hint},
        )
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="DATABASE_ERROR",
        message=f"An error occurred while {operation}",
        details={"operation": operation, "hint": hint},
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
