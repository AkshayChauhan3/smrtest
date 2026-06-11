"""Occupancy service with repository pattern and simulation fallback."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.repositories.base import (
    OccupancyRepository,
    StationRepository,
    TrainRepository,
)
from app.schemas.occupancy import (
    TrainOccupancyOut,
    CoachOccupancyOut,
    StationCrowdOut,
)
from app.services.data_service import data_service


class OccupancyService:
    """Service for occupancy operations with fallback to simulation."""

    def __init__(
        self,
        db: AsyncSession,
        occupancy_repo: OccupancyRepository = Depends(),
        station_repo: StationRepository = Depends(),
        train_repo: TrainRepository = Depends(),
    ):
        self.db = db
        self.occupancy_repo = occupancy_repo
        self.station_repo = station_repo
        self.train_repo = train_repo
        self.sim_service = data_service  # fallback to simulation

    async def get_train_occupancy(
        self, train_id: str
    ) -> Optional[TrainOccupancyOut]:
        """Get occupancy for a specific train."""
        # Try DB first
        occupancy_db = await self.occupancy_repo.get_latest_by_train(train_id)
        if occupancy_db:
            # Convert DB model to API schema
            train = await self.train_repo.get_by_train_id(train_id)
            station = await self.station_repo.get_by_id(
                occupancy_db.station_id
            ) if occupancy_db.station_id else None

            return TrainOccupancyOut(
                train_id=occupancy_db.train_id,
                train_name=train.train_name if train else "",
                station_name=station.name if station else "",
                line_name="",  # TODO: resolve from train.line_id
                direction="",  # TODO: resolve from train.direction
                current_station_crowd=occupancy_db.total_passengers,
                coaches=[],  # TODO: expand coach_data JSON
                updated_at=occupancy_db.timestamp,
            )
        # Fallback to simulation
        return self.sim_service.get_train_occupancy(train_id)

    async def get_all_train_occupancy(self) -> List[TrainOccupancyOut]:
        """Get occupancy for all trains."""
        # Try DB first
        # For now, use simulation (needs optimization for bulk DB queries)
        return self.sim_service.list_train_occupancy()

    async def get_station_crowds(self) -> List[StationCrowdOut]:
        """Get crowd data for all stations."""
        # Try DB first
        # TODO: Implement station crowd snapshots
        return self.sim_service.list_station_crowds()

    async def create_occupancy_snapshot(
        self,
        train_id: str,
        station_id: str,
        total_passengers: int,
        coach_data: Optional[dict] = None,
    ) -> TrainOccupancyOut:
        """Create a new occupancy snapshot from sensor/ingestion."""
        from app.models.train import OccupancySnapshot

        snapshot = OccupancySnapshot(
            train_id=train_id,
            station_id=station_id,
            total_passengers=total_passengers,
            coach_data=coach_data,
        )
        self.db.add(snapshot)
        await self.db.commit()
        await self.db.refresh(snapshot)

        # Return API schema
        train = await self.train_repo.get_by_train_id(train_id)
        station = await self.station_repo.get_by_id(station_id)

        return TrainOccupancyOut(
            train_id=snapshot.train_id,
            train_name=train.train_name if train else "",
            station_name=station.name if station else "",
            line_name="",
            direction="",
            current_station_crowd=snapshot.total_passengers,
            coaches=[],
            updated_at=snapshot.timestamp,
        )


async def get_occupancy_service(
    db: AsyncSession = Depends(),
) -> OccupancyService:
    """Get occupancy service instance."""
    return OccupancyService(
        db=db,
        occupancy_repo=OccupancyRepository(db),
        station_repo=StationRepository(db),
        train_repo=TrainRepository(db),
    )
