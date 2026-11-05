import os
import uuid
from app.services.rag_service import get_all_resume_documents
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document.pdf_parser import extract_text_from_pdf
from app.services.document.text_cleaner import clean_text
from app.services.document.chunker import chunk_text
from app.services.embedding.embedding_service import generate_embeddings
from app.services.embedding.vector_store import add_documents
from fastapi import HTTPException
from pydantic import BaseModel
from app.services.job_analysis import extract_skills
from app.services.llm_service import generate_response
from app.services.embedding.vector_store import delete_resume
router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)
UPLOAD_DIR = "uploads"
@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing.",
        )
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}_{file.filename}",
    )
    file_content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    try:
        text = extract_text_from_pdf(file_path)
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF.",
            )
        cleaned_text = clean_text(text)
        chunks = chunk_text(cleaned_text)
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No usable text found in the resume.",
            )
        embeddings = generate_embeddings(chunks)
        document_ids = [
            f"{file_id}_chunk_{index}"
            for index in range(len(chunks))
        ]
        metadatas = [
            {
                "source": file.filename,
                "type": "resume",
                "file_id": file_id,
                "chunk_index": index,
            }
            for index in range(len(chunks))
        ]
        add_documents(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=document_ids,
        )
        return {
            "message": "Resume uploaded successfully.",
            "filename": file.filename,
            "file_id": file_id,
            "characters": len(cleaned_text),
            "chunks": len(chunks),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}",
        )




class ResumeAnalysisRequest(BaseModel):
    job_description: str


@router.post("/analyze")
async def analyze_resume(request: ResumeAnalysisRequest):
    try:
        job_description = request.job_description.strip()

        if not job_description:
            raise HTTPException(
                status_code=400,
                detail="Job description cannot be empty."
            )

        resume_documents = get_all_resume_documents()

        if not resume_documents:
            raise HTTPException(
                status_code=404,
                detail="Please upload your resume first."
            )

        # Combine extracted resume content
        resume_text = "\n".join(
            document["page_content"]
            for document in resume_documents
        )

        # Extract skills from resume and job description
        resume_skills = extract_skills(resume_text)
        required_skills = extract_skills(job_description)

        resume_skill_set = {
            skill.lower() for skill in resume_skills
        }

        required_skill_set = {
            skill.lower() for skill in required_skills
        }

        matched_skills = sorted(
            resume_skill_set.intersection(required_skill_set)
        )

        missing_skills = sorted(
            required_skill_set - resume_skill_set
        )

        # Calculate skill coverage
        if required_skill_set:
            skill_match_percentage = round(
                len(matched_skills) / len(required_skill_set) * 100,
                2
            )
        else:
            skill_match_percentage = 0

        # Generate personalized recommendations
        prompt = f"""
        You are an expert career mentor.

        Analyze the candidate's resume against the job description.

        RESUME SKILLS:
        {resume_skills}

        REQUIRED JOB SKILLS:
        {required_skills}

        MATCHED SKILLS:
        {matched_skills}

        MISSING SKILLS:
        {missing_skills}

        Provide:
        1. Three practical learning recommendations.
        2. Important topics to study.
        3. Suggested hands-on projects.
        4. A short career improvement plan.

        Keep the response practical and beginner-friendly.
        Do not claim the candidate has skills that are not listed.
        """

        recommendations = await generate_response(prompt)

        return {
            "resume_skills": resume_skills,
            "required_skills": required_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skill_match_percentage": skill_match_percentage,
            "recommendations": recommendations
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(error)}"
        )

@router.get("/status")
async def get_resume_status():
    try:
        resume_documents = get_all_resume_documents()

        if not resume_documents:
            return {
                "uploaded": False,
                "files": [],
                "total_chunks": 0
            }

        # Group chunks by uploaded file
        file_details = {}

        for document in resume_documents:
            metadata = document.get("metadata", {})

            file_id = metadata.get("file_id")

            if not file_id:
                continue

            if file_id not in file_details:
                file_details[file_id] = {
                    "file_id": file_id,
                    "filename": metadata.get("source", "Resume.pdf"),
                    "chunks": 0
                }

            file_details[file_id]["chunks"] += 1

        files = list(file_details.values())

        return {
            "uploaded": len(files) > 0,
            "files": files,
            "total_chunks": sum(
                item["chunks"] for item in files
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve resume status: {str(error)}"
        )


@router.delete("/{file_id}")
async def remove_resume(file_id: str):
    try:
        resume_documents = get_all_resume_documents()

        matching_resume = any(
            document.get("metadata", {}).get("file_id") == file_id
            for document in resume_documents
        )

        if not matching_resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found."
            )

        # Delete indexed resume chunks
        delete_resume(file_id)

        # Delete original PDF file
        deleted_files = []

        if os.path.isdir(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                if filename.startswith(f"{file_id}_"):
                    file_path = os.path.join(
                        UPLOAD_DIR,
                        filename
                    )

                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_files.append(filename)

        return {
            "message": "Resume and indexed data deleted successfully.",
            "file_id": file_id,
            "deleted_files": deleted_files
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume deletion failed: {str(error)}"
        )

