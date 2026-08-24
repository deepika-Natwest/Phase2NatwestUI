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

_STATUS_ALIASES = {
    "inactive": "Inactive",
    "active": "Active",
    "on leave": "On Leave",
}

_VALUE_ALIASES: Dict[str, List[str]] = {
    "data and ai": ["d&a", "d&a+", "data & ai", "data and analytics"],
    "d&a": ["d&a", "d&a+", "data & ai", "data and analytics"],
    "bangalore": ["bangalore", "bengaluru", "banglore"],
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


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def _norm(text: Any = "") -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", str(text).lower())).strip()


def _flat(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(_flat(v) for v in value)
    if isinstance(value, dict):
        return " ".join(f"{k} {_flat(v)}" for k, v in value.items())
    return str(value)


def _humanize(field: str) -> str:
    s = re.sub(r"([a-z])([A-Z])", r"\1 \2", field)
    return re.sub(r"[_\-]+", " ", s).lower()


def _contains(text: Any, term: str) -> bool:
    pattern = r"(^|\s)" + re.escape(term) + r"($|\s)"
    return bool(re.search(pattern, _norm(text)))


# ---------------------------------------------------------------------------
# Knowledge base construction
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
                "title": category,
                "text": f"Tab: Pricing Table: {table} Category: {category} {values}",
                "raw": {**row, "table": table},
            })
    return docs


def build_knowledge_base() -> List[dict]:
    docs: List[dict] = []
    for key, label in _TAB_LABELS.items():
        items = read_json(DATA_DIR / f"{key}.json")
        if not isinstance(items, list):
            continue
        for item in items:
            title = (
                item.get("name") or item.get("eventName") or item.get("projectName")
                or item.get("title") or item.get("designation") or item.get("deliveryTitle")
                or item.get("capability") or item.get("enterpriseId") or "Record"
            )
            text = " ".join(
                [f"Tab: {label}", f"Title: {title}"]
                + [
                    f"{_humanize(k)}: {_flat(v)}"
                    for k, v in item.items()
                    if k.lower() not in _SENSITIVE
                ]
            )
            docs.append({"tab": label, "title": title, "text": text, "raw": item})
    return docs + _read_pricing_docs()


# ---------------------------------------------------------------------------
# Lexical scoring
# ---------------------------------------------------------------------------

def _score_doc(doc: dict, tokens: List[str]) -> float:
    score = 0.0
    q = _norm(" ".join(tokens))
    text = _norm(doc["text"])
    for token in tokens:
        if not token:
            continue
        if _contains(text, token):
            score += 6
        if _contains(doc["title"], token):
            score += 10
        if _contains(doc["tab"], token):
            score += 8
    if _norm(doc["tab"]) in q:
        score += 20
    if _norm(doc["title"]) in q:
        score += 20
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
    return [s for s in scored if s["score"] > 0][:5]


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

    semantic = await vec_search(docs, question, 5)
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
        [{"doc": v["doc"], "score": v["lex"] * 0.45 + v["sem"] * 0.55} for v in candidates.values()],
        key=lambda x: x["score"],
        reverse=True,
    )
    return results[:5]


# ---------------------------------------------------------------------------
# Specialised rule-based answerers
# ---------------------------------------------------------------------------

def _answer_dashboard(question: str) -> Optional[str]:
    q = _norm(question)
    dash = read_json(DATA_DIR / "public-dashboard.json")
    if not isinstance(dash, dict):
        return None

    if re.search(r"total headcount|current headcount|current hc|how many resources|total resources", q):
        val = dash.get("currentHC") or (dash.get("summary") or {}).get("totalResources")
        return f"The current headcount is {val}."

    m = re.search(r"utili[sz]ation(?: in| for)? ([a-z]+)", q)
    if m:
        month_raw = m.group(1)
        month = _MONTH_ALIASES.get(month_raw, month_raw)
        row = next((r for r in (dash.get("utilizationTrendData") or []) if _norm(r.get("month", "")) == month), None)
        return (f"Utilization in {row['month']} is {row['utilization']}%." if row
                else f"No utilization data found for {month}.")

    if re.search(r"billable headcount|billable hc", q):
        return f"Billable headcount is {(dash.get('summary') or {}).get('billableHC')}."
    if re.search(r"timesheet compliance|timesheets", q):
        return f"Timesheet compliance is {(dash.get('summary') or {}).get('timesheetCompliance')}."
    if re.search(r"leakage hours|leakage", q) and not re.search(r"which|what type|breakdown", q):
        return f"Leakage is {(dash.get('summary') or {}).get('leakageHours')} hours."
    return None


