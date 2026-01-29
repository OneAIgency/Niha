"""
Script to delete all orders from cash market and swap market.

Usage:
    # Local (with virtual environment activated):
    python delete_orders.py

    # Docker:
    docker compose exec backend python delete_orders.py

This script will:
1. Delete all orders from the orders table (both CEA_CASH and SWAP markets)
2. Delete all swap requests from the swap_requests table
3. Delete all cash market trades from the cash_market_trades table

WARNING: This operation cannot be undone!
"""

import asyncio
import sys

from sqlalchemy import delete, select

# Add the app directory to the path
sys.path.insert(0, ".")

from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.models.models import CashMarketTrade, MarketType, Order, SwapRequest  # noqa: E402


async def delete_all_orders():
    """Delete all orders from cash market and swap market"""
    async with AsyncSessionLocal() as db:
        try:
            # Count orders before deletion
            cash_market_count = await db.execute(
                select(Order).where(Order.market == MarketType.CEA_CASH)
            )
            swap_market_count = await db.execute(
                select(Order).where(Order.market == MarketType.SWAP)
            )
            cash_orders = cash_market_count.scalars().all()
            swap_orders = swap_market_count.scalars().all()

            print(f"Found {len(cash_orders)} cash market orders")
            print(f"Found {len(swap_orders)} swap market orders")

            # Count swap requests
            swap_requests_count = await db.execute(select(SwapRequest))
            swap_requests = swap_requests_count.scalars().all()
            print(f"Found {len(swap_requests)} swap requests")

            # Count cash market trades
            trades_count = await db.execute(select(CashMarketTrade))
            trades = trades_count.scalars().all()
            print(f"Found {len(trades)} cash market trades")

            total_records = (
                len(cash_orders) + len(swap_orders) + len(swap_requests) + len(trades)
            )

            if total_records == 0:
                print("\n✅ No records to delete. Database is already clean.")
                return

            print(f"\n⚠️  WARNING: About to delete {total_records} total records!")
            print("This operation cannot be undone.")

            # Delete cash market trades first (they reference orders)
            if trades:
                await db.execute(delete(CashMarketTrade))
                print(f"✓ Deleted {len(trades)} cash market trades")

            # Delete all orders (both cash market and swap)
            total_orders = len(cash_orders) + len(swap_orders)
            if total_orders > 0:
                await db.execute(delete(Order))
                print(f"✓ Deleted {total_orders} orders")

            # Delete swap requests
            if swap_requests:
                await db.execute(delete(SwapRequest))
                print(f"✓ Deleted {len(swap_requests)} swap requests")

            # Commit the transaction
            await db.commit()
            print("\n✅ Successfully deleted all orders, swap requests, and trades!")

        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error occurred: {e}")
            import traceback

            traceback.print_exc()
            raise
        finally:
            await db.close()


async def main():
    """Main entry point"""
    print("=" * 60)
    print("Delete All Orders - Cash Market & Swap")
    print("=" * 60)
    print()

    # Ask for confirmation
    try:
        response = (
            input("Are you sure you want to delete ALL orders? (yes/no): ")
            .strip()
            .lower()
        )
        if response not in ["yes", "y"]:
            print("Operation cancelled.")
            return
    except (EOFError, KeyboardInterrupt):
        print("\nOperation cancelled.")
        return

    print()

    try:
        await delete_all_orders()
    except Exception as e:
        print(f"\n❌ Failed to delete orders: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
