import logging

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from .config import settings

logger = logging.getLogger(__name__)

# Convert postgresql:// to postgresql+asyncpg://
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
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

    # Create seed config data (fees, auto-trade settings)
    await create_seed_config()


async def create_seed_users():
    """Create default admin, test users, and NDA contact request test@test.ro"""
    import os

    from ..models.models import (
        ContactRequest,
        ContactStatus,
        Entity,
        Jurisdiction,
        KYCStatus,
        User,
        UserRole,
    )
    from .security import hash_password

    # Get passwords from environment variables with fallback to defaults for development
    admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "Admin123!")
    test_password = os.environ.get("SEED_TEST_PASSWORD", "Test123!")

    # Warn if using default passwords in non-development environments
    if not settings.DEBUG:
        if not os.environ.get("SEED_ADMIN_PASSWORD"):
            logger.warning(
                "Using default admin password in non-DEBUG mode. "
                "Set SEED_ADMIN_PASSWORD env var."
            )
        if not os.environ.get("SEED_TEST_PASSWORD"):
            logger.warning(
                "Using default test password in non-DEBUG mode. "
                "Set SEED_TEST_PASSWORD env var."
            )

    # Create seed entities first
    seed_entities = [
        {
            "name": "Nihao Group",
            "legal_name": "Nihao Group Holdings Ltd",
            "jurisdiction": Jurisdiction.HK,
            "verified": True,
            "kyc_status": KYCStatus.APPROVED,
        },
        {
            "name": "EU Carbon Trading",
            "legal_name": "EU Carbon Trading GmbH",
            "jurisdiction": Jurisdiction.EU,
            "verified": True,
            "kyc_status": KYCStatus.APPROVED,
        },
    ]

    seed_users = [
        {
            "email": "admin@nihaogroup.com",
            "password": admin_password,
            "first_name": "Admin",
            "last_name": "User",
            "role": UserRole.ADMIN,
            "is_active": True,
            "must_change_password": False,
            "entity_name": "Nihao Group",
        },
        {
            "email": "eu@eu.ro",
            "password": test_password,
            "first_name": "Test",
            "last_name": "User",
            "role": UserRole.NDA,
            "is_active": True,
            "must_change_password": False,
            "entity_name": "EU Carbon Trading",
        },
    ]

    async with AsyncSessionLocal() as db:
        # Create entities
        entity_map = {}
        for entity_data in seed_entities:
            result = await db.execute(
                select(Entity).where(Entity.name == entity_data["name"])
            )
            existing_entity = result.scalar_one_or_none()
            if not existing_entity:
                entity = Entity(**entity_data)
                db.add(entity)
                await db.flush()
                entity_map[entity_data["name"]] = entity
                logger.info(f"Created seed entity: {entity_data['name']}")
            else:
                entity_map[entity_data["name"]] = existing_entity
                logger.info(f"Seed entity already exists: {entity_data['name']}")

        for user_data in seed_users:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()

            # Get associated entity
            entity_name = user_data.pop("entity_name", None)
            entity = entity_map.get(entity_name) if entity_name else None
            entity_id = entity.id if entity else None

            # Log prefix without exposing full email
            email_prefix = user_data['email'].split('@')[0][:3] + '***'

            if not existing_user:
                user = User(
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_active=user_data["is_active"],
                    must_change_password=user_data["must_change_password"],
                    entity_id=entity_id,
                )
                db.add(user)
                logger.info(f"Created seed user: {email_prefix} (entity: {entity_name})")
            else:
                # Update existing user's entity_id if not set
                if not existing_user.entity_id and entity_id:
                    existing_user.entity_id = entity_id
                    logger.info(f"Updated seed user entity: {email_prefix}")
                elif not existing_user.password_hash:
                    existing_user.password_hash = hash_password(user_data["password"])
                    existing_user.role = user_data["role"]
                    logger.info(f"Updated seed user password: {email_prefix}")
                else:
                    logger.info(f"Seed user already exists: {email_prefix}")

        # Seed NDA contact request for test@test.ro (appears in onboarding/requests and users)
        result = await db.execute(
            select(ContactRequest).where(
                ContactRequest.contact_email == "test@test.ro"
            )
        )
        if result.scalar_one_or_none() is None:
            contact = ContactRequest(
                entity_name="Test Entity",
                contact_email="test@test.ro",
                contact_name="Test Contact",
                position="Tester",
                user_role=ContactStatus.NDA,
            )
            db.add(contact)
            logger.info("Created seed contact request: test@test.ro (NDA)")

        await db.commit()


async def create_seed_config():
    """Seed trading fee configs, auto-trade settings, and market settings."""
    from ..models.models import (
        AutoTradeMarketSettings,
        AutoTradeSettings,
        CertificateType,
        MarketType,
        TradingFeeConfig,
    )

    async with AsyncSessionLocal() as db:
        # Trading fee configs: default 0.5% for both markets
        for market in [MarketType.CEA_CASH, MarketType.SWAP]:
            result = await db.execute(
                select(TradingFeeConfig).where(TradingFeeConfig.market == market)
            )
            if result.scalar_one_or_none() is None:
                db.add(TradingFeeConfig(
                    market=market,
                    bid_fee_rate=Decimal("0.005"),
                    ask_fee_rate=Decimal("0.005"),
                    is_active=True,
                ))
                logger.info(f"Created seed trading fee config: {market.value}")

        # Auto-trade settings: one per certificate type
        for cert_type in [CertificateType.CEA, CertificateType.EUA]:
            result = await db.execute(
                select(AutoTradeSettings).where(
                    AutoTradeSettings.certificate_type == cert_type
                )
            )
            if result.scalar_one_or_none() is None:
                db.add(AutoTradeSettings(
                    certificate_type=cert_type,
                    target_ask_liquidity=None,
                    target_bid_liquidity=None,
                    liquidity_limit_enabled=True,
                ))
                logger.info(f"Created seed auto-trade settings: {cert_type.value}")

        # Auto-trade market settings: one per market side
        for market_key in ["CEA_BID", "CEA_ASK", "EUA_SWAP"]:
            result = await db.execute(
                select(AutoTradeMarketSettings).where(
                    AutoTradeMarketSettings.market_key == market_key
                )
            )
            if result.scalar_one_or_none() is None:
                db.add(AutoTradeMarketSettings(
                    market_key=market_key,
                    enabled=True,
                    target_liquidity=None,
                ))
                logger.info(f"Created seed auto-trade market settings: {market_key}")

        await db.commit()
