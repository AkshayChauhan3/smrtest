import logging
from datetime import datetime
import httpx
from fastapi import Depends

from app.schemas.rail import StationCrowdPredictionOut
from app.schemas.predictions import TrainOccupancyPredictionOut, PredictedCoach

logger = logging.getLogger(__name__)

class PredictionService:
    """Predicts train and station occupancies based on baseline heuristics."""

    async def get_station_crowd_prediction(self, current_crowd: int, now: datetime = None) -> StationCrowdPredictionOut:
        """Returns predictions for 5, 15, and 30 minutes in the future by calling ML service."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.post("http://localhost:5000/predict/station", json={
                    "current_crowd": current_crowd
                })
                res.raise_for_status()
                data = res.json()
                return StationCrowdPredictionOut(**data)
        except httpx.HTTPError:
            # Fallback mock for MVP when ML service is offline
            now = now or datetime.now()
            hour = now.hour
            multiplier = 1.2 if (8 <= hour <= 10) or (17 <= hour <= 19) else 0.9
            return StationCrowdPredictionOut(
                current_station_crowd=current_crowd,
                predicted_5_min=int(current_crowd * (1 + 0.05 * multiplier)),
                predicted_15_min=int(current_crowd * (1 + 0.15 * multiplier)),
                predicted_30_min=int(current_crowd * (1 + 0.25 * multiplier)),
                predicted_60_min=int(current_crowd * (1 + 0.40 * multiplier)),
            )

    async def get_train_occupancy_prediction(self, train_id: str, current_passengers: int, forecast_minutes: int, now: datetime = None) -> TrainOccupancyPredictionOut:
        """Forecasts occupancy for a train X minutes into the future by calling ML service."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.post("http://localhost:5000/predict/train", json={
                    "train_id": train_id,
                    "current_passengers": current_passengers,
                    "forecast_minutes": forecast_minutes
                })
                res.raise_for_status()
                data = res.json()
                return TrainOccupancyPredictionOut(**data)
        except httpx.HTTPError:
            # Fallback mock for MVP when ML service is offline
            now = now or datetime.now()
            hour = now.hour
            multiplier = 1.2 if (8 <= hour <= 10) or (17 <= hour <= 19) else 0.9
            
            # Predict realistic train flows.
            # Use a capacity-based baseline floor so empty/new trains still get a
            # non-zero prediction (the ML service is offline so this fallback always fires).
            _COACH_CAP = 400
            _TOTAL_CAP = _COACH_CAP * 3  # 1200
            base_estimate = max(int(_TOTAL_CAP * 0.20), current_passengers)  # floor: 20% capacity
            predicted_total = int(base_estimate * multiplier)
            
            c2_passengers = int(predicted_total * 0.25)
            c1_passengers = int((predicted_total - c2_passengers) / 2)
            c3_passengers = predicted_total - c2_passengers - c1_passengers
            def status(count, cap=400): return "high" if count/cap > 0.85 else "moderate" if count/cap > 0.5 else "low"
            
            return TrainOccupancyPredictionOut(
                train_id=train_id,
                forecast_minutes=forecast_minutes,
                predicted_total_passengers=predicted_total,
                predicted_coaches=[
                    PredictedCoach(coach_number="C1", predicted_passenger_count=c1_passengers, occupancy_status=status(c1_passengers)),
                    PredictedCoach(coach_number="C2", predicted_passenger_count=c2_passengers, occupancy_status=status(c2_passengers)),
                    PredictedCoach(coach_number="C3", predicted_passenger_count=c3_passengers, occupancy_status=status(c3_passengers)),
                ]
            )

def get_prediction_service() -> PredictionService:
    return PredictionService()