def _answer_users_by_status(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    status_match = next(
        ((alias, label) for alias, label in _STATUS_ALIASES.items()
         if re.search(r"\b" + re.escape(alias) + r"\b", q)),
        None,
    )
    if not status_match:
        return None
    _, label = status_match
    if not re.search(r"user|users|people|employees|staff|who|list|show|how many|count", q):
        return None
    matches = [d for d in docs if d["tab"] == "Users" and _norm(d["raw"].get("status", "")) == _norm(label)]
    if re.search(r"how many|count|number of", q):
        return f"{len(matches)} users have status {label}."
    names = ", ".join(d["raw"].get("name") or d["raw"].get("enterpriseId", "") for d in matches if d["raw"].get("name") or d["raw"].get("enterpriseId"))
    return (f"{len(matches)} users have status {label}: {names}." if matches
            else f"No users have status {label}.")


def _answer_users_by_location(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"list|show|who|users|people|employees|how many|count", q):
        return None
    user_docs = [d for d in docs if d["tab"] == "Users" and d["raw"].get("location")]
    locations = sorted(
        {_norm(d["raw"]["location"]) for d in user_docs},
        key=len, reverse=True,
    )
    found_loc = None
    for loc in locations:
        aliases = _VALUE_ALIASES.get(loc, [loc])
        if any(re.search(r"\b" + re.escape(_norm(a)) + r"\b", q) for a in aliases):
            found_loc = loc
            break
    if not found_loc:
        return None
    aliases = _VALUE_ALIASES.get(found_loc, [found_loc])
    matches = [d for d in user_docs if _norm(d["raw"]["location"]) in aliases or _norm(d["raw"]["location"]) == found_loc]
    if re.search(r"how many|count|number of", q):
        return f"{len(matches)} users are in {found_loc}."
    names = ", ".join(d["raw"].get("name") or d["raw"].get("enterpriseId", "") for d in matches)
    return f"{len(matches)} users are in {found_loc}: {names}." if matches else f"No users were found in {found_loc}."


def _answer_users_by_project(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"(users|people|employees|staff).*(work|assigned|on|in)|who.*(work|assigned)", q):
        return None
    user_docs = [d for d in docs if d["tab"] == "Users" and d["raw"].get("projectName")]
    projects = sorted(
        {_norm(d["raw"]["projectName"]) for d in user_docs if _norm(d["raw"]["projectName"]) not in ("", "na")},
        key=len, reverse=True,
    )
    proj = next((p for p in projects if p in q), None)
    if not proj:
        return None
    matches = [d for d in user_docs if _norm(d["raw"]["projectName"]) == proj]
    raw_name = matches[0]["raw"]["projectName"] if matches else proj
    names = ", ".join(d["raw"].get("name", "") for d in matches if d["raw"].get("name"))
    return (f"{len(matches)} users work on {raw_name}: {names}." if matches
            else f"No users work on {proj}.")


def _answer_leadership(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"leadership|leaders|leadership team", q):
        return None
    if not re.search(r"list|show|who|members|all", q):
        return None
    records = [d for d in docs if d["tab"] == "Leadership"]
    names = ", ".join(d["raw"].get("name", "") for d in records if d["raw"].get("name"))
    return (f"{len(records)} leadership members: {names}." if records
            else "No leadership members were found.")


def _answer_events_by_status(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    statuses = ["upcoming", "active", "completed", "cancelled", "postponed"]
    status = next((s for s in statuses if s in q), None)
    if not status or not re.search(r"event|events", q) or not re.search(r"which|what|list|show|all", q):
        return None
    matches = [d for d in docs if d["tab"] == "Events" and _norm(d["raw"].get("status", "")) == status]
    label = status.title()
    return (f"{len(matches)} {label.lower()} events: {', '.join(d['raw'].get('eventName', '') for d in matches)}."
            if matches else f"No {label.lower()} events were found.")


def _answer_recognition(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"recognition|award|awarded|honored|honour", q):
        return None
    matches = [d for d in docs if d["tab"] == "Recognitions" and d["raw"].get("name") and _norm(d["raw"]["name"]) in q]
    if not matches:
        return None
    parts = []
    for d in matches:
        raw = d["raw"]
        details = "; ".join(filter(None, [raw.get("recognitionType"), raw.get("recognitionTag"), raw.get("shortDescription")]))
        parts.append(f"{raw['name']}: {details or 'recognition recorded'}")
    return " ".join(parts)


def _answer_domain_list(question: str) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"domain|domains|area|areas|service|services|vertical|verticals", q):
        return None
    if not re.search(r"what|which|list|show|all", q):
        return None
    domains = [
        "Retail Banking", "Wealth", "Commercial and Institutional Banking",
        "NatWest Markets", "Treasury", "RBSI", "BAS (Business Automation Services)",
        "Architecture & Engineering", "Economic Crime & Fraud",
        "Infrastructure & Security", "FRAL",
    ]
    return f"The main domains and service areas shown in the app are: {', '.join(domains)}."


def _answer_retail_banking(question: str) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"retail banking", q) or not re.search(r"accenture|helps in|help.*retail|support.*retail", q):
        return None
    return (
        "In Retail Banking, Accenture helps the bank provide a range of banking products and related "
        "financial services, including CASA, mortgages, and unsecured lending through credit cards and loans."
    )


