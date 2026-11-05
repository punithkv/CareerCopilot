import json
from app.services.llm_service import generate_response
async def evaluate_interview_answer(
    question: str,
    answer: str,
    job_description: str = "",
) -> dict:
    prompt = f"""
You are an expert technical interviewer and career coach.
Evaluate the candidate's answer to the interview question.
QUESTION:
{question}
CANDIDATE ANSWER:
{answer}
JOB DESCRIPTION:
{job_description if job_description.strip() else "Not provided"}
Evaluate the answer objectively.
IMPORTANT RULES:
1. Evaluate only the answer provided.
2. Do not invent information about the candidate.
3. Do not give credit for information that was not stated.
4. Do not penalize the candidate for using different wording
   from an ideal answer.
5. Focus on technical correctness, relevance, clarity,
   completeness, and depth.
6. Give constructive feedback.
7. If the answer is technically incorrect, clearly explain why.
8. The ideal answer should be concise but technically accurate.
9. Return ONLY valid JSON.
10. Do not use markdown code fences.
Score each category from 0 to 10.
Return exactly this JSON structure:
{{
    "overall_score": 0,
    "correctness": 0,
    "technical_depth": 0,
    "clarity": 0,
    "relevance": 0,
    "completeness": 0,
    "strengths": [
        "strength 1",
        "strength 2"
    ],
    "improvements": [
        "improvement 1",
        "improvement 2"
    ],
    "missing_points": [
        "important point missing"
    ],
    "ideal_answer": "A concise technically accurate answer.",
    "feedback": "Overall constructive feedback."
}}
ANSWER:
"""
    response = await generate_response(prompt)
    response = response.strip()
    if response.startswith("```"):
        response = response.replace("```json", "")
        response = response.replace("```", "")
        response = response.strip()
    try:
        evaluation = json.loads(response)
    except json.JSONDecodeError:
        raise ValueError(
            "The local LLM returned invalid JSON."
        )
    if not isinstance(evaluation, dict):
        raise ValueError(
            "The LLM response is not a JSON object."
        )
    return evaluation