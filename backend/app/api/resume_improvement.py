
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_service import get_all_resume_documents
from app.services.llm_service import generate_response


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume Improvement"],
)


class ResumeImprovementRequest(BaseModel):
    task: str = Field(..., min_length=1)
    target_job_role: str = ""
    job_description: str = ""
    experience_text: str = ""


def get_resume_text():
    documents = get_all_resume_documents()

    if not documents:
        raise HTTPException(
            status_code=404,
            detail="Please upload your PDF resume first."
        )

    # Combine and remove duplicate chunks.
    unique_chunks = []
    seen = set()

    for document in documents:
        content = document.get("page_content", "").strip()

        if content and content not in seen:
            seen.add(content)
            unique_chunks.append(content)

    resume_text = "\n\n".join(unique_chunks)

    if not resume_text:
        raise HTTPException(
            status_code=404,
            detail="No readable resume text was found."
        )

    return resume_text


@router.post("/improvement")
async def improve_resume(request: ResumeImprovementRequest):
    task = request.task.strip().lower()

    allowed_tasks = {
        "quality",
        "summary",
        "experience",
        "ats",
    }

    if task not in allowed_tasks:
        raise HTTPException(
            status_code=400,
            detail="Invalid task. Choose quality, summary, experience or ats."
        )

    try:
        resume_text = get_resume_text()

        role = request.target_job_role.strip() or "General professional role"

        if task == "quality":
            task_instruction = """
            Review the candidate's resume carefully.

            Provide these sections:
            1. Overall resume quality rating out of 10.
            2. Strong points in the resume.
            3. Weak or unclear sections.
            4. Important missing information.
            5. Formatting and ATS readability suggestions.
            6. Five specific improvements the candidate should make.

            Be honest. Do not invent qualifications or experience.
            """

        elif task == "summary":
            task_instruction = f"""
            Write a professional resume summary for the target role:
            {role}

            Requirements:
            - Write 3 to 5 concise sentences.
            - Use only skills, education and experience supported by the resume.
            - Highlight relevant technical skills and projects.
            - Use professional language.
            - Do not invent years of experience, certifications or achievements.
            - Also provide one shorter alternative summary.
            """

        elif task == "experience":
            experience = request.experience_text.strip()

            if not experience:
                raise HTTPException(
                    status_code=400,
                    detail="Enter a project or experience description."
                )

            task_instruction = f"""
            Improve the following project or experience description.

            ORIGINAL DESCRIPTION:
            {experience}

            Candidate resume:
            {resume_text}

            Target role:
            {role}

            Provide:
            1. Improved professional project/experience title.
            2. Four concise resume bullet points.
            3. Relevant technical skills demonstrated.
            4. A short explanation of what was improved.

            Use action verbs and clear technical language.
            Do not invent metrics, tools, responsibilities or results.
            If a metric is not provided, do not make one up.
            """

        else:
            job_description = request.job_description.strip()

            if not job_description:
                raise HTTPException(
                    status_code=400,
                    detail="Enter a job description for ATS optimization."
                )

            task_instruction = f"""
            Compare the candidate's resume with this job description.

            JOB DESCRIPTION:
            {job_description}

            Provide:
            1. Relevant keywords already present in the resume.
            2. Important job-description keywords missing from the resume.
            3. Skills that are mentioned indirectly or need clearer wording.
            4. Suggestions for improving relevant project descriptions.
            5. ATS optimization recommendations.
            6. A prioritized list of the next five actions.

            Clearly distinguish skills the candidate has from skills they
            should learn. Never suggest falsely adding a skill or experience.
            """

        prompt = f"""
        You are CareerCopilot, a careful and practical professional resume
        coach.

        IMPORTANT RULES:
        - Use the resume as the source of truth.
        - Never invent degrees, companies, certifications, skills,
          employment history, dates, achievements or numerical metrics.
        - If information is unavailable, say so.
        - Give clear, actionable advice suitable for an early-career
          engineering candidate.
        - Use readable headings and bullet points.

        CANDIDATE RESUME:
        {resume_text[:18000]}

        TARGET ROLE:
        {role}

        TASK:
        {task_instruction}

        Return the result in clear Markdown-style text.
        """

        result = await generate_response(prompt)

        if not result or not result.strip():
            raise HTTPException(
                status_code=502,
                detail="The local AI model returned an empty response."
            )

        return {
            "task": task,
            "target_job_role": role,
            "result": result.strip(),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume improvement failed: {str(error)}"
        )
