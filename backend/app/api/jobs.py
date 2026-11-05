from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.job_matcher import ( 
    extract_skills,
    analyze_job_match,
    )
from app.services.embedding.vector_store import(
    get_all_resume_documents,
)
from app.services.job_analysis import (
    generate_job_analysis,
)
router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)
class JobDescriptionRequest(BaseModel):
    job_description: str
@router.post("/analyze")
async def analyze_job(
    request: JobDescriptionRequest,
):
    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )
    job_skills = extract_skills(
        request.job_description
    )
    return {
        "message": "Job description analyzed successfully.",
        "characters": len(
            request.job_description
        ),
        "detected_skills": job_skills,
    }
@router.post("/match")
async def match_job(
    request: JobDescriptionRequest,
):
    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )
    resume_documents = get_all_resume_documents()
    if not resume_documents:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first.",
        )
    resume_text = "\n".join(
        resume_documents
    )
    result = analyze_job_match(
        resume_text=resume_text,
        job_description=request.job_description,
    )
    return result
@router.post("/analysis")
async def analyze_job_with_ai(
    request: JobDescriptionRequest,
):
    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )
    resume_documents = get_all_resume_documents()
    if not resume_documents:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first.",
        )
    resume_text = "\n".join(
        document["page_content"]
        for document in resume_documents
        )
    match_result = analyze_job_match(
        resume_text=resume_text,
        job_description=request.job_description,
    )
    ai_analysis = await generate_job_analysis(
        job_description=request.job_description,
        match_result=match_result,
    )
    return {
        "match": match_result,
        "ai_analysis": ai_analysis,
    }