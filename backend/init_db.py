import asyncio
from app.db.session import engine, SessionLocal
from app.models.base import Base
from app.models.station import Station
from app.models.route import Route, RouteStop
from app.models.train import Train, TrainCoach
from app.models.alert import Alert
from app.db.seeder import seed_database
import logging

logging.basicConfig(level=logging.INFO)

async def init_db():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Seeding database...")
    async with SessionLocal() as session:
        await seed_database(session)
        
    print("Database initialization complete!")

if __name__ == "__main__":
    asyncio.run(init_db())
