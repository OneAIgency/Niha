"""System Health API Router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import User
from ...services.processor_registry import get_all_statuses

router = APIRouter(prefix="/admin/system-health", tags=["System Health"])


@router.get("/processors")
async def get_processor_statuses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get status of all background processors (Admin only)."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return {"processors": get_all_statuses()}
