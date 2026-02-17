import asyncio
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)

PING_INTERVAL = 30  # seconds


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, slug: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[slug].append(websocket)
        logger.info("WS connected: %s (total: %d)", slug, len(self.active_connections[slug]))

    def disconnect(self, slug: str, websocket: WebSocket):
        if websocket in self.active_connections[slug]:
            self.active_connections[slug].remove(websocket)
        if not self.active_connections[slug]:
            del self.active_connections[slug]
        logger.info("WS disconnected: %s", slug)

    async def broadcast(self, slug: str, message: dict):
        if slug not in self.active_connections:
            return

        dead = []
        for connection in self.active_connections[slug]:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)

        for connection in dead:
            self.disconnect(slug, connection)

    async def close_all(self, slug: str):
        """Close all connections for a slug and remove from manager."""
        if slug not in self.active_connections:
            return
        for connection in list(self.active_connections[slug]):
            try:
                await connection.close()
            except Exception:
                pass
        self.active_connections.pop(slug, None)
        logger.info("WS closed all connections for: %s", slug)

    async def keepalive(self, websocket: WebSocket):
        """Send periodic pings to keep connection alive."""
        try:
            while True:
                await asyncio.sleep(PING_INTERVAL)
                await websocket.send_json({"type": "ping"})
        except Exception:
            pass


manager = ConnectionManager()
