from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
import bcrypt
import secrets
import redis.asyncio as redis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .config import settings

# Security scheme for JWT
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
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
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_magic_link_token() -> str:
    return secrets.token_urlsafe(32)


def generate_anonymous_code() -> str:
    """Generate anonymous seller code like 'ZH-847291'"""
    import random
    import string
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    numbers = ''.join(random.choices(string.digits, k=6))
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
            f"magic_link:{token}",
            settings.MAGIC_LINK_EXPIRE_MINUTES * 60,
            email
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
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
                detail="User account is disabled"
            )

        return user


async def get_current_active_user(
    current_user = Depends(get_current_user)
):
    """Dependency that checks if user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_roles(*allowed_roles: str):
    """
    Factory function that creates a dependency to check user roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles("admin"))])
        async def admin_endpoint():
            ...
    """
    async def role_checker(current_user = Depends(get_current_user)):
        from ..models.models import UserRole

        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


# Convenience dependencies for common role checks
async def get_admin_user(current_user = Depends(get_current_user)):
    """Dependency that requires admin role"""
    from ..models.models import UserRole
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Admin check - User: {current_user.email}, Role: {current_user.role}, Role type: {type(current_user.role)}, Expected: {UserRole.ADMIN}")

    if current_user.role != UserRole.ADMIN:
        logger.warning(f"Admin access denied for user {current_user.email} with role {current_user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin access required. Your role: {current_user.role}"
        )
    return current_user


async def get_funded_user(current_user = Depends(get_current_user)):
    """Dependency that requires funded or admin role"""
    from ..models.models import UserRole

    if current_user.role not in [UserRole.ADMIN, UserRole.FUNDED]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Funded account required"
        )
    return current_user


async def get_approved_user(current_user = Depends(get_current_user)):
    """Dependency that requires approved, funded, or admin role"""
    from ..models.models import UserRole

    if current_user.role not in [UserRole.ADMIN, UserRole.FUNDED, UserRole.APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Approved account required"
        )
    return current_user
