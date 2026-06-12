#!/usr/bin/env python3
"""
Seed the ESP32_DEMO dummy train into the SmartRail-OS database.

Run once before starting the serial bridge:

    cd backend
    python scripts/seed_esp32_train.py

This script is idempotent — running it multiple times is safe.
"""

import asyncio
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import engine as db_engine, SessionLocal
from app.models.base import Base
from app.models.train import Train, TrainCoach


ESP32_TRAIN_ID   = "ESP32_DEMO"
ESP32_TRAIN_NAME = "ESP32 Sensor Demo"
ESP32_COACH_CAP  = 400


async def seed_esp32_train() -> None:
    # Ensure all tables exist (creates them if first run)
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # Check if already seeded
        existing = await db.scalar(
            select(Train).where(Train.train_id == ESP32_TRAIN_ID)
        )
        if existing:
            print(f"✓  Train '{ESP32_TRAIN_ID}' already exists — nothing to do.")
            return

        # Insert the dummy train
        train = Train(
            train_id          = ESP32_TRAIN_ID,
            train_name        = ESP32_TRAIN_NAME,
            line_id           = "BL",         # Blue Line (won't affect routing)
            direction         = "UP",
            current_station_id= None,         # Simulation runner will set this
            next_station_id   = None,
            journey_completed_pct = 0.0,
            current_position  = 0.0,
            capacity          = ESP32_COACH_CAP,
            status            = "ACTIVE",
            c1_passengers     = 0,
            c2_passengers     = 0,
            c3_passengers     = 0,
            c1_occupancy_pct  = 0.0,
            c2_occupancy_pct  = 0.0,
            c3_occupancy_pct  = 0.0,
        )
        db.add(train)

        # Attach one coach (C1 — General) for the sensor data
        db.add(TrainCoach(
            train_id    = ESP32_TRAIN_ID,
            coach_number= "C1",
            coach_type  = "GENERAL",
            capacity    = ESP32_COACH_CAP,
        ))

        await db.commit()
        print(f"✓  Train '{ESP32_TRAIN_ID}' seeded successfully.")
        print(f"   Coach C1 (GENERAL) — capacity {ESP32_COACH_CAP} passengers.")
        print()
        print("   The serial bridge will now update this train's occupancy")
        print("   and the simulation runner will surface it in station tables.")


if __name__ == "__main__":
    asyncio.run(seed_esp32_train())
