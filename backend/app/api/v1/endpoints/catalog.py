from fastapi import APIRouter, Query, Depends

from app.schemas.rail import LineOut, RouteOut, StationOut, TrainCatalogueOut
from app.services.domain.train_service import TrainService, get_train_service

router = APIRouter()

@router.get("/lines", response_model=list[LineOut])
async def list_lines(train_service: TrainService = Depends(get_train_service)) -> list[LineOut]:
    return await train_service.get_lines()

@router.get("/stations", response_model=list[StationOut])
async def list_stations(train_service: TrainService = Depends(get_train_service)) -> list[StationOut]:
    return await train_service.get_stations()

@router.get("/routes", response_model=list[RouteOut])
async def list_routes(train_service: TrainService = Depends(get_train_service)) -> list[RouteOut]:
    return await train_service.get_routes()

@router.get("/trains", response_model=list[TrainCatalogueOut])
async def list_trains(
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    train_service: TrainService = Depends(get_train_service)
) -> list[TrainCatalogueOut]:
    # Pass sim_time correctly if supported, but for now train_service gets live/DB trains
    return await train_service.get_trains()
