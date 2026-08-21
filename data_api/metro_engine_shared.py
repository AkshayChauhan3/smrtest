from datetime import datetime, date, timedelta
import math
import hashlib

# ══════════════════════════════════════════════
#  STATION DEFINITIONS
# ══════════════════════════════════════════════

BLUE_LINE_STATIONS = [
    # (id, name, cumulative_km, busy)
    ("BL01", "Vastral Gam",           0.00, False),
    ("BL02", "Nirant Cross Road",     1.20, False),
    ("BL03", "Vastral",               2.30, False),
    ("BL04", "Rabari Colony",         3.50, False),
    ("BL05", "Amraivadi",             4.70, False),
    ("BL06", "Apparel Park",          6.00, False),
    ("BL07", "Kankaria East",         7.30, False),
    ("BL08", "Kalupur Metro Station", 8.60, True ),
    ("BL09", "Ghee Kanta",            9.70, False),
    ("BL10", "Shahpur",              10.80, False),
    ("BL11", "Old High Court",       11.90, True ),
    ("BL12", "S P Stadium",          13.10, True ),
    ("BL13", "Commerce Six Road",    14.30, False),
    ("BL14", "Gujarat University",   15.60, True ),
    ("BL15", "Gurukul Road",         16.80, False),
    ("BL16", "Doordarshan Kendra",   18.00, False),
    ("BL17", "Thaltej",              19.20, False),
    ("BL18", "Thaltej Gam",          20.40, False),
]

RED_LINE_STATIONS = [
    ("RL01", "APMC",                  0.00, False),
    ("RL02", "Jivraj Park",           1.40, False),
    ("RL03", "Rajivnagar",            2.60, False),
    ("RL04", "Shreyas",               3.80, False),
    ("RL05", "Paldi",                 5.00, False),
    ("RL06", "Gandhigram",            6.30, True ),
    ("RL07", "Old High Court",        7.50, True ),
    ("RL08", "Usmanpura",             8.60, False),
    ("RL09", "Vijay Nagar",           9.70, False),
    ("RL10", "Vadaj",                10.80, False),
    ("RL11", "Ranip",                11.90, False),
    ("RL12", "Sabarmati Rly Station",13.10, True ),
    ("RL13", "AEC",                  14.20, False),
    ("RL14", "Sabarmati",            15.30, False),
    ("RL15", "Motera Stadium",       16.50, True ),
]

# Official run times (seconds)
BLUE_UP_RUNTIME   = 45 * 60 + 19
BLUE_DOWN_RUNTIME = 43 * 60 + 28
RED_UP_RUNTIME    = 32 * 60 +  9
RED_DOWN_RUNTIME  = 31 * 60 + 50

# Dwell times (seconds)
DWELL_NORMAL   = 30
DWELL_BUSY     = 45
DWELL_TERMINAL = 180

# ══════════════════════════════════════════════
#  COACH / BERTH DEFINITIONS
#  3 coaches per Ahmedabad Metro train
# ══════════════════════════════════════════════

COACHES = [
    {"id": "C1", "name": "Coach 1 — General", "type": "GENERAL", "capacity": 400},
    {"id": "C2", "name": "Coach 2 — Ladies",  "type": "LADIES",  "capacity": 400},
    {"id": "C3", "name": "Coach 3 — General", "type": "GENERAL", "capacity": 400},
]
TRAIN_CAPACITY = sum(c["capacity"] for c in COACHES)   # 1200

# Ladies coach historically runs at ~70% of general coach occupancy
LADIES_COACH_FACTOR = 0.70

# ══════════════════════════════════════════════
#  DETERMINISTIC SEED HELPER
#  Ensures same train + same minute → same base
#  occupancy. No random jitter across API calls.
# ══════════════════════════════════════════════

