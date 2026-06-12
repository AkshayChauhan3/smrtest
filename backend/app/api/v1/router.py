from fastapi import APIRouter

from app.api.v1.endpoints import alerts, auth, catalog, dashboard, occupancy, stations, trains, ingestion, ws, predictions,users,announcements

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(occupancy.router, prefix="/occupancy", tags=["occupancy"])
api_router.include_router(stations.router, prefix="/stations", tags=["stations"])
api_router.include_router(trains.router, prefix="/trains", tags=["trains"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])
