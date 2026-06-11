"""Train domain model."""

from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime


class Train(Base):
    """Train master data."""

    __tablename__ = "trains"

    train_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    train_name: Mapped[str] = mapped_column(String(100))
    line_id: Mapped[str] = mapped_column(String(8))
    direction: Mapped[str] = mapped_column(String(16))  # UP/DOWN
    current_station_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    next_station_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=1200)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE")  # ACTIVE, MAINTENANCE, RETIRED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    coaches: Mapped[list["TrainCoach"]] = relationship(back_populates="train")
    occupancy_snapshots: Mapped[list["OccupancySnapshot"]] = relationship(back_populates="train")


class TrainCoach(Base):
    """Train-coach mapping."""

    __tablename__ = "train_coaches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    train_id: Mapped[str] = mapped_column(String(32), ForeignKey("trains.train_id"))
    coach_number: Mapped[str] = mapped_column(String(8))
    coach_type: Mapped[str] = mapped_column(String(16))  # GENERAL, LADIES, ACCESSIBILITY
    capacity: Mapped[int] = mapped_column(Integer)

    train: Mapped["Train"] = relationship(back_populates="coaches")


class OccupancySnapshot(Base):
    """Occupancy per train per station event."""

    __tablename__ = "occupancy_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    train_id: Mapped[str] = mapped_column(String(32), ForeignKey("trains.train_id"))
    station_id: Mapped[str] = mapped_column(String(8))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_passengers: Mapped[int] = mapped_column(Integer)
    coach_data: Mapped[dict | None] = mapped_column(JSON)  # per-coach breakdown

    train: Mapped["Train"] = relationship(back_populates="occupancy_snapshots")