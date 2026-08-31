import uuid
import os
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import Optional
from pathlib import Path
import bcrypt as _bcrypt
from config import DATA_DIR, UPLOAD_DIR
from file_helper import read_json, write_json
from dependencies import get_current_user

router = APIRouter()
_PIC_DIR = UPLOAD_DIR / "users"


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def _save(file: UploadFile, folder: Path) -> str:
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    name = f"{uuid.uuid4()}{ext}"
    with open(folder / name, "wb") as f:
        f.write(file.file.read())
    return name


@router.get("")
@router.get("")
def get_users(
    search: Optional[str] = Query(None),
    page: Optional[int] = Query(None),
    limit: Optional[int] = Query(None),
):
    users = read_json(DATA_DIR / "users.json")
    users = [{k: v for k, v in u.items() if k != "password"} for u in users]
    if search:
        s = search.lower()
        users = [u for u in users if s in (u.get("name") or "").lower()]
    if page is not None and limit is not None:
        total = len(users)
        start = (page - 1) * limit
        return {"users": users[start : start + limit], "total": total}
    return users


@router.post("", status_code=201)
def create_user(
    name: str = Form(...),
    enterpriseId: str = Form(...),
    password: str = Form(...),
    gender: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    careerLevel: Optional[str] = Form(None),
    lineManager: Optional[str] = Form(None),
    projectName: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    capabilityId: Optional[str] = Form(None),
    franchiseId: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    resourceType: Optional[str] = Form(None),
    natwestDoj: Optional[str] = Form(None),
    sowStartDate: Optional[str] = Form(None),
    sowEndDate: Optional[str] = Form(None),
    sowId: Optional[str] = Form(None),
    profilePic: Optional[UploadFile] = File(None),
    _user: dict = Depends(get_current_user),
):
    pic = _save(profilePic, _PIC_DIR) if profilePic and profilePic.filename else None
    new_user = {
        "id": str(uuid.uuid4()),
        "name": name, "enterpriseId": enterpriseId,
        "password": _hash_password(password),
        "gender": gender, "location": location, "careerLevel": careerLevel,
        "lineManager": lineManager, "projectName": projectName, "role": role,
        "status": status, "capabilityId": capabilityId, "franchiseId": franchiseId,
        "shortDescription": shortDescription, "resourceType": resourceType,
        "natwestDoj": natwestDoj, "sowStartDate": sowStartDate,
        "sowEndDate": sowEndDate, "sowId": sowId, "profilePic": pic,
    }
    users = read_json(DATA_DIR / "users.json")
    users.append(new_user)
    write_json(DATA_DIR / "users.json", users)
    return {k: v for k, v in new_user.items() if k != "password"}


@router.put("/{user_id}")
def update_user(
    user_id: str,
    name: Optional[str] = Form(None),
    enterpriseId: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    careerLevel: Optional[str] = Form(None),
    lineManager: Optional[str] = Form(None),
    projectName: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    capabilityId: Optional[str] = Form(None),
    franchiseId: Optional[str] = Form(None),
    shortDescription: Optional[str] = Form(None),
    resourceType: Optional[str] = Form(None),
    natwestDoj: Optional[str] = Form(None),
    sowStartDate: Optional[str] = Form(None),
    sowEndDate: Optional[str] = Form(None),
    sowId: Optional[str] = Form(None),
    profilePic: Optional[UploadFile] = File(None),
    _user: dict = Depends(get_current_user),
):
    users = read_json(DATA_DIR / "users.json")
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protect admin by role OR fixed ID — prevents role changes even if role field is corrupted
    if (user.get("id") == "1" or str(user.get("role", "")).lower() == "admin") and (
        role is not None and role.lower() != "admin"
    ):
        raise HTTPException(status_code=403, detail="Cannot change role of an admin user")

    for field, val in {
        "name": name, "enterpriseId": enterpriseId, "gender": gender,
        "location": location, "careerLevel": careerLevel, "lineManager": lineManager,
        "projectName": projectName, "role": role, "status": status,
        "capabilityId": capabilityId, "franchiseId": franchiseId,
        "shortDescription": shortDescription, "resourceType": resourceType,
        "natwestDoj": natwestDoj, "sowStartDate": sowStartDate,
        "sowEndDate": sowEndDate, "sowId": sowId,
    }.items():
        if val is not None:
            user[field] = val

    if password:
        user["password"] = _hash_password(password)

    if profilePic and profilePic.filename:
        old = user.get("profilePic")
        if old:
            old_path = _PIC_DIR / old
            if old_path.exists():
                os.remove(old_path)
        user["profilePic"] = _save(profilePic, _PIC_DIR)

    write_json(DATA_DIR / "users.json", users)
    return {k: v for k, v in user.items() if k != "password"}


@router.delete("/{user_id}")
def delete_user(user_id: str, _user: dict = Depends(get_current_user)):
    # Hard-block the system admin by ID before touching the file
    if user_id == "1":
        raise HTTPException(status_code=403, detail="Admin users cannot be deleted")

    users = read_json(DATA_DIR / "users.json")
    target = next((u for u in users if u["id"] == user_id), None)
    # Also block any user whose role is admin (covers additional admin accounts)
    if target and str(target.get("role", "")).lower() == "admin":
        raise HTTPException(status_code=403, detail="Admin users cannot be deleted")

    # Best-effort: preserve the user's program in program.json so the Program
    # tab continues to show it as Inactive. Wrapped in try/except so a file-lock
    # or OS error here never blocks the actual user deletion below.
    if target:
        try:
            project_name = (target.get("projectName") or "").strip()
            if project_name:
                programs = read_json(DATA_DIR / "program.json")
                already_there = any(
                    (p.get("name") or "").strip().lower() == project_name.lower()
                    for p in programs
                )
                if not already_there:
                    programs.append({
                        "id": str(uuid.uuid4()),
                        "name": project_name,
                        "capabilityId": target.get("capabilityId", ""),
                        "franchiseId": target.get("franchiseId", ""),
                        "isActive": False,
                        "description": "",
                    })
                    write_json(DATA_DIR / "program.json", programs)
        except Exception:
            pass  # non-critical — user deletion proceeds regardless

    write_json(DATA_DIR / "users.json", [u for u in users if u["id"] != user_id])
    return {"message": "Deleted"}
