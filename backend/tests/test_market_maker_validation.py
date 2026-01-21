"""Tests for market maker validation logic"""
import pytest
from app.models.models import MarketMakerType
from app.schemas.schemas import MarketMakerCreate
from decimal import Decimal
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_cash_buyer_requires_eur(db_session, test_admin_user):
    """CASH_BUYER must have EUR balance only"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    # Test 1: CASH_BUYER with certificate balances (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Cash Buyer",
                email="cash_buyer_1@example.com",
                mm_type="CASH_BUYER",
                initial_balances={"CEA": Decimal("1000")}  # WRONG: has CEA
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CASH_BUYER cannot have certificate balances" in str(exc.value.detail)

    # Test 2: CASH_BUYER with no EUR balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Cash Buyer",
                email="cash_buyer_2@example.com",
                mm_type="CASH_BUYER",
                initial_balances=None
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CASH_BUYER must have positive initial_eur_balance" in str(exc.value.detail)

    # Test 3: CASH_BUYER with zero EUR balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Cash Buyer",
                email="cash_buyer_3@example.com",
                mm_type="CASH_BUYER",
                initial_eur_balance=Decimal("0")
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CASH_BUYER must have positive initial_eur_balance" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_cea_cash_seller_requires_cea(db_session, test_admin_user):
    """CEA_CASH_SELLER must have CEA balance only"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    # Test 1: CEA_CASH_SELLER with EUR balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test CEA Seller",
                email="cea_seller_1@example.com",
                mm_type="CEA_CASH_SELLER",
                initial_eur_balance=Decimal("10000")  # WRONG: has EUR
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CEA_CASH_SELLER cannot have EUR balance" in str(exc.value.detail)

    # Test 2: CEA_CASH_SELLER with no CEA balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test CEA Seller",
                email="cea_seller_2@example.com",
                mm_type="CEA_CASH_SELLER",
                initial_balances=None
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CEA_CASH_SELLER must have initial CEA balance" in str(exc.value.detail)

    # Test 3: CEA_CASH_SELLER with EUA balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test CEA Seller",
                email="cea_seller_3@example.com",
                mm_type="CEA_CASH_SELLER",
                initial_balances={"CEA": Decimal("1000"), "EUA": Decimal("500")}  # WRONG: has EUA
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CEA_CASH_SELLER can only have CEA balance" in str(exc.value.detail)

    # Test 4: CEA_CASH_SELLER with only EUA (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test CEA Seller",
                email="cea_seller_4@example.com",
                mm_type="CEA_CASH_SELLER",
                initial_balances={"EUA": Decimal("1000")}  # WRONG: no CEA
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "CEA_CASH_SELLER must have initial CEA balance" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_swap_maker_requires_both(db_session, test_admin_user):
    """SWAP_MAKER must have both CEA and EUA balances"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    # Test 1: SWAP_MAKER with EUR balance (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Swap Maker",
                email="swap_maker_1@example.com",
                mm_type="SWAP_MAKER",
                initial_eur_balance=Decimal("10000"),  # WRONG: has EUR
                initial_balances={"CEA": Decimal("1000"), "EUA": Decimal("500")}
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "SWAP_MAKER operates in SWAP market, cannot have EUR" in str(exc.value.detail)

    # Test 2: SWAP_MAKER with only CEA (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Swap Maker",
                email="swap_maker_2@example.com",
                mm_type="SWAP_MAKER",
                initial_balances={"CEA": Decimal("1000")}  # WRONG: missing EUA
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "SWAP_MAKER must have both CEA and EUA balances" in str(exc.value.detail)

    # Test 3: SWAP_MAKER with only EUA (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Swap Maker",
                email="swap_maker_3@example.com",
                mm_type="SWAP_MAKER",
                initial_balances={"EUA": Decimal("500")}  # WRONG: missing CEA
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "SWAP_MAKER must have both CEA and EUA balances" in str(exc.value.detail)

    # Test 4: SWAP_MAKER with no balances (WRONG)
    with pytest.raises(HTTPException) as exc:
        await create_market_maker(
            request=request,
            data=MarketMakerCreate(
                name="Test Swap Maker",
                email="swap_maker_4@example.com",
                mm_type="SWAP_MAKER",
                initial_balances=None
            ),
            admin_user=test_admin_user,
            db=db_session
        )
    assert exc.value.status_code == 400
    assert "SWAP_MAKER must have both CEA and EUA balances" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_cash_buyer_valid(db_session, test_admin_user):
    """CASH_BUYER with valid EUR balance should succeed"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    result = await create_market_maker(
        request=request,
        data=MarketMakerCreate(
            name="Valid Cash Buyer",
            email="valid_cash_buyer@example.com",
            mm_type="CASH_BUYER",
            initial_eur_balance=Decimal("50000")  # CORRECT: EUR only
        ),
        admin_user=test_admin_user,
        db=db_session
    )

    assert result["id"] is not None
    assert result["ticket_id"] is not None
    assert "Valid Cash Buyer" in result["message"]


@pytest.mark.asyncio
async def test_cea_cash_seller_valid(db_session, test_admin_user):
    """CEA_CASH_SELLER with valid CEA balance should succeed"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    result = await create_market_maker(
        request=request,
        data=MarketMakerCreate(
            name="Valid CEA Seller",
            email="valid_cea_seller@example.com",
            mm_type="CEA_CASH_SELLER",
            initial_balances={"CEA": Decimal("10000")}  # CORRECT: CEA only
        ),
        admin_user=test_admin_user,
        db=db_session
    )

    assert result["id"] is not None
    assert result["ticket_id"] is not None
    assert "Valid CEA Seller" in result["message"]


@pytest.mark.asyncio
async def test_swap_maker_valid(db_session, test_admin_user):
    """SWAP_MAKER with valid CEA and EUA balances should succeed"""
    from app.api.v1.market_maker import create_market_maker
    from unittest.mock import MagicMock

    # Mock request object
    request = MagicMock()

    result = await create_market_maker(
        request=request,
        data=MarketMakerCreate(
            name="Valid Swap Maker",
            email="valid_swap_maker@example.com",
            mm_type="SWAP_MAKER",
            initial_balances={"CEA": Decimal("5000"), "EUA": Decimal("3000")}  # CORRECT: both CEA and EUA
        ),
        admin_user=test_admin_user,
        db=db_session
    )

    assert result["id"] is not None
    assert result["ticket_id"] is not None
    assert "Valid Swap Maker" in result["message"]
