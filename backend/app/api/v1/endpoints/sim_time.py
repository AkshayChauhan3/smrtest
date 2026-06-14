from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.sim_clock import sim_clock

router = APIRouter()


class SimTimePayload(BaseModel):
    time: str = Field(..., description="Time override string in HH:MM format, e.g. 18:00")


class SimTimeResponse(BaseModel):
    status: str
    is_overridden: bool
    override_time: Optional[str]
    system_time: str
    last_updated: datetime


@router.post("", response_model=SimTimeResponse)
async def set_sim_time(payload: SimTimePayload):
    """
    Override the system simulation time globally.
    Expects time in HH:MM format, e.g., "18:00".
    """
    try:
        sim_clock.set_time(payload.time)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    
    return SimTimeResponse(
        status="time overridden",
        is_overridden=sim_clock.is_overridden,
        override_time=sim_clock.override_time,
        system_time=sim_clock.now().strftime("%Y-%m-%d %H:%M:%S"),
        last_updated=datetime.now(),
    )


@router.get("", response_model=SimTimeResponse)
async def get_sim_time():
    """
    Get the current simulation clock status and time.
    """
    return SimTimeResponse(
        status="active" if sim_clock.is_overridden else "real_time",
        is_overridden=sim_clock.is_overridden,
        override_time=sim_clock.override_time,
        system_time=sim_clock.now().strftime("%Y-%m-%d %H:%M:%S"),
        last_updated=datetime.now(),
    )


@router.delete("", response_model=SimTimeResponse)
async def reset_sim_time():
    """
    Reset simulation clock back to real wall-clock time.
    """
    sim_clock.reset()
    return SimTimeResponse(
        status="reset to real time",
        is_overridden=sim_clock.is_overridden,
        override_time=sim_clock.override_time,
        system_time=sim_clock.now().strftime("%Y-%m-%d %H:%M:%S"),
        last_updated=datetime.now(),
    )
