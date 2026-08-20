from fastapi import APIRouter, status, Depends
from app.schemas.ingestion import SensorEvent, IngestionResponse
from app.services.ingestion_service import IngestionService, get_ingestion_service

router = APIRouter()

@router.post("/events", response_model=IngestionResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_event(
    event: SensorEvent,
    ingestion_service: IngestionService = Depends(get_ingestion_service)
):
    """
    Ingest a telemetry or sensor event from the simulation or hardware layer.
    """
    success = await ingestion_service.process_event(event)
    
    if success:
        return IngestionResponse(status="accepted", processed_events=1)
    else:
        return IngestionResponse(status="failed", processed_events=0)
