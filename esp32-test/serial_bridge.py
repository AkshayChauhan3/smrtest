#!/usr/bin/env python3
"""
SmartRail OS — ESP32 Directional Serial Bridge
Reads directional crossing pulses and telemetry from the ESP32 over USB Serial
and forward-propagates them to the SmartRail OS FastAPI backend in real time.
"""

import argparse
import glob
import json
import re
import sys
import time
import urllib.request
import urllib.error
import serial


# ─── Configuration Defaults ──────────────────────────────────────────────────
DEFAULT_PORT = None
DEFAULT_BAUD = 115200
DEFAULT_BACKEND = "http://localhost:8000"
RETRY_DELAY = 3.0
POST_COOLDOWN = 0.5


def find_serial_port() -> str:
    """Auto-detect connected USB serial devices."""
    ports = sorted(glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*"))
    if ports:
        return ports[0]
    return "/dev/ttyUSB0"


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
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                pct = (occupancy / capacity) * 100.0
                ts = time.strftime("%H:%M:%S")
                icon = "🟢" if direction == "IN" else ("🟠" if direction == "OUT" else "🔄")
                tot_str = f"Totals: IN={total_in} OUT={total_out}" if total_in is not None else ""
                dist_str = f"| S1: {distance_s1:.1f}cm S2: {distance_s2:.1f}cm" if (distance_s1 is not None and distance_s1 < 900) else ""
                print(f"[{ts}] {icon} [{direction:<4}] Occupancy: {occupancy:>3} ({pct:4.1f}%) | {tot_str} {dist_str} → {station_id or 'ALL'} ✓")
                return True
    except urllib.error.HTTPError as exc:
        print(f"  [HTTP {exc.code}] Telemetry rejected: {exc.reason}")
    except urllib.error.URLError as exc:
        print(f"  [HTTP ERROR] Backend connection failed at {url}: {exc.reason}")
    except Exception as exc:
        print(f"  [ERROR] {exc}")

    return False


def main():
    parser = argparse.ArgumentParser(description="SmartRail OS ESP32 Directional Serial Bridge")
    parser.add_argument("--port", default=DEFAULT_PORT, help="Serial port (e.g. /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD, help="Baud rate (default 115200)")
    parser.add_argument("--backend", default=DEFAULT_BACKEND, help="Backend URL (default http://localhost:8000)")
    parser.add_argument("--station", default=None, help="Target station ID (e.g. BL08)")
    parser.add_argument("--coach", default="C1", help="Coach identifier (default C1)")
    parser.add_argument("--capacity", type=int, default=400, help="Coach capacity (default 400)")
    args = parser.parse_args()

    if args.port is None:
        args.port = find_serial_port()

    station_label = args.station if args.station else "ALL stations"
    print("=" * 62)
    print("  SmartRail OS  ·  ESP32 Directional Serial Bridge")
    print("=" * 62)
    print(f"  Port    : {args.port}  @  {args.baud} baud")
    print(f"  Backend : {args.backend}")
    print(f"  Station : {station_label}")
    print(f"  Coach   : {args.coach} (Capacity: {args.capacity} pax)")
    print("=" * 62)
    print()

    last_occupancy = -1
    last_post_time = 0.0

    while True:
        try:
            ser = serial.Serial(args.port, args.baud, timeout=1)
            print(f"✓ Connected to {args.port}")
            print("  Listening for directional passenger crossings…\n")

            while True:
                raw = ser.readline()
                if not raw:
                    continue

                line = raw.decode("utf-8", errors="ignore").strip()
                if not line:
                    continue

                # 1. Structured JSON (Preferred)
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

                # 2. Human-readable logs
                if "BOARDING" in line or "PASSENGER IN" in line:
                    post_telemetry(args.backend, "IN", 1, 0, max(0, last_occupancy + 1), station_id=args.station, coach_id=args.coach, capacity=args.capacity)
                    last_occupancy += 1
                elif "ALIGHTING" in line or "PASSENGER OUT" in line:
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
                elif "[Sensor Status]" in line or "SmartRail OS" in line or "Threshold" in line:
                    print(f"  [ESP32] {line}")

        except serial.SerialException as exc:
            print(f"✗ Serial port error: {exc}")
            print(f"  Retrying in {RETRY_DELAY}s…\n")
            time.sleep(RETRY_DELAY)
        except KeyboardInterrupt:
            print("\n\nBridge stopped by user.")
            break


if __name__ == "__main__":
    main()
