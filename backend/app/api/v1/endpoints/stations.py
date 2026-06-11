from fastapi import APIRouter

from app.schemas.rail import StationOut

router = APIRouter()

stations = [
    StationOut(id="sta_ohc", name="Old High Court Station", code="OHC", line_name="Blue Line", is_interchange=True),
    StationOut(id="sta_ash", name="Ashram Road", code="ASH", line_name="Blue Line"),
    StationOut(id="sta_town", name="Town Hall", code="TH", line_name="Red Line"),
]


@router.get("", response_model=list[StationOut])
async def list_stations() -> list[StationOut]:
    return stations
