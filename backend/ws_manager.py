from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # active_connections: ExamID -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Admin connections
        self.admin_connections: List[WebSocket] = []

    async def connect_student(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.active_connections:
            self.active_connections[exam_id] = []
        self.active_connections[exam_id].append(websocket)
        # Notify admins
        await self.broadcast_to_admins(f"Student joined exam {exam_id}")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)

    def disconnect_student(self, websocket: WebSocket, exam_id: int):
        if exam_id in self.active_connections:
            if websocket in self.active_connections[exam_id]:
                self.active_connections[exam_id].remove(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def broadcast_to_exam(self, message: str, exam_id: int):
        if exam_id in self.active_connections:
            for connection in self.active_connections[exam_id]:
                await connection.send_text(message)

    async def broadcast_to_admins(self, message: str):
        for connection in self.admin_connections:
            await connection.send_text(message)

manager = ConnectionManager()
