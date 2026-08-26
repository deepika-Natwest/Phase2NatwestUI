import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import DATA_DIR
from file_helper import read_json, write_json

router = APIRouter()
_FILE = DATA_DIR / "user-statuses.json"


class StatusBody(BaseModel):
    name: str


@router.get("")
@router.get("/")
def get_all():
    return read_json(_FILE)


@router.post("/", status_code=201)
def create(body: StatusBody):
    items = read_json(_FILE)
    new_item = {"id": str(uuid.uuid4()), "name": body.name}
    items.append(new_item)
    write_json(_FILE, items)
    return new_item


@router.put("/{item_id}")
def update(item_id: str, body: StatusBody):
    items = read_json(_FILE)
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item["name"] = body.name
    write_json(_FILE, items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str):
    items = read_json(_FILE)
    write_json(_FILE, [i for i in items if i["id"] != item_id])
    return {"message": "Deleted"}
