import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (same as Node.js backend behaviour)
_root = Path(__file__).parent.parent
load_dotenv(_root / ".env")
load_dotenv(Path(__file__).parent / ".env", override=False)

PORT = int(os.getenv("PORT", "5000"))
JWT_SECRET = os.getenv("JWT_SECRET", "mySuperSecretKey123")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN_HOURS = 1

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGIN", "http://localhost:3000").split(",")]

# Data and upload directories
DATA_DIR = Path(__file__).parent / "data"
UPLOAD_DIR = Path(__file__).parent / "uploads"

# LLM
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# User config constants (used by reference-data / upload validation)
GENDER_OPTIONS = ["Male", "Female", "Other"]
CAREER_LEVELS = [f"Level {i}" for i in range(1, 13)]
LOCATIONS = ["Pune", "Mumbai", "London", "Bangalore"]
RECOGNITION_TYPES = [
    "Employee of the Month",
    "Team Player",
    "Innovation Award",
    "Leadership Award",
]
