import json
import logging
import re
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_service import get_all_resume_documents


router = APIRouter(
    prefix="/api/application-assistant",
    tags=["AI Job Application Assistant"],
)

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"


class JobApplicationRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=150)
    role: str = Field(..., min_length=1, max_length=150)
    job_description: str = Field(..., min_length=50, max_length=12000)


def get_resume_text() -> str:
    """Collect resume content stored in the RAG database."""

    documents = get_all_resume_documents()

    if not documents:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Upload your resume before analyzing a job.",
        )

    pages = []
    seen = set()

    for document in documents:
        if isinstance(document, dict):
            content = document.get("page_content", "")
        else:
            content = getattr(document, "page_content", "")

        content = str(content).strip()

        if content and content not in seen:
            pages.append(content)
            seen.add(content)

    resume_text = "\n\n".join(pages)

    if not resume_text.strip():
        raise HTTPException(
            status_code=404,
            detail="Resume content is empty. Please upload your resume again.",
        )

    return resume_text[:7000]


def extract_json(response_text: str) -> dict:
    """Extract a JSON object from the model response."""

    if not response_text or not response_text.strip():
        raise ValueError("The local AI returned an empty response.")

    cleaned = response_text.strip()

    # Remove Markdown code fences if the model includes them.
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        result = json.loads(cleaned)

        if isinstance(result, dict):
            return result

    except json.JSONDecodeError:
        pass

    # Fallback: locate the first JSON object in the response.
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("The local AI did not return a JSON object.")

    json_text = cleaned[start:end + 1]

    try:
        result = json.loads(json_text)
    except json.JSONDecodeError as error:
        logger.error("Invalid JSON from Ollama: %s", error)
        logger.error("Model response preview: %s", cleaned[:1500])
        raise ValueError("The local AI returned malformed JSON.") from error

    if not isinstance(result, dict):
        raise ValueError("The local AI response must be a JSON object.")

    return result


async def generate_json_response(prompt: str) -> dict:
    """Ask Ollama to generate a JSON response using JSON mode."""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": "10m",
        "options": {
            "temperature": 0.1,
            "num_predict": 1800,
        },
    }

    timeout = httpx.Timeout(
        connect=15.0,
        read=600.0,
        write=60.0,
        pool=15.0,
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OLLAMA_URL,
                json=payload,
            )

            response.raise_for_status()
            data = response.json()

        model_text = data.get("response", "")

        return extract_json(model_text)

    except httpx.ConnectError as error:
        logger.exception("Could not connect to Ollama.")
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure Ollama is running.",
        ) from error

    except httpx.TimeoutException as error:
        logger.exception("Ollama request timed out.")
        raise HTTPException(
            status_code=504,
            detail="The local AI took too long to respond. Please try again.",
        ) from error

    except httpx.HTTPStatusError as error:
        logger.exception("Ollama returned an HTTP error.")
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned HTTP {error.response.status_code}.",
        ) from error


def normalize_result(result: dict) -> dict:
    """Ensure the response contains the fields expected by the frontend."""

    result.setdefault("fit_score", 0)
    result.setdefault("fit_category", "Needs Improvement")
    result.setdefault("match_summary", "")
    result.setdefault("matching_skills", [])
    result.setdefault("missing_skills", [])
    result.setdefault("relevant_experience", [])
    result.setdefault("improvement_suggestions", [])
    result.setdefault("application_decision", "")
    result.setdefault("cover_letter", "")
    result.setdefault(
        "application_email",
        {
            "subject": "",
            "body": "",
        },
    )
    result.setdefault("interview_preparation", [])

    try:
        result["fit_score"] = max(
            0,
            min(100, int(float(result["fit_score"]))),
        )
    except (TypeError, ValueError):
        result["fit_score"] = 0

    list_fields = [
        "matching_skills",
        "missing_skills",
        "relevant_experience",
        "improvement_suggestions",
        "interview_preparation",
    ]

    for field in list_fields:
        if not isinstance(result.get(field), list):
            result[field] = []

    if not isinstance(result.get("application_email"), dict):
        result["application_email"] = {
            "subject": "",
            "body": "",
        }

    result["application_email"].setdefault("subject", "")
    result["application_email"].setdefault("body", "")

    return result


@router.post("/analyze")
async def analyze_job_application(request: JobApplicationRequest):

    try:
        resume_text = get_resume_text()

        prompt = f"""
You are an expert AI career advisor and recruitment analyst.

Analyze the candidate's resume against the job description.

IMPORTANT RULES:
1. Use only information supported by the resume and job description.
2. Do not invent qualifications, skills, companies, or experience.
3. Return ONLY one valid JSON object.
4. Do not include Markdown, code fences, explanations, or text outside JSON.
5. Use double quotes for all JSON keys and string values.
6. Use arrays for list fields.
7. fit_score must be an integer between 0 and 100.
8. Keep the cover letter professional and truthful.
9. If information is unavailable, use an empty string or empty array.

COMPANY:
{request.company}

JOB ROLE:
{request.role}

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{request.job_description}

Return JSON in exactly this structure:

{{
  "fit_score": 75,
  "fit_category": "Good Match",
  "match_summary": "A short explanation of the candidate's suitability.",
  "matching_skills": [
    "Python",
    "SQL"
  ],
  "missing_skills": [
    "AWS"
  ],
  "relevant_experience": [
    "Relevant project or experience supported by the resume."
  ],
  "improvement_suggestions": [
    "Specific improvement suggestion."
  ],
  "application_decision": "Apply",
  "cover_letter": "A complete professional cover letter.",
  "application_email": {{
    "subject": "Application for the job role",
    "body": "A professional email applying for this position."
  }},
  "interview_preparation": [
    "Prepare Python fundamentals.",
    "Revise SQL queries."
  ]
}}

For application_decision, choose one:
- Apply
- Apply with Preparation
- Not Recommended

For fit_category, choose one:
- Excellent Match
- Good Match
- Moderate Match
- Low Match

Return only valid JSON.
"""

        result = await generate_json_response(prompt)

        result = normalize_result(result)

        return {
            "success": True,
            "company": request.company,
            "role": request.role,
            "analysis": result,
        }

    except HTTPException:
        raise

    except ValueError as error:
        logger.exception("Could not parse the AI response.")
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Job application analysis failed.")
        raise HTTPException(
            status_code=500,
            detail=f"Job application analysis failed: {str(error)}",
        ) from error