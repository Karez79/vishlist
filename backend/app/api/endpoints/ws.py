import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.ws_manager import manager

router = APIRouter()


@router.websocket("/ws/{slug}")
async def wishlist_ws(websocket: WebSocket, slug: str):
    await manager.connect(slug, websocket)
    keepalive_task = asyncio.create_task(manager.keepalive(websocket))
    try:
        while True:
            # We don't expect client messages, but need to read to detect disconnect
            data = await websocket.receive_text()
            # Client can send "pong" in response to ping — ignore
    except WebSocketDisconnect:
        pass
    finally:
        keepalive_task.cancel()
        manager.disconnect(slug, websocket)
