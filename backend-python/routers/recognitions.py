import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from pathlib import Path
from config import DATA_DIR, UPLOAD_DIR
from file_helper import read_json, write_json
from dependencies import require_roles

router = APIRouter()
_DIR = UPLOAD_DIR / "recognitions"


def _save(file: UploadFile, folder: Path) -> str:
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    name = f"{uuid.uuid4()}{ext}"
    with open(folder / name, "wb") as f:
        f.write(file.file.read())
    return name


@router.get("/")
def get_all():
    return read_json(DATA_DIR / "recognitions.json")


@router.post("/", status_code=201)
def create(
    name: str = Form(...),
    designation: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    recognitionType: Optional[str] = Form(None),
    recognitionTag: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    recognitionDate: Optional[str] = Form(None),
    pic: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    img = _save(pic, _DIR) if pic and pic.filename else None
    item = {
        "id": str(uuid.uuid4()), "name": name, "designation": designation,
        "location": location, "recognitionType": recognitionType,
        "recognitionTag": recognitionTag, "shortDescription": shortDescription,
        "recognitionDate": recognitionDate, "pic": img,
    }
    items = read_json(DATA_DIR / "recognitions.json")
    items.append(item)
    write_json(DATA_DIR / "recognitions.json", items)
    return item


@router.put("/{item_id}")
def update(
    item_id: str,
    name: Optional[str] = Form(None),
    designation: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    recognitionType: Optional[str] = Form(None),
    recognitionTag: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    recognitionDate: Optional[str] = Form(None),
    pic: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    items = read_json(DATA_DIR / "recognitions.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field, val in {
        "name": name, "designation": designation, "location": location,
        "recognitionType": recognitionType, "recognitionTag": recognitionTag,
        "shortDescription": shortDescription, "recognitionDate": recognitionDate,
    }.items():
        if val is not None:
            item[field] = val
    if pic and pic.filename:
        old = item.get("pic")
        if old and (_DIR / old).exists():
            os.remove(_DIR / old)
        item["pic"] = _save(pic, _DIR)
    write_json(DATA_DIR / "recognitions.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str, _user: dict = Depends(require_roles(["ADMIN"]))):
    items = read_json(DATA_DIR / "recognitions.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if item:
        img = item.get("pic")
        if img and (_DIR / img).exists():
            os.remove(_DIR / img)
    write_json(DATA_DIR / "recognitions.json", [i for i in items if i["id"] != item_id])
    return {"message": "Deleted"}
