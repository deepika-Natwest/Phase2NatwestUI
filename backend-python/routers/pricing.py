from fastapi import APIRouter
from datetime import date, datetime
from config import DATA_DIR
from file_helper import read_json

router = APIRouter()


def _parse_date(s) -> date | None:
    if not s:
        return None
    try:
        return datetime.strptime(str(s)[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


@router.get("")
@router.get("")
def get_pricing():
    """Compute SOW dashboard tables live from users.json + capabilities.json."""
    users = read_json(DATA_DIR / "users.json")
    capabilities = read_json(DATA_DIR / "capabilities.json")

    cap_map = {
        c["id"]: c["name"]
        for c in (capabilities or [])
        if c.get("id") and c.get("name")
    }

    today = date.today()

    # All capabilities — even those with no users will show as 0
    sbus = sorted(cap_map.values())

    expiry_buckets = {s: {"futureEnding": 0, "expiring1130": 0, "expiring3160": 0, "nba": 0, "plannedRelease": 0} for s in sbus}
    attrition_buckets = {s: {"attrition": 0, "rollOff": 0} for s in sbus}

    for u in users:
        if str(u.get("role", "")).lower() == "admin":
            continue
        sbu = cap_map.get(u.get("capabilityId"))
        if not sbu:
            continue

        rt = str(u.get("resourceType") or "").strip().lower()
        sow_end = _parse_date(u.get("sowEndDate"))

        # ── Expiry table ──────────────────────────────────────────────────
        if rt == "planned release":
            expiry_buckets[sbu]["plannedRelease"] += 1

        if sow_end:
            days = (sow_end - today).days
            if days > 60:
                expiry_buckets[sbu]["futureEnding"] += 1
            elif days >= 31:
                expiry_buckets[sbu]["expiring3160"] += 1
            elif days >= 11:
                expiry_buckets[sbu]["expiring1130"] += 1
            else:
                # ≤10 days to expiry OR already expired → needs immediate action
                expiry_buckets[sbu]["nba"] += 1

        # ── Attrition table ───────────────────────────────────────────────
        if rt == "attrition":
            attrition_buckets[sbu]["attrition"] += 1

        # Roll-off: SOW end date is in the past
        if sow_end and sow_end < today:
            attrition_buckets[sbu]["rollOff"] += 1

    def _with_total(row: dict) -> dict:
        row["grandTotal"] = sum(
            v for k, v in row.items()
            if k not in ("id", "category") and isinstance(v, (int, float))
        )
        return row

    expiry_rows = [
        _with_total({"id": i + 1, "category": sbu, **expiry_buckets[sbu]})
        for i, sbu in enumerate(sbus)
    ]

    attrition_rows = [
        _with_total({"id": i + 1, "category": sbu, **attrition_buckets[sbu]})
        for i, sbu in enumerate(sbus)
    ]

    # Extension fields (fgAvailable etc.) have no source in user data → 0
    extension_rows = [
        _with_total({
            "id": i + 1,
            "category": sbu,
            "fgAvailable": 0,
            "fgNotAvailable": 0,
            "toBeIssued": 0,
            "clientConfirmationAwaited": 0,
        })
        for i, sbu in enumerate(sbus)
    ]

    return {
        "expiry": expiry_rows,
        "attrition": attrition_rows,
        "extension": extension_rows,
    }
