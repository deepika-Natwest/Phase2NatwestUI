from fastapi import APIRouter, Depends
from config import DATA_DIR
from file_helper import read_json
from dependencies import get_current_user

router = APIRouter()


@router.get("/data")
def get_public_dashboard():
    return read_json(DATA_DIR / "public-dashboard.json")


@router.get("")
@router.get("/")
def get_admin_dashboard(user: dict = Depends(get_current_user)):
    return {"message": f"Welcome {user.get('username')} to Admin Dashboard"}
