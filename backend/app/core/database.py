from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import select
import logging
from .config import settings

logger = logging.getLogger(__name__)

# Convert postgresql:// to postgresql+asyncpg://
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create seed users for development
    await create_seed_users()


async def create_seed_users():
    """Create default admin and test users if they don't exist"""
    from ..models.models import User, UserRole
    from .security import hash_password

    seed_users = [
        {
            "email": "admin@nihaogroup.com",
            "password": "Admin123!",
            "first_name": "Admin",
            "last_name": "User",
            "role": UserRole.ADMIN,
            "is_active": True,
            "must_change_password": False,
        },
        {
            "email": "eu@eu.ro",
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "User",
            "role": UserRole.FUNDED,
            "is_active": True,
            "must_change_password": False,
        },
    ]

    async with AsyncSessionLocal() as db:
        for user_data in seed_users:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                user = User(
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_active=user_data["is_active"],
                    must_change_password=user_data["must_change_password"],
                )
                db.add(user)
                logger.info(f"Created seed user: {user_data['email']}")
            else:
                # Update existing user's password and role if they don't have one
                if not existing_user.password_hash:
                    existing_user.password_hash = hash_password(user_data["password"])
                    existing_user.role = user_data["role"]
                    logger.info(f"Updated seed user password: {user_data['email']}")
                else:
                    logger.info(f"Seed user already exists: {user_data['email']}")

        await db.commit()
