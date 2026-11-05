
import sqlite3
from pathlib import Path
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl


router = APIRouter(prefix="/api/applications", tags=["Job Applications"])

# Database is stored inside the backend folder.
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "applications.db"

VALID_STATUSES = {
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected",
}


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Applied',
                salary TEXT DEFAULT '',
                application_date TEXT NOT NULL,
                job_link TEXT DEFAULT '',
                follow_up_date TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


initialize_database()


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=150)
    role: str = Field(min_length=1, max_length=150)
    status: str = "Applied"
    salary: str = ""
    application_date: date
    job_link: str = ""
    follow_up_date: Optional[date] = None
    notes: str = ""


class ApplicationUpdate(BaseModel):
    company: Optional[str] = Field(default=None, min_length=1, max_length=150)
    role: Optional[str] = Field(default=None, min_length=1, max_length=150)
    status: Optional[str] = None
    salary: Optional[str] = None
    application_date: Optional[date] = None
    job_link: Optional[str] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


def serialize_application(row):
    item = dict(row)
    item["overdue"] = bool(
        item.get("follow_up_date")
        and item["follow_up_date"] < date.today().isoformat()
        and item["status"] not in {"Offer", "Rejected"}
    )
    return item


@router.get("/")
def get_applications(status: Optional[str] = None, search: Optional[str] = None):
    query = "SELECT * FROM applications"
    conditions = []
    values = []

    if status and status != "All":
        conditions.append("status = ?")
        values.append(status)

    if search:
        conditions.append("(company LIKE ? OR role LIKE ?)")
        values.extend([f"%{search}%", f"%{search}%"])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY application_date DESC, id DESC"

    with get_connection() as connection:
        rows = connection.execute(query, values).fetchall()

    return {
        "applications": [serialize_application(row) for row in rows],
        "total": len(rows),
    }


@router.get("/stats")
def get_application_stats():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT status, COUNT(*) AS count FROM applications GROUP BY status"
        ).fetchall()

        total = connection.execute(
            "SELECT COUNT(*) FROM applications"
        ).fetchone()[0]

        overdue = connection.execute(
            """
            SELECT COUNT(*) FROM applications
            WHERE follow_up_date != ''
            AND follow_up_date < ?
            AND status NOT IN ('Offer', 'Rejected')
            """,
            (date.today().isoformat(),),
        ).fetchone()[0]

    counts = {status: 0 for status in VALID_STATUSES}
    for row in rows:
        counts[row["status"]] = row["count"]

    decided = counts["Offer"] + counts["Rejected"]
    conversion_rate = (
        round((counts["Offer"] / decided) * 100, 1)
        if decided
        else 0
    )

    return {
        "total": total,
        "applied": counts["Applied"],
        "assessment": counts["Assessment"],
        "interview": counts["Interview"],
        "offers": counts["Offer"],
        "rejected": counts["Rejected"],
        "overdue_followups": overdue,
        "conversion_rate": conversion_rate,
    }


@router.post("/", status_code=201)
def create_application(application: ApplicationCreate):
    data = application.model_dump()

    if data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid application status.")

    company = data["company"].strip()
    role = data["role"].strip()

    if not company or not role:
        raise HTTPException(
            status_code=400,
            detail="Company and job role are required.",
        )

    job_link = (data.get("job_link") or "").strip()
    if job_link and not job_link.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Job link must start with http:// or https://.",
        )

    now = datetime.now().isoformat(timespec="seconds")

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO applications (
                company, role, status, salary, application_date,
                job_link, follow_up_date, notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                company,
                role,
                data["status"],
                data.get("salary") or "",
                data["application_date"].isoformat(),
                job_link,
                data["follow_up_date"].isoformat()
                if data.get("follow_up_date") else "",
                data.get("notes") or "",
                now,
                now,
            ),
        )
        application_id = cursor.lastrowid
        connection.commit()

        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?",
            (application_id,),
        ).fetchone()

    return serialize_application(row)


@router.patch("/{application_id}")
def update_application(application_id: int, updates: ApplicationUpdate):
    data = updates.model_dump(exclude_unset=True)

    if not data:
        raise HTTPException(status_code=400, detail="No update fields provided.")

    if "status" in data and data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid application status.")

    for field in ("company", "role"):
        if field in data and not data[field].strip():
            raise HTTPException(status_code=400, detail=f"{field} cannot be empty.")

    if "job_link" in data:
        link = (data["job_link"] or "").strip()
        if link and not link.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=400,
                detail="Job link must start with http:// or https://.",
            )
        data["job_link"] = link

    for field in ("application_date", "follow_up_date"):
        if field in data:
            data[field] = data[field].isoformat() if data[field] else ""

    for field in ("salary", "notes"):
        if field in data and data[field] is None:
            data[field] = ""

    data["updated_at"] = datetime.now().isoformat(timespec="seconds")

    assignments = ", ".join(f"{field} = ?" for field in data)
    values = list(data.values()) + [application_id]

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM applications WHERE id = ?",
            (application_id,),
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Application not found.")

        connection.execute(
            f"UPDATE applications SET {assignments} WHERE id = ?",
            values,
        )
        connection.commit()

        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?",
            (application_id,),
        ).fetchone()

    return serialize_application(row)


@router.delete("/{application_id}")
def delete_application(application_id: int):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM applications WHERE id = ?",
            (application_id,),
        )
        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Application not found.")

    return {"message": "Application deleted successfully."}
