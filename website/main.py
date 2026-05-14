from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio

app = FastAPI(title="TOPOS")

templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"))

# Track connected WebSocket clients
connected_clients: list[WebSocket] = []

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})


@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        connected_clients.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
