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

router = APIRouter()


class QuestionBody(BaseModel):
    question: Optional[str] = None
    message: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None


@router.post("/ask")
@router.post("/chat")
async def ask_question(body: QuestionBody):
    q_str = (body.question or body.message or "").strip()
    if not q_str:
        raise HTTPException(status_code=400, detail="Question is required.")

    knowledge = build_knowledge_base()

    # Resolve contextual follow-up / pronoun references using history
    resolved_q = resolve_contextual_query(q_str, body.history, knowledge)

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
                history=body.history,
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

