from fastapi import APIRouter, HTTPException, Query

from app.schemas.rail import TrainAtStationOut

router = APIRouter()


@router.get("/at-station", response_model=list[TrainAtStationOut])
async def list_trains_at_station(
    station_name: str = Query("Old High Court"),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
) -> list[TrainAtStationOut]:
    from app.services.data_service import data_service

    trains = data_service.get_trains_at_station(station_name, data_service.parse_sim_time(sim_time))
    if not trains and not data_service.station_exists(station_name):
        raise HTTPException(status_code=404, detail=f"Station '{station_name}' not found.")
    return trains
