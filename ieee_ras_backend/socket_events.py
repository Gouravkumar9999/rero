from socketio import AsyncServer
from database import SessionLocal
from models import User, Booking
from jose import jwt, JWTError
from config import SECRET_KEY, ALGORITHM
from datetime import datetime
import logging
import traceback

logger = logging.getLogger("socket_events")
logger.setLevel(logging.INFO)

connected_users = {}  # sid -> user_id
sio = None  # Global socket server ref

SLOT_TIMES = [
    f"{hour:02}:{minute:02}"
    for hour in range(24)
    for minute in (0, 30)
]

def get_slot_datetime(slot_str):
    hour, minute = map(int, slot_str.split(":"))
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return today.replace(hour=hour, minute=minute)

def register_socket_events(socketio_server: AsyncServer):
    global sio
    sio = socketio_server

    async def _emit(event, data, room="__broadcast__"):
        try:
            await sio.emit(event, data, room=room)
        except Exception as e:
            logger.error("Emit failed for %s: %s\n%s", event, e, traceback.format_exc())

    async def get_user_and_slot(sid, slot_str):
        if slot_str not in SLOT_TIMES:
            print("[DEBUG] Slot not in SLOT_TIMES")
            await _emit("booking-error", {"message": "Invalid slot selected"}, room=sid)
            return None, None, None, None

        slot_time = get_slot_datetime(slot_str)
        user_id = connected_users.get(sid)
        if not user_id:
            print("[DEBUG] SID not in connected_users")
            await _emit("booking-error", {"message": "Authentication required"}, room=sid)
            return None, None, None, None
        db = SessionLocal()
        existing = db.query(Booking).filter(Booking.slot_time == slot_time).first()
        return db, slot_time, user_id, existing

    @sio.event
    async def connect(sid, environ, auth):
        try:
            token = auth.get('token') if auth else None
            if not token:
                auth_header = environ.get('HTTP_AUTHORIZATION', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]

            if not token:
                raise ConnectionRefusedError("Missing auth token")

            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if not username:
                raise ConnectionRefusedError("Invalid token payload")

            db = SessionLocal()
            user = db.query(User).filter(User.username == username).first()
            db.close()
            if not user:
                raise ConnectionRefusedError("User not found")

            await sio.save_session(sid, {"user_id": user.id, "username": user.username})
            connected_users[sid] = user.id
            await sio.enter_room(sid, "__broadcast__")
            logger.info("[Socket] %s connected (SID: %s)", user.username, sid)
            return True

        except (JWTError, Exception) as e:
            logger.error("[Socket] Connection error: %s", e)
            return False

    @sio.event
    async def disconnect(sid):
        user_id = connected_users.pop(sid, None)
        if user_id:
            logger.info("[Socket] User %s disconnected (SID: %s)", user_id, sid)

    @sio.on("book-slot")
    async def handle_book_slot(sid, data):
        db, slot_time, user_id, existing = await get_user_and_slot(sid, data.get("slotTime"))
        if not db:
            return

        try:
            if existing:
                if existing.user_id == user_id:
                    await _emit("booking-error", {"message": "You already booked this slot"}, room=sid)
                else:
                    other_user = db.query(User).filter(User.id == existing.user_id).first()
                    await _emit("booking-error", {
                        "message": f"Slot already booked by {other_user.username if other_user else 'someone'}"
                    }, room=sid)
                return

            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                await _emit("booking-error", {"message": "User not found"}, room=sid)
                return

            period = data.get("slotPeriod", "AM")
            db.add(Booking(
                user_id=user_id,
                username=user.username,
                slot_time=slot_time,
                slot_period=period
            ))
            db.commit()

            await _emit("slot-updated", {
                "slotTime": slot_time.strftime("%H:%M"),
                "userId": user_id,
                "username": user.username
            })

        except Exception as e:
            logger.error("[Socket] Booking error: %s", e)
            await _emit("booking-error", {"message": "Server error during booking"}, room=sid)
        finally:
            db.close()

    @sio.on("unbook-slot")
    async def handle_unbook_slot(sid, data):
        db, slot_time, user_id, existing = await get_user_and_slot(sid, data.get("slotTime"))
        if not db:
            return
        
        try:
            if not existing or existing.user_id != user_id:
                await _emit("booking-error", {"message": "You can only unbook your own slot"}, room=sid)
                return

            db.delete(existing)
            db.commit()

            await _emit("slot-cleared", {
                "slotTime": slot_time.strftime("%H:%M")
            })

        except Exception as e:
            logger.error("[Socket] Unbooking error: %s", e)
            await _emit("booking-error", {"message": "Server error during unbooking"}, room=sid)
        finally:
            db.close()
