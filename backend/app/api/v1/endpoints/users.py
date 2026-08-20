from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.saved_route import SavedRoute
from app.schemas.rail import SavedRouteCreate, SavedRouteOut

router = APIRouter()


@router.get("/{user_id}/saved-routes", response_model=list[SavedRouteOut])
async def list_saved_routes(
    user_id: str,
    db: AsyncSession = Depends(get_db)
) -> list[SavedRouteOut]:
    """Fetch saved routes for the user."""
    result = await db.execute(
        select(SavedRoute).where(SavedRoute.user_id == user_id)
    )
    routes = result.scalars().all()
    return [
        SavedRouteOut(
            id=r.id,
            lineId=r.line_id,
            fromStationId=r.from_station_id,
            toStationId=r.to_station_id,
            label=r.label,
        )
        for r in routes
    ]


@router.post("/{user_id}/saved-routes", status_code=status.HTTP_201_CREATED)
async def create_saved_route(
    user_id: str,
    payload: SavedRouteCreate,
    db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Save a new route preference for the user."""
    db_route = SavedRoute(
        user_id=user_id,
        line_id=payload.lineId,
        from_station_id=payload.fromStationId,
        to_station_id=payload.toStationId,
        label=payload.label,
    )
    db.add(db_route)
    await db.commit()
    return {"status": "success", "message": "Route saved successfully"}
