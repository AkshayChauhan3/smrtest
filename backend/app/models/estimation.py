"""Passenger estimation model — per-coach alighting/boarding predictions."""

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Date, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from datetime import datetime, date


class Estimation(Base):
    """
    Per-coach passenger estimation for the next station stop.

    One row is inserted per coach (C1/C2/C3) per train per simulation tick.
    Holds the train's current position + weather context + the ML model's
    prediction of how many passengers will alight and board at the next stop.
    Rows older than 24 h are automatically purged by simulation_runner.
    """

    __tablename__ = "estimations"
    __table_args__ = (
        # Speeds up "latest estimation for train X, coach Y" lookups.
        Index("ix_est_train_coach_ts", "train_id", "coach_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Train identity ────────────────────────────────────────────────────────
    train_id: Mapped[str] = mapped_column(String(32))
    line_id:  Mapped[str] = mapped_column(String(8))
    direction: Mapped[str] = mapped_column(String(8))   # UP / DOWN

    # ── Current position ─────────────────────────────────────────────────────
    current_station_id:   Mapped[str | None] = mapped_column(String(8),   nullable=True)
    current_station_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    next_station_id:      Mapped[str | None] = mapped_column(String(8),   nullable=True)
    next_station_name:    Mapped[str | None] = mapped_column(String(100), nullable=True)
    journey_pct:          Mapped[float | None] = mapped_column(Float, nullable=True)
    current_position:     Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Train scheduled time (not wall-clock) ─────────────────────────────────
    train_date: Mapped[date | None]  = mapped_column(Date,       nullable=True)
    train_time: Mapped[str  | None]  = mapped_column(String(8),  nullable=True)  # HH:MM

    # ── Coach info ────────────────────────────────────────────────────────────
    coach_id:   Mapped[str] = mapped_column(String(8))    # C1 / C2 / C3
    coach_type: Mapped[str] = mapped_column(String(16))   # GENERAL / LADIES

    # ── Current live passenger count ──────────────────────────────────────────
    current_passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── ML predictions ────────────────────────────────────────────────────────
    estimated_alighting:       Mapped[int | None]   = mapped_column(Integer, nullable=True)
    estimated_boarding:        Mapped[int | None]   = mapped_column(Integer, nullable=True)
    estimated_next_passengers: Mapped[int | None]   = mapped_column(Integer, nullable=True)
    confidence_score:          Mapped[float | None] = mapped_column(Float,   nullable=True)  # 0.0–1.0, higher = more certain
    risk_level:                Mapped[str | None]   = mapped_column(String(16), nullable=True)  # LOW / MEDIUM / HIGH / CRITICAL

    # ── Context at prediction time ────────────────────────────────────────────
    weather:      Mapped[str   | None] = mapped_column(String(32),  nullable=True)
    temperature:  Mapped[float | None] = mapped_column(Float,       nullable=True)
    is_holiday:   Mapped[bool]         = mapped_column(Boolean,     default=False)
    festival_name: Mapped[str | None]  = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
