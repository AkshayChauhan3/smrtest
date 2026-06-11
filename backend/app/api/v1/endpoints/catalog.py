from fastapi import APIRouter, Query

from app.schemas.rail import CoachOut, LineOut, RouteOut, RouteStopOut, StationOut, TrainCatalogueOut

router = APIRouter()

# Shared master-data seed for the MVP.
lines = [
    LineOut(id="line_blue", name="Blue Line", color="#2563EB", description="Ahmedabad Metro Blue Line"),
    LineOut(id="line_red", name="Red Line", color="#DC2626", description="Ahmedabad Metro Red Line"),
]

stations = [
    StationOut(id="sta_ohc", name="Old High Court Station", code="OHC", line_name="Blue Line", is_interchange=True),
    StationOut(id="sta_thaltej", name="Thaltej Gam", code="THG", line_name="Blue Line"),
    StationOut(id="sta_vastral", name="Vastral Gam", code="VSG", line_name="Blue Line"),
    StationOut(id="sta_town_hall", name="Town Hall", code="TWH", line_name="Red Line"),
    StationOut(id="sta_motera", name="Motera Stadium", code="MOT", line_name="Red Line"),
]

routes = [
    RouteOut(
        id="route_blue_1",
        line_name="Blue Line",
        origin_station="Thaltej Gam",
        destination_station="Vastral Gam",
        stops=[
            RouteStopOut(station_name="Thaltej Gam", stop_order=1, arrival_offset_minutes=0, departure_offset_minutes=2),
            RouteStopOut(station_name="Old High Court Station", stop_order=2, arrival_offset_minutes=10, departure_offset_minutes=12),
            RouteStopOut(station_name="Vastral Gam", stop_order=3, arrival_offset_minutes=24, departure_offset_minutes=26),
        ],
    ),
    RouteOut(
        id="route_red_1",
        line_name="Red Line",
        origin_station="Motera Stadium",
        destination_station="Town Hall",
        stops=[
            RouteStopOut(station_name="Motera Stadium", stop_order=1, arrival_offset_minutes=0, departure_offset_minutes=2),
            RouteStopOut(station_name="Old High Court Station", stop_order=2, arrival_offset_minutes=14, departure_offset_minutes=16),
            RouteStopOut(station_name="Town Hall", stop_order=3, arrival_offset_minutes=29, departure_offset_minutes=31),
        ],
    ),
]

trains = [
    TrainCatalogueOut(
        train_id="BL-UP-001",
        train_name="Blue Line Express",
        line_name="Blue Line",
        direction="Eastbound",
        current_station="Old High Court Station",
        next_station="Ashram Road",
        arrival_time="10:05 AM",
        departure_time="10:08 AM",
        current_occupancy=72,
        coaches=[
            CoachOut(coach_number="1", coach_type="general", capacity=100, description="High occupancy coach"),
            CoachOut(coach_number="2", coach_type="ladies", capacity=100, description="Reserved coach"),
            CoachOut(coach_number="3", coach_type="general", capacity=100, description="Best current availability"),
        ],
    ),
    TrainCatalogueOut(
        train_id="RD-DN-014",
        train_name="Red Line Shuttle",
        line_name="Red Line",
        direction="Northbound",
        current_station="Town Hall",
        next_station="Old High Court Station",
        arrival_time="10:18 AM",
        departure_time="10:21 AM",
        current_occupancy=58,
        coaches=[
            CoachOut(coach_number="1", coach_type="general", capacity=100, description="General coach"),
            CoachOut(coach_number="2", coach_type="ladies", capacity=100, description="Reserved coach"),
            CoachOut(coach_number="3", coach_type="general", capacity=100, description="Low crowd coach"),
        ],
    ),
]


@router.get("/lines", response_model=list[LineOut])
async def list_lines() -> list[LineOut]:
    from app.services.data_service import data_service
    return data_service.list_lines()


@router.get("/stations", response_model=list[StationOut])
async def list_stations() -> list[StationOut]:
    from app.services.data_service import data_service
    return data_service.list_stations()


@router.get("/routes", response_model=list[RouteOut])
async def list_routes() -> list[RouteOut]:
    from app.services.data_service import data_service
    return data_service.list_routes()


@router.get("/trains", response_model=list[TrainCatalogueOut])
async def list_trains(sim_time: str | None = Query(None, description="Simulate time as HH:MM")) -> list[TrainCatalogueOut]:
    from app.services.data_service import data_service
    return data_service.list_trains(data_service.parse_sim_time(sim_time))
