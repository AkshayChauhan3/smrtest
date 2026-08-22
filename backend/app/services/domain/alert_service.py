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

    async def _ensure_seed_alerts(self):
        """Seed baseline active operational alerts into SQLite if table is empty."""
        from app.models.alert import Alert, AlertType, SeverityLevel
        from datetime import datetime, timedelta
        
        count = await self.db.scalar(select(func.count()).select_from(Alert))
        if not count or count == 0:
            now = datetime.now()
            default_alerts = [
                Alert(
                    id="alt-emg-01",
                    alert_type=AlertType.PLATFORM_CONGESTION,
                    severity=SeverityLevel.CRITICAL,
                    title="Critical Crowd Surge at Old High Court",
                    message="Platform 1 & 2 crowd exceeds 850 passengers. Immediate turnstile metering recommended.",
                    station_id="BL11",
                    train_id=None,
                    created_at=now - timedelta(minutes=4),
                    payload={"acknowledged": False},
                ),
                Alert(
                    id="alt-wrn-02",
                    alert_type=AlertType.PREDICTION_ALERT,
                    severity=SeverityLevel.HIGH,
                    title="Train Capacity Warning (BL-UP-03)",
                    message="Train BL-UP-03 coach 3 approaching 92% critical occupancy near Kalupur Metro Station.",
                    station_id="BL08",
                    train_id="BL-UP-03",
                    created_at=now - timedelta(minutes=12),
                    payload={"acknowledged": False},
                ),
                Alert(
                    id="alt-dly-03",
                    alert_type=AlertType.TRAIN_DELAY,
                    severity=SeverityLevel.MEDIUM,
                    title="Minor Dwell Delay at Motera Stadium",
                    message="Train RL-UP-04 experienced +2m dwell delay due to heavy platform boarding flow.",
                    station_id="RL15",
                    train_id="RL-UP-04",
                    created_at=now - timedelta(minutes=25),
                    payload={"acknowledged": False},
                ),
            ]
            for a in default_alerts:
                self.db.add(a)
            await self.db.commit()

    async def list_alerts(self, station_name: str | None = None) -> List[AlertOut]:
        """Fetch active alerts from DB, resolving station names and prioritizing Emergency."""
        await self._ensure_seed_alerts()
        db_alerts = await self.alert_repo.get_all_recent_alerts(limit=100)
        
        from app.models.station import Station
        st_res = await self.db.execute(select(Station))
        stations_map = {s.station_id: s.name for s in st_res.scalars().all()}

        results = []
        for alert in db_alerts:
            st_name = None
            if alert.station_id:
                st_name = stations_map.get(alert.station_id, alert.station_id)
            
            if station_name:
                if alert.station_id != station_name and st_name != station_name:
                    continue

            is_ack = False
            if alert.payload and isinstance(alert.payload, dict):
                is_ack = bool(alert.payload.get("acknowledged", False))

            is_res = alert.resolved_at is not None

            results.append(
                AlertOut(
                    id=alert.id,
                    alert_type=alert.alert_type.value if hasattr(alert.alert_type, "value") else str(alert.alert_type),
                    severity=alert.severity.value if hasattr(alert.severity, "value") else str(alert.severity),
                    title=alert.title,
                    message=alert.message,
                    station_name=st_name,
                    train_id=alert.train_id,
                    created_at=alert.created_at,
                    acknowledged=is_ack,
                    resolved=is_res,
                )
            )
            
        # Include simulated overloaded train alerts
        sim_alerts = self.sim_service.list_alerts(station_name=station_name)
        for sa in sim_alerts:
            if not any(r.id == sa.id or (r.train_id and r.train_id == sa.train_id) for r in results):
                results.append(sa)

        # Priority sorting: CRITICAL / EMERGENCY first, then HIGH, then MEDIUM / LOW
        severity_rank = {
            "critical": 0,
            "emergency": 0,
            "high": 1,
            "platform_congestion": 1,
            "medium": 2,
            "warning": 2,
            "low": 3,
        }

        results.sort(key=lambda a: (
            1 if a.resolved else 0,
            severity_rank.get(a.severity.lower(), 99),
            -a.created_at.timestamp() if a.created_at else 0
        ))

        return results

    async def get_emergency_status(self) -> bool:
        """Check if there are any CRITICAL or EMERGENCY severity alerts active."""
        alerts = await self.list_alerts()
        for alert in alerts:
            if not alert.resolved and alert.severity.lower() in ["critical", "emergency"]:
                return True
        return False

    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Mark an alert as acknowledged by an operator and persist to SQLite."""
        from datetime import datetime
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            if alert_id.startswith("train-") or alert_id.startswith("platform-"):
                self.sim_service.acknowledged_sim_alerts.add(alert_id)
                return True
            return False
        
        meta = dict(alert.payload or {})
        meta["acknowledged"] = True
        meta["acknowledged_at"] = datetime.now().isoformat()
        alert.payload = meta
        await self.db.commit()
        return True

    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert by setting resolved_at to now in SQLite."""
        from datetime import datetime
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            if alert_id.startswith("train-") or alert_id.startswith("platform-"):
                self.sim_service.resolved_sim_alerts.add(alert_id)
                return True
            return False
        
        alert.resolved_at = datetime.now()
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
