
import chromadb

CHROMA_PATH = "./chroma_db"

client = chromadb.PersistentClient(
    path=CHROMA_PATH
)

collection = client.get_or_create_collection(
    name="career_documents"
)


def add_documents(
    documents: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict],
    ids: list[str],
):
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )


def search_documents(
    query_embedding: list[float],
    top_k: int = 5,
):
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    return results


def get_all_resume_documents():
    results = collection.get(
        where={
            "type": "resume"
        },
        include=["documents", "metadatas"]
    )

    documents = results.get("documents") or []
    metadatas = results.get("metadatas") or []

    return [
        {
            "page_content": document,
            "metadata": metadata or {}
        }
        for document, metadata in zip(documents, metadatas)
    ]

def delete_resume(file_id: str):
    collection.delete(
        where={
            "$and": [
                {"file_id": file_id},
                {"type": "resume"}
            ]
        }
    )

    return {
        "message": "Resume deleted successfully.",
        "file_id": file_id
    }
