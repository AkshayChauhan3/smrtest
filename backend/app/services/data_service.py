"""Data service adapter between metro_engine simulation and API contracts."""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException

from app.services.metro_engine import (
    BL_DOWN_SCHED,
    BL_UP_SCHED,
    BLUE_LINE_STATIONS,
    COACHES,
    RED_LINE_STATIONS,
    RL_DOWN_SCHED,
    RL_UP_SCHED,
    engine,
)
from app.schemas.rail import (
    LineOut, StationOut, RouteOut, RouteStopOut, CoachOut,
    TrainCatalogueOut, IncomingTrainOut, StationCrowdPredictionOut, AlertOut,
    TrainAtStationOut, TrainCoachOut,
)
from app.schemas.occupancy import CoachOccupancyOut, TrainOccupancyOut, StationCrowdOut


class DataService:
    """Adapter layer: transforms metro_engine simulation into API contract schemas."""

    def __init__(self):
        self.engine = engine
        self.resolved_sim_alerts = set()
        self.acknowledged_sim_alerts = set()
        self._lines_cache = None
        self._stations_cache = None
        self._build_cache()

    def _build_cache(self):
        """Build static catalog data once."""
        # Lines
        self._lines_cache = [
            LineOut(id="BL", name="Blue Line", color="#0066CC", description="Main north-south corridor"),
            LineOut(id="RL", name="Red Line", color="#CC0000", description="East-west connector"),
        ]

        # Stations
        self._stations_cache = []
        for sid, name, _, _ in BLUE_LINE_STATIONS:
            self._stations_cache.append(
                StationOut(id=sid, name=name, code=sid, line_name="Blue Line", is_interchange=name in ["Old High Court", "Kalupur Metro Station"])
            )
        for sid, name, _, _ in RED_LINE_STATIONS:
            self._stations_cache.append(
                StationOut(id=sid, name=name, code=sid, line_name="Red Line", is_interchange=name in ["Old High Court", "Sabarmati Rly Station"])
            )

    def list_lines(self) -> list[LineOut]:
        """Fetch all transit lines."""
        return self._lines_cache

    def list_stations(self) -> list[StationOut]:
        """Fetch all stations."""
        return self._stations_cache

    def list_routes(self) -> list[RouteOut]:
        """Fetch all routes from the simulator timetable."""
        return [
            self._route_from_schedule("BL-UP", "Blue Line", "Vastral Gam", "Thaltej Gam", BL_UP_SCHED),
            self._route_from_schedule("BL-DOWN", "Blue Line", "Thaltej Gam", "Vastral Gam", BL_DOWN_SCHED),
            self._route_from_schedule("RL-UP", "Red Line", "APMC", "Motera Stadium", RL_UP_SCHED),
            self._route_from_schedule("RL-DOWN", "Red Line", "Motera Stadium", "APMC", RL_DOWN_SCHED),
        ]

    def list_trains(self, now: datetime = None) -> list[TrainCatalogueOut]:
        """Fetch all active trains with catalog format."""
        now = now or datetime.now()
        metro_trains = self.engine.all_trains(now)

        result = []
        for mt in metro_trains:
            if mt.get("status") == "NOT_IN_SERVICE":
                continue

            coaches = [
                CoachOut(
                    coach_number=c["id"],
                    coach_type="ladies" if c["type"] == "LADIES" else "standard",
                    capacity=c["capacity"],
                    description=c["name"]
                )
                for c in COACHES
            ]

            result.append(
                TrainCatalogueOut(
                    train_id=mt.get("train_id", ""),
                    train_name=mt.get("display_name") or self._train_name(mt),
                    line_name=self._line_name(mt),
                    direction=self._direction_label(mt.get("direction", "")),
                    current_station=mt.get("current_station", ""),
                    next_station=mt.get("next_station") or "",
                    arrival_time=self._time_to_iso(now, mt.get("arrived_at_station")),
                    departure_time=self._time_to_iso(now, mt.get("departs_station_at")),
                    current_occupancy=mt.get("train_current_passengers", 0),
                    coaches=coaches,
                )
            )

        return result

    def list_train_occupancy(self, now: datetime = None) -> list[TrainOccupancyOut]:
        """Fetch occupancy details for all trains."""
        now = now or datetime.now()
        metro_trains = self.engine.all_trains(now)

        result = []
        for mt in metro_trains:
            if mt.get("status") == "NOT_IN_SERVICE":
                continue

            coaches = []
            metro_coaches = mt.get("coaches", [])

            for i, coach_info in enumerate(metro_coaches):
                coaches.append(CoachOccupancyOut(
                    coach_number=coach_info.get("coach_id", f"C{i+1}"),
                    coach_type=self._coach_type(coach_info),
                    capacity=coach_info.get("capacity", 400),
                    current_passenger_count=coach_info.get("current_passengers", 0),
                    occupancy_percentage=int(round(coach_info.get("occupancy_pct", 0))),
                    occupancy_status=self._crowding_to_status(coach_info.get("crowd_level", "EMPTY")),
                ))

            result.append(
                TrainOccupancyOut(
                    train_id=mt.get("train_id", ""),
                    train_name=mt.get("display_name") or self._train_name(mt),
                    station_name=mt.get("current_station", ""),
                    line_name=self._line_name(mt),
                    direction=self._direction_label(mt.get("direction", "")),
                    current_station_crowd=self._station_crowd(mt.get("current_station", ""), metro_trains),
                    coaches=coaches,
                    updated_at=now,
                )
            )

        return result

    def get_train_occupancy(self, train_id: str, now: datetime = None) -> TrainOccupancyOut | None:
        """Fetch occupancy for a specific train."""
        now = now or datetime.now()
        metro_train = self.engine.query_by_train(train_id, now)

        if not metro_train or "error" in metro_train:
            return None

        coaches = []
        for coach_info in metro_train.get("coaches", []):
            coaches.append(CoachOccupancyOut(
                coach_number=coach_info.get("coach_id", ""),
                coach_type=self._coach_type(coach_info),
                capacity=coach_info.get("capacity", 400),
                current_passenger_count=coach_info.get("current_passengers", 0),
                occupancy_percentage=int(round(coach_info.get("occupancy_pct", 0))),
                occupancy_status=self._crowding_to_status(coach_info.get("crowd_level", "EMPTY")),
            ))

        return TrainOccupancyOut(
            train_id=metro_train.get("train_id", ""),
            train_name=metro_train.get("display_name") or self._train_name(metro_train),
            station_name=metro_train.get("current_station", ""),
            line_name=self._line_name(metro_train),
            direction=self._direction_label(metro_train.get("direction", "")),
            current_station_crowd=self._station_crowd(metro_train.get("current_station", ""), self.engine.all_trains(now)),
            coaches=coaches,
            updated_at=now
        )

    def list_station_crowds(self, now: datetime = None) -> list[StationCrowdOut]:
        """Fetch crowd predictions for all stations."""
        now = now or datetime.now()

        metro_trains = self.engine.all_trains(now)
        station_crowds = {station.name: 0 for station in self._stations_cache}

        for mt in metro_trains:
            if mt.get("status") == "NOT_IN_SERVICE":
                continue
            station = mt.get("current_station", "")
            if station:
                station_crowds[station] = station_crowds.get(station, 0) + mt.get("train_current_passengers", 0)

        result = []
        for station, current in station_crowds.items():
            result.append(StationCrowdOut(
                station_name=station,
                current_station_crowd=current,
                predicted_5_min=int(current * 1.1),
                predicted_15_min=int(current * 1.25),
                predicted_30_min=int(current * 1.4)
            ))

        return result

    def get_incoming_trains_at_station(self, station_name: str, now: datetime = None) -> list[IncomingTrainOut]:
        """Get trains arriving at a station in next 30 minutes."""
        now = now or datetime.now()
        station_query = self.engine.query_by_station(station_name, now)
        if station_query.get("trains_found", 0) == 0 and not self._station_exists(station_name):
            return []

        result = []
        for train in station_query.get("upcoming_trains", []):
            eta_min = train.get("arrives_in_min", 0)

            # Only include if arriving within 30 min
            if eta_min > 30:
                continue

            capacity = train.get("train_capacity", 1200)
            current_pax = train.get("train_current_passengers", 0)
            pred_count = min(capacity, int(current_pax * 1.1))
            pred_pct = int((pred_count / capacity) * 100) if capacity > 0 else 0

            result.append(IncomingTrainOut(
                train_id=train.get("train_id", ""),
                train_name=train.get("display_name") or self._train_name(train),
                line_name=self._line_name(train),
                eta_minutes=int(eta_min),
                route=self._route_label(train, station_name),
                current_occupancy=current_pax,
                predicted_occupancy_at_station=pred_pct,
                predicted_boarding_count=max(0, int(self._crowd_at_station(station_name, now) * 0.08)),
                predicted_deboarding_count=max(0, int(current_pax * 0.06)),
            ))

        return sorted(result, key=lambda x: x.eta_minutes)

    def get_trains_at_station(self, station_name: str, now: datetime = None) -> list[TrainAtStationOut]:
        """Get current and next-arriving trains for a station."""
        now = now or datetime.now()
        station_query = self.engine.query_by_station(station_name, now)
        if station_query.get("trains_found", 0) == 0 and not self._station_exists(station_name):
            return []

        trains = []
        for train in station_query.get("upcoming_trains", []):
            trains.append(
                TrainAtStationOut(
                    train_id=train.get("train_id", ""),
                    train_name=train.get("display_name") or self._train_name(train),
                    line_name=self._line_name(train),
                    direction=self._direction_label(train.get("direction", "")),
                    arrival_time=self._time_to_iso(now, train.get("arrived_at_station")) if train.get("arrives_in_sec") == 0 else self._offset_to_iso(now, train.get("arrives_in_sec", 0)),
                    departure_time=self._time_to_iso(now, train.get("departs_station_at")),
                    current_station=train.get("current_station", ""),
                    next_station=train.get("next_station") or "",
                    coaches=self._train_coaches(train.get("coaches", [])),
                )
            )
        return trains

    def get_all_trains_live(self, now: datetime = None) -> list[TrainAtStationOut]:
        """Get all trains across the network in live format."""
        now = now or datetime.now()
        trains = []
        for train in self.engine.all_trains(now):
            if train.get("status") == "NOT_IN_SERVICE":
                continue
            
            # Use arrived_at_station as arrival_time if AT_STATION, otherwise offset
            eta_sec = train.get("eta_to_next_station_sec", 0)
            if train.get("status") in ("AT_STATION", "WAITING_AT_TERMINAL"):
                arr_time = self._time_to_iso(now, train.get("arrived_at_station"))
            else:
                arr_time = self._offset_to_iso(now, eta_sec)
                
            trains.append(
                TrainAtStationOut(
                    train_id=train.get("train_id", ""),
                    train_name=train.get("display_name") or self._train_name(train),
                    line_name=self._line_name(train),
                    direction=self._direction_label(train.get("direction", "")),
                    arrival_time=arr_time,
                    departure_time=self._time_to_iso(now, train.get("departs_station_at")),
                    current_station=train.get("current_station", ""),
                    next_station=train.get("next_station") or "",
                    coaches=self._train_coaches(train.get("coaches", [])),
                    journey_completed_pct=train.get("journey_completed_pct"),
                    current_position=train.get("current_position")
                )
            )
        return trains

    def get_current_trains_at_station(self, station_name: str, now: datetime = None) -> list[TrainAtStationOut]:
        now = now or datetime.now()
        return [
            train
            for train in self.get_trains_at_station(station_name, now)
            if train.current_station.lower() == station_name.lower()
        ]

    def get_station_crowd_prediction(self, station_name: str, now: datetime = None) -> StationCrowdPredictionOut | None:
        now = now or datetime.now()
        needle = station_name.lower().strip()
        for crowd in self.list_station_crowds(now):
            if needle in crowd.station_name.lower():
                return StationCrowdPredictionOut(
                    current_station_crowd=crowd.current_station_crowd,
                    predicted_5_min=crowd.predicted_5_min,
                    predicted_15_min=crowd.predicted_15_min,
                    predicted_30_min=crowd.predicted_30_min,
                )
        return None

    def list_alerts(self, now: datetime = None, station_name: str | None = None) -> list[AlertOut]:
        now = now or datetime.now()
        alerts = []
        station_filter = station_name.lower() if station_name else None

        for crowd in self.list_station_crowds(now):
            if station_filter and crowd.station_name.lower() != station_filter:
                continue
            if crowd.current_station_crowd >= 600:
                alerts.append(AlertOut(
                    id=f"platform-{self._slug(crowd.station_name)}",
                    alert_type="platform_congestion",
                    severity="high" if crowd.current_station_crowd < 900 else "critical",
                    title="Platform Congestion",
                    message=f"{crowd.station_name} crowd is at {crowd.current_station_crowd} passengers.",
                    station_name=crowd.station_name,
                    train_id=None,
                    created_at=now,
                ))

        for train in self.engine.all_trains(now):
            if train.get("status") == "NOT_IN_SERVICE":
                continue
            if train.get("train_occupancy_pct", 0) >= 85:
                alert_id = f"train-{train.get('train_id', '').lower()}"
                if alert_id in self.resolved_sim_alerts:
                    continue
                alerts.append(AlertOut(
                    id=alert_id,
                    alert_type="prediction_alert",
                    severity="critical",
                    title="Train Capacity Critical",
                    message=f"Train occupancy is {train.get('train_occupancy_pct')}% (exceeds 85% capacity).",
                    station_name=train.get("current_station"),
                    train_id=train.get("train_id"),
                    created_at=now,
                    acknowledged=alert_id in self.acknowledged_sim_alerts
                ))
        return alerts

    def parse_sim_time(self, sim_time: str | None) -> datetime:
        if not sim_time:
            return datetime.now()
        try:
            parsed = datetime.strptime(sim_time, "%H:%M")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid sim_time format. Use HH:MM, for example 09:15.") from exc
        today = datetime.now().date()
        return datetime(today.year, today.month, today.day, parsed.hour, parsed.minute)

    @staticmethod
    def _crowding_to_status(label: str) -> str:
        """Convert metro_engine crowd label to API status."""
        mapping = {
            "EMPTY": "empty",
            "MODERATE": "moderate",
            "CROWDED": "high",
            "VERY_CROWDED": "critical"
        }
        return mapping.get(label, "moderate")

    @staticmethod
    def _route_from_schedule(route_id: str, line_name: str, origin: str, destination: str, schedule: Iterable[dict]) -> RouteOut:
        stops = [
            RouteStopOut(
                station_name=segment["station"]["name"],
                stop_order=index + 1,
                arrival_offset_minutes=round(segment["arrive_offset"] / 60),
                departure_offset_minutes=round(segment["depart_offset"] / 60),
            )
            for index, segment in enumerate(schedule)
        ]
        return RouteOut(id=route_id, line_name=line_name, origin_station=origin, destination_station=destination, stops=stops)

    @staticmethod
    def _line_name(train: dict) -> str:
        return train.get("line") or train.get("line_name") or ""

    @staticmethod
    def _train_name(train: dict) -> str:
        return f"{DataService._line_name(train)} {train.get('direction', '')}".strip()

    @staticmethod
    def _direction_label(direction: str) -> str:
        return {"UP": "Up", "DOWN": "Down"}.get(direction.upper(), direction or "Unknown")

    @staticmethod
    def _coach_type(coach: dict) -> str:
        return "ladies" if coach.get("coach_type") == "LADIES" or coach.get("type") == "LADIES" else "standard"

    def _train_coaches(self, coaches: list[dict]) -> list[TrainCoachOut]:
        return [
            TrainCoachOut(
                coach_number=coach.get("coach_id", ""),
                coach_type=self._coach_type(coach),
                capacity=coach.get("capacity", 400),
                current_passenger_count=coach.get("current_passengers", 0),
                occupancy_percentage=int(round(coach.get("occupancy_pct", 0))),
                occupancy_status=self._crowding_to_status(coach.get("crowd_level", "EMPTY")),
            )
            for coach in coaches
        ]

    @staticmethod
    def _time_to_iso(now: datetime, hhmm: str | None) -> str:
        if not hhmm:
            return now.isoformat()
        hour, minute = [int(part) for part in hhmm.split(":", 1)]
        return datetime(now.year, now.month, now.day, hour, minute).isoformat()

    @staticmethod
    def _offset_to_iso(now: datetime, seconds: int | float) -> str:
        from datetime import timedelta
        return (now + timedelta(seconds=float(seconds))).isoformat()

    @staticmethod
    def _route_label(train: dict, station_name: str) -> str:
        return f"{train.get('terminal_start', '')} -> {station_name} -> {train.get('terminal_end', '')}"

    @staticmethod
    def _station_crowd(station_name: str, trains: list[dict]) -> int:
        return sum(
            train.get("train_current_passengers", 0)
            for train in trains
            if train.get("status") != "NOT_IN_SERVICE" and train.get("current_station", "").lower() == station_name.lower()
        )

    def _crowd_at_station(self, station_name: str, now: datetime) -> int:
        return self._station_crowd(station_name, self.engine.all_trains(now))

    def _station_exists(self, station_name: str) -> bool:
        needle = station_name.lower().strip()
        return any(needle in station.name.lower() for station in self._stations_cache)

    def station_exists(self, station_name: str) -> bool:
        return self._station_exists(station_name)

    @staticmethod
    def _slug(value: str) -> str:
        return value.lower().replace(" ", "-").replace("/", "-")


# Singleton instance
data_service = DataService()
