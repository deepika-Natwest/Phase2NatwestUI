from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag_service import build_knowledge_base, answer_structured_question, retrieve_documents_hybrid, answer_question
from services.llm_service import answer_with_llm, get_provider

router = APIRouter()


class QuestionBody(BaseModel):
    question: str


@router.post("/ask")
async def ask_question(body: QuestionBody):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    knowledge = build_knowledge_base()

    structured = answer_structured_question(question, knowledge)
    if structured:
        return {"answer": structured, "provider": "local-retrieval"}

    documents = await retrieve_documents_hybrid(question, knowledge)

    if get_provider() and documents:
        try:
            answer = await answer_with_llm(question, [d["doc"] for d in documents])
            if answer:
                return {"answer": answer, "provider": get_provider()}
        except Exception as exc:
            print(f"LLM request failed, using local fallback: {exc}")

    return {"answer": answer_question(question, knowledge), "provider": "local-retrieval"}
