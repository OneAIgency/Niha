#!/usr/bin/env python3
"""
Database Access Script
Quick script to query the Nihao Carbon database directly.

Usage:
    python access_db.py --query "SELECT * FROM users LIMIT 5"
    python access_db.py --count users
    python access_db.py --tables
    python access_db.py --stats
"""

import argparse
import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Convert postgresql:// to postgresql+asyncpg://
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=None,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def execute_query(query: str):
    """Execute a raw SQL query"""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text(query))
            rows = result.fetchall()
            columns = result.keys()

            # Print column headers
            print(" | ".join(columns))
            print("-" * (len(" | ".join(columns))))

            # Print rows
            for row in rows:
                print(
                    " | ".join(str(val) if val is not None else "NULL" for val in row)
                )

            print(f"\n({len(rows)} rows)")
            return rows
        except Exception as e:
            print(f"Error executing query: {e}", file=sys.stderr)
            raise


async def count_table(table_name: str):
    """Count rows in a table"""
    query = f"SELECT COUNT(*) as count FROM {table_name}"
    result = await execute_query(query)
    return result[0][0] if result else 0


async def list_tables():
    """List all tables in the database"""
    query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """
    await execute_query(query)


async def show_stats():
    """Show statistics about main tables"""
    tables = [
        "users",
        "orders",
        "trades",
        "cash_market_trades",
        "swap_requests",
        "asset_transactions",
        "certificates",
        "entities",
        "deposits",
        "settlement_batches",
    ]

    print("Database Statistics:")
    print("=" * 50)

    async with AsyncSessionLocal() as session:
        for table in tables:
            try:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"{table:30} {count:>10} rows")
            except Exception as e:
                print(f"{table:30} {'ERROR':>10} ({str(e)[:30]})")


async def show_sample_data(table_name: str, limit: int = 5):
    """Show sample data from a table"""
    query = f"SELECT * FROM {table_name} LIMIT {limit}"
    await execute_query(query)


async def main():
    parser = argparse.ArgumentParser(description="Access Nihao Carbon Database")
    parser.add_argument("--query", "-q", type=str, help="Execute a SQL query")
    parser.add_argument("--count", "-c", type=str, help="Count rows in a table")
    parser.add_argument("--tables", "-t", action="store_true", help="List all tables")
    parser.add_argument(
        "--stats", "-s", action="store_true", help="Show database statistics"
    )
    parser.add_argument("--sample", type=str, help="Show sample data from a table")
    parser.add_argument(
        "--limit", type=int, default=5, help="Limit for sample data (default: 5)"
    )

    args = parser.parse_args()

    if args.query:
        await execute_query(args.query)
    elif args.count:
        count = await count_table(args.count)
        print(f"\nTable '{args.count}' has {count} rows")
    elif args.tables:
        await list_tables()
    elif args.stats:
        await show_stats()
    elif args.sample:
        await show_sample_data(args.sample, args.limit)
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
