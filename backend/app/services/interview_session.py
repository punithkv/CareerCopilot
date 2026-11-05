
import uuid
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "interview_sessions.db"


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

@contextmanager
def get_db_connection():
    connection = sqlite3.connect(DB_PATH)

    try:
        yield connection
        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# --------------------------------------------------
# CREATE DATABASE TABLE
# --------------------------------------------------

def initialize_database():

    with get_db_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                session_id TEXT PRIMARY KEY,
                session_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)


# Initialize database when this module loads.
initialize_database()


# --------------------------------------------------
# CREATE INTERVIEW SESSION
# --------------------------------------------------

def create_session(
    job_description: str,
    questions: list,
    candidate_name: str = "Candidate",
    candidate_email: str = "",
    target_job_role: str = "",
    resume_filename: str = "",
) -> dict:

    session_id = str(uuid.uuid4())

    current_time = datetime.now().isoformat()

    session = {
        "session_id": session_id,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "target_job_role": target_job_role,
        "resume_filename": resume_filename,
        "job_description": job_description,
        "questions": questions,
        "current_question": 0,
"answers": [],
"evaluations": [],
"created_at": current_time,

# Pause and resume information
"status": "in_progress",
"elapsed_seconds": 0,
"paused_at": None,
}

    session_json = json.dumps(session)

    with get_db_connection() as connection:

        connection.execute(
            """
            INSERT INTO interview_sessions (
                session_id,
                session_data,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                session_id,
                session_json,
                current_time,
                current_time,
            ),
        )

    return session


# --------------------------------------------------
# GET INTERVIEW SESSION
# --------------------------------------------------

def get_session(
    session_id: str,
) -> dict | None:

    with get_db_connection() as connection:

        cursor = connection.execute(
            """
            SELECT session_data
            FROM interview_sessions
            WHERE session_id = ?
            """,
            (session_id,),
        )

        row = cursor.fetchone()

    if row is None:
        return None

    return json.loads(row[0])


# --------------------------------------------------
# UPDATE INTERVIEW SESSION
# --------------------------------------------------

def update_session(session: dict) -> None:

    session_id = session["session_id"]

    session_json = json.dumps(session)

    updated_at = datetime.now().isoformat()

    with get_db_connection() as connection:

        connection.execute(
            """
            UPDATE interview_sessions
            SET session_data = ?,
                updated_at = ?
            WHERE session_id = ?
            """,
            (
                session_json,
                updated_at,
                session_id,
            ),
        )


# --------------------------------------------------
# SAVE ANSWER AND EVALUATION
# --------------------------------------------------


def save_answer(
    session_id: str,
    question: str,
    answer: str,
    evaluation: dict,
) -> dict | None:

    session = get_session(session_id)

    if not session:
        return None

    # Save the submitted answer
    session["answers"].append({
        "question": question,
        "answer": answer,
    })

    # Save the evaluation
    session["evaluations"].append(evaluation)

    # Move to the next question
    session["current_question"] += 1

    # Check whether all questions are completed
    total_questions = len(session.get("questions", []))

    if session["current_question"] >= total_questions:
        session["status"] = "completed"
        session["completed"] = True
        session["paused_at"] = None
    else:
        session["status"] = "in_progress"
        session["completed"] = False

    # Save updated session
    update_session(session)

    return session



# --------------------------------------------------
# CALCULATE FINAL REPORT
# --------------------------------------------------

def calculate_final_report(
    session_id: str,
) -> dict | None:

    session = get_session(session_id)

    if not session:
        return None

    evaluations = session["evaluations"]

    answers = session["answers"]

    # Handle sessions without evaluated answers.

    if not evaluations:

        return {
            "session_id": session_id,
            "candidate_name": session.get("candidate_name", "Candidate"),
            "candidate_email": session.get("candidate_email", ""),
            "target_job_role": session.get("target_job_role", ""),
            "resume_filename": session.get("resume_filename", ""),
            "total_questions": 0,
            "overall_score": 0,
            "average_score": 0,
            "average_correctness": 0,
            "average_technical_depth": 0,
            "average_clarity": 0,
            "average_relevance": 0,
            "average_completeness": 0,
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "questions": [],
            "evaluations": [],
            "summary": (
                "No answers have been evaluated yet."
            ),
        }

    # Calculate average scores.

    def average_score(field: str) -> float:
        values = [
            float(evaluation.get(field, 0) or 0)
            for evaluation in evaluations
            ]
        average = sum(values) / len(values)
        return round(average * 10, 2)
    def normalize_items(value):

        if isinstance(value, list):
            return [
                str(item)
                for item in value
                if str(item).strip()
            ]

        if isinstance(value, str) and value.strip():
            return [value.strip()]

        return []

    strengths = []
    weaknesses = []
    recommendations = []

    question_results = []

    # Process each evaluated question.

    for index, evaluation in enumerate(evaluations):

        answer_data = (
            answers[index]
            if index < len(answers)
            else {}
        )

        question_results.append({

            "question": answer_data.get(
                "question",
                f"Question {index + 1}",
            ),

            "answer": answer_data.get(
                "answer",
                "",
            ),

            "overall_score": evaluation.get(
                "overall_score",
                0,
            ),

            "correctness": evaluation.get(
                "correctness",
                0,
            ),

            "technical_depth": evaluation.get(
                "technical_depth",
                0,
            ),

            "clarity": evaluation.get(
                "clarity",
                0,
            ),

            "relevance": evaluation.get(
                "relevance",
                0,
            ),

            "completeness": evaluation.get(
                "completeness",
                0,
            ),

            "feedback": evaluation.get(
                "feedback",
                "No feedback available.",
            ),

            "evaluation": evaluation,
        })

        strengths.extend(
            normalize_items(
                evaluation.get("strengths", [])
            )
        )

        weaknesses.extend(
            normalize_items(
                evaluation.get("improvements", [])
            )
        )

        recommendations.extend(
            normalize_items(
                evaluation.get("missing_points", [])
            )
        )

    # Remove duplicate feedback items.

    strengths = list(dict.fromkeys(strengths))

    weaknesses = list(dict.fromkeys(weaknesses))

    recommendations = list(
        dict.fromkeys(recommendations)
    )

    overall = average_score("overall_score")

    # Build final report.

    report = {
    "session_id": session_id,
    "candidate_name": session.get("candidate_name", "Candidate"),
    "candidate_email": session.get("candidate_email", ""),
    "target_job_role": session.get("target_job_role", ""),
    "resume_filename": session.get("resume_filename", ""),

    # Interview details
    "created_at": session.get("created_at"),
    "job_description": session.get("job_description", ""),

    "total_questions": len(evaluations),

        "overall_score": overall,

        "average_score": overall,

        "average_correctness": average_score(
            "correctness"
        ),

        "average_technical_depth": average_score(
            "technical_depth"
        ),

        "average_clarity": average_score(
            "clarity"
        ),

        "average_relevance": average_score(
            "relevance"
        ),

        "average_completeness": average_score(
            "completeness"
        ),

        "strengths": strengths,

        "weaknesses": weaknesses,

        "recommendations": recommendations,

        "questions": question_results,

        "evaluations": evaluations,

        "summary": (
            f"You completed {len(evaluations)} "
            f"interview questions with an average "
            f"score of {overall}/100."
        ),
    }

    return report


def get_all_sessions() -> list:
    """Retrieve all saved interview sessions, newest first."""

    with get_db_connection() as connection:

        cursor = connection.execute(
            """
            SELECT session_data
            FROM interview_sessions
            ORDER BY created_at DESC
            """
        )

        rows = cursor.fetchall()

    sessions = []

    for row in rows:

        session = json.loads(row[0])

        # Backward compatibility for older sessions
        if "status" not in session:

            if session.get("completed", False):
                session["status"] = "completed"
            else:
                session["status"] = "in_progress"

        if "completed" not in session:
            session["completed"] = (
                session["status"] == "completed"
            )

        if "elapsed_seconds" not in session:
            session["elapsed_seconds"] = 0

        if "paused_at" not in session:
            session["paused_at"] = None

        sessions.append(session)

    return sessions



def delete_session(session_id: str) -> bool:
    """Delete an interview session from the database."""

    with get_db_connection() as connection:

        cursor = connection.execute(
            """
            DELETE FROM interview_sessions
            WHERE session_id = ?
            """,
            (session_id,),
        )

        deleted = cursor.rowcount > 0

    return deleted

def cleanup_old_sessions(days: int = 30) -> int:
    """Delete unfinished sessions inactive for the given number of days."""

    from datetime import timedelta

    cutoff = datetime.now() - timedelta(days=days)
    deleted_count = 0

    with get_db_connection() as connection:
        cursor = connection.execute(
            """
            SELECT session_id, session_data, updated_at
            FROM interview_sessions
            """
        )

        rows = cursor.fetchall()

        for session_id, session_data, updated_at in rows:
            session = json.loads(session_data)

            if session.get("status") == "completed":
                continue

            last_updated = datetime.fromisoformat(updated_at)

            if last_updated < cutoff:
                connection.execute(
                    """
                    DELETE FROM interview_sessions
                    WHERE session_id = ?
                    """,
                    (session_id,)
                )
                deleted_count += 1

    return deleted_count
# --------------------------------------------------
# PAUSE INTERVIEW SESSION
# --------------------------------------------------

def pause_session(
    session_id: str,
    elapsed_seconds: int,
) -> dict | None:

    session = get_session(session_id)

    if not session:
        return None

    if session.get("status") == "completed":
        return session

    session["status"] = "paused"
    session["elapsed_seconds"] = max(0, elapsed_seconds)
    session["paused_at"] = datetime.now().isoformat()

    update_session(session)

    return session


# --------------------------------------------------
# RESUME INTERVIEW SESSION
# --------------------------------------------------

def resume_session(
    session_id: str,
) -> dict | None:

    session = get_session(session_id)

    if not session:
        return None

    if session.get("status") == "completed":
        return session

    session["status"] = "in_progress"
    session["paused_at"] = None

    update_session(session)

    return session
# --------------------------------------------------
# UPDATE INTERVIEW TIMER
# --------------------------------------------------

def update_elapsed_time(
    session_id: str,
    elapsed_seconds: int,
) -> dict | None:

    session = get_session(session_id)

    if not session:
        return None

    if session.get("status") == "completed":
        return session

    session["elapsed_seconds"] = max(0, int(elapsed_seconds))

    update_session(session)

    return session