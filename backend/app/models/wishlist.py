import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, utcnow


class Wishlist(Base):
    __tablename__ = "wishlists"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(500))
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    emoji: Mapped[str] = mapped_column(String(10), default="🎁")
    event_date: Mapped[date | None] = mapped_column(Date)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    items: Mapped[list["WishlistItem"]] = relationship(back_populates="wishlist", cascade="all, delete-orphan")


from app.models.item import WishlistItem  # noqa: E402, F401