def _seed_float(train_id: str, now: datetime, salt: str = "") -> float:
    """Returns a stable pseudo-random float [0,1) for a given train+5-minute window."""
    bucket = (now.minute // 5) * 5
    key = f"{train_id}:{now.year}{now.month}{now.day}{now.hour}{bucket:02d}:{salt}"
    h   = int(hashlib.md5(key.encode()).hexdigest()[:8], 16)
    return (h % 10000) / 10000.0

# ══════════════════════════════════════════════
#  TIMETABLE FREQUENCY
# ══════════════════════════════════════════════

def get_headway_minutes(line: str, now: datetime) -> int:
    is_weekend = now.weekday() >= 5
    hour       = now.hour + now.minute / 60.0
    is_peak    = (8.0 <= hour < 11.0) or (17.0 <= hour < 20.0)
    if line == "BL":
        if is_weekend: return 12
        if is_peak:    return 9
        return 10
    else:
        if is_weekend: return 12
        if is_peak:    return 10
        return 12

# ══════════════════════════════════════════════
#  TRIP SCHEDULE BUILDER
# ══════════════════════════════════════════════

def build_trip_schedule(stations_raw: list, runtime_sec: int, direction: str):
    ordered = [
        {"id": s[0], "name": s[1], "km": s[2], "busy": s[3]}
        for s in (stations_raw if direction == "UP" else reversed(stations_raw))
    ]
    n = len(ordered)
    total_dwell = sum(
        DWELL_TERMINAL if (i == 0 or i == n-1) else (DWELL_BUSY if st["busy"] else DWELL_NORMAL)
        for i, st in enumerate(ordered)
    )
    total_travel = max(runtime_sec - total_dwell, 1)
    total_dist   = abs(ordered[-1]["km"] - ordered[0]["km"])

    schedule, elapsed = [], 0
    for i, st in enumerate(ordered):
        is_terminal   = (i == 0 or i == n - 1)
        arrive_offset = elapsed
        dwell         = DWELL_TERMINAL if is_terminal else (DWELL_BUSY if st["busy"] else DWELL_NORMAL)
        depart_offset = elapsed + dwell
        elapsed       = depart_offset
        schedule.append({"station": st, "arrive_offset": arrive_offset, "depart_offset": depart_offset})
        if i < n - 1:
            seg_dist   = abs(ordered[i+1]["km"] - st["km"])
            seg_travel = int((seg_dist / total_dist) * total_travel)
            elapsed   += seg_travel

    return schedule, elapsed


BL_UP_SCHED,   BL_UP_DUR   = build_trip_schedule(BLUE_LINE_STATIONS, BLUE_UP_RUNTIME,   "UP")
BL_DOWN_SCHED, BL_DOWN_DUR = build_trip_schedule(BLUE_LINE_STATIONS, BLUE_DOWN_RUNTIME, "DOWN")
RL_UP_SCHED,   RL_UP_DUR   = build_trip_schedule(RED_LINE_STATIONS,  RED_UP_RUNTIME,    "UP")
RL_DOWN_SCHED, RL_DOWN_DUR = build_trip_schedule(RED_LINE_STATIONS,  RED_DOWN_RUNTIME,  "DOWN")

# ══════════════════════════════════════════════
#  TIMETABLE DEPARTURE GENERATOR
# ══════════════════════════════════════════════

def time_to_minutes(h, m): return h * 60 + m
def minutes_to_time(t):
    return f"{(t//60)%24:02d}:{t%60:02d}"

def generate_departures_for_line(line, first_hhmm, last_hhmm, now):
    first_min = time_to_minutes(*first_hhmm)
    last_min  = time_to_minutes(*last_hhmm)
    deps, cur = [], first_min
    while cur <= last_min:
        deps.append(cur)
        dep_dt = datetime(now.year, now.month, now.day, cur//60, cur%60)
        cur   += get_headway_minutes(line, dep_dt)
    return deps

# ══════════════════════════════════════════════
#  TRAIN ROSTER BUILDER
# ══════════════════════════════════════════════

def build_train_roster(now: datetime) -> list:
    bl_up   = generate_departures_for_line("BL", (6,20), (22, 0), now)
    bl_down = generate_departures_for_line("BL", (6,20), (22, 5), now)
    rl_up   = generate_departures_for_line("RL", (6,20), (22, 9), now)
    rl_down = generate_departures_for_line("RL", (6,20), (22, 5), now)

    trains = []
    configs = [
        # (id_prefix, direction, line_name, line_code, t_start, t_end, sched, dur, deps, count)
        ("BL-UP", "UP",   "Blue Line", "BL", "Vastral Gam",    "Thaltej Gam",    BL_UP_SCHED,   BL_UP_DUR,   bl_up,   6),
        ("BL-DO", "DOWN", "Blue Line", "BL", "Thaltej Gam",    "Vastral Gam",    BL_DOWN_SCHED, BL_DOWN_DUR, bl_down, 5),
        ("RL-UP", "UP",   "Red Line",  "RL", "APMC",           "Motera Stadium", RL_UP_SCHED,   RL_UP_DUR,   rl_up,   5),
        ("RL-DO", "DOWN", "Red Line",  "RL", "Motera Stadium", "APMC",           RL_DOWN_SCHED, RL_DOWN_DUR, rl_down, 5),
    ]
    for prefix, direction, line_name, line_code, t_start, t_end, sched, dur, deps, count in configs:
        for i in range(count):
            trains.append({
                "train_id":       f"{prefix}-{i+1:02d}",
                "display_name":   f"{line_name} · {t_end}",
                "line_name":      line_name,
                "line_code":      line_code,
                "direction":      direction,
                "terminal_start": t_start,
                "terminal_end":   t_end,
                "schedule":       sched,
                "trip_duration":  dur,
                "all_departures": deps,
                "slot_index":     i,
                "n_trains":       count,
            })
    return trains

# ══════════════════════════════════════════════
#  OCCUPANCY MODEL — time-of-day base factor
# ══════════════════════════════════════════════

def occupancy_base_factor(now: datetime, train_id: str) -> float:
    """Stable base factor for a given train+minute (no jitter across calls)."""
    h          = now.hour + now.minute / 60.0
    is_weekend = now.weekday() >= 5
    noise      = (_seed_float(train_id, now, "base") - 0.5) * 0.08   # ±4%

    if is_weekend:
        return max(0, min(1, (0.35 if 10 <= h <= 19 else 0.15) + noise))

    if 8.0 <= h < 11.0:
        peak = 1.0 - abs(h - 9.0) / 1.5
        return max(0, min(1, 0.55 + 0.45 * peak + noise))
    if 17.0 <= h < 20.0:
        peak = 1.0 - abs(h - 18.5) / 1.5
        return max(0, min(1, 0.50 + 0.45 * peak + noise))
    if 11.0 <= h < 17.0:
        return max(0, min(1, 0.25 + noise))
    if h < 7.0 or h >= 21.0:
        return max(0, min(1, 0.08 + noise * 0.5))
    return max(0, min(1, 0.20 + noise))


def _crowd_label(pct: float) -> str:
    if pct >= 85: return "VERY_CROWDED"
    if pct >= 60: return "CROWDED"
    if pct >= 35: return "MODERATE"
    return "EMPTY"

# ══════════════════════════════════════════════
#  LIVE PASSENGER SIMULATION
#
#  Key idea: during a station dwell window we
#  simulate passengers alighting then boarding
#  second-by-second so the admin panel sees
#  the count change in real time.
#
#  Dwell window split:
#    First 50% → alighting phase (count drops)
#    Last  50% → boarding phase  (count rises)
#
#  Outside a station (IN_TRANSIT): count is
#  stable at the post-boarding level of the
#  last station.
# ══════════════════════════════════════════════

def compute_coach_passengers(
    train_id:     str,
    station:      dict,
    station_idx:  int,
    total_st:     int,
    direction:    str,
    now:          datetime,
    dwell_sec:    int,
    elapsed_in_dwell: int,   # seconds since arriving at this station (0 if IN_TRANSIT)
    is_in_transit: bool,
    station_dep_dt: datetime = None,
) -> dict:
    """
    Returns per-coach and whole-train passenger counts.

    During a dwell:
      elapsed_in_dwell=0  → just arrived   (alighting starts)
      elapsed_in_dwell=dwell_sec/2 → halfway (alighting done, boarding starts)
      elapsed_in_dwell=dwell_sec   → about to depart (full boarding done)

    IN_TRANSIT: returns frozen post-boarding count from last station.
    """
    now_ref = station_dep_dt if (is_in_transit and station_dep_dt is not None) else now
    base   = occupancy_base_factor(now_ref, train_id)
    pos    = station_idx / max(total_st - 1, 1)

    # Position on route affects how full the train is. Min 0.35 so terminals aren't empty.
    if direction == "UP":
        pos_factor = max(0.35, math.sin(pos * math.pi))
    else:
        pos_factor = max(0.35, math.sin((1 - pos) * math.pi))

    station_boost = 1.25 if station.get("busy") else 1.0
    # Target occupancy = what the train should be at AFTER boarding at this station
    target_occ = max(0.0, min(1.0, base * pos_factor * station_boost))

    is_first = (station_idx == 0)
    is_last  = (station_idx == total_st - 1)

    if is_first:
        pre_alight_count = 0
        post_board_count = int(target_occ * TRAIN_CAPACITY)
    elif is_last:
        prev_pos         = max(0, station_idx - 1) / max(total_st - 1, 1)
        prev_factor      = max(0.35, math.sin(prev_pos * math.pi)) if direction == "UP" else max(0.35, math.sin((1 - prev_pos) * math.pi))
        pre_alight_count = int(base * prev_factor * station_boost * TRAIN_CAPACITY)
        post_board_count = 0
    else:
        prev_pos         = max(0, station_idx - 1) / max(total_st - 1, 1)
        prev_factor      = max(0.35, math.sin(prev_pos * math.pi)) if direction == "UP" else max(0.35, math.sin((1 - prev_pos) * math.pi))
        pre_alight_count = int(base * prev_factor * station_boost * TRAIN_CAPACITY)
        post_board_count = int(target_occ * TRAIN_CAPACITY)

    if is_in_transit:
        # Strictly locked at post-boarding level
        total_pax = post_board_count
        phase     = "IN_TRANSIT"
        progress  = 1.0
    else:
        # Simulate live change during dwell
        half      = max(1, dwell_sec // 2)
        if elapsed_in_dwell <= half:
            # Alighting phase: linear drop from pre_alight → pre_alight * (1 - alight_rate)
            alight_rate = 0.30 if not station.get("busy") else 0.45
            alighted    = int(pre_alight_count * alight_rate * (elapsed_in_dwell / half))
            total_pax   = max(0, pre_alight_count - alighted)
            phase       = "ALIGHTING"
            progress    = elapsed_in_dwell / half
        else:
            # Boarding phase: linear rise from post-alight → post_board_count
            board_progress = (elapsed_in_dwell - half) / max(1, dwell_sec - half)
            post_alight    = int(pre_alight_count * (1 - (0.30 if not station.get("busy") else 0.45)))
            total_pax      = int(post_alight + (post_board_count - post_alight) * board_progress)
            total_pax      = max(0, min(TRAIN_CAPACITY, total_pax))
            phase          = "BOARDING"
            progress       = board_progress

    # Distribute across 3 coaches
    # C2 (Ladies) gets LADIES_COACH_FACTOR fraction; remainder split equally between C1 and C3
    ladies_share  = LADIES_COACH_FACTOR / (2 + LADIES_COACH_FACTOR)
    general_share = 1.0 / (2 + LADIES_COACH_FACTOR)

    raw_c2 = int(total_pax * ladies_share)
    raw_c1 = int(total_pax * general_share)
    raw_c3 = total_pax - raw_c1 - raw_c2   # remainder goes to C3

    coach_pax = [
        max(0, min(COACHES[0]["capacity"], raw_c1)),
        max(0, min(COACHES[1]["capacity"], raw_c2)),
        max(0, min(COACHES[2]["capacity"], raw_c3)),
    ]

    coaches_out = []
    for i, coach in enumerate(COACHES):
        pax = coach_pax[i]
        pct = round((pax / coach["capacity"]) * 100, 1)
        coaches_out.append({
            "coach_id":           coach["id"],
            "coach_name":         coach["name"],
            "coach_type":         coach["type"],
            "capacity":           coach["capacity"],
            "current_passengers": pax,
            "occupancy_pct":      pct,
            "crowd_level":        _crowd_label(pct),
        })

    total_pct = round((total_pax / TRAIN_CAPACITY) * 100, 1)

    return {
        # Train-level
        "train_capacity":            TRAIN_CAPACITY,
        "train_current_passengers":  total_pax,
        "train_occupancy_pct":       total_pct,
        "train_crowd_level":         _crowd_label(total_pct),
        # Live event metadata
        "passenger_event":           phase,       # ALIGHTING | BOARDING | IN_TRANSIT
        "event_progress_pct":        round(progress * 100, 1),
        # Per-coach breakdown
        "coaches":                   coaches_out,
    }

# ══════════════════════════════════════════════
#  CORE STATE CALCULATOR
# ══════════════════════════════════════════════

def get_train_state(train: dict, now: datetime) -> dict:
    now_minutes  = now.hour * 60 + now.minute
    departures   = train["all_departures"]
    slot_idx     = train["slot_index"]
    n_trains     = train["n_trains"]

    my_departures = departures[slot_idx::n_trains]
    if not my_departures:
        return _not_running(train, now)

    # Most recent departure this train made
    active_dep_min = next((d for d in reversed(my_departures) if d <= now_minutes), None)
    if active_dep_min is None:
        first_dep_dt = datetime(now.year, now.month, now.day, my_departures[0]//60, my_departures[0]%60)
        if (first_dep_dt - now).total_seconds() > 180:
            return _not_running(train, now)
        return _waiting_at_terminal(train, now, my_departures[0])

    dep_dt    = datetime(now.year, now.month, now.day, active_dep_min//60, active_dep_min%60)
    elapsed_s = int((now - dep_dt).total_seconds())

    if elapsed_s > train["trip_duration"]:
        future = [d for d in my_departures if d > now_minutes]
        if future:
            next_dep_dt = datetime(now.year, now.month, now.day, future[0]//60, future[0]%60)
            if (next_dep_dt - now).total_seconds() > 180:
                return _not_running(train, now)
            return _waiting_at_terminal(train, now, future[0])
        else:
            return _not_running(train, now)

    schedule = train["schedule"]
    status   = "IN_TRANSIT"
    cur_idx  = 0
    prev_station = next_station = next_station_id = arrived_at = departs_at = None
    eta_sec  = 0
    elapsed_in_dwell = 0
    is_in_transit    = True
    dwell_sec        = DWELL_NORMAL

    # Calculate station positions along the 1-100 scale based on distance
    total_dist = abs(schedule[-1]["station"]["km"] - schedule[0]["station"]["km"])
    if total_dist == 0:
        total_dist = 1.0
    start_km = schedule[0]["station"]["km"]
    station_positions = []
    for seg in schedule:
        rel_dist = abs(seg["station"]["km"] - start_km)
        pos = 1.0 + 99.0 * (rel_dist / total_dist)
        station_positions.append(pos)

    journey_completed_pct = round(min(100.0, max(0.0, (elapsed_s / train["trip_duration"]) * 100.0)), 2)
    current_position = 1.0

    for i, seg in enumerate(schedule):
        if elapsed_s < seg["arrive_offset"]:
            status       = "IN_TRANSIT"
            cur_idx      = max(i - 1, 0)
            # prev_station = the station visited BEFORE cur_idx (the one before the last departed stop)
            prev_station = schedule[cur_idx - 1]["station"]["name"] if cur_idx > 0 else None
            next_station = seg["station"]["name"]
            next_station_id = seg["station"]["id"]
            eta_sec      = seg["arrive_offset"] - elapsed_s
            departs_at   = (dep_dt + timedelta(seconds=seg["depart_offset"])).strftime("%H:%M")
            is_in_transit    = True
            elapsed_in_dwell = 0

            # Interpolate current_position
            pos_start = station_positions[cur_idx]
            pos_end = station_positions[i]
            start_offset = schedule[cur_idx]["depart_offset"]
            end_offset = seg["arrive_offset"]
            segment_dur = end_offset - start_offset
            segment_elapsed = elapsed_s - start_offset
            segment_fraction = min(1.0, max(0.0, segment_elapsed / max(1, segment_dur)))
            current_position = round(pos_start + (pos_end - pos_start) * segment_fraction, 2)
            break
        elif seg["arrive_offset"] <= elapsed_s <= seg["depart_offset"]:
            status       = "AT_STATION"
            cur_idx      = i
            prev_station = schedule[i-1]["station"]["name"] if i > 0 else None
            next_station = schedule[i+1]["station"]["name"] if i < len(schedule)-1 else None
            next_station_id = schedule[i+1]["station"]["id"] if i < len(schedule)-1 else None
            arrived_at   = (dep_dt + timedelta(seconds=seg["arrive_offset"])).strftime("%H:%M")
            departs_at   = (dep_dt + timedelta(seconds=seg["depart_offset"])).strftime("%H:%M")
            # Key fix: seconds REMAINING until this train departs this station
            eta_sec      = max(0, seg["depart_offset"] - elapsed_s)
            is_in_transit    = False
            elapsed_in_dwell = elapsed_s - seg["arrive_offset"]
            dwell_sec        = seg["depart_offset"] - seg["arrive_offset"]

            current_position = round(station_positions[i], 2)
            break
    else:
        # for-else: no segment matched, meaning elapsed_s > last station's depart_offset.
        # The train has completed its trip. Transition to WAITING_AT_TERMINAL for the
        # next departure, or NOT_IN_SERVICE if there is no next departure soon.
        future = [d for d in my_departures if d > now_minutes]
        if future:
            next_dep_dt = datetime(now.year, now.month, now.day, future[0]//60, future[0]%60)
            if (next_dep_dt - now).total_seconds() > 180:
                return _not_running(train, now)
            return _waiting_at_terminal(train, now, future[0])
        else:
            return _not_running(train, now)

    current_station = schedule[cur_idx]["station"]
    station_dep_dt = dep_dt + timedelta(seconds=schedule[cur_idx]["depart_offset"])

    occ = compute_coach_passengers(
        train_id          = train["train_id"],
        station           = current_station,
        station_idx       = cur_idx,
        total_st          = len(schedule),
        direction         = train["direction"],
        now               = now,
        dwell_sec         = dwell_sec,
        elapsed_in_dwell  = elapsed_in_dwell,
        is_in_transit     = is_in_transit,
        station_dep_dt    = station_dep_dt,
    )

    return {
        # Identity
        "train_id":       train["train_id"],
        "display_name":   train["display_name"],
        "line":           train["line_name"],
        "line_code":      train["line_code"],
        "direction":      train["direction"],
        "terminal_start": train["terminal_start"],
        "terminal_end":   train["terminal_end"],
        # Position
        "status":              status,
        "current_station":     current_station["name"],
        "current_station_id":  current_station["id"],
        "previous_station":    prev_station,
        "next_station":        next_station,
        "next_station_id":     next_station_id,
        "journey_completed_pct": journey_completed_pct,
        "current_position":      current_position,
        # Timing
        "departed_terminal_at":    minutes_to_time(active_dep_min),
        "arrived_at_station":      arrived_at,
        "departs_station_at":      departs_at,
        "eta_to_next_station_sec": eta_sec,
        "eta_to_next_station_min": round(eta_sec / 60, 1),
        # Occupancy — train level
        "train_capacity":            occ["train_capacity"],
        "train_current_passengers":  occ["train_current_passengers"],
        "train_occupancy_pct":       occ["train_occupancy_pct"],
        "train_crowd_level":         occ["train_crowd_level"],
        # Live passenger event
        "passenger_event":           occ["passenger_event"],
        "event_progress_pct":        occ["event_progress_pct"],
        # Per-coach breakdown
        "coaches":                   occ["coaches"],
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
    }


def _waiting_at_terminal(train, now, next_dep_min):
    dep_dt   = datetime(now.year, now.month, now.day, next_dep_min//60, next_dep_min%60)
    wait_sec = int((dep_dt - now).total_seconds())
    schedule = train["schedule"]
    occ = compute_coach_passengers(
        train["train_id"], schedule[0]["station"], 0, len(schedule),
        train["direction"], now, DWELL_TERMINAL, 0, False
    )
    return {
        "train_id": train["train_id"], "display_name": train["display_name"],
        "line": train["line_name"], "line_code": train["line_code"],
        "direction": train["direction"],
        "terminal_start": train["terminal_start"], "terminal_end": train["terminal_end"],
        "status": "WAITING_AT_TERMINAL",
        "current_station": train["terminal_start"],
        "current_station_id": schedule[0]["station"]["id"],
        "previous_station": None,
        "next_station": schedule[1]["station"]["name"],
        "next_station_id": schedule[1]["station"]["id"],
        "journey_completed_pct": 0.0,
        "current_position": 1.0,
        "departed_terminal_at": None,
        "arrived_at_station": None,
        "departs_station_at": minutes_to_time(next_dep_min),
        "eta_to_next_station_sec": wait_sec,
        "eta_to_next_station_min": round(wait_sec / 60, 1),
        "train_capacity":           occ["train_capacity"],
        "train_current_passengers": occ["train_current_passengers"],
        "train_occupancy_pct":      occ["train_occupancy_pct"],
        "train_crowd_level":        occ["train_crowd_level"],
        "passenger_event":          occ["passenger_event"],
        "event_progress_pct":       occ["event_progress_pct"],
        "coaches":                  occ["coaches"],
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
    }


def _not_running(train, now):
    return {
        "train_id": train["train_id"], "display_name": train["display_name"],
        "line": train["line_name"], "line_code": train["line_code"],
        "direction": train["direction"],
        "status": "NOT_IN_SERVICE",
        "journey_completed_pct": 0.0,
        "current_position": 0.0,
        "message": "Train not in service (outside 06:20–22:09 window)",
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
    }

# ══════════════════════════════════════════════
#  PUBLIC ENGINE CLASS
# ══════════════════════════════════════════════

class MetroEngine:
    def __init__(self):
        self._date   = date.today()
        self._trains = build_train_roster(datetime.now())

    def _refresh(self, now):
        if now.date() != self._date:
            self._date, self._trains = now.date(), build_train_roster(now)

    def all_trains(self, now=None):
        now = now or datetime.now(); self._refresh(now)
        return [get_train_state(t, now) for t in self._trains]

    def query_by_train(self, train_id: str, now=None):
        now = now or datetime.now(); self._refresh(now)
        tid = train_id.upper()
        for t in self._trains:
            if t["train_id"] == tid:
                return get_train_state(t, now)
        return {"error": f"Train '{train_id}' not found.",
                "valid_ids": [t["train_id"] for t in self._trains]}

    def query_by_station(self, station_name: str, now=None):
        now = now or datetime.now(); self._refresh(now)
        name_lower = station_name.lower().strip()
        results = []
        for t in self._trains:
            s = get_train_state(t, now)
            if s.get("status") == "NOT_IN_SERVICE": continue
            curr = s.get("current_station", "").lower()
            nxt  = (s.get("next_station") or "").lower()
            if name_lower in curr:
                results.append({**s, "arrives_in_sec": 0, "arrives_in_min": 0, "match_type": "AT_STATION"})
            elif name_lower in nxt:
                eta = s.get("eta_to_next_station_sec", 0)
                results.append({**s, "arrives_in_sec": eta, "arrives_in_min": round(eta/60,1), "match_type": "ARRIVING_NEXT"})
        results.sort(key=lambda x: x["arrives_in_sec"])
        return {"station": station_name, "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                "trains_found": len(results), "upcoming_trains": results}

    def summary(self, now=None):
        now = now or datetime.now()
        states  = self.all_trains(now)
        running = [s for s in states if s.get("status") != "NOT_IN_SERVICE"]
        crowd   = {"EMPTY": 0, "MODERATE": 0, "CROWDED": 0, "VERY_CROWDED": 0}
        for s in running:
            crowd[s.get("train_crowd_level", "EMPTY")] += 1
        overloaded = [
            {"train_id": s["train_id"], "line": s["line"],
             "station": s["current_station"],
             "train_occupancy_pct": s["train_occupancy_pct"],
             "coaches": s.get("coaches", [])}
            for s in running if s.get("train_occupancy_pct", 0) >= 85
        ]
        avg = round(sum(s.get("train_occupancy_pct",0) for s in running) / max(len(running),1), 1)
        return {
            "timestamp":             now.strftime("%Y-%m-%d %H:%M:%S"),
            "total_trains":          len(states),
            "trains_in_service":     len(running),
            "current_bl_headway":    f"{get_headway_minutes('BL', now)} min",
            "current_rl_headway":    f"{get_headway_minutes('RL', now)} min",
            "average_occupancy_pct": avg,
            "crowd_distribution":    crowd,
            "overloaded_trains":     overloaded,
            "suggestion": (
                "⚠️ High load — consider reducing headway on overloaded lines"
                if len(overloaded) >= 3 else "✅ All lines operating normally"
            ),
        }

engine = MetroEngine()


# ══════════════════════════════════════════════
#  STATION CURRENT AND FEATURE HELPERS
# ══════════════════════════════════════════════

def get_station_current_state(station_id: str, train_states: list, now: datetime) -> dict:
    """Finds if a train is currently dwelling at the station, matching current time with arrival/departure."""
    for ts in train_states:
        if ts.get("status") == "AT_STATION" and ts.get("current_station_id") == station_id:
            return {
                "train_id": ts["train_id"],
                "current_passenger_count": ts["train_current_passengers"],
                "arrival_time": ts["arrived_at_station"],
                "departure_time": ts["departs_station_at"],
            }
    return {
        "train_id": None,
        "current_passenger_count": 0,
        "arrival_time": None,
        "departure_time": None,
    }


def get_station_feature_predictions(station_id: str, train_objects: list, now: datetime) -> dict | None:
    """
    Scans train schedules to find the closest upcoming train heading towards station_id.
    Computes estimated arrival, departure, passenger counts upon arrival, boarding,
    alighting, and final passenger count after departure.
    """
    now_minutes = now.hour * 60 + now.minute
    candidates = []

    for train in train_objects:
        departures = train["all_departures"]
        slot_idx   = train["slot_index"]
        n_trains   = train["n_trains"]
        my_departures = departures[slot_idx::n_trains]
        if not my_departures:
            continue

        schedule = train["schedule"]
        
        # Find index of the station_id in this train's schedule
        st_idx = next((i for i, seg in enumerate(schedule) if seg["station"]["id"] == station_id), None)
        if st_idx is None:
            continue

        # Look up active departure
        active_dep_min = next((d for d in reversed(my_departures) if d <= now_minutes), None)
        
        # Case 1: Train has active trip running
        if active_dep_min is not None:
            dep_dt = datetime(now.year, now.month, now.day, active_dep_min//60, active_dep_min%60)
            elapsed_s = int((now - dep_dt).total_seconds())
            if elapsed_s <= train["trip_duration"]:
                # Check if this station is in the future
                seg = schedule[st_idx]
                if seg["arrive_offset"] > elapsed_s:
                    arr_dt = dep_dt + timedelta(seconds=seg["arrive_offset"])
                    dep_dt_sched = dep_dt + timedelta(seconds=seg["depart_offset"])
                    candidates.append({
                        "train": train,
                        "arrival_dt": arr_dt,
                        "departure_time": dep_dt_sched.strftime("%H:%M"),
                        "station_idx": st_idx,
                    })

        # Case 2: Train is waiting for a future trip (or has finished its current trip and waiting next)
        future = [d for d in my_departures if d > now_minutes]
        if future:
            next_dep_min = future[0]
            next_dep_dt = datetime(now.year, now.month, now.day, next_dep_min//60, next_dep_min%60)
            seg = schedule[st_idx]
            arr_dt = next_dep_dt + timedelta(seconds=seg["arrive_offset"])
            dep_dt_sched = next_dep_dt + timedelta(seconds=seg["depart_offset"])
            candidates.append({
                "train": train,
                "arrival_dt": arr_dt,
                "departure_time": dep_dt_sched.strftime("%H:%M"),
                "station_idx": st_idx,
            })

    if not candidates:
        return None

    # Sort candidates by arrival time (ascending) to find the closest one
    candidates.sort(key=lambda x: x["arrival_dt"])
    best = candidates[0]
    
    train = best["train"]
    station_idx = best["station_idx"]
    arrival_dt = best["arrival_dt"]
    departure_time_str = best["departure_time"]
    
    # Calculate estimations for this train at this station
    base = occupancy_base_factor(arrival_dt, train["train_id"])
    schedule = train["schedule"]
    station = schedule[station_idx]["station"]
    
    is_first = (station_idx == 0)
    is_last = (station_idx == len(schedule) - 1)
    
    if is_first or is_last:
        pre_alight_count = 0
        post_board_count = 0
    else:
        # Pre-arrival passengers = post-boarding count at previous station
        prev_idx = station_idx - 1
        prev_pos = prev_idx / max(len(schedule) - 1, 1)
        prev_factor = math.sin(prev_pos * math.pi) if train["direction"] == "UP" else math.sin((1 - prev_pos) * math.pi)
        prev_station_boost = 1.25 if schedule[prev_idx]["station"].get("busy") else 1.0
        pre_alight_count = int(base * prev_factor * prev_station_boost * TRAIN_CAPACITY)
        
        # Target post-boarding passengers at S
        pos = station_idx / max(len(schedule) - 1, 1)
        pos_factor = math.sin(pos * math.pi) if train["direction"] == "UP" else math.sin((1 - pos) * math.pi)
        station_boost = 1.25 if station.get("busy") else 1.0
        post_board_count = int(base * pos_factor * station_boost * TRAIN_CAPACITY)
        
    alight_rate = 0.30 if not station.get("busy") else 0.45
    alighted = int(pre_alight_count * alight_rate)
    boarded = max(0, post_board_count - (pre_alight_count - alighted))
    
    return {
        "train_id": train["train_id"],
        "estimated_arrival_time": arrival_dt.strftime("%H:%M"),
        "estimated_departure_time": departure_time_str,
        "estimated_passenger_incoming": pre_alight_count,
        "estimated_alighting": alighted,
        "estimated_boarding": boarded,
        "estimated_station_passenger_count": post_board_count,
    }
