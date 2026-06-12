from fastapi import APIRouter, Depends, HTTPException
from typing import Any

from app.schemas.predictions import TrainOccupancyPredictionRequest, TrainOccupancyPredictionOut
from app.services.engine.prediction_service import PredictionService, get_prediction_service
from app.services.domain.occupancy_service import OccupancyService, get_occupancy_service

router = APIRouter()

@router.post("/occupancy", response_model=TrainOccupancyPredictionOut)
async def predict_train_occupancy(
    request: TrainOccupancyPredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service),
    occupancy_service: OccupancyService = Depends(get_occupancy_service)
) -> Any:
    """Get occupancy forecasts for a specific train in the future."""
    
    # 1. Fetch current train occupancy from DB or simulation
    train_occupancy = await occupancy_service.get_train_occupancy(request.train_id)
    if not train_occupancy:
        raise HTTPException(status_code=404, detail=f"Train '{request.train_id}' not found or has no active occupancy data.")
        
    # Sum the passengers across all coaches to get total train passengers
    current_passengers = sum(c.current_passenger_count for c in train_occupancy.coaches)
    
    # 2. Generate Prediction
    prediction = await prediction_service.get_train_occupancy_prediction(
        train_id=request.train_id,
        current_passengers=current_passengers,
        forecast_minutes=request.forecast_minutes
    )
    
    return prediction
