from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.embedding.vector_store import (
    get_all_resume_documents,
)
from app.services.interview_generator import (
    generate_interview_questions,
)
router = APIRouter(
    prefix="/api/interview",
    tags=["Interview"],
)
class InterviewRequest(BaseModel):
    job_description: str
    difficulty: str = Field(
        default="mixed"
    )
    count: int = Field(
        default=10,
        ge=1,
        le=20,
    )
@router.post("/questions")
async def generate_questions(
    request: InterviewRequest,
):
    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )
    if request.difficulty not in [
        "easy",
        "medium",
        "hard",
        "mixed",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "difficulty must be "
                "easy, medium, hard, or mixed."
            ),
        )
    resume_documents = get_all_resume_documents()
    if not resume_documents:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume found. "
                "Please upload a resume first."
            ),
        )
    resume_text = "\n".join(
        resume_documents
    )
    try:
        questions = await generate_interview_questions(
            resume_text=resume_text,
            job_description=request.job_description,
            difficulty=request.difficulty,
            count=request.count,
        )
        return {
            "count": len(questions),
            "questions": questions,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Interview generation failed: {str(e)}",
        )
@router.post("/resume")
async def generate_resume_questions(
    difficulty: str = "mixed",
    count: int = 10,
):
    resume_documents = get_all_resume_documents()
    if not resume_documents:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume found. "
                "Please upload a resume first."
            ),
        )
    resume_text = "\n".join(
        resume_documents
    )
    try:
        questions = await generate_interview_questions(
            resume_text=resume_text,
            job_description=(
                "Generate interview questions "
                "based on the candidate's resume."
            ),
            difficulty=difficulty,
            count=count,
        )
        return {
            "count": len(questions),
            "questions": questions,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Interview generation failed: {str(e)}",
        )