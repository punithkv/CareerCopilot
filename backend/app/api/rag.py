from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag_service import answer_from_resume
router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"],
)
class RAGRequest(BaseModel):
    question: str
    top_k: int = 5
@router.post("/ask")
async def ask_resume(request: RAGRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )
    if request.top_k < 1 or request.top_k > 10:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 10.",
        )
    try:
        result = await answer_from_resume(
            question=request.question,
            top_k=request.top_k,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG error: {str(e)}",
        )