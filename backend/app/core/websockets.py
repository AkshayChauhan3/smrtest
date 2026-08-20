import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """
        Broadcasts a JSON message to all connected clients.
        If a client fails to receive the message (e.g. disconnected unexpectedly),
        we remove them from the active connections.
        """
        if not self.active_connections:
            return
            
        json_msg = json.dumps(message)
        failed_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json_msg)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket client: {e}")
                failed_connections.append(connection)
                
        # Clean up any dead connections
        for conn in failed_connections:
            self.disconnect(conn)

# Singleton instance to be shared across the application
manager = ConnectionManager()
