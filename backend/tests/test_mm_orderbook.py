#!/usr/bin/env python3
"""
Test script to verify market maker orders appear in the live order book.

This script:
1. Creates a CASH_BUYER market maker with EUR balance
2. Creates several BUY orders for that market maker
3. Queries the order book to verify MM orders appear
4. Checks order aggregation
"""

import asyncio
import os
import sys
import uuid
from decimal import Decimal
from uuid import UUID

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "."))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.models.models import (  # noqa: E402
    CertificateType,
    MarketMakerClient,
    MarketMakerType,
    Order,
    OrderSide,
    OrderStatus,
    User,
    UserRole,
)
from app.services.market_maker_service import MarketMakerService  # noqa: E402
from app.services.order_matching import get_real_orderbook  # noqa: E402


async def create_admin_user(session: AsyncSession) -> UUID:
    """Create or get admin user for testing"""
    result = await session.execute(
        select(User).where(User.role == UserRole.ADMIN).limit(1)
    )
    admin = result.scalar_one_or_none()

    if not admin:
        print("Creating admin user...")
        admin = User(
            email="admin@test.com",
            password_hash=hash_password("admin123"),
            first_name="Admin",
            last_name="Test",
            role=UserRole.ADMIN,
            is_active=True,
            must_change_password=False,
        )
        session.add(admin)
        await session.flush()
        print(f"✓ Created admin user: {admin.id}")
    else:
        print(f"✓ Using existing admin user: {admin.id}")

    return admin.id


async def create_test_market_maker(
    session: AsyncSession, admin_id: UUID
) -> MarketMakerClient:
    """Create a CASH_BUYER market maker with EUR balance"""
    print("\n=== Creating Market Maker ===")

    mm, ticket_id = await MarketMakerService.create_market_maker(
        db=session,
        name="Test Liquidity Provider",
        email=f"mm-test-{uuid.uuid4().hex[:8]}@test.com",
        description="Test market maker for order book verification",
        created_by_id=admin_id,
        mm_type=MarketMakerType.CASH_BUYER,
        initial_eur_balance=Decimal("100000.00"),
    )

    await session.flush()

    print("✓ Created market maker:")
    print(f"  ID: {mm.id}")
    print(f"  Name: {mm.name}")
    print(f"  Type: {mm.mm_type}")
    print(f"  EUR Balance: €{mm.eur_balance}")
    print(f"  Ticket ID: {ticket_id}")

    return mm


async def create_test_orders(
    session: AsyncSession, mm: MarketMakerClient
) -> list[Order]:
    """Create several BUY orders for the market maker"""
    print("\n=== Creating Market Maker Orders ===")

    orders = []
    test_orders_data = [
        {"price": Decimal("62.50"), "quantity": Decimal("100")},
        {
            "price": Decimal("62.50"),
            "quantity": Decimal("50"),
        },  # Same price, different order
        {"price": Decimal("62.00"), "quantity": Decimal("200")},
        {"price": Decimal("61.50"), "quantity": Decimal("150")},
    ]

    for i, order_data in enumerate(test_orders_data, 1):
        order = Order(
            market_maker_id=mm.id,
            certificate_type=CertificateType.CEA,
            side=OrderSide.BUY,
            price=order_data["price"],
            quantity=order_data["quantity"],
            filled_quantity=Decimal("0"),
            status=OrderStatus.OPEN,
        )
        session.add(order)
        orders.append(order)
        qty = order_data['quantity']
        price = order_data['price']
        print(f"✓ Created order #{i}: BUY {qty} CEA @ {price}")

    await session.flush()
    print(f"\n✓ Total orders created: {len(orders)}")

    return orders


async def verify_orderbook(session: AsyncSession, mm_id: UUID):
    """Verify market maker orders appear in the order book"""
    print("\n=== Verifying Order Book ===")

    # Get the order book
    orderbook = await get_real_orderbook(session, "CEA")

    print("\nOrder Book Summary:")
    print(f"  Certificate Type: {orderbook['certificate_type']}")
    print(f"  Best Bid: €{orderbook['best_bid']}")
    print(f"  Best Ask: €{orderbook['best_ask']}")
    print(f"  Spread: €{orderbook['spread']}")
    print(f"  Total Bid Levels: {len(orderbook['bids'])}")
    print(f"  Total Ask Levels: {len(orderbook['asks'])}")

    # Display bid levels
    if orderbook["bids"]:
        print("\nBid Levels (Top 5):")
        print(
            f"  {'Price':>10} | {'Quantity':>10} | {'Orders':>6} | {'Cumulative':>12}"
        )
        print(f"  {'-' * 10}-+-{'-' * 10}-+-{'-' * 6}-+-{'-' * 12}")
        for bid in orderbook["bids"][:5]:
            cum = bid['cumulative_quantity']
            print(
                f"  {bid['price']:>9.2f} | {bid['quantity']:>10.2f} | "
                f"{bid['order_count']:>6} | {cum:>12.2f}"
            )

    # Verify MM orders are included
    result = await session.execute(select(Order).where(Order.market_maker_id == mm_id))
    mm_orders = result.scalars().all()

    print("\n=== Verification Results ===")
    print(f"✓ Market Maker has {len(mm_orders)} orders in database")

    # Check if orders are in the order book
    for order in mm_orders:
        # Find this price level in the order book
        price_found = any(
            bid["price"] == float(order.price) for bid in orderbook["bids"]
        )
        if price_found:
            print(f"✓ Order at €{order.price} appears in order book")
        else:
            print(f"✗ Order at €{order.price} NOT FOUND in order book")

    # Verify aggregation at price €62.50 (should have 2 orders)
    price_level = next(
        (bid for bid in orderbook["bids"] if bid["price"] == 62.50), None
    )
    if price_level:
        print("\n✓ Price level €62.50:")
        print(f"  Quantity: {price_level['quantity']} (expected: 150.0)")
        print(f"  Order Count: {price_level['order_count']} (expected: 2)")

        if price_level["order_count"] == 2:
            print("  ✓ Orders correctly aggregated!")
        else:
            print("  ✗ Order count mismatch")


async def main():
    """Main test execution"""
    print("=" * 60)
    print("Market Maker Order Book Verification Test")
    print("=" * 60)

    # Get database URL from environment
    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon",
    )

    # Create engine and session
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Step 1: Create admin user
            admin_id = await create_admin_user(session)

            # Step 2: Create market maker
            mm = await create_test_market_maker(session, admin_id)

            # Step 3: Create orders
            await create_test_orders(session, mm)

            # Commit all changes
            await session.commit()
            print("\n✓ All changes committed to database")

            # Step 4: Verify order book
            await verify_orderbook(session, mm.id)

            print("\n" + "=" * 60)
            print("Test completed successfully!")
            print("=" * 60)
            print("\nYou can now check the order book at:")
            print("  http://localhost:5174/cash-market")
            print(f"\nMarket Maker ID: {mm.id}")
            print(f"Market Maker Name: {mm.name}")

        except Exception as e:
            print(f"\n✗ Error: {e}")
            import traceback

            traceback.print_exc()
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
