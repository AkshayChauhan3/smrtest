from datetime import datetime, timedelta
from app.services.metro_engine import MetroEngine, get_train_state

def test_train_prep_window_and_not_in_service():
    engine = MetroEngine()
    
    # We choose train BL-UP-01 to test its scheduling transitions
    train = next(t for t in engine._trains if t["train_id"] == "BL-UP-01")
    
    # Let's check its departures
    departures = train["all_departures"]
    slot_idx = train["slot_index"]
    n_trains = train["n_trains"]
    my_departures = departures[slot_idx::n_trains]
    
    assert len(my_departures) > 1
    
    # First departure of the day for BL-UP-01
    first_dep_min = my_departures[0]
    
    # Case A: 5 minutes before the first departure (300 seconds > 180s)
    # The train should be NOT_IN_SERVICE (not teleported yet)
    now_a = datetime(2026, 6, 12, first_dep_min // 60, first_dep_min % 60) - timedelta(minutes=5)
    state_a = get_train_state(train, now_a)
    assert state_a["status"] == "NOT_IN_SERVICE"
    
    # Case B: 2 minutes before the first departure (120 seconds <= 180s)
    # The train should be WAITING_AT_TERMINAL
    now_b = datetime(2026, 6, 12, first_dep_min // 60, first_dep_min % 60) - timedelta(minutes=2)
    state_b = get_train_state(train, now_b)
    assert state_b["status"] == "WAITING_AT_TERMINAL"
    assert state_b["current_station"] == train["terminal_start"]
    
    # Case C: 10 minutes into the journey (running)
    now_c = datetime(2026, 6, 12, first_dep_min // 60, first_dep_min % 60) + timedelta(minutes=10)
    state_c = get_train_state(train, now_c)
    assert state_c["status"] in {"IN_TRANSIT", "AT_STATION"}
    
    # Case D: Just finished trip (e.g. trip_duration + 5 minutes), but next departure is far away (e.g., > 3 minutes away)
    trip_end_dt = datetime(2026, 6, 12, first_dep_min // 60, first_dep_min % 60) + timedelta(seconds=train["trip_duration"])
    now_d = trip_end_dt + timedelta(minutes=5)
    
    # Verify now_d is still before the next departure and > 180 seconds away from it
    next_dep_min = my_departures[1]
    next_dep_dt = datetime(2026, 6, 12, next_dep_min // 60, next_dep_min % 60)
    wait_time_sec = (next_dep_dt - now_d).total_seconds()
    
    if wait_time_sec > 180:
        state_d = get_train_state(train, now_d)
        assert state_d["status"] == "NOT_IN_SERVICE"
        
    # Case E: 2 minutes before the second departure
    now_e = next_dep_dt - timedelta(minutes=2)
    state_e = get_train_state(train, now_e)
    assert state_e["status"] == "WAITING_AT_TERMINAL"
    assert state_e["current_station"] == train["terminal_start"]
