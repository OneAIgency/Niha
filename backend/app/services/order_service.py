"""Order creation utilities and helpers"""

from typing import Optional
from uuid import UUID

from app.models.models import CertificateType, MarketMakerClient, MarketType


def determine_order_market(
    market_maker: Optional[MarketMakerClient] = None,
    entity_id: Optional[UUID] = None,
    certificate_type: Optional[CertificateType] = None,
) -> MarketType:
    """
    Determine which market an order belongs to.

    Logic:
    - If order has market_maker_id: Use MM's market (via mm.market property)
    - If order is for entity: Default to CEA_CASH (only cash market for entities)

    Args:
        market_maker: MarketMakerClient instance if order is from MM
        entity_id: Entity UUID if order is from regular entity
        certificate_type: Type of certificate being traded

    Returns:
        MarketType enum value

    Raises:
        ValueError: If neither market_maker nor entity_id provided

    Examples:
        >>> mm = MarketMakerClient(mm_type=MarketMakerType.CEA_CASH_SELLER)
        >>> determine_order_market(market_maker=mm)
        MarketType.CEA_CASH

        >>> determine_order_market(entity_id=UUID(...))
        MarketType.CEA_CASH
    """
    if market_maker:
        # Use MM's market property
        return market_maker.market

    if entity_id:
        # Entities currently only trade in CEA_CASH market
        # TODO: When SWAP market opens to entities, add logic here
        return MarketType.CEA_CASH

    raise ValueError(
        "Must provide either market_maker or entity_id to determine market"
    )
