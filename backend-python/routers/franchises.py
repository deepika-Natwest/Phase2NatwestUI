import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from config import DATA_DIR
from file_helper import read_json, write_json
from dependencies import get_current_user, require_roles

router = APIRouter()


class FranchiseBody(BaseModel):
    name: str
    capabilityId: Optional[str] = None


@router.get("/capabilities")
def get_capabilities():
    return read_json(DATA_DIR / "capabilities.json")


@router.get("/filter")
def filter_by_capability(
    capabilityId: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    items = read_json(DATA_DIR / "franchises.json")
    if capabilityId:
        items = [f for f in items if f.get("capabilityId") == capabilityId]
    return items


@router.get("")
@router.get("/")
def get_all(capabilityId: Optional[str] = Query(None)):
    items = read_json(DATA_DIR / "franchises.json")
    if capabilityId:
        items = [f for f in items if f.get("capabilityId") == capabilityId]
    return items


@router.post("/", status_code=201)
def create(body: FranchiseBody, _user: dict = Depends(require_roles(["ADMIN", "EDITOR"]))):
    if not body.name or not body.capabilityId:
        raise HTTPException(status_code=400, detail="name and capabilityId are required")
    items = read_json(DATA_DIR / "franchises.json")
    new_item = {"id": str(uuid.uuid4()), "name": body.name, "capabilityId": body.capabilityId}
    items.append(new_item)
    write_json(DATA_DIR / "franchises.json", items)
    return new_item


@router.put("/{item_id}")
def update(item_id: str, body: FranchiseBody, _user: dict = Depends(require_roles(["ADMIN", "EDITOR"]))):
    items = read_json(DATA_DIR / "franchises.json")
    item = next((f for f in items if f["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if body.name:
        item["name"] = body.name
    if body.capabilityId:
        item["capabilityId"] = body.capabilityId
    write_json(DATA_DIR / "franchises.json", items)
    return item


@router.delete("/{item_id}")
def delete(item_id: str, _user: dict = Depends(require_roles(["ADMIN"]))):
    items = read_json(DATA_DIR / "franchises.json")
    write_json(DATA_DIR / "franchises.json", [f for f in items if f["id"] != item_id])
    return {"message": "Deleted"}
