"""Database seeder — populates stations, routes, route_stops, and trains on first run."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.station import Station
from app.models.route import Route, RouteStop
from app.models.train import Train, TrainCoach
from app.services.metro_engine import (
    BLUE_LINE_STATIONS,
    RED_LINE_STATIONS,
    BL_UP_SCHED,
    BL_DOWN_SCHED,
    RL_UP_SCHED,
    RL_DOWN_SCHED,
    COACHES,
)


async def seed_database(db: AsyncSession) -> None:
    """Populate reference tables if they are empty."""
    count = await db.scalar(select(func.count()).select_from(Station))
    if count and count > 0:
        return  # Already seeded

    # ── Stations ──────────────────────────────────
    for idx, (sid, name, km, busy) in enumerate(BLUE_LINE_STATIONS):
        db.add(Station(
            station_id=sid, name=name, line_id="BL",
            is_interchange=(name in ("Old High Court", "Kalupur Metro Station")),
            is_busy=busy, cumulative_km=km, sort_order=idx,
        ))
    for idx, (sid, name, km, busy) in enumerate(RED_LINE_STATIONS):
        if name == "Old High Court":
            continue  # Already added in Blue Line
        db.add(Station(
            station_id=sid, name=name, line_id="RL",
            is_interchange=(name in ("Old High Court", "Sabarmati Rly Station")),
            is_busy=busy, cumulative_km=km, sort_order=idx,
        ))

    # ── Routes & Route Stops ─────────────────────
    route_configs = [
        ("BL-UP", "BL", "UP", "BL01", "BL18", 45, BL_UP_SCHED),
        ("BL-DOWN", "BL", "DOWN", "BL18", "BL01", 43, BL_DOWN_SCHED),
        ("RL-UP", "RL", "UP", "RL01", "RL15", 32, RL_UP_SCHED),
        ("RL-DOWN", "RL", "DOWN", "RL15", "RL01", 31, RL_DOWN_SCHED),
    ]
    for route_id, line_id, direction, origin, dest, runtime, schedule in route_configs:
        db.add(Route(
            route_id=route_id, line_id=line_id, direction=direction,
            origin_station_id=origin, destination_station_id=dest,
            runtime_minutes=runtime,
        ))
        for idx, seg in enumerate(schedule):
            db.add(RouteStop(
                route_id=route_id,
                station_id=seg["station"]["id"],
                stop_order=idx + 1,
                arrival_offset_minutes=round(seg["arrive_offset"] / 60),
                departure_offset_minutes=round(seg["depart_offset"] / 60),
                dwell_minutes=max(1, round((seg["depart_offset"] - seg["arrive_offset"]) / 60)),
            ))

    # ── Trains & Coaches ─────────────────────────
    train_defs = [
        # (prefix, direction, line_id, count)
        ("BL-UP", "UP", "BL", 6),
        ("BL-DO", "DOWN", "BL", 5),
        ("RL-UP", "UP", "RL", 5),
        ("RL-DO", "DOWN", "RL", 5),
    ]
    line_names = {"BL": "Blue Line", "RL": "Red Line"}

    for prefix, direction, line_id, count in train_defs:
        for i in range(count):
            train_id = f"{prefix}-{i + 1:02d}"
            train_name = f"{line_names[line_id]} · {direction}"
            train = Train(
                train_id=train_id,
                train_name=train_name,
                line_id=line_id,
                direction=direction,
                capacity=1200,
                status="ACTIVE",
            )
            db.add(train)

            # Attach coaches
            for coach in COACHES:
                db.add(TrainCoach(
                    train_id=train_id,
                    coach_number=coach["id"],
                    coach_type=coach["type"],
                    capacity=coach["capacity"],
                ))

    await db.commit()
