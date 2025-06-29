from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    userId: int
    username: str
class BookingCreate(BaseModel):
    user_id: int
    slot_time: datetime
    slot_period: str

class BookingOut(BaseModel):
    id: int
    user_id: int
    slot_time: datetime
    slot_period: str

    class Config:
        orm_mode = True