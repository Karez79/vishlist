from datetime import date

from pydantic import BaseModel

from app.schemas.pagination import PaginatedResponse


class PublicReservation(BaseModel):
    id: str
    item_id: str
    guest_name: str | None
    is_mine: bool
    created_at: str


class PublicContribution(BaseModel):
    id: str
    item_id: str
    guest_name: str | None
    amount: int
    is_mine: bool
    created_at: str


class PublicItemResponse(BaseModel):
    id: str
    wishlist_id: str
    title: str
    url: str | None
    price: int | None
    image_url: str | None
    note: str | None
    position: int
    is_reserved: bool
    total_contributed: int
    contributors_count: int
    created_at: str
    updated_at: str
    reservation: PublicReservation | None = None
    contributions: list[PublicContribution] = []


class PublicWishlistResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None
    slug: str
    emoji: str
    event_date: date | None
    is_archived: bool
    created_at: str
    updated_at: str
    owner_name: str
    owner_avatar_url: str | None
    items_data: PaginatedResponse[PublicItemResponse]
    is_owner: bool
