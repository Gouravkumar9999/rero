# config.py
import os
from pathlib import Path

# Load .env from same directory as config.py
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

# Configuration with clear fallbacks
SECRET_KEY = os.getenv("SECRET_KEY", "a8gRzEczpi__y9t-KLvmAp84HTY94zytBr-vGFUuT9E")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
