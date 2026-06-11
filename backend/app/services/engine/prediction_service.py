import logging
from datetime import datetime
from fastapi import Depends

from app.schemas.rail import StationCrowdPredictionOut
from app.schemas.predictions import TrainOccupancyPredictionOut, PredictedCoach

logger = logging.getLogger(__name__)

class PredictionService:
    """Predicts train and station occupancies based on baseline heuristics."""

    def get_station_crowd_prediction(self, current_crowd: int, now: datetime = None) -> StationCrowdPredictionOut:
        """Returns predictions for 5, 15, and 30 minutes in the future."""
        now = now or datetime.utcnow()
        hour = now.hour
        
        # Rush hour multiplier (8-10 AM, 5-7 PM)
        is_rush_hour = (8 <= hour <= 10) or (17 <= hour <= 19)
        multiplier = 1.2 if is_rush_hour else 0.9
        
        # Simple heuristic growth
        return StationCrowdPredictionOut(
            current_station_crowd=current_crowd,
            predicted_5_min=int(current_crowd * (1 + 0.05 * multiplier)),
            predicted_15_min=int(current_crowd * (1 + 0.15 * multiplier)),
            predicted_30_min=int(current_crowd * (1 + 0.25 * multiplier)),
        )

    def get_train_occupancy_prediction(self, train_id: str, current_passengers: int, forecast_minutes: int, now: datetime = None) -> TrainOccupancyPredictionOut:
        """Forecasts occupancy for a train X minutes into the future."""
        now = now or datetime.utcnow()
        hour = now.hour
        
        is_rush_hour = (8 <= hour <= 10) or (17 <= hour <= 19)
        trend = 1.1 if is_rush_hour else 0.85
        
        # Scale growth based on forecast duration
        growth_factor = 1 + ((forecast_minutes / 30.0) * (trend - 1))
        
        predicted_total = int(current_passengers * growth_factor)
        # Cap at total capacity (approx 1200)
        predicted_total = min(1200, max(0, predicted_total))
        
        # Distribute into coaches (C1, C2 (Ladies), C3)
        # Ladies coach usually 25% of total
        c2_passengers = int(predicted_total * 0.25)
        c1_passengers = int((predicted_total - c2_passengers) / 2)
        c3_passengers = predicted_total - c2_passengers - c1_passengers
        
        def status(count, cap=400):
            pct = count / cap
            if pct > 0.85: return "high"
            if pct > 0.5: return "moderate"
            return "low"
            
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
