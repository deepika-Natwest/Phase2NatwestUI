import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from pathlib import Path
from config import DATA_DIR, UPLOAD_DIR
from file_helper import read_json, write_json
from dependencies import require_roles

router = APIRouter()
_DIR = UPLOAD_DIR / "leadership"


def _save(file: UploadFile, folder: Path) -> str:
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    name = f"{uuid.uuid4()}{ext}"
    with open(folder / name, "wb") as f:
        f.write(file.file.read())
    return name


@router.get("")
def get_all():
    return read_json(DATA_DIR / "leadership.json")


@router.post("", status_code=201)
def create(
    name: str = Form(...),
    designation: str = Form(...),
    managementLevel: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    profilePic: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    pic = _save(profilePic, _DIR) if profilePic and profilePic.filename else None
    item = {
        "id": str(uuid.uuid4()), "name": name, "designation": designation,
        "managementLevel": managementLevel, "location": location,
        "shortDescription": shortDescription, "profilePic": pic,
    }
    items = read_json(DATA_DIR / "leadership.json")
    items.append(item)
    write_json(DATA_DIR / "leadership.json", items)
    return item


@router.put("/{item_id}")
def update(
    item_id: str,
    name: Optional[str] = Form(None),
    designation: Optional[str] = Form(None),
    managementLevel: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    profilePic: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    items = read_json(DATA_DIR / "leadership.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field, val in {
        "name": name, "designation": designation,
        "managementLevel": managementLevel, "location": location,
        "shortDescription": shortDescription,
    }.items():
        if val is not None:
            item[field] = val
    if profilePic and profilePic.filename:
        old = item.get("profilePic")
        if old and (_DIR / old).exists():
            os.remove(_DIR / old)
        item["profilePic"] = _save(profilePic, _DIR)
    write_json(DATA_DIR / "leadership.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str, _user: dict = Depends(require_roles(["ADMIN"]))):
    items = read_json(DATA_DIR / "leadership.json")
    item = next((i for i in items if i["id"] == item_id), None)
    if item:
        pic = item.get("profilePic")
        if pic and (_DIR / pic).exists():
            os.remove(_DIR / pic)
    write_json(DATA_DIR / "leadership.json", [i for i in items if i["id"] != item_id])
    return {"message": "Deleted"}
