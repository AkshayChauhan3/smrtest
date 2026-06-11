from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.rail import AlertOut, IncomingTrainOut, StationCrowdPredictionOut, TrainAtStationOut
from app.schemas.realtime import DashboardSnapshot

router = APIRouter()

snapshot = DashboardSnapshot(
    station_name="Old High Court Station",
    current_trains=[],
    incoming_trains=[
        IncomingTrainOut(
            train_id="BL-DN-002",
            train_name="Blue Line Local",
            line_name="Blue Line",
            eta_minutes=4,
            route="Thaltej Gam -> Old High Court Station -> Vastral Gam",
            current_occupancy=72,
            predicted_occupancy_at_station=88,
            predicted_boarding_count=34,
            predicted_deboarding_count=18,
        )
    ],
    crowd_prediction=StationCrowdPredictionOut(current_station_crowd=65, predicted_5_min=70, predicted_15_min=81, predicted_30_min=90),
    recommendations=["Redirect passengers toward Coach 3", "Announce next train arrival"],
    alerts=[
        AlertOut(id="alt_001", alert_type="platform_congestion", severity="high", title="Platform congestion risk", message="Crowd is increasing on the interchange platform.", station_name="Old High Court Station", train_id=None, created_at=datetime.now(timezone.utc)),
    ],
)


@router.get("/snapshot", response_model=DashboardSnapshot)
async def get_dashboard_snapshot() -> DashboardSnapshot:
    return snapshot
