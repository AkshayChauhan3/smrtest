from fastapi import APIRouter, Query

from app.schemas.rail import AlertOut

router = APIRouter()


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    station_name: str | None = Query(None),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
) -> list[AlertOut]:
    from app.services.data_service import data_service

    return data_service.list_alerts(data_service.parse_sim_time(sim_time), station_name=station_name)