def _answer_capability(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"(capability|franchise|team).*(under|belong|contain|associated)|what.*(capability|franchises)", q):
        return None
    caps = [d for d in docs if d["tab"] == "Capabilities"]
    cap = next((c for c in caps if _norm(c["raw"].get("name", "")) in q), None)
    if not cap:
        return None
    franchises = [d for d in docs if d["tab"] == "Franchises" and d["raw"].get("capabilityId") == cap["raw"].get("id")]
    if franchises:
        names = ", ".join(d["raw"].get("name", "") for d in franchises)
        return f"{cap['raw'].get('name')} contains {len(franchises)} franchises: {names}."
    return f"{cap['raw'].get('name')} has no franchises recorded."


def _answer_programs_by_franchise(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"program|programs", q) or not re.search(r"belong|under|in|for|associated", q):
        return None
    prog_docs = [d for d in docs if d["tab"] == "Programs" and d["raw"].get("franchiseId")]
    franchises = sorted({_norm(d["raw"]["franchiseId"]) for d in prog_docs}, key=len, reverse=True)
    franchise = next((f for f in franchises if f in q), None)
    if not franchise:
        return None
    matches = [d for d in prog_docs if _norm(d["raw"]["franchiseId"]) == franchise]
    names = ", ".join(d["raw"].get("name", "") for d in matches)
    return (f"{len(matches)} programs belong to {franchise}: {names}." if matches
            else f"No programs belong to {franchise}.")


def _answer_ai_deliverables(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"deliverable|deliverables", q):
        return None
    if not re.search(r"ai based|using ai|artificial intelligence", q):
        return None
    matches = [d for d in docs if d["tab"] == "Deliverables" and d["raw"].get("aiBased") is True]
    return (f"{len(matches)} AI-based deliverables: {', '.join(d['raw'].get('deliveryTitle') or d['raw'].get('projectName', '') for d in matches)}."
            if matches else "No AI-based deliverables were found.")


def _answer_next_event(question: str, docs: List[dict]) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"(next|upcoming|future).*(event|townhall)|event.*(next|upcoming|future)", q):
        return None
    from datetime import date
    today = date.today().isoformat()
    events = sorted(
        [d for d in docs if d["tab"] == "Events" and d["raw"].get("date") and
         (d["raw"].get("status") == "Upcoming" or str(d["raw"]["date"]) >= today)],
        key=lambda d: str(d["raw"]["date"]),
    )
    if not events:
        return "No upcoming events were found."
    e = events[0]["raw"]
    loc = f" in {e['location']}" if e.get("location") else ""
    return f"{e.get('eventName')} is scheduled for {e.get('date')}{loc}."


def _answer_pricing_metric(question: str) -> Optional[str]:
    q = _norm(question)
    if not re.search(r"pricing|expiry|attrition|roll off|extension|future ending|planned release|fg available|fg not available", q):
        return None
    pricing = read_json(DATA_DIR / "pricing.json")
    if not isinstance(pricing, dict):
        return None
    for table, rows in pricing.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            cat = _norm(row.get("category", ""))
            if cat not in q and not (cat == "d a" and re.search(r"d a|data and analytics", q)):
                continue
            field = next(
                (k for k in row if k not in ("id", "category") and _norm(_humanize(k)) in q),
                None,
            )
            if not field:
                continue
            return f"{row.get('category')} {_humanize(field)} is {row[field]} in the {table} table."
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
        t = sum(v for k, v in (row or {}).items() if k not in ("id", "category") and isinstance(v, (int, float)))
        totals[table] = t
        grand += t
    return f"The grand total for D&A+ across all pricing tables is {grand}."


