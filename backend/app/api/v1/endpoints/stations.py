from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.rail import StationOut, StationCurrentStateResponse, StationFeatureStateResponse
from app.services.domain.train_service import TrainService, get_train_service

router = APIRouter()


@router.get("", response_model=list[StationOut])
async def list_stations(train_service: TrainService = Depends(get_train_service)) -> list[StationOut]:
    return await train_service.get_stations()


@router.get("/{station_id}/current", response_model=StationCurrentStateResponse)
async def get_station_current_state(
    station_id: str,
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    train_service: TrainService = Depends(get_train_service)
) -> StationCurrentStateResponse:
    res = await train_service.get_station_current_state(station_id, sim_time)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return res


@router.get("/{station_id}/feature", response_model=list[StationFeatureStateResponse])
async def get_station_feature_predictions(
    station_id: str,
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    train_service: TrainService = Depends(get_train_service)
) -> list[StationFeatureStateResponse]:
    res = await train_service.get_station_feature_predictions(station_id, sim_time)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return res
