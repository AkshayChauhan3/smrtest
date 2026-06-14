# SmartRail OS

> **Real-time metro operations intelligence platform for Ahmedabad GMRC Phase-1.**
>
> SmartRail OS combines a physics-based train simulation engine, per-coach occupancy tracking, live ESP32 sensor integration, and predictive crowd analytics — all served over a unified REST + WebSocket API to a web dashboard and Flutter mobile app.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Components](#components)
  - [Backend — FastAPI](#backend--fastapi)
  - [Web Dashboard — TanStack Start + React](#web-dashboard--tanstack-start--react)
  - [Mobile App — Flutter](#mobile-app--flutter)
  - [ESP32 Passenger Counter](#esp32-passenger-counter)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Web Dashboard Setup](#web-dashboard-setup)
  - [Flutter App Setup](#flutter-app-setup)
  - [ESP32 Firmware Setup](#esp32-firmware-setup)
  - [ESP32 Serial Bridge](#esp32-serial-bridge)
- [Simulation Clock](#simulation-clock)
- [Configuration Reference](#configuration-reference)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Overview

SmartRail OS is a full-stack IoT + AI platform for real-time metro management:

| Layer | Technology | Role |
|---|---|---|
| IoT Hardware | ESP32 + HC-SR04 Ultrasonic Sensors | Physical passenger counting at coach doors |
| Serial Bridge | Python `pyserial` | Relays ESP32 serial output → backend REST API |
| Backend | Python 3.12 + FastAPI + SQLAlchemy (async) | Core API, simulation engine, persistence |
| Database | SQLite (`aiosqlite`) | Lightweight embedded DB; per-station snapshot tables |
| Web Dashboard | React 19 + TanStack Start + Vite | Operator control panel with live charts |
| Mobile App | Flutter 3.x (Dart) | Passenger-facing app with live train data |
| Simulation | `metro_engine_shared.py` | Deterministic timetable-driven train physics |

**Lines simulated:** Ahmedabad Metro GMRC Phase-1
- 🔵 **Blue Line** — Vastral Gam ↔ Thaltej Gam (18 stations, BL01–BL18)
- 🔴 **Red Line** — APMC ↔ Motera Stadium (15 stations, RL01–RL15)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SmartRail OS — Architecture                      │
└─────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐     Serial (USB)      ┌──────────────────┐
 │   ESP32 MCU  │ ───────────────────►  │  serial_bridge.py │
 │  HC-SR04 ×2  │   Occupancy count     │  (Python bridge)  │
 └──────────────┘                       └────────┬─────────┘
                                                  │ HTTP POST /api/v1/ingestion/esp32
                                                  ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                       FastAPI Backend (Python)                        │
 │                                                                      │
 │  ┌─────────────────┐     ┌──────────────────┐    ┌───────────────┐  │
 │  │  Metro Engine   │────►│ Simulation Runner │───►│   SQLite DB   │  │
 │  │ (timetable sim) │     │  (background task)│    │ (aiosqlite)   │  │
 │  └─────────────────┘     └──────────────────┘    └───────────────┘  │
 │                                                                      │
 │  ┌─────────────────────────────────────────────────────────────┐    │
 │  │  REST API  /api/v1/                                         │    │
 │  │   /catalog   /stations  /trains  /occupancy  /predictions   │    │
 │  │   /alerts    /dashboard  /ingestion  /esp32  /ws            │    │
 │  └─────────────────────────────────────────────────────────────┘    │
 └──────────────────────────────┬───────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
  ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
  │  Web Dashboard│     │  Flutter App │      │  Wall Display │
  │ (TanStack +  │     │  (Riverpod + │      │  /wall route  │
  │    React 19) │     │   go_router) │      │  (full-screen)│
  └──────────────┘     └──────────────┘      └──────────────┘
```

---

## Project Structure

```
SmartRail-OS/
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # App entry point, lifespan, CORS
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py       # Root API router (aggregates all endpoints)
│   │   │       └── endpoints/      # One file per resource group
│   │   │           ├── alerts.py
│   │   │           ├── announcements.py
│   │   │           ├── auth.py
│   │   │           ├── catalog.py
│   │   │           ├── dashboard.py
│   │   │           ├── esp32.py    # ESP32 sensor ingestion endpoint
│   │   │           ├── ingestion.py
│   │   │           ├── occupancy.py
│   │   │           ├── predictions.py
│   │   │           ├── sim_time.py # Simulation clock control
│   │   │           ├── stations.py
│   │   │           ├── trains.py
│   │   │           ├── users.py
│   │   │           └── ws.py       # WebSocket broadcast
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings (reads .env)
│   │   │   ├── esp32_state.py      # Global singleton for live ESP32 data
│   │   │   ├── security.py         # JWT helpers
│   │   │   ├── sim_clock.py        # Overridable simulation clock
│   │   │   ├── station_mapping.py  # Station ID ↔ Name lookups
│   │   │   └── websockets.py       # WS connection manager
│   │   ├── db/
│   │   │   ├── session.py          # SQLAlchemy async session factory
│   │   │   └── seeder.py           # Initial data seed (stations, trains, coaches)
│   │   ├── models/
│   │   │   ├── alert.py
│   │   │   ├── announcement.py
│   │   │   ├── base.py             # DeclarativeBase
│   │   │   ├── estimation.py       # ML estimation results
│   │   │   ├── prediction.py
│   │   │   ├── route.py            # Route, RouteStop, StationCrowdSnapshot
│   │   │   ├── saved_route.py
│   │   │   ├── station.py          # Station + 66 per-station snapshot tables
│   │   │   ├── train.py            # Train, TrainCoach, OccupancySnapshot
│   │   │   └── user.py
│   │   ├── repositories/
│   │   │   └── base.py             # Generic CRUD repos (Station, Train, Alert…)
│   │   ├── schemas/                # Pydantic I/O schemas
│   │   │   ├── ingestion.py        # SensorEvent, CoachData
│   │   │   ├── occupancy.py
│   │   │   ├── predictions.py
│   │   │   └── rail.py             # LineOut, StationOut, TrainCatalogueOut…
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── data_service.py     # Adapter: MetroEngine → API schemas
│   │       ├── ingestion_service.py
│   │       ├── metro_engine.py     # Engine instance + timetable constants
│   │       ├── domain/
│   │       │   ├── estimation_service.py  # ML load estimator
│   │       │   └── occupancy_service.py
│   │       └── engine/
│   │           ├── alert_engine.py
│   │           ├── prediction_service.py  # Heuristic + ML prediction facade
│   │           └── simulation_runner.py   # Main background tick (5 s interval)
│   ├── scripts/
│   │   └── stream_simulation.py    # Replay CSV events into ingestion API
│   ├── sql/                        # Raw SQL migration files (if any)
│   ├── tests/                      # pytest test suite
│   ├── alembic/                    # Alembic migration env
│   ├── alembic.ini
│   ├── init_db.py                  # Drop + recreate + seed (dev only)
│   ├── requirements.txt
│   └── .env.example
│
├── smartrailos_web/                # Web dashboard (TanStack Start + React 19)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── dashboard.index.tsx       # Overview / KPI cards
│   │   │   ├── dashboard.live-trains.tsx # Live map with train positions
│   │   │   ├── dashboard.crowd.tsx       # Station crowd heatmap
│   │   │   ├── dashboard.predictions.tsx # Crowd + coach predictions
│   │   │   ├── dashboard.digital-twin.tsx# Digital twin visualiser
│   │   │   ├── dashboard.alerts.tsx      # Active alerts management
│   │   │   ├── dashboard.analytics.tsx   # Historical trends
│   │   │   ├── dashboard.announcements.tsx
│   │   │   ├── dashboard.incoming.tsx    # Incoming trains at a station
│   │   │   ├── dashboard.stations.$stationId.tsx  # Per-station detail
│   │   │   └── wall.tsx                  # Full-screen public display board
│   │   ├── components/             # shadcn/ui + custom components
│   │   ├── hooks/                  # Custom React hooks (data fetching)
│   │   ├── lib/                    # API client, utils
│   │   └── styles.css              # Global Tailwind + custom CSS
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── smartrailos_app/                # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart                # MaterialApp + Riverpod + go_router
│   │   ├── core/                   # API client, theme, constants
│   │   └── features/
│   │       ├── auth/               # Login screen + auth state
│   │       ├── trains/             # Train list, coach occupancy screens
│   │       └── profile/            # User profile
│   └── pubspec.yaml
│
├── esp32-test/                     # ESP32 firmware (PlatformIO)
│   ├── src/
│   │   └── main.cpp                # HC-SR04 dual-sensor passenger counter
│   ├── serial_bridge.py            # Python bridge: ESP32 serial → backend API
│   └── platformio.ini
│
├── metro_engine_shared.py          # Physics engine (timetable, occupancy, coaches)
├── passenger_estimation/           # ML model training notebooks
├── data_api/                       # Legacy standalone data API
└── integration.md                  # Integration notes
```

---

## Components

### Backend — FastAPI

The backend is a fully async Python application using:

- **FastAPI 0.115** with lifespan context manager for startup/shutdown
- **SQLAlchemy 2 (async)** with `aiosqlite` for the SQLite database
- **Pydantic v2** for request/response validation
- **python-jose** + **passlib** for JWT authentication
- **WebSockets** for real-time client push

**Key design decisions:**

1. **Simulation Runner** (`simulation_runner.py`) — an `asyncio` background task that ticks every **5 seconds**, queries `metro_engine_shared.py` for every train state, then writes to the database. This is the heartbeat of the whole system.

2. **Per-station snapshot tables** — instead of querying a huge time-series table on every API call, each station has two dedicated micro-tables (`station_BL01_current`, `station_BL01_feature`, …). Each tick, these are `DELETE + INSERT` to keep exactly one row — the current and upcoming train state. This makes station-level reads O(1).

3. **ESP32 State Store** (`esp32_state.py`) — a module-level singleton (`esp32 = Esp32State()`). When the serial bridge POSTs a reading, the singleton updates. Every simulation tick reads this singleton and optionally injects an `ESP32_DEMO` row into the relevant station tables.

4. **DataService** (`data_service.py`) — pure adapter layer; transforms engine simulation dicts into Pydantic API schemas. No database I/O — reads directly from the in-memory engine.

5. **SimClock** (`sim_clock.py`) — allows the frontend to override the wall-clock time for testing any time of day without waiting. Exposes `GET/POST /api/v1/sim/time`.

---

### Web Dashboard — TanStack Start + React

A TanStack Start (SSR-capable Vite) React 19 application with:

- **TanStack Router** — file-based routing under `src/routes/`
- **TanStack Query** — data fetching with caching and background refetch
- **shadcn/ui** (Radix primitives + Tailwind CSS v4) — component library
- **Recharts** — occupancy and analytics charts
- **Lucide React** — icon set

**Key pages:**

| Route | Description |
|---|---|
| `/` | Redirect to dashboard |
| `/dashboard` | KPI overview: active trains, crowded stations, alerts |
| `/dashboard/live-trains` | Live train positions across both lines |
| `/dashboard/crowd` | Station crowd heatmap with 5/15/30 min predictions |
| `/dashboard/digital-twin` | Digital twin visualiser |
| `/dashboard/predictions` | Per-train and per-station crowd forecasts |
| `/dashboard/alerts` | Active system alerts; acknowledge / resolve |
| `/dashboard/analytics` | Historical occupancy trends |
| `/dashboard/announcements` | System announcements management |
| `/dashboard/incoming` | Incoming trains at a selected station |
| `/dashboard/stations/:stationId` | Per-station drill-down: current train, coach loads, upcoming |
| `/wall` | Public full-screen display board |

---

### Mobile App — Flutter

A Flutter 3.x app targeting Android, iOS, and Web:

- **Riverpod 2** for state management
- **go_router 13** for declarative navigation
- **google_fonts** + **flutter_animate** for polished UI
- **percent_indicator** for occupancy gauges
- **http** package for API calls

**Screens:**
- Auth: login / registration
- Train list: live trains with per-coach occupancy bars
- Profile: user settings

---

### ESP32 Passenger Counter

The ESP32 firmware (`esp32-test/src/main.cpp`) implements a **directional dual-sensor passenger counter** using two HC-SR04 ultrasonic sensors mounted at a coach door:

```
Door opening:    [Sensor 1] ←── person ──► [Sensor 2]
```

**State machine:**

```
IDLE
 ├─ Sensor 1 triggers first → SENSOR1_FIRST → Sensor 2 → PASSENGER IN  → WAIT_CLEAR
 └─ Sensor 2 triggers first → SENSOR2_FIRST → Sensor 1 → PASSENGER OUT → WAIT_CLEAR
```

| Parameter | Value | Description |
|---|---|---|
| `TRIG1 / ECHO1` | GPIO 4 / 14 | First sensor (entry side) |
| `TRIG2 / ECHO2` | GPIO 27 / 33 | Second sensor (exit side) |
| `THRESHOLD` | 20 cm | Detection distance |
| `TIMEOUT` | 2 000 ms | Max time to complete a crossing |
| `COOLDOWN` | 1 000 ms | Min time between consecutive counts |
| Baud rate | 115 200 | Serial communication speed |

**Serial output format:**
```
PASSENGER IN
Occupancy: 42

PASSENGER OUT
Occupancy: 41
```

The Python **serial bridge** (`esp32-test/serial_bridge.py`) reads this output and POSTs to the backend:

```
POST /api/v1/ingestion/esp32
{
  "occupancy": 42,
  "station_id": "BL05",   // optional — null = broadcast to ALL stations
  "coach_capacity": 400
}
```

---

## Data Flow

```
[Metro Engine timetable]
        │  every 5 s
        ▼
[simulation_runner.run_simulation_step()]
        │
        ├─► Update Train rows (status, position, coach passengers)
        ├─► Write OccupancySnapshot rows (time-series, pruned to 24 h)
        ├─► Write StationCrowdSnapshot rows (time-series, pruned to 24 h)
        ├─► DELETE + INSERT station_{id}_current  (1 row per station)
        ├─► DELETE + INSERT station_{id}_feature  (upcoming predictions)
        ├─► Inject ESP32_DEMO row if esp32.is_active
        ├─► Run ML estimation (thread executor)
        └─► Broadcast WS event to connected clients

[REST API clients]  ──► read latest rows from DB or directly from DataService
[WebSocket clients] ◄── push on every simulation tick
```

---

## Database Schema

### Core tables (ORM)

| Table | Key columns | Description |
|---|---|---|
| `stations` | `station_id PK`, `name`, `line_id`, `is_interchange` | Station master data |
| `trains` | `train_id PK`, `line_id`, `direction`, `current_station_id`, `status` | Train master + live position |
| `train_coaches` | `id PK`, `train_id FK`, `coach_number`, `coach_type`, `capacity` | Coach catalogue |
| `occupancy_snapshots` | `id PK`, `train_id FK`, `station_id`, `timestamp`, `total_passengers`, `coach_data JSON` | Historical occupancy (rolling 24 h) |
| `routes` | `id PK`, `line_id`, `direction` | Route master |
| `route_stops` | `id PK`, `route_id FK`, `station_id FK`, `stop_order` | Ordered stops |
| `station_crowd_snapshots` | `id PK`, `station_id FK`, `timestamp`, `current_crowd`, `predicted_*` | Station crowd history |
| `alerts` | `id PK`, `alert_type`, `severity`, `status`, `train_id`, `station_id` | Operational alerts |
| `announcements` | `id PK`, `title`, `body`, `severity`, `expires_at` | Public announcements |
| `estimations` | `id PK`, `train_id`, `station_id`, `created_at`, ML output columns | ML estimation results |
| `users` | `id PK`, `username`, `email`, `hashed_password`, `role` | User accounts |
| `saved_routes` | `id PK`, `user_id FK`, `origin_station_id`, `dest_station_id` | User saved routes |

### Per-station snapshot tables (Core API — 66 tables)

Each of the 33 stations generates two auto-managed Core API tables at import time:

**`station_{id}_current`** — always exactly 1 row:

| Column | Type | Description |
|---|---|---|
| `train_id` | String | Which train |
| `train_status` | String | `at_platform` / `just_departed` / `arriving` / `none` |
| `eta_seconds` | Integer | Seconds until arrival (0 = at platform) |
| `arrival_time` | String HH:MM | Scheduled arrival |
| `departure_time` | String HH:MM | Scheduled departure |
| `total_passengers` | Integer | All coaches combined |
| `c1_passengers` / `c1_pct` | Integer / Float | Coach 1 (General) |
| `c2_passengers` / `c2_pct` | Integer / Float | Coach 2 (Ladies) |
| `c3_passengers` / `c3_pct` | Integer / Float | Coach 3 (General) |
| `timestamp` | DateTime | Last updated |

**`station_{id}_feature`** — upcoming train prediction rows:

| Column | Type | Description |
|---|---|---|
| `train_id` | String | Upcoming train |
| `estimated_arrival_time` | String HH:MM | Timetable arrival |
| `estimated_departure_time` | String HH:MM | Timetable departure |
| `arr_c1_passengers` / `arr_c1_pct` | Integer / Float | Coach load **at arrival** |
| `dep_c1_passengers` / `dep_c1_pct` | Integer / Float | Coach load **after boarding/alighting** |
| *(same for c2, c3, totals)* | | |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Health
```
GET /health
→ { "status": "ok", "service": "SmartRail OS" }
```

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Catalog
```
GET /api/v1/catalog/lines         → all transit lines
GET /api/v1/catalog/stations      → all stations
GET /api/v1/catalog/routes        → all routes with stop lists
GET /api/v1/catalog/trains        → all train configs with coaches
```

### Trains
```
GET /api/v1/trains/live           → all active trains (current + next station, ETA)
GET /api/v1/trains/{train_id}
```

### Stations
```
GET /api/v1/stations/{station_id}/current    → current train + coach occupancy
GET /api/v1/stations/{station_id}/feature    → upcoming train predictions
GET /api/v1/stations/{station_id}/incoming   → trains arriving in next 30 min
```

### Occupancy
```
GET /api/v1/occupancy/trains              → occupancy for all trains
GET /api/v1/occupancy/trains/{train_id}   → occupancy for one train
GET /api/v1/occupancy/stations            → crowd at all stations
```

### Dashboard
```
GET /api/v1/dashboard/overview    → KPI snapshot (trains active, crowds, alerts)
GET /api/v1/dashboard/crowd       → station crowd data for heatmap
```

### Predictions
```
GET /api/v1/predictions/station/{name}?forecast_minutes=15
GET /api/v1/predictions/train/{train_id}?forecast_minutes=15
```

### Alerts
```
GET  /api/v1/alerts
POST /api/v1/alerts/{id}/acknowledge
POST /api/v1/alerts/{id}/resolve
```

### Announcements
```
GET  /api/v1/announcements
POST /api/v1/announcements
```

### Ingestion (internal / ESP32)
```
POST /api/v1/ingestion/events      → SensorEvent from simulation CSV replay
POST /api/v1/ingestion/esp32       → ESP32 occupancy reading
GET  /api/v1/ingestion/esp32       → current ESP32 state
```

### Simulation Clock
```
GET  /api/v1/sim/time              → current sim time (overridden or real)
POST /api/v1/sim/time              → { "time": "HH:MM" } override sim time
DELETE /api/v1/sim/time            → reset to wall clock
```

### WebSocket
```
WS /api/v1/ws/connect              → push: sim tick updates to all clients
```

Interactive API docs: `http://localhost:8000/docs`

---

## Getting Started

### Prerequisites

| Tool | Version | Required for |
|---|---|---|
| Python | ≥ 3.12 | Backend |
| pip / venv | latest | Backend deps |
| Node.js | ≥ 20 | Web dashboard |
| Bun (or npm) | latest | Web dashboard deps |
| Flutter SDK | ≥ 3.12.1 | Mobile app |
| PlatformIO | latest | ESP32 firmware |
| Python `pyserial`, `requests` | latest | ESP32 serial bridge |

---

### Backend Setup

```bash
# 1. Clone and enter the repo
cd SmartRail-OS/backend

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
# .venv\Scripts\activate        # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and edit environment config
cp .env.example .env
# Edit .env with your settings (JWT secret, etc.)

# 5. Initialise the database (drop + create + seed)
#    ⚠ This WIPES the existing DB — only needed first time or after model changes
python init_db.py

# 6. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** The database is automatically seeded on first startup if the `stations` table is empty. You only need `init_db.py` for a clean slate or after schema changes.

The API is now available at:
- REST: `http://localhost:8000/api/v1/`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

---

### Web Dashboard Setup

```bash
cd SmartRail-OS/smartrailos_web

# Install dependencies (using Bun — faster)
bun install
# or: npm install

# Copy environment config
cp .env.example .env.local
# Edit VITE_API_BASE_URL if backend is not on localhost:8000

# Start development server
bun run dev
# or: npm run dev
```

Dashboard is available at: `http://localhost:5173`

**Production build:**
```bash
bun run build
bun run preview
```

---

### Flutter App Setup

```bash
cd SmartRail-OS/smartrailos_app

# Install Flutter dependencies
flutter pub get

# Run on a connected device or emulator
flutter run

# Run on web
flutter run -d chrome

# Build Android APK
flutter build apk --release
```

> **Backend URL:** The app defaults to `http://10.0.2.2:8000` (Android emulator localhost alias). Change `lib/core/` constants for a real device or remote backend.

---

### ESP32 Firmware Setup

The firmware is built with **PlatformIO**.

#### Hardware wiring

| ESP32 GPIO | Sensor | Function |
|---|---|---|
| 4 | HC-SR04 #1 | TRIG (entry side) |
| 14 | HC-SR04 #1 | ECHO (entry side) |
| 27 | HC-SR04 #2 | TRIG (exit side) |
| 33 | HC-SR04 #2 | ECHO (exit side) |
| GND | Both sensors | Ground |
| 5 V | Both sensors | VCC |

```
Coach door cross-section:

  [ Entry ] ──── [HC-SR04 #1] ──door── [HC-SR04 #2] ──── [ Exit ]
     (TRIG1/ECHO1 – GPIO 4/14)          (TRIG2/ECHO2 – GPIO 27/33)
```

#### Build & flash

```bash
cd SmartRail-OS/esp32-test

# Build firmware
pio run

# Upload to connected ESP32
pio run --target upload

# Monitor serial output
pio device monitor --baud 115200
```

Expected serial output:
```
================================
Metro Passenger Counter Started
================================

PASSENGER IN
Occupancy: 1

PASSENGER OUT
Occupancy: 0
```

---

### ESP32 Serial Bridge

After flashing the firmware, run the Python bridge to forward sensor data to the backend:

```bash
cd SmartRail-OS/esp32-test

# Install bridge dependencies
pip install pyserial requests

# Auto-detect port, broadcast to ALL stations (good for testing)
python serial_bridge.py

# Target a specific station (e.g., Ahmedabad One Mall — BL05)
python serial_bridge.py --station BL05

# Specify port manually
python serial_bridge.py --port /dev/ttyUSB0 --station BL05

# Point to remote backend
python serial_bridge.py --backend http://192.168.1.10:8000 --station RL03

# Full options
python serial_bridge.py --help
```

**Station ID reference:**

| Line | Station IDs |
|---|---|
| 🔵 Blue Line | `BL01` (Vastral Gam) … `BL18` (Thaltej Gam) |
| 🔴 Red Line | `RL01` (APMC) … `RL15` (Motera Stadium) |

When the bridge is running, the backend simulation runner automatically injects the live ESP32 occupancy data into station snapshot tables every 5 seconds, which the mobile app and web dashboard display in real-time.

---

## Simulation Clock

The simulation engine runs against the **real wall clock** by default. For testing, you can override it:

```bash
# Set simulation time to 08:30 (morning rush hour)
curl -X POST http://localhost:8000/api/v1/sim/time \
  -H "Content-Type: application/json" \
  -d '{"time": "08:30"}'

# Check current sim time
curl http://localhost:8000/api/v1/sim/time

# Reset to real time
curl -X DELETE http://localhost:8000/api/v1/sim/time
```

The web dashboard has a **Simulation Clock** control in the settings page.

---

## Configuration Reference

### Backend `.env`

```env
APP_NAME=SmartRail OS
APP_ENV=development

# API prefix
API_V1_PREFIX=/api/v1

# Comma-separated allowed CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT settings — CHANGE IN PRODUCTION
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# SQLite path (relative to backend/ directory)
# Default: sqlite+aiosqlite:///smartrailos_dev.db
DATABASE_URL=sqlite+aiosqlite:///smartrailos_dev.db
```

### Web `.env.local`

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Running Tests

```bash
cd SmartRail-OS/backend

# Activate virtualenv if not already active
source .venv/bin/activate

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing
```

Tests use `pytest` with the FastAPI `TestClient`. The simulation runner is automatically skipped during test runs (detected via `"pytest" in sys.modules`).

---

## Troubleshooting

### Backend won't start — `ModuleNotFoundError`
Make sure you are running `uvicorn` from the `backend/` directory with the virtualenv active.

### Database is empty after `init_db.py`
Check that `alembic` migrations are not conflicting. Run `python init_db.py` which does a full `drop_all → create_all → seed`.

### ESP32 serial bridge: `No /dev/ttyUSB* found`
- Check USB cable and drivers (`lsmod | grep cp210x` or `ch341`)
- Try `ls /dev/tty*` before and after plugging in the ESP32
- Add user to `dialout` group: `sudo usermod -aG dialout $USER`, then log out and back in

### ESP32 bridge: backend unreachable
Make sure the backend is running (`http://localhost:8000/health` returns 200) before starting the bridge.

### Web dashboard shows no data
1. Confirm backend is running on port 8000
2. Check browser console for CORS errors
3. Verify `VITE_API_BASE_URL` in `.env.local`

### Flutter app shows `Connection refused`
- Android emulator: backend must listen on `0.0.0.0`, not `127.0.0.1`
- Real device: use your machine's LAN IP instead of `localhost`
- Check firewall rules

### Simulation always shows empty trains
The Metro Engine only runs trains between ~06:00 and ~22:00 by default. Use the sim clock to set a time within service hours, e.g. `08:30`.

---

## License

This project is part of an academic capstone project for Ahmedabad Metro GMRC Phase-1 digital operations research.

---

*Built with ❤️ for Ahmedabad Metro.*