# ---------------------------------------------------------------------------
# Named entity lookup
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
    q_tokens = [t for t in _norm(name_query).split() if len(t) > 1]
    if len(q_tokens) < 2:
        return None
    best = None
    best_score = 0.0
    second = 0.0
    for doc in docs:
        raw = doc.get("raw") or {}
        candidate = _norm(f"{raw.get('name', '')} {raw.get('enterpriseId', '')}")
        c_tokens = [t for t in candidate.split() if len(t) > 1]
        if not c_tokens:
            continue
        score = sum(max(_token_sim(qt, ct) for ct in c_tokens) for qt in q_tokens) / len(q_tokens)
        if score > best_score:
            second = best_score
            best_score = score
            best = doc
        elif score > second:
            second = score
    if best and best_score >= 0.78 and (best_score - second) >= 0.08:
        return best
    return None


def _answer_named(question: str, docs: List[dict]) -> Optional[str]:
    m = re.search(r"(?:who is|what is|tell me about|show me|details of)\s+([a-z0-9 .'\-]+)", _norm(question))
    if not m:
        return None
    name = m.group(1).strip()
    q_norm = _norm(name)
    match = next(
        (d for d in docs if q_norm in _norm(d["raw"].get("name", "")) or q_norm in _norm(d["raw"].get("enterpriseId", ""))),
        None,
    ) or _find_best_name(name, docs)
    if not match:
        return None
    raw = match["raw"]
    display = raw.get("name") or raw.get("eventName") or raw.get("projectName") or match["title"]
    parts = []
    for field in ("role", "designation", "location", "projectName", "description"):
        if raw.get(field):
            parts.append(f"{field}: {raw[field]}")
    summary = "; ".join(parts) or "This record exists in the application data."
    return f"{display} appears in the {match['tab']} data. {summary}."


def _answer_entity_field(question: str, docs: List[dict]) -> Optional[str]:
    q_tokens = set(t for t in _norm(question).split() if len(t) > 2)
    for doc in docs:
        raw = doc.get("raw") or {}
        name = _norm(f"{raw.get('name', '')} {raw.get('enterpriseId', '')}")
        name_tokens = [t for t in name.split() if len(t) > 1]
        if not name_tokens or not all(t in _norm(question) for t in name_tokens[:2]):
            continue
        field = next(
            (k for k in sorted(raw.keys(), key=lambda k: len(_humanize(k)), reverse=True)
             if k.lower() not in _SENSITIVE and k != "id"
             and all(t in q_tokens for t in _humanize(k).split() if len(t) > 2)),
            None,
        )
        if not field:
            continue
        val = raw[field]
        display = raw.get("name") or raw.get("enterpriseId") or doc["title"]
        if val is None or val == "":
            return f"{display} has no {_humanize(field)} recorded."
        return f"{display}'s {_humanize(field)} is {_flat(val)}."
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def answer_structured_question(question: str, knowledge: Optional[List[dict]] = None) -> Optional[str]:
    q = question.strip()
    if not q:
        return "Please ask a question about the data visible in the dashboard."
    if re.match(r"^(hi|hello|hey|good morning|good afternoon|good evening|greetings|yo)$", _norm(q)):
        return "Hi! Ask me about the people, teams, leadership, events, capabilities, deliverables, or program data shown in this app."

    docs = knowledge if knowledge is not None else build_knowledge_base()
    return (
        _answer_dashboard(q)
        or _answer_users_by_status(q, docs)
        or _answer_users_by_location(q, docs)
        or _answer_users_by_project(q, docs)
        or _answer_leadership(q, docs)
        or _answer_events_by_status(q, docs)
        or _answer_recognition(q, docs)
        or _answer_domain_list(q)
        or _answer_retail_banking(q)
        or _answer_capability(q, docs)
        or _answer_programs_by_franchise(q, docs)
        or _answer_ai_deliverables(q, docs)
        or _answer_next_event(q, docs)
        or _answer_pricing_metric(q)
        or _answer_pricing_grand_total(q)
        or _answer_entity_field(q, docs)
        or _answer_named(q, docs)
    )


def answer_question(question: str, knowledge: Optional[List[dict]] = None) -> str:
    docs = knowledge if knowledge is not None else build_knowledge_base()
    structured = answer_structured_question(question, docs)
    if structured:
        return structured
    scored = retrieve_documents(question, docs)
    if not scored:
        return "I could not find a direct match. Try asking about a person, team, event, deliverable, or capability."
    top = scored[0]["doc"]
    return f"I found related records in the {top['tab']} section, but could not determine a reliable direct answer. Please be more specific."
