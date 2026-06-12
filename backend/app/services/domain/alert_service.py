from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.repositories.base import AlertRepository
from app.schemas.rail import AlertOut
from app.services.data_service import data_service

class AlertService:
    def __init__(self, db: AsyncSession, alert_repo: AlertRepository = Depends()):
        self.db = db
        self.alert_repo = alert_repo
        self.sim_service = data_service

    async def list_alerts(self, station_name: str | None = None) -> List[AlertOut]:
        """Fetch active alerts from DB, fallback to simulation."""
        # Try DB first
        db_alerts = await self.alert_repo.get_active_alerts()
        
        if db_alerts:
            # We have live data alerts!
            results = []
            for alert in db_alerts:
                if station_name and alert.station_id != station_name:
                    continue
                results.append(
                    AlertOut(
                        id=alert.id,
                        alert_type=alert.alert_type.value if hasattr(alert.alert_type, "value") else alert.alert_type,
                        severity=alert.severity.value if hasattr(alert.severity, "value") else alert.severity,
                        title=alert.title,
                        message=alert.message,
                        station_name=alert.station_id,  # TODO: Resolve station name
                        train_id=alert.train_id,
                        created_at=alert.created_at
                    )
                )
            return results
            
        # Fallback to simulation
        return self.sim_service.list_alerts(station_name=station_name)

    async def get_emergency_status(self) -> bool:
        """Check if there are any HIGH or CRITICAL severity alerts active."""
        alerts = await self.list_alerts()
        for alert in alerts:
            # Check string values or enum values depending on what list_alerts returns
            severity = alert.severity
            if severity in ["high", "critical", "HIGH", "CRITICAL"]:
                return True
        return False

    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Mark an alert as acknowledged by an operator."""
        # The Alert model does not have acknowledged_at, but we log the action
        # and could expand the DB schema later if required.
        # For now, we'll verify the alert exists.
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            return False
        # Logging would go here
        return True

    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert by setting resolved_at to now."""
        from datetime import datetime
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            return False
        
        alert.resolved_at = datetime.utcnow()
        await self.db.commit()
        return True

from app.db.session import get_db

async def get_alert_service(
    db: AsyncSession = Depends(get_db), 
) -> AlertService:
    return AlertService(
        db=db,
        alert_repo=AlertRepository(db)
    )
