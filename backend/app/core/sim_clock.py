from datetime import datetime, timedelta


class SimClock:
    def __init__(self):
        self._sim_start: datetime | None = None   # desired sim time when override was set
        self._real_start: datetime | None = None  # real wall-clock time when override was set

    def now(self) -> datetime:
        if self._sim_start is not None and self._real_start is not None:
            # Advance the sim time by however much real time has elapsed since the override was set.
            # e.g. set to 09:00 at real 02:20 → at real 02:25 returns 09:05
            elapsed = datetime.now() - self._real_start
            return self._sim_start + elapsed
        return datetime.now()

    def set_time(self, hhmm: str):
        """Set the simulation clock to start from HH:MM and advance with real time."""
        try:
            parsed = datetime.strptime(hhmm, "%H:%M")
        except ValueError as exc:
            raise ValueError("Invalid time format. Use HH:MM, e.g. 18:00") from exc

        real_now = datetime.now()
        self._sim_start = datetime(
            real_now.year, real_now.month, real_now.day,
            parsed.hour, parsed.minute, 0, 0
        )
        self._real_start = real_now

    def reset(self):
        """Reset back to wall-clock time."""
        self._sim_start = None
        self._real_start = None

    @property
    def is_overridden(self) -> bool:
        return self._sim_start is not None

    @property
    def override_time(self) -> str | None:
        """Returns the current sim time as HH:MM (advances over time)."""
        if self._sim_start is not None:
            return self.now().strftime("%H:%M")
        return None

sim_clock = SimClock()
