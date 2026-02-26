from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from typing import Optional
from jose import JWTError, jwt
import ws_manager, models, config, database
from routers.auth import oauth2_scheme

router = APIRouter(
    prefix="/ws",
    tags=["websockets"]
)

def get_user_from_token(token: str, db):
    """Helper to validate websocket token."""
    try:
        payload = jwt.decode(token, config.settings.SECRET_KEY, algorithms=[config.settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = db.query(models.User).filter(models.User.username == username).first()
        return user
    except JWTError:
        return None

@router.websocket("/exam/{exam_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    exam_id: int, 
    token: Optional[str] = Query(None)
):
    db = next(database.get_db())
    try:
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user = get_user_from_token(token, db)
        if not user or user.role != models.UserRole.STUDENT:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await ws_manager.manager.connect_student(websocket, exam_id)
        try:
            while True:
                data = await websocket.receive_text()
                await ws_manager.manager.broadcast_to_admins(f"Exam {exam_id} - {user.username}: {data}")
        except WebSocketDisconnect:
            ws_manager.manager.disconnect_student(websocket, exam_id)
            await ws_manager.manager.broadcast_to_admins(f"Student {user.username} disconnected from exam {exam_id}")
    finally:
        db.close()

@router.websocket("/admin")
async def websocket_admin_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    db = next(database.get_db())
    try:
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user = get_user_from_token(token, db)
        if not user or user.role not in [models.UserRole.ADMIN, models.UserRole.TEACHER]:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await ws_manager.manager.connect_admin(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            ws_manager.manager.disconnect_admin(websocket)
    finally:
        db.close()
