"""Tests for liquidity service"""

from decimal import Decimal

import pytest

from app.models.models import (
    CertificateType,
    MarketMakerClient,
    MarketMakerType,
    User,
    UserRole,
)
from app.services.liquidity_service import LiquidityService


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
        is_active=True,
    )
    db_session.add(ah_user)
    await db_session.commit()
    await db_session.refresh(ah_user)

    # Create liquidity provider MM
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Test",
        client_code="LP-001",
        mm_type=MarketMakerType.CASH_BUYER,
        eur_balance=Decimal("100000"),
        is_active=True,
        created_by=test_admin_user.id,
    )
    db_session.add(lp_mm)

    # Create asset holder MM (should not be returned)
    ah_mm = MarketMakerClient(
        user_id=ah_user.id,
        name="AH-Test",
        client_code="AH-001",
        mm_type=MarketMakerType.CEA_CASH_SELLER,
        is_active=True,
        created_by=test_admin_user.id,
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
        initial_balances={"CEA": Decimal("5000")},
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
        initial_balances={"CEA": Decimal("0")},
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
        initial_balances={"CEA": Decimal("1000")},
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
        initial_balances={"CEA": Decimal("1000")},
    )

    ah_mm2, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-High",
        email="ah_high@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("5000")},
    )

    ah_mm3, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Test-Medium",
        email="ah_medium@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("3000")},
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
    """Test reference price calculation returns valid price

    NOTE: Full testing of mid-price calculation, best bid/ask fallbacks,
    and last price fallback requires orderbook setup and should be covered
    in integration tests.

    This unit test verifies the method returns a valid price (either from
    orderbook if exists, or default price).
    """
    result = await LiquidityService.calculate_reference_price(
        db_session, CertificateType.CEA
    )

    # Should return a valid positive price
    assert result > Decimal("0")
    assert isinstance(result, Decimal)


def test_generate_price_levels_buy():
    """Test BID price level generation"""
    from app.models.models import OrderSide

    ref_price = Decimal("100.0")
    levels = LiquidityService.generate_price_levels(ref_price, OrderSide.BUY)

    # Should have 3 levels
    assert len(levels) == 3

    # Verify prices are below reference (BID)
    assert all(price < ref_price for price, _ in levels)

    # Verify spreads (0.2%, 0.4%, 0.5% below)
    assert levels[0][0] == ref_price * Decimal("0.998")  # 0.2% below
    assert levels[1][0] == ref_price * Decimal("0.996")  # 0.4% below
    assert levels[2][0] == ref_price * Decimal("0.995")  # 0.5% below

    # Verify volume distribution (50%, 30%, 20%)
    assert levels[0][1] == Decimal("0.5")
    assert levels[1][1] == Decimal("0.3")
    assert levels[2][1] == Decimal("0.2")

    # Verify total equals 100%
    assert sum(pct for _, pct in levels) == Decimal("1.0")


def test_generate_price_levels_sell():
    """Test ASK price level generation"""
    from app.models.models import OrderSide

    ref_price = Decimal("100.0")
    levels = LiquidityService.generate_price_levels(ref_price, OrderSide.SELL)

    # Should have 3 levels
    assert len(levels) == 3

    # Verify prices are above reference (ASK)
    assert all(price > ref_price for price, _ in levels)

    # Verify spreads (0.2%, 0.4%, 0.5% above)
    assert levels[0][0] == ref_price * Decimal("1.002")
    assert levels[1][0] == ref_price * Decimal("1.004")
    assert levels[2][0] == ref_price * Decimal("1.005")

    # Verify volume distribution
    assert levels[0][1] == Decimal("0.5")
    assert levels[1][1] == Decimal("0.3")
    assert levels[2][1] == Decimal("0.2")


def test_generate_price_levels_invalid_price():
    """Test validation of negative price"""
    from app.models.models import OrderSide

    with pytest.raises(ValueError, match="reference_price must be positive"):
        LiquidityService.generate_price_levels(Decimal("-1.0"), OrderSide.BUY)

    with pytest.raises(ValueError, match="reference_price must be positive"):
        LiquidityService.generate_price_levels(Decimal("0.0"), OrderSide.BUY)


@pytest.mark.asyncio
async def test_preview_liquidity_creation_sufficient_assets(
    db_session, test_admin_user
):
    """Test preview with sufficient assets"""
    from app.services.market_maker_service import MarketMakerService

    # Create liquidity provider with EUR
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Preview",
        client_code="LP-PREVIEW",
        mm_type=MarketMakerType.CASH_BUYER,
        eur_balance=Decimal("200000"),
        is_active=True,
        created_by=test_admin_user.id,
    )
    db_session.add(lp_mm)

    # Create asset holder with CEA
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Preview",
        email="ah-preview@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Test preview
    preview = await LiquidityService.preview_liquidity_creation(
        db=db_session,
        certificate_type=CertificateType.CEA,
        bid_amount_eur=Decimal("100000"),
        ask_amount_eur=Decimal("50000"),
    )

    assert preview["can_execute"] is True
    assert len(preview["bid_plan"]["mms"]) >= 1
    assert len(preview["ask_plan"]["mms"]) >= 1
    assert preview["missing_assets"] is None


