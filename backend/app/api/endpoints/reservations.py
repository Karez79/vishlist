import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import create_guest_recovery_token, decode_guest_recovery_token
from app.models.contribution import ItemContribution
from app.models.item import WishlistItem
from app.models.reservation import ItemReservation
from app.models.user import User
from app.models.wishlist import Wishlist
from app.core.ws_manager import manager
from app.schemas.reservation import (
    ContributeRequest,
    ContributeResponse,
    GuestRecoverRequest,
    GuestVerifyRequest,
    ReserveRequest,
    ReserveResponse,
    UpdateGuestEmailRequest,
)
from app.utils.email import send_recovery_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["reservations"])


async def get_wishlist_slug(item: WishlistItem, db: AsyncSession) -> str:
    result = await db.execute(
        select(Wishlist.slug).where(Wishlist.id == item.wishlist_id)
    )
    return result.scalar_one()


async def get_item_for_update(item_id: uuid.UUID, db: AsyncSession) -> WishlistItem:
    """Get item with row lock for race condition prevention."""
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.id == item_id, WishlistItem.is_deleted == False)
        .with_for_update()
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return item


async def verify_not_owner(item: WishlistItem, user: Optional[User], db: AsyncSession):
    """Ensure the current user is not the wishlist owner."""
    if user:
        result = await db.execute(
            select(Wishlist).where(Wishlist.id == item.wishlist_id)
        )
        wishlist = result.scalar_one_or_none()
        if wishlist and wishlist.user_id == user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя резервировать в своём вишлисте",
            )


# --- RESERVATION ---

@router.post("/items/{item_id}/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_item(
    item_id: uuid.UUID,
    data: ReserveRequest,
    x_guest_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    item = await get_item_for_update(item_id, db)
    await verify_not_owner(item, user, db)

    # Check if already reserved
    existing = await db.execute(
        select(ItemReservation).where(ItemReservation.item_id == item.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Этот подарок уже зарезервирован",
        )

    # Check if item has contributions (can't reserve if collecting)
    contrib_sum = await db.execute(
        select(func.coalesce(func.sum(ItemContribution.amount), 0)).where(
            ItemContribution.item_id == item.id
        )
    )
    if contrib_sum.scalar_one() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="На этот подарок уже идёт сбор средств",
        )

    guest_token = x_guest_token or str(uuid.uuid4())

    reservation = ItemReservation(
        item_id=item.id,
        user_id=user.id if user else None,
        guest_name=data.guest_name.strip() if not user else user.name,
        guest_token=guest_token if not user else None,
    )
    db.add(reservation)
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "reservation_created", "item_id": str(item.id)})

    return ReserveResponse(
        id=str(reservation.id),
        item_id=str(reservation.item_id),
        guest_name=reservation.guest_name,
        guest_token=guest_token if not user else None,
        is_mine=True,
        created_at=reservation.created_at.isoformat(),
    )


@router.delete("/items/{item_id}/reserve")
async def cancel_reservation(
    item_id: uuid.UUID,
    x_guest_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemReservation).where(ItemReservation.item_id == item_id)
    )
    reservation = result.scalar_one_or_none()
    if not reservation:
        raise HTTPException(status_code=404, detail="Резервация не найдена")

    # Verify ownership
    is_owner = False
    if user and reservation.user_id == user.id:
        is_owner = True
    elif x_guest_token and reservation.guest_token == x_guest_token:
        is_owner = True

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете отменить эту резервацию",
        )

    # Get item for slug broadcast
    item_result = await db.execute(
        select(WishlistItem).where(WishlistItem.id == reservation.item_id)
    )
    item = item_result.scalar_one()

    await db.delete(reservation)
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "reservation_cancelled", "item_id": str(item.id)})

    return {"detail": "Резервация отменена"}


@router.patch("/reservations/{reservation_id}/email")
async def update_reservation_email(
    reservation_id: uuid.UUID,
    data: UpdateGuestEmailRequest,
    x_guest_token: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemReservation).where(ItemReservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    if not reservation:
        raise HTTPException(status_code=404, detail="Резервация не найдена")

    if not x_guest_token or reservation.guest_token != x_guest_token:
        raise HTTPException(status_code=403, detail="Нет доступа")

    reservation.guest_email = data.email.lower().strip()
    await db.flush()
    return {"detail": "Email сохранён"}


# --- CONTRIBUTIONS ---

@router.post("/items/{item_id}/contribute", status_code=status.HTTP_201_CREATED)
async def contribute_to_item(
    item_id: uuid.UUID,
    data: ContributeRequest,
    x_guest_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    item = await get_item_for_update(item_id, db)
    await verify_not_owner(item, user, db)

    if not item.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У этого подарка нет цены для сбора",
        )

    # Check if already reserved (can't contribute to reserved item)
    existing_reservation = await db.execute(
        select(ItemReservation).where(ItemReservation.item_id == item.id)
    )
    if existing_reservation.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Этот подарок уже зарезервирован",
        )

    # Check total contributions don't exceed price
    total_result = await db.execute(
        select(func.coalesce(func.sum(ItemContribution.amount), 0)).where(
            ItemContribution.item_id == item.id
        )
    )
    total = total_result.scalar_one()
    remaining = item.price - total

    if remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Сумма уже собрана",
        )

    if data.amount > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Осталось собрать: {remaining} ₽",
        )

    guest_token = x_guest_token or str(uuid.uuid4())

    contribution = ItemContribution(
        item_id=item.id,
        user_id=user.id if user else None,
        guest_name=data.guest_name.strip() if not user else user.name,
        guest_token=guest_token if not user else None,
        amount=data.amount,
    )
    db.add(contribution)
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "contribution_created", "item_id": str(item.id)})

    return ContributeResponse(
        id=str(contribution.id),
        item_id=str(contribution.item_id),
        guest_name=contribution.guest_name,
        amount=contribution.amount,
        guest_token=guest_token if not user else None,
        is_mine=True,
        created_at=contribution.created_at.isoformat(),
    )


