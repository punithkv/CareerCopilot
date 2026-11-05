from app.services.embedding.embedding_service import generate_embeddings
texts = [
    "Python is a programming language.",
    "Machine learning is a branch of artificial intelligence.",
]
embeddings = generate_embeddings(texts)
print("Number of embeddings:", len(embeddings))
print("Embedding dimension:", len(embeddings[0]))