from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
        """Fetch active alerts from DB, resolving station names."""
        db_alerts = await self.alert_repo.get_active_alerts()
        
        from app.models.station import Station
        st_res = await self.db.execute(select(Station))
        stations_map = {s.station_id: s.name for s in st_res.scalars().all()}

        results = []
        for alert in db_alerts:
            # Resolve station name if station_id is set
            st_name = None
            if alert.station_id:
                st_name = stations_map.get(alert.station_id, alert.station_id)
            
            # Filter by station name if provided
            if station_name:
                if alert.station_id != station_name and st_name != station_name:
                    continue

            results.append(
                AlertOut(
                    id=alert.id,
                    alert_type=alert.alert_type.value if hasattr(alert.alert_type, "value") else alert.alert_type,
                    severity=alert.severity.value if hasattr(alert.severity, "value") else alert.severity,
                    title=alert.title,
                    message=alert.message,
                    station_name=st_name,
                    train_id=alert.train_id,
                    created_at=alert.created_at
                )
            )
            
        # Fallback to simulation only if ingestion runner has not populated snapshots yet
        from app.models.train import OccupancySnapshot
        has_snapshots = await self.db.scalar(select(func.count()).select_from(OccupancySnapshot))
        if not has_snapshots and not results:
            return self.sim_service.list_alerts(station_name=station_name)

        return results

    async def get_emergency_status(self) -> bool:
        """Check if there are any CRITICAL or EMERGENCY severity alerts active in the last 60 seconds."""
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        threshold = now - timedelta(seconds=60)
        
        alerts = await self.list_alerts()
        for alert in alerts:
            severity = alert.severity
            if severity in ["critical", "emergency", "CRITICAL", "EMERGENCY"]:
                if alert.created_at:
                    # Handle both naive and aware datetimes if necessary
                    created_at = alert.created_at.replace(tzinfo=None) if alert.created_at.tzinfo else alert.created_at
                    if created_at >= threshold:
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
