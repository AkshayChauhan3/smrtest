from fastapi import APIRouter

from app.schemas.rail import TrainAtStationOut, TrainCoachOut

router = APIRouter()

trains_at_station = [
    TrainAtStationOut(
        train_id="BL-UP-001",
        train_name="Blue Line Express",
        line_name="Blue Line",
        direction="Eastbound",
        arrival_time="10:05 AM",
        departure_time="10:08 AM",
        current_station="Old High Court Station",
        next_station="Ashram Road",
        coaches=[
            TrainCoachOut(coach_number="1", coach_type="general", capacity=100, current_passenger_count=95, occupancy_percentage=95, occupancy_status="red"),
            TrainCoachOut(coach_number="2", coach_type="ladies", capacity=100, current_passenger_count=60, occupancy_percentage=60, occupancy_status="yellow"),
            TrainCoachOut(coach_number="3", coach_type="general", capacity=100, current_passenger_count=25, occupancy_percentage=25, occupancy_status="green"),
        ],
    )
]


@router.get("/at-station", response_model=list[TrainAtStationOut])
async def list_trains_at_station() -> list[TrainAtStationOut]:
    return trains_at_station
