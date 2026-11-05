
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.chat import router as chat_router
from app.api.resume import router as resume_router
from app.api.search import router as search_router
from app.api.rag import router as rag_router
from app.api.jobs import router as jobs_router
from app.api.interview import router as interview_router
from app.api.evaluation import router as evaluation_router
from app.api.session import router as session_router
from app.api.applications import router as applications_router
from app.api.resume_improvement import router as resume_improvement_router
from app.api.career_recommendations import router as career_router
from app.services.interview_session import cleanup_old_sessions
from app.api.job_application_assistant import (
    router as job_application_assistant_router,
)
from app.api.follow_up_assistant import router as follow_up_router

app = FastAPI(
    title="CareerCopilot API",
    description="Local GenAI Career Assistant",
    version="1.0.0",
)
logger = logging.getLogger("careercopilot")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    errors = []

    for error in exc.errors():
        field = ".".join(str(item) for item in error["loc"])

        errors.append({
            "field": field,
            "message": error["msg"],
        })

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Please check the submitted information.",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled API error on %s",
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected server error occurred. Please try again.",
        },
    )


@app.on_event("startup")
async def startup_tasks():
    deleted_count = cleanup_old_sessions(days=30)

    print(
        f"Interview cleanup completed. "
        f"Deleted {deleted_count} old sessions."
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chat_router)
app.include_router(resume_router)
app.include_router(search_router)
app.include_router(rag_router)
app.include_router(jobs_router)
app.include_router(interview_router)
app.include_router(evaluation_router)
app.include_router(session_router)
app.include_router(resume_improvement_router)
app.include_router(applications_router)
app.include_router(career_router)
app.include_router(job_application_assistant_router)
app.include_router(follow_up_router)

@app.get("/")
async def root():
    return {
        "message": "CareerCopilot API is running",
        "status": "success",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
