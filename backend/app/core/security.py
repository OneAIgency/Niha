import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import redis.asyncio as redis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select

from .config import settings

# Security scheme for JWT
# auto_error=False allows us to return 401 instead of 403 when credentials are missing
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    return True, "Password is valid"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_magic_link_token() -> str:
    return secrets.token_urlsafe(32)


def generate_anonymous_code() -> str:
    """Generate anonymous seller code like 'ZH-847291'"""
    import random
    import string

    letters = "".join(random.choices(string.ascii_uppercase, k=2))
    numbers = "".join(random.choices(string.digits, k=6))
    return f"{letters}-{numbers}"


class RedisManager:
    _redis: Optional[redis.Redis] = None

    @classmethod
    async def get_redis(cls) -> redis.Redis:
        if cls._redis is None:
            cls._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return cls._redis

    @classmethod
    async def close(cls):
        if cls._redis:
            await cls._redis.close()
            cls._redis = None

    @classmethod
    async def store_magic_link(cls, token: str, email: str):
        r = await cls.get_redis()
        await r.setex(
            f"magic_link:{token}", settings.MAGIC_LINK_EXPIRE_MINUTES * 60, email
        )

    @classmethod
    async def verify_magic_link(cls, token: str) -> Optional[str]:
        r = await cls.get_redis()
        email = await r.get(f"magic_link:{token}")
        if email:
            await r.delete(f"magic_link:{token}")  # One-time use
        return email

    @classmethod
    async def cache_prices(cls, prices: dict):
        r = await cls.get_redis()
        await r.hset("carbon_prices", mapping=prices)
        await r.expire("carbon_prices", 600)  # 10 min cache

    @classmethod
    async def get_cached_prices(cls) -> Optional[dict]:
        r = await cls.get_redis()
        prices = await r.hgetall("carbon_prices")
        return prices if prices else None


# Dependency to get current user from JWT token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
):
    """
    Extract and validate JWT token to get current user.
    Returns user data from token payload.
    """
    from ..models.models import User
    from .database import AsyncSessionLocal

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if credentials are provided
    if credentials is None:
        raise credentials_exception

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
            )

        return user


async def get_current_active_user(current_user=Depends(get_current_user)):  # noqa: B008
    """Dependency that checks if user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


def require_roles(*allowed_roles: str):
    """
    Factory function that creates a dependency to check user roles.

    Usage:
        @router.get(
            "/admin-only", dependencies=[Depends(require_roles("admin"))]
        )  # noqa: B008
        async def admin_endpoint():
            ...
    """

    async def role_checker(current_user=Depends(get_current_user)):  # noqa: B008
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return current_user

    return role_checker


# Convenience dependencies for common role checks
# Available functions for endpoint protection:
# - get_current_user: Get authenticated user (any role)
# - get_admin_user: Require ADMIN role
# - get_funded_user: Require CEA+ or ADMIN (cash market, dashboard)
# - get_approved_user: Require APPROVED+ or ADMIN (funding, deposits)
# - get_swap_user: Require SWAP, EUA_SETTLE, EUA or ADMIN (swap page; 0010 §8)
# - get_onboarding_user: Require NDA, KYC or ADMIN (onboarding / KYC form; 0010 §3)
# - require_roles(*roles): Factory for custom role requirements

async def get_admin_user(current_user=Depends(get_current_user)):  # noqa: B008
    """
    Dependency that requires admin role.
    
    Usage:
        @router.get("/admin-endpoint")
        async def admin_function(
            admin_user: User = Depends(get_admin_user),  # noqa: B008
            ...
        ):
            # admin_user is guaranteed to have ADMIN role
            ...
    
    Raises:
        HTTPException(403): If user is not an admin
    """
    import logging

    from ..models.models import UserRole

    logger = logging.getLogger(__name__)

    logger.info(
        "Admin check - User: %s, Role: %s, Role type: %s, Expected: %s",
        current_user.email,
        current_user.role,
        type(current_user.role),
        UserRole.ADMIN,
    )

    if current_user.role != UserRole.ADMIN:
        logger.warning(
            "Admin access denied for user %s with role %s",
            current_user.email,
            current_user.role,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin access required. Your role: {current_user.role}",
        )
    return current_user


async def get_funded_user(current_user=Depends(get_current_user)):  # noqa: B008
    """Dependency that requires funded flow roles (CEA and beyond), admin, or MM (Market Maker)."""
    from ..models.models import UserRole

    funded_roles = {
        UserRole.ADMIN,
        UserRole.MM,
        UserRole.CEA,
        UserRole.CEA_SETTLE,
        UserRole.SWAP,
        UserRole.EUA_SETTLE,
        UserRole.EUA,
    }
    if current_user.role not in funded_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Funded account required"
        )
    return current_user


async def get_approved_user(current_user=Depends(get_current_user)):  # noqa: B008
    """Dependency that requires approved or later (funding page, deposits), admin, or MM (Market Maker)."""
    from ..models.models import UserRole

    funding_access_roles = {
        UserRole.ADMIN,
        UserRole.MM,
        UserRole.APPROVED,
        UserRole.FUNDING,
        UserRole.AML,
        UserRole.CEA,
        UserRole.CEA_SETTLE,
        UserRole.SWAP,
        UserRole.EUA_SETTLE,
        UserRole.EUA,
    }
    if current_user.role not in funding_access_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Approved account required"
        )
    return current_user


async def get_swap_user(current_user=Depends(get_current_user)):  # noqa: B008
    """Dependency that requires swap access (SWAP only), admin, or MM (Market Maker). 0010 plan §8.

    Note: EUA_SETTLE and EUA roles do NOT have swap access - after completing a swap,
    the user role changes to EUA_SETTLE and they wait for EUA delivery on the dashboard.
    """
    from ..models.models import UserRole

    swap_roles = {
        UserRole.ADMIN,
        UserRole.MM,
        UserRole.SWAP,
    }
    if current_user.role not in swap_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Swap access required"
        )
    return current_user


async def get_onboarding_user(current_user=Depends(get_current_user)):  # noqa: B008
    """Dependency that allows only NDA, KYC, or ADMIN (onboarding / KYC form). 0010 plan §3."""
    from ..models.models import UserRole

    onboarding_roles = {UserRole.ADMIN, UserRole.NDA, UserRole.KYC}
    if current_user.role not in onboarding_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Onboarding access required"
        )
    return current_user
