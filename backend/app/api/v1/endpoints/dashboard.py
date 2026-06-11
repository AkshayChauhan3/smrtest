from fastapi import APIRouter, Query, Depends

from app.schemas.realtime import DashboardSnapshot
from app.services.domain.dashboard_service import DashboardService, get_dashboard_service

router = APIRouter()

@router.get("/snapshot", response_model=DashboardSnapshot)
async def get_dashboard_snapshot(
    station_name: str = Query("Old High Court"),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
) -> DashboardSnapshot:
    return await dashboard_service.get_dashboard_snapshot(station_name, sim_time)
