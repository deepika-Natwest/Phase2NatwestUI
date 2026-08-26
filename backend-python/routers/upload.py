import uuid
import io
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import openpyxl
import bcrypt as _bcrypt
from config import DATA_DIR
from file_helper import read_json, write_json
from dependencies import require_roles
from services.rag_service import invalidate_knowledge_base_cache

router = APIRouter()

EXPECTED_HEADERS = [
    "Name", "Enterprise ID", "Email", "Role", "Career Level",
    "Location", "Capability", "Franchise", "Resource Type",
    "NatWest DOJ", "SOW Start Date", "SOW End Date", "SOW ID",
]


@router.post("/upload")
async def upload_users(
    file: UploadFile = File(...),
    _user: dict = Depends(require_roles(["ADMIN"])),
):
    content = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Excel file")

    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise HTTPException(status_code=400, detail="Empty file")

    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    if headers != EXPECTED_HEADERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid headers. Expected: {', '.join(EXPECTED_HEADERS)}",
        )

    users = read_json(DATA_DIR / "users.json")
    created = 0
    upserted = 0

    for row in rows[1:]:
        if not any(row):
            continue
        vals = [str(v).strip() if v is not None else "" for v in row]
        (name, enterprise_id, _email, role, career_level, location,
         _capability, _franchise, resource_type,
         natwest_doj, sow_start, sow_end, sow_id) = vals

        existing = next(
            (u for u in users if str(u.get("enterpriseId", "")).lower() == enterprise_id.lower()),
            None,
        )
        if existing:
            existing.update({
                "name": name, "role": role, "careerLevel": career_level,
                "location": location, "resourceType": resource_type,
                "natwestDoj": natwest_doj, "sowStartDate": sow_start,
                "sowEndDate": sow_end, "sowId": sow_id,
            })
            upserted += 1
        else:
            users.append({
                "id": str(uuid.uuid4()),
                "name": name, "enterpriseId": enterprise_id,
                "password": _bcrypt.hashpw(enterprise_id.encode(), _bcrypt.gensalt()).decode(),
                "role": role, "careerLevel": career_level,
                "location": location, "resourceType": resource_type,
                "natwestDoj": natwest_doj, "sowStartDate": sow_start,
                "sowEndDate": sow_end, "sowId": sow_id,
            })
            created += 1

    write_json(DATA_DIR / "users.json", users)
    invalidate_knowledge_base_cache()
    total = created + upserted
    return {
        "message": f"Upload complete. Created: {created}, Updated: {upserted}",
        "createdCount": created,
        "updatedCount": upserted,
        "count": total,
        "errors": [],
    }
