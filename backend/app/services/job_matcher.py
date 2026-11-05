import re
from app.services.embedding.vector_store import (
    get_all_resume_documents,
)
from app.services.embedding.embedding_service import generate_embeddings
from app.services.embedding.vector_store import search_documents
COMMON_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "c++",
    "sql",
    "html",
    "css",
    "react",
    "react.js",
    "node.js",
    "node",
    "django",
    "flask",
    "fastapi",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "machine learning",
    "deep learning",
    "natural language processing",
    "nlp",
    "computer vision",
    "opencv",
    "pandas",
    "numpy",
    "matplotlib",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "rest api",
    "rest apis",
    "mongodb",
    "mysql",
    "postgresql",
    "sqlite",
    "chroma",
    "chromadb",
    "langchain",
    "llm",
    "generative ai",
    "rag",
]
def normalize_text(text: str) -> str:
    return text.lower().strip()
def extract_skills(text: str) -> list[str]:
    normalized = normalize_text(text)
    found_skills = []
    for skill in COMMON_SKILLS:
        if skill.lower() in normalized:
            found_skills.append(skill)
    return sorted(set(found_skills))
def calculate_skill_match(
    resume_skills: list[str],
    job_skills: list[str],
) -> dict:
    resume_set = set(
        normalize_text(skill)
        for skill in resume_skills
    )
    job_set = set(
        normalize_text(skill)
        for skill in job_skills
    )
    matched = sorted(resume_set.intersection(job_set))
    missing = sorted(job_set - resume_set)
    if job_set:
        score = (
            len(matched) / len(job_set)
        ) * 100
    else:
        score = 0
    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "skill_match_score": round(score, 2),
    }
def calculate_semantic_score(
    job_description: str,
) -> float:
    job_embedding = generate_embeddings(
        [job_description]
    )[0]
    results = search_documents(
        query_embedding=job_embedding,
        top_k=5,
    )
    distances = results.get(
        "distances",
        [[]],
    )[0]
    if not distances:
        return 0.0
    average_distance = sum(distances) / len(distances)
    similarity = max(
        0.0,
        1.0 - average_distance,
    )
    return round(similarity * 100, 2)
def analyze_job_match(
    resume_text: str,
    job_description: str,
) -> dict:
    resume_skills = extract_skills(
        resume_text
    )
    job_skills = extract_skills(
        job_description
    )
    skill_result = calculate_skill_match(
        resume_skills=resume_skills,
        job_skills=job_skills,
    )
    semantic_score = calculate_semantic_score(
        job_description
    )
    overall_score = (
        skill_result["skill_match_score"] * 0.6
        + semantic_score * 0.4
    )
    return {
        "overall_match_score": round(
            overall_score,
            2,
        ),
        "semantic_score": semantic_score,
        "skill_match_score": skill_result[
            "skill_match_score"
        ],
        "matched_skills": skill_result[
            "matched_skills"
        ],
        "missing_skills": skill_result[
            "missing_skills"
        ],
        "resume_skills": resume_skills,
        "job_skills": job_skills,
    }