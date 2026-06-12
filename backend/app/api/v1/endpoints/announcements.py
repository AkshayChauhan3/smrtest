from fastapi import APIRouter, Depends
from typing import List

from app.schemas.rail import AnnouncementOut, AnnouncementCreate
from app.services.domain.announcement_service import AnnouncementService, get_announcement_service

router = APIRouter()

@router.get("/active", response_model=List[AnnouncementOut])
async def get_active_announcements(
    service: AnnouncementService = Depends(get_announcement_service)
):
    """Get all active announcements for the passenger app."""
    return await service.get_active_announcements()

@router.post("/broadcast", response_model=AnnouncementOut)
async def broadcast_announcement(
    data: AnnouncementCreate,
    service: AnnouncementService = Depends(get_announcement_service)
):
    """Broadcast a new announcement, simulating PA system and push notifications."""
    return await service.broadcast_announcement(data)
