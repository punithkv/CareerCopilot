from app.services.embedding.vector_store import (
    get_all_resume_documents
)
from app.services.embedding.embedding_service import generate_embeddings
from app.services.embedding.vector_store import search_documents
from app.services.llm_service import generate_response
def build_context(results) -> str:
    documents = results.get("documents", [[]])[0]
    if not documents:
        return ""
    context_parts = []
    for index, document in enumerate(documents, start=1):
        context_parts.append(
            f"[Resume Context {index}]\n{document}"
        )
    return "\n\n".join(context_parts)
async def answer_from_resume(
    question: str,
    top_k: int = 5,
) -> dict:
    query_embedding = generate_embeddings(
        [question]
    )[0]
    results = search_documents(
        query_embedding=query_embedding,
        top_k=top_k,
    )
    context = build_context(results)
    if not context:
        return {
            "answer": (
                "I don't have enough information in "
                "the uploaded resume to answer that question."
            ),
            "sources": [],
        }
    prompt = f"""
You are CareerCopilot, a private AI career assistant.
Your task is to answer the user's question using ONLY
the information contained in the provided resume context.
STRICT RULES:
1. Do not invent facts.
2. Do not assume information that is not present.
3. Do not use outside knowledge about the candidate.
4. If the answer is not supported by the context, say:
   "I don't have enough information in the uploaded resume to answer that question."
5. Keep the answer professional and concise.
6. When possible, organize information using bullet points.
7. Never claim the candidate has a skill, project, certification,
   degree, or experience unless it appears in the context.
RESUME CONTEXT:
{context}
USER QUESTION:
{question}
ANSWER:
"""
    answer = await generate_response(prompt)
    metadatas = results.get("metadatas", [[]])[0]
    sources = []
    for metadata in metadatas:
        sources.append(metadata)
    return {
        "answer": answer.strip(),
        "sources": sources,
    }