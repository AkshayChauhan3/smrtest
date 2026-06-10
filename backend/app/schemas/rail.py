from datetime import datetime

from pydantic import BaseModel, Field


class StationOut(BaseModel):
    id: str
    name: str
    code: str
    line_name: str
    is_interchange: bool = False


class TrainCoachOut(BaseModel):
    coach_number: str
    coach_type: str
    capacity: int
    current_passenger_count: int
    occupancy_percentage: int
    occupancy_status: str


class TrainAtStationOut(BaseModel):
    train_id: str
    train_name: str
    line_name: str
    direction: str
    arrival_time: str
    departure_time: str
    current_station: str
    next_station: str
    coaches: list[TrainCoachOut]


class IncomingTrainOut(BaseModel):
    train_id: str
    train_name: str
    line_name: str
    eta_minutes: int
    route: str
    current_occupancy: int
    predicted_occupancy_at_station: int
    predicted_boarding_count: int
    predicted_deboarding_count: int


class StationCrowdPredictionOut(BaseModel):
    current_station_crowd: int
    predicted_5_min: int
    predicted_15_min: int
    predicted_30_min: int


class RecommendationOut(BaseModel):
    message: str
    coach_recommended: str | None = None


class AlertOut(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    message: str
    station_name: str | None = None
    train_id: str | None = None
    created_at: datetime
