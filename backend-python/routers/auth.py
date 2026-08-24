from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, status
from jose import jwt
import bcrypt as _bcrypt
from pydantic import BaseModel
from config import DATA_DIR, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRES_IN_HOURS
from file_helper import read_json

router = APIRouter()


def _verify_password(plain: str, stored: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), stored.encode())
    except Exception:
        return plain == stored


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginRequest):
    users = read_json(DATA_DIR / "users.json")
    user = next(
        (u for u in users if str(u.get("enterpriseId", "")).lower() == body.username.lower()),
        None,
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not _verify_password(body.password, user.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_IN_HOURS)
    token = jwt.encode(
        {
            "id": user.get("id"),
            "role": user.get("role"),
            "username": user.get("enterpriseId"),
            "exp": exp,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return {"token": token, "role": user.get("role")}
