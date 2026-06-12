from datetime import datetime
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.rail import AlertOut, IncomingTrainOut, StationCrowdPredictionOut, TrainAtStationOut, KpiHistoryOut, KpiSnapshot
from app.schemas.realtime import DashboardSnapshot
from app.services.domain.dashboard_service import DashboardService, get_dashboard_service
from app.db.session import get_db

router = APIRouter()

@router.get("/snapshot", response_model=DashboardSnapshot)
async def get_dashboard_snapshot(
    station_name: str = Query("Old High Court"),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
) -> DashboardSnapshot:
    return await dashboard_service.get_dashboard_snapshot(station_name, sim_time)


@router.get("/kpi-history", response_model=KpiHistoryOut)
async def get_kpi_history(db: AsyncSession = Depends(get_db)) -> KpiHistoryOut:
    """Return current KPI snapshot plus the same snapshot from ~60 minutes ago."""
    from datetime import timedelta
    from sqlalchemy import select, func
    from app.models.train import OccupancySnapshot
    from app.models.route import StationCrowdSnapshot

    now = datetime.now()
    cutoff_now   = now - timedelta(minutes=2)
    cutoff_h_lo  = now - timedelta(minutes=62)
    cutoff_h_hi  = now - timedelta(minutes=58)

    async def _snap(ts_from: datetime, ts_to: datetime) -> KpiSnapshot | None:
        t_res = await db.execute(
            select(func.count(func.distinct(OccupancySnapshot.train_id)))
            .where(OccupancySnapshot.timestamp.between(ts_from, ts_to))
        )
        active_trains = t_res.scalar() or 0

        p_res = await db.execute(
            select(func.sum(OccupancySnapshot.total_passengers))
            .where(OccupancySnapshot.timestamp.between(ts_from, ts_to))
        )
        pax = int(p_res.scalar() or 0)

        avg_occ = round((pax / max(1, active_trains) / 1200) * 100, 1)

        c_res = await db.execute(
            select(func.sum(StationCrowdSnapshot.current_crowd))
            .where(StationCrowdSnapshot.timestamp.between(ts_from, ts_to))
        )
        crowd = int(c_res.scalar() or 0)

        if active_trains == 0 and pax == 0:
            return None

        return KpiSnapshot(
            active_trains=active_trains,
            passengers_in_transit=pax,
            avg_occupancy_pct=avg_occ,
            total_station_crowd=crowd,
            captured_at=ts_to,
        )

    current  = await _snap(cutoff_now, now)
    hour_ago = await _snap(cutoff_h_lo, cutoff_h_hi)

    if current is None:
        current = KpiSnapshot(
            active_trains=0, passengers_in_transit=0,
            avg_occupancy_pct=0.0, total_station_crowd=0,
            captured_at=now,
        )

    return KpiHistoryOut(current=current, hour_ago=hour_ago)
