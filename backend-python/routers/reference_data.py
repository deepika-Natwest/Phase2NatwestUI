from fastapi import APIRouter
from config import DATA_DIR
from file_helper import read_json

router = APIRouter()


@router.get("")
@router.get("/")
def get_reference_data():
    return read_json(DATA_DIR / "reference-data.json")
