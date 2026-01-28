"""
Asset Management API - Admin only

Allows admins to credit/debit CEA and EUA to entities.
Critical for seeding the platform with tradeable assets.
"""

from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.database import get_db
from ...core.security import get_admin_user
from ...models.models import (
    AssetType,
    AssetTransaction,
    Entity,
    EntityHolding,
    TransactionType,
    User,
)
from ...services.balance_utils import update_entity_balance

router = APIRouter(prefix="/assets", tags=["Assets"])


# ============== Schemas ==============

class AssetCreditRequest(BaseModel):
    """Request to credit assets to an entity"""
    entity_id: str
    asset_type: str = Field(..., description="CEA, EUA, or EUR")
    amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class AssetDebitRequest(BaseModel):
    """Request to debit assets from an entity"""
    entity_id: str
    asset_type: str = Field(..., description="CEA, EUA, or EUR")
    amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class EntityBalanceResponse(BaseModel):
    """Entity balance summary"""
    entity_id: str
    entity_name: str
    balances: dict  # {asset_type: quantity}


class TransactionHistoryResponse(BaseModel):
    """Transaction history item"""
    id: str
    entity_id: str
    entity_name: Optional[str]
    asset_type: str
    transaction_type: str
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    notes: Optional[str]
    created_at: str


# ============== Endpoints ==============

@router.post("/credit")
async def credit_assets(
    request: AssetCreditRequest,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Credit assets to an entity (Admin only).
    Used for seeding CEA/EUA or correcting balances.
    """
    try:
        asset_type = AssetType(request.asset_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset type")

    entity_id = UUID(request.entity_id)

    # Verify entity exists
    result = await db.execute(select(Entity).where(Entity.id == entity_id))
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Credit balance
    await update_entity_balance(
        db=db,
        entity_id=entity_id,
        asset_type=asset_type,
        amount=request.amount,
        transaction_type=TransactionType.ADJUSTMENT,
        created_by=admin_user.id,
        reference=f"admin_credit",
        notes=request.notes or f"Admin credit: {request.amount} {asset_type.value}",
    )

    await db.commit()

    return {
        "success": True,
        "message": f"Credited {request.amount} {asset_type.value} to {entity.name}",
    }


@router.post("/debit")
async def debit_assets(
    request: AssetDebitRequest,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Debit assets from an entity (Admin only).
    Used for corrections or removing test data.
    """
    try:
        asset_type = AssetType(request.asset_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset type")

    entity_id = UUID(request.entity_id)

    # Verify entity exists
    result = await db.execute(select(Entity).where(Entity.id == entity_id))
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Debit balance (negative amount)
    try:
        await update_entity_balance(
            db=db,
            entity_id=entity_id,
            asset_type=asset_type,
            amount=-request.amount,
            transaction_type=TransactionType.ADJUSTMENT,
            created_by=admin_user.id,
            reference=f"admin_debit",
            notes=request.notes or f"Admin debit: {request.amount} {asset_type.value}",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to debit: {str(e)}")

    await db.commit()

    return {
        "success": True,
        "message": f"Debited {request.amount} {asset_type.value} from {entity.name}",
    }


@router.get("/entities", response_model=List[EntityBalanceResponse])
async def get_all_entity_balances(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get balance summary for all entities (Admin only).
    """
    result = await db.execute(
        select(Entity).options(selectinload(Entity.holdings))
    )
    entities = result.scalars().all()

    response = []
    for entity in entities:
        balances = {}
        for holding in entity.holdings:
            balances[holding.asset_type.value] = float(holding.quantity)
        
        response.append(
            EntityBalanceResponse(
                entity_id=str(entity.id),
                entity_name=entity.name,
                balances=balances,
            )
        )

    return response


@router.get("/entities/{entity_id}/balances")
async def get_entity_balances(
    entity_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed balance for a specific entity (Admin only).
    """
    entity_uuid = UUID(entity_id)
    
    result = await db.execute(
        select(Entity).options(selectinload(Entity.holdings)).where(Entity.id == entity_uuid)
    )
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    balances = {}
    for holding in entity.holdings:
        balances[holding.asset_type.value] = {
            "quantity": float(holding.quantity),
            "updated_at": holding.updated_at.isoformat() if holding.updated_at else None,
        }

    return {
        "entity_id": str(entity.id),
        "entity_name": entity.name,
        "balances": balances,
    }


@router.get("/transactions", response_model=List[TransactionHistoryResponse])
async def get_transaction_history(
    entity_id: Optional[str] = None,
    asset_type: Optional[str] = None,
    limit: int = 100,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get transaction history with optional filters (Admin only).
    """
    query = select(AssetTransaction).options(
        selectinload(AssetTransaction.entity)
    ).order_by(AssetTransaction.created_at.desc()).limit(limit)

    if entity_id:
        query = query.where(AssetTransaction.entity_id == UUID(entity_id))
    
    if asset_type:
        try:
            query = query.where(AssetTransaction.asset_type == AssetType(asset_type))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset type")

    result = await db.execute(query)
    transactions = result.scalars().all()

    return [
        TransactionHistoryResponse(
            id=str(tx.id),
            entity_id=str(tx.entity_id) if tx.entity_id else "",
            entity_name=tx.entity.name if tx.entity else None,
            asset_type=tx.asset_type.value if tx.asset_type else "",
            transaction_type=tx.transaction_type.value,
            amount=tx.amount,
            balance_before=tx.balance_before or Decimal(0),
            balance_after=tx.balance_after,
            notes=tx.notes,
            created_at=tx.created_at.isoformat() if tx.created_at else "",
        )
        for tx in transactions
    ]
