"""
Neuro-Twin FastAPI Server with WebSocket Support
Connects React frontend to MagnonicController backend
"""
import asyncio
import json
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from neuro_controller import MagnonicController

app = FastAPI(title="Neuro-Twin API", version="1.0.0")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize controller
controller = MagnonicController()


class SimulationRequest(BaseModel):
    theta: float = 0.5
    beta: float = 0.5
    action: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "controller": "ready"}


@app.post("/api/simulate")
async def simulate(request: SimulationRequest):
    """Single simulation request"""
    if request.action:
        result = controller.simulate_action_pattern(request.action)
    else:
        result = controller.process_eeg_stream(request.theta, request.beta)
    return result


@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    """
    WebSocket endpoint for real-time EEG -> Kinematics streaming.
    
    Client sends: {"theta": 0.5, "beta": 0.5} or {"action": "WALK"}
    Server responds: {"joint_angles": [...], "fluidity_index": 0.8, ...}
    """
    await websocket.accept()
    print("[WebSocket] Client connected")
    
    try:
        while True:
            # Receive EEG parameters from client
            data = await websocket.receive_text()
            params = json.loads(data)
            
            # Process through MagnonicController
            if "action" in params:
                result = controller.simulate_action_pattern(params["action"])
            else:
                theta = params.get("theta", 0.5)
                beta = params.get("beta", 0.5)
                result = controller.process_eeg_stream(theta, beta)
            
            # Send kinematics back to client
            await websocket.send_json(result)
            
            # Rate limit to ~30 FPS
            await asyncio.sleep(0.033)
            
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
    except Exception as e:
        print(f"[WebSocket] Error: {e}")


@app.websocket("/ws/stream")
async def websocket_auto_stream(websocket: WebSocket):
    """
    Auto-streaming mode: Server pushes simulation data continuously.
    Useful for demo/visualization without user input.
    """
    await websocket.accept()
    print("[WebSocket] Auto-stream client connected")
    
    actions = ["STAND", "WALK", "RUN", "WALK", "STAND"]
    action_idx = 0
    frame_count = 0
    
    try:
        while True:
            # Cycle through actions every 50 frames (~1.5s each)
            if frame_count % 50 == 0:
                action_idx = (action_idx + 1) % len(actions)
            
            action = actions[action_idx]
            result = controller.simulate_action_pattern(action)
            result["current_action"] = action
            
            await websocket.send_json(result)
            frame_count += 1
            
            # ~30 FPS
            await asyncio.sleep(0.033)
            
    except WebSocketDisconnect:
        print("[WebSocket] Auto-stream client disconnected")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
