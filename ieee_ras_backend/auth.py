from fastapi import APIRouter, HTTPException, Depends ,Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Booking
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
auth_router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    id: int
    username: str
    access_token: str
    token_type: str = "bearer"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def authenticate_user(db: Session, username: str, password: str):
    logger.info(f"Authenticating user: {username}")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        logger.warning(f"User not found: {username}")
        return None
    if not verify_password(password, user.password):
        logger.warning(f"Invalid password for user: {username}")
        return None
    logger.info(f"User authenticated: {username}")
    return user

def create_access_token(data: dict):
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        logger.info(f"Creating token with data: {to_encode}")
        print("[DEBUG] Token created with SECRET_KEY:", SECRET_KEY)

        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"Token created successfully")
        
        # Verify the token can be decoded
        try:
            decoded = jwt.decode(encoded_jwt, SECRET_KEY, algorithms=[ALGORITHM])
            logger.info(f"Token self-verification successful for: {decoded.get('sub')}")
        except JWTError as e:
            logger.error(f"CRITICAL: Generated token cannot be verified! {str(e)}")
            raise
        
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Token generation failed")

@auth_router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt for username: {form_data.username}")
        
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Login failed for username: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        access_token = create_access_token(data={"sub": user.username})
        print("[DEBUG] >>> Token sent to client:", access_token)
        
        logger.info(f"Login successful for user: {user.username}")
        
        return {
            "id": user.id,
            "username": user.username,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise


