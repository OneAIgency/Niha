from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from ...core.security import (
    generate_magic_link_token,
    create_access_token,
    verify_token,
    verify_password,
    RedisManager
)
from ...models.models import User, Entity, AuthenticationAttempt, AuthMethod
from ...schemas.schemas import (
    MagicLinkRequest,
    MagicLinkVerify,
    PasswordLoginRequest,
    TokenResponse,
    UserResponse,
    MessageResponse
)
from ...services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/magic-link", response_model=MessageResponse)
async def request_magic_link(
    request: MagicLinkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request a magic link for passwordless authentication.
    Sends an email with a one-time login link.
    """
    email = request.email.lower()

    # Check if user exists, if not create one
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create user for demo purposes
        user = User(email=email)
        db.add(user)
        await db.commit()

    # Generate magic link token
    token = generate_magic_link_token()

    # Store token in Redis
    await RedisManager.store_magic_link(token, email)

    # Send email
    await email_service.send_magic_link(email, token)

    return MessageResponse(
        message="Magic link sent! Check your email to sign in.",
        success=True
    )


@router.post("/verify", response_model=TokenResponse)
async def verify_magic_link(
    verify_request: MagicLinkVerify,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify magic link token and return JWT access token.
    """
    # Extract client info for logging
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]

    # Verify the magic link token
    email = await RedisManager.verify_magic_link(verify_request.token)

    if not email:
        # Log failed magic link attempt (no email to log)
        auth_attempt = AuthenticationAttempt(
            user_id=None,
            email="unknown",
            success=False,
            method=AuthMethod.MAGIC_LINK,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="invalid_or_expired_token"
        )
        db.add(auth_attempt)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired magic link"
        )

    # Get user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        auth_attempt = AuthenticationAttempt(
            user_id=None,
            email=email,
            success=False,
            method=AuthMethod.MAGIC_LINK,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="user_not_found"
        )
        db.add(auth_attempt)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Log successful magic link auth
    auth_attempt = AuthenticationAttempt(
        user_id=user.id,
        email=email,
        success=True,
        method=AuthMethod.MAGIC_LINK,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(auth_attempt)

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    logger.info(f"Magic link auth: email={email}, success=True, ip={ip_address}")

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def password_login(
    login_request: PasswordLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    """
    email = login_request.email.lower()

    # Extract client info for logging
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]

    # Helper function to log auth attempt
    async def log_auth_attempt(user_id, success: bool, failure_reason: str = None):
        auth_attempt = AuthenticationAttempt(
            user_id=user_id,
            email=email,
            success=success,
            method=AuthMethod.PASSWORD,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=failure_reason
        )
        db.add(auth_attempt)
        await db.commit()
        logger.info(f"Auth attempt: email={email}, success={success}, ip={ip_address}, reason={failure_reason}")

    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        await log_auth_attempt(user.id if user else None, False, "user_not_found_or_no_password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(login_request.password, user.password_hash):
        await log_auth_attempt(user.id, False, "invalid_password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        await log_auth_attempt(user.id, False, "account_disabled")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )

    # Log successful authentication
    await log_auth_attempt(user.id, True)

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Logout user. In a real app, this would invalidate the JWT.
    """
    return MessageResponse(
        message="Successfully logged out",
        success=True
    )


async def get_current_user(
    token: str = Depends(lambda: None),  # Would come from header
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user
