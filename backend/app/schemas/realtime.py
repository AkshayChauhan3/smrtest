from pydantic import BaseModel

from app.schemas.rail import AlertOut, IncomingTrainOut, StationCrowdPredictionOut, TrainAtStationOut


class DashboardSnapshot(BaseModel):
    station_name: str
    current_trains: list[TrainAtStationOut]
    incoming_trains: list[IncomingTrainOut]
    crowd_prediction: StationCrowdPredictionOut
    recommendations: list[str]
    alerts: list[AlertOut]


class WebSocketEvent(BaseModel):
    event_type: str
    payload: dict
