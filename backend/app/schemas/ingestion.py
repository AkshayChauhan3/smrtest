from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CoachData(BaseModel):
    coach_id: str = Field(..., description="The ID of the coach, e.g., 'C1'")
    passenger_count: int = Field(..., description="Number of passengers currently in the coach")
    occupancy_percentage: float = Field(..., description="Percentage of coach capacity filled")

class SensorEvent(BaseModel):
    timestamp: datetime = Field(..., description="Time the event was recorded")
    train_id: str = Field(..., description="ID of the train")
    station_id: Optional[str] = Field(None, description="ID of the station if applicable")
    event_type: str = Field(..., description="Type of event: 'occupancy_update', 'train_arrival', etc.")
    coaches: List[CoachData] = Field(default_factory=list, description="List of coach occupancy data")
    delay_minutes: Optional[int] = Field(0, description="Delay in minutes, if any")

class IngestionResponse(BaseModel):
    status: str
    processed_events: int
