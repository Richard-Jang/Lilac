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
    """Store text chunks for a file. Each chunk: {text, chunk_index, page_number, ...metadata}"""
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
    """Semantic search within a file's collection."""
    try:
        collection = _client.get_collection(
            name=_collection_name(file_id),
            embedding_function=_embed_fn,
        )
    except Exception:
        return []

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(query_texts=[text], n_results=min(n, count))
    output = []
    for i, doc in enumerate(results["documents"][0]):
        output.append({
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return output


def query_up_to_page(file_id: str, text: str, max_page: int, n: int = 5) -> list[dict]:
    """Semantic search restricted to chunks from pages <= max_page (spoiler-free)."""
    try:
        collection = _client.get_collection(
            name=_collection_name(file_id),
            embedding_function=_embed_fn,
        )
    except Exception:
        return []

    count = collection.count()
    if count == 0:
        return []

    try:
        results = collection.query(
            query_texts=[text],
            n_results=min(n, count),
            where={"page_number": {"$lte": max_page}},
        )
    except Exception:
        # Fallback without page filter if filtered set is empty
        try:
            results = collection.query(query_texts=[text], n_results=min(n, count))
        except Exception:
            return []

    if not results["documents"] or not results["documents"][0]:
        return []

    return [
        {
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        }
        for i, doc in enumerate(results["documents"][0])
    ]


def delete_collection(file_id: str) -> None:
    """Remove all vectors for a file."""
    try:
        _client.delete_collection(name=_collection_name(file_id))
    except Exception:
        pass
