import cv2
import asyncio
import threading
import json
import time
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

INTERVAL = 30
CAPTURE_DIR = "captures"
frame_lock = threading.Lock()
latest_frame = None
running = True

# Ensure capture directory exists
if not os.path.exists(CAPTURE_DIR):
    os.makedirs(CAPTURE_DIR)

def capture_video():
    global latest_frame, running
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)

    while running:
        ret, frame = cap.read()
        if not ret:
            continue
        frame = cv2.resize(frame, (640, 360))
        with frame_lock:
            latest_frame = frame.copy()
    cap.release()

def save_video_periodically():
    global latest_frame, running
    frame_rate = 24
    frame_list = []

    while running:
        start_time = time.time()
        while time.time() - start_time < INTERVAL:
            with frame_lock:
                if latest_frame is not None:
                    frame_list.append(latest_frame.copy())
            time.sleep(1 / frame_rate)
        if frame_list:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(CAPTURE_DIR, f"{timestamp}.mp4")
            height, width, _ = frame_list[0].shape
            out = cv2.VideoWriter(filename, cv2.VideoWriter_fourcc(*'mp4v'), frame_rate, (width, height))
            for frame in frame_list:
                out.write(frame)
            out.release()
            print(f"Video saved: {filename}")
            frame_list = []

@router.on_event("startup")
def startup_event():
    threading.Thread(target=capture_video, daemon=True).start()
    threading.Thread(target=save_video_periodically, daemon=True).start()

@router.websocket("/ws/video")
async def stream_video(websocket: WebSocket):
    await websocket.accept()
    fps = 24
    quality = 30
    try:
        msg = await websocket.receive_text()
        try:
            config = json.loads(msg)
            fps = min(max(int(config.get("fps", 24)), 1), 30)
            quality = min(max(int(config.get("quality", 60)), 10), 95)
        except Exception as e:
            print("Invalid config:", e)
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        while True:
            with frame_lock:
                frame = latest_frame
            if frame is not None:
                ret, jpeg = cv2.imencode('.jpg', frame, encode_params)
                if ret:
                    try:
                        await asyncio.wait_for(websocket.send_bytes(jpeg.tobytes()), timeout=1 / fps)
                    except asyncio.TimeoutError:
                        continue
            await asyncio.sleep(1 / fps)
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print("WebSocket error:", e)