from fastapi import APIRouter
from config import DATA_DIR
from file_helper import read_json

router = APIRouter()


@router.get("")
@router.get("/")
def get_pricing():
    pricing = read_json(DATA_DIR / "pricing.json")
    if not isinstance(pricing, dict):
        return pricing
    result = {}
    for table_name, rows in pricing.items():
        if not isinstance(rows, list):
            result[table_name] = rows
            continue
        processed = []
        for row in rows:
            r = dict(row)
            r["grandTotal"] = sum(
                v for k, v in row.items()
                if k not in ("id", "category") and isinstance(v, (int, float))
            )
            processed.append(r)
        result[table_name] = processed
    return result
