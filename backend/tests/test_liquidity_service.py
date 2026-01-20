"""Tests for liquidity service"""
import pytest
from decimal import Decimal
from app.services.liquidity_service import LiquidityService
from app.models.models import MarketMakerClient, User, MarketMakerType, UserRole, CertificateType

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

@pytest.mark.asyncio
async def test_get_asset_holders(db_session, test_admin_user):
    """Test fetching asset-holding market makers"""
    from app.services.market_maker_service import MarketMakerService

    # Create asset holder MM with CEA
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-CEA",
        email="ah@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("5000")}
    )

    # Test
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)

    assert len(result) >= 1
    found = any(mm_data["mm"].id == ah_mm.id for mm_data in result)
    assert found

@pytest.mark.asyncio
async def test_get_asset_holders_empty(db_session, test_admin_user):
    """Test fetching asset holders when none exist"""
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)
    assert len(result) == 0

@pytest.mark.asyncio
async def test_get_asset_holders_zero_balance(db_session, test_admin_user):
    """Test that MMs with zero balance are excluded"""
    from app.services.market_maker_service import MarketMakerService

    # Create asset holder MM with zero CEA balance
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-Zero",
        email="ah_zero@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("0")}
    )

    # Test
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)

    # MM with zero balance should not be in results
    found = any(mm_data["mm"].id == ah_mm.id for mm_data in result)
    assert not found

@pytest.mark.asyncio
async def test_get_asset_holders_inactive_excluded(db_session, test_admin_user):
    """Test that inactive MMs are excluded"""
    from app.services.market_maker_service import MarketMakerService

    # Create asset holder MM with CEA
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-Inactive",
        email="ah_inactive@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("1000")}
    )

    # Deactivate the MM
    ah_mm.is_active = False
    await db_session.commit()

    # Test
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)

    # Inactive MM should not be in results
    found = any(mm_data["mm"].id == ah_mm.id for mm_data in result)
    assert not found

@pytest.mark.asyncio
async def test_get_asset_holders_ordering(db_session, test_admin_user):
    """Test that results are ordered by available balance descending"""
    from app.services.market_maker_service import MarketMakerService

    # Create multiple asset holder MMs with different CEA balances
    ah_mm1, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-Low",
        email="ah_low@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("1000")}
    )

    ah_mm2, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-High",
        email="ah_high@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("5000")}
    )

    ah_mm3, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-Medium",
        email="ah_medium@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("3000")}
    )

    # Test
    result = await LiquidityService.get_asset_holders(db_session, CertificateType.CEA)

    # Should have at least 3 MMs
    assert len(result) >= 3

    # Verify results are sorted by available balance descending
    # Find our created MMs in the results
    mm_balances = {mm_data["mm"].id: mm_data["available"] for mm_data in result}

    assert mm_balances[ah_mm2.id] == Decimal("5000")  # High
    assert mm_balances[ah_mm3.id] == Decimal("3000")  # Medium
    assert mm_balances[ah_mm1.id] == Decimal("1000")  # Low

    # Verify overall ordering - each item should have balance >= next item
    for i in range(len(result) - 1):
        assert result[i]["available"] >= result[i + 1]["available"]

@pytest.mark.asyncio
async def test_calculate_reference_price(db_session):
    """Test reference price calculation"""
    # Mock orderbook data - in real test, create orders
    result = await LiquidityService.calculate_reference_price(
        db_session,
        CertificateType.CEA
    )

    assert result > 0
    assert isinstance(result, Decimal)
