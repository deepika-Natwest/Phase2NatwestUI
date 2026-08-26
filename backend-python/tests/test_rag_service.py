"""
RAG service tests.

Tests are split into four tiers:
  A. Deterministic Fast-Path Tests  — greeting, dashboard KPIs, aggregations, grand totals
  B. Relational & Foreign-Key Tests — pre-joined entities, team member resolution
  C. Retrieval Quality Tests        — verify correct docs are retrieved for LLM
  D. Contextual Resolution Tests    — multi-turn pronoun & elliptical resolution

Run with:
    cd backend-python
    .\.venv\Scripts\pytest tests/test_rag_service.py -v
"""
import re
import pytest

from services.rag_service import (
    answer_question,
    answer_named_question,
    answer_structured_question,
    answer_entity_field_question,
    retrieve_documents,
    resolve_contextual_query,
    build_knowledge_base,
)


# ===========================================================================
# TIER A — Deterministic fast-path: exact match expected
# ===========================================================================

def test_greeting():
    answer = answer_question("Hi")
    assert re.search(r"hi|ask me about|people|teams|leadership|events", answer, re.IGNORECASE)


def test_da_grand_total():
    """Grand total is pure math — always exact."""
    answer = answer_question("what's the grand total for D&A?")
    assert re.search(r"grand total", answer, re.IGNORECASE)
    assert "47" in answer
    assert "expiry" in answer.lower()
    assert "attrition" in answer.lower()
    assert "extension" in answer.lower()


def test_headcount():
    answer = answer_question("what is the total headcount")
    assert "543" in answer


def test_utilisation_june():
    answer = answer_question("what is the utilization in June")
    assert "87" in answer
    assert "jun" in answer.lower()


def test_dashboard_headcount_by_capability():
    ans = answer_structured_question("headcount in D&A+")
    assert ans is not None
    assert "112" in ans

    ans_fral = answer_structured_question("headcount for FRAL")
    assert ans_fral is not None
    assert "100" in ans_fral


def test_dashboard_leakage_breakdown():
    ans = answer_structured_question("what is the leakage breakdown")
    assert ans is not None
    assert "Bench" in ans
    assert "268" in ans or "45" in ans


def test_dashboard_resources_by_location():
    ans = answer_structured_question("resources in Pune")
    assert ans is not None
    assert "30" in ans


# ===========================================================================
# TIER B — Relational & Pre-joined Foreign Keys
# ===========================================================================

def test_foreign_key_pre_resolution_deliverables():
    """Verify deliverables have resolved team member names, not raw UUIDs."""
    kb = build_knowledge_base(force_refresh=True)
    deliv_docs = [d for d in kb if d["tab"] == "Deliverables"]
    assert len(deliv_docs) > 0

    # Check that AWS COMET or Hubble deliverable has team members with human names
    has_resolved_members = False
    for d in deliv_docs:
        members = d["raw"].get("teamMembers")
        if members:
            assert all(not re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}", m) for m in members), \
                "Team members should be resolved to names, not raw UUIDs"
            has_resolved_members = True
    assert has_resolved_members, "Deliverables should have resolved team members"


def test_foreign_key_pre_resolution_programs():
    """Verify programs have capability and franchise names resolved."""
    kb = build_knowledge_base(force_refresh=True)
    prog_docs = [d for d in kb if d["tab"] == "Programs"]
    assert len(prog_docs) > 0

    cdd = next((d for d in prog_docs if "CDD Baseline" in d["title"]), None)
    assert cdd is not None
    assert cdd["raw"].get("capability") == "D&A+"
    assert cdd["raw"].get("franchise") == "D&A"


def test_name_normalization_dahiya_suman():
    """Verify names like 'Dahiya, Suman' are normalized to 'Suman Dahiya'."""
    kb = build_knowledge_base(force_refresh=True)
    user_docs = [d for d in kb if d["tab"] == "Users"]
    names = [d["raw"].get("name", "") for d in user_docs]
    assert "Suman Dahiya" in names
    assert "Dahiya, Suman" not in names


# ===========================================================================
# TIER C — Retrieval quality tests
# ===========================================================================

def test_retrieve_users_by_location_noida():
    docs = retrieve_documents("list all users in Noida")
    noida_docs = [d for d in docs if "noida" in (d["doc"]["raw"].get("location") or "").lower()]
    assert len(noida_docs) > 0, "Should retrieve users with location=Noida"


def test_retrieve_harshita_pandey_by_name():
    docs = retrieve_documents("what's the career level of harshita?")
    assert len(docs) > 0
    assert docs[0]["doc"]["raw"]["name"] == "Harshita Pandey"


