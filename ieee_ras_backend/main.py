from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from routes.auth_routes import auth_router
from database import Base, engine, SessionLocal
from socket_events import register_socket_events
from booking import router as booking_router
from slot_access import router as slot_access_router

# === Setup Socket.IO ===
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='http://localhost:3000')
register_socket_events(sio)

# === Setup FastAPI ===
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Create Tables ===
Base.metadata.create_all(bind=engine)

# === Register Auth Routes ===
fastapi_app.include_router(auth_router)
fastapi_app.include_router(booking_router)
fastapi_app.include_router(slot_access_router)

# === Combine FastAPI + SocketIO ===
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)  # use from same namespace
