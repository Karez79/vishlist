from pydantic import BaseModel, Field


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
