import secrets
import string

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wishlist import Wishlist


def generate_slug(title: str) -> str:
    return slugify(title, max_length=100)


async def create_unique_slug(title: str, db: AsyncSession, max_attempts: int = 5) -> str:
    base_slug = generate_slug(title)
    if not base_slug:
        base_slug = "wishlist"

    slug = base_slug
    for _ in range(max_attempts):
        result = await db.execute(
            select(Wishlist.id).where(Wishlist.slug == slug).limit(1)
        )
        if not result.scalar_one_or_none():
            return slug
        suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(4))
        slug = f"{base_slug}-{suffix}"

    return slug
