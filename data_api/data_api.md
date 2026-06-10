data_api README

Overview

`data_api` is a small FastAPI service that simulates live Ahmedabad Metro data.
It does not read from a real feed or database. Instead, it builds a deterministic
train timetable in memory and computes the current train state from the requested
time.

Core facts

- Total lines modeled: 2
- Total stations modeled: 33
- Total trains modeled: 21
- Station data includes a unique station ID for every stop
- Train data includes a unique train ID for every active service

Network summary

- Blue Line
  - Route: Vastral Gam to Thaltej Gam
  - Stations: 18
  - Trains: 11
- Red Line
  - Route: APMC to Motera Stadium
  - Stations: 15
  - Trains: 10

Train ID format

Train IDs are grouped by line and direction:

- Blue Line UP: `BL-UP-01` to `BL-UP-06`
- Blue Line DOWN: `BL-DO-01` to `BL-DO-05`
- Red Line UP: `RL-UP-01` to `RL-UP-05`
- Red Line DOWN: `RL-DO-01` to `RL-DO-05`

Train inventory

- Blue Line UP
  - `BL-UP-01`
  - `BL-UP-02`
  - `BL-UP-03`
  - `BL-UP-04`
  - `BL-UP-05`
  - `BL-UP-06`
- Blue Line DOWN
  - `BL-DO-01`
  - `BL-DO-02`
  - `BL-DO-03`
  - `BL-DO-04`
  - `BL-DO-05`
- Red Line UP
  - `RL-UP-01`
  - `RL-UP-02`
  - `RL-UP-03`
  - `RL-UP-04`
  - `RL-UP-05`
- Red Line DOWN
  - `RL-DO-01`
  - `RL-DO-02`
  - `RL-DO-03`
  - `RL-DO-04`
  - `RL-DO-05`

Station ID format

Station IDs use the line prefix plus a station number:

- Blue Line: `BL01` to `BL18`
- Red Line: `RL01` to `RL15`

The API is designed for:
- showing all trains on both lines,
- looking up one train or one station,
- testing crowd and peak-hour behavior with simulated time,
- powering a simple admin summary view.

How it works

1. `main.py` exposes the HTTP routes.
2. `metro_engine.py` holds the simulation logic and the station data.
3. When a request comes in, the service:
   - chooses the current time, or the provided `sim_time`,
   - builds or refreshes the train roster for that day,
   - calculates which train is at which station,
   - computes timing fields like arrival, departure, and ETA,
   - estimates passenger occupancy and crowd level.

The output is deterministic for the same train and minute. That means repeated
calls with the same timestamp should return the same state for a given train.

Project structure

- `main.py`
  - FastAPI app
  - CORS enabled for all origins
  - HTTP routes
- `metro_engine.py`
  - station definitions for Blue Line and Red Line
  - timetable generation
  - train state calculation
  - station and train query helpers
  - summary data generation

Lines modeled

- Blue Line
  - Vastral Gam to Thaltej Gam
  - 18 stations
  - 11 trains
- Red Line
  - APMC to Motera Stadium
  - 15 stations
  - 10 trains

The service simulates 21 trains total.

Basic inventory

- Blue Line station IDs:
  - `BL01` Vastral Gam
  - `BL02` Nirant Cross Road
  - `BL03` Vastral
  - `BL04` Rabari Colony
  - `BL05` Amraivadi
  - `BL06` Apparel Park
  - `BL07` Kankaria East
  - `BL08` Kalupur Metro Station
  - `BL09` Ghee Kanta
  - `BL10` Shahpur
  - `BL11` Old High Court
  - `BL12` S P Stadium
  - `BL13` Commerce Six Road
  - `BL14` Gujarat University
  - `BL15` Gurukul Road
  - `BL16` Doordarshan Kendra
  - `BL17` Thaltej
  - `BL18` Thaltej Gam
- Red Line station IDs:
  - `RL01` APMC
  - `RL02` Jivraj Park
  - `RL03` Rajivnagar
  - `RL04` Shreyas
  - `RL05` Paldi
  - `RL06` Gandhigram
  - `RL07` Old High Court
  - `RL08` Usmanpura
  - `RL09` Vijay Nagar
  - `RL10` Vadaj
  - `RL11` Ranip
  - `RL12` Sabarmati Rly Station
  - `RL13` AEC
  - `RL14` Sabarmati
  - `RL15` Motera Stadium

Running the API

From the `data_api` directory:

```bash
uvicorn main:app --reload --port 8000
```

Docs are available at:

```text
http://localhost:8000/docs
```

Core endpoints

- `GET /`
  - API overview and endpoint list
- `GET /trains`
  - returns all live train states
  - supports filters:
    - `line=BL|RL`
    - `direction=UP|DOWN`
    - `status=AT_STATION|IN_TRANSIT|WAITING_AT_TERMINAL`
    - `crowd=EMPTY|MODERATE|CROWDED|VERY_CROWDED`
    - `sim_time=HH:MM`
- `GET /trains/{train_id}`
  - returns one train by ID
  - example: `BL-UP-03`
- `GET /trains/line/{line_code}`
  - returns all trains on one line
  - example: `BL` or `RL`
- `GET /station/{station_name}`
  - returns trains currently at or next to a station
  - partial station matches are supported
- `GET /stations`
  - returns the full station lists for both lines
- `GET /stations/{line_code}`
  - returns stations for one line
- `GET /summary`
  - returns admin-style metrics such as crowd distribution, overloaded trains, and current headway

Time simulation

Most endpoints accept `sim_time=HH:MM`.

Examples:

```text
/trains?sim_time=09:15
/summary?sim_time=18:30
/station/Old%20High%20Court?sim_time=14:00
```

If `sim_time` is omitted, the API uses the real current time.

Simulation rules

- Headway changes by line, weekday/weekend, and peak/off-peak time.
- The timetable starts at 06:20 and runs until the last scheduled departure.
- Trains move through station schedules that include arrival and dwell times.
- Occupancy is based on time of day, route position, and whether a station is busy.
- During station dwell, the model simulates passengers alighting first and boarding later.

Passenger model

Each train has 3 coaches:
- C1: General
- C2: Ladies
- C3: General

Total capacity is 1200 passengers.

The API returns:
- train-level occupancy percentage,
- crowd label,
- per-coach passenger counts,
- an event state:
  - `ALIGHTING`
  - `BOARDING`
  - `IN_TRANSIT`

Important notes

- There is no persistence layer.
- There is no external metro feed.
- The service is meant for simulation, testing, and UI development.
- Station lookup uses partial matching, so you can search with a full or partial station name.

Example response patterns

- A train response includes:
  - train ID
  - line and direction
  - current station
  - previous and next station
  - departure and ETA fields
  - occupancy and coach breakdown
- A station response includes:
  - matching station name
  - number of trains found
  - a sorted list of upcoming trains
- The summary response includes:
  - total trains
  - trains in service
  - current headway per line
  - average occupancy
  - overloaded trains

If you are extending this API

- Add new routes in `main.py`.
- Add new timetable or simulation logic in `metro_engine.py`.
- Keep the engine deterministic if you want repeatable results for the same timestamp.
