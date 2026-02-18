import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import (
    admin,
    admin_fees,
    admin_logging,
    ai_agent,
    assets,
    auth,
    backoffice,
    cash_market,
    client_ws,
    contact,
    deposits,
    introducer,
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
from .services.auto_trade_executor import AutoTradeExecutor, update_executor_status
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

    def _is_due(source, now):
        """Check if a scraping source is due for a refresh based on its interval."""
        last = getattr(source, "last_scrape_at", None) or getattr(source, "last_scraped_at", None)
        if last is None:
            return True
        return (now - last).total_seconds() / 60 >= source.scrape_interval_minutes

    # Price scraping scheduler
    async def price_scraping_scheduler_loop():
        """Run price scraping based on each source's configured interval.
        Failover: if primary source fails, try other active sources of the same type."""
        from datetime import datetime, timezone

        from sqlalchemy import select

        from .models.models import CertificateType, ScrapingSource
        from .services.price_scraper import price_scraper

        # Wait 30 seconds on startup before first check
        await asyncio.sleep(30)

        while True:
            try:
                async with AsyncSessionLocal() as db:
                    # Get all active scraping sources
                    result = await db.execute(
                        select(ScrapingSource).where(
                            ScrapingSource.is_active.is_(True)
                        )
                    )
                    sources = result.scalars().all()

                    now = datetime.now(timezone.utc).replace(tzinfo=None)

                    # Partition: carboncredits.com uses one shared fetch per cycle (0026)
                    carboncredits_sources = [
                        s for s in sources
                        if s.url and "carboncredits.com" in s.url
                    ]
                    other_sources = [
                        s for s in sources
                        if not s.url or "carboncredits.com" not in s.url
                    ]

                    # Track which cert types got a successful scrape this cycle
                    scraped_cert_types: set = set()

                    # --- Carboncredits group (shared fetch) ---
                    if carboncredits_sources:
                        any_due = any(_is_due(s, now) for s in carboncredits_sources)
                        if any_due:
                            try:
                                await price_scraper.refresh_carboncredits_sources(
                                    db, carboncredits_sources
                                )
                                for s in carboncredits_sources:
                                    if s.last_price is not None:
                                        scraped_cert_types.add(s.certificate_type)
                                        logger.info(
                                            "Auto-scraped %s: %s",
                                            s.name,
                                            s.last_price,
                                        )
                            except Exception as e:
                                logger.warning(
                                    "Auto-scrape failed for carboncredits.com: %s",
                                    e,
                                )

                    # --- Non-carboncredits sources: primary first, then fallbacks ---
                    for cert_type in (CertificateType.EUA, CertificateType.CEA):
                        type_sources = [s for s in other_sources if s.certificate_type == cert_type]
                        if not type_sources:
                            continue

                        # Sort: primary first, then by created_at
                        type_sources.sort(key=lambda s: (not s.is_primary, s.created_at))

                        primary = type_sources[0] if type_sources[0].is_primary else None
                        fallbacks = type_sources[1:] if primary else type_sources

                        # Try primary first
                        if primary and _is_due(primary, now):
                            try:
                                await price_scraper.refresh_source(primary, db)
                                scraped_cert_types.add(cert_type)
                                logger.info(
                                    "Auto-scraped %s (primary): %s",
                                    primary.name,
                                    primary.last_price,
                                )
                                continue  # Primary succeeded, skip fallbacks
                            except Exception as e:
                                logger.warning(
                                    "Primary %s source %s failed: %s — trying fallbacks",
                                    cert_type.value,
                                    primary.name,
                                    e,
                                )
                        elif primary and not _is_due(primary, now):
                            # Primary not due yet and had a previous success
                            if primary.last_scrape_status and primary.last_scrape_status.value == "SUCCESS":
                                continue  # Not due, skip

                        # Failover: try fallback sources in order
                        for fallback in fallbacks:
                            if not _is_due(fallback, now) and cert_type in scraped_cert_types:
                                continue
                            try:
                                await price_scraper.refresh_source(fallback, db)
                                scraped_cert_types.add(cert_type)
                                logger.info(
                                    "Auto-scraped %s (fallback): %s",
                                    fallback.name,
                                    fallback.last_price,
                                )
                                break  # One successful fallback is enough
                            except Exception as e:
                                logger.warning(
                                    "Fallback %s source %s also failed: %s",
                                    cert_type.value,
                                    fallback.name,
                                    e,
                                )

                    # Warm Redis cache after scrape cycle so header reflects latest prices
                    try:
                        eua_eur = None
                        cea_eur = None
                        all_sources = carboncredits_sources + other_sources
                        for s in all_sources:
                            if s.certificate_type == CertificateType.EUA and s.is_primary and s.last_price is not None:
                                eua_eur = float(s.last_price)
                            elif s.certificate_type == CertificateType.CEA and s.is_primary and getattr(s, "last_price_eur", None) is not None:
                                cea_eur = float(s.last_price_eur)
                        if eua_eur is not None and cea_eur is not None:
                            from .core.security import RedisManager

                            await RedisManager.cache_prices(
                                {
                                    "eua_eur": str(eua_eur),
                                    "cea_eur": str(cea_eur),
                                    "eua_change": "0",
                                    "cea_change": "0",
                                    "updated_at": now.isoformat(),
                                }
                            )
                            logger.info("Cache warmed: EUA=%.2f EUR, CEA=%.2f EUR", eua_eur, cea_eur)
                    except Exception as e:
                        logger.warning("Failed to warm price cache: %s", e)

            except Exception as e:
                logger.error(f"Price scraping scheduler error: {e}", exc_info=True)

            # Check every 60 seconds
            await asyncio.sleep(60)

    # Exchange rate scraping scheduler
    async def exchange_rate_scraping_scheduler_loop():
        """Run exchange rate scraping based on each source's configured interval.
        Failover: if primary source fails, try other active sources."""
        from datetime import datetime, timezone

        from sqlalchemy import select

        from .models.models import ExchangeRateSource
        from .services.price_scraper import price_scraper

        # Wait 45 seconds on startup before first check (stagger from price scraper)
        await asyncio.sleep(45)

        while True:
            try:
                async with AsyncSessionLocal() as db:
                    # Get all active exchange rate sources
                    result = await db.execute(
                        select(ExchangeRateSource).where(
                            ExchangeRateSource.is_active.is_(True)
                        )
                    )
                    sources = list(result.scalars().all())

                    now = datetime.now(timezone.utc).replace(tzinfo=None)

                    # Sort: primary first, then by created_at
                    sources.sort(key=lambda s: (not s.is_primary, s.created_at))

                    primary = sources[0] if sources and sources[0].is_primary else None
                    fallbacks = sources[1:] if primary else sources

                    scraped = False

                    # Try primary first
                    if primary and _is_due(primary, now):
                        try:
                            await price_scraper.refresh_exchange_rate_source(
                                primary, db
                            )
                            scraped = True
                            logger.info(
                                "Auto-scraped exchange rate %s (primary): %s",
                                primary.name,
                                primary.last_rate,
                            )
                        except Exception as e:
                            logger.warning(
                                "Primary exchange rate source %s failed: %s — trying fallbacks",
                                primary.name,
                                e,
                            )
                    elif primary and not _is_due(primary, now):
                        if primary.last_scrape_status and primary.last_scrape_status.value == "SUCCESS":
                            scraped = True  # Not due, already have good data

                    # Failover: try fallback sources if primary failed
                    if not scraped:
                        for fallback in fallbacks:
                            if not _is_due(fallback, now):
                                continue
                            try:
                                await price_scraper.refresh_exchange_rate_source(
                                    fallback, db
                                )
                                logger.info(
                                    "Auto-scraped exchange rate %s (fallback): %s",
                                    fallback.name,
                                    fallback.last_rate,
                                )
                                break  # One success is enough
                            except Exception as e:
                                logger.warning(
                                    "Fallback exchange rate source %s also failed: %s",
                                    fallback.name,
                                    e,
                                )
            except Exception as e:
                logger.error(
                    f"Exchange rate scraping scheduler error: {e}", exc_info=True
                )

            # Check every 60 seconds
            await asyncio.sleep(60)

    # Auto-trade executor scheduler
    async def auto_trade_executor_loop():
        """Execute auto-trade rules based on their configured intervals"""
        from sqlalchemy import select

        from .models.models import User, UserRole

        # Wait 10 seconds on startup before first check
        await asyncio.sleep(10)

        # Bootstrap: ensure rules exist for all active market makers
        try:
            async with AsyncSessionLocal() as db:
                created = await AutoTradeExecutor.bootstrap_rules(db)
                await db.commit()
                if created:
                    logger.info(f"Auto-trade bootstrap: created {created} rules")
        except Exception as e:
            logger.error(f"Auto-trade bootstrap error: {e}", exc_info=True)

        while True:
            try:
                async with AsyncSessionLocal() as db:
                    # Get a system admin for audit trail
                    result = await db.execute(
                        select(User).where(User.role == UserRole.ADMIN).limit(1)
                    )
                    admin = result.scalar_one_or_none()

                    if admin:
                        results = await AutoTradeExecutor.execute_all_ready_rules(
                            db=db, admin_user_id=admin.id
                        )
                        update_executor_status(results, cycle_interval=5)
                        successes = sum(1 for r in results if r.get("success"))
                        if results:
                            logger.info(
                                f"Auto-trade cycle: {successes}/{len(results)} orders placed"
                            )
            except Exception as e:
                logger.error(f"Auto-trade executor error: {e}", exc_info=True)

            # Check every 5 seconds for rules ready to execute (supports 10-20 sec intervals)
            await asyncio.sleep(5)

    # Seed default scraping sources if none exist
    try:
        from .services.price_scraper import (
            seed_default_exchange_rate_sources,
            seed_default_sources,
        )

        async with AsyncSessionLocal() as db:
            await seed_default_sources(db)
            await seed_default_exchange_rate_sources(db)
        logger.info("Scraping source seed check complete")
    except Exception as e:
        logger.error(f"Failed to seed scraping sources: {e}", exc_info=True)

    # Start background tasks
    processor_task = asyncio.create_task(settlement_processor_loop())
    monitoring_task = asyncio.create_task(settlement_monitoring_loop())
    deposit_task = asyncio.create_task(deposit_hold_processor_loop())
    scraping_task = asyncio.create_task(price_scraping_scheduler_loop())
    exchange_rate_task = asyncio.create_task(exchange_rate_scraping_scheduler_loop())
    auto_trade_task = asyncio.create_task(auto_trade_executor_loop())
    _background_tasks.extend(
        [processor_task, monitoring_task, deposit_task, scraping_task, exchange_rate_task, auto_trade_task]
    )
    logger.info(
        "Settlement processor, monitoring, deposit hold processor, price scraping, "
        "exchange rate scraping, and auto-trade schedulers started"
    )

    # Register ticket broadcast to backoffice WebSocket
    from app.api.v1.backoffice import backoffice_ws_manager
    from app.services.ticket_service import TicketService
    TicketService.register_broadcast(backoffice_ws_manager.broadcast)
    logger.info("Ticket broadcast registered to backoffice WebSocket")

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


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Log unhandled exceptions and return useful error for 500s."""
    import traceback

    from fastapi import HTTPException
    from fastapi.responses import JSONResponse

    logger.error(
        "Unhandled exception: %s\n%s",
        exc,
        traceback.format_exc(),
        extra={"path": request.url.path, "method": request.method},
    )
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(prices.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(swaps.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(client_ws.router, prefix="/api/v1")
app.include_router(backoffice.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(cash_market.router, prefix="/api/v1")
app.include_router(settlement.router, prefix="/api/v1")
app.include_router(market_maker.router, prefix="/api/v1/admin")
app.include_router(admin_logging.router, prefix="/api/v1/admin")
app.include_router(admin_fees.router, prefix="/api/v1/admin")
app.include_router(deposits.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(withdrawals.router, prefix="/api/v1")
app.include_router(introducer.router, prefix="/api/v1")
app.include_router(ai_agent.router, prefix="/api/v1")


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
