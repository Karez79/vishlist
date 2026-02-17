from collections.abc import AsyncGenerator
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.security import decode_access_token
from app.models.item import WishlistItem
from app.models.user import User
from app.models.wishlist import Wishlist

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        async with session.begin():
            yield session


async def get_db_readonly() -> AsyncGenerator[AsyncSession, None]:
    """Read-only session without an explicit transaction."""
    async with async_session() as session:
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    try:
        user_id = UUID(payload["sub"])
    except (ValueError, KeyError):
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_current_user_optional_readonly(
    db: AsyncSession = Depends(get_db_readonly),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """Same as get_current_user_optional but uses a read-only session."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    try:
        user_id = UUID(payload["sub"])
    except (ValueError, KeyError):
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_wishlist_slug(item: WishlistItem, db: AsyncSession) -> str:
    result = await db.execute(
        select(Wishlist.slug).where(Wishlist.id == item.wishlist_id)
    )
    return result.scalar_one()
