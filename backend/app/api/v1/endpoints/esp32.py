"""
ESP32 live sensor ingestion endpoint.

The Python serial bridge on the laptop posts here every time the
occupancy count changes.  The payload is intentionally minimal:

    POST /api/v1/ingestion/esp32
    {
        "station_id": "BL01",   // optional – null means "show at ALL stations"
        "occupancy": 24,
        "coach_capacity": 400   // optional, defaults to 400
    }

The handler writes to the global esp32_state singleton.  The simulation
runner (simulation_runner.py) reads from it on every tick and injects
the ESP32_DEMO row into every station_*_current table that the mobile
app queries.
"""

from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from app.core.esp32_state import esp32

router = APIRouter()


class Esp32SensorPayload(BaseModel):
    occupancy: int = Field(..., ge=0, description="Current passenger count from sensor")
    station_id: Optional[str] = Field(
        None,
        description="Station to attach the dummy train to. "
                    "Pass null/omit to show at ALL stations simultaneously.",
    )
    coach_capacity: int = Field(400, gt=0, description="Coach capacity for % calculation")


class Esp32SensorResponse(BaseModel):
    status: str
    occupancy: int
    occupancy_pct: float
    station_id: Optional[str]
    last_updated: datetime


@router.post("/esp32", response_model=Esp32SensorResponse)
async def ingest_esp32(payload: Esp32SensorPayload):
    """
    Receive live passenger occupancy from the ESP32 serial bridge.
    Updates the global esp32_state store; the simulation runner will
    propagate the data into all station_*_current tables on its next tick.
    """
    esp32.occupancy = payload.occupancy
    esp32.coach_capacity = payload.coach_capacity
    esp32.target_station_id = payload.station_id
    esp32.last_updated = datetime.now()
    esp32.is_active = True

    return Esp32SensorResponse(
        status="accepted",
        occupancy=esp32.occupancy,
        occupancy_pct=esp32.occupancy_pct,
        station_id=esp32.target_station_id,
        last_updated=esp32.last_updated,
    )


@router.get("/esp32/status", response_model=Esp32SensorResponse)
async def get_esp32_status():
    """Returns the latest ESP32 sensor reading stored in memory."""
    return Esp32SensorResponse(
        status="active" if esp32.is_active else "no_data",
        occupancy=esp32.occupancy,
        occupancy_pct=esp32.occupancy_pct,
        station_id=esp32.target_station_id,
        last_updated=esp32.last_updated,
    )
