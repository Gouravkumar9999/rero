import subprocess
import uuid
import os
import shutil
import asyncio
import serial
from fastapi import APIRouter, Depends, HTTPException, WebSocket, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import SessionLocal
from models import User, Booking
from routes.auth_routes import get_current_user
from config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from starlette.websockets import WebSocketState

router = APIRouter(prefix="/arduino", tags=["arduino"])

ARDUINO_CLI = "/opt/homebrew/bin/arduino-cli"
ARDUINO_PORT = "/dev/ttyUSB0"  # Change if not correct for your board
FQBN = "arduino:avr:uno"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_slot_access(user, db):
    now = datetime.now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59, 999999)
    bookings = (
        db.query(Booking)
        .filter(
            Booking.user_id == user.id,
            Booking.slot_time >= start_of_day,
            Booking.slot_time <= end_of_day,
        )
        .all()
    )
    for booking in bookings:
        slot_start = booking.slot_time
        slot_end = slot_start + timedelta(minutes=30)
        if slot_start <= now <= slot_end:
            return True
    return False

class ArduinoCode(BaseModel):
    code: str

@router.post("/compile")
async def compile_code(
    arduino_code: ArduinoCode,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not check_slot_access(user, db):
        raise HTTPException(status_code=403, detail="No active slot access")
    unique_id = uuid.uuid4()
    folder_path = f"./codes/{unique_id}"
    file_path = f"{folder_path}/{unique_id}.ino"

    os.makedirs(folder_path, exist_ok=True)
    with open(file_path, "w") as f:
        f.write(arduino_code.code)

    try:
        result = subprocess.run(
            [ARDUINO_CLI, "compile", "--fqbn", FQBN, file_path],
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode == 0:
            try:
                shutil.rmtree(folder_path)
            except FileNotFoundError:
                pass
            return {"status": "ok", "warnings": result.stderr if result.stderr else None}
        else:
            try:
                shutil.rmtree(folder_path)
            except FileNotFoundError:
                pass
            raise HTTPException(status_code=400, detail=result.stderr)
    except Exception as e:
        try:
            shutil.rmtree(folder_path)
        except FileNotFoundError:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    token = websocket.query_params.get("token")
    if not token:
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            if websocket.application_state != WebSocketState.DISCONNECTED:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user = db.query(User).filter(User.username == username).first()
    if not user or not check_slot_access(user, db):
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        while True:
            code = await websocket.receive_text()
            unique_id = uuid.uuid4()
            folder_path = f"./codes/{unique_id}"
            file_path = f"{folder_path}/{unique_id}.ino"

            os.makedirs(folder_path, exist_ok=True)
            with open(file_path, "w") as f:
                f.write(code)

            try:
                # Compile
                compile_result = subprocess.run(
                    [ARDUINO_CLI, "compile", "--fqbn", FQBN, file_path],
                    capture_output=True,
                    text=True,
                    check=False,
                )

                if compile_result.returncode != 0:
                    await websocket.send_text(f"Compilation failed: {compile_result.stderr}")
                    try:
                        shutil.rmtree(folder_path)
                    except FileNotFoundError:
                        pass
                    continue

                # Upload
                upload_result = subprocess.run(
                    [ARDUINO_CLI, "upload", "-p", ARDUINO_PORT, "--fqbn", FQBN, file_path],
                    capture_output=True,
                    text=True,
                    check=False,
                )

                if upload_result.returncode != 0:
                    await websocket.send_text(f"Upload failed: {upload_result.stderr}")
                    try:
                        shutil.rmtree(folder_path)
                    except FileNotFoundError:
                        pass
                    continue

                await websocket.send_text("Upload successful, monitoring serial output...")

                try:
                    ser = serial.Serial(ARDUINO_PORT, 9600, timeout=1)
                    while True:
                        line = ser.readline().decode("utf-8", errors="ignore").strip()
                        if line:
                            await websocket.send_text(line)
                        await asyncio.sleep(0.01)
                except serial.SerialException as e:
                    await websocket.send_text(f"Serial error: {str(e)}")
                finally:
                    try:
                        ser.close()
                    except Exception:
                        pass

            except Exception as e:
                await websocket.send_text(f"Error: {str(e)}")
            finally:
                try:
                    shutil.rmtree(folder_path)
                except FileNotFoundError:
                    pass

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Only close if not already closed
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close()