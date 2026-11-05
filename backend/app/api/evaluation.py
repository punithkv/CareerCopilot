from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.interview_evaluator import (
    evaluate_interview_answer,
)
router = APIRouter(
    prefix="/api/evaluation",
    tags=["Interview Evaluation"],
)
class EvaluationRequest(BaseModel):
    question: str
    answer: str
    job_description: str = ""
@router.post("/answer")
async def evaluate_answer(
    request: EvaluationRequest,
):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )
    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty.",
        )
    try:
        evaluation = await evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            job_description=request.job_description,
        )
        return evaluation
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}",
        )