from datetime import datetime, time

class SimClock:
    def __init__(self):
        self._override: datetime | None = None

    def now(self) -> datetime:
        if self._override is not None:
            # Keep today's date, but override the hour, minute, and second
            today = datetime.now().date()
            return datetime(
                today.year,
                today.month,
                today.day,
                self._override.hour,
                self._override.minute,
                self._override.second,
                self._override.microsecond
            )
        return datetime.now()

    def set_time(self, hhmm: str):
        """Set the simulation time using an HH:MM string."""
        try:
            parsed = datetime.strptime(hhmm, "%H:%M")
        except ValueError as exc:
            raise ValueError("Invalid time format. Use HH:MM, e.g. 18:00") from exc
        
        today = datetime.now()
        self._override = datetime(
            today.year, today.month, today.day, parsed.hour, parsed.minute, 0, 0
        )

    def reset(self):
        """Reset back to wall-clock time."""
        self._override = None

    @property
    def is_overridden(self) -> bool:
        return self._override is not None

    @property
    def override_time(self) -> str | None:
        if self._override:
            return self._override.strftime("%H:%M")
        return None

sim_clock = SimClock()
