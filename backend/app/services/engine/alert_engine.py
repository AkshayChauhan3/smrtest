import logging
import uuid
from datetime import datetime
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.base import AlertRepository
from app.models.alert import Alert, AlertType, SeverityLevel
from app.schemas.ingestion import SensorEvent
from app.core.websockets import manager

logger = logging.getLogger(__name__)

class AlertEngine:
    def __init__(self, db: AsyncSession, alert_repo: AlertRepository):
        self.db = db
        self.alert_repo = alert_repo

    async def evaluate_occupancy_snapshot(self, event: SensorEvent, total_passengers: int):
        """Evaluate real-time ingestion data against operational rules."""
        
        # 1. Platform Congestion Rule
        if total_passengers > 500:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            alert = Alert(
                id=alert_id,
                alert_type=AlertType.PLATFORM_CONGESTION,
                severity=SeverityLevel.HIGH,
                title="Platform Congestion",
                message=f"Crowd exceeded 500 passengers ({total_passengers}). Deploy additional staff.",
                station_id=event.station_id,
                train_id=event.train_id,
                created_at=datetime.utcnow()
            )
            await self.alert_repo.create(alert)
            logger.info(f"Generated alert: {alert_id} for Platform Congestion")
            
            # Broadcast over WebSocket
            await manager.broadcast({
                "event_type": "alert_issued",
                "data": {
                    "id": alert.id,
                    "alert_type": alert.alert_type.value,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "message": alert.message,
                    "station_name": alert.station_id,
                    "train_id": alert.train_id,
                    "created_at": alert.created_at.isoformat()
                }
            })

        # 2. Train Delay Rule
        if event.delay_minutes and event.delay_minutes > 5:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            alert = Alert(
                id=alert_id,
                alert_type=AlertType.TRAIN_DELAY,
                severity=SeverityLevel.MEDIUM,
                title="Train Delayed",
                message=f"Train delayed by {event.delay_minutes} minutes.",
                station_id=event.station_id,
                train_id=event.train_id,
                created_at=datetime.utcnow()
            )
            await self.alert_repo.create(alert)
            logger.info(f"Generated alert: {alert_id} for Train Delay")
            
            await manager.broadcast({
                "event_type": "alert_issued",
                "data": {
                    "id": alert.id,
                    "alert_type": alert.alert_type.value,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "message": alert.message,
                    "station_name": alert.station_id,
                    "train_id": alert.train_id,
                    "created_at": alert.created_at.isoformat()
                }
            })

async def get_alert_engine(db: AsyncSession = Depends(get_db)) -> AlertEngine:
    return AlertEngine(db, AlertRepository(db))
