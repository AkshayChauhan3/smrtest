"""Base repository interface and implementation."""

from typing import TypeVar, Generic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.train import Train, TrainCoach, OccupancySnapshot
from app.models.station import Station
from app.models.route import Route, RouteStop, StationCrowdSnapshot
from app.models.alert import Alert
from app.models.prediction import Prediction

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, model_id: str) -> ModelType | None:
        result = await self.db.execute(
            select(self.model).where(self.model.id == model_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[ModelType]:
        result = await self.db.execute(select(self.model))
        return list(result.scalars().all())

    async def create(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def delete(self, model_id: str) -> None:
        instance = await self.get_by_id(model_id)
        if instance:
            await self.db.delete(instance)
            await self.db.commit()


class TrainRepository(BaseRepository):
    """Repository for train operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = Train

    async def get_by_train_id(self, train_id: str) -> Train | None:
        result = await self.db.execute(select(Train).where(Train.train_id == train_id))
        return result.scalar_one_or_none()

    async def get_all_active(self) -> list[Train]:
        result = await self.db.execute(select(Train).where(Train.status == "ACTIVE"))
        return list(result.scalars().all())


class StationRepository(BaseRepository):
    """Repository for station operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = Station

    async def get_by_name(self, name: str) -> Station | None:
        result = await self.db.execute(select(Station).where(Station.name == name))
        return result.scalar_one_or_none()

    async def get_interchanges(self) -> list[Station]:
        result = await self.db.execute(select(Station).where(Station.is_interchange == True))
        return list(result.scalars().all())


class RouteRepository(BaseRepository):
    """Repository for route operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = Route

    async def get_by_line(self, line_id: str) -> list[Route]:
        result = await self.db.execute(select(Route).where(Route.line_id == line_id))
        return list(result.scalars().all())

    async def get_by_direction(self, line_id: str, direction: str) -> list[Route]:
        result = await self.db.execute(
            select(Route).where(Route.line_id == line_id, Route.direction == direction)
        )
        return list(result.scalars().all())


class OccupancyRepository(BaseRepository):
    """Repository for occupancy snapshot operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = OccupancySnapshot

    async def get_latest_by_train(self, train_id: str) -> OccupancySnapshot | None:
        result = await self.db.execute(
            select(OccupancySnapshot)
            .where(OccupancySnapshot.train_id == train_id)
            .order_by(OccupancySnapshot.timestamp.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_station(self, station_id: str) -> list[OccupancySnapshot]:
        result = await self.db.execute(
            select(OccupancySnapshot).where(OccupancySnapshot.station_id == station_id)
        )
        return list(result.scalars().all())


class AlertRepository(BaseRepository):
    """Repository for alert operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = Alert

    async def get_active_alerts(self) -> list[Alert]:
        result = await self.db.execute(select(Alert).where(Alert.resolved_at == None))
        return list(result.scalars().all())

    async def get_by_station(self, station_id: str) -> list[Alert]:
        result = await self.db.execute(select(Alert).where(Alert.station_id == station_id))
        return list(result.scalars().all())


class PredictionRepository(BaseRepository):
    """Repository for prediction operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model = Prediction

    async def get_latest_by_train(self, train_id: str) -> Prediction | None:
        result = await self.db.execute(
            select(Prediction)
            .where(Prediction.train_id == train_id)
            .order_by(Prediction.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_station(self, station_name: str) -> list[Prediction]:
        result = await self.db.execute(
            select(Prediction).where(Prediction.station_name == station_name)
        )
        return list(result.scalars().all())
