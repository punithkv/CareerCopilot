from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embedding.embedding_service import generate_embeddings
from app.services.embedding.vector_store import search_documents
router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)
class SearchRequest(BaseModel):
    query: str
    top_k: int = 3
@router.post("")
async def search_resume(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty.",
        )
    query_embedding = generate_embeddings(
        [request.query]
    )[0]
    results = search_documents(
        query_embedding=query_embedding,
        top_k=request.top_k,
    )
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    matches = []
    for document, metadata, distance in zip(
        documents,
        metadatas,
        distances,
    ):
        matches.append(
            {
                "text": document,
                "metadata": metadata,
                "distance": distance,
            }
        )
    return {
        "query": request.query,
        "results": matches,
    }