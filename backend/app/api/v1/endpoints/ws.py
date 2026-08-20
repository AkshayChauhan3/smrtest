import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websockets import manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/realtime")
async def ws_realtime(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for streaming backend events.
    Clients connect here to receive live updates like occupancy changes and train arrivals.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect the client to send messages, but we need to keep
            # the connection open and detect if the client disconnects.
            data = await websocket.receive_text()
            # If clients send messages, we can just log them for now
            logger.debug(f"Received message from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
