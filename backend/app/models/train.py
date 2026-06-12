"""Train domain model."""

from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Float, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime


class Train(Base):
    """Train master data."""

    __tablename__ = "trains"
    id = None

    train_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    train_name: Mapped[str] = mapped_column(String(100))
    line_id: Mapped[str] = mapped_column(String(8))
    direction: Mapped[str] = mapped_column(String(16))  # UP/DOWN
    current_station_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    next_station_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    journey_completed_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_position: Mapped[float | None] = mapped_column(Float, nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=1200)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE")  # ACTIVE, MAINTENANCE, RETIRED

    # ── Live coach passenger counts (updated every simulation tick) ──────────
    # C1 — Coach 1, General | C2 — Coach 2, Ladies | C3 — Coach 3, General
    c1_passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    c2_passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    c3_passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    c1_occupancy_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    c2_occupancy_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    c3_occupancy_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

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
    __table_args__ = (
        # Speeds up "latest snapshot for train X" lookups (runs every simulation tick).
        Index("ix_occ_train_ts", "train_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    train_id: Mapped[str] = mapped_column(String(32), ForeignKey("trains.train_id"))
    station_id: Mapped[str] = mapped_column(String(8))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    total_passengers: Mapped[int] = mapped_column(Integer)
    coach_data: Mapped[dict | None] = mapped_column(JSON)  # per-coach breakdown

    train: Mapped["Train"] = relationship(back_populates="occupancy_snapshots")