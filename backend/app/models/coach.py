"""Coach domain model."""

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Coach(Base):
    """Reusable coach master data."""

    __tablename__ = "coaches"

    coach_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    coach_number: Mapped[str] = mapped_column(String(8))
    coach_type: Mapped[str] = mapped_column(String(16))  # GENERAL, LADIES, ACCESSIBILITY
    capacity: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
