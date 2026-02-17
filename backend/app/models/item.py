import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, utcnow


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    wishlist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wishlists.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    url: Mapped[str | None] = mapped_column(String(2000))
    price: Mapped[int | None] = mapped_column(Integer)
    image_url: Mapped[str | None] = mapped_column(String(2000))
    note: Mapped[str | None] = mapped_column(String(500))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    wishlist: Mapped["Wishlist"] = relationship(back_populates="items")
    reservation: Mapped["ItemReservation | None"] = relationship(back_populates="item", uselist=False, cascade="all, delete-orphan")
    contributions: Mapped[list["ItemContribution"]] = relationship(back_populates="item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_wishlist_items_wishlist_deleted", "wishlist_id", "is_deleted"),
    )


from app.models.wishlist import Wishlist  # noqa: E402, F401
from app.models.reservation import ItemReservation  # noqa: E402, F401
from app.models.contribution import ItemContribution  # noqa: E402, F401
