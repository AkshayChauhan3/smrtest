#!/usr/bin/env python3
"""
ESP32 → SmartRail-OS Serial Bridge
====================================
Reads passenger occupancy from the ESP32 sensor via USB serial and
forwards it to the backend ingestion API.

The backend simulation runner then injects the ESP32_DEMO dummy train
into the station_*_current tables every 5 seconds so the mobile app
can display live sensor data at:
  • ALL stations simultaneously   (default — great for testing any screen)
  • ONE specific station           (pass --station BL01)

Usage
-----
    # Show at ALL stations (any station on mobile shows live count):
    python serial_bridge.py

    # Show at a specific station only:
    python serial_bridge.py --station BL01

    # Use a different serial port or baud rate:
    python serial_bridge.py --port /dev/ttyUSB1 --baud 115200

    # Point at a remote backend:
    python serial_bridge.py --backend http://192.168.1.10:8000

Station IDs
-----------
Blue Line : BL01 – BL18
Red Line  : RL01 – RL15

Requirements
------------
    pip install pyserial requests
"""

import argparse
import re
import time
from datetime import datetime, timezone

import requests
import serial


# ─── Defaults ──────────────────────────────────────────────────────────────
SERIAL_PORT   = "/dev/ttyUSB0"
BAUD_RATE     = 115200
BACKEND_URL   = "http://localhost:8000"
COACH_CAP     = 400          # matches the seeded coach capacity
RETRY_DELAY   = 3            # seconds between reconnect attempts
POST_COOLDOWN = 0.1          # minimum seconds between consecutive POSTs


# ─── CLI ────────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="ESP32 → SmartRail-OS serial bridge")
    p.add_argument("--port",    default=SERIAL_PORT, help="Serial port (default: /dev/ttyUSB0)")
    p.add_argument("--baud",    default=BAUD_RATE,   type=int, help="Baud rate (default: 115200)")
    p.add_argument("--backend", default=BACKEND_URL, help="Backend base URL")
    p.add_argument(
        "--station",
        default=None,
        help="Station ID to attach dummy train to (e.g. BL01). "
             "Omit to broadcast to ALL stations.",
    )
    p.add_argument("--capacity", default=COACH_CAP, type=int, help="Coach capacity (default: 400)")
    return p.parse_args()


# ─── HTTP helpers ────────────────────────────────────────────────────────────
def post_occupancy(backend: str, occupancy: int, station_id: str | None, capacity: int) -> bool:
    """POST one occupancy reading to the backend. Returns True on success."""
    url = f"{backend}/api/v1/ingestion/esp32"
    payload = {
        "occupancy": occupancy,
        "station_id": station_id,
        "coach_capacity": capacity,
    }
    try:
        r = requests.post(url, json=payload, timeout=3)
        if r.status_code == 200:
            data = r.json()
            ts   = datetime.now().strftime("%H:%M:%S")
            pct  = data.get("occupancy_pct", "?")
            sid  = data.get("station_id") or "ALL STATIONS"
            print(f"[{ts}]  Occupancy {occupancy:3d}  ({pct}%)  →  {sid}  ✓")
            return True
        else:
            print(f"  ⚠  HTTP {r.status_code}: {r.text[:120]}")
            return False
    except requests.exceptions.ConnectionError:
        print("  ✗  Backend unreachable — is the FastAPI server running?")
        return False
    except Exception as exc:
        print(f"  ✗  POST failed: {exc}")
        return False


# ─── Main loop ───────────────────────────────────────────────────────────────
def main() -> None:
    args = parse_args()

    station_label = args.station if args.station else "ALL stations"
    print("=" * 60)
    print("  SmartRail-OS  ·  ESP32 Serial Bridge")
    print("=" * 60)
    print(f"  Port    : {args.port}  @  {args.baud} baud")
    print(f"  Backend : {args.backend}")
    print(f"  Station : {station_label}")
    print(f"  Capacity: {args.capacity} pax/coach")
    print("=" * 60)
    print()

    last_occupancy = -1
    last_post_time = 0.0

    while True:
        try:
            ser = serial.Serial(args.port, args.baud, timeout=2)
            print(f"✓  Connected to {args.port}")
            print("   Listening for occupancy data…\n")

            while True:
                raw = ser.readline()
                if not raw:
                    continue

                line = raw.decode("utf-8", errors="ignore").strip()
                m = re.match(r"Occupancy:\s*(\d+)", line)
                if not m:
                    continue

                occupancy = int(m.group(1))

                # Only POST when the value actually changes (avoids hammering the API)
                now = time.monotonic()
                if occupancy != last_occupancy and (now - last_post_time) >= POST_COOLDOWN:
                    post_occupancy(args.backend, occupancy, args.station, args.capacity)
                    last_occupancy = occupancy
                    last_post_time = now

        except serial.SerialException as exc:
            print(f"\n✗  Serial error: {exc}")
            print(f"   Retrying in {RETRY_DELAY}s…\n")
            time.sleep(RETRY_DELAY)
        except KeyboardInterrupt:
            print("\n\nBridge stopped by user.  Bye!")
            break


if __name__ == "__main__":
    main()
