"""Test configuration and fixtures"""
import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app.models.models import Base, User, UserRole


# Test database URL (using PostgreSQL test database)
TEST_DATABASE_URL = "postgresql+asyncpg://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test"""
    # Create engine
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )

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
                truncate_query = f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE"
                await conn.execute(text(truncate_query))
        else:
            # First run - create all tables
            await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
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
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
