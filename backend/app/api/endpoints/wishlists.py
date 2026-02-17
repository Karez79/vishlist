from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.constants import DEFAULT_PAGE_SIZE, MAX_WISHLISTS_PER_USER
from app.core.ws_manager import manager
from app.models.user import User
from app.models.wishlist import Wishlist
from app.models.item import WishlistItem
from app.schemas.pagination import PaginatedResponse
from app.schemas.wishlist import WishlistCreate, WishlistResponse, WishlistUpdate
from app.utils.pagination import paginate
from app.utils.slug import create_unique_slug

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


def wishlist_to_response(w: Wishlist, items_count: int = 0) -> WishlistResponse:
    return WishlistResponse(
        id=str(w.id),
        user_id=str(w.user_id),
        title=w.title,
        description=w.description,
        slug=w.slug,
        emoji=w.emoji,
        event_date=w.event_date,
        is_archived=w.is_archived,
        created_at=w.created_at.isoformat(),
        updated_at=w.updated_at.isoformat(),
        items_count=items_count,
    )


@router.get("", response_model=PaginatedResponse[WishlistResponse])
async def list_wishlists(
    page: int = Query(1, ge=1),
    per_page: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Wishlist)
        .where(Wishlist.user_id == user.id, Wishlist.is_deleted == False)
        .order_by(Wishlist.is_archived, Wishlist.updated_at.desc())
    )
    result = await paginate(db, query, page, per_page)

    # Get item counts for each wishlist
    wishlist_ids = [w.id for w in result["items"]]
    counts: dict[UUID, int] = {}
    if wishlist_ids:
        count_result = await db.execute(
            select(WishlistItem.wishlist_id, func.count(WishlistItem.id))
            .where(
                WishlistItem.wishlist_id.in_(wishlist_ids),
                WishlistItem.is_deleted == False,
            )
            .group_by(WishlistItem.wishlist_id)
        )
        counts = dict(count_result.all())

    result["items"] = [
        wishlist_to_response(w, counts.get(w.id, 0)) for w in result["items"]
    ]
    return result


@router.post("", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
async def create_wishlist(
    data: WishlistCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check limit
    count_result = await db.execute(
        select(func.count(Wishlist.id)).where(
            Wishlist.user_id == user.id, Wishlist.is_deleted == False
        )
    )
    count = count_result.scalar_one()
    if count >= MAX_WISHLISTS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Максимум {MAX_WISHLISTS_PER_USER} вишлистов",
        )

    slug = await create_unique_slug(data.title, db)

    wishlist = Wishlist(
        user_id=user.id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        slug=slug,
        emoji=data.emoji,
        event_date=data.event_date,
    )
    db.add(wishlist)
    await db.flush()

    return wishlist_to_response(wishlist)


@router.get("/{wishlist_id}", response_model=WishlistResponse)
async def get_wishlist(
    wishlist_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.id == wishlist_id,
            Wishlist.user_id == user.id,
            Wishlist.is_deleted == False,
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    count_result = await db.execute(
        select(func.count(WishlistItem.id)).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.is_deleted == False,
        )
    )
    items_count = count_result.scalar_one()

    return wishlist_to_response(wishlist, items_count)


@router.put("/{wishlist_id}", response_model=WishlistResponse)
async def update_wishlist(
    wishlist_id: UUID,
    data: WishlistUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.id == wishlist_id,
            Wishlist.user_id == user.id,
            Wishlist.is_deleted == False,
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "title" and value:
            value = value.strip()
        if field == "description" and value:
            value = value.strip()
        setattr(wishlist, field, value)

    await db.flush()
    return wishlist_to_response(wishlist)


@router.delete("/{wishlist_id}", status_code=status.HTTP_200_OK)
async def delete_wishlist(
    wishlist_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.id == wishlist_id,
            Wishlist.user_id == user.id,
            Wishlist.is_deleted == False,
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    wishlist.is_deleted = True
    await db.flush()

    await manager.broadcast(wishlist.slug, {"type": "wishlist_deleted"})
    await manager.close_all(wishlist.slug)
    return {"detail": "Вишлист удалён"}


@router.post("/{wishlist_id}/restore", response_model=WishlistResponse)
async def restore_wishlist(
    wishlist_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.id == wishlist_id,
            Wishlist.user_id == user.id,
            Wishlist.is_deleted == True,
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    wishlist.is_deleted = False
    await db.flush()
    return wishlist_to_response(wishlist)
