# 🚀 SmartRail OS — Complete Startup Guide

This guide gives you the exact terminal commands to launch the entire SmartRail OS stack (Backend, Web Dashboard, Flutter Mobile App, and Sensor Emulator) in under 2 minutes.

---

## ⚡ Quick Start (4-Terminal Setup)

### 1️⃣ Terminal 1: FastAPI Backend & Prediction Engine

Runs the core transit physics simulation, ML forecasting engine, and REST/WebSocket API on **Port 8000**.

```bash
cd backend

# 1. Install dependencies (if not already installed)
pip install -r requirements.txt

# 2. Start the Backend Server (auto-seeds database on first launch)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Backend URL**: [http://localhost:8000](http://localhost:8000)  
> **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

#### 🛠️ Dev Mode — Override Simulation Time

Use this when running **outside service hours** (06:20–22:09). The clock starts at the given time and advances in real-time (e.g. 12:00 → 12:01 → 12:02...).

```powershell
# Windows (PowerShell):
$env:DEV_SIM_TIME="12:00"; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
# Linux / macOS (Bash):
DEV_SIM_TIME=12:00 uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```


---

### 2️⃣ Terminal 2: Web Command Center (TanStack Start + React)

Runs the real-time operational control room and digital twin on **Port 8080**.

```bash
cd smartrailos_web

# 1. Install dependencies
npm install

# 2. Start Vite Dev Server
npm run dev
```

> **Web Dashboard**: [http://localhost:8080/dashboard](http://localhost:8080/dashboard)  
> **Live Trains View**: [http://localhost:8080/dashboard/live-trains](http://localhost:8080/dashboard/live-trains)  
> **Incoming Forecasts**: [http://localhost:8080/dashboard/incoming](http://localhost:8080/dashboard/incoming)

---

### 3️⃣ Terminal 3: Commuter Mobile App (Flutter)

Runs the commuter passenger app with live coach occupancy, train searches, and platform predictions.

```bash
cd smartrailos_app

# 1. Fetch Flutter dependencies
flutter pub get

# 2. If testing on a physical Android phone over USB, forward backend port:
~/Android/Sdk/platform-tools/adb reverse tcp:8000 tcp:8000

# 3. Launch on Chrome, Emulator, or connected Android phone
I
# Or run on physical phone:
# flutter run -d ZD222B4K8X
```


> **Mobile Web Preview**: [http://localhost:8082](http://localhost:8082)  
> *(Note: The app starts directly on the Home / Train Search screen with no login required).*

---

### 4️⃣ Terminal 4: IoT Hardware Sensor Emulator (For Demos & Testing)

Simulates passenger boarding/deboarding IR break-beam pulses in real time.

```bash
# 1. Simulate arrival flow at Old High Court (BL08):
python3 scripts/sensor_simulator.py --station BL08 --occupancy 120 --boarding 20 --alighting 10

# 2. Simulate live continuous rush-hour triggers:
python3 scripts/sensor_simulator.py --station BL08 --rush-hour
```

---

## 🧪 Verification & Automated Tests

Run the full backend test suite:

```bash
cd backend
python3 -m pytest
```

Check Flutter code health:

```bash
cd smartrailos_app
flutter analyze
```

Check Web production build:

```bash
cd smartrailos_web
npm run build
```

---

## 📁 Key File Locations

| Component | Path | Description |
| --- | --- | --- |
| **Database** | `backend/smartrailos_dev.db` | SQLite database with station & occupancy snapshots |
| **Prediction Engine** | `backend/app/services/engine/prediction_service.py` | Multi-horizon ML forecasting with confidence scoring |
| **TimescaleDB Migration** | `backend/migrations/timescaledb_production_migration.sql` | Production PostgreSQL/TimescaleDB schema |
| **PRD Compliance Doc** | `docs/PRD_COMPLIANCE_AND_ARCHITECTURE_DECISIONS.md` | Architectural justifications and talking points for judges |
| **Sensor Simulator** | `scripts/sensor_simulator.py` | Hardware turnstile & coach flow generator |
