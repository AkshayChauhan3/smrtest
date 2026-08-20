"""Saved route model for passenger route preferences."""

from sqlalchemy import String, Integer, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from datetime import datetime


class SavedRoute(Base):
    """A passenger's saved route preference."""

    __tablename__ = "saved_routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), index=True)
    line_id: Mapped[str] = mapped_column(String(8))
    from_station_id: Mapped[str] = mapped_column(String(8))
    to_station_id: Mapped[str] = mapped_column(String(8))
    label: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
