"""
Global in-process store for ESP32 live sensor state.

The serial bridge POSTs occupancy updates here via:
    POST /api/v1/ingestion/esp32

Every simulation tick reads from this store and injects the ESP32 dummy
train row into ALL station_*_current tables so the mobile app can see
live sensor data regardless of which station the user opens.
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Esp32State:
    """Single shared object holding the latest ESP32 sensor reading."""

    # Current occupancy count (raw from ESP32)
    occupancy: int = 0

    # Coach capacity for occupancy % calculation
    coach_capacity: int = 400

    # Which station the mobile will primarily see it at.
    # If None → broadcast to ALL stations.
    target_station_id: str | None = None

    # Last update timestamp
    last_updated: datetime = field(default_factory=datetime.now)

    # Whether we have received at least one reading
    is_active: bool = False

    # Per-station occupancy overrides
    per_station_occupancy: dict[str, int] = field(default_factory=dict)

    @property
    def occupancy_pct(self) -> float:
        return round((self.occupancy / self.coach_capacity) * 100, 1)

    def get_station_occupancy(self, station_id: str) -> int:
        if self.target_station_id is not None:
            return self.per_station_occupancy.get(station_id, 0)
        return self.occupancy

    def get_station_occupancy_pct(self, station_id: str) -> float:
        occ = self.get_station_occupancy(station_id)
        return round((occ / self.coach_capacity) * 100, 1)


# Module-level singleton — imported everywhere
esp32 = Esp32State()

