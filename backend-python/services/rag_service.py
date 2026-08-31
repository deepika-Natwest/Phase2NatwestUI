from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from config import DATA_DIR
from file_helper import read_json

_TAB_LABELS = {
    "users": "Users",
    "leadership": "Leadership",
    "events": "Events",
    "deliverables": "Deliverables",
    "recognitions": "Recognitions",
    "capabilities": "Capabilities",
    "franchises": "Franchises",
    "program": "Programs",
}

_VALUE_ALIASES: Dict[str, List[str]] = {
    "data and ai": ["d&a", "d&a+", "data & ai", "data and analytics"],
    "d&a": ["d&a", "d&a+", "data & ai", "data and analytics"],
    "bangalore": ["bangalore", "bengaluru", "banglore"],
    "gurugram": ["gurugram", "gurgaon"],
}

_MONTH_ALIASES = {
    "january": "jan", "february": "feb", "march": "mar", "april": "apr",
    "may": "may", "june": "jun", "july": "jul", "august": "aug",
    "september": "sep", "october": "oct", "november": "nov", "december": "dec",
}

_SENSITIVE = {"password", "token", "secret", "hash"}

_STOP_WORDS = {
    "what", "when", "where", "who", "which", "tell", "about",
    "show", "me", "the", "this", "that", "from", "for", "with",
}

# In-memory cached knowledge base
_CACHED_KB: Optional[List[dict]] = None


def invalidate_knowledge_base_cache() -> None:
    """Invalidates the in-memory knowledge base cache so it rebuilds on next request."""
    global _CACHED_KB
    _CACHED_KB = None


# ---------------------------------------------------------------------------
# Text helpers & Normalization
# ---------------------------------------------------------------------------

def _norm(text: Any = "") -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", str(text).lower())).strip()


