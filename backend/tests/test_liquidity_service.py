"""Tests for liquidity service"""
import pytest
from decimal import Decimal
from app.services.liquidity_service import LiquidityService
from app.models.models import MarketMakerClient, User, MarketMakerType, UserRole

@pytest.mark.asyncio
async def test_get_liquidity_providers(db_session, test_admin_user):
    """Test fetching EUR-holding market makers"""
    # Create a second user for the asset holder MM
    ah_user = User(
        email="ah_user@test.com",
        first_name="Asset",
        last_name="Holder",
        password_hash="hashed_password_here",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(ah_user)
    await db_session.commit()
    await db_session.refresh(ah_user)

    # Create liquidity provider MM
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Test",
        mm_type=MarketMakerType.LIQUIDITY_PROVIDER,
        eur_balance=Decimal("100000"),
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(lp_mm)

    # Create asset holder MM (should not be returned)
    ah_mm = MarketMakerClient(
        user_id=ah_user.id,
        name="AH-Test",
        mm_type=MarketMakerType.ASSET_HOLDER,
        is_active=True,
        created_by=test_admin_user.id
    )
    db_session.add(ah_mm)
    await db_session.commit()

    # Test
    result = await LiquidityService.get_liquidity_providers(db_session)

    assert len(result) == 1
    assert result[0].id == lp_mm.id
    assert result[0].eur_balance == Decimal("100000")
