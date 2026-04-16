import chromadb
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction
from typing import Any

_OLLAMA_URL = "http://localhost:11434"
_EMBED_MODEL = "nomic-embed-text"

_client = chromadb.PersistentClient(path="./chroma_db")
_embed_fn = OllamaEmbeddingFunction(url=_OLLAMA_URL, model_name=_EMBED_MODEL)


def _collection_name(file_id: str) -> str:
    return f"file_{file_id}"


def ingest(file_id: str, chunks: list[dict]) -> None:
    """Store text chunks for a file. Each chunk: {text, chunk_index, ...metadata}"""
    if not chunks:
        return

    collection = _client.get_or_create_collection(
        name=_collection_name(file_id),
        embedding_function=_embed_fn,
    )

    ids = [f"{file_id}_{c['chunk_index']}" for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas: list[dict[str, Any]] = [
        {k: v for k, v in c.items() if k != "text"} for c in chunks
    ]

    collection.add(ids=ids, documents=documents, metadatas=metadatas)


def query(file_id: str, text: str, n: int = 5) -> list[dict]:
    """Semantic search within a file's collection. Returns list of result dicts."""
    try:
        collection = _client.get_collection(
            name=_collection_name(file_id),
            embedding_function=_embed_fn,
        )
    except Exception:
        return []

    results = collection.query(query_texts=[text], n_results=n)
    output = []
    for i, doc in enumerate(results["documents"][0]):
        output.append({
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return output


def delete_collection(file_id: str) -> None:
    """Remove all vectors for a file."""
    try:
        _client.delete_collection(name=_collection_name(file_id))
    except Exception:
        pass
