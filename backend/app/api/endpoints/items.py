from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.constants import DEFAULT_ITEMS_PAGE_SIZE, MAX_ITEMS_PER_WISHLIST
from app.core.ws_manager import manager
from app.models.item import WishlistItem
from app.models.user import User
from app.models.wishlist import Wishlist
from app.models.contribution import ItemContribution
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate, ReorderRequest
from app.schemas.pagination import PaginatedResponse
from app.utils.pagination import paginate

router = APIRouter(tags=["items"])


def item_to_response(item: WishlistItem) -> ItemResponse:
    is_reserved = item.reservation is not None if hasattr(item, "reservation") and item.reservation is not None else False
    total_contributed = sum(c.amount for c in item.contributions) if hasattr(item, "contributions") else 0
    contributors_count = len(item.contributions) if hasattr(item, "contributions") else 0

    return ItemResponse(
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
    )


async def get_owner_wishlist(wishlist_id: UUID, user: User, db: AsyncSession) -> Wishlist:
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
    return wishlist


async def get_wishlist_slug(item: WishlistItem, db: AsyncSession) -> str:
    result = await db.execute(
        select(Wishlist.slug).where(Wishlist.id == item.wishlist_id)
    )
    return result.scalar_one()


@router.get("/wishlists/{wishlist_id}/items", response_model=PaginatedResponse[ItemResponse])
async def list_items(
    wishlist_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(DEFAULT_ITEMS_PAGE_SIZE, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owner_wishlist(wishlist_id, user, db)

    query = (
        select(WishlistItem)
        .where(WishlistItem.wishlist_id == wishlist_id, WishlistItem.is_deleted == False)
        .options(
            selectinload(WishlistItem.reservation),
            selectinload(WishlistItem.contributions),
        )
        .order_by(WishlistItem.position)
    )
    result = await paginate(db, query, page, per_page)
    result["items"] = [item_to_response(item) for item in result["items"]]
    return result


@router.post("/wishlists/{wishlist_id}/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    wishlist_id: UUID,
    data: ItemCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wishlist = await get_owner_wishlist(wishlist_id, user, db)

    # Check limit
    count_result = await db.execute(
        select(func.count(WishlistItem.id)).where(
            WishlistItem.wishlist_id == wishlist_id,
            WishlistItem.is_deleted == False,
        )
    )
    count = count_result.scalar_one()
    if count >= MAX_ITEMS_PER_WISHLIST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Максимум {MAX_ITEMS_PER_WISHLIST} товаров в вишлисте",
        )

    # Get next position
    max_pos_result = await db.execute(
        select(func.max(WishlistItem.position)).where(
            WishlistItem.wishlist_id == wishlist_id
        )
    )
    max_pos = max_pos_result.scalar_one() or 0

    item = WishlistItem(
        wishlist_id=wishlist_id,
        title=data.title.strip(),
        url=data.url,
        price=data.price,
        image_url=data.image_url,
        note=data.note.strip() if data.note else None,
        position=max_pos + 1,
    )
    db.add(item)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.id == item.id)
        .options(
            selectinload(WishlistItem.reservation),
            selectinload(WishlistItem.contributions),
        )
    )
    item = result.scalar_one()

    await manager.broadcast(wishlist.slug, {"type": "item_added", "item_id": str(item.id)})
    return item_to_response(item)


@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    data: ItemUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WishlistItem)
        .join(Wishlist)
        .where(
            WishlistItem.id == item_id,
            Wishlist.user_id == user.id,
            WishlistItem.is_deleted == False,
        )
        .options(
            selectinload(WishlistItem.reservation),
            selectinload(WishlistItem.contributions),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("title", "note") and isinstance(value, str):
            value = value.strip()
        setattr(item, field, value)

    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "item_updated", "item_id": str(item.id)})
    return item_to_response(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item(
    item_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WishlistItem)
        .join(Wishlist)
        .where(
            WishlistItem.id == item_id,
            Wishlist.user_id == user.id,
            WishlistItem.is_deleted == False,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    item.is_deleted = True
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "item_deleted", "item_id": str(item.id)})
    return {"detail": "Товар удалён"}


@router.post("/items/{item_id}/restore", response_model=ItemResponse)
async def restore_item(
    item_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WishlistItem)
        .join(Wishlist)
        .where(
            WishlistItem.id == item_id,
            Wishlist.user_id == user.id,
            WishlistItem.is_deleted == True,
        )
        .options(
            selectinload(WishlistItem.reservation),
            selectinload(WishlistItem.contributions),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    item.is_deleted = False
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "item_added", "item_id": str(item.id)})
    return item_to_response(item)


@router.patch("/wishlists/{wishlist_id}/items/reorder")
async def reorder_items(
    wishlist_id: UUID,
    data: ReorderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owner_wishlist(wishlist_id, user, db)

    for reorder_item in data.items:
        result = await db.execute(
            select(WishlistItem).where(
                WishlistItem.id == UUID(reorder_item.id),
                WishlistItem.wishlist_id == wishlist_id,
            )
        )
        item = result.scalar_one_or_none()
        if item:
            item.position = reorder_item.position

    await db.flush()
    return {"detail": "Порядок обновлён"}
