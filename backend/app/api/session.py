from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.embedding.vector_store import (
    get_all_resume_documents,
)
from app.services.interview_generator import (
    generate_interview_questions,
)
from app.services.interview_evaluator import (
    evaluate_interview_answer,
)
from app.services.interview_session import (
    # Keep your existing imports
    update_elapsed_time,
)
from app.services.interview_session import (
    create_session,
    get_session,
    save_answer,
    calculate_final_report,
    get_all_sessions,
    delete_session,
    pause_session,
    resume_session,
)
router = APIRouter(
    prefix="/api/session",
    tags=["Interview Session"],
)
class StartSessionRequest(BaseModel):
    job_description: str
    candidate_name: str
    candidate_email: str = ""
    target_job_role: str = ""
    resume_filename: str = ""
    difficulty: str = "mixed"
    count: int = Field(default=5, ge=1, le=20)
class SubmitAnswerRequest(BaseModel):
    question: str
    answer: str
@router.post("/start")
async def start_session(
    request: StartSessionRequest,
):
    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )
    if not request.candidate_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Candidate name cannot be empty.",
            )
    if request.difficulty not in [
        "easy",
        "medium",
        "hard",
        "mixed",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "difficulty must be "
                "easy, medium, hard, or mixed."
            ),
        )
    resume_documents = get_all_resume_documents()
    if not resume_documents:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume found. "
                "Please upload a resume first."
            ),
        )
    resume_text = "\n".join(
    document["page_content"]
    for document in resume_documents
    if document.get("page_content")
)
    try:
        questions = await generate_interview_questions(
            resume_text=resume_text,
            job_description=request.job_description,
            difficulty=request.difficulty,
            count=request.count,
        )
        session = create_session(
            job_description=request.job_description,
            questions=questions,
            candidate_name=request.candidate_name.strip(),
            candidate_email=request.candidate_email.strip(),
            target_job_role=request.target_job_role.strip(),
            resume_filename=request.resume_filename.strip(),
            )
        return {
            "session_id": session["session_id"],
            "total_questions": len(questions),
            "current_question": questions[0]
            if questions
            else None,
            "questions": questions,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not start interview: {str(e)}",
        )



@router.get("/history")
async def get_interview_history():
    sessions = get_all_sessions()
    history = []

    for session in sessions:
        total_questions = len(
            session.get("questions", [])
        )

        answered_questions = len(
            session.get("evaluations", [])
        )

        is_completed = (
            session.get("status") == "completed"
            or (
                answered_questions >= total_questions
                and total_questions > 0
            )
        )

        if is_completed:
            status = "completed"
        elif session.get("status") == "paused":
            status = "paused"
        else:
            status = "in_progress"

        report = None

        if is_completed:
            report = calculate_final_report(
                session["session_id"]
            )

        history.append({
            "session_id": session["session_id"],
            "job_description": session.get(
                "job_description", ""
            ),
            "created_at": session.get("created_at"),
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "current_question": session.get(
                "current_question", 0
            ),
            "completed": is_completed,
            "status": status,
            "elapsed_seconds": session.get(
                "elapsed_seconds", 0
            ),
            "paused_at": session.get("paused_at"),
            "overall_score": (
                report["overall_score"]
                if report else 0
            ),
        })

    return {
        "total_sessions": len(history),
        "sessions": history,
    }

@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )
    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty.",
        )
    try:
        evaluation = await evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            job_description=session[
                "job_description"
            ],
        )
        updated_session = save_answer(
            session_id=session_id,
            question=request.question,
            answer=request.answer,
            evaluation=evaluation,
        )
        next_question = None
        current_index = updated_session[
            "current_question"
        ]
        questions = updated_session[
            "questions"
        ]
        if current_index < len(questions):
            next_question = questions[
                current_index
            ]
        return {
            "session_id": session_id,
            "evaluation": evaluation,
            "next_question": next_question,
            "completed": (
                next_question is None
            ),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Answer evaluation failed: {str(e)}",
        )
@router.get("/{session_id}")
async def get_interview_session(
    session_id: str,
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )
    return session
@router.get("/{session_id}/report")
async def get_final_report(
    session_id: str,
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )
    report = calculate_final_report(
        session_id
    )
    return report



@router.delete("/{session_id}")
async def delete_interview_session(
    session_id: str,
):

    deleted = delete_session(session_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    return {
        "message": "Interview session deleted successfully.",
        "session_id": session_id,
    }
# --------------------------------------------------
# PAUSE INTERVIEW
# --------------------------------------------------

class PauseSessionRequest(BaseModel):
    elapsed_seconds: int = Field(default=0, ge=0)


@router.post("/{session_id}/pause")
async def pause_interview(
    session_id: str,
    request: PauseSessionRequest,
):
    session = get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    updated_session = pause_session(
        session_id=session_id,
        elapsed_seconds=request.elapsed_seconds,
    )

    return {
        "message": "Interview paused successfully.",
        "session_id": session_id,
        "status": updated_session["status"],
        "elapsed_seconds": updated_session["elapsed_seconds"],
    }


# --------------------------------------------------
# RESUME INTERVIEW
# --------------------------------------------------

@router.post("/{session_id}/resume")
async def resume_interview(
    session_id: str,
):
    session = get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    updated_session = resume_session(session_id)

    return {
        "message": "Interview resumed successfully.",
        "session_id": session_id,
        "status": updated_session["status"],
        "elapsed_seconds": updated_session["elapsed_seconds"],
    }
# --------------------------------------------------
# UPDATE INTERVIEW TIMER
# --------------------------------------------------

class UpdateTimerRequest(BaseModel):
    elapsed_seconds: int = Field(default=0, ge=0)


@router.post("/{session_id}/timer")
async def update_interview_timer(
    session_id: str,
    request: UpdateTimerRequest,
):
    session = get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    updated_session = update_elapsed_time(
        session_id=session_id,
        elapsed_seconds=request.elapsed_seconds,
    )

    return {
        "message": "Interview timer updated successfully.",
        "session_id": session_id,
        "elapsed_seconds": updated_session["elapsed_seconds"],
        "status": updated_session["status"],
    }