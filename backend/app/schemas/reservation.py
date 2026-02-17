from pydantic import BaseModel, EmailStr, Field


class ReserveRequest(BaseModel):
    guest_name: str = Field(min_length=1, max_length=50)


class ReserveResponse(BaseModel):
    id: str
    item_id: str
    guest_name: str | None
    guest_token: str | None
    is_mine: bool
    created_at: str


class UpdateGuestEmailRequest(BaseModel):
    email: str = Field(max_length=255)


class ContributeRequest(BaseModel):
    guest_name: str = Field(min_length=1, max_length=50)
    amount: int = Field(ge=1)


class ContributeResponse(BaseModel):
    id: str
    item_id: str
    guest_name: str | None
    amount: int
    guest_token: str | None
    is_mine: bool
    created_at: str


class GuestRecoverRequest(BaseModel):
    email: EmailStr = Field(max_length=255)
    wishlist_slug: str = Field(max_length=150, pattern=r"^[a-z0-9][a-z0-9-]*$")


class GuestVerifyRequest(BaseModel):
    token: str = Field(min_length=1, max_length=2000)
