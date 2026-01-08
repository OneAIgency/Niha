from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .core.config import settings
from .core.database import init_db
from .core.security import RedisManager
from .api.v1 import auth, contact, prices, marketplace, swaps, admin, users, backoffice, onboarding

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Nihao Carbon Trading Platform API...")
    await init_db()
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down...")
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

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
