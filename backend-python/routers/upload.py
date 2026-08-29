import uuid
import io
import re as _re
from datetime import datetime, date as _date
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import openpyxl
import bcrypt as _bcrypt
from config import DATA_DIR
from file_helper import read_json, write_json
from dependencies import require_roles
from services.rag_service import invalidate_knowledge_base_cache


def _cell_str(v) -> str:
    """Convert an openpyxl cell value to a plain string.
    Datetime/date objects (from Excel date-formatted cells) are returned as YYYY-MM-DD.
    """
    if v is None:
        return ""
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, _date):
        return v.strftime("%Y-%m-%d")
    return str(v).strip()


def _rt_key(s: str) -> str:
    """Normalise a resource-type string for comparison: collapse spaces around hyphens."""
    return _re.sub(r'\s*-\s*', '-', s.strip().lower())

router = APIRouter()

EXPECTED_HEADERS = [
    "Name", "Enterprise ID", "Email", "Role", "Career Level",
    "Location", "Capability", "Franchise", "Resource Type",
    "NatWest DOJ", "SOW Start Date", "SOW End Date", "SOW ID",
    "Project / Program", "NWG Line Manager",
]


# Common full-name → DB-name aliases for capabilities and franchises
_CAP_ALIASES: dict[str, str] = {
    "retail and sme banking": "rs-fral & irb",
    "rs-fral": "rs-fral & irb",
    "data and analytics": "d&a+",
    "d&a plus": "d&a+",
    "financial services": "fs-fral & trade s",
    "fs-fral": "fs-fral & trade s",
    "enterprise engineering": "ee",
    "treasury": "treasury & nwm",
    "treasury and nwm": "treasury & nwm",
    "infrastructure": "infra",
}

_FRAN_ALIASES: dict[str, str] = {
    "retail banking": "rb",
    "retail": "rb",
    "wealth management": "wealth",
    "commercial and institutional": "c&i",
    "commercial & institutional": "c&i",
    "financial crime": "fincrime",
    "fin crime": "fincrime",
    "data and analytics": "d&a",
    "bank of apis": "bank of api's",
    "bank of api": "bank of api's",
}


def _build_lookup(items: list, key: str = "name") -> dict:
    """Return a case-insensitive name → id dict."""
    return {item[key].strip().lower(): item["id"] for item in items if item.get(key)}


def _resolve(name: str, lookup: dict, aliases: dict) -> str | None:
    """Look up name directly, then via alias."""
    key = name.strip().lower()
    if key in lookup:
        return lookup[key]
    canonical = aliases.get(key)
    if canonical:
        return lookup.get(canonical)
    return None


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

    headers = [_cell_str(h) for h in rows[0]]
    if headers != EXPECTED_HEADERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid headers. Expected: {', '.join(EXPECTED_HEADERS)}",
        )

    # Load reference data for name → id resolution
    capabilities  = read_json(DATA_DIR / "capabilities.json")
    franchises    = read_json(DATA_DIR / "franchises.json")
    user_statuses = read_json(DATA_DIR / "user-statuses.json")
    cap_lookup    = _build_lookup(capabilities)   # "d&a+" → id
    fran_lookup   = _build_lookup(franchises)      # "rb"   → id
    # normalised resource-type name → canonical name ("active - billable" → "Active-Billable")
    rt_lookup: dict[str, str] = {_rt_key(s["name"]): s["name"] for s in user_statuses if s.get("name")}

    users    = read_json(DATA_DIR / "users.json")
    created  = 0
    upserted = 0
    warnings = []

    for row_idx, row in enumerate(rows[1:], start=2):
        if not any(row):
            continue
        vals = [_cell_str(v) for v in row]
        (name, enterprise_id, _email, role, career_level, location,
         capability_name, franchise_name, resource_type,
         natwest_doj, sow_start, sow_end, sow_id,
         project_name, line_manager) = vals

        # Skip rows with no enterprise ID
        if not enterprise_id:
            warnings.append(f"Row {row_idx} ({name}): No Enterprise ID — skipped.")
            continue

        existing = next(
            (u for u in users if str(u.get("enterpriseId", "")).lower() == enterprise_id.lower()),
            None,
        )

        # Never touch admin accounts during bulk upload (protect by role OR fixed ID)
        if existing and (
            existing.get("id") == "1"
            or str(existing.get("role", "")).lower() == "admin"
        ):
            warnings.append(f"Row {row_idx} ({name}): Admin account skipped for safety.")
            continue

        # Resolve capability name → id (direct match or alias)
        capability_id = _resolve(capability_name, cap_lookup, _CAP_ALIASES)
        if capability_name and not capability_id:
            warnings.append(f"Row {row_idx} ({name}): Capability '{capability_name}' not found — skipped.")

        # Resolve franchise name → id (direct match or alias)
        franchise_id = _resolve(franchise_name, fran_lookup, _FRAN_ALIASES)
        if franchise_name and not franchise_id:
            warnings.append(f"Row {row_idx} ({name}): Franchise '{franchise_name}' not found — skipped.")

        # Normalise career level → "Level N"
        if career_level:
            m = _re.search(r'\d+', career_level)
            career_level = f"Level {m.group()}" if m else career_level

        # Normalise resource type to canonical casing from user-statuses
        if resource_type:
            resource_type = rt_lookup.get(_rt_key(resource_type), resource_type)

        update_fields = {
            "name": name, "role": role.strip().lower() if role else role,
            "careerLevel": career_level, "location": location,
            "resourceType": resource_type,
            "natwestDoj": natwest_doj, "sowStartDate": sow_start,
            "sowEndDate": sow_end, "sowId": sow_id,
            "projectName": project_name, "lineManager": line_manager,
        }
        # Only write capability/franchise when successfully resolved
        if capability_id:
            update_fields["capabilityId"] = capability_id
        if franchise_id:
            update_fields["franchiseId"] = franchise_id

        if existing:
            existing.update(update_fields)
            upserted += 1
        else:
            users.append({
                "id": str(uuid.uuid4()),
                "enterpriseId": enterprise_id,
                "password": _bcrypt.hashpw(enterprise_id.encode(), _bcrypt.gensalt()).decode(),
                **update_fields,
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
        "warnings": warnings,
        "errors": [],
    }
