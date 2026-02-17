import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user_optional_readonly, get_db_readonly
from app.core.constants import DEFAULT_ITEMS_PAGE_SIZE
from app.models.item import WishlistItem
from app.models.user import User
from app.models.wishlist import Wishlist
from app.schemas.public import (
    PublicContribution,
    PublicItemResponse,
    PublicReservation,
    PublicWishlistResponse,
)
from app.utils.pagination import paginate

router = APIRouter(prefix="/wishlists/public", tags=["public"])


def item_to_public_response(
    item: WishlistItem,
    is_owner: bool,
    guest_token: str | None = None,
    user: User | None = None,
) -> PublicItemResponse:
    is_reserved = item.reservation is not None
    total_contributed = sum(c.amount for c in item.contributions) if item.contributions else 0
    contributors_count = len(item.contributions) if item.contributions else 0

    reservation = None
    contributions: list[PublicContribution] = []

    if is_owner:
        # Owner sees statuses but NOT names/details
        pass
    else:
        # Guests see reservation name and contribution names+amounts
        if item.reservation:
            r = item.reservation
            reservation = PublicReservation(
                id=str(r.id),
                item_id=str(r.item_id),
                guest_name=r.guest_name,
                is_mine=(
                    (user is not None and r.user_id is not None and r.user_id == user.id)
                    or (guest_token and r.guest_token and secrets.compare_digest(r.guest_token, guest_token))
                    or False
                ),
                created_at=r.created_at.isoformat(),
            )

        for c in item.contributions:
            contributions.append(PublicContribution(
                id=str(c.id),
                item_id=str(c.item_id),
                guest_name=c.guest_name,
                amount=c.amount,
                is_mine=(
                    (user is not None and c.user_id is not None and c.user_id == user.id)
                    or (guest_token and c.guest_token and secrets.compare_digest(c.guest_token, guest_token))
                    or False
                ),
                created_at=c.created_at.isoformat(),
            ))

    return PublicItemResponse(
        id=str(item.id),
        wishlist_id=str(item.wishlist_id),
        title=item.title,
        url=item.url,
        price=item.price,
        image_url=item.image_url,
        note=item.note,
        position=item.position,
        is_reserved=is_reserved,
        total_contributed=total_contributed,
        contributors_count=contributors_count,
        created_at=item.created_at.isoformat(),
        updated_at=item.updated_at.isoformat(),
        reservation=reservation,
        contributions=contributions,
    )


@router.get("/{slug}", response_model=PublicWishlistResponse)
async def get_public_wishlist(
    slug: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(DEFAULT_ITEMS_PAGE_SIZE, ge=1, le=100),
    x_guest_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional_readonly),
    db: AsyncSession = Depends(get_db_readonly),
):
    # Find wishlist by slug
    result = await db.execute(
        select(Wishlist).where(Wishlist.slug == slug)
    )
    wishlist = result.scalar_one_or_none()

    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    # Deleted wishlist → 410 Gone
    if wishlist.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Этот вишлист был удалён",
        )

    is_owner = user is not None and wishlist.user_id == user.id

    # Get owner info
    owner_result = await db.execute(
        select(User).where(User.id == wishlist.user_id)
    )
    owner = owner_result.scalar_one_or_none()

    # Paginate items
    items_query = (
        select(WishlistItem)
        .where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.is_deleted == False,
        )
        .options(
            selectinload(WishlistItem.reservation),
            selectinload(WishlistItem.contributions),
        )
        .order_by(WishlistItem.position)
    )
    items_result = await paginate(db, items_query, page, per_page)

    return PublicWishlistResponse(
        id=str(wishlist.id),
        user_id=str(wishlist.user_id),
        title=wishlist.title,
        description=wishlist.description,
        slug=wishlist.slug,
        emoji=wishlist.emoji,
        event_date=wishlist.event_date,
        is_archived=wishlist.is_archived,
        created_at=wishlist.created_at.isoformat(),
        updated_at=wishlist.updated_at.isoformat(),
        owner_name=owner.name if owner else "Unknown",
        owner_avatar_url=owner.avatar_url if owner else None,
        items_data={
            "items": [
                item_to_public_response(item, is_owner, x_guest_token, user)
                for item in items_result["items"]
            ],
            "total": items_result["total"],
            "page": items_result["page"],
            "per_page": items_result["per_page"],
            "pages": items_result["pages"],
        },
        is_owner=is_owner,
    )
