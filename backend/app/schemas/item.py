from pydantic import BaseModel, Field

from app.core.constants import MAX_ITEM_NOTE_LENGTH, MAX_ITEM_TITLE_LENGTH


class ItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=MAX_ITEM_TITLE_LENGTH)
    url: str | None = Field(None, max_length=2000)
    price: int | None = Field(None, ge=1)
    image_url: str | None = Field(None, max_length=2000)
    note: str | None = Field(None, max_length=MAX_ITEM_NOTE_LENGTH)


class ItemUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=MAX_ITEM_TITLE_LENGTH)
    url: str | None = Field(None, max_length=2000)
    price: int | None = Field(None, ge=1)
    image_url: str | None = Field(None, max_length=2000)
    note: str | None = Field(None, max_length=MAX_ITEM_NOTE_LENGTH)


class ItemResponse(BaseModel):
    id: str
    wishlist_id: str
    title: str
    url: str | None
    price: int | None
    image_url: str | None
    note: str | None
    position: int
    is_reserved: bool = False
    total_contributed: int = 0
    contributors_count: int = 0
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ReorderItem(BaseModel):
    id: str
    position: int


class ReorderRequest(BaseModel):
    items: list[ReorderItem]
