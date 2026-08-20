from fastapi import APIRouter, Query, Depends, HTTPException

from app.schemas.rail import AlertOut
from app.services.domain.alert_service import AlertService, get_alert_service

router = APIRouter()

@router.get("", response_model=list[AlertOut])
async def list_alerts(
    station_name: str | None = Query(None),
    sim_time: str | None = Query(None, description="Simulate time as HH:MM", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"),
    alert_service: AlertService = Depends(get_alert_service)
) -> list[AlertOut]:
    return await alert_service.list_alerts(station_name=station_name)

@router.get("/emergency", response_model=dict)
async def get_emergency_status(
    alert_service: AlertService = Depends(get_alert_service)
) -> dict[str, bool]:
    is_active = await alert_service.get_emergency_status()
    return {"active": is_active}

@router.post("/{alert_id}/acknowledge", response_model=dict)
async def acknowledge_alert(
    alert_id: str,
    alert_service: AlertService = Depends(get_alert_service)
) -> dict[str, str | bool]:
    success = await alert_service.acknowledge_alert(alert_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "message": "Alert acknowledged."}

@router.post("/{alert_id}/resolve", response_model=dict)
async def resolve_alert(
    alert_id: str,
    alert_service: AlertService = Depends(get_alert_service)
) -> dict[str, str | bool]:
    success = await alert_service.resolve_alert(alert_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "message": "Alert resolved."}
