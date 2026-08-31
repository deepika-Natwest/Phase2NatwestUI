import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import DATA_DIR
from file_helper import read_json, write_json

router = APIRouter()


class CapabilityBody(BaseModel):
    name: str


@router.get("")
@router.get("")
def get_all():
    return read_json(DATA_DIR / "capabilities.json")


@router.post("", status_code=201)
@router.post("", status_code=201)
def create(body: CapabilityBody):
    items = read_json(DATA_DIR / "capabilities.json")
    new_item = {"id": str(uuid.uuid4()), "name": body.name}
    items.append(new_item)
    write_json(DATA_DIR / "capabilities.json", items)
    return new_item


@router.put("/{item_id}")
def update(item_id: str, body: CapabilityBody):
    items = read_json(DATA_DIR / "capabilities.json")
    item = next((c for c in items if c["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item["name"] = body.name
    write_json(DATA_DIR / "capabilities.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str):
    items = read_json(DATA_DIR / "capabilities.json")
    write_json(DATA_DIR / "capabilities.json", [c for c in items if c["id"] != item_id])
    return {"message": "Deleted"}
