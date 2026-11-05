import json
from app.services.llm_service import generate_response
async def generate_interview_questions(
    resume_text: str,
    job_description: str,
    difficulty: str = "mixed",
    count: int = 10,
) -> list:
    prompt = f"""
You are an expert technical interviewer and career coach.
Generate interview questions specifically for this candidate
and this job description.
RESUME:
{resume_text}
JOB DESCRIPTION:
{job_description}
DIFFICULTY:
{difficulty}
NUMBER OF QUESTIONS:
{count}
IMPORTANT RULES:
1. Questions must be relevant to the job description.
2. Questions must be based on technologies, projects,
   skills, or experience actually present in the resume.
3. Do not invent projects or skills.
4. Include questions about the candidate's projects.
5. Include technical questions.
6. Include practical/problem-solving questions.
7. Include a small number of behavioral questions.
8. Avoid duplicate questions.
9. Questions should gradually increase in difficulty.
10. Return ONLY valid JSON.
11. Do not use markdown code fences.
Return exactly this JSON structure:
[
    {{
        "question": "Question text",
        "category": "Technical",
        "difficulty": "Easy",
        "reason": "Why this question is relevant"
    }}
]
Allowed categories:
- Technical
- Project
- Problem Solving
- Behavioral
Allowed difficulty:
- Easy
- Medium
- Hard
"""
    response = await generate_response(prompt)
    response = response.strip()
    if response.startswith("```"):
        response = response.replace("```json", "")
        response = response.replace("```", "")
        response = response.strip()
    try:
        questions = json.loads(response)
    except json.JSONDecodeError:
        raise ValueError(
            "The local LLM returned invalid JSON."
        )
    if not isinstance(questions, list):
        raise ValueError(
            "The LLM response is not a list."
        )
    return questions