@pytest.mark.asyncio
async def test_preview_liquidity_creation_invalid_amounts(db_session, test_admin_user):
    """Test preview with invalid input amounts"""
    with pytest.raises(ValueError, match="bid_amount_eur must be positive"):
        await LiquidityService.preview_liquidity_creation(
            db=db_session,
            certificate_type=CertificateType.CEA,
            bid_amount_eur=Decimal("-100"),
            ask_amount_eur=Decimal("50000"),
        )

    with pytest.raises(ValueError, match="ask_amount_eur must be positive"):
        await LiquidityService.preview_liquidity_creation(
            db=db_session,
            certificate_type=CertificateType.CEA,
            bid_amount_eur=Decimal("100000"),
            ask_amount_eur=Decimal("0"),
        )


@pytest.mark.asyncio
async def test_create_liquidity_execution(db_session, test_admin_user):
    """Test actual liquidity creation with order placement"""
    from app.services.market_maker_service import MarketMakerService

    # Setup MMs
    lp_mm = MarketMakerClient(
        user_id=test_admin_user.id,
        name="LP-Execute",
        client_code="LP-EXECUTE",
        mm_type=MarketMakerType.CASH_BUYER,
        eur_balance=Decimal("200000"),
        is_active=True,
        created_by=test_admin_user.id,
    )
    db_session.add(lp_mm)

    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-Execute",
        email="ah-execute@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Execute liquidity creation
    result = await LiquidityService.create_liquidity(
        db=db_session,
        certificate_type=CertificateType.CEA,
        bid_amount_eur=Decimal("50000"),
        ask_amount_eur=Decimal("25000"),
        created_by_id=test_admin_user.id,
    )

    assert result.id is not None
    assert len(result.orders_created) == 6  # 3 bid + 3 ask
    assert result.actual_bid_liquidity_eur == Decimal("50000")


@pytest.mark.asyncio
async def test_create_liquidity_no_liquidity_providers(db_session, test_admin_user):
    """Test that liquidity creation fails with no liquidity providers"""
    from app.services.liquidity_service import InsufficientAssetsError
    from app.services.market_maker_service import MarketMakerService

    # Create only asset holder (no liquidity provider)
    ah_mm, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="AH-NoLP",
        email="ah-nolp@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")},
    )
    await db_session.commit()

    # Attempt to create liquidity (should fail - insufficient EUR for BID)
    # Note: Preview validation fails first with InsufficientAssetsError because
    # there's no EUR available for BID orders (no liquidity providers)
    with pytest.raises(InsufficientAssetsError, match="Insufficient EUR"):
        await LiquidityService.create_liquidity(
            db=db_session,
            certificate_type=CertificateType.CEA,
            bid_amount_eur=Decimal("50000"),
            ask_amount_eur=Decimal("25000"),
            created_by_id=test_admin_user.id,
        )


@pytest.mark.asyncio
async def test_get_cash_buyers_only(db_session, test_admin_user):
    """CASH_BUYER market makers should be selected for CEA-CASH liquidity"""
    from app.services.market_maker_service import MarketMakerService

    # Create user for cash buyer
    cash_buyer_user = User(
        email="cash_buyer@test.com",
        first_name="Cash",
        last_name="Buyer",
        password_hash="hashed_password_here",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(cash_buyer_user)
    await db_session.commit()
    await db_session.refresh(cash_buyer_user)

    # Create CASH_BUYER MM
    cash_buyer = MarketMakerClient(
        user_id=cash_buyer_user.id,
        name="Cash-Buyer-Test",
        client_code="CASH-BUYER-001",
        mm_type=MarketMakerType.CASH_BUYER,
        eur_balance=Decimal("100000"),
        is_active=True,
        created_by=test_admin_user.id,
    )
    db_session.add(cash_buyer)

    # Create CEA_CASH_SELLER MM with CEA balance
    cea_seller, _ = await MarketMakerService.create_market_maker(
        db=db_session,
        name="CEA-Seller-Test",
        email="cea-seller@test.com",
        description="Test",
        created_by_id=test_admin_user.id,
        initial_balances={"CEA": Decimal("10000")},
    )

    # Create user for swap maker
    swap_maker_user = User(
        email="swap_maker@test.com",
        first_name="Swap",
        last_name="Maker",
        password_hash="hashed_password_here",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(swap_maker_user)
    await db_session.commit()
    await db_session.refresh(swap_maker_user)

    # Create SWAP_MAKER MM (should NOT be selected)
    swap_maker = MarketMakerClient(
        user_id=swap_maker_user.id,
        name="Swap-Maker-Test",
        client_code="SWAP-001",
        mm_type=MarketMakerType.SWAP_MAKER,
        is_active=True,
        created_by=test_admin_user.id,
    )
    db_session.add(swap_maker)
    await db_session.commit()

    # Query for CEA-CASH market liquidity preview
    plan = await LiquidityService.preview_liquidity_creation(
        db=db_session,
        certificate_type=CertificateType.CEA,
        bid_amount_eur=Decimal("50000"),
        ask_amount_eur=Decimal("25000"),
    )

    # Only CASH_BUYER should be in bid plan
    assert len(plan["bid_plan"]["mms"]) == 1
    assert plan["bid_plan"]["mms"][0]["mm_type"] == "CASH_BUYER"

    # Only CEA_CASH_SELLER should be in ask plan
    assert len(plan["ask_plan"]["mms"]) == 1
    assert plan["ask_plan"]["mms"][0]["mm_type"] == "CEA_CASH_SELLER"
