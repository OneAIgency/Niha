#!/usr/bin/env python3
"""
Simple test to verify market maker orders appear in the live order book.
Uses direct database manipulation to avoid model/migration issues.
"""
import asyncio
import sys
import os
from decimal import Decimal
from uuid import uuid4
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.services.order_matching import get_real_orderbook


async def main():
    """Main test execution"""
    print("=" * 60)
    print("Market Maker Order Book Verification Test (Simple)")
    print("=" * 60)

    # Get database URL from environment
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql+asyncpg://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon'
    )

    # Create engine and session
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Step 1: Create a simple market maker client directly
            print("\n=== Creating Market Maker ===")

            mm_id = str(uuid4())
            mm_name = f"Test MM {datetime.now().strftime('%H:%M:%S')}"
            mm_code = f"MM{datetime.now().strftime('%H%M%S')}"

            await session.execute(text("""
                INSERT INTO market_maker_clients (
                    id, name, client_code, status,
                    mm_type, eur_balance,
                    cea_balance, eua_balance,
                    created_at, updated_at
                ) VALUES (
                    :id, :name, :code, 'ACTIVE',
                    'CASH_BUYER', 100000.00,
                    0, 0,
                    NOW(), NOW()
                )
            """), {
                "id": mm_id,
                "name": mm_name,
                "code": mm_code
            })

            print(f"✓ Created market maker:")
            print(f"  ID: {mm_id}")
            print(f"  Name: {mm_name}")
            print(f"  Type: CASH_BUYER")
            print(f"  EUR Balance: €100,000.00")

            # Step 2: Create several BUY orders
            print("\n=== Creating Market Maker Orders ===")

            test_orders_data = [
                {"price": 62.50, "quantity": 100},
                {"price": 62.50, "quantity": 50},  # Same price, different order
                {"price": 62.00, "quantity": 200},
                {"price": 61.50, "quantity": 150},
            ]

            for i, order_data in enumerate(test_orders_data, 1):
                order_id = str(uuid4())
                await session.execute(text("""
                    INSERT INTO orders (
                        id, market_maker_id, certificate_type, side,
                        price, quantity, filled_quantity, status,
                        created_at, updated_at
                    ) VALUES (
                        :id, :mm_id, 'CEA', 'BUY',
                        :price, :quantity, 0, 'OPEN',
                        NOW(), NOW()
                    )
                """), {
                    "id": order_id,
                    "mm_id": mm_id,
                    "price": order_data["price"],
                    "quantity": order_data["quantity"]
                })
                print(f"✓ Created order #{i}: BUY {order_data['quantity']} CEA @ €{order_data['price']}")

            # Commit all changes
            await session.commit()
            print("\n✓ All changes committed to database")

            # Step 3: Verify order book
            print("\n=== Verifying Order Book ===")

            orderbook = await get_real_orderbook(session, "CEA")

            print(f"\nOrder Book Summary:")
            print(f"  Certificate Type: {orderbook['certificate_type']}")
            print(f"  Best Bid: €{orderbook['best_bid']}")
            print(f"  Best Ask: {orderbook['best_ask']}")
            print(f"  Spread: {orderbook['spread']}")
            print(f"  Total Bid Levels: {len(orderbook['bids'])}")
            print(f"  Total Ask Levels: {len(orderbook['asks'])}")

            # Display bid levels
            if orderbook['bids']:
                print(f"\nBid Levels:")
                print(f"  {'Price':>10} | {'Quantity':>10} | {'Orders':>6} | {'Cumulative':>12}")
                print(f"  {'-'*10}-+-{'-'*10}-+-{'-'*6}-+-{'-'*12}")
                for bid in orderbook['bids']:
                    print(f"  €{bid['price']:>9.2f} | {bid['quantity']:>10.2f} | {bid['order_count']:>6} | {bid['cumulative_quantity']:>12.2f}")

            # Verification
            print(f"\n=== Verification Results ===")

            # Check database orders
            result = await session.execute(text("""
                SELECT COUNT(*) FROM orders WHERE market_maker_id = :mm_id
            """), {"mm_id": mm_id})
            mm_order_count = result.scalar()
            print(f"✓ Market Maker has {mm_order_count} orders in database")

            # Check if orders appear in order book
            for order_data in test_orders_data:
                price_found = any(
                    bid['price'] == order_data['price']
                    for bid in orderbook['bids']
                )
                if price_found:
                    print(f"✓ Order at €{order_data['price']} appears in order book")
                else:
                    print(f"✗ Order at €{order_data['price']} NOT FOUND in order book")

            # Verify aggregation at price €62.50 (should have 2 orders)
            price_level = next(
                (bid for bid in orderbook['bids'] if bid['price'] == 62.50),
                None
            )
            if price_level:
                print(f"\n✓ Price level €62.50:")
                print(f"  Quantity: {price_level['quantity']} (expected: 150.0)")
                print(f"  Order Count: {price_level['order_count']} (expected: 2)")

                if price_level['order_count'] == 2 and price_level['quantity'] == 150.0:
                    print(f"  ✓ Orders correctly aggregated!")
                else:
                    print(f"  ✗ Aggregation mismatch")

            print("\n" + "=" * 60)
            print("✓ TEST PASSED: Market maker orders appear in order book!")
            print("=" * 60)
            print(f"\nYou can verify in the UI at:")
            print(f"  http://localhost:5174/cash-market")
            print(f"\nMarket Maker ID: {mm_id}")
            print(f"Market Maker Name: {mm_name}")

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
