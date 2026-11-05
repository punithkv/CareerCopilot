
import json
import sqlite3
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.embedding.vector_store import get_all_resume_documents
from app.services.interview_session import get_all_sessions
from app.services.llm_service import generate_response

router = APIRouter(
    prefix="/api/career",
    tags=["Career Recommendations"],
)

APPLICATION_DB = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "applications.db"
)


class RecommendationRequest(BaseModel):
    target_role: str = ""
    interests: str = ""


def load_application_history():
    if not APPLICATION_DB.exists():
        return []

    try:
        connection = sqlite3.connect(str(APPLICATION_DB))
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT company, role, status, application_date
            FROM applications
            ORDER BY created_at DESC
            LIMIT 30
            """
        ).fetchall()
        connection.close()
        return [dict(row) for row in rows]
    except sqlite3.Error:
        return []


def extract_resume_text():
    documents = get_all_resume_documents()
    parts = []

    for document in documents:
        content = document.get("page_content", "")
        if content and content not in parts:
            parts.append(content)

    return "\n\n".join(parts)


def extract_interview_summary():
    sessions = get_all_sessions()
    completed = [
        session for session in sessions
        if session.get("status") == "completed"
        or session.get("completed") is True
    ]

    summaries = []
    for session in completed[-10:]:
        report = session.get("final_report") or session.get("report") or {}
        summaries.append({
            "target_role": (
                session.get("target_job_role")
                or session.get("job_role")
                or ""
            ),
            "overall_score": (
                report.get("overall_score")
                or session.get("overall_score")
                or 0
            ),
            "category_scores": (
                report.get("category_scores")
                or report.get("scores")
                or {}
            ),
        })

    return summaries


def parse_json_response(response: str):
    cleaned = response.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "", 1)
        cleaned = cleaned.replace("```", "").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("The AI response did not contain valid JSON.")

    return json.loads(cleaned[start:end + 1])


@router.post("/recommendations")
async def get_career_recommendations(
    request: RecommendationRequest,
):
    resume_text = extract_resume_text()

    if not resume_text.strip():
        raise HTTPException(
            status_code=404,
            detail="Upload and index your resume before generating recommendations.",
        )

    interview_history = extract_interview_summary()
    application_history = load_application_history()

    prompt = f"""
You are CareerCopilot, a careful career guidance assistant.

Analyze the candidate using the supplied evidence only.
Do not claim the candidate has a skill, qualification, project,
certification or experience unless it appears in the resume.
Interview scores and application statuses must not be invented.

RESUME:
{resume_text[:14000]}

INTERVIEW PERFORMANCE:
{json.dumps(interview_history, ensure_ascii=False)}

JOB APPLICATION HISTORY:
{json.dumps(application_history, ensure_ascii=False)}

CANDIDATE TARGET ROLE:
{request.target_role or "Not specified"}

CANDIDATE INTERESTS:
{request.interests or "Not specified"}

Return ONLY valid JSON with this exact structure:
{{
  "career_summary": "A concise evidence-based summary",
  "recommended_roles": [
    {{
      "role": "Job title",
      "fit_score": 0,
      "reason": "Why this role fits the evidence",
      "existing_skills": ["skill"],
      "skills_to_develop": ["skill"],
      "first_action": "One practical next action"
    }}
  ],
  "strengths": ["evidence-based strength"],
  "priority_skills": [
    {{
      "skill": "Skill name",
      "priority": "High",
      "reason": "Why it matters",
      "learning_action": "Specific practice task"
    }}
  ],
  "30_day_plan": [
    {{
      "week": "Week 1",
      "goal": "Goal",
      "tasks": ["task 1", "task 2"]
    }}
  ],
  "application_insights": [
    "Insight based only on supplied application history"
  ],
  "cautions": [
    "Important evidence gaps or limitations"
  ]
}}

Rules:
- Give 3 to 5 realistic role recommendations.
- fit_score must be an integer from 0 to 100 and is an estimate, not a hiring probability.
- Give 3 to 6 priority skills.
- Give exactly four weekly plan entries.
- Do not guarantee employment or selection.
- If interview or application history is empty, state that limitation.
- Keep recommendations realistic for an early-career candidate.
"""

    try:
        raw_response = await generate_response(prompt)
        result = parse_json_response(raw_response)

        return {
            "success": True,
            "model": "qwen2.5:3b",
            "data": result,
            "data_sources": {
                "resume_available": True,
                "completed_interviews": len(interview_history),
                "job_applications": len(application_history),
            },
        }

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="The local AI returned an invalid response. Please try again.",
        )
    except Exception as error:
        import logging
        import traceback

        logging.exception(
            "Career recommendation generation failed"
        )

        print("ERROR TYPE:", type(error).__name__)
        print("ERROR DETAILS:", repr(error))
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Career recommendation failed: "
                f"{type(error).__name__}: {repr(error)}"
            ),
        )
