"""Test configuration and fixtures"""

import asyncio

# Test database URL (using PostgreSQL test database)
# Use 'db' hostname when running inside Docker, 'localhost' when running locally
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.security import RedisManager
from app.models.models import Base, User, UserRole

TEST_DB_HOST = os.getenv("TEST_DB_HOST", "db")
TEST_DB_PORT = os.getenv("TEST_DB_PORT", "5432")
TEST_DATABASE_URL = f"postgresql+asyncpg://niha_user:niha_secure_pass_2024@{TEST_DB_HOST}:{TEST_DB_PORT}/niha_carbon_test"


@pytest.fixture(scope="function")
def event_loop():
    """Create an event loop for each test function"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def cleanup_redis():
    """Clean up Redis connections after each test"""
    yield
    await RedisManager.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test"""
    # Create engine
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool, echo=False)

    # Create all tables (first time setup)
    async with engine.begin() as conn:
        # Get list of all table names
        result = await conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        )
        tables = result.fetchall()

        # Truncate all tables if they exist (faster than drop/create)
        if tables:
            table_names = [table[0] for table in tables]
            if table_names:
                truncate_query = (
                    f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE"
                )
                await conn.execute(text(truncate_query))
        else:
            # First run - create all tables
            await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    # Clean up - just dispose engine
    await engine.dispose()


@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create a test admin user"""
    user = User(
        email="admin@test.com",
        first_name="Test",
        last_name="Admin",
        password_hash="hashed_password_here",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
