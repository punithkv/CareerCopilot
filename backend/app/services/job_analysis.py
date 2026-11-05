import re

COMMON_SKILLS = [
    "Python", "Java", "JavaScript", "C++", "C",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite",
    "HTML", "CSS", "React", "React.js", "Node.js",
    "Django", "Flask", "FastAPI", "REST API",
    "Machine Learning", "Deep Learning",
    "Artificial Intelligence", "NLP",
    "Natural Language Processing",
    "TensorFlow", "PyTorch", "Keras",
    "Scikit-learn", "Pandas", "NumPy",
    "OpenCV", "Computer Vision",
    "Data Science", "Data Analytics",
    "Power BI", "Tableau", "Excel",
    "Git", "GitHub", "Docker",
    "AWS", "Azure", "Google Cloud",
    "LangChain", "RAG", "ChromaDB",
    "Generative AI", "LLM",
    "OOP", "Data Structures", "Algorithms",
    "Linux", "Streamlit", "Redis"
]


def extract_skills(text: str) -> list:
    """
    Extract known technical skills from text.
    Matching is case-insensitive.
    """
    if not text:
        return []

    found_skills = []

    for skill in COMMON_SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)

    return sorted(set(found_skills))
from app.services.llm_service import generate_response
async def generate_job_analysis(
    job_description: str,
    match_result: dict,
) -> str:
    matched_skills = match_result.get(
        "matched_skills",
        [],
    )
    missing_skills = match_result.get(
        "missing_skills",
        [],
    )
    overall_score = match_result.get(
        "overall_match_score",
        0,
    )
    semantic_score = match_result.get(
        "semantic_score",
        0,
    )
    skill_match_score = match_result.get(
        "skill_match_score",
        0,
    )
    prompt = f"""
You are CareerCopilot, an AI career advisor.
Analyze the candidate's match against the job description.
IMPORTANT RULES:
1. Use ONLY the information provided below.
2. Do not invent candidate experience.
3. Do not claim the candidate has a skill unless it appears
   in the matched skills or resume information.
4. Do not invent company information.
5. Do not invent years of experience.
6. Be honest about skill gaps.
7. Give practical recommendations.
8. Keep the response professional and concise.
JOB DESCRIPTION:
{job_description}
MATCH SCORE:
Overall Match: {overall_score}%
Semantic Score: {semantic_score}%
Skill Match Score: {skill_match_score}%
MATCHED SKILLS:
{", ".join(matched_skills) if matched_skills else "None"}
MISSING SKILLS:
{", ".join(missing_skills) if missing_skills else "None"}
Provide your response using exactly these sections:
## Overall Assessment
Explain the candidate's overall suitability.
## Strong Matches
List the strongest matching skills.
## Skill Gaps
List the important missing skills.
## Recommended Actions
Give practical steps the candidate can take to improve
their chances for this role.
## Interview Focus
Suggest the most important technical areas the candidate
should prepare for this role.
ANSWER:
"""
    response = await generate_response(prompt)
    return response.strip()