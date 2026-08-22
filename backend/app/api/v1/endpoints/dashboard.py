from datetime import datetime
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.rail import AlertOut, IncomingTrainOut, StationCrowdPredictionOut, TrainAtStationOut, KpiHistoryOut, KpiSnapshot
from app.schemas.realtime import DashboardSnapshot
from app.services.domain.dashboard_service import DashboardService, get_dashboard_service
from app.db.session import get_db

router = APIRouter()

def _extract_status(t) -> str:
    if hasattr(t, "status"):
        return str(t.status or "")
    if isinstance(t, dict):
        return str(t.get("status", "") or "")
    return ""

def _extract_pax(t) -> int:
    if hasattr(t, "coaches") and t.coaches:
        return sum(getattr(c, "current_passenger_count", 0) for c in t.coaches)
    if isinstance(t, dict):
        return t.get("train_current_passengers", 0)
    return 0


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
    from app.core.sim_clock import sim_clock
    from app.services.data_service import data_service

    now = sim_clock.now()
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
        live_trains = data_service.get_all_trains_live(now)
        active_t = [t for t in live_trains if _extract_status(t) not in ("NOT_IN_SERVICE", "WAITING_AT_TERMINAL")]
        n_active = len(active_t)
        total_pax = sum(_extract_pax(t) for t in active_t)
        avg_occ = round((total_pax / max(1, n_active) / 1200) * 100, 1) if n_active > 0 else 0.0
        
        station_crowds = data_service.list_station_crowds(now)
        total_crowd = sum(c.current_station_crowd for c in station_crowds)
        
        current = KpiSnapshot(
            active_trains=n_active,
            passengers_in_transit=total_pax,
            avg_occupancy_pct=avg_occ,
            total_station_crowd=total_crowd,
            captured_at=now,
        )

    if hour_ago is None and current is not None:
        h_ago_dt = now - timedelta(minutes=60)
        h_trains = data_service.get_all_trains_live(h_ago_dt)
        h_active_t = [t for t in h_trains if _extract_status(t) not in ("NOT_IN_SERVICE", "WAITING_AT_TERMINAL")]
        h_n_active = len(h_active_t)
        h_total_pax = sum(_extract_pax(t) for t in h_active_t)
        h_avg_occ = round((h_total_pax / max(1, h_n_active) / 1200) * 100, 1) if h_n_active > 0 else 0.0
        h_crowds = data_service.list_station_crowds(h_ago_dt)
        h_total_crowd = sum(c.current_station_crowd for c in h_crowds)
        hour_ago = KpiSnapshot(
            active_trains=h_n_active,
            passengers_in_transit=h_total_pax,
            avg_occupancy_pct=h_avg_occ,
            total_station_crowd=h_total_crowd,
            captured_at=h_ago_dt,
        )

    return KpiHistoryOut(current=current, hour_ago=hour_ago)
