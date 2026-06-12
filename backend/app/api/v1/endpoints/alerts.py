from fastapi import APIRouter, Query, Depends

from app.schemas.rail import AlertOut
from app.services.domain.alert_service import AlertService, get_alert_service

router = APIRouter()

@router.get("", response_model=list[AlertOut])
async def list_alerts(
    station_name: str | None = Query(None),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    alert_service: AlertService = Depends(get_alert_service)
) -> list[AlertOut]:
    return await alert_service.list_alerts(station_name=station_name)