@router.delete("/contributions/{contribution_id}")
async def delete_contribution(
    contribution_id: uuid.UUID,
    x_guest_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemContribution).where(ItemContribution.id == contribution_id)
    )
    contribution = result.scalar_one_or_none()
    if not contribution:
        raise HTTPException(status_code=404, detail="Вклад не найден")

    is_owner = False
    if user and contribution.user_id == user.id:
        is_owner = True
    elif x_guest_token and contribution.guest_token == x_guest_token:
        is_owner = True

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалить этот вклад",
        )

    # Get item for slug broadcast
    item_result = await db.execute(
        select(WishlistItem).where(WishlistItem.id == contribution.item_id)
    )
    item = item_result.scalar_one()

    await db.delete(contribution)
    await db.flush()

    slug = await get_wishlist_slug(item, db)
    await manager.broadcast(slug, {"type": "contribution_deleted", "item_id": str(item.id)})

    return {"detail": "Вклад удалён"}


@router.patch("/contributions/{contribution_id}/email")
async def update_contribution_email(
    contribution_id: uuid.UUID,
    data: UpdateGuestEmailRequest,
    x_guest_token: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemContribution).where(ItemContribution.id == contribution_id)
    )
    contribution = result.scalar_one_or_none()
    if not contribution:
        raise HTTPException(status_code=404, detail="Вклад не найден")

    if not x_guest_token or contribution.guest_token != x_guest_token:
        raise HTTPException(status_code=403, detail="Нет доступа")

    contribution.guest_email = data.email.lower().strip()
    await db.flush()
    return {"detail": "Email сохранён"}


# --- GUEST RECOVERY ---

RECOVERY_RESPONSE = {"detail": "Если email найден, мы отправим ссылку для восстановления"}


@router.post("/guest/recover")
@limiter.limit("3/minute")
async def guest_recover(
    request: Request,
    data: GuestRecoverRequest,
    db: AsyncSession = Depends(get_db),
):
    """Find guest_token by email + slug and send recovery email."""
    email = data.email.lower().strip()

    # Find reservation or contribution with this email for this wishlist
    result = await db.execute(
        select(Wishlist).where(Wishlist.slug == data.wishlist_slug, Wishlist.is_deleted == False)
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        logger.info("Guest recovery: wishlist slug=%s not found", data.wishlist_slug)
        return RECOVERY_RESPONSE

    # Check reservations
    res_result = await db.execute(
        select(ItemReservation)
        .join(WishlistItem)
        .where(
            WishlistItem.wishlist_id == wishlist.id,
            ItemReservation.guest_email == email,
        )
    )
    reservation = res_result.scalars().first()

    # Check contributions
    contrib_result = await db.execute(
        select(ItemContribution)
        .join(WishlistItem)
        .where(
            WishlistItem.wishlist_id == wishlist.id,
            ItemContribution.guest_email == email,
        )
    )
    contribution = contrib_result.scalars().first()

    guest_token = None
    if reservation and reservation.guest_token:
        guest_token = reservation.guest_token
    elif contribution and contribution.guest_token:
        guest_token = contribution.guest_token

    if guest_token:
        recovery_token = create_guest_recovery_token(guest_token, data.wishlist_slug)
        logger.info("Guest recovery: token generated for slug=%s", data.wishlist_slug)

        if settings.DEBUG:
            # Dev mode: return token directly for testing
            logger.warning("DEV MODE: returning recovery token in response")
            return {**RECOVERY_RESPONSE, "recovery_token": recovery_token}

        # Production: send email with recovery link
        recovery_url = f"{settings.FRONTEND_URL}/w/{data.wishlist_slug}?recovery={recovery_token}"
        await send_recovery_email(email, wishlist.title, recovery_url)
    else:
        logger.info("Guest recovery: no matching email for slug=%s", data.wishlist_slug)

    return RECOVERY_RESPONSE


@router.post("/guest/verify")
@limiter.limit("5/minute")
async def guest_verify(
    request: Request,
    data: GuestVerifyRequest,
):
    """Verify recovery token and return guest_token."""
    payload = decode_guest_recovery_token(data.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недействительная или истёкшая ссылка",
        )

    return {
        "guest_token": payload["guest_token"],
        "wishlist_slug": payload["wishlist_slug"],
    }
