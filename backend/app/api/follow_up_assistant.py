
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.llm_service import generate_response

router = APIRouter(
    prefix="/api/follow-up",
    tags=["AI Follow-up Assistant"],
)


class FollowUpRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=150)
    role: str = Field(..., min_length=1, max_length=150)
    status: str = Field(..., min_length=1, max_length=50)
    application_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = Field(default="", max_length=3000)
    tone: str = Field(default="Professional", max_length=30)


@router.post("/generate")
async def generate_follow_up_email(request: FollowUpRequest):
    try:
        today = date.today().isoformat()

        prompt = f"""
You are a professional career communication assistant.

Write a concise follow-up email for a job applicant.

Application details:
Company: {request.company}
Job role: {request.role}
Current application status: {request.status}
Application date: {request.application_date or "Not provided"}
Follow-up date: {request.follow_up_date or "Not provided"}
Additional notes: {request.notes or "None"}
Today's date: {today}
Tone: {request.tone}

Requirements:
1. Include a suitable email subject.
2. Address the hiring team professionally.
3. Mention the job role and application.
4. Politely ask for an update on the application.
5. Express continued interest in the opportunity.
6. Do not invent recruiter names, interview dates, or promises.
7. Keep the email concise and natural.
8. End with "Best regards," and "[Your Name]".
9. Return only the email draft, with no explanation or markdown code fence.
"""

        email = await generate_response(prompt)

        if not email or not email.strip():
            raise ValueError("The AI returned an empty email.")

        return {
            "success": True,
            "email": email.strip(),
            "company": request.company,
            "role": request.role,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to generate follow-up email: {str(exc)}",
        )
