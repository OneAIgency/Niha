import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import (
    admin,
    admin_logging,
    admin_market_orders,
    assets,
    auth,
    backoffice,
    cash_market,
    contact,
    deposits,
    liquidity,
    market_maker,
    marketplace,
    onboarding,
    prices,
    settlement,
    swaps,
    users,
    withdrawals,
)
from .core.config import settings
from .core.database import AsyncSessionLocal, init_db
from .core.security import RedisManager
from .services import deposit_service
from .services.settlement_monitoring import SettlementMonitoring
from .services.settlement_processor import SettlementProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global task reference
_background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Nihao Carbon Trading Platform API...")
    await init_db()
    logger.info("Database initialized")

    # Start settlement processor background task
    async def settlement_processor_loop():
        """Run settlement processor every hour"""
        while True:
            try:
                await SettlementProcessor.process_pending_settlements()
                await SettlementProcessor.check_overdue_settlements()
            except Exception as e:
                logger.error(f"Settlement processor error: {e}", exc_info=True)

            # Wait 1 hour
            await asyncio.sleep(3600)

    # Start settlement monitoring background task
    async def settlement_monitoring_loop():
        """Run settlement monitoring every hour"""
        while True:
            try:
                async with AsyncSessionLocal() as db:
                    result = await SettlementMonitoring.run_monitoring_cycle(db)
                    if result.get("success"):
                        logger.info(
                            f"Settlement monitoring cycle completed: "
                            f"{result.get('alert_count', 0)} alerts detected"
                        )
                    else:
                        logger.error(
                            f"Settlement monitoring cycle failed: {result.get('error')}"
                        )
            except Exception as e:
                logger.error(f"Settlement monitoring error: {e}", exc_info=True)

            # Wait 1 hour
            await asyncio.sleep(3600)

    # Deposit hold expiration processor
    async def deposit_hold_processor_loop():
        """Process expired deposit holds every hour"""
        # Get system admin ID for audit trail (first admin user)
        from sqlalchemy import select

        from .models.models import User, UserRole

        while True:
            try:
                async with AsyncSessionLocal() as db:
                    # Get a system admin for audit trail
                    result = await db.execute(
                        select(User).where(User.role == UserRole.ADMIN).limit(1)
                    )
                    admin = result.scalar_one_or_none()

                    if admin:
                        cleared = await deposit_service.process_expired_holds(
                            db=db, system_admin_id=admin.id
                        )
                        await db.commit()
                        if cleared > 0:
                            logger.info(
                                f"Auto-cleared {cleared} deposit(s) with expired holds"
                            )
            except Exception as e:
                logger.error(f"Deposit hold processor error: {e}", exc_info=True)

            # Wait 1 hour
            await asyncio.sleep(3600)

    # Start background tasks
    processor_task = asyncio.create_task(settlement_processor_loop())
    monitoring_task = asyncio.create_task(settlement_monitoring_loop())
    deposit_task = asyncio.create_task(deposit_hold_processor_loop())
    _background_tasks.extend([processor_task, monitoring_task, deposit_task])
    logger.info(
        "Settlement processor, monitoring and deposit hold processor started (running every 1 hour)"
    )

    yield

    # Shutdown
    logger.info("Shutting down...")

    # Cancel background tasks
    for task in _background_tasks:
        task.cancel()
    await asyncio.gather(*_background_tasks, return_exceptions=True)
    logger.info("Background tasks cancelled")

    await RedisManager.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Nihao Group Carbon Trading Platform API

    A professional OTC carbon credit trading platform enabling swap trading
    between EU ETS (EUA) and China ETS (CEA) emission certificates.

    ### Features
    - **Marketplace**: Browse anonymous CEA and EUA listings
    - **Swap Center**: Exchange certificates between jurisdictions
    - **Real-time Prices**: Live carbon credit pricing via WebSocket
    - **Magic Link Auth**: Passwordless authentication

    ### Market Context
    - EUA (EU Allowances): ~€75-80/tCO2e
    - CEA (China Allowances): ~¥100/tCO2e (~€13)
    - Swap Rate: ~5.8 CEA per 1 EUA

    Built by Nihao Group Ltd - Hong Kong | Italy
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: restrict origins in production, allow all in development
_cors_origins = (
    settings.cors_origins_list if settings.ENVIRONMENT == "production" else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(prices.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(swaps.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(backoffice.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(cash_market.router, prefix="/api/v1")
app.include_router(settlement.router, prefix="/api/v1")
app.include_router(market_maker.router, prefix="/api/v1/admin")
app.include_router(admin_market_orders.router, prefix="/api/v1/admin")
app.include_router(admin_logging.router, prefix="/api/v1/admin")
app.include_router(liquidity.router, prefix="/api/v1/admin")
app.include_router(deposits.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(withdrawals.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "prices": "/api/v1/prices/current",
            "marketplace": "/api/v1/marketplace/cea",
            "swaps": "/api/v1/swaps/available",
            "contact": "/api/v1/contact/request",
            "users": "/api/v1/users/me",
            "onboarding": "/api/v1/onboarding/status",
            "backoffice": "/api/v1/backoffice/pending-users",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
