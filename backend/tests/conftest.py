import pytest
import os
import asyncio

# Force testing database URL before any application code is imported
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///test_temp.db"

from app.db.session import engine, SessionLocal
from app.models.base import Base
from app.db.seeder import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Ensure any stale test database is removed
    if os.path.exists("test_temp.db"):
        try:
            os.remove("test_temp.db")
        except Exception:
            pass
        
    # Initialize schema and seed data
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with SessionLocal() as session:
            await seed_database(session)
            
    asyncio.run(init_db())
    
    yield
    
    # Clean up connection pool and file
    async def cleanup():
        await engine.dispose()
    asyncio.run(cleanup())
    
    if os.path.exists("test_temp.db"):
        try:
            os.remove("test_temp.db")
        except Exception:
            pass
