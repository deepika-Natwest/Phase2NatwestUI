from fastapi import APIRouter, Depends
from config import DATA_DIR
from file_helper import read_json
from dependencies import get_current_user

router = APIRouter()


@router.get("/data")
def get_public_dashboard():
    """
    Compute dashboard KPIs live from users/capabilities/franchises.
    Metrics that have no source in user records (leakage, utilization,
    skills matrix, timesheet) are carried forward from public-dashboard.json.
    All capabilities and franchises are always shown — 0 where no users exist.
    """
    users        = read_json(DATA_DIR / "users.json")        or []
    capabilities = read_json(DATA_DIR / "capabilities.json") or []
    franchises   = read_json(DATA_DIR / "franchises.json")   or []
    static       = read_json(DATA_DIR / "public-dashboard.json") or {}

    cap_map = {c["id"]: c["name"] for c in capabilities if c.get("id") and c.get("name")}
    fr_map  = {
        f["id"]: {"name": f["name"], "capabilityId": f.get("capabilityId", "")}
        for f in franchises if f.get("id") and f.get("name")
    }

    # Non-admin users only
    real_users = [u for u in users if str(u.get("role", "")).lower() != "admin"]
    total = len(real_users)

    # ── Billable HC % ─────────────────────────────────────────────────────────
    billable = sum(
        1 for u in real_users
        if "billable" in str(u.get("resourceType") or "").lower()
    )
    billable_pct = round(billable / total * 100) if total else 0

    # ── HC Actual by Capability (all capabilities, 0 if no users) ─────────────
    hc_by_cap = {name: 0 for name in cap_map.values()}
    for u in real_users:
        cap_name = cap_map.get(u.get("capabilityId"))
        if cap_name:
            hc_by_cap[cap_name] += 1
    hc_actual_data = [
        {"name": name, "value": count}
        for name, count in sorted(hc_by_cap.items())
    ]

    # ── Sub-SBU wise headcount (all franchises, grouped by capability) ─────────
    fr_counts = {fr_id: 0 for fr_id in fr_map}
    for u in real_users:
        fr_id = u.get("franchiseId")
        if fr_id in fr_counts:
            fr_counts[fr_id] += 1

    sbu_wise = sorted(
        [
            {
                "name":  fr_info["name"],
                "value": fr_counts.get(fr_id, 0),
                "group": cap_map.get(fr_info["capabilityId"], "Unknown"),
            }
            for fr_id, fr_info in fr_map.items()
        ],
        key=lambda x: (x["group"], x["name"]),
    )

    # ── Location distribution (derived from users) ────────────────────────────
    loc_counts: dict[str, int] = {}
    for u in real_users:
        loc = (u.get("location") or "").strip()
        if loc:
            loc_counts[loc] = loc_counts.get(loc, 0) + 1
    location_data = [
        {"location": loc, "resources": count}
        for loc, count in sorted(loc_counts.items(), key=lambda x: -x[1])
    ]

    # ── Summary cards ─────────────────────────────────────────────────────────
    static_cards = static.get("summaryCards") or {}
    summary_cards = {
        "totalResources":      total,
        "billableHCPct":       billable_pct,
        "leakageHours":        static_cards.get("leakageHours", 0),
        "timesheetCompliance": static_cards.get("timesheetCompliance", 0),
    }

    return {
        "summaryCards":          summary_cards,
        "currentHC":             total,
        "additions":             static.get("additions", 0),
        "leavers":               static.get("leavers", 0),
        "hcActualData":          hc_actual_data,
        "SBUwisezbillableHC":    sbu_wise,
        "locationData":          location_data,
        # Non-derivable — carried from static file
        "weeklyHCTrend":         static.get("weeklyHCTrend", []),
        "monthlyHCTrend":        static.get("monthlyHCTrend", []),
        "utilizationTrendData":  static.get("utilizationTrendData", []),
        "resourceAllocationData":static.get("resourceAllocationData", []),
        "leakageData":           static.get("leakageData", []),
        "timesheetData":         static.get("timesheetData", []),
        "projectData":           static.get("projectData", []),
    }


@router.get("")
@router.get("/")
def get_admin_dashboard(user: dict = Depends(get_current_user)):
    return {"message": f"Welcome {user.get('username')} to Admin Dashboard"}
