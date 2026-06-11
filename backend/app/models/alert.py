"""Alert domain model."""

from sqlalchemy import String, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from datetime import datetime
import enum


class AlertType(str, enum.Enum):
    PLATFORM_CONGESTION = "platform_congestion"
    TRAIN_DELAY = "train_delay"
    OPERATIONAL_ISSUE = "operational_issue"
    PREDICTION_ALERT = "prediction_alert"
    SYSTEM_WARNING = "system_warning"


class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(Base):
    """Operational alerts."""

    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    alert_type: Mapped[AlertType] = mapped_column(SQLEnum(AlertType))
    severity: Mapped[SeverityLevel] = mapped_column(SQLEnum(SeverityLevel))
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(String(500))
    station_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    train_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    payload: Mapped[dict | None] = mapped_column("metadata", JSON)