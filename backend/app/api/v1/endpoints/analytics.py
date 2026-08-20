from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
import logging

from app.db.session import get_db
from app.models.train import OccupancySnapshot
from app.models.route import StationCrowdSnapshot
from app.core.sim_clock import sim_clock

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/heatmap")
async def get_heatmap(db: AsyncSession = Depends(get_db)):
    """Returns a 7x24 matrix for platform heatmap. Queries actual DB history."""
    now = sim_clock.now()
    cutoff = now - timedelta(days=7)
    
    # We query the DB, but since data is wiped every 24h, most days will be 0.
    # We'll pull what we have.
    stmt = (
        select(
            extract('dow', StationCrowdSnapshot.timestamp).label('day'),
            extract('hour', StationCrowdSnapshot.timestamp).label('hour'),
            func.avg(StationCrowdSnapshot.current_crowd).label('avg_crowd')
        )
        .where(StationCrowdSnapshot.timestamp >= cutoff)
        .group_by('day', 'hour')
    )
    res = await db.execute(stmt)
    rows = res.fetchall()
    
    matrix = [[0 for _ in range(24)] for _ in range(7)]
    for row in rows:
        # SQLite 'dow': 0=Sunday, 1=Monday, ..., 6=Saturday
        # We map to 0=Sun, 1=Mon, ..., 6=Sat (no offset needed).
        day_idx = int(row.day) % 7 if row.day is not None else 0
        hr_idx = int(row.hour) if row.hour is not None else 0
        val = int(row.avg_crowd) if row.avg_crowd else 0
        matrix[day_idx][hr_idx] = min(100, int((val / 1000) * 100))  # Scale
        
    return matrix

@router.get("/crowd-forecast")
async def get_crowd_forecast(db: AsyncSession = Depends(get_db)):
    """Returns mathematical forecast for the next 4 hours based on current DB load."""
    now = sim_clock.now()
    
    stmt = select(func.sum(StationCrowdSnapshot.current_crowd)).where(
        StationCrowdSnapshot.timestamp >= now - timedelta(minutes=5)
    )
    res = await db.execute(stmt)
    current_total = res.scalar() or 0
    
    forecast = []
    for i in range(1, 5):
        hour = (now.hour + i) % 24
        multiplier = 1.0
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            multiplier = 1.5
        elif hour < 6 or hour > 22:
            multiplier = 0.3
            
        val = int((current_total * multiplier) + (i * 100))
        forecast.append({"time": f"{hour:02d}:00", "predicted_passengers": max(0, val)})
    return forecast

@router.get("/hourly-flow")
async def get_hourly_flow(db: AsyncSession = Depends(get_db)):
    """Returns passenger boarding vs alighting flow for the day from DB."""
    now = sim_clock.now()
    start_of_day = now.replace(hour=0, minute=0, second=0)
    
    stmt = (
        select(
            extract('hour', OccupancySnapshot.timestamp).label('hour'),
            func.avg(OccupancySnapshot.total_passengers).label('avg_pax')
        )
        .where(OccupancySnapshot.timestamp >= start_of_day)
        .group_by('hour')
        .order_by('hour')
    )
    res = await db.execute(stmt)
    rows = res.fetchall()
    
    flow = []
    for hour in range(6, 23):
        # We estimate boarding/alighting as a fraction of total passengers
        row = next((r for r in rows if int(r.hour or 0) == hour), None)
        total = int(row.avg_pax) if row else 0
        # If DB has no data yet, it naturally returns 0 instead of fake randoms!
        b = int(total * 0.4) 
        a = int(total * 0.35)
        flow.append({"hour": f"{hour:02d}:00", "boarding": b, "alighting": a})
    return flow

@router.get("/weekly-trend")
async def get_weekly_trend(db: AsyncSession = Depends(get_db)):
    """Returns total passenger counts for the past 7 days from DB."""
    now = sim_clock.now()
    cutoff = now - timedelta(days=7)
    
    stmt = (
        select(
            extract('dow', OccupancySnapshot.timestamp).label('day'),
            func.sum(OccupancySnapshot.total_passengers).label('total_pax')
        )
        .where(OccupancySnapshot.timestamp >= cutoff)
        .group_by('day')
    )
    res = await db.execute(stmt)
    rows = res.fetchall()
    
    day_map = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}
    trend_dict = {d: 0 for d in day_map.values()}
    
    for row in rows:
        if row.day is not None:
            # SQLite dow: 0=Sunday — no offset correction needed
            d_name = day_map.get(int(row.day) % 7, "Sun")
            trend_dict[d_name] = int(row.total_pax or 0)
            
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return [{"day": d, "total": trend_dict.get(d, 0)} for d in days]
