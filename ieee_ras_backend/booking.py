from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Booking
from datetime import datetime

router = APIRouter()

@router.get("/bookings")
def get_bookings(db: Session = Depends(get_db)):
    today = datetime.now().date()
    bookings = (
        db.query(Booking)
        .filter(Booking.slot_time >= datetime.combine(today, datetime.min.time()))
        .filter(Booking.slot_time < datetime.combine(today, datetime.max.time()))
        .all()
    )

    result = []
    for booking in bookings:
        time_str = booking.slot_time.strftime("%H:%M")
        result.append({
            "slotTime": time_str,
            "userId": booking.user_id,
            "username": booking.username
        })
    return result
