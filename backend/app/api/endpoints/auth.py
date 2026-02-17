import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


_oauth_instance = None


def _get_oauth():
    """Lazily create and cache the OAuth client."""
    global _oauth_instance
    if _oauth_instance is None:
        from authlib.integrations.starlette_client import OAuth

        _oauth_instance = OAuth()
        _oauth_instance.register(
            name="google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    return _oauth_instance


@router.post("/register", response_model=TokenResponse)
@limiter.limit("3/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()

    if existing:
        if existing.oauth_provider and not existing.password_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Этот email уже используется. Войдите через Google",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже существует",
        )

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        name=data.name.strip(),
    )
    db.add(user)
    await db.flush()

    token = create_access_token(user.id)
    logger.info("User registered: %s", email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    token = create_access_token(user.id)
    logger.info("User logged in: %s", email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat(),
    )


# --- Google OAuth ---

@router.get("/google")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OAuth not configured",
        )
    oauth = _get_oauth()
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=oauth_failed")

    try:
        oauth = _get_oauth()
        token_data = await oauth.google.authorize_access_token(request)
    except Exception:
        logger.exception("OAuth callback error")
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=oauth_failed")

    user_info = token_data.get("userinfo", {})
    email = user_info.get("email")
    if not email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=no_email")

    email = email.lower().strip()
    name = user_info.get("name", email.split("@")[0])
    avatar_url = user_info.get("picture")
    oauth_id = user_info.get("sub")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Merge: attach OAuth to existing account
        if not user.oauth_provider:
            user.oauth_provider = "google"
            user.oauth_id = oauth_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
    else:
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            oauth_provider="google",
            oauth_id=oauth_id,
        )
        db.add(user)
        await db.flush()

    jwt_token = create_access_token(user.id)
    logger.info("OAuth login: %s", email)
    return RedirectResponse(f"{settings.FRONTEND_URL}/callback?token={jwt_token}")
