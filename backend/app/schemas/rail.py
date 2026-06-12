from datetime import datetime

from pydantic import BaseModel, Field


class StationOut(BaseModel):
    id: str
    name: str
    code: str
    line_name: str
    is_interchange: bool = False

class LineOut(BaseModel):
    id: str
    name: str
    color: str
    description: str | None = None

class RouteStopOut(BaseModel):
    station_name: str
    stop_order: int
    arrival_offset_minutes: int
    departure_offset_minutes: int

class RouteOut(BaseModel):
    id: str
    line_name: str
    origin_station: str
    destination_station: str
    stops: list[RouteStopOut]

class CoachOut(BaseModel):
    coach_number: str
    coach_type: str
    capacity: int
    description: str | None = None

class TrainCatalogueOut(BaseModel):
    train_id: str
    train_name: str
    line_name: str
    direction: str
    current_station: str
    next_station: str
    arrival_time: str
    departure_time: str
    current_occupancy: int
    coaches: list[CoachOut]
    journey_completed_pct: float | None = None
    current_position: float | None = None


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
    journey_completed_pct: float | None = None
    current_position: float | None = None


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


class ActionExecuteRequest(BaseModel):
    action_id: str
    action_type: str = "recommendation"
    payload: dict | None = None

class AnnouncementCreate(BaseModel):
    text: str
    context_info: str

class AnnouncementOut(BaseModel):
    id: str
    text: str
    context: str
    is_active: bool
    created_at: datetime


class SavedRouteCreate(BaseModel):
    lineId: str
    fromStationId: str
    toStationId: str
    label: str


class SavedRouteOut(BaseModel):
    id: int
    lineId: str
    fromStationId: str
    toStationId: str
    label: str


class CoachStateOut(BaseModel):
    coach_id: str
    coach_type: str
    capacity: int
    current_passengers: int
    occupancy_pct: float


class StationCurrentStateResponse(BaseModel):
    train_id: str | None = None
    current_passenger_count: int | None = None
    arrival_time: str | None = None
    departure_time: str | None = None
    coaches: list[CoachStateOut] = []
    status: str = "none"  # "at_platform", "just_departed", "arriving", "none"
    eta_seconds: int | None = None


class CoachEstimationStateOut(BaseModel):
    coach_id: str
    coach_type: str
    capacity: int
    arrival_passengers: int
    arrival_occupancy_pct: float
    departure_passengers: int
    departure_occupancy_pct: float
    confidence_score: float | None = None
    risk_level: str | None = None


class StationFeatureStateResponse(BaseModel):
    train_id: str | None = None
    estimated_arrival_time: str | None = None
    estimated_departure_time: str | None = None
    estimated_passenger_incoming: int | None = None
    estimated_alighting: int | None = None
    estimated_boarding: int | None = None
    estimated_station_passenger_count: int | None = None
    coaches: list[CoachEstimationStateOut] = []
