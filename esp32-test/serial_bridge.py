#!/usr/bin/env python3
"""
ESP32 → SmartRail-OS Serial Bridge (Directional Passenger IN / OUT)
==================================================================
Reads real-time passenger occupancy and crossing events (IN / OUT) from the
ESP32 sensor via USB serial and forwards them to the backend ingestion API.

Usage
-----
    # Auto-detect port and broadcast to ALL stations:
    python serial_bridge.py

    # Attach to a specific station (e.g. Old High Court BL08):
    python serial_bridge.py --station BL08

    # Override port & backend URL:
    python serial_bridge.py --port /dev/ttyUSB0 --backend http://localhost:8000
"""

import argparse
import glob
import json
import re
import time
from datetime import datetime

import requests
import serial


# ─── Defaults ──────────────────────────────────────────────────────────────
BAUD_RATE     = 115200
BACKEND_URL   = "http://localhost:8000"
COACH_CAP     = 400
RETRY_DELAY   = 3
POST_COOLDOWN = 0.05  # minimum seconds between consecutive POSTs


# ─── Auto-detect serial port ─────────────────────────────────────────────────
def detect_serial_port() -> str:
    candidates = sorted(glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*"))
    if candidates:
        print(f"  Auto-detected serial ports: {candidates}")
        print(f"  Using: {candidates[0]}")
        return candidates[0]
    print("  ⚠  No /dev/ttyUSB* or /dev/ttyACM* found — defaulting to /dev/ttyUSB0")
    return "/dev/ttyUSB0"


# ─── CLI ────────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="ESP32 → SmartRail-OS directional serial bridge")
    p.add_argument("--port",    default=None,       help="Serial port (auto-detected if omitted)")
    p.add_argument("--baud",    default=BAUD_RATE,  type=int, help="Baud rate (default: 115200)")
    p.add_argument("--backend", default=BACKEND_URL, help="Backend base URL")
    p.add_argument(
        "--station",
        default=None,
        help="Station ID to attach dummy train to (e.g. BL08). Omit for all stations.",
    )
    p.add_argument("--coach", default="C1", help="Coach ID (default: C1)")
    p.add_argument("--capacity", default=COACH_CAP, type=int, help="Coach capacity (default: 400)")
    return p.parse_args()


# ─── HTTP helpers ────────────────────────────────────────────────────────────
def post_telemetry(
    backend: str,
    direction: str,
    in_delta: int,
    out_delta: int,
    occupancy: int,
    total_in: int | None = None,
    total_out: int | None = None,
    distance_s1: float | None = None,
    distance_s2: float | None = None,
    station_id: str | None = None,
    coach_id: str = "C1",
    capacity: int = 400,
) -> bool:
    """POST directional telemetry to the backend."""
    url = f"{backend}/api/v1/esp32/telemetry"
    payload = {
        "direction": direction,
        "in_delta": in_delta,
        "out_delta": out_delta,
        "occupancy": occupancy,
        "total_in": total_in,
        "total_out": total_out,
        "distance_s1": distance_s1,
        "distance_s2": distance_s2,
        "station_id": station_id,
        "coach_id": coach_id,
        "coach_capacity": capacity,
    }
    try:
        r = requests.post(url, json=payload, timeout=2)
        if r.status_code == 200:
            data = r.json()
            ts = datetime.now().strftime("%H:%M:%S")
            pct = data.get("occupancy_pct", "?")
            sid = data.get("station_id") or "ALL STATIONS"
            icon = "🟢 [IN ]" if direction == "IN" else "🟠 [OUT]" if direction == "OUT" else "🔄 [SYNC]"
            print(f"[{ts}] {icon} Occupancy: {occupancy:3d} ({pct}%) | Totals: IN={data.get('total_in', '?')} OUT={data.get('total_out', '?')} → {sid} ✓")
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

    if args.port is None:
        args.port = detect_serial_port()

    station_label = args.station if args.station else "ALL stations"
    print("=" * 60)
    print("  SmartRail-OS  ·  ESP32 Directional Serial Bridge")
    print("=" * 60)
    print(f"  Port    : {args.port}  @  {args.baud} baud")
    print(f"  Backend : {args.backend}")
    print(f"  Station : {station_label}")
    print(f"  Coach   : {args.coach} (Capacity: {args.capacity} pax)")
    print("=" * 60)
    print()

    last_occupancy = -1
    last_post_time = 0.0

    while True:
        try:
            ser = serial.Serial(args.port, args.baud, timeout=1)
            # Pulse DTR/RTS to reset ESP32 and initiate clean startup
            ser.dtr = False
            ser.rts = False
            time.sleep(0.1)
            ser.dtr = True
            ser.rts = True
            time.sleep(0.1)

            print(f"✓  Connected to {args.port}")
            print("   Listening for live sensor readings & telemetry…\n")

            while True:
                raw = ser.readline()
                if not raw:
                    continue

                line = raw.decode("utf-8", errors="ignore").strip()
                if not line:
                    continue

                # 1. Try parsing structured JSON
                if line.startswith("{") and line.endswith("}"):
                    try:
                        pkt = json.loads(line)
                        event = pkt.get("event", "SYNC")
                        in_d = pkt.get("in_delta", 0)
                        out_d = pkt.get("out_delta", 0)
                        occ = pkt.get("occupancy", 0)
                        tot_in = pkt.get("total_in")
                        tot_out = pkt.get("total_out")
                        d1 = pkt.get("d1")
                        d2 = pkt.get("d2")

                        post_telemetry(
                            backend=args.backend,
                            direction=event,
                            in_delta=in_d,
                            out_delta=out_d,
                            occupancy=occ,
                            total_in=tot_in,
                            total_out=tot_out,
                            distance_s1=d1,
                            distance_s2=d2,
                            station_id=args.station,
                            coach_id=args.coach,
                            capacity=args.capacity,
                        )
                        last_occupancy = occ
                        last_post_time = time.monotonic()
                        continue
                    except json.JSONDecodeError:
                        pass

                # 2. Parse human-readable crossing markers
                if "PASSENGER IN" in line:
                    post_telemetry(args.backend, "IN", 1, 0, max(0, last_occupancy + 1), station_id=args.station, coach_id=args.coach, capacity=args.capacity)
                    last_occupancy += 1
                elif "PASSENGER OUT" in line:
                    occ = max(0, last_occupancy - 1)
                    post_telemetry(args.backend, "OUT", 0, 1, occ, station_id=args.station, coach_id=args.coach, capacity=args.capacity)
                    last_occupancy = occ
                elif "Occupancy:" in line:
                    m = re.search(r"Occupancy:\s*(\d+)", line)
                    if m:
                        occ = int(m.group(1))
                        now = time.monotonic()
                        if occ != last_occupancy and (now - last_post_time) >= POST_COOLDOWN:
                            post_telemetry(args.backend, "SYNC", 0, 0, occ, station_id=args.station, coach_id=args.coach, capacity=args.capacity)
                            last_occupancy = occ
                            last_post_time = now
                else:
                    # Echo raw ESP32 serial lines (startup banners, diagnostic telemetry)
                    print(f"  [ESP32] {line}")

        except serial.SerialException as exc:
            print(f"\n✗  Serial error: {exc}")
            print(f"   Retrying in {RETRY_DELAY}s…\n")
            time.sleep(RETRY_DELAY)
        except KeyboardInterrupt:
            print("\n\nBridge stopped by user.  Bye!")
            break


if __name__ == "__main__":
    main()


