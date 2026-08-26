import uuid
from fastapi import APIRouter, HTTPException, Body
from typing import Any, Dict
from config import DATA_DIR
from file_helper import read_json, write_json

router = APIRouter()


@router.get("")
@router.get("/")
def get_all():
    return read_json(DATA_DIR / "program.json")


@router.post("/")
def save_program(body: Dict[str, Any] = Body(...)):
    items = read_json(DATA_DIR / "program.json")
    if not isinstance(items, list):
        items = []
    existing_id = body.get("id")
    if existing_id:
        idx = next((i for i, p in enumerate(items) if p.get("id") == existing_id), None)
        if idx is not None:
            items[idx] = {**items[idx], **body}
            write_json(DATA_DIR / "program.json", items)
            return items[idx]
    new_item = {**body, "id": body.get("id") or str(uuid.uuid4())}
    items.append(new_item)
    write_json(DATA_DIR / "program.json", items)
    return new_item


@router.post("/save")
def save_program_alias(body: Dict[str, Any] = Body(...)):
    return save_program(body)


@router.put("/{item_id}")
def update(item_id: str, body: Dict[str, Any] = Body(...)):
    items = read_json(DATA_DIR / "program.json")
    item = next((p for p in items if p.get("id") == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.update(body)
    item["id"] = item_id
    write_json(DATA_DIR / "program.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str):
    items = read_json(DATA_DIR / "program.json")
    write_json(DATA_DIR / "program.json", [p for p in items if p.get("id") != item_id])
    return {"message": "Deleted"}
