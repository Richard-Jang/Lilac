import fitz  # PyMuPDF

_CHUNK_SIZE = 2000   # characters (~500 tokens)
_CHUNK_OVERLAP = 200


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def parse(path: str) -> tuple[str, str, list[dict]]:
    """
    Parse a PDF file and return (title, author, chunks).
    Each chunk: {text, page, chunk_index}
    """
    doc = fitz.open(path)

    meta = doc.metadata or {}
    title: str = meta.get("title", "")
    author: str = meta.get("author", "")

    chunks: list[dict] = []
    chunk_index = 0

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if not text.strip():
            continue

        for segment in _chunk_text(text, _CHUNK_SIZE, _CHUNK_OVERLAP):
            segment = segment.strip()
            if not segment:
                continue
            chunks.append({
                "text": segment,
                "page": page_num,
                "chunk_index": chunk_index,
            })
            chunk_index += 1

    doc.close()
    return title, author, chunks
