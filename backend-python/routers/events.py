import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from pathlib import Path
from config import DATA_DIR, UPLOAD_DIR
from file_helper import read_json, write_json
from dependencies import require_roles

router = APIRouter()
_DIR = UPLOAD_DIR / "events"


def _save(file: UploadFile, folder: Path) -> str:
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    name = f"{uuid.uuid4()}{ext}"
    with open(folder / name, "wb") as f:
        f.write(file.file.read())
    return name


@router.get("/")
def get_all():
    return read_json(DATA_DIR / "events.json")


@router.post("/", status_code=201)
def create(
    eventName: str = Form(...),
    date: Optional[str] = Form(None),
    tag: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    eventImage: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    img = _save(eventImage, _DIR) if eventImage and eventImage.filename else None
    item = {
        "id": str(uuid.uuid4()), "eventName": eventName, "date": date,
        "tag": tag, "location": location, "description": description,
        "status": status, "eventImage": img,
    }
    items = read_json(DATA_DIR / "events.json")
    items.append(item)
    write_json(DATA_DIR / "events.json", items)
    return item


@router.put("/{item_id}")
def update(
    item_id: str,
    eventName: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    tag: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    eventImage: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    items = read_json(DATA_DIR / "events.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field, val in {
        "eventName": eventName, "date": date, "tag": tag,
        "location": location, "description": description, "status": status,
    }.items():
        if val is not None:
            item[field] = val
    if eventImage and eventImage.filename:
        old = item.get("eventImage")
        if old and (_DIR / old).exists():
            os.remove(_DIR / old)
        item["eventImage"] = _save(eventImage, _DIR)
    write_json(DATA_DIR / "events.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str, _user: dict = Depends(require_roles(["ADMIN"]))):
    items = read_json(DATA_DIR / "events.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if item:
        img = item.get("eventImage")
        if img and (_DIR / img).exists():
            os.remove(_DIR / img)
    write_json(DATA_DIR / "events.json", [i for i in items if i["id"] != item_id])
    return {"message": "Deleted"}
