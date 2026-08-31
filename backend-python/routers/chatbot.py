from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag_service import (
    build_knowledge_base,
    answer_structured_question,
    retrieve_documents_hybrid,
    answer_question,
    resolve_contextual_query,
)
from services.llm_service import answer_with_llm, get_provider

HISTORY_LIMIT = 10  # last 5 exchanges (user + assistant) = 10 messages

# Maps frontend category IDs → knowledge-base tab names to search within
CATEGORY_TAB_MAP: dict[str, list[str]] = {
    "people":       ["Users", "Franchises", "Capabilities"],
    "deliverables": ["Deliverables"],
    "utilization":  ["Dashboard"],
    "programs":     ["Programs", "Franchises", "Capabilities"],
    "recognitions": ["Recognitions"],
    "events":       ["Events"],
    "sow":          ["Users"],
    "org":          ["Capabilities", "Franchises", "Users"],
    # "others" is intentionally absent → no filtering (full knowledge base)
}

router = APIRouter()


class QuestionBody(BaseModel):
    question: Optional[str] = None
    message: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    categoryScope: Optional[str] = None


@router.post("/ask")
@router.post("/chat")
async def ask_question(body: QuestionBody):
    q_str = (body.question or body.message or "").strip()
    if not q_str:
        raise HTTPException(status_code=400, detail="Question is required.")

    full_knowledge = build_knowledge_base()

    # Scope the knowledge base to only relevant tabs when a specific category is selected
    scope = (body.categoryScope or "").strip().lower()
    if scope and scope in CATEGORY_TAB_MAP:
        allowed_tabs = set(CATEGORY_TAB_MAP[scope])
        knowledge = [doc for doc in full_knowledge if doc.get("tab") in allowed_tabs]
    else:
        knowledge = full_knowledge

    # Cap history to the last 5 exchanges before any downstream use
    history = (body.history or [])[-HISTORY_LIMIT:]

    # Resolve contextual follow-up / pronoun references using history
    resolved_q = resolve_contextual_query(q_str, history, knowledge)

    # 1. Deterministic / Structured Fast Path
    structured = answer_structured_question(resolved_q, knowledge)
    if structured:
        return {
            "answer": structured,
            "provider": "local-retrieval",
            "resolvedQuestion": resolved_q,
        }

    # 2. Hybrid Dense + Lexical Retrieval
    documents = await retrieve_documents_hybrid(resolved_q, knowledge)

    # 3. LLM Generation
    if get_provider() and documents:
        try:
            answer = await answer_with_llm(
                resolved_q,
                [d["doc"] for d in documents],
                history=history,
            )
            if answer:
                return {
                    "answer": answer,
                    "provider": get_provider(),
                    "resolvedQuestion": resolved_q,
                }
        except Exception as exc:
            print(f"LLM request failed, using local fallback: {exc}")

    # 4. Local fallback
    return {
        "answer": answer_question(resolved_q, knowledge),
        "provider": "local-retrieval",
        "resolvedQuestion": resolved_q,
    }

