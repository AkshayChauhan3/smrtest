from fastapi import APIRouter, HTTPException, Query

from app.schemas.occupancy import StationCrowdOut, TrainOccupancyOut

router = APIRouter()


@router.get("/trains", response_model=list[TrainOccupancyOut])
async def list_train_occupancy(sim_time: str | None = Query(None, description="Simulate time as HH:MM")) -> list[TrainOccupancyOut]:
    from app.services.data_service import data_service
    return data_service.list_train_occupancy(data_service.parse_sim_time(sim_time))


@router.get("/stations", response_model=list[StationCrowdOut])
async def list_station_crowd(sim_time: str | None = Query(None, description="Simulate time as HH:MM")) -> list[StationCrowdOut]:
    from app.services.data_service import data_service
    return data_service.list_station_crowds(data_service.parse_sim_time(sim_time))


@router.get("/trains/{train_id}", response_model=TrainOccupancyOut)
async def get_train_occupancy(train_id: str, sim_time: str | None = Query(None, description="Simulate time as HH:MM")) -> TrainOccupancyOut:
    from app.services.data_service import data_service
    result = data_service.get_train_occupancy(train_id, data_service.parse_sim_time(sim_time))
    if not result:
        raise HTTPException(status_code=404, detail=f"Train '{train_id}' not found.")
    return result


@router.get("/train/{train_id}", response_model=TrainOccupancyOut, include_in_schema=False)
async def get_train_occupancy_compat(train_id: str, sim_time: str | None = Query(None, description="Simulate time as HH:MM")) -> TrainOccupancyOut:
    return await get_train_occupancy(train_id, sim_time)
