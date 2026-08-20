from pydantic import BaseModel
from typing import List

class PredictedCoach(BaseModel):
    coach_number: str
    predicted_passenger_count: int
    occupancy_status: str

class TrainOccupancyPredictionRequest(BaseModel):
    train_id: str
    forecast_minutes: int

class TrainOccupancyPredictionOut(BaseModel):
    train_id: str
    forecast_minutes: int
    predicted_total_passengers: int
    confidence_score: float = 0.94
    predicted_coaches: List[PredictedCoach]