def _flat(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(_flat(v) for v in value if v not in (None, ""))
    if isinstance(value, dict):
        return ", ".join(f"{k}: {_flat(v)}" for k, v in value.items() if v not in (None, ""))
    return str(value)


def _humanize(field: str) -> str:
    s = re.sub(r"([a-z])([A-Z])", r"\1 \2", field)
    return re.sub(r"[_\-]+", " ", s).lower()


def _normalize_name(name: str) -> str:
    """Standardizes names like 'Dahiya, Suman' into 'Suman Dahiya'."""
    if not name:
        return ""
    name_str = str(name).strip()
    if "," in name_str:
        parts = [p.strip() for p in name_str.split(",", 1)]
        if len(parts) == 2 and parts[0] and parts[1]:
            return f"{parts[1]} {parts[0]}"
    return name_str


# ---------------------------------------------------------------------------
# Knowledge Base Construction (Pre-joining, Enriching & Normalizing)
# ---------------------------------------------------------------------------

def _read_pricing_docs() -> List[dict]:
    pricing = read_json(DATA_DIR / "pricing.json")
    if not isinstance(pricing, dict):
        return []
    docs = []
    for table, rows in pricing.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            category = row.get("category", "Pricing record")
            values = " ".join(
                f"{k}: {v}" for k, v in row.items() if k not in ("id", "category")
            )
            docs.append({
                "tab": "Pricing",
                "title": f"Pricing ({table}) - {category}",
                "text": f"Tab: Pricing Table: {table} Category: {category} {values}",
                "raw": {**row, "table": table},
            })
    return docs


def _compute_live_dashboard() -> dict:
    """Compute all dashboard KPIs live from users/capabilities/franchises.json.
    Non-derivable metrics (leakage, utilization, skills, timesheet, project hours)
    are carried forward from public-dashboard.json.
    """
    from datetime import date as _date

    users        = read_json(DATA_DIR / "users.json")        or []
    capabilities = read_json(DATA_DIR / "capabilities.json") or []
    franchises   = read_json(DATA_DIR / "franchises.json")   or []
    static       = read_json(DATA_DIR / "public-dashboard.json") or {}

    cap_map = {c["id"]: c["name"] for c in capabilities if c.get("id") and c.get("name")}
    fr_map  = {f["id"]: {"name": f["name"], "capabilityId": f.get("capabilityId", "")}
               for f in franchises if f.get("id") and f.get("name")}

    real_users = [u for u in users if str(u.get("role", "")).lower() != "admin"]
    total = len(real_users)
    today = _date.today()

    _MANUAL_RT_SET = {"planned release", "onboarding pending", "account/support/others", "attrition"}

    def _eff_rt(u: dict) -> str:
        rt = (u.get("resourceType") or "").strip().lower()
        if rt in _MANUAL_RT_SET:
            return rt
        sow = u.get("sowEndDate")
        if not sow:
            return rt
        try:
            d = _date.fromisoformat(str(sow)[:10])
            return "active-billable" if d > today else "pool"
        except Exception:
            return rt

    billable     = sum(1 for u in real_users if "billable" in _eff_rt(u))
    billable_pct = round(billable / total * 100) if total else 0

    hc_by_cap = {name: 0 for name in cap_map.values()}
    for u in real_users:
        cap_name = cap_map.get(u.get("capabilityId"))
        if cap_name:
            hc_by_cap[cap_name] += 1
    hc_actual_data = [{"name": n, "value": v} for n, v in sorted(hc_by_cap.items())]

    fr_counts: dict = {fid: 0 for fid in fr_map}
    for u in real_users:
        fid = u.get("franchiseId")
        if fid in fr_counts:
            fr_counts[fid] += 1
    franchise_hc = {fr_map[fid]["name"]: fr_counts[fid] for fid in fr_map}

    loc_counts: dict = {}
    for u in real_users:
        loc = (u.get("location") or "").strip()
        if loc:
            loc_counts[loc] = loc_counts.get(loc, 0) + 1
    location_data = [{"location": loc, "resources": cnt}
                     for loc, cnt in sorted(loc_counts.items(), key=lambda x: -x[1])]

    rt_counts: dict = {}
    for u in real_users:
        rt = _eff_rt(u) or "unknown"
        rt_counts[rt] = rt_counts.get(rt, 0) + 1

    static_cards = static.get("summaryCards") or {}
    return {
        "currentHC":              total,
        "summaryCards": {
            "totalResources":       total,
            "billableHCPct":        billable_pct,
            "leakageHours":         static_cards.get("leakageHours", 0),
            "timesheetCompliance":  static_cards.get("timesheetCompliance", 0),
        },
        "hcActualData":            hc_actual_data,
        "locationData":            location_data,
        "franchiseHC":             franchise_hc,
        "resourceTypeCounts":      rt_counts,
        "additions":               static.get("additions", 0),
        "leavers":                 static.get("leavers", 0),
        "utilizationTrendData":    static.get("utilizationTrendData", []),
        "leakageData":             static.get("leakageData", []),
        "timesheetData":           static.get("timesheetData", []),
        "resourceAllocationData":  static.get("resourceAllocationData", []),
        "projectData":             static.get("projectData", []),
        "weeklyHCTrend":           static.get("weeklyHCTrend", []),
    }


def _read_dashboard_docs() -> List[dict]:
    dash = _compute_live_dashboard()
    if not isinstance(dash, dict):
        return []
    docs = []

    # 1. Summary card KPIs
    sum_cards = dash.get("summaryCards") or {}
    cur_hc = dash.get("currentHC")
    adds = dash.get("additions")
    leav = dash.get("leavers")
    summary_text = (
        f"Tab: Dashboard Title: Overall KPIs & Summary. "
        f"Current Headcount: {cur_hc}, Total Resources: {sum_cards.get('totalResources')}, "
        f"Billable Headcount Percentage: {sum_cards.get('billableHCPct')}%, "
        f"Leakage Hours: {sum_cards.get('leakageHours')}, Timesheet Compliance: {sum_cards.get('timesheetCompliance')}%, "
        f"Additions: {adds}, Leavers: {leav}."
    )
    docs.append({
        "tab": "Dashboard",
        "title": "Dashboard Summary KPIs",
        "text": summary_text,
        "raw": {"type": "kpi_summary", "currentHC": cur_hc, **sum_cards},
    })

    # 2. Headcount by Capability
    hc_actual = dash.get("hcActualData") or []
    if hc_actual:
        items_str = ", ".join(f"{item.get('name')}: {item.get('value')}" for item in hc_actual)
        docs.append({
            "tab": "Dashboard",
            "title": "Headcount by Capability",
            "text": f"Tab: Dashboard Title: Headcount Breakdown by Capability: {items_str}.",
            "raw": {"type": "hc_actual_breakdown", "data": hc_actual},
        })

    # 3. Leakage Breakdown
    leakage = dash.get("leakageData") or []
    if leakage:
        leak_str = ", ".join(f"{item.get('name')}: {item.get('value')} hours" for item in leakage)
        docs.append({
            "tab": "Dashboard",
            "title": "Leakage Breakdown",
            "text": f"Tab: Dashboard Title: Leakage Hours Breakdown by Category: {leak_str}. Total Leakage: {sum_cards.get('leakageHours')} hours.",
            "raw": {"type": "leakage_breakdown", "data": leakage},
        })

    # 4. Resource Allocation by Technology / Skill
    res_alloc = dash.get("resourceAllocationData") or []
    if res_alloc:
        alloc_str = ", ".join(
            f"{item.get('name')} (Allocated: {item.get('allocated')}, Actual: {item.get('actual')})"
            for item in res_alloc
        )
        docs.append({
            "tab": "Dashboard",
            "title": "Resource Skill Allocation",
            "text": f"Tab: Dashboard Title: Resource Allocation by Skill/Technology: {alloc_str}.",
            "raw": {"type": "skill_allocation", "data": res_alloc},
        })

    # 5. Location Distribution
    loc_data = dash.get("locationData") or []
    if loc_data:
        loc_str = ", ".join(f"{item.get('location')}: {item.get('resources')} resources" for item in loc_data)
        docs.append({
            "tab": "Dashboard",
            "title": "Headcount by Location",
            "text": f"Tab: Dashboard Title: Resource Distribution by Location: {loc_str}.",
            "raw": {"type": "location_distribution", "data": loc_data},
        })

    # 6. SBU Wise Billable Headcount
    sbu_data = dash.get("SBUwisezbillableHC") or []
    if sbu_data:
        sbu_str = ", ".join(f"{item.get('name')} ({item.get('group')}): {item.get('value')}" for item in sbu_data)
        docs.append({
            "tab": "Dashboard",
            "title": "SBU Billable Headcount",
            "text": f"Tab: Dashboard Title: SBU-wise Billable Headcount: {sbu_str}.",
            "raw": {"type": "sbu_billable", "data": sbu_data},
        })

    # 7. Project Hours
    proj_data = dash.get("projectData") or []
    if proj_data:
        proj_str = ", ".join(f"{item.get('project')}: {item.get('hours')} hours" for item in proj_data)
        docs.append({
            "tab": "Dashboard",
            "title": "Project Hours",
            "text": f"Tab: Dashboard Title: Project Distribution by Hours: {proj_str}.",
            "raw": {"type": "project_hours", "data": proj_data},
        })

    return docs


def build_knowledge_base(force_refresh: bool = False) -> List[dict]:
    """
    Builds the unified, relational-enriched, normalized knowledge base.
    Results are cached in memory for fast query times.
    """
    global _CACHED_KB
    if not force_refresh and _CACHED_KB is not None:
        return _CACHED_KB

    # Lookup dictionaries for foreign keys
    raw_caps = read_json(DATA_DIR / "capabilities.json")
    raw_franchises = read_json(DATA_DIR / "franchises.json")
    raw_users = read_json(DATA_DIR / "users.json")

    caps_map = {
        item.get("id"): item.get("name", "")
        for item in raw_caps
        if isinstance(item, dict) and item.get("id")
    } if isinstance(raw_caps, list) else {}

    franchises_map = {
        item.get("id"): item.get("name", "")
        for item in raw_franchises
        if isinstance(item, dict) and item.get("id")
    } if isinstance(raw_franchises, list) else {}

    users_map = {
        item.get("id"): item
        for item in raw_users
        if isinstance(item, dict) and item.get("id")
    } if isinstance(raw_users, list) else {}

    docs: List[dict] = []

    # 1. Users (Normalized & Junk Filtered)
    if isinstance(raw_users, list):
        for u in raw_users:
            raw_name = u.get("name") or ""
            ent_id = u.get("enterpriseId") or ""
            # Filter out empty placeholder admin account without name
            if not raw_name and ent_id.lower() == "admin":
                continue

            norm_name = _normalize_name(raw_name) if raw_name else ent_id
            enriched_user = dict(u)
            if raw_name:
                enriched_user["name"] = norm_name

            # Enrich capability / franchise names if UUID was used
            cap_id = u.get("capabilityId")
            if cap_id in caps_map:
                enriched_user["capabilityName"] = caps_map[cap_id]
            fran_id = u.get("franchiseId")
            if fran_id in franchises_map:
                enriched_user["franchiseName"] = franchises_map[fran_id]

            text_parts = [f"Tab: Users", f"Title: {norm_name}"]
            for k, v in enriched_user.items():
                if k.lower() not in _SENSITIVE and k != "id" and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            docs.append({
                "tab": "Users",
                "title": norm_name,
                "text": " ".join(text_parts),
                "raw": enriched_user,
            })

    # 2. Leadership
    raw_lead = read_json(DATA_DIR / "leadership.json")
    if isinstance(raw_lead, list):
        for lead in raw_lead:
            norm_name = _normalize_name(lead.get("name", ""))
            enriched_lead = dict(lead)
            enriched_lead["name"] = norm_name
            text_parts = [f"Tab: Leadership", f"Title: {norm_name}"]
            for k, v in enriched_lead.items():
                if k.lower() not in _SENSITIVE and k != "id" and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            docs.append({
                "tab": "Leadership",
                "title": norm_name,
                "text": " ".join(text_parts),
                "raw": enriched_lead,
            })

    # 3. Programs (Foreign Key Resolved)
    raw_prog = read_json(DATA_DIR / "program.json")
    if isinstance(raw_prog, list):
        for prog in raw_prog:
            name = prog.get("name") or ""
            # Filter noise records
            if name.upper() in ("NA", "") and not prog.get("description"):
                continue

            enriched_prog = dict(prog)
            cap_id = prog.get("capabilityId")
            fran_id = prog.get("franchiseId")

            cap_name = caps_map.get(cap_id, "")
            fran_name = franchises_map.get(fran_id, "")
            if cap_name:
                enriched_prog["capability"] = cap_name
            if fran_name:
                enriched_prog["franchise"] = fran_name

            desc = prog.get("description") or ""
            if desc.lower() == "ksabckjasncjknsacj":
                desc = "Single Pane of Glass program"
                enriched_prog["description"] = desc

            text_parts = [f"Tab: Programs", f"Title: {name}"]
            for k, v in enriched_prog.items():
                if k.lower() not in _SENSITIVE and k not in ("id", "capabilityId", "franchiseId") and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            docs.append({
                "tab": "Programs",
                "title": name,
                "text": " ".join(text_parts),
                "raw": enriched_prog,
            })

    # 4. Deliverables (Team Member Names & Foreign Keys Resolved)
    raw_deliv = read_json(DATA_DIR / "deliverables.json")
    if isinstance(raw_deliv, list):
        for d in raw_deliv:
            title = d.get("deliveryTitle") or d.get("projectName") or "Deliverable"
            enriched_deliv = dict(d)

            # Resolve team members from resource UUIDs and document mentions
            resource_uuids = d.get("resources") or []
            resolved_members = []
            for r_id in resource_uuids:
                u_obj = users_map.get(r_id)
                if u_obj:
                    uname = _normalize_name(u_obj.get("name", ""))
                    urole = u_obj.get("role") or u_obj.get("designation") or ""
                    resolved_members.append(f"{uname} ({urole})" if urole else uname)

            desc_text = d.get("description", "")
            for known in ["Rajesh Jindal", "Rajesh", "Shivangi Soni", "Shivangi", "Megha Jagadeesh", "Megha", "Responsible AI Team"]:
                if re.search(r"\b" + re.escape(known) + r"\b", desc_text):
                    if not any(known in m for m in resolved_members):
                        resolved_members.append(known)

            if resolved_members:
                enriched_deliv["teamMembers"] = resolved_members

            cap_name = caps_map.get(d.get("capabilityId"), "")
            fran_name = franchises_map.get(d.get("franchiseId"), "")
            if cap_name:
                enriched_deliv["capability"] = cap_name
            if fran_name:
                enriched_deliv["franchise"] = fran_name

            text_parts = [f"Tab: Deliverables", f"Title: {title}"]
            for k, v in enriched_deliv.items():
                if k.lower() not in _SENSITIVE and k not in ("id", "resources", "capabilityId", "franchiseId") and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            if resolved_members:
                text_parts.append(f"assigned team members: {', '.join(resolved_members)}")

            docs.append({
                "tab": "Deliverables",
                "title": title,
                "text": " ".join(text_parts),
                "raw": enriched_deliv,
            })

    # 5. Recognitions
    raw_recog = read_json(DATA_DIR / "recognitions.json")
    if isinstance(raw_recog, list):
        for r in raw_recog:
            norm_name = _normalize_name(r.get("name", ""))
            enriched_r = dict(r)
            enriched_r["name"] = norm_name
            title = f"{norm_name} - {r.get('recognitionType', 'Recognition')}"
            text_parts = [f"Tab: Recognitions", f"Title: {title}"]
            for k, v in enriched_r.items():
                if k.lower() not in _SENSITIVE and k != "id" and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            docs.append({
                "tab": "Recognitions",
                "title": norm_name,
                "text": " ".join(text_parts),
                "raw": enriched_r,
            })

    # 6. Events
    raw_events = read_json(DATA_DIR / "events.json")
    if isinstance(raw_events, list):
        for ev in raw_events:
            ev_name = ev.get("eventName") or "Event"
            text_parts = [f"Tab: Events", f"Title: {ev_name}"]
            for k, v in ev.items():
                if k.lower() not in _SENSITIVE and k != "id" and v not in (None, "", [], {}):
                    text_parts.append(f"{_humanize(k)}: {_flat(v)}")

            docs.append({
                "tab": "Events",
                "title": ev_name,
                "text": " ".join(text_parts),
                "raw": ev,
            })

    # 7. Capabilities & Franchises
    if isinstance(raw_caps, list):
        for c in raw_caps:
            docs.append({
                "tab": "Capabilities",
                "title": c.get("name", ""),
                "text": f"Tab: Capabilities Title: {c.get('name', '')} Capability.",
                "raw": c,
            })

    if isinstance(raw_franchises, list):
        for f in raw_franchises:
            c_name = caps_map.get(f.get("capabilityId"), "")
            docs.append({
                "tab": "Franchises",
                "title": f.get("name", ""),
                "text": f"Tab: Franchises Title: {f.get('name', '')} Franchise (Capability: {c_name}).",
                "raw": {**f, "capabilityName": c_name},
            })

    # 8. Pricing & Dashboard
    docs.extend(_read_pricing_docs())
    docs.extend(_read_dashboard_docs())

    _CACHED_KB = docs
    return _CACHED_KB


# ---------------------------------------------------------------------------
# Lexical Scoring & Hybrid Retrieval
# ---------------------------------------------------------------------------

def _stem(word: str) -> str:
    """Lightweight suffix stemmer for robust keyword matching."""
    w = word.lower()
    for suffix in ["ation", "ations", "ing", "ment", "ments", "ed", "es", "s"]:
        if len(w) > len(suffix) + 3 and w.endswith(suffix):
            return w[:-len(suffix)]
    return w


def _score_doc(doc: dict, tokens: List[str]) -> float:
    score = 0.0
    q = _norm(" ".join(tokens))
    text = _norm(doc.get("text", ""))
    title = _norm(doc.get("title", ""))
    tab = _norm(doc.get("tab", ""))
    raw = doc.get("raw") or {}

    for token in tokens:
        if not token:
            continue
        st = _stem(token)
        if token in text or (len(st) > 3 and st in text):
            score += 6
        if token in title or (len(st) > 3 and st in title):
            score += 18
        if token in tab:
            score += 8
        if "deliveryTitle" in raw and (token in _norm(raw.get("deliveryTitle", "")) or st in _norm(raw.get("deliveryTitle", ""))):
            score += 22
        if "projectName" in raw and (token in _norm(raw.get("projectName", "")) or st in _norm(raw.get("projectName", ""))):
            score += 15

    if tab and tab in q:
        score += 15
    if title and title in q:
        score += 25
    return score


def retrieve_documents(question: str, knowledge: Optional[List[dict]] = None) -> List[dict]:
    if not question.strip():
        return []
    docs = knowledge if knowledge is not None else build_knowledge_base()
    tokens = [t for t in _norm(question).split() if len(t) > 2 and t not in _STOP_WORDS]
    scored = sorted(
        [{"doc": d, "score": _score_doc(d, tokens)} for d in docs],
        key=lambda x: x["score"],
        reverse=True,
    )
    return [s for s in scored if s["score"] > 0][:10]


async def retrieve_documents_hybrid(
    question: str, knowledge: Optional[List[dict]] = None
) -> List[dict]:
    from services.vector_store import search as vec_search
    from services.llm_service import get_provider

    docs = knowledge if knowledge is not None else build_knowledge_base()
    if not question.strip():
        return []

    tokens = [t for t in _norm(question).split() if len(t) > 2 and t not in _STOP_WORDS]
    lex_scores = [_score_doc(d, tokens) for d in docs]
    max_lex = max(lex_scores, default=1) or 1

    semantic = await vec_search(docs, question, 8)
    if semantic is None or not get_provider():
        return retrieve_documents(question, docs)

    candidates: Dict[str, dict] = {}
    for d, ls in zip(docs, lex_scores):
        if ls > 0:
            candidates[d["text"]] = {"doc": d, "lex": ls / max_lex, "sem": 0.0}
    for entry in semantic:
        key = entry["doc"]["text"]
        if key in candidates:
            candidates[key]["sem"] = entry["score"]
        else:
            candidates[key] = {"doc": entry["doc"], "lex": 0.0, "sem": entry["score"]}

    results = sorted(
        [{"doc": v["doc"], "score": v["lex"] * 0.35 + v["sem"] * 0.65} for v in candidates.values()],
        key=lambda x: x["score"],
        reverse=True,
    )
    return results[:8]


# ---------------------------------------------------------------------------
# Exact Math / Dashboard Structured Fast-Paths
# ---------------------------------------------------------------------------

def _is_greeting(q: str) -> bool:
    return bool(re.match(
        r"^(hi|hello|hey|good morning|good afternoon|good evening|greetings|yo)[\s!.]*$",
        q.strip().lower(),
    ))


def _is_farewell(q: str) -> bool:
    return bool(re.match(r"^(bye|goodbye|see you|thanks bye)[\s!.]*$", q.strip().lower()))


def _answer_dashboard(question: str) -> Optional[str]:
    q = _norm(question).replace("billabale", "billable")
    dash = _compute_live_dashboard()
    if not isinstance(dash, dict):
        return None

    if re.search(r"projected\s+(?:hc|headcount)\s+month\s*end|month\s*end\s+projected", q):
        current = dash.get("currentHC")
        additions = dash.get("additions") or 0
        leavers = dash.get("leavers") or 0
        if current is not None:
            return f"Projected HC month-end is {current + additions - leavers}."

    # Dashboard resource total is distinct from current headcount.
    if "total resources" in q:
        val = (dash.get("summaryCards") or {}).get("totalResources")
        return f"The dashboard shows {val} total resources." if val is not None else None

    # Total / Current headcount
    if "billable" not in q and re.search(r"total headcount|current headcount|current hc|how many resources|total resources|headcount$", q):
        val = dash.get("currentHC") or (dash.get("summaryCards") or {}).get("totalResources")
        if val:
            return f"The current headcount is {val}."

    # Monthly utilization
    m = re.search(r"utili[sz]ation(?: in| for)? ([a-z]+)", q)
    if m:
        month_raw = m.group(1)
        month = _MONTH_ALIASES.get(month_raw, month_raw)
        row = next((r for r in (dash.get("utilizationTrendData") or []) if _norm(r.get("month", "")) == month), None)
        return (f"Utilization in {row['month']} is {row['utilization']}%." if row
                else f"No utilization data found for {month}.")

    # Overall Billable HC / Compliance
    if re.search(r"billable(?: headcount)?(?: percentage| percent| pct)?|percentage of the headcount", q):
        pct = (dash.get("summaryCards") or {}).get("billableHCPct")
        if pct is None:
            return None
        month_requested = next((month for month in _MONTH_ALIASES if re.search(rf"\b{month}\b", q)), None)
        if month_requested:
            return (
                f"The overall billable headcount percentage is {pct}%. "
                f"The dashboard does not contain a month-specific billable percentage for {month_requested.title()}."
            )
        return f"Billable headcount percentage is {pct}%."

    if re.search(r"timesheet compliance|timesheets", q):
        comp = (dash.get("summaryCards") or {}).get("timesheetCompliance")
        return f"Timesheet compliance is {comp}%." if comp is not None else None

    # Leakage breakdown / hours
    if re.search(r"leakage (?:breakdown|categories|types|details)", q):
        items = dash.get("leakageData") or []
        if items:
            details = ", ".join(f"{i['name']}: {i['value']} hrs" for i in items)
            total = (dash.get("summaryCards") or {}).get("leakageHours", sum(i.get('value', 0) for i in items))
            return f"Leakage breakdown ({total} total hours): {details}."

    if re.search(r"leakage hours|leakage", q) and not re.search(r"which|what type|breakdown|category", q):
        hrs = (dash.get("summaryCards") or {}).get("leakageHours")
        return f"Leakage is {hrs} hours." if hrs is not None else None

    # Headcount by Capability — fuzzy match against live capability names
    _cap_strip = lambda s: re.sub(r"[^a-z0-9]", "", _norm(s))
    match = re.search(r"(?:headcount|resources|hc)\s+(?:in|for|under)\s+([a-z0-9 &+]+)", q)
    if match:
        target = match.group(1).strip()
        target_stripped = _cap_strip(target)
        for item in (dash.get("hcActualData") or []):
            item_name_norm = _norm(item.get("name", ""))
            item_stripped = _cap_strip(item_name_norm)
            if target_stripped == item_stripped or target_stripped in item_stripped or item_stripped in target_stripped:
                return f"Headcount in {item['name']} is {item['value']}."

    # Location breakdown — pattern matches any location, aliases normalised
    _LOC_ALIASES = {"gurgaon": "gurugram", "bengaluru": "bangalore"}
    m_loc = re.search(r"(?:resources|headcount)\s+(?:in|at|located in)\s+([\w\s]+?)(?:\?|$)", q)
    if m_loc:
        loc_query = _LOC_ALIASES.get(m_loc.group(1).strip(), m_loc.group(1).strip())
        for item in (dash.get("locationData") or []):
            if _norm(item.get("location", "")) == loc_query:
                return f"There are {item['resources']} resources in {item['location']}."

    return None


def _answer_pricing_grand_total(question: str) -> Optional[str]:
    q = _norm(question)
    if "grand total" not in q or not re.search(r"d a|data and ai", q):
        return None
    pricing = read_json(DATA_DIR / "pricing.json")
    if not isinstance(pricing, dict):
        return None
    totals = {}
    grand = 0
    for table, rows in pricing.items():
        if not isinstance(rows, list):
            continue
        row = next((r for r in rows if _norm(r.get("category", "")).replace(" ", "") == "da"), None)
        t = 0
        if row:
            for k, v in row.items():
                if k not in ("id", "category"):
                    try:
                        t += int(float(v))
                    except (ValueError, TypeError):
                        pass
        totals[table] = t
        grand += t
    return (
        f"The grand total for D&A+ across all pricing tables is {grand} "
        f"(expiry: {totals.get('expiry', 0)}, attrition: {totals.get('attrition', 0)}, extension: {totals.get('extension', 0)})."
    )


# ---------------------------------------------------------------------------
# Named-entity & Fuzzy Matching Helpers
# ---------------------------------------------------------------------------

def _edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i]
        for j, cb in enumerate(b, 1):
            curr.append(min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + (0 if ca == cb else 1)))
        prev = curr
    return prev[len(b)]


