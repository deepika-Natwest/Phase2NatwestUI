import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from pathlib import Path
from config import DATA_DIR, UPLOAD_DIR
from file_helper import read_json, write_json
from dependencies import require_roles

router = APIRouter()
_DIR = UPLOAD_DIR / "deliverables"


def _save(file: UploadFile, folder: Path) -> str:
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    name = f"{uuid.uuid4()}{ext}"
    with open(folder / name, "wb") as f:
        f.write(file.file.read())
    return name


def _build_deliverable(
    category: Optional[str],
    capabilityId, franchiseId, aiBased,
    projectName, description, resources,
    costSavingAmount, costSavingCurrency,
    timeHours, timeMinutes, newFunctionality,
    file_name: Optional[str],
    base: Optional[dict] = None,
) -> dict:
    item = dict(base) if base else {"id": str(uuid.uuid4())}
    item.update({
        "capabilityId": capabilityId,
        "franchiseId": franchiseId,
        "category": category,
        "aiBased": aiBased == "true" if isinstance(aiBased, str) else bool(aiBased),
        "projectName": projectName,
        "description": description,
        "resources": resources,
    })
    if file_name is not None:
        item["file"] = file_name

    # Category-specific fields — clear irrelevant ones
    if category == "Cost Saving":
        item["costSavingAmount"] = costSavingAmount
        item["costSavingCurrency"] = costSavingCurrency
        item.pop("timeHours", None)
        item.pop("timeMinutes", None)
        item.pop("newFunctionality", None)
    elif category == "Process Improvement":
        item["timeHours"] = timeHours
        item["timeMinutes"] = timeMinutes
        item.pop("costSavingAmount", None)
        item.pop("costSavingCurrency", None)
        item.pop("newFunctionality", None)
    elif category == "New Functionality":
        item["newFunctionality"] = newFunctionality
        item.pop("costSavingAmount", None)
        item.pop("costSavingCurrency", None)
        item.pop("timeHours", None)
        item.pop("timeMinutes", None)
    else:
        item.pop("costSavingAmount", None)
        item.pop("costSavingCurrency", None)
        item.pop("timeHours", None)
        item.pop("timeMinutes", None)
        item.pop("newFunctionality", None)

    return item


@router.get("")
def get_all():
    return read_json(DATA_DIR / "deliverables.json")


@router.post("", status_code=201)
def create(
    capabilityId: Optional[str] = Form(None),
    franchiseId: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    aiBased: Optional[str] = Form(None),
    projectName: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    resources: Optional[str] = Form(None),
    costSavingAmount: Optional[str] = Form(None),
    costSavingCurrency: Optional[str] = Form(None),
    timeHours: Optional[str] = Form(None),
    timeMinutes: Optional[str] = Form(None),
    newFunctionality: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    file_name = _save(file, _DIR) if file and file.filename else None
    item = _build_deliverable(
        category, capabilityId, franchiseId, aiBased,
        projectName, description, resources,
        costSavingAmount, costSavingCurrency,
        timeHours, timeMinutes, newFunctionality, file_name,
    )
    items = read_json(DATA_DIR / "deliverables.json")
    items.append(item)
    write_json(DATA_DIR / "deliverables.json", items)
    return item


@router.put("/{item_id}")
def update(
    item_id: str,
    capabilityId: Optional[str] = Form(None),
    franchiseId: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    aiBased: Optional[str] = Form(None),
    projectName: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    resources: Optional[str] = Form(None),
    costSavingAmount: Optional[str] = Form(None),
    costSavingCurrency: Optional[str] = Form(None),
    timeHours: Optional[str] = Form(None),
    timeMinutes: Optional[str] = Form(None),
    newFunctionality: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    _user: dict = Depends(require_roles(["ADMIN", "EDITOR"])),
):
    items = read_json(DATA_DIR / "deliverables.json")
    existing = next((i for i in items if i["id"] == item_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")

    file_name = None
    if file and file.filename:
        file_name = _save(file, _DIR)

    updated = _build_deliverable(
        category or existing.get("category"),
        capabilityId or existing.get("capabilityId"),
        franchiseId or existing.get("franchiseId"),
        aiBased if aiBased is not None else existing.get("aiBased"),
        projectName or existing.get("projectName"),
        description or existing.get("description"),
        resources or existing.get("resources"),
        costSavingAmount or existing.get("costSavingAmount"),
        costSavingCurrency or existing.get("costSavingCurrency"),
        timeHours or existing.get("timeHours"),
        timeMinutes or existing.get("timeMinutes"),
        newFunctionality or existing.get("newFunctionality"),
        file_name,
        base=existing,
    )
    idx = next(i for i, d in enumerate(items) if d["id"] == item_id)
    items[idx] = updated
    write_json(DATA_DIR / "deliverables.json", items)
    return updated


@router.delete("/{item_id}")
def delete(item_id: str, _user: dict = Depends(require_roles(["ADMIN"]))):
    items = read_json(DATA_DIR / "deliverables.json")
    write_json(DATA_DIR / "deliverables.json", [i for i in items if i["id"] != item_id])
    return {"message": "Deleted"}
