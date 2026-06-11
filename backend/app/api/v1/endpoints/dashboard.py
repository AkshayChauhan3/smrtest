from fastapi import APIRouter, HTTPException, Query

from app.schemas.realtime import DashboardSnapshot

router = APIRouter()


@router.get("/snapshot", response_model=DashboardSnapshot)
async def get_dashboard_snapshot(
    station_name: str = Query("Old High Court"),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
) -> DashboardSnapshot:
    from app.services.data_service import data_service
    now = data_service.parse_sim_time(sim_time)

    incoming = data_service.get_incoming_trains_at_station(station_name, now)
    current = data_service.get_current_trains_at_station(station_name, now)
    crowd_prediction = data_service.get_station_crowd_prediction(station_name, now)

    if not data_service.station_exists(station_name):
        raise HTTPException(status_code=404, detail=f"Station '{station_name}' not found.")

    recommendations = []
    if crowd_prediction.current_station_crowd > 500:
        recommendations.append("Open additional platform flow control gates")
    if crowd_prediction.predicted_15_min > crowd_prediction.current_station_crowd * 1.2:
        recommendations.append("Prepare crowd management staff for rising demand")
    if incoming and incoming[0].eta_minutes <= 3:
        recommendations.append("Incoming train arriving shortly, prepare platforms")

    return DashboardSnapshot(
        station_name=station_name,
        current_trains=current,
        incoming_trains=incoming,
        crowd_prediction=crowd_prediction,
        recommendations=recommendations,
        alerts=data_service.list_alerts(now, station_name=station_name),
    )