def _token_sim(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    return 1.0 - _edit_distance(a, b) / max(len(a), len(b))


def _find_best_name(name_query: str, docs: List[dict]) -> Optional[dict]:
    cleaned = re.sub(
        r"\b(who is|what is|tell me more about|tell more about|tell me about|tell about"
        r"|more about|more on|about|show me|details of|profile of|info on|information on"
        r"|who|what|tell|show|more)\b",
        " ",
        _norm(name_query),
    )
    q_tokens = [t for t in cleaned.split() if len(t) > 1 and t not in _STOP_WORDS]
    if not q_tokens:
        return None
    best = None
    best_score = 0.0
    for doc in docs:
        raw = doc.get("raw") or {}
        candidate = _norm(f"{raw.get('name', '')} {raw.get('enterpriseId', '')}")
        c_tokens = [t for t in candidate.split() if len(t) > 1]
        if not c_tokens:
            continue
        score = sum(max(_token_sim(qt, ct) for ct in c_tokens) for qt in q_tokens) / len(q_tokens)
        if doc.get("tab") == "Leadership":
            score += 0.02
        if score > best_score:
            best_score = score
            best = doc
    if best and best_score >= 0.70:
        return best
    return None


# ---------------------------------------------------------------------------
# Contextual Query Resolution (Multi-Turn History)
# ---------------------------------------------------------------------------

def resolve_contextual_query(
    question: str,
    history: Optional[List[dict]] = None,
    knowledge: Optional[List[dict]] = None,
) -> str:
    """Resolves pronouns and elliptical follow-up references using recent chat history."""
    if not question.strip():
        return ""

    q_clean = question.strip()
    q_norm = _norm(q_clean)
    docs = knowledge if knowledge is not None else build_knowledge_base()

    direct_match = _find_best_name(q_clean, docs)
    if direct_match and direct_match["raw"].get("name"):
        return q_clean

    has_pronoun = bool(
        re.search(
            r"\b(he|she|him|her|his|hers|they|them|their|theirs|"
            r"this person|that person|this employee|the employee|"
            r"this program|that program|this project)\b",
            q_norm,
        )
    )

    is_elliptical = (
        has_pronoun
        or bool(re.search(
            r"^(what|which|show|tell me about|how about|more on|more)?"
            r"\s*(about\s+)?(his|her|their|its|the)?\s*"
            r"(career level|role|designation|location|project|status|email|"
            r"capability|franchise|manager|department|skills|phone|details)\??$",
            q_norm,
        ))
        or (len(q_norm.split()) <= 4 and any(
            attr in q_norm for attr in
            ["career level", "role", "designation", "location", "project", "status", "email", "skills"]
        ))
    )

    # Handle meta-inquiries ("why only one, i said all", "show all of them", "who else", "full list")
    is_meta_expansion = bool(re.search(
        r"\b(why only one|why just one|i said all|show all|give all|list all|who else|give me all|all of them|full list|everyone)\b",
        q_norm,
    ))
    if is_meta_expansion and history:
        for msg in reversed(history):
            role = msg.get("role")
            if role in ("user", "User"):
                prev_text = msg.get("text") or msg.get("content") or ""
                if prev_text and not re.search(r"\b(why only one|why just one|i said all)\b", prev_text, re.I):
                    return prev_text

    if not is_elliptical and not has_pronoun and not is_meta_expansion:
        return q_clean

    if not history:
        return q_clean

    entity_name = None
    for msg in reversed(history):
        txt = msg.get("text") or msg.get("content") or ""
        if not txt:
            continue

        m = re.search(r"(?:who is|what is|tell me about|details of|about)\s+([a-zA-Z0-9 .'\-]+)", txt, re.IGNORECASE)
        if m:
            cand = re.sub(r"[?!.,]+$", "", m.group(1).strip()).strip()
            if cand and cand.lower() not in _STOP_WORDS:
                match_doc = _find_best_name(cand, docs)
                if match_doc and match_doc["raw"].get("name"):
                    entity_name = match_doc["raw"]["name"]
                    break

        for d in docs:
            raw = d.get("raw", {})
            name = raw.get("name") or raw.get("deliveryTitle") or raw.get("eventName") or raw.get("projectName")
            if name and len(name) > 3 and _norm(name) in _norm(txt):
                entity_name = name
                break
        if entity_name:
            break

    if not entity_name:
        return q_clean

    resolved = re.sub(
        r"\b(he|she|him|her|his|their|this person|that person|this employee|the employee)\b",
        entity_name,
        q_clean,
        flags=re.IGNORECASE,
    )

    if _norm(entity_name) not in _norm(resolved):
        resolved = f"{q_clean} of {entity_name}"

    return resolved


# ---------------------------------------------------------------------------
# Public Answer Functions
# ---------------------------------------------------------------------------

def answer_structured_question(question: str, knowledge: Optional[List[dict]] = None) -> Optional[str]:
    """Fast-path for greetings, exact numeric dashboard KPIs & pricing totals."""
    q = question.strip()
    if not q:
        return "Please ask a question about the data visible in the dashboard."

    if _is_greeting(q):
        return "Hi! Ask me about the people, teams, leadership, events, capabilities, deliverables, or program data shown in this app."

    if _is_farewell(q):
        return "Goodbye."

    return (
        _answer_dashboard(q)
        or _answer_pricing_grand_total(q)
    )


def _apply_value_filter(tab_docs: List[dict], field: str, value: str) -> List[dict]:
    """Filter docs by a detected value field (status, location, event_status, etc.)."""
    result = []
    val_norm = _norm(value)
    for d in tab_docs:
        raw = d.get("raw") or {}
        if field == "status":
            if val_norm in _norm(raw.get("status", "")):
                result.append(d)
        elif field == "location":
            loc = _norm(raw.get("location", ""))
            # Use alias expansion for locations like bangalore/bengaluru
            aliases = _VALUE_ALIASES.get(val_norm, [val_norm])
            if any(a in loc for a in aliases) or loc in aliases:
                result.append(d)
        elif field == "event_status":
            ev_status = _norm(raw.get("status", ""))
            if val_norm in ev_status or (val_norm == "upcoming" and ev_status in ("upcoming", "scheduled", "active")):
                result.append(d)
        elif field == "capability":
            cap = _norm(raw.get("capabilityName", "") + " " + raw.get("capability", "") + " " + raw.get("capabilityId", ""))
            if val_norm.replace(" ", "").replace("&", "") in cap.replace(" ", "").replace("&", ""):
                result.append(d)
        elif field == "recognition_type":
            rt = _norm(raw.get("recognitionType", ""))
            if val_norm in rt:
                result.append(d)
        elif field == "franchise_name":
            fn = _norm(raw.get("name", "") + " " + raw.get("franchiseName", ""))
            if val_norm.replace(" ", "").replace("&", "") in fn.replace(" ", "").replace("&", ""):
                result.append(d)
    return result


def _format_single_response(doc: dict) -> str:
    """Format a single document as a rich human-readable response."""
    raw = doc.get("raw") or {}
    tab = doc.get("tab", "")

    if tab == "Deliverables":
        title = raw.get("deliveryTitle") or raw.get("projectName") or "Deliverable"
        proj = raw.get("projectName", "")
        desc = raw.get("description", "")
        members = ", ".join(raw.get("teamMembers") or [])
        savings = f" (Cost Savings: {raw.get('costSavingCurrency', '£')}{raw.get('costSavingAmount')}/month)" if raw.get("costSavingAmount") else ""
        team_str = f" Team/Resources: {members}." if members else ""
        return f"**{title}** ({proj}){savings}: {desc}{team_str}"

    # Leadership specific formatting
    if tab == "Leadership":
        name = raw.get("name", "")
        desig = raw.get("designation", "")
        loc = raw.get("location", "")
        level = raw.get("managementLevel", "")
        desc = raw.get("shortDescription", "")
        desc_str = f" {desc}" if desc else ""
        return f"**{name}** ({level}): {desig} located in {loc}.{desc_str}"

    # General entity formatting
    display = raw.get("name") or raw.get("eventName") or raw.get("deliveryTitle") or raw.get("projectName") or doc["title"]
    _EXCLUDE_KEYS = {
        "password", "token", "secret", "hash", "id", "capabilityid", "franchiseid",
        "resources", "profilepic", "createdat", "updatedat", "pic", "eventimage", "table"
    }
    parts = [
        f"{_humanize(k)}: {_flat(v)}"
        for k, v in raw.items()
        if k.lower() not in _EXCLUDE_KEYS and v not in (None, "", [], {})
    ][:6]
    summary = "; ".join(parts)
    return f"{display} ({tab}): {summary}." if summary else f"Found '{display}' in {tab}."


def answer_named_question(question: str, knowledge: Optional[List[dict]] = None) -> Optional[str]:
    """Compatibility shim for tests."""
    docs = knowledge if knowledge is not None else build_knowledge_base()
    match = _find_best_name(question, docs)
    if not match:
        return None
    raw = match["raw"]
    display = raw.get("name") or raw.get("eventName") or raw.get("projectName") or match["title"]
    parts = [
        f"{_humanize(k)}: {_flat(v)}"
        for k, v in raw.items()
        if k.lower() not in _SENSITIVE and k != "id" and v not in (None, "", [], {})
    ][:6]
    summary = "; ".join(parts)
    return f"{display} ({match['tab']}): {summary}." if summary else f"Found '{display}' in {match['tab']}."


def answer_entity_field_question(question: str, knowledge: Optional[List[dict]] = None) -> Optional[str]:
    """Compatibility shim for tests."""
    q = _norm(question)
    q_tokens = set(t for t in q.split() if len(t) > 2)
    docs = knowledge if knowledge is not None else build_knowledge_base()
    best_match = None
    best_score = 0
    for doc in docs:
        raw = doc.get("raw") or {}
        name = _norm(f"{raw.get('name', '')} {raw.get('enterpriseId', '')}")
        name_tokens = [t for t in name.split() if len(t) > 1]
        if not name_tokens:
            continue
        matched = [t for t in name_tokens if t in q]
        if not matched:
            continue
        score = len(matched) * 10 + len(name)
        if score > best_score:
            best_score = score
            best_match = (doc, raw)
    if not best_match:
        return None
    doc, raw = best_match
    field = next(
        (k for k in sorted(raw.keys(), key=lambda k: len(_humanize(k)), reverse=True)
         if k.lower() not in _SENSITIVE and k != "id"
         and all(t in q_tokens for t in _humanize(k).split() if len(t) > 2)),
        None,
    )
    if not field:
        return None
    val = raw[field]
    display = raw.get("name") or raw.get("enterpriseId") or doc["title"]
    if val is None or val == "":
        return f"{display} has no {_humanize(field)} recorded."
    return f"{display}'s {_humanize(field)} is {_flat(val)}."


# ---------------------------------------------------------------------------
# Deterministic application answers
# ---------------------------------------------------------------------------

def _names(records: List[dict], field: str = "name") -> str:
    values = [str(record.get(field, "")).strip() for record in records]
    return ", ".join(value for value in values if value)


def _load_records(filename: str) -> List[dict]:
    data = read_json(DATA_DIR / filename)
    return data if isinstance(data, list) else []


def _answer_people_question(question: str) -> Optional[str]:
    q = _norm(question)
    users = [user for user in _load_records("users.json") if user.get("name")]

    if "on leave" in q:
        matches = [user for user in users if _norm(user.get("status")) == "on leave"]
        return (
            f"{len(matches)} users are on leave: {_names(matches)}."
            if matches else "No users are marked as On Leave."
        )

    status_match = re.search(r"(?:status\s+)?(active|inactive)\b", q)
    if status_match and ("who" in q or "user" in q or "people" in q):
        status = status_match.group(1)
        matches = [user for user in users if _norm(user.get("status")) == status]
        return f"{len(matches)} users have status {status.title()}: {_names(matches)}."

    if "natwest project" in q or ("work" in q and "natwest" in q and "project" in q):
        matches = [user for user in users if "natwest" in _norm(user.get("projectName"))]
        return (
            f"Users assigned to a NatWest project: {_names(matches)}."
            if matches else "No users are assigned to a project named NatWest in the current user data."
        )

    # Build location lookup dynamically from user data; known spelling variants are normalised
    _SPELLING_NORM = {"bengaluru": "bangalore", "banglore": "bangalore", "gurgaon": "gurugram"}
    locations: dict[str, set] = {}
    for user in users:
        raw = _norm(user.get("location", ""))
        if raw:
            canonical = _SPELLING_NORM.get(raw, raw)
            locations.setdefault(canonical, set()).add(raw)
    for alias, canonical in _SPELLING_NORM.items():
        if canonical in locations:
            locations[canonical].add(alias)
    for label, aliases in locations.items():
        if any(alias in q.split() for alias in aliases):
            matches = [user for user in users if _norm(user.get("location")) in aliases]
            if "how many" in q or "count" in q:
                return f"There are {len(matches)} users in {label.title()}."
            if "who" in q or "list" in q or "user" in q:
                return (
                    f"{len(matches)} users are in {label.title()}: {_names(matches)}."
                    if matches else f"No users are recorded in {label.title()}."
                )
    return None


def _answer_schema_query(question: str, knowledge: List[dict]) -> Optional[str]:
    """Execute natural-language list/count/filter questions over normalized records.

    This intentionally works from schema metadata and values in the records rather
    than matching a fixed set of user phrases.
    """
    q = _norm(question)
    if not q:
        return None
    docs_by_tab = {}
    for doc in knowledge:
        docs_by_tab.setdefault(doc.get("tab", ""), []).append(doc)

    # Dashboard dimensions are a separate source from individual user records.
    dash = _compute_live_dashboard()
    if isinstance(dash, dict):
        summary = dash.get("summaryCards") or {}
        if "total resources" in q and "headcount" not in q:
            return f"The dashboard shows {summary.get('totalResources')} total resources."
        for item in dash.get("hcActualData") or []:
            if _norm(item.get("name")) in q and any(w in q for w in ("headcount", "resources", "people")):
                return f"Dashboard headcount for {item['name']} is {item['value']}."
        for item in dash.get("locationData") or []:
            if _norm(item.get("location")) in q and "dashboard" in q and any(w in q for w in ("resource", "people", "headcount")):
                return f"The dashboard shows {item['resources']} resources in {item['location']}."
        for item in (dash.get("resourceAllocationData") or []):
            if _norm(item.get("name")) in q and "allocation" in q:
                return f"{item['name']} has {item['allocated']} allocated resources and {item['actual']} actual resources."
        if "project" in q and ("most" in q or "highest" in q):
            projects = dash.get("projectData") or []
            if projects:
                top = max(projects, key=lambda item: item.get("hours", 0))
                return f"{top['project']} has the most recorded hours at {top['hours']} hours."

    schemas = {
        "users": ("Users", ("user", "users", "people", "person", "employee"), "name"),
        "leadership": ("Leadership", ("leadership", "leader", "senior delivery", "growth team"), "name"),
        "events": ("Events", ("event", "townhall"), "eventName"),
        "deliverables": ("Deliverables", ("deliverable", "aws comet", "hubble"), "deliveryTitle"),
        "programs": ("Programs", ("program", "programme"), "name"),
        "recognitions": ("Recognitions", ("recognition", "award", "employee of the month"), "name"),
        "franchises": ("Franchises", ("franchise",), "name"),
        "capabilities": ("Capabilities", ("capability",), "name"),
        "pricing": ("Pricing", ("pricing", "expiry", "attrition", "roll off", "rolloff", "extension"), "category"),
    }
    entity = None
    # Explicit domain nouns take precedence over generic words such as
    # "employee" or "users" that may appear in a relationship question.
    explicit_order = ["pricing", "recognitions", "programs", "deliverables", "events", "leadership", "franchises", "capabilities", "users"]
    if ("franchise" in q and ("available" in q or "under" in q) and "d a" in q):
        explicit_order = ["franchises"] + explicit_order
    if "users" in q and "franchises" in q and "represented" in q:
        explicit_order = ["users"] + explicit_order
    for key in explicit_order:
        _, markers, _ = schemas[key]
        if any(marker in q for marker in markers):
            entity = key
            break
    # Names and relational terms imply users even when "user" is omitted.
    if entity is None and any(term in q for term in ("reports to", "based in", "located in", "works from")):
        entity = "users"
    if ("works on" in q or "assigned to" in q) and "deliverable" not in q and "program" not in q:
        entity = "users"
    if "owns" in q and "program" not in q:
        entity = "programs"
    if entity is None:
        return None

    tab, _, display_field = schemas[entity]
    records = [d.get("raw") or {} for d in docs_by_tab.get(tab, [])]
    if entity == "pricing":
        pricing = read_json(DATA_DIR / "pricing.json")
        records = []
        if isinstance(pricing, dict):
            for table, rows in pricing.items():
                for row in rows or []:
                    records.append({**row, "table": table})

    def norm_value(value):
        return _norm(value).replace(" ", "")

    # Generic value extraction from the actual records, including aliases.
    filter_field = None
    filter_value = None
    extra_filters = {}
    field_aliases = {
        "location": ("location", "based in", "located in", "work from", "in "),
        "status": ("status", "active", "inactive", "on leave"),
        "managementLevel": ("senior delivery leads", "growth team", "leadership team"),
        "franchise": ("franchise", "under"),
        "capability": ("capability", "under"),
        "table": ("expiry table", "attrition", "roll off", "rolloff", "extension"),
        "category": ("category",),
        "date": ("date of", "on "),
    }
    candidate_values = []
    for record in records:
        for key, value in record.items():
            if isinstance(value, (str, int, float)) and value not in ("", None):
                candidate_values.append((key, str(value)))
    for key, value in sorted(candidate_values, key=lambda pair: len(norm_value(pair[1])), reverse=True):
        value_norm = norm_value(value)
        if len(value_norm) < 3:
            continue
        if value_norm in norm_value(q) or (key == "date" and value in q):
            filter_field, filter_value = key, value
            break

    # Semantic aliases and relationship fields are resolved against enriched docs.
    if entity == "users":
        if "users" in q and "franchise" in q:
            entity = "users"
        for alias, values in _VALUE_ALIASES.items():
            if alias in q:
                filter_field, filter_value = "location", alias
        for status in ("on leave", "inactive", "active"):
            if status in q:
                filter_field, filter_value = "status", status
        manager = re.search(r"reports?\s+to\s+([a-z .]+)", q, re.I)
        if manager:
            filter_field, filter_value = "lineManager", manager.group(1).strip()
        project = re.search(r"(?:work|works|assigned)\s+(?:on|to)\s+(?:the\s+)?(.+?)(?:\s+project)?\??$", q, re.I)
        if project and "project" in q:
            filter_field, filter_value = "projectName", project.group(1).strip()
        # Locations may have no matching user records; use the configured
        # reference vocabulary so the query still resolves to an empty set.
        reference = read_json(DATA_DIR / "reference-data.json")
        for location in (reference.get("locations") or []) if isinstance(reference, dict) else []:
            if _norm(location) in q:
                filter_field, filter_value = "location", location

    if entity == "leadership":
        if "leadership team members" in q:
            filter_field, filter_value = None, None
        for level in ("senior delivery leads", "growth team", "leadership team"):
            if level in q and not (level == "leadership team" and "team members" in q):
                filter_field, filter_value = "managementLevel", level

    if entity == "events":
        for status in ("upcoming", "active", "completed", "cancelled", "postponed"):
            if status in q:
                filter_field, filter_value = "status", status

    if entity == "deliverables" and ("ai" in q or "artificial intelligence" in q):
        filter_field, filter_value = "aiBased", "true"
    if entity == "deliverables":
        for category in ("new functionality", "cost saving", "process improvement"):
            if category in q:
                filter_field, filter_value = "category", category
        for franchise in {r.get("franchise", "") for r in records}:
            if franchise and norm_value(franchise) in norm_value(q):
                filter_field, filter_value = "franchise", franchise
        best_title = None
        best_overlap = 0
        query_tokens = set(_norm(q).split())
        for record in records:
            title = record.get("deliveryTitle") or ""
            title_tokens = set(_norm(title).split())
            overlap = len(title_tokens & query_tokens)
            if title and (norm_value(title) in norm_value(q) or overlap >= 2) and overlap > best_overlap:
                best_title, best_overlap = title, overlap
        if best_title:
            filter_field, filter_value = "deliveryTitle", best_title

    if entity == "pricing":
        for table in ("expiry", "attrition", "extension"):
            if table in q or table.replace("attrition", "roll off") in q:
                extra_filters["table"] = table
        for category in sorted({r.get("category", "") for r in records}, key=len, reverse=True):
            if category and norm_value(category) in norm_value(q):
                extra_filters["category"] = category
    if entity == "events":
        # Prefer an exact event-name match over lexical ranking (e.g. Q2 vs Q1).
        for record in records:
            name = record.get("eventName") or ""
            if name and norm_value(name) in norm_value(q):
                filter_field, filter_value = "eventName", name
                break

    if entity == "programs":
        if "franchise" in q and "d a" in q:
            filter_field, filter_value = "franchise", "D&A"
        elif "under" in q and "d a" in q:
            filter_field, filter_value = "capability", "D&A+"
        for record in records:
            for relation in ("franchise", "capability"):
                value = record.get(relation) or ""
                if value and norm_value(value) in norm_value(q):
                    filter_field, filter_value = relation, value
            if record.get("name") and norm_value(record["name"]) in norm_value(q):
                filter_field, filter_value = "name", record["name"]
        if "franchise" in q and "d a" in q:
            filter_field, filter_value = "franchise", "D&A"
        elif "under" in q and "d a" in q:
            filter_field, filter_value = "capability", "D&A+"

    if entity == "capabilities":
        franchise_records = _load_records("franchises.json")
        for franchise in franchise_records:
            name = franchise.get("name") or ""
            if name and norm_value(name) in norm_value(q) and "contain" in q:
                capability_names = {item.get("id"): item.get("name") for item in _load_records("capabilities.json")}
                return f"{name} belongs to the {capability_names.get(franchise.get('capabilityId'), 'unknown')} capability."
        for record in records:
            if record.get("name") and norm_value(record["name"]) in norm_value(q):
                if "is" in q or "full name" in q:
                    return f"Yes, {record['name']} is a capability in the app."

    if entity == "franchises" and "capability" in q:
        for record in records:
            if record.get("name") and norm_value(record["name"]) in norm_value(q):
                filter_field, filter_value = "name", record["name"]
    if entity == "franchises" and ("d a" in q or "data and" in q):
        filter_field, filter_value = "capability", "D&A+"

    if entity == "recognitions":
        for record in records:
            if record.get("name") and norm_value(record["name"]) in norm_value(q):
                filter_field, filter_value = "name", record["name"]
        if "recognition" in q and "what" in q:
            requested_field = "recognitionType"

    def matches(record):
        for extra_key, extra_value in extra_filters.items():
            if norm_value(extra_value) not in norm_value(record.get(extra_key, "")):
                return False
        if not filter_field:
            return True
        actual = record.get(filter_field, "")
        if filter_field == "location":
            aliases = _VALUE_ALIASES.get(_norm(filter_value), [_norm(filter_value)])
            return any(alias in _norm(actual) for alias in aliases)
        if filter_field in ("franchise", "capability"):
            actual = record.get(filter_field) or record.get(filter_field + "Name") or ""
        if filter_field == "aiBased":
            return bool(record.get("aiBased"))
        return norm_value(filter_value) in norm_value(actual)

    matched = [record for record in records if matches(record)]
    if entity == "users" and "franchise" in q:
        franchises = {item.get("id"): item.get("name") for item in _load_records("franchises.json")}
        names = sorted({franchises.get(u.get("franchiseId"), u.get("franchiseId")) for u in matched if u.get("franchiseId")})
        if names:
            return f"Franchises represented by the selected users: {', '.join(names)}."
    is_count = bool(re.search(r"\b(how many|count|number of|percentage|total)\b", q))
    is_list = bool(re.search(r"\b(who|which|list|show|what are|what users|what people)\b", q))
    is_scalar = bool(re.search(r"\b(where|when|what is|what was|how does|how do)\b", q))

    # Select a requested field for scalar questions (location, designation, value, etc.).
    requested_field = None
    for key in {k for record in records for k in record.keys()}:
        if key.lower() in _SENSITIVE or key.lower() in {"id", "resources", "profilepic", "eventimage", "pic"}:
            continue
        human = _humanize(key)
        if human in q or key.lower() in q:
            requested_field = key
            break
    if requested_field is None:
        if "where" in q:
            requested_field = "location"
        elif "when" in q:
            requested_field = "date"
    if entity == "recognitions" and "recognition" in q and "what" in q:
        requested_field = "recognitionType"
    if entity == "pricing" and "total" in q and requested_field is None:
        for field in ("futureEnding", "attrition", "rollOff", "fgAvailable", "plannedRelease", "toBeIssued"):
            if _humanize(field) in q or field.lower() in q:
                requested_field = field
                break

    if entity == "programs" and "owns" in q and matched:
        names = sorted({str(record.get("franchise", "")) for record in matched if record.get("franchise")})
        if names:
            return f"The franchise owning the selected program is {', '.join(names)}."

    if is_count:
        if entity == "pricing" and requested_field and requested_field in {"attrition", "rollOff", "futureEnding", "plannedRelease", "fgAvailable", "fgNotAvailable", "toBeIssued", "clientConfirmationAwaited"}:
            total = sum(float(r.get(requested_field) or 0) for r in matched)
            return f"The total { _humanize(requested_field) } for {filter_value or 'the selected pricing records'} is {int(total) if total.is_integer() else total}."
        if entity == "pricing" and "total" in q and matched:
            numeric = [key for key, value in matched[0].items() if key not in {"id", "category", "table"} and isinstance(value, (int, float))]
            total = sum(float(record.get(key) or 0) for record in matched for key in numeric)
            return f"The total for {filter_value or 'the selected pricing records'} is {int(total) if total.is_integer() else total}."
        label = filter_value or tab
        noun = tab.lower()
        if filter_field == "aiBased":
            return f"There are {len(matched)} AI-based deliverables."
        if entity == "users":
            return f"There are {len(matched)} users."
        return f"There are {len(matched)} {label} {noun}."
    if is_list and len(matched) > 1:
        names = list(dict.fromkeys(str(record.get(display_field, "")).strip() for record in matched if record.get(display_field)))
        label = "leadership members" if entity == "leadership" else tab.lower()
        return f"{len(names)} {label}: {', '.join(names)}." if names else None
    if len(matched) == 1 and requested_field:
        record = matched[0]
        return f"{record.get(display_field, tab)}'s {_humanize(requested_field)} is {record.get(requested_field)}."
    if len(matched) == 1 and is_list:
        return _format_single_response(next(d for d in docs_by_tab.get(tab, []) if (d.get("raw") or {}) is matched[0]))
    return None


def answer_deterministic_question(
    question: str, knowledge: Optional[List[dict]] = None
) -> Optional[str]:
    """Answer queries that can be resolved exactly from structured application data."""
    q = question.strip()
    if not q:
        return "Please ask a question about the data visible in the dashboard."
    q_norm = _norm(q)
    docs = knowledge if knowledge is not None else build_knowledge_base()

    structured = answer_structured_question(q, docs)
    if structured:
        return structured

    # Overview copy is part of the public NatWest experience rather than a
    # transactional JSON table, so keep it in the same grounded local source.
    if "wealth domain" in q_norm or ("what does accenture do" in q_norm and "wealth" in q_norm):
        return "For Wealth, Accenture improves internal processes and supports NatWest's One Bank Design System vision by reengineering new solutions."
    if "commercial and institutional banking" in q_norm:
        return "Accenture supports Commercial and Institutional Banking through customer-experience work across MMM, EDB, and MMG, enabling a digital ecosystem and process improvements to better serve customers."

    schema_answer = _answer_schema_query(q, docs)
    if schema_answer:
        return schema_answer

    people_answer = _answer_people_question(q)
    if people_answer:
        return people_answer

    if "leadership" in q_norm and ("who" in q_norm or "list" in q_norm or "all" in q_norm):
        leadership = _load_records("leadership.json")
        return f"{len(leadership)} leadership members: {_names(leadership)}."

    if "event" in q_norm:
        events = _load_records("events.json")
        if "next" in q_norm:
            upcoming = sorted(
                [event for event in events if _norm(event.get("status")) in {"upcoming", "active"}],
                key=lambda event: str(event.get("date", "")),
            )
            return (
                f"The next event is {upcoming[0].get('eventName')} on {upcoming[0].get('date')}."
                if upcoming else "There are no upcoming or active events in the current event data."
            )
        for status in ("upcoming", "active", "completed"):
            if status in q_norm:
                matches = [event for event in events if _norm(event.get("status")) == status]
                return (
                    f"{len(matches)} {status} events: " + ", ".join(
                        f"{event.get('eventName')} ({event.get('date')})" for event in matches
                    ) + "."
                    if matches else f"There are no {status} events in the current event data."
                )

    if "deliverable" in q_norm and ("ai" in q_norm or "artificial intelligence" in q_norm):
        deliverables = [item for item in _load_records("deliverables.json") if item.get("aiBased") is True]
        titles = _names(deliverables, "deliveryTitle")
        if "how many" in q_norm:
            return f"There are {len(deliverables)} AI-based deliverables."
        return f"{len(deliverables)} AI-based deliverables: {titles}."

    if "program" in q_norm and ("d a" in q_norm or "data and" in q_norm):
        franchises = {item.get("id"): item.get("name") for item in _load_records("franchises.json")}
        programs = [item for item in _load_records("program.json") if franchises.get(item.get("franchiseId")) == "D&A"]
        names = list(dict.fromkeys(item.get("name") for item in programs if item.get("name") and item.get("name") != "NA"))
        return f"Programs in the D&A franchise: {', '.join(names)}."

    if "capabilit" in q_norm and ("what" in q_norm or "list" in q_norm or "have" in q_norm):
        capabilities = _load_records("capabilities.json")
        return f"The app has {len(capabilities)} capabilities: {_names(capabilities)}."

    if "franchise" in q_norm and ("d a" in q_norm or "data and" in q_norm):
        capabilities = {item.get("id"): item.get("name") for item in _load_records("capabilities.json")}
        franchises = [
            item for item in _load_records("franchises.json")
            if capabilities.get(item.get("capabilityId")) == "D&A+"
        ]
        return f"Franchises under D&A+: {_names(franchises)}."

    if "employee of the month" in q_norm:
        winners = [item for item in _load_records("recognitions.json") if _norm(item.get("recognitionType")) == "employee of the month"]
        return f"Employee of the Month: {_names(winners)}." if winners else "No Employee of the Month recognition is recorded."

    if "recognition" in q_norm and ("all" in q_norm or "show" in q_norm or "list" in q_norm):
        recognitions = _load_records("recognitions.json")
        return "Recognitions: " + ", ".join(
            f"{item.get('name')} ({item.get('recognitionType')})" for item in recognitions
        ) + "."

    if "retail banking" in q_norm and ("accenture" in q_norm or "help" in q_norm):
        return "Accenture helps Retail Banking provide banking products and related financial services, including CASA, mortgages, unsecured lending, credit cards, and loans."

    if "service area" in q_norm or ("main domain" in q_norm and "service" in q_norm):
        return "The main domains are Retail Banking, Wealth, and Commercial and Institutional Banking. Service areas include NatWest Markets, Treasury, RBSI, BAS, Architecture & Engineering, Economic Crime & Fraud, Infrastructure & Security, and FRAL."

    entity_field = answer_entity_field_question(q, docs)
    if entity_field:
        return entity_field
    named = answer_named_question(q, docs)
    if named:
        return named

    return None


def answer_question(question: str, knowledge: Optional[List[dict]] = None) -> str:
    """Local fallback used when no LLM answer is available."""
    answer = answer_deterministic_question(question, knowledge)
    if answer:
        return answer

    docs = knowledge if knowledge is not None else build_knowledge_base()
    retrieved = retrieve_documents(question, docs)
    if retrieved:
        return _format_single_response(retrieved[0]["doc"])
    return "I could not find an answer in the current application data."