def test_retrieve_leadership():
    docs = retrieve_documents("show me all leadership team members")
    leadership_docs = [d for d in docs if d["doc"]["tab"] == "Leadership"]
    assert len(leadership_docs) > 0, "Should retrieve Leadership records"


def test_retrieve_events():
    docs = retrieve_documents("which events are completed")
    event_docs = [d for d in docs if d["doc"]["tab"] == "Events"]
    assert len(event_docs) > 0, "Should retrieve Events records"


def test_retrieve_programs_for_da():
    docs = retrieve_documents("which programs belong to D&A")
    prog_docs = [d for d in docs if d["doc"]["tab"] == "Programs"]
    assert len(prog_docs) > 0, "Should retrieve Programs records"
    program_names = " ".join(d["doc"]["raw"].get("name", "") for d in prog_docs)
    assert "Single Pane of Glass" in program_names or "CDD" in program_names


def test_retrieve_suman_dahiya():
    docs = retrieve_documents("tell me about Suman Dahiya")
    names = [d["doc"]["raw"].get("name", "") for d in docs]
    assert any("Suman" in n and "Dahiya" in n for n in names), \
        "Suman Dahiya should appear in retrieved docs"


def test_retrieve_recognition_rajesh_jindal():
    docs = retrieve_documents("what is the recognition for Rajesh Jindal")
    recog_docs = [d for d in docs if d["doc"]["tab"] == "Recognitions"]
    assert len(recog_docs) > 0
    text = " ".join(d["doc"]["text"] for d in recog_docs)
    assert "Rajesh Jindal" in text or any("Rajesh" in d["doc"]["raw"].get("name", "") for d in recog_docs)


def test_retrieve_shubham_khanna_partial():
    answer = answer_named_question("tell me about shubham")
    assert answer is not None
    assert "Shubham Khanna" in answer


def test_entity_field_career_level():
    answer = answer_entity_field_question("what's the career level of harshita?")
    assert answer is not None
    assert re.search(r"Harshita Pandey.{0,40}career level.{0,10}9", answer, re.IGNORECASE)


def test_retrieve_franchise_under_da():
    docs = retrieve_documents("which franchises are under D&A")
    franchise_docs = [d for d in docs if d["doc"]["tab"] == "Franchises"]
    assert len(franchise_docs) > 0


def test_knowledge_base_coverage():
    """Verify all data domains are indexed in the knowledge base."""
    kb = build_knowledge_base()
    tabs = {d["tab"] for d in kb}
    for expected in ("Users", "Leadership", "Events", "Deliverables", "Recognitions", "Capabilities", "Franchises", "Programs", "Dashboard"):
        assert expected in tabs, f"'{expected}' tab missing from knowledge base"


def test_retrieve_deliverables_ai():
    docs = retrieve_documents("show me AI-based deliverables")
    deliv_docs = [d for d in docs if d["doc"]["tab"] == "Deliverables"]
    assert len(deliv_docs) > 0


def test_fuzzy_name_match():
    answer = answer_question("tell me about harshit apandey")
    assert "Harshita Pandey" in answer


# ===========================================================================
# TIER D — Multi-turn contextual resolution
# ===========================================================================

def test_contextual_pronoun_resolution():
    history = [
        {"role": "user", "text": "Who is Shubham Khanna?"},
        {"role": "assistant", "text": "Shubham Khanna appears in the Users data. role: Software Engineer; location: Gurgaon."},
    ]
    resolved = resolve_contextual_query("what is his career level?", history)
    assert "Shubham Khanna" in resolved
    answer = answer_question(resolved)
    assert "Shubham Khanna" in answer
    assert "career level" in answer.lower()


def test_contextual_elliptical_followup():
    history = [
        {"role": "user", "text": "Tell me about Harshita Pandey"},
        {"role": "assistant", "text": "Harshita Pandey appears in the Users data. role: Software Engineer; location: Mumbai."},
    ]
    resolved = resolve_contextual_query("location?", history)
    assert "Harshita Pandey" in resolved
    answer = answer_question(resolved)
    assert "Harshita Pandey" in answer
    assert "mumbai" in answer.lower()


def test_tell_more_about_typo_and_leadership():
    history = [
        {"role": "user", "text": "Show me all leadership team members"},
        {
            "role": "assistant",
            "text": "13 leadership members: Ujjwal Jyoti, Kedharnath Sivajirao, Shilpi Jain, Suman Dahiya, Sukhwant Singh, Teena Kashyap, Aayush Sharma, Priya Vivek, Krishan Soni, Vinay Bagul, Gunjan Tanwar, Sharon Lewis, Amita Sharma.",
        },
    ]
    resolved = resolve_contextual_query("tell more about Suman Dhaiya", history)
    answer = answer_question(resolved)
    assert re.search(r"Suman Dahiya", answer, re.IGNORECASE)
