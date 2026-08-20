"""Route domain model."""

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime


class Route(Base):
    """Route (line + direction)."""

    __tablename__ = "routes"
    id = None

    route_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    line_id: Mapped[str] = mapped_column(String(8))
    direction: Mapped[str] = mapped_column(String(8))  # UP/DOWN
    origin_station_id: Mapped[str] = mapped_column(String(8))
    destination_station_id: Mapped[str] = mapped_column(String(8))
    runtime_minutes: Mapped[int] = mapped_column(Integer)

    stops: Mapped[list["RouteStop"]] = relationship(back_populates="route")


class RouteStop(Base):
    """Individual stop on a route."""

    __tablename__ = "route_stops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[str] = mapped_column(String(16), ForeignKey("routes.route_id"))
    station_id: Mapped[str] = mapped_column(String(8))
    stop_order: Mapped[int] = mapped_column(Integer)
    arrival_offset_minutes: Mapped[int] = mapped_column(Integer)
    departure_offset_minutes: Mapped[int] = mapped_column(Integer)
    dwell_minutes: Mapped[int] = mapped_column(Integer, default=1)

    route: Mapped["Route"] = relationship(back_populates="stops")


class StationCrowdSnapshot(Base):
    """Station crowd snapshots for prediction."""

    __tablename__ = "station_crowd_snapshots"
    __table_args__ = (
        # Speeds up "latest crowd for station X" lookups (runs every API call).
        Index("ix_crowd_station_ts", "station_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String(8))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    current_crowd: Mapped[int] = mapped_column(Integer)
    predicted_5_min: Mapped[int] = mapped_column(Integer)
    predicted_15_min: Mapped[int] = mapped_column(Integer)
    predicted_30_min: Mapped[int] = mapped_column(Integer)