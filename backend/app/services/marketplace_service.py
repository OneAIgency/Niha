import logging
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.models import (
    Certificate,
    CertificateStatus,
    CertificateType,
    Entity,
    EntityHolding,
    AssetType,
    Trade,
    TradeType,
    TradeStatus,
    TransactionType,
)
from ..services.balance_utils import update_entity_balance

logger = logging.getLogger(__name__)

class MarketplaceServiceError(Exception):
    pass

class InsufficientBalanceError(MarketplaceServiceError):
    pass

class ListingNotFoundError(MarketplaceServiceError):
    pass

class SelfTradeError(MarketplaceServiceError):
    pass

class MarketplaceService:
    @staticmethod
    async def get_listings(
        db: AsyncSession,
        certificate_type: CertificateType,
        min_quantity: Optional[int] = None,
        max_price: Optional[Decimal] = None,
        limit: int = 50,
        offset: int = 0
    ) -> dict:
        """
        Get active listings from the database.
        """
        query = select(Certificate).options(
            selectinload(Certificate.entity)
        ).where(
            and_(
                Certificate.certificate_type == certificate_type,
                Certificate.status == CertificateStatus.AVAILABLE
            )
        )

        if min_quantity:
            query = query.where(Certificate.quantity >= min_quantity)
        
        if max_price:
            query = query.where(Certificate.unit_price <= max_price)

        # Count query (simplified)
        # In prod, perform separate count
        
        query = query.order_by(Certificate.unit_price.asc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        items = result.scalars().all()
        
        return {
            "data": items,
            "count": len(items) # Placeholder for pagination count
        }

    @staticmethod
    async def create_listing(
        db: AsyncSession,
        entity_id: uuid.UUID,
        certificate_type: CertificateType,
        quantity: Decimal,
        unit_price: Decimal,
        vintage_year: Optional[int] = 2024
    ) -> Certificate:
        """
        Create a new marketplace listing (Certificate).
        Locks the assets from EntityHolding.
        """
        # 1. Check and Lock Balance
        asset_type_map = {
            CertificateType.EUA: AssetType.EUA,
            CertificateType.CEA: AssetType.CEA
        }
        asset_type = asset_type_map[certificate_type]
        
        # Deduct from holding (throws if insufficient)
        await update_entity_balance(
            db=db,
            entity_id=entity_id,
            asset_type=asset_type,
            amount=-quantity, # Negative to deduct
            transaction_type=TransactionType.TRADE_SELL,
            created_by=entity_id, # Assuming system or user action
            reference=f"listing_lock",
            notes=f"Locked for listing {quantity} {certificate_type.value} @ {unit_price}"
        )

        # 2. Create Certificate Record
        certificate = Certificate(
            entity_id=entity_id,
            certificate_type=certificate_type,
            quantity=quantity,
            unit_price=unit_price,
            vintage_year=vintage_year,
            status=CertificateStatus.AVAILABLE,
            anonymous_code=f"LIST-{str(uuid.uuid4())[:8].upper()}"
        )
        
        db.add(certificate)
        await db.flush()
        
        return certificate

    @staticmethod
    async def buy_listing(
        db: AsyncSession,
        buyer_entity_id: uuid.UUID,
        listing_id: uuid.UUID
    ) -> Trade:
        """
        Execute purchase of a listing.
        Transfers EUR from Buyer to Seller.
        Transfers Asset to Buyer (virtually - by marking cert sold? OR creating new holding?)
        
        Model decision: 
        - Seller's asset was already deducted from Holding when listed.
        - Buyer needs Asset credited to Holding.
        - Certificate record is marked SOLD (history).
        """
        
        # 1. Get Listing
        result = await db.execute(
            select(Certificate).where(Certificate.id == listing_id).with_for_update()
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise ListingNotFoundError("Listing not found")
            
        if listing.status != CertificateStatus.AVAILABLE:
            raise ListingNotFoundError("Listing is no longer available")
            
        if listing.entity_id == buyer_entity_id:
            raise SelfTradeError("Cannot buy your own listing")

        total_cost = listing.quantity * listing.unit_price
        
        # 2. Process EUR Transfer (Buyer -> Seller)
        # Deduct Buyer EUR
        await update_entity_balance(
            db=db,
            entity_id=buyer_entity_id,
            asset_type=AssetType.EUR,
            amount=-total_cost,
            transaction_type=TransactionType.TRADE_BUY,
            created_by=buyer_entity_id,
            reference=f"buy:{listing.id}",
            notes=f"Bought {listing.quantity} {listing.certificate_type.value}"
        )
        
        # Credit Seller EUR
        await update_entity_balance(
            db=db,
            entity_id=listing.entity_id,
            asset_type=AssetType.EUR,
            amount=total_cost,
            transaction_type=TransactionType.TRADE_SELL,
            created_by=buyer_entity_id, # Initiated by buyer
            reference=f"sold:{listing.id}",
            notes=f"Sold {listing.quantity} {listing.certificate_type.value}"
        )

        # 3. Process Asset Transfer (System -> Buyer)
        # Seller's asset was removed from holding at creation.
        # Now we credit the Buyer's holding.
        asset_type_map = {
            CertificateType.EUA: AssetType.EUA,
            CertificateType.CEA: AssetType.CEA
        }
        await update_entity_balance(
            db=db,
            entity_id=buyer_entity_id,
            asset_type=asset_type_map[listing.certificate_type],
            amount=listing.quantity,
            transaction_type=TransactionType.TRADE_BUY,
            created_by=buyer_entity_id,
            reference=f"asset_in:{listing.id}",
            notes=f"Received {listing.quantity} {listing.certificate_type.value}"
        )

        # 4. Update Listing Status
        listing.status = CertificateStatus.SOLD
        
        # 5. Create Trade Record
        trade = Trade(
            trade_type=TradeType.BUY,
            buyer_entity_id=buyer_entity_id,
            seller_entity_id=listing.entity_id,
            certificate_id=listing.id,
            certificate_type=listing.certificate_type,
            quantity=listing.quantity,
            price_per_unit=listing.unit_price,
            total_value=total_cost,
            status=TradeStatus.COMPLETED
        )
        db.add(trade)
        
        await db.flush()
        return trade

marketplace_service = MarketplaceService()
