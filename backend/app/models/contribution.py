import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, utcnow


class ItemContribution(Base):
    __tablename__ = "item_contributions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wishlist_items.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    guest_name: Mapped[str | None] = mapped_column(String(50))
    guest_token: Mapped[str | None] = mapped_column(String(255), index=True)
    guest_email: Mapped[str | None] = mapped_column(String(255))
    amount: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    item: Mapped["WishlistItem"] = relationship(back_populates="contributions")


from app.models.item import WishlistItem  # noqa: E402, F401
