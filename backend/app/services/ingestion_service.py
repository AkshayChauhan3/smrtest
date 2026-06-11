import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.ingestion import SensorEvent
from app.models.train import Train
from app.services.domain.occupancy_service import OccupancyService, get_occupancy_service

logger = logging.getLogger(__name__)

class IngestionService:
    def __init__(self, db: AsyncSession, occupancy_service: OccupancyService, alert_engine: 'AlertEngine'):
        self.db = db
        self.occupancy_service = occupancy_service
        self.alert_engine = alert_engine

    async def process_event(self, event: SensorEvent) -> bool:
        """
        Processes an incoming sensor event and persists it to the database.
        """
        logger.info(f"Ingested event: {event.event_type} for train {event.train_id} at {event.timestamp}")
        
        try:
            # Update the Train's current station
            result = await self.db.execute(select(Train).where(Train.train_id == event.train_id))
            train = result.scalar_one_or_none()
            
            if train:
                train.current_station_id = event.station_id
                # Calculate total passengers from coaches
                total_passengers = sum(c.passenger_count for c in event.coaches)
                
                # Format coach data for JSON storage
                coach_data = [
                    {
                        "coach_number": c.coach_id,
                        "coach_type": "standard", # Simplified
                        "capacity": 400,
                        "current_passenger_count": c.passenger_count,
                        "occupancy_percentage": c.occupancy_percentage,
                        "occupancy_status": "high" if c.occupancy_percentage > 80 else "moderate",
                    }
                    for c in event.coaches
                ]
                
                # Persist the Occupancy Snapshot
                await self.occupancy_service.create_occupancy_snapshot(
                    train_id=event.train_id,
                    station_id=event.station_id or train.current_station_id,
                    total_passengers=total_passengers,
                    coach_data=coach_data
                )
                
                # Also commit the train update
                self.db.add(train)
                await self.db.commit()
                
                # Broadcast the live event to any connected WebSocket clients
                from app.core.websockets import manager
                await manager.broadcast({
                    "event_type": "occupancy_update",
                    "data": {
                        "train_id": event.train_id,
                        "station_id": event.station_id or train.current_station_id,
                        "total_passengers": total_passengers,
                        "timestamp": event.timestamp.isoformat() if hasattr(event.timestamp, "isoformat") else str(event.timestamp)
                    }
                })
                
                # Evaluate rules via Alert Engine
                await self.alert_engine.evaluate_occupancy_snapshot(event, total_passengers)
                
            return True
        except Exception as e:
            logger.error(f"Error processing ingestion event: {e}")
            await self.db.rollback()
            return False

from app.services.engine.alert_engine import AlertEngine, get_alert_engine

async def get_ingestion_service(
    db: AsyncSession = Depends(get_db),
    occupancy_service: OccupancyService = Depends(get_occupancy_service),
    alert_engine: AlertEngine = Depends(get_alert_engine)
) -> IngestionService:
    return IngestionService(db, occupancy_service, alert_engine)
