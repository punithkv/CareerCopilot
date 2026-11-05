from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.llm_service import generate_response
router = APIRouter(
    prefix="/api/chat", 
    tags=["AI Chat"],
    )
class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )
@router.post("")
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )
    try:
        response = await generate_response(request.message)
        return {
            "response": response,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM error: {str(e)}",
        )