from datetime import date

from pydantic import BaseModel, Field

from app.core.constants import MAX_WISHLIST_DESCRIPTION_LENGTH, MAX_WISHLIST_TITLE_LENGTH


class WishlistCreate(BaseModel):
    title: str = Field(min_length=1, max_length=MAX_WISHLIST_TITLE_LENGTH)
    description: str | None = Field(None, max_length=MAX_WISHLIST_DESCRIPTION_LENGTH)
    emoji: str = Field(default="🎁", max_length=10)
    event_date: date | None = None


class WishlistUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=MAX_WISHLIST_TITLE_LENGTH)
    description: str | None = Field(None, max_length=MAX_WISHLIST_DESCRIPTION_LENGTH)
    emoji: str | None = Field(None, max_length=10)
    event_date: date | None = None
    is_archived: bool | None = None


class WishlistResponse(BaseModel):
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
    items_count: int = 0

    model_config = {"from_attributes": True}
