from datetime import datetime

class SimClock:
    def now(self) -> datetime:
        return datetime.now()

sim_clock = SimClock()
