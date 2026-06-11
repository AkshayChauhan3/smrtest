"""Station domain model."""

from sqlalchemy import String, Boolean, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Station(Base):
    """Station master data."""

    __tablename__ = "stations"

    station_id: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    line_id: Mapped[str] = mapped_column(String(8))
    is_interchange: Mapped[bool] = mapped_column(Boolean, default=False)
    is_busy: Mapped[bool] = mapped_column(Boolean, default=False)
    cumulative_km: Mapped[float] = mapped_column(Float)
    sort_order: Mapped[int] = mapped_column(Integer)