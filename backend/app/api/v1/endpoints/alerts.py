from fastapi import APIRouter

from app.schemas.rail import AlertOut

router = APIRouter()


@router.get("", response_model=list[AlertOut])
async def list_alerts() -> list[AlertOut]:
    return []
