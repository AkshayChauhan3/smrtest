from fastapi import APIRouter, HTTPException, Query, Depends

from app.schemas.occupancy import StationCrowdOut, TrainOccupancyOut
from app.services.domain.occupancy_service import OccupancyService, get_occupancy_service

router = APIRouter()

@router.get("/trains", response_model=list[TrainOccupancyOut])
async def list_train_occupancy(
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
    occupancy_service: OccupancyService = Depends(get_occupancy_service)
) -> list[TrainOccupancyOut]:
    return await occupancy_service.get_all_train_occupancy()

@router.get("/stations", response_model=list[StationCrowdOut])
async def list_station_crowd(
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
    occupancy_service: OccupancyService = Depends(get_occupancy_service)
) -> list[StationCrowdOut]:
    return await occupancy_service.get_station_crowds()

@router.get("/trains/{train_id}", response_model=TrainOccupancyOut)
async def get_train_occupancy(
    train_id: str, 
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
    occupancy_service: OccupancyService = Depends(get_occupancy_service)
) -> TrainOccupancyOut:
    result = await occupancy_service.get_train_occupancy(train_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Train '{train_id}' not found.")
    return result

@router.get("/train/{train_id}", response_model=TrainOccupancyOut, include_in_schema=False)
async def get_train_occupancy_compat(
    train_id: str, 
    sim_time: str | None = Query(None, description="Simulate time as HH:MM"),
    occupancy_service: OccupancyService = Depends(get_occupancy_service)
) -> TrainOccupancyOut:
    return await get_train_occupancy(train_id, sim_time, occupancy_service)
