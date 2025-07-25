from fastapi import APIRouter, Depends, HTTPException, Form , Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Booking
from auth_utils import verify_password, create_access_token, hash_password
from datetime import datetime ,timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import SECRET_KEY, ALGORITHM

auth_router = APIRouter()
oauth2_scheme = HTTPBearer()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Decode JWT and return authenticated user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    print("[DEBUG] Raw credentials:", credentials)

    token = credentials.credentials
    print("[DEBUG] Extracted token:", token)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("[DEBUG] JWT Payload:", payload)
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError as e:
        print("[DEBUG] JWT Error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        print("[DEBUG] No user found with username:", username)
        raise HTTPException(status_code=401, detail="User not found")

    print("[DEBUG] Authenticated user:", user.username)
    return user


# User registration
@auth_router.post("/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=username, password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User registered", "userId": user.id}


# User login and token generation
@auth_router.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "userId": user.id,
        "username": user.username
    }


# Get all current bookings
@auth_router.get("/bookings")
def get_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).join(User).all()
    return [
        {
            "slotTime": b.slot_time.isoformat(),
            "userId": b.user_id,
            "username": db.query(User).filter(User.id == b.user_id).first().username
        }
        for b in bookings
    ]



@auth_router.get("/validate-slot-access")
def validate_slot_access(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59, 999999)
    print("Filter bounds:", start_of_day, "to", end_of_day)
    bookings = (
        db.query(Booking)
        .filter(
            Booking.user_id == user.id,
            Booking.slot_time >= start_of_day,
            Booking.slot_time <= end_of_day,
        )
        .all()
    )
    print(f"NOW: {now} (type: {type(now)})")
    for booking in bookings:
        print(f"SLOT_START: {booking.slot_time} (type: {type(booking.slot_time)})")
        slot_start = booking.slot_time
        slot_end = slot_start + timedelta(minutes=30)
        print(f"Checking if {slot_start} <= {now} <= {slot_end}")
        if slot_start <= now <= slot_end:
            print("ACCESS GRANTED")
            return {"access": True}
    print("ACCESS DENIED")
    return {"access": False}