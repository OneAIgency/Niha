"""
In-memory registry for background processor status.

Each background loop calls report_run(name) after completing a cycle.
The system health endpoint reads from this registry.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_registry: Dict[str, Dict[str, Any]] = {}


def register_processor(name: str, cycle_seconds: int) -> None:
    """Register a processor with its expected cycle interval."""
    _registry[name] = {
        "name": name,
        "cycle_seconds": cycle_seconds,
        "status": "idle",
        "last_run_at": None,
        "error_count": 0,
        "last_error": None,
        "run_count": 0,
    }


def report_run(name: str, success: bool = True, error: Optional[str] = None) -> None:
    """Report a completed processor run."""
    if name not in _registry:
        register_processor(name, 0)

    entry = _registry[name]
    entry["last_run_at"] = datetime.now(timezone.utc).isoformat()
    entry["run_count"] += 1

    if success:
        entry["status"] = "idle"
        entry["last_error"] = None
    else:
        entry["status"] = "error"
        entry["error_count"] += 1
        entry["last_error"] = error


def get_all_statuses() -> list:
    """Return status of all registered processors."""
    return list(_registry.values())
