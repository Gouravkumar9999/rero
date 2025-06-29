from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import Booking
from routes.auth_routes import get_current_user

router = APIRouter()

def parse_slot_period(slot_period: str):
    # Assumes slot_period is like "00:30" for 30 minutes
    hours, minutes = map(int, slot_period.split(":"))
    return timedelta(hours=hours, minutes=minutes)

@router.get("/check-slot-access")
def check_slot_access(user=Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now()
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .all()
    )
    for booking in bookings:
        slot_start = booking.slot_time
        duration = parse_slot_period(booking.slot_period)
        slot_end = slot_start + duration
        if slot_start <= now <= slot_end:
            return {"access": True, "slot_start": slot_start, "slot_end": slot_end}
    raise HTTPException(status_code=403, detail="No active slot")