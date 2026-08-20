"""Prediction domain model."""

from sqlalchemy import String, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from datetime import datetime


class Prediction(Base):
    """Prediction output for trains and stations."""

    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    train_id: Mapped[str] = mapped_column(String(32))
    station_name: Mapped[str] = mapped_column(String(100))
    predicted_occupancy: Mapped[int] = mapped_column(Integer)
    predicted_5_min: Mapped[int] = mapped_column(Integer)
    predicted_15_min: Mapped[int] = mapped_column(Integer)
    predicted_30_min: Mapped[int] = mapped_column(Integer)
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
