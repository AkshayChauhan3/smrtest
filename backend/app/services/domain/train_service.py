"""Train service with repository pattern and simulation fallback."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.repositories.base import (
    TrainRepository,
    StationRepository,
    RouteRepository,
    OccupancyRepository,
    AlertRepository,
    PredictionRepository,
)
from app.schemas.rail import (
    TrainCatalogueOut,
    LineOut,
    StationOut,
    RouteOut,
)
from app.schemas.occupancy import (
    TrainOccupancyOut,
    StationCrowdOut,
)
from app.services.data_service import data_service  # simulation fallback


class TrainService:
    """Service for train operations with fallback to simulation."""

    def __init__(
        self,
        db: AsyncSession,
        train_repo: TrainRepository = Depends(),
        station_repo: StationRepository = Depends(),
        route_repo: RouteRepository = Depends(),
        occupancy_repo: OccupancyRepository = Depends(),
        alert_repo: AlertRepository = Depends(),
        prediction_repo: PredictionRepository = Depends(),
    ):
        self.db = db
        self.train_repo = train_repo
        self.station_repo = station_repo
        self.route_repo = route_repo
        self.occupancy_repo = occupancy_repo
        self.alert_repo = alert_repo
        self.prediction_repo = prediction_repo
        self.sim_service = data_service  # fallback to simulation

    async def get_lines(self) -> List[LineOut]:
        """Get all lines from DB or simulation."""
        # Try DB first
        # TODO: Implement when Lines model is created
        # For now, fallback to simulation
        return self.sim_service.list_lines()

    async def get_stations(self) -> List[StationOut]:
        """Get all stations from DB or simulation."""
        # Try DB first
        stations_db = await self.station_repo.get_all()
        if stations_db:
            return [
                StationOut(
                    id=s.station_id,
                    name=s.name,
                    code=s.station_id,
                    line_name="",  # TODO: join with line
                    is_interchange=s.is_interchange,
                )
                for s in stations_db
            ]
        return self.sim_service.list_stations()

    async def get_routes(self) -> List[RouteOut]:
        """Get all routes from DB or simulation."""
        # Try DB first
        # TODO: Implement when Routes model is created
        return self.sim_service.list_routes()

    async def get_trains(self) -> List[TrainCatalogueOut]:
        """Get all trains from DB or simulation."""
        # Try DB first
        trains_db = await self.train_repo.get_all_active()
        if trains_db:
            # Convert DB models to API schemas
            result = []
            for train in trains_db:
                coaches = await self._get_train_coaches(train.train_id)
                result.append(
                    TrainCatalogueOut(
                        train_id=train.train_id,
                        train_name=train.train_name,
                        line_name=f"{train.line_id} Line",  # TODO: join with line
                        direction=train.direction,
                        current_station="",  # TODO: resolve station ID
                        next_station="",  # TODO: resolve station ID
                        arrival_time=train.created_at.isoformat(),
                        departure_time=train.created_at.isoformat(),
                        current_occupancy=0,  # TODO: get from occupancy snapshot
                        coaches=coaches,
                    )
                )
            return result
        return self.sim_service.list_trains()

    async def get_train_occupancy(
        self, train_id: str
    ) -> Optional[TrainOccupancyOut]:
        """Get occupancy for a specific train."""
        # Try DB first
        occupancy_db = await self.occupancy_repo.get_latest_by_train(train_id)
        if occupancy_db:
            # Convert DB model to API schema
            coaches_db = await self._get_train_coaches(
                occupancy_db.train_id
            )  # TODO: need actual coach occupancy data
            coaches = []
            for coach in coaches_db:
                coaches.append(
                    # This is simplified - real implementation would need per-coach data
                )
            return TrainOccupancyOut(
                train_id=occupancy_db.train_id,
                train_name="",  # TODO: resolve
                station_name="",  # TODO: resolve
                line_name="",  # TODO: resolve
                direction="",  # TODO: resolve
                current_station_crowd=occupancy_db.total_passengers,
                coaches=[],
                updated_at=occupancy_db.timestamp,
            )
        return self.sim_service.get_train_occupancy(train_id)

    async def get_station_crowds(self) -> List[StationCrowdOut]:
        """Get crowd data for all stations."""
        # Try DB first
        # TODO: Implement when station crowd snapshots exist
        return self.sim_service.list_station_crowds()

    async def _get_train_coaches(self, train_id: str) -> List:
        """Helper to get coaches for a train."""
        # TODO: Implement when TrainCoach model is populated
        return []


# Dependency for FastAPI
async def get_train_service(
    db: AsyncSession = Depends(),  # from app.db.session
) -> TrainService:
    """Get train service instance."""
    return TrainService(
        db=db,
        train_repo=TrainRepository(db),
        station_repo=StationRepository(db),
        route_repo=RouteRepository(db),
        occupancy_repo=OccupancyRepository(db),
        alert_repo=AlertRepository(db),
        prediction_repo=PredictionRepository(db),
    )
