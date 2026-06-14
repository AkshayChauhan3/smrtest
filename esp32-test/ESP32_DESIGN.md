# ESP32 Passenger Counter — Hardware Design & Firmware Documentation

> SmartRail OS · IoT Edge Node

---

## Table of Contents

- [Overview](#overview)
- [Hardware Requirements](#hardware-requirements)
- [Circuit Design](#circuit-design)
- [Pin Assignment](#pin-assignment)
- [Firmware Architecture](#firmware-architecture)
- [State Machine](#state-machine)
- [HC-SR04 Operation](#hc-sr04-operation)
- [Serial Output Protocol](#serial-output-protocol)
- [Calibration Guide](#calibration-guide)
- [Serial Bridge Integration](#serial-bridge-integration)
- [Backend API Contract](#backend-api-contract)
- [PlatformIO Build & Flash](#platformio-build--flash)
- [Troubleshooting](#troubleshooting)

---

## Overview

The ESP32 edge node provides **real-time directional passenger counting** at metro coach doors. Two HC-SR04 ultrasonic sensors are mounted on opposite sides of the door frame. The **order** in which a person breaks each sensor's beam determines whether they are **boarding** (occupancy +1) or **alighting** (occupancy −1).

```
              ┌────────────────────────────────────┐
              │           Coach Door                │
              │                                    │
  [Outside]   │  [Sensor 1]          [Sensor 2]   │  [Inside coach]
  (Platform)  │  GPIO 4/14           GPIO 27/33   │
              │                                    │
              └────────────────────────────────────┘

  → Sensor 1 triggers first, then Sensor 2 = BOARDING  (occupancy++)
  ← Sensor 2 triggers first, then Sensor 1 = ALIGHTING (occupancy--)
```

The ESP32 prints occupancy to the USB serial port at 115 200 baud. A companion **Python serial bridge** (`serial_bridge.py`) reads this output and POSTs each count change to the SmartRail OS backend, where it is injected into the live station display tables.

---

## Hardware Requirements

| Component | Specification | Qty |
|---|---|---|
| ESP32 Dev Module | Any ESP32 with USB-serial (e.g. ESP32-WROOM-32) | 1 |
| HC-SR04 Ultrasonic Sensor | 2 cm – 400 cm range, 5 V VCC | 2 |
| USB Micro-B / USB-C cable | Data-capable (not charge-only) | 1 |
| Breadboard | Full-size recommended | 1 |
| Jumper wires | M-M and M-F | ~12 |
| 5 V power supply | USB from computer or dedicated PSU | 1 |

> **IMPORTANT:** HC-SR04 operates at **5 V**, but ESP32 GPIO pins are **3.3 V tolerant only**. The ECHO pin returns a 5 V signal — use a **voltage divider** (1 kΩ + 2 kΩ) on each ECHO line to step down to ~3.3 V, or use an **HC-SR04P** (3.3 V variant).

---

## Circuit Design

### Voltage divider for ECHO lines

```
HC-SR04 ECHO (5 V) ──┬── 1 kΩ ──┬── ESP32 GPIO (3.3 V)
                     │          │
                     │         2 kΩ
                     │          │
                     └──────────┴── GND
```

### Full wiring diagram

```
                         ┌─────────────────┐
                         │   ESP32 Dev     │
                         │                 │
VCC (5V) ───────────────►│ VIN             │
GND ────────────────────►│ GND             │
                         │                 │
       ┌── HC-SR04 #1 ──►│ GPIO 4  (TRIG1) │
       │   (Entry side)  │                 │
       │   ECHO ──1kΩ───►│ GPIO 14 (ECHO1) │
       │         │       │                 │
       │        2kΩ      │                 │
       │         │       │                 │
       │        GND      │                 │
       │                 │                 │
       └── HC-SR04 #2 ──►│ GPIO 27 (TRIG2) │
           (Exit side)   │                 │
           ECHO ──1kΩ───►│ GPIO 33 (ECHO2) │
                 │       │                 │
                2kΩ      │                 │
                 │       │                 │
                GND      │                 │
                         └─────────────────┘
```

### Breadboard layout

```
Power rails:
  + (Red)  → 5 V from USB or PSU
  − (Blue) → GND

HC-SR04 #1 (left side of door):
  VCC  → + rail
  GND  → − rail
  TRIG → ESP32 GPIO 4  (direct)
  ECHO → 1 kΩ resistor → ESP32 GPIO 14
              └──────── 2 kΩ to GND

HC-SR04 #2 (right side of door):
  VCC  → + rail
  GND  → − rail
  TRIG → ESP32 GPIO 27 (direct)
  ECHO → 1 kΩ resistor → ESP32 GPIO 33
              └──────── 2 kΩ to GND
```

---

## Pin Assignment

| GPIO | Mode | Connected to | Description |
|---|---|---|---|
| **4** | OUTPUT | HC-SR04 #1 TRIG | Trigger pulse for sensor 1 |
| **14** | INPUT | HC-SR04 #1 ECHO (via divider) | Echo response from sensor 1 |
| **27** | OUTPUT | HC-SR04 #2 TRIG | Trigger pulse for sensor 2 |
| **33** | INPUT | HC-SR04 #2 ECHO (via divider) | Echo response from sensor 2 |

`platformio.ini` target: `board = esp32dev` / `framework = arduino`

---

## Firmware Architecture

The firmware (`src/main.cpp`) is structured into three sections:

### 1. Constants and globals

```cpp
#define TRIG1 4       // Sensor 1 trigger pin
#define ECHO1 14      // Sensor 1 echo pin
#define TRIG2 27      // Sensor 2 trigger pin
#define ECHO2 33      // Sensor 2 echo pin

const float THRESHOLD = 20.0;         // cm — person detected if closer than this
const unsigned long TIMEOUT  = 2000;  // ms — max time to complete a crossing
const unsigned long COOLDOWN = 1000;  // ms — min gap between consecutive counts

int occupancy = 0;  // Running occupancy count (never goes below 0)
```

### 2. `getDistance(int trigPin, int echoPin) → float`

Sends a 10 µs TRIG pulse and measures the ECHO pulse width with `pulseIn()`:

```
distance (cm) = pulse_duration_µs × 0.0343 / 2
```

Returns `999` cm (effectively "no detection") if the pulse times out (>30 ms).

### 3. `loop()` — main sensing cycle

Runs every 50 ms:
1. Measure distances from both sensors
2. Convert to boolean: `s1 = d1 < THRESHOLD`, `s2 = d2 < THRESHOLD`
3. Step the state machine
4. `delay(50)` — 20 Hz polling rate

---

## State Machine

```
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
                    ▼                                                  │
              ┌───────────┐   s1 && !s2   ┌────────────────┐          │
              │           │──────────────►│  SENSOR1_FIRST  │          │
              │   IDLE    │               └────────────────┘          │
              │           │   s2 && !s1   ┌────────────────┐          │
              │           │──────────────►│  SENSOR2_FIRST  │          │
              └───────────┘               └────────────────┘          │
                    ▲                            │  │                  │
                    │ TIMEOUT                    │  │ TIMEOUT          │
                    └────────────────────────────┘  └─────────────────┘
                    
SENSOR1_FIRST + s2 triggers → PASSENGER IN  (occupancy++) → WAIT_CLEAR
SENSOR2_FIRST + s1 triggers → PASSENGER OUT (occupancy--) → WAIT_CLEAR
WAIT_CLEAR: both sensors clear → back to IDLE
```

### States

| State | Meaning | Next state trigger |
|---|---|---|
| `IDLE` | No detection active; enforcing cooldown | s1 first → `SENSOR1_FIRST`; s2 first → `SENSOR2_FIRST` |
| `SENSOR1_FIRST` | Person started from entry side | s2 triggers → count up, go `WAIT_CLEAR`; timeout → `IDLE` |
| `SENSOR2_FIRST` | Person started from exit side | s1 triggers → count down, go `WAIT_CLEAR`; timeout → `IDLE` |
| `WAIT_CLEAR` | Person has finished crossing | Both sensors clear → `IDLE` |

### Design decisions

- **COOLDOWN** prevents a single person from being counted twice due to sensor bounce
- **TIMEOUT** ensures the machine resets if the crossing is interrupted (e.g. person turns back mid-crossing)
- **Occupancy floor** — `occupancy` is never decremented below 0 (`if (occupancy > 0) occupancy--`)

---

## HC-SR04 Operation

The HC-SR04 uses an ultrasonic burst:

```
┌──────────────────────────────────────────────────────────────────┐
│  1. MCU drives TRIG HIGH for 10 µs                               │
│  2. Sensor emits 8 × 40 kHz ultrasonic bursts                   │
│  3. ECHO line goes HIGH                                          │
│  4. Ultrasonic wave reflects off object                          │
│  5. ECHO line goes LOW when echo received                        │
│  6. ECHO pulse width = round-trip travel time                    │
│                                                                  │
│  Distance (cm) = pulse_width_µs × 0.0343 / 2                    │
│  (speed of sound = 343 m/s at 20°C → 0.0343 cm/µs)             │
└──────────────────────────────────────────────────────────────────┘
```

**Timing parameters:**

| Parameter | Value |
|---|---|
| TRIG pulse width | 10 µs |
| Burst frequency | 40 kHz |
| Min range | ~2 cm |
| Max range | ~400 cm |
| `pulseIn()` timeout | 30 000 µs (returns 999 cm) |

---

## Serial Output Protocol

The firmware communicates via USB serial at **115 200 baud, 8-N-1**.

### Startup banner
```
================================
Metro Passenger Counter Started
================================
```

### Passenger count change events
```
(blank line)
PASSENGER IN
Occupancy: 42
(blank line)

(blank line)
PASSENGER OUT
Occupancy: 41
(blank line)
```

The serial bridge uses this regex to parse occupancy lines:
```python
re.match(r"Occupancy:\s*(\d+)", line)
```

Only lines matching this pattern are acted upon — all other output (banner, labels) is ignored.

---

## Calibration Guide

### Setting `THRESHOLD`

Mount both sensors at door-frame level (~90 cm height). With no person in the doorway:

1. Open the serial monitor (`pio device monitor --baud 115200`)
2. Note the steady-state distance reading (should be the far wall of the vehicle, >100 cm)
3. Walk through the door and observe the minimum reading
4. Set `THRESHOLD` to **half the distance to the far wall**, so it never triggers on the far wall but always detects a person

Recommended: **20 cm** for a standard metro door (≈70 cm wide). Increase for wider openings.

### Setting `TIMEOUT`

Default **2 000 ms**. This should cover the slowest expected crossing time (slow-moving passengers, passengers with luggage). If people are being missed, increase to 3 000 ms.

### Setting `COOLDOWN`

Default **1 000 ms**. Prevents a person from being double-counted. If sensors fire twice for one person (reflections), increase to 1 500 ms.

---

## Serial Bridge Integration

`serial_bridge.py` runs on a host computer connected to the ESP32 via USB:

```
┌───────────────────────────────────────────────┐
│          serial_bridge.py                     │
│                                               │
│  1. Open serial port (auto-detect /dev/ttyUSB*)│
│  2. readline() → parse "Occupancy: N"         │
│  3. Only POST if count changed                │
│  4. POST_COOLDOWN = 100 ms between POSTs      │
│  5. Retry on serial disconnect (every 3 s)    │
│  6. Ctrl+C to stop cleanly                    │
└───────────────────────────────────────────────┘
```

### Usage

```bash
# Auto-detect port, broadcast to ALL stations:
python serial_bridge.py

# Target a specific station:
python serial_bridge.py --station BL05

# Specify port and backend:
python serial_bridge.py \
    --port /dev/ttyUSB0 \
    --baud 115200 \
    --backend http://192.168.1.10:8000 \
    --station RL03 \
    --capacity 400
```

### CLI options

| Flag | Default | Description |
|---|---|---|
| `--port` | auto-detect | Serial port (e.g. `/dev/ttyUSB0`) |
| `--baud` | `115200` | Baud rate |
| `--backend` | `http://localhost:8000` | Backend base URL |
| `--station` | `None` (all) | Station ID to inject data into |
| `--capacity` | `400` | Coach capacity for % calculation |

### Auto-detection

The bridge scans `glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*")` and uses the first found port. This covers:

| ESP32 chip | USB-serial IC | Device |
|---|---|---|
| ESP32-WROOM-32 | CP2102 / CP2104 | `/dev/ttyUSB0` |
| ESP32-S3 DevKit | CH340 | `/dev/ttyUSB0` |
| ESP32-C3 | Built-in USB | `/dev/ttyACM0` |

---

## Backend API Contract

### POST `/api/v1/ingestion/esp32`

**Request body:**
```json
{
  "occupancy": 42,
  "station_id": "BL05",
  "coach_capacity": 400
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `occupancy` | integer | ✅ | Current passenger count from ESP32 |
| `station_id` | string \| null | ❌ | Station to associate data with; `null` = broadcast to ALL |
| `coach_capacity` | integer | ❌ | Defaults to 400 if omitted |

**Response (200 OK):**
```json
{
  "status": "ok",
  "occupancy": 42,
  "occupancy_pct": 10.5,
  "station_id": "BL05"
}
```

**Backend behaviour:**
1. Updates the `esp32` singleton (`esp32_state.py`)
2. Sets `esp32.is_active = True`
3. On the next 5-second simulation tick, the simulation runner injects an `ESP32_DEMO` row into `station_BL05_current` (or all station tables if `station_id` is null)
4. ESP32 data has **lower priority** than real simulated trains — it only shows if no real train is currently dwelling at the platform

### GET `/api/v1/ingestion/esp32`

Returns the current ESP32 state:
```json
{
  "occupancy": 42,
  "occupancy_pct": 10.5,
  "station_id": "BL05",
  "is_active": true,
  "last_updated": "2025-01-15T08:30:00"
}
```

---

## PlatformIO Build & Flash

### `platformio.ini`

```ini
[env:esp32dev]
platform = espressif32
board    = esp32dev
framework = arduino
```

### Commands

```bash
cd SmartRail-OS/esp32-test

# Install PlatformIO CLI (if not installed)
pip install platformio

# Build
pio run

# Upload (ESP32 must be connected via USB)
pio run --target upload

# Build + upload in one step
pio run --target upload && pio device monitor --baud 115200

# Serial monitor only (no upload)
pio device monitor --baud 115200

# Clean build artifacts
pio run --target clean
```

### If upload fails

1. Hold the **BOOT** button on the ESP32 while pressing UPLOAD in PlatformIO / clicking upload
2. Release BOOT when "Connecting…" appears in the terminal
3. Some ESP32 boards need `upload_speed = 460800` in `platformio.ini`

---

## Troubleshooting

### Sensor always reads 999 (timeout)

- Check ECHO pin wiring — is the voltage divider correctly assembled?
- Confirm VCC is 5 V (not 3.3 V)
- Run `pio device monitor` and check for the startup banner; if missing, firmware did not upload

### Both sensors trigger simultaneously

- Sensor 1 and Sensor 2 are too close together — they may be picking up each other's echoes (crosstalk)
- Stagger TRIG timing: fire sensor 1, wait 10 ms, fire sensor 2. (Future firmware enhancement)
- Increase physical separation between sensors (>15 cm)

### Occupancy goes negative

- This is prevented by firmware (`if (occupancy > 0) occupancy--`)
- If `serial_bridge.py` shows `Occupancy: 0` frequently, the sensors may be detecting reflections

### Serial bridge: `Port not found`

```bash
# List all serial devices
ls /dev/tty* | grep -E "USB|ACM"

# Add user to dialout group (Linux)
sudo usermod -aG dialout $USER
# Log out and back in for the change to take effect
```

### Serial bridge: `backend unreachable`

- Confirm backend is running: `curl http://localhost:8000/health`
- Check firewall: `sudo ufw allow 8000/tcp`
- If running in a VM, use the VM's host IP instead of `localhost`

### Web dashboard / mobile app not showing ESP32 data

1. Verify the bridge is sending data: look for `✓` lines in bridge output
2. Check backend logs for `esp32` ingestion events
3. Wait up to 5 seconds for the next simulation tick to inject the row
4. Check `GET /api/v1/ingestion/esp32` — if `is_active` is false, the singleton was not updated

---

*ESP32 Passenger Counter — SmartRail OS IoT Documentation*